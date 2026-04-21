<?php

namespace App\Services;

use App\Models\Setting;
use GuzzleHttp\Client;

class AIService
{
    private Client $client;
    private string $apiKey;
    private string $model = 'claude-sonnet-4-5';

    public function __construct()
    {
        $this->apiKey = Setting::get('anthropic_api_key')
            ?: config('services.anthropic.key', '');

        $this->client = new Client([
            'base_uri' => 'https://api.anthropic.com',
            'timeout'  => 30,
        ]);
    }

    public function getReply(
        string $userMessage,
        array  $history,
        array  $packageData,
        array  $faqData     = [],
        array  $bookedDates = [],
    ): string {
        $systemPrompt = $this->buildSystemPrompt($packageData, $faqData, $bookedDates);

        $messages = [];
        foreach ($history as $item) {
            $messages[] = ['role' => $item['role'], 'content' => $item['content']];
        }
        $messages[] = ['role' => 'user', 'content' => $userMessage];

        $response = $this->client->post('/v1/messages', [
            'headers' => [
                'x-api-key'         => $this->apiKey,
                'anthropic-version' => '2023-06-01',
                'content-type'      => 'application/json',
            ],
            'json' => [
                'model'      => $this->model,
                'max_tokens' => 1024,
                'system'     => $systemPrompt,
                'messages'   => $messages,
            ],
        ]);

        $body = json_decode($response->getBody()->getContents(), true);

        return $body['content'][0]['text'] ?? 'Maaf Kak, ada kendala teknis. Mohon coba lagi ya 🙏';
    }

    /**
     * Analyze a transfer/bukti bayar image using Claude Vision.
     * Returns ['verified' => bool, 'amount' => int|null, 'reply' => string]
     */
    public function verifyTransferImage(string $base64Image, string $mimeType, string $caption = ''): array
    {
        $studioName = Setting::get('studio_name') ?: 'Studio Foto';
        $aiName     = Setting::get('ai_name')     ?: 'Nadia';

        $prompt = <<<PROMPT
Kamu adalah AI dari {$studioName} bernama {$aiName}.

Customer mengirim sebuah gambar dengan caption: "{$caption}"

Tugasmu: Analisa apakah gambar ini adalah bukti transfer / pembayaran DP yang valid.

Kembalikan HANYA JSON dalam format ini, tanpa teks lain:
{
  "is_transfer_proof": true/false,
  "amount": angka_nominal_atau_null,
  "bank_or_method": "nama bank/e-wallet atau null",
  "reply": "pesan balasan kepada customer dalam bahasa Indonesia yang hangat"
}

Jika bukti transfer valid:
- Ucapkan terima kasih, konfirmasi nominal yang terlihat, dan info bahwa tim akan memverifikasi segera
- reply: "Terima kasih Kak! Bukti transfer sebesar Rp X sudah kami terima 🎉 Tim kami akan segera verifikasi dan booking Kakak akan dikonfirmasi. Mohon tunggu konfirmasi dari admin ya Kak 🙏"

Jika BUKAN bukti transfer (foto biasa, screenshot lain, dll):
- is_transfer_proof: false
- reply: pesan ramah bahwa gambar yang diterima sepertinya bukan bukti transfer, minta kirim ulang yang benar

Jika gambar tidak jelas / blur:
- is_transfer_proof: false
- reply: minta customer kirim ulang foto bukti transfer yang lebih jelas
PROMPT;

        $response = $this->client->post('/v1/messages', [
            'headers' => [
                'x-api-key'         => $this->apiKey,
                'anthropic-version' => '2023-06-01',
                'content-type'      => 'application/json',
            ],
            'json' => [
                'model'      => $this->model,
                'max_tokens' => 512,
                'messages'   => [[
                    'role'    => 'user',
                    'content' => [
                        [
                            'type'   => 'image',
                            'source' => [
                                'type'       => 'base64',
                                'media_type' => $mimeType,
                                'data'       => $base64Image,
                            ],
                        ],
                        ['type' => 'text', 'text' => $prompt],
                    ],
                ]],
            ],
        ]);

        $body = json_decode($response->getBody()->getContents(), true);
        $text = $body['content'][0]['text'] ?? '{}';

        // Extract JSON even if there's surrounding text
        preg_match('/\{.*\}/s', $text, $matches);
        $parsed = json_decode($matches[0] ?? '{}', true);

        return [
            'verified' => (bool) ($parsed['is_transfer_proof'] ?? false),
            'amount'   => isset($parsed['amount']) ? (int) $parsed['amount'] : null,
            'reply'    => $parsed['reply'] ?? 'Gambar sudah diterima Kak. Mohon tunggu konfirmasi dari tim kami ya 🙏',
        ];
    }

    private function buildSystemPrompt(array $packageData, array $faqData = [], array $bookedDates = []): string
    {
        $paketList = '';
        foreach ($packageData as $p) {
            $fitur = is_array($p['fitur']) ? implode(', ', $p['fitur']) : ($p['fitur'] ?? '-');
            $harga = 'Rp ' . number_format($p['harga'], 0, ',', '.');
            $paketList .= "- *{$p['nama']}*: {$harga} | Durasi: {$p['durasi_jam']} jam | Fitur: {$fitur}\n";
        }
        if (empty(trim($paketList))) {
            $paketList = "- (Belum ada data paket tersedia saat ini)\n";
        }

        $faqSection = '';
        if (! empty($faqData)) {
            $faqSection = "\n=== FAQ & PENGETAHUAN STUDIO ===\n";
            foreach ($faqData as $f) {
                $faqSection .= "Q: {$f['pertanyaan']}\nA: {$f['jawaban']}\n\n";
            }
            $faqSection .= "================================\n";
        }

        $slotSection = '';
        if (! empty($bookedDates)) {
            $dates = implode(', ', $bookedDates);
            $slotSection = "\n=== TANGGAL SUDAH TERPESAN ===\n{$dates}\nJangan konfirmasi slot untuk tanggal-tanggal di atas. Tawarkan tanggal alternatif.\n==============================\n";
        }

        $aiName     = Setting::get('ai_name')     ?: 'Nadia';
        $studioName = Setting::get('studio_name') ?: 'Photobooth Studio';
        $tone       = Setting::get('ai_tone')     ?: 'sales';

        $toneDesc = match ($tone) {
            'friendly' => 'sangat ramah, santai, dan bersahabat seperti teman dekat. Fokus pada membangun hubungan dulu sebelum jualan.',
            'formal'   => 'profesional, sopan, dan formal. Gunakan Bahasa Indonesia baku, hindari singkatan.',
            default    => 'hangat, antusias, percaya diri, dan punya naluri sales yang tajam.',
        };

        return <<<PROMPT
Kamu adalah Sales Agent AI dari studio photobooth bernama "{$studioName}".
Nama panggilanmu: {$aiName}.
Kepribadianmu: {$toneDesc}
Selalu panggil customer dengan "Kak".

## MISI UTAMA
Closing secepat mungkin. Setiap pesan harus membawa customer selangkah lebih dekat ke keputusan booking.

## TEKNIK SALES YANG HARUS DITERAPKAN

### 1. OPENING & RAPPORT
- Sambut dengan antusias + tanya kebutuhan spesifik ("Acaranya apa Kak? Ulang tahun, pre-wedding, atau acara kantor?")
- Bangun urgensi ringan di awal ("Kak datang pas waktu yang tepat, weekend ini masih ada slot yang tersisa!")

### 2. IDENTIFIKASI KEBUTUHAN (sebelum tawarkan paket)
- Tanya acara apa, berapa tamu/orang yang ikut, tanggal, dan budget range
- Gunakan info ini untuk rekomendasikan paket yang PALING COCOK (bukan semua paket sekaligus)

### 3. PRESENTASI PAKET - FORMULA VALUE FIRST
Jangan langsung sebut harga. Urutan:
1. Benefit utama ("Kakak bisa dapat unlimited foto selama 2 jam...")
2. Apa yang akan Kak rasakan ("Tamu-tamu pasti seneng banget, bisa langsung cetak foto on-the-spot")
3. Baru harga ("Untuk semua itu, investasinya cuma Rp X aja Kak")

### 4. UPSELLING
- Selalu tawarkan paket 1 tingkat di atas yang customer tanyakan
- Framing: "Bedanya cuma Rp X lagi Kak, tapi Kakak dapat [fitur tambahan]. Worth it banget untuk acara spesial 😊"

### 5. HANDLING OBJECTIONS
- "Mahal": Reframe ke value. "Iya Kak, tapi kalau dibagi per orang atau per foto yang dihasilkan, sebenernya sangat worth it. Plus kenangan ini abadi lho Kak 📸"
- "Pikir-pikir dulu": Buat urgensi. "Boleh Kak, tapi FYI slot weekend kami memang cepat habis. Kalau mau aku bantu hold dulu tanggalnya?"
- "Ada diskon?": Jangan langsung kasih. "Tergantung tanggal dan paketnya Kak, bisa aku cek dulu. Kakak rencananya tanggal berapa?"

### 6. CLOSING TECHNIQUE
Gunakan salah satu teknik ini di saat yang tepat:
- **Assumptive close**: "Oke Kak, berarti kita lanjut dengan paket [X] ya? Aku sambungkan ke admin untuk proses booking-nya 😊"
- **Alternative close**: "Kak lebih prefer weekend atau weekday? Biar aku bantu cariin slot yang pas"
- **Urgency close**: "Kebetulan ada 2 slot tersisa bulan ini Kak, kalau mau diamankan sekarang bisa langsung konfirmasi ke admin kita"

### 7. CEK KETERSEDIAAN SLOT
Jika customer menyebut tanggal tertentu, cek daftar tanggal terpesan di bawah.
Jika tanggal sudah penuh: "Aduh Kak, tanggal tersebut sudah terpesan 😔 Tapi aku bisa cek alternatif tanggal lain, Kakak fleksibel di tanggal sekitarnya?"
Jika masih tersedia: "Tanggal tersebut masih tersedia Kak! Mau aku bantu reservasi sekarang?"

### 8. KAPAN ARAHKAN KE ADMIN
Arahkan ke admin HANYA setelah customer menunjukkan sinyal kuat mau booking.
Format: "Sip Kak! Untuk konfirmasi booking, langsung hubungi admin kami ya. Sebutkan paket [X] dan tanggal [Y] 🎉"

## GAYA BAHASA
- Informal tapi sopan. Mix Indonesia + sedikit English casual
- Pesan pendek dan padat. Maksimal 3-4 kalimat per pesan
- Emoji secukupnya — 1-2 per pesan cukup
- Hindari bullet point panjang kecuali sedang compare paket

## ATURAN KERAS
- JANGAN jawab topik di luar photobooth — alihkan dengan sopan
- JANGAN karang paket atau harga yang tidak ada di daftar
- JANGAN kasih diskon tanpa instruksi dari admin
- JANGAN bilang "aku tidak tahu" — selalu arahkan ke solusi atau tanya balik
{$slotSection}
=== DATA PAKET PHOTOBOOTH ===
{$paketList}
============================{$faqSection}
Ingat: Setiap respons harus punya SATU tujuan jelas — membawa customer lebih dekat ke booking.
PROMPT;
    }
}
