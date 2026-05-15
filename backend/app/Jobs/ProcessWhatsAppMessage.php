<?php

namespace App\Jobs;

use App\Models\Booking;
use App\Models\ChatHistory;
use App\Models\Customer;
use App\Models\Discount;
use App\Models\Faq;
use App\Models\Kiosk;
use App\Models\Package;
use App\Models\Setting;
use App\Services\AIService;
use App\Services\DistanceService;
use App\Services\InvoiceService;
use App\Services\WhatsAppService;
use Illuminate\Bus\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class ProcessWhatsAppMessage
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 1;  // No retry — avoid sending duplicate messages
    public int $timeout = 90;

    private const HANDOFF_KEYWORDS = [
        'minta admin', 'ke admin', 'admin dong', 'admin aja', 'mau admin',
        'hubungi admin', 'kontak admin', 'sama adminnya', 'dengan admin',
        'bicara orang', 'orang beneran', 'manusia aja', 'cs nya', 'cs langsung',
        'customer service', 'tolong admin', 'admin tolong',
    ];

    public function __construct(
        private readonly array $payload,
        private readonly ?int  $kioskId,
    ) {}

    public function handle(AIService $ai, WhatsAppService $wa, InvoiceService $invoiceService): void
    {
        $msg         = $this->payload['messages'][0];
        $waId        = $msg['from'];
        $messageType = $msg['type'] ?? 'unknown';

        $kiosk     = $this->kioskId ? Kiosk::find($this->kioskId) : null;
        $waService = $kiosk ? WhatsAppService::forKiosk($kiosk) : $wa;

        try {
            $customer = Customer::firstOrCreate(
                ['whatsapp_id' => $waId],
                [
                    'nama'       => $this->payload['contacts'][0]['profile']['name'] ?? null,
                    'ab_variant' => rand(0, 1) ? 'A' : 'B',
                ],
            );

            if (in_array($customer->status, ['new', 'no_reply_yet'])) {
                $customer->update(['status' => 'interested']);
            }

            if ($messageType === 'image') {
                $this->handleImageMessage($msg, $customer, $waId, $waService, $kiosk, $ai, $invoiceService);
                return;
            }

            if ($messageType !== 'text') return;

            $userText = $msg['text']['body'];

            ChatHistory::create([
                'customer_id' => $customer->id,
                'role'        => 'user',
                'content'     => $userText,
            ]);

            // 'test' mode = AI only responds in sandbox, not real WA
            if ($kiosk && ($kiosk->ai_mode ?? 'active') !== 'active') return;
            if ($customer->ai_paused) return;

            // Detect request for human agent
            $lowerText = mb_strtolower($userText);
            foreach (self::HANDOFF_KEYWORDS as $kw) {
                if (str_contains($lowerText, $kw)) {
                    $handoffMsg = 'Oke kak, aku sampaikan ke tim kami ya! Sebentar lagi ada yang hubungi kak 😊';
                    $waService->sendText($waId, $handoffMsg);
                    ChatHistory::create(['customer_id' => $customer->id, 'role' => 'assistant', 'content' => $handoffMsg]);
                    $customer->update(['ai_paused' => true, 'handoff_requested' => true]);
                    return;
                }
            }

            // Load context data
            $history = $customer->chatHistories()
                ->latest()->take(50)->get()->reverse()->values()->toArray();

            $packages = Package::where('aktif', true)
                ->where(function ($q) use ($kiosk) {
                    $q->whereNull('kiosk_id');
                    if ($kiosk) $q->orWhere('kiosk_id', $kiosk->id);
                })->get()->toArray();

            $faqs = Faq::where('aktif', true)->orderBy('urutan')->limit(30)->get()->toArray();

            $discounts = Discount::where('aktif', true)
                ->where('berlaku_sampai', '>=', now()->toDateString())
                ->get()->map(fn($d) => [
                    'nama'           => $d->nama,
                    'label'          => $d->label,
                    'berlaku_sampai' => $d->berlaku_sampai->format('d M Y'),
                ])->toArray();

            // Booked slots with date + time (so AI knows partial-day availability)
            $bookedSlots = Booking::whereNotIn('status', ['cancelled'])
                ->get(['tanggal', 'jam_mulai'])
                ->map(fn($b) => $b->tanggal->format('Y-m-d') . ($b->jam_mulai ? ' jam ' . $b->jam_mulai : ''))
                ->unique()->values()->toArray();

            $result   = $ai->getReply(
                $userText, $history, $packages, $faqs, $bookedSlots, $discounts,
                $kiosk, $customer->ai_context ?? [], $customer->ab_variant ?? 'A',
            );
            $aiReply  = $result['reply'];
            $leadData = $result['leadData'];

            $currentContext   = $customer->ai_context ?? [];
            $pricelistAlready = ! empty($currentContext['pricelist_sent']);

            if ($leadData && ! empty($leadData['nama'])) {
                $customer->update(['nama' => $leadData['nama'], 'status' => 'interested']);

                // Calculate distance if venue is known
                $venueLokasiStr = $leadData['lokasi'] ?? null;
                $jarakResult    = $venueLokasiStr
                    ? app(DistanceService::class)->calculate($venueLokasiStr)
                    : null;

                $newContext = array_merge($currentContext, array_filter([
                    'nama'    => $leadData['nama']    ?? null,
                    'tanggal' => $leadData['tanggal'] ?? null,
                    'acara'   => $leadData['acara']   ?? null,
                    'lokasi'  => $venueLokasiStr,
                ]));

                if ($jarakResult) {
                    $newContext['jarak_km']         = $jarakResult['km'];
                    $newContext['transport_gratis']  = $jarakResult['gratis'];
                }

                if (! empty($leadData['tanggal'])) {
                    Booking::updateOrCreate(
                        ['customer_id' => $customer->id, 'status' => 'pending'],
                        [
                            'tanggal'     => $leadData['tanggal'],
                            'nama_acara'  => $leadData['acara'] ?? null,
                            'lokasi'      => $venueLokasiStr,
                            'catatan'     => $venueLokasiStr ? 'Lokasi: ' . $venueLokasiStr : null,
                            'total_jarak' => $jarakResult['km'] ?? null,
                        ],
                    );
                }

                // Only send pricelist once — skip if already sent in a previous session
                if (! $pricelistAlready) {
                    // Send AI text first (if any — AI may return tool_use only, which is valid)
                    if (! empty(trim($aiReply))) {
                        $waService->sendText($waId, $aiReply);
                        ChatHistory::create(['customer_id' => $customer->id, 'role' => 'assistant', 'content' => $aiReply]);
                    }

                    // Fonnte needs a publicly accessible URL to deliver images.
                    // Priority: any non-localhost URL first, multipart file as localhost fallback.
                    $caption  = "Berikut pricelist kami, apabila ada pertanyaan silakan yaa kak☺️";
                    $isLocal  = fn(?string $u) => $u && (str_contains($u, 'localhost') || str_contains($u, '127.0.0.1'));

                    // Gather all URL candidates
                    // pricelist_cdn_url = user-provided public URL (ImgBB, etc.) — always works
                    // pricelist_url     = server-derived URL (only works in production, not localhost)
                    $kioskUrl   = $kiosk?->pricelist_cdn_url ?: $kiosk?->pricelist_url;
                    $globalUrl  = Setting::get('pricelist_url');
                    $defaultUrl = null;
                    $localPath  = null;

                    foreach (['jpg', 'jpeg', 'png', 'pdf'] as $ext) {
                        $c = public_path("pricelists/default.{$ext}");
                        if (file_exists($c)) {
                            $defaultUrl = url("pricelists/default.{$ext}");
                            $localPath  = $c;
                            break;
                        }
                    }

                    // Pick the best non-localhost URL; prefer kiosk-specific over global
                    $publicUrl = null;
                    foreach ([$kioskUrl, $defaultUrl, $globalUrl] as $candidate) {
                        if ($candidate && ! $isLocal($candidate)) {
                            $publicUrl = $candidate;
                            break;
                        }
                    }

                    if ($publicUrl) {
                        // Production path — Fonnte downloads from a real public URL
                        $waService->sendImage($waId, $publicUrl, $caption);
                        $newContext['pricelist_sent'] = true;
                        $customer->update(['ai_context' => $newContext]);
                        ChatHistory::create(['customer_id' => $customer->id, 'role' => 'assistant', 'content' => '[Pricelist dikirim]']);
                    } else {
                        // Localhost / dev — try multipart file upload (works if Fonnte supports it)
                        $filePath = $kiosk?->pricelist_file_path ?? $localPath;
                        if ($filePath && file_exists($filePath)) {
                            $waService->sendImageFile($waId, $filePath, $caption);
                            $newContext['pricelist_sent'] = true;
                            $customer->update(['ai_context' => $newContext]);
                            ChatHistory::create(['customer_id' => $customer->id, 'role' => 'assistant', 'content' => '[Pricelist dikirim]']);
                        } else {
                            $fallback = "Makasih kak! Data sudah kami terima 😊 Sebentar kami share info lengkap dan pricelist ya!";
                            $waService->sendText($waId, $fallback);
                            $newContext['pricelist_sent'] = true;
                            $customer->update(['ai_context' => $newContext]);
                            ChatHistory::create(['customer_id' => $customer->id, 'role' => 'assistant', 'content' => $fallback]);
                        }
                    }
                    return; // done — don't send aiReply again below
                }

                $customer->update(['ai_context' => $newContext]);

                // Pricelist was already sent in a prior session but AI returned only
                // tool_use (no text). Acknowledge so customer isn't left with no reply.
                if (empty(trim($aiReply))) {
                    $ack = 'Makasih kak ' . ($leadData['nama'] ?? '') . '! Data sudah kami catat 😊 Ada yang bisa dibantu lagi?';
                    $waService->sendText($waId, $ack);
                    ChatHistory::create(['customer_id' => $customer->id, 'role' => 'assistant', 'content' => $ack]);
                    return;
                }
            }

            // Normal reply (no pricelist triggered, or pricelist already sent before)
            if (! empty(trim($aiReply))) {
                $waService->sendText($waId, $aiReply);
                ChatHistory::create(['customer_id' => $customer->id, 'role' => 'assistant', 'content' => $aiReply]);
            }

        } catch (Throwable $e) {
            logger()->error('WhatsApp job error', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString(), 'wa_id' => $waId]);
            // Always send a fallback so customer isn't left with no reply
            try {
                $waService->sendText($waId, 'Maaf Kak, ada kendala teknis. Mohon coba lagi ya 🙏');
            } catch (Throwable) {}
        }
    }

    private function handleImageMessage(
        array          $msg,
        Customer       $customer,
        string         $waId,
        WhatsAppService $waService,
        ?Kiosk          $kiosk,
        AIService       $ai,
        InvoiceService  $invoiceService,
    ): void {
        $mediaId  = $msg['image']['id']      ?? null;
        $mediaUrl = $msg['image']['url']     ?? null; // Fonnte sends direct URL
        $caption  = $msg['image']['caption'] ?? '';

        ChatHistory::create([
            'customer_id' => $customer->id,
            'role'        => 'user',
            'content'     => '[Gambar dikirim]' . ($caption ? ': ' . $caption : ''),
        ]);

        if ($kiosk && ($kiosk->ai_mode ?? 'active') !== 'active') return;
        if ($customer->ai_paused) return;
        if (! $mediaId && ! $mediaUrl) return;

        try {
            $http = new \GuzzleHttp\Client(['timeout' => 15]);

            // Fonnte: direct URL — download without auth token
            if ($mediaUrl) {
                $imageResp  = $http->get($mediaUrl);
                $imageBytes = $imageResp->getBody()->getContents();
                $mimeType   = $imageResp->getHeaderLine('Content-Type') ?: 'image/jpeg';
                $base64     = base64_encode($imageBytes);
            } else {
                // Meta: resolve media ID → URL → download with auth token
                $accessToken = $kiosk
                    ? $kiosk->wa_access_token
                    : (\App\Models\Setting::get('wa_access_token') ?: config('services.whatsapp.access_token', ''));

                $mediaResp  = $http->get("https://graph.facebook.com/v19.0/{$mediaId}", [
                    'headers' => ['Authorization' => "Bearer {$accessToken}"],
                ]);
                $mediaData  = json_decode($mediaResp->getBody()->getContents(), true);
                $resolvedUrl = $mediaData['url'] ?? null;
                if (! $resolvedUrl) return;

                $imageResp  = $http->get($resolvedUrl, ['headers' => ['Authorization' => "Bearer {$accessToken}"]]);
                $imageBytes = $imageResp->getBody()->getContents();
                $mimeType   = $imageResp->getHeaderLine('Content-Type') ?: 'image/jpeg';
                $base64     = base64_encode($imageBytes);
            }

            $result = $ai->verifyTransferImage($base64, $mimeType, $caption, $kiosk);

            if ($result['verified']) {
                $latestBooking = $customer->bookings()
                    ->whereNotIn('status', ['cancelled', 'completed'])
                    ->latest()->first();

                if ($latestBooking) {
                    $dpAmount = $result['amount'];
                    if (! $dpAmount && $latestBooking->package) {
                        $dpAmount = (int) ($latestBooking->package->harga * 0.5);
                    }

                    $latestBooking->update([
                        'dp_amount' => $dpAmount ?? $latestBooking->dp_amount,
                        'status'    => 'dp_paid',
                    ]);
                    $customer->update(['status' => 'booked']);

                    $waService->sendText($waId, $result['reply']);
                    ChatHistory::create(['customer_id' => $customer->id, 'role' => 'assistant', 'content' => $result['reply']]);

                    try {
                        $invoiceUrl  = $invoiceService->generateDpInvoice($latestBooking->fresh(['customer', 'package']));
                        $invoicePath = public_path(parse_url($invoiceUrl, PHP_URL_PATH));
                        $filename    = 'Invoice-DP-' . str($latestBooking->customer->nama)->slug() . '.pdf';

                        $waService->sendDocument($waId, $invoicePath, $filename, "Invoice DP booking kamu sudah siap ya kak! Simpan sebagai bukti pembayaran 📄");
                        ChatHistory::create(['customer_id' => $customer->id, 'role' => 'assistant', 'content' => '[Invoice DP dikirim: ' . $filename . ']']);
                    } catch (Throwable $invoiceErr) {
                        logger()->error('Invoice send error', ['message' => $invoiceErr->getMessage()]);
                    }

                    $frameMsg = "Btw kak, untuk desain frame fotonya — ada referensi atau konsep tertentu yang diinginkan? Misalnya tema warna, font, atau contoh desain? 🎨\n\nKalau ada, kirim aja ke sini ya, nanti tim kami yang proses. Estimasi selesai 3 hari kerja. Kalau belum ada bayangan juga gapapa, tim kami bisa buatkan sesuai tema acara kamu 😊";
                    $waService->sendText($waId, $frameMsg);
                    ChatHistory::create(['customer_id' => $customer->id, 'role' => 'assistant', 'content' => $frameMsg]);
                    return;
                }

                $customer->update(['status' => 'booked']);
            }

            $waService->sendText($waId, $result['reply']);
            ChatHistory::create(['customer_id' => $customer->id, 'role' => 'assistant', 'content' => $result['reply']]);

        } catch (Throwable $e) {
            logger()->error('AI Vision error', ['message' => $e->getMessage()]);
        }
    }
}
