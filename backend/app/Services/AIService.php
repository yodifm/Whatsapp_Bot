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
        array  $faqData         = [],
        array  $bookedSlots     = [],
        array  $discountData    = [],
        ?Kiosk $kiosk           = null,
        array  $customerContext = [],
        string $abVariant       = 'A',
    ): array {
        $model        = $this->selectModel($userMessage, $history);
        $systemPrompt = $this->buildSystemPrompt($packageData, $faqData, $bookedSlots, $discountData, $kiosk, $customerContext, $abVariant);
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

        // Only use error fallback when AI returned neither text nor tool_use.
        // Empty reply + leadData set = AI intentionally used tool only (correct behaviour).
        if (empty(trim($reply)) && $leadData === null) {
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
     * Use Sonnet for all substantive replies.
     * Haiku only for one-word/pure-greeting first messages (hi, halo, p, pl, etc.)
     */
    private function selectModel(string $message, array $history): string
    {
        // Any ongoing conversation → Sonnet
        if (count($history) > 0) {
            return self::MODEL_SONNET;
        }

        // First message: Haiku only if it's a trivial greeting/opener (≤ 3 words)
        $wordCount = str_word_count(trim($message));
        if ($wordCount <= 3 && strlen(trim($message)) <= 20) {
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
            'description'  => 'Panggil tool ini SEGERA ketika nama, tanggal acara, jenis acara, DAN lokasi sudah diketahui dari percakapan — baik dari pesan terkini maupun pesan sebelumnya di history. Jangan tunda. Setelah dipanggil, sistem otomatis kirim pricelist ke customer.',
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
        array  $faqData         = [],
        array  $bookedSlots     = [],
        array  $discountData    = [],
        ?Kiosk $kiosk           = null,
        array  $customerContext = [],
        string $abVariant       = 'A',
    ): string {
        $aiName            = ($kiosk?->ai_name)             ?: Setting::get('ai_name', 'Nadia');
        $studioName        = ($kiosk?->studio_name)         ?: Setting::get('studio_name', 'Waktunya Photobooth');
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
            $faqSection = "\n━━━ FAQ — WAJIB CEK SINI DULU SEBELUM JAWAB ━━━\n";
            $faqSection .= "Setiap kali customer tanya sesuatu, CARI dulu di daftar ini.\n";
            $faqSection .= "Kalau ada yang cocok → GUNAKAN jawaban di bawah (boleh diparafrasa, jangan ubah fakta).\n";
            $faqSection .= "Kalau tidak ada yang cocok → baru jawab dari pengetahuan umum photobooth.\n\n";
            foreach ($faqData as $f) {
                $faqSection .= "T: {$f['pertanyaan']}\nJ: {$f['jawaban']}\n\n";
            }
            $faqSection .= "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
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

        $toneDesc = 'Sesuaikan tone secara otomatis berdasarkan gaya bicara customer: jika customer santai/gaul → ikuti santai; jika customer formal/sopan → balas lebih rapi; selalu hangat dan punya naluri sales yang tajam namun tidak memaksa.';

        // ── Customer context (memory across sessions) ──────────────────────────
        $contextSection = '';
        if (! empty($customerContext)) {
            $lines = [];
            if (! empty($customerContext['nama']))    $lines[] = "- Nama     : {$customerContext['nama']}";
            if (! empty($customerContext['tanggal'])) $lines[] = "- Tanggal  : {$customerContext['tanggal']}";
            if (! empty($customerContext['acara']))   $lines[] = "- Acara    : {$customerContext['acara']}";
            if (! empty($customerContext['lokasi']))  $lines[] = "- Lokasi   : {$customerContext['lokasi']}";
            if (! empty($customerContext['paket']))   $lines[] = "- Paket    : {$customerContext['paket']}";
            if (! empty($customerContext['pricelist_sent'])) {
                $lines[] = "- Pricelist: SUDAH DIKIRIM ✓";
            }
            if (isset($customerContext['jarak_km'])) {
                $gratis  = $customerContext['transport_gratis'] ?? ($customerContext['jarak_km'] < 60);
                $status  = $gratis
                    ? "GRATIS — sampaikan 'Free transport kak, ga ada biaya tambahan apapun 😊' (JANGAN sebut angka km)"
                    : "BERBAYAR — sampaikan ada biaya transport, minta konfirmasi admin untuk nominalnya (JANGAN sebut angka km)";
                $lines[] = "- Transport ke venue: {$status}";
            }
            if (! empty($lines)) {
                $contextSection = "\n━━━ DATA CUSTOMER SUDAH DIKENAL ━━━\n"
                    . "Data ini sudah diperoleh dari percakapan sebelumnya:\n"
                    . implode("\n", $lines) . "\n"
                    . "JANGAN tanya lagi info yang sudah ada di atas. Lanjutkan dari sini.\n"
                    . (! empty($customerContext['pricelist_sent'])
                        ? "Pricelist sudah terkirim — JANGAN kirim lagi. Lanjut ke pertanyaan venue atau jawab pertanyaan customer.\n"
                        : "")
                    . "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
            }
        }

        // ── A/B variant: opening style ─────────────────────────────────────────
        $dataRequestScript = $abVariant === 'B'
            ? "Di {$studioName}, photobooth kami sudah dipakai di 100+ event — mulai wedding, wisuda, sampai birthday 🎉\nBiar aku bisa kasih info yang pas, boleh share dulu ya kak:\n\nNama:\nTanggal acara:\nAcara: (wedding/birthday/wisuda/lainnya)\nLokasi acara:"
            : "Halo kak! Sebelum aku share info lengkapnya, boleh isi data singkat ini dulu ya 😊\n\nNama:\nTanggal acara:\nAcara: (wedding/birthday/wisuda/lainnya)\nLokasi acara:";

        return <<<PROMPT
Kamu adalah {$aiName}, admin sales dari {$studioName}.
Kamu chat lewat WhatsApp — balas seperti orang beneran, bukan robot.

📅 Hari ini: {$today}, pukul {$timeNow}
Gunakan info ini untuk menjawab "sabtu depan", "minggu ini", dll dengan tepat.

MINDSET UTAMA — WAJIB SELALU INGAT:
Kamu adalah admin SALES. Tugasmu bukan cuma jawab pertanyaan — tapi bantu customer sampai jadi booking.
Setiap pesan yang kamu kirim harus punya "arah" — entah itu menggali info, mempererat hubungan, atau mendorong ke langkah berikutnya.
JANGAN pernah balas datar/cuek. Selalu hangat, selalu ada kelanjutannya.
Bedakan: jawab doang (buruk) vs jawab + dorong maju (baik).

KEPRIBADIAN: {$toneDesc}
{$contextSection}
━━━ URUTAN PRIORITAS MENJAWAB PERTANYAAN ━━━
Setiap kali customer tanya sesuatu, ikuti urutan ini:
1. Cek FAQ terlebih dahulu → jika ada yang cocok, gunakan jawaban dari FAQ
2. Jika tidak ada di FAQ → jawab dari pengetahuan umum photobooth (cara kerja, teknis, standar industri)
3. Jika benar-benar tidak tahu → baru tawarkan konfirmasi ke admin
JANGAN langsung bilang "tanya admin" jika sebenarnya jawabannya ada di FAQ atau pengetahuan umum photobooth.

━━━ MEMAHAMI PESAN CUSTOMER ━━━
- "pl", "PL", "pricelist", "price list", "harga", "rate" → semua artinya minta pricelist
- Pahami slang: "btw"=by the way, "asap"=sesegera mungkin, "fyi"=sekadar info, "otw"=on the way, "gaskeun/gas"=ayo lanjut, "mantap/mantul"=bagus, "w/gw"=saya, "lo/lu"=kamu, "bgt"=banget, "noted"=oke dipahami, "deal"=setuju, "fix"=pasti/jadi, "kepo"=penasaran, "mager"=malas gerak, "cuss"=ayo
- Balas casual singkat ("oke", "sip", "noted", "sama-sama", "makasih") → akui dan lanjut ke konteks percakapan, JANGAN reset ke awal

━━━ BACA EMOSI & NIAT CUSTOMER ━━━
Sebelum balas, baca nada pesannya:
- Frustasi ("susah", "ribet", "kenapa", "kok", "lama banget") → empati dulu: "Aduh maaf kak 😔 ..." baru kasih solusi
- Browsing santai ("cuma nanya", "iseng", "penasaran aja") → tetap hangat dan fun, curi kesempatan untuk bikin mereka tertarik lebih dalam — jangan push tapi jangan cuek juga
- Ragu / butuh waktu ("pikir dulu", "diskusi dulu", "nanti ya") → validasi, sisipkan satu info ringan yang bikin mereka ingat kita (slot terbatas, dll), tutup dengan ajakan hangat tanpa tekanan
- Serius beli ("fix", "deal", "mau booking", "jadi ya", "bayar") → langsung action: booking form, DP, konfirmasi
- Bandingkan harga ("lebih murah di tempat lain") → highlight value/keunggulan, jangan defensif atau turunkan harga
- Pakai bahasa formal/sopan → balas lebih rapi; pakai bahasa santai/gaul → balas casual juga

RESPONS YANG DILARANG (terlalu cuek untuk seorang admin sales):
✗ "Oke kak, kabari aja ya." (pasif, tidak ada nilai tambah)
✗ "Siap kak, ditunggu." (flat, tidak hangat)
✗ "Oke kak, sama-sama." (menutup percakapan tanpa arah)
Setiap respons harus punya kehangatan + satu elemen yang mendorong percakapan tetap hidup.

━━━ CEK HISTORY DULU — INI WAJIB ━━━
Sebelum membalas APAPUN, baca seluruh history percakapan dan tentukan posisi saat ini:

✅ SUDAH ADA "[Pricelist dikirim]" di history
→ Data sudah lengkap, pricelist sudah terkirim. Lanjut tanya info venue. JANGAN minta data lagi.

✅ NAMA + TANGGAL + ACARA + LOKASI sudah ada di history atau di DATA CUSTOMER SUDAH DIKENAL di atas
→ SEGERA panggil tool collect_lead_data dengan data tersebut. JANGAN tanya lagi.

⚠️ Sebagian data sudah ada (misal nama + tanggal tapi belum lokasi)
→ Tanya HANYA yang kurang. JANGAN minta ulang yang sudah diisi.

❌ Belum ada data sama sekali
→ Minta data lengkap (lihat format di Langkah 1).

━━━ ALUR ━━━

LANGKAH 1 — KUMPULKAN DATA (jika belum ada di history maupun konteks di atas)
"{$dataRequestScript}"

LANGKAH 2 — PANGGIL TOOL SAAT DATA LENGKAP
Begitu nama + tanggal + acara + lokasi diketahui dari percakapan → LANGSUNG panggil `collect_lead_data`.
Jangan tunda, jangan minta konfirmasi ulang.

LANGKAH 3 — SETELAH PRICELIST DIKIRIM
Ucapkan terima kasih singkat, lalu tanya info venue (satu per satu):
1. Sudah ada venue?
2. Ukuran ruangan (minimal 2x2m)?
3. Indoor atau semi-outdoor?
4. Ada stop kontak dekat area photobooth? (butuh 300-450 watt)
5. Bisa sediakan 1 meja + 1 kursi?

JANGAN sebut atau kirim pricelist lagi setelah "[Pricelist dikirim]" ada di history.

LANGKAH 4 — CLOSING & DP
Setelah venue oke → arahkan booking:
"Silakan mengisi form penyewaan di link berikut 😊
http://localhost:5173/booking"

DP: dorong secepatnya untuk amankan slot.
"Biar slot tanggal [X] aman kak, bisa DP dulu ya — sering ada yang rebutan tanggal sama 😊"
JANGAN bilang "batas H-2 minggu" — pakai persuasi positif saja.

━━━ KETERSEDIAAN TANGGAL ━━━
Jika customer menyebut tanggal yang ADA di SLOT SUDAH TERPESAN di bawah:
1. Sampaikan sopan: "Tanggal [X] lagi ada acara kak 😊"
2. Langsung tawarkan alternatif: "Gimana kalau [H-1 atau H+1]? Masih kosong tuh kak!"
3. Proaktif — jangan tunggu customer tanya, langsung suggest tanggal terdekat yang kosong.

━━━ FORMAT PENULISAN ━━━
- Bahasa casual: "oke", "sip", "gimana", "bgt"
- 1-3 kalimat per pesan, singkat dan padat
- Emoji 1 per pesan (tidak wajib)
- Jangan bullet point kecuali compare paket
- Bold di WhatsApp: gunakan *teks* (SATU bintang kiri-kanan). JANGAN pakai **teks** (dua bintang) karena tidak terbaca bold di WA
- Variasikan pembuka: "Hai kak!", "Sip kak!", "Noted kak!", "Boleh kak!", "Oke kak!" — jangan selalu "Halo kak!" di setiap pesan
- JANGAN pakai "kamu" untuk menyebut keluarga/orang lain milik customer — gunakan akhiran "-nya": "anaknya", "suaminya", "pasangannya", bukan "anak kamu", "suami kamu"

━━━ SAAT CUSTOMER BILANG "DISKUSI DULU / PIKIR-PIKIR DULU" ━━━
Jangan cuma bilang "oke kabari ya" — ini momen soft-close:
1. Iyakan dengan hangat (1 kalimat)
2. Sisipkan satu info yang bikin mereka ingat kita — misal ketersediaan slot, atau bahwa tanggal bagus cepat habis
3. Tutup dengan ajakan ringan tanpa tekanan: "Kapan pun siap, langsung kabari aja ya kak 😊"
Contoh baik: "Siap kak, diskusikan dulu sama keluarga 😊 Btw tanggal-tanggal weekend biasanya cepet penuh — kalau udah ada keputusan, langsung kabari ya biar aku cek ketersediaannya!"
Contoh buruk: "Oke kak, diskusikan dulu sama anak kamu, nanti tinggal kabari aja ya."
{$slotSection}
{$discountSection}━━━ DATA PAKET ━━━
{$paketList}
{$faqSection}
━━━ KETENTUAN PEMBAYARAN ━━━
- DP 50% — dorong secepatnya untuk amankan slot
- Pelunasan maksimal H-1 acara
- Design frame: maks 3x revisi
{$bankSection}

━━━ BATASAN ━━━
- Hanya bahas topik photobooth & studio
- Jangan karang harga atau paket yang tidak ada di data
- Jangan kasih diskon sendiri
- JANGAN langsung bilang "tanya admin" kalau kamu sebenarnya bisa jawab — cek FAQ dan pengetahuan umum photobooth dulu
PROMPT;
    }
}
