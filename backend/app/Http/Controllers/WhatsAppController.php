<?php

namespace App\Http\Controllers;

use App\Models\ChatHistory;
use App\Models\Customer;
use App\Models\Faq;
use App\Models\Package;
use App\Models\Setting;
use App\Services\AIService;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Throwable;

class WhatsAppController extends Controller
{
    public function __construct(
        private AIService       $ai,
        private WhatsAppService $wa,
    ) {}

    // ─── GET /webhook/whatsapp ────────────────────────────────────────────────
    public function verify(Request $request): Response
    {
        $mode      = $request->query('hub_mode');
        $token     = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        $verifyToken = Setting::get('wa_verify_token')
            ?: config('services.whatsapp.verify_token', '');

        if ($mode === 'subscribe' && $token === $verifyToken) {
            return response($challenge, 200);
        }

        return response('Forbidden', 403);
    }

    // ─── POST /webhook/whatsapp ───────────────────────────────────────────────
    public function handle(Request $request): Response
    {
        $payload = $request->input('entry.0.changes.0.value');

        if (! isset($payload['messages'][0])) {
            return response('OK', 200);
        }

        $msg         = $payload['messages'][0];
        $waId        = $msg['from'];
        $messageType = $msg['type'] ?? 'unknown';

        try {
            $customer = Customer::firstOrCreate(
                ['whatsapp_id' => $waId],
                ['nama' => $payload['contacts'][0]['profile']['name'] ?? null],
            );

            if ($customer->status === 'new') {
                $customer->update(['status' => 'interested']);
            }

            if ($messageType === 'image') {
                $this->handleImageMessage($msg, $customer, $waId);
                return response('OK', 200);
            }

            if ($messageType !== 'text') {
                return response('OK', 200);
            }

            $userText = $msg['text']['body'];

            ChatHistory::create([
                'customer_id' => $customer->id,
                'role'        => 'user',
                'content'     => $userText,
            ]);

            if ($customer->ai_paused) {
                return response('OK', 200);
            }

            $history  = $customer->chatHistories()
                ->latest()->take(50)->get()->reverse()->values()->toArray();

            $packages  = Package::where('aktif', true)->get()->toArray();
            $faqs      = Faq::where('aktif', true)->orderBy('urutan')->get()->toArray();
            $discounts = \App\Models\Discount::where('aktif', true)
                ->where('berlaku_sampai', '>=', now()->toDateString())
                ->get()->map(fn($d) => [
                    'nama'           => $d->nama,
                    'label'          => $d->label,
                    'berlaku_sampai' => $d->berlaku_sampai->format('d M Y'),
                ])->toArray();
            $bookedDates = \App\Models\Booking::whereNotIn('status', ['cancelled'])
                ->pluck('tanggal')
                ->map(fn($d) => $d->format('Y-m-d'))
                ->unique()->values()->toArray();

            $rawReply = $this->ai->getReply($userText, $history, $packages, $faqs, $bookedDates, $discounts);

            ['reply' => $aiReply, 'lead' => $lead] = $this->ai->extractLeadData($rawReply);

            // Save lead data when AI collected all form fields
            if ($lead && ! empty($lead['nama'])) {
                $customer->update(['nama' => $lead['nama'], 'status' => 'interested']);
                if (! empty($lead['tanggal'])) {
                    \App\Models\Booking::updateOrCreate(
                        ['customer_id' => $customer->id, 'status' => 'pending'],
                        [
                            'tanggal'    => $lead['tanggal'],
                            'nama_acara' => $lead['acara'] ?? null,
                            'catatan'    => isset($lead['lokasi']) ? 'Lokasi: ' . $lead['lokasi'] : null,
                        ],
                    );
                }

                // Send pricelist image after form complete
                $pricelistUrl = url('images/pricelist.jpg');
                $this->wa->sendImage(
                    $waId,
                    $pricelistUrl,
                    "Berikut pricelist kami, apabila ada pertanyaan silakan yaa kak☺️"
                );

                ChatHistory::create([
                    'customer_id' => $customer->id,
                    'role'        => 'assistant',
                    'content'     => '[Pricelist dikirim]',
                ]);
            }

            $this->wa->sendText($waId, $aiReply);

            ChatHistory::create([
                'customer_id' => $customer->id,
                'role'        => 'assistant',
                'content'     => $aiReply,
            ]);
        } catch (Throwable $e) {
            logger()->error('WhatsApp webhook error', [
                'message' => $e->getMessage(),
                'wa_id'   => $waId ?? null,
            ]);
        }

        return response('OK', 200);
    }

    private function handleImageMessage(array $msg, Customer $customer, string $waId): void
    {
        $mediaId  = $msg['image']['id']      ?? null;
        $caption  = $msg['image']['caption'] ?? '';

        ChatHistory::create([
            'customer_id' => $customer->id,
            'role'        => 'user',
            'content'     => '[Gambar dikirim]' . ($caption ? ': ' . $caption : ''),
        ]);

        if ($customer->ai_paused) {
            return;
        }

        if (! $mediaId) {
            return;
        }

        try {
            $accessToken = Setting::get('wa_access_token') ?: config('services.whatsapp.access_token', '');

            // Step 1: Get media URL from WhatsApp
            $http      = new \GuzzleHttp\Client(['timeout' => 15]);
            $mediaResp = $http->get("https://graph.facebook.com/v19.0/{$mediaId}", [
                'headers' => ['Authorization' => "Bearer {$accessToken}"],
            ]);
            $mediaData = json_decode($mediaResp->getBody()->getContents(), true);
            $mediaUrl  = $mediaData['url'] ?? null;

            if (! $mediaUrl) {
                return;
            }

            // Step 2: Download image bytes
            $imageResp  = $http->get($mediaUrl, [
                'headers' => ['Authorization' => "Bearer {$accessToken}"],
            ]);
            $imageBytes = $imageResp->getBody()->getContents();
            $mimeType   = $imageResp->getHeaderLine('Content-Type') ?: 'image/jpeg';
            $base64     = base64_encode($imageBytes);

            // Step 3: Send to Claude Vision for transfer verification
            $result = $this->ai->verifyTransferImage($base64, $mimeType, $caption);

            // Step 4: If verified, update status to dp_paid
            if ($result['verified']) {
                // Update or create booking dp_amount
                $latestBooking = $customer->bookings()
                    ->whereNotIn('status', ['cancelled', 'completed'])
                    ->latest()
                    ->first();

                if ($latestBooking) {
                    $latestBooking->update([
                        'dp_amount' => $result['amount'] ?? $latestBooking->dp_amount,
                        'status'    => 'dp_paid',
                    ]);
                }

                $customer->update(['status' => 'booked']);
            }

            $this->wa->sendText($waId, $result['reply']);

            ChatHistory::create([
                'customer_id' => $customer->id,
                'role'        => 'assistant',
                'content'     => $result['reply'],
            ]);
        } catch (Throwable $e) {
            logger()->error('AI Vision error', ['message' => $e->getMessage()]);
        }
    }
}
