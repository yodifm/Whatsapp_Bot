<?php

namespace App\Services;

use App\Models\Kiosk;
use App\Models\Setting;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

class AIService
{
    private Client $client;
    private string $apiKey;

    private const MODEL_SONNET = 'claude-sonnet-4-5';
    private const MODEL_HAIKU  = 'claude-haiku-4-5-20251001';

    private const BOOKING_KEYWORDS = [
        'tanggal', 'acara', 'paket', 'harga', 'dp', 'transfer', 'bayar',
        'booking', 'sewa', 'wedding', 'ulang tahun', 'birthday', 'wisuda',
        'lokasi', 'venue', 'berapa', 'bisa', 'available', 'kosong',
    ];

    // Internal system markers — strip from history sent to Claude
    private const INTERNAL_PREFIXES = ['[Pricelist', '[Invoice', '[Gambar', '[Desain'];

    public function __construct()
    {
        $this->apiKey = Setting::get('anthropic_api_key')
            ?: config('services.anthropic.key', '');

        $this->client = new Client([
            'base_uri' => 'https://api.anthropic.com',
            'timeout'  => 45,
        ]);
    }

    /**
     * Get AI reply for a customer message.
     *
     * Returns:
     *   reply    — text to send to customer
     *   leadData — collected lead array or null
     *   model    — which model was used
     *   usage    — ['input_tokens' => int, 'output_tokens' => int]
     */
    public function getReply(
        string $userMessage,
        array  $history,
        array  $packageData,
        array  $faqData      = [],
        array  $bookedSlots  = [],
        array  $discountData = [],
        ?Kiosk $kiosk        = null,
    ): array {
        $model        = $this->selectModel($userMessage, $history);
        $systemPrompt = $this->buildSystemPrompt($packageData, $faqData, $bookedSlots, $discountData, $kiosk);
        $messages     = $this->buildMessages($history, $userMessage);

        $body = $this->callApi([
            'model'       => $model,
            'max_tokens'  => 1024,
            'system'      => $systemPrompt,
            'messages'    => $messages,
            'tools'       => [self::leadTool()],
            'tool_choice' => ['type' => 'auto'],
        ]);

        $reply    = '';
        $leadData = null;

        foreach ($body['content'] ?? [] as $block) {
            if ($block['type'] === 'text') {
                $reply .= $block['text'];
            } elseif ($block['type'] === 'tool_use' && $block['name'] === 'collect_lead_data') {
                $leadData = $block['input'];
            }
        }

        if (empty(trim($reply))) {
            $reply = 'Maaf Kak, ada kendala teknis. Mohon coba lagi ya 🙏';
        }

        $usage = $body['usage'] ?? ['input_tokens' => 0, 'output_tokens' => 0];

        logger()->info('AI token usage', [
            'model'         => $model,
            'input_tokens'  => $usage['input_tokens'],
            'output_tokens' => $usage['output_tokens'],
        ]);

        return compact('reply', 'leadData', 'model', 'usage');
    }

    /**
     * Analyze a payment proof image using Claude Vision.
     * Returns ['verified' => bool, 'amount' => int|null, 'reply' => string]
     */
    public function verifyTransferImage(string $base64Image, string $mimeType, string $caption = '', ?Kiosk $kiosk = null): array
    {
        $studioName        = ($kiosk?->studio_name)         ?: Setting::get('studio_name', 'Waktunya Photobooth');
        $aiName            = ($kiosk?->ai_name)             ?: Setting::get('ai_name', 'Nadia');
        $bankAccountHolder = ($kiosk?->bank_account_holder) ?: Setting::get('bank_account_holder');
        $bankAccountNumber = ($kiosk?->bank_account_number) ?: Setting::get('bank_account_number');
        $bankName          = ($kiosk?->bank_name)           ?: Setting::get('bank_name');

        $rekeningInfo = ($bankName && $bankAccountNumber)
            ? "Rekening tujuan yang benar: {$bankName} no. {$bankAccountNumber} a/n {$bankAccountHolder}"
            : '';

        $prompt = <<<PROMPT
Kamu adalah AI dari {$studioName} bernama {$aiName}.
Customer mengirim gambar dengan caption: "{$caption}"
{$rekeningInfo}

Analisa apakah gambar ini adalah bukti transfer/pembayaran DP yang valid.
Kembalikan HANYA JSON, tanpa teks lain:
{
  "is_transfer_proof": true/false,
  "amount": angka_nominal_atau_null,
  "bank_or_method": "nama bank/e-wallet atau null",
  "reply": "pesan balasan kepada customer dalam bahasa Indonesia yang hangat"
}

Jika bukti transfer valid: is_transfer_proof=true, baca nominal, reply konfirmasi + info invoice.
Jika bukan bukti transfer: is_transfer_proof=false, reply minta kirim ulang.
Jika blur/tidak jelas: is_transfer_proof=false, reply minta foto lebih jelas.
PROMPT;

        $body = $this->callApi([
            'model'      => self::MODEL_SONNET,
            'max_tokens' => 512,
            'messages'   => [[
                'role'    => 'user',
                'content' => [
                    [
                        'type'   => 'image',
                        'source' => ['type' => 'base64', 'media_type' => $mimeType, 'data' => $base64Image],
                    ],
                    ['type' => 'text', 'text' => $prompt],
                ],
            ]],
        ]);

        $usage = $body['usage'] ?? ['input_tokens' => 0, 'output_tokens' => 0];
        logger()->info('AI vision token usage', [
            'model'         => self::MODEL_SONNET,
            'input_tokens'  => $usage['input_tokens'],
            'output_tokens' => $usage['output_tokens'],
        ]);

        $text = $body['content'][0]['text'] ?? '{}';
        preg_match('/\{.*\}/s', $text, $matches);
        $parsed = json_decode($matches[0] ?? '{}', true);

        return [
            'verified' => (bool) ($parsed['is_transfer_proof'] ?? false),
            'amount'   => isset($parsed['amount']) ? (int) $parsed['amount'] : null,
            'reply'    => $parsed['reply'] ?? 'Gambar sudah diterima Kak. Mohon tunggu konfirmasi dari tim kami ya 🙏',
        ];
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    /**
     * Route to Haiku for short/simple messages, Sonnet for anything booking-related.
     */
    private function selectModel(string $message, array $history): string
    {
        $lower = strtolower($message);
        foreach (self::BOOKING_KEYWORDS as $kw) {
            if (str_contains($lower, $kw)) {
                return self::MODEL_SONNET;
            }
        }
        if (strlen($message) < 80 && count($history) < 8) {
            return self::MODEL_HAIKU;
        }
        return self::MODEL_SONNET;
    }

    /**
     * Strip internal system messages and cap history at 25 turns.
     */
    private function filterHistory(array $history): array
    {
        $filtered = array_filter($history, function (array $item) {
            $content = $item['content'] ?? '';
            foreach (self::INTERNAL_PREFIXES as $prefix) {
                if (str_starts_with($content, $prefix)) return false;
            }
            return true;
        });
        return array_values(array_slice(array_values($filtered), -25));
    }

    private function buildMessages(array $history, string $userMessage): array
    {
        $messages = [];
        foreach ($this->filterHistory($history) as $item) {
            $messages[] = ['role' => $item['role'], 'content' => $item['content']];
        }
        $messages[] = ['role' => 'user', 'content' => $userMessage];
        return $messages;
    }

    /**
     * Centralized API call with exponential-backoff retry (max 3 attempts).
     */
    private function callApi(array $payload, int $maxAttempts = 3): array
    {
        $attempt = 0;
        while (true) {
            $attempt++;
            try {
                $response = $this->client->post('/v1/messages', [
                    'headers' => [
                        'x-api-key'         => $this->apiKey,
                        'anthropic-version' => '2023-06-01',
                        'content-type'      => 'application/json',
                    ],
                    'json' => $payload,
                ]);
                return json_decode($response->getBody()->getContents(), true);
            } catch (GuzzleException $e) {
                if ($attempt >= $maxAttempts) throw $e;
                usleep(500_000 * $attempt); // 0.5s → 1s
            }
        }
    }

    private static function leadTool(): array
    {
        return [
            'name'         => 'collect_lead_data',
            'description'  => 'Panggil tool ini HANYA ketika kamu sudah memiliki SEMUA 4 data: nama, tanggal acara, jenis acara, dan lokasi dari percakapan. Jangan panggil sebelum semua field tersedia.',
            'input_schema' => [
                'type'       => 'object',
                'properties' => [
                    'nama'    => ['type' => 'string', 'description' => 'Nama lengkap customer'],
                    'tanggal' => ['type' => 'string', 'description' => 'Tanggal acara format YYYY-MM-DD'],
                    'acara'   => ['type' => 'string', 'description' => 'Jenis acara: wedding, birthday, wisuda, dll'],
                    'lokasi'  => ['type' => 'string', 'description' => 'Nama venue atau kota lokasi acara'],
                ],
                'required'   => ['nama', 'tanggal', 'acara', 'lokasi'],
            ],
        ];
    }

    private function buildSystemPrompt(
        array  $packageData,
        array  $faqData      = [],
        array  $bookedSlots  = [],
        array  $discountData = [],
        ?Kiosk $kiosk        = null,
    ): string {
        $aiName            = ($kiosk?->ai_name)             ?: Setting::get('ai_name', 'Nadia');
        $studioName        = ($kiosk?->studio_name)         ?: Setting::get('studio_name', 'Waktunya Photobooth');
        $tone              = ($kiosk?->ai_tone)             ?: Setting::get('ai_tone', 'sales');
        $bankName          = ($kiosk?->bank_name)           ?: Setting::get('bank_name');
        $bankAccountNumber = ($kiosk?->bank_account_number) ?: Setting::get('bank_account_number');
        $bankAccountHolder = ($kiosk?->bank_account_holder) ?: Setting::get('bank_account_holder');

        $today   = now()->locale('id')->isoFormat('dddd, D MMMM Y');
        $timeNow = now()->format('H:i') . ' WIB';

        $paketList = '';
        foreach ($packageData as $p) {
            $fitur     = is_array($p['fitur']) ? implode(', ', $p['fitur']) : ($p['fitur'] ?? '-');
            $harga     = 'Rp ' . number_format($p['harga'], 0, ',', '.');
            $paketList .= "- *{$p['nama']}*: {$harga} | Durasi: {$p['durasi_jam']} jam | Fitur: {$fitur}\n";
        }
        if (empty(trim($paketList))) {
            $paketList = "- (Belum ada data paket tersedia saat ini)\n";
        }

        $slotSection = '';
        if (! empty($bookedSlots)) {
            $slotList    = implode("\n", array_map(fn($s) => "  • {$s}", $bookedSlots));
            $slotSection = "\n=== SLOT SUDAH TERPESAN ===\n{$slotList}\nJangan konfirmasi slot waktu di atas. Tawarkan alternatif.\n===========================\n";
        }

        $discountSection = '';
        if (! empty($discountData)) {
            $discountSection = "\n━━━ PROMO & DISKON AKTIF ━━━\n";
            foreach ($discountData as $d) {
                $discountSection .= "• {$d['nama']}: {$d['label']} (berlaku s/d {$d['berlaku_sampai']})\n";
            }
            $discountSection .= "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        }

        $faqSection = '';
        if (! empty($faqData)) {
            $faqSection = "\n=== FAQ ===\n";
            foreach ($faqData as $f) {
                $faqSection .= "Q: {$f['pertanyaan']}\nA: {$f['jawaban']}\n\n";
            }
            $faqSection .= "===========\n";
        }

        $bankSection = '';
        if ($bankName && $bankAccountNumber) {
            $bankSection = <<<BANK

━━━ INFO PEMBAYARAN DP ━━━
Bank       : {$bankName}
No. Rek    : {$bankAccountNumber}
Atas Nama  : {$bankAccountHolder}

Sampaikan natural: "Transfer DPnya ke {$bankName} ya kak, no rek {$bankAccountNumber} a/n {$bankAccountHolder} 😊 Setelah transfer, kirim bukti transfernya ke sini ya"
Setelah customer kirim bukti transfer, sistem otomatis verifikasi dan kirim invoice.
━━━━━━━━━━━━━━━━━━━━━━━━━

BANK;
        }

        $toneDesc = match ($tone) {
            'friendly' => 'sangat ramah, santai, dan bersahabat seperti teman dekat.',
            'formal'   => 'profesional, sopan, dan formal. Gunakan Bahasa Indonesia baku.',
            default    => 'hangat, antusias, percaya diri, dan punya naluri sales yang tajam.',
        };

        return <<<PROMPT
Kamu adalah {$aiName}, admin dari {$studioName}.
Kamu chat lewat WhatsApp — balas seperti orang beneran, bukan robot.

📅 Hari ini: {$today}, pukul {$timeNow}
Gunakan info ini untuk menjawab "sabtu depan", "minggu ini", dll dengan tepat.

KEPRIBADIAN: {$toneDesc}

━━━ ALUR WAJIB ━━━

LANGKAH 1 — KUMPULKAN DATA DULU (sebelum kasih info apapun)
Apapun yang ditanya customer, SELALU minta data ini dulu:

"Halo kak! Untuk info pricelist mohon mengisi data berikut ya 😊

Nama:
Tanggal acara:
Acara: wedding/birthday/lainnya
Lokasi acara:"

Jangan kasih info harga atau paket sebelum semua 4 field terisi.

LANGKAH 2 — DETEKSI FORM LENGKAP
Form lengkap = nama + tanggal + jenis acara + lokasi sudah diketahui dari percakapan.
Ketika LENGKAP → panggil tool `collect_lead_data`. Pricelist otomatis dikirim ke customer.

LANGKAH 3 — SETELAH DATA LENGKAP
Ucapkan terima kasih singkat, pricelist sudah dikirim, lalu tanya venue natural.

LANGKAH 4 — TANYA INFO VENUE (satu per satu)
1. Sudah ada venue?
2. Ukuran ruangan (minimal 2x2m)
3. Indoor atau semi-outdoor?
4. Ada stop kontak dekat area photobooth? (butuh 300-450 watt)
5. Bisa sediakan 2 kursi?

LANGKAH 5 — CLOSING
Setelah venue oke → arahkan booking dengan link:
"Silakan mengisi form penyewaan photobooth di link berikut 😊
http://localhost:5173/booking"

━━━ CARA NULIS ━━━
- Bahasa casual: "oke", "sip", "gimana", "bgt"
- 1-3 kalimat per pesan
- Emoji 1 per pesan, tidak harus ada
- Jangan bullet point kecuali compare paket
{$slotSection}
{$discountSection}━━━ DATA PAKET ━━━
{$paketList}
{$faqSection}
━━━ KETENTUAN PEMBAYARAN ━━━
- DP 50% maksimal H-2 minggu sebelum acara
- Pelunasan maksimal H-1 acara
- Design frame: maks 3x revisi
{$bankSection}

━━━ BATASAN ━━━
- Hanya bahas topik photobooth & studio
- Jangan karang harga atau paket yang tidak ada di data
- Jangan kasih diskon sendiri
- Kalau tidak tahu: "bisa tanya langsung ke admin ya"
PROMPT;
    }
}
