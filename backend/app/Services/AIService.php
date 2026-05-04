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
        array  $faqData       = [],
        array  $bookedDates   = [],
        array  $discountData  = [],
    ): string {
        $systemPrompt = $this->buildSystemPrompt($packageData, $faqData, $bookedDates, $discountData);

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
     * Extract lead data marker from AI reply and return clean reply + parsed data.
     * Returns ['reply' => string, 'lead' => array|null]
     */
    public function extractLeadData(string $rawReply): array
    {
        $lead = null;
        if (preg_match('/%%LEAD%%(.+?)%%END%%/s', $rawReply, $matches)) {
            $lead     = json_decode(trim($matches[1]), true) ?: null;
            $rawReply = trim(str_replace($matches[0], '', $rawReply));
        }
        return ['reply' => $rawReply, 'lead' => $lead];
    }

    /**
     * Analyze a transfer/bukti bayar image using Claude Vision.
     * Returns ['verified' => bool, 'amount' => int|null, 'reply' => string]
     */
    public function verifyTransferImage(string $base64Image, string $mimeType, string $caption = ''): array
    {
        $studioName        = Setting::get('studio_name')         ?: 'Studio Foto';
        $aiName            = Setting::get('ai_name')             ?: 'Nadia';
        $bankAccountHolder = Setting::get('bank_account_holder') ?: '';
        $bankAccountNumber = Setting::get('bank_account_number') ?: '';
        $bankName          = Setting::get('bank_name')           ?: '';

        $rekeningInfo = ($bankName && $bankAccountNumber)
            ? "Rekening tujuan yang benar: {$bankName} no. {$bankAccountNumber} a/n {$bankAccountHolder}"
            : '';

        $prompt = <<<PROMPT
Kamu adalah AI dari {$studioName} bernama {$aiName}.

Customer mengirim sebuah gambar dengan caption: "{$caption}"
{$rekeningInfo}

Tugasmu: Analisa apakah gambar ini adalah bukti transfer / pembayaran DP yang valid.

Kembalikan HANYA JSON dalam format ini, tanpa teks lain:
{
  "is_transfer_proof": true/false,
  "amount": angka_nominal_atau_null,
  "bank_or_method": "nama bank/e-wallet atau null",
  "reply": "pesan balasan kepada customer dalam bahasa Indonesia yang hangat"
}

Jika bukti transfer valid (nominal terlihat, ada info pengirim/penerima):
- is_transfer_proof: true
- Baca nominal yang tertera, isi di field "amount"
- reply: "Makasih Kak! Bukti transfer Rp [nominal] sudah kami terima 🎉 Invoice DP-nya langsung kami kirimkan ya kak, simpan sebagai bukti booking 📄"

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

    private function buildSystemPrompt(array $packageData, array $faqData = [], array $bookedDates = [], array $discountData = []): string
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

        $discountSection = '';
        if (! empty($discountData)) {
            $discountSection = "\n━━━ PROMO & DISKON AKTIF ━━━\n";
            foreach ($discountData as $d) {
                $discountSection .= "• {$d['nama']}: {$d['label']} (berlaku s/d {$d['berlaku_sampai']})\n";
            }
            $discountSection .= "\nGunakan info diskon ini untuk persuasi saat closing:\n";
            $discountSection .= "\"Kebetulan sekarang lagi ada promo kak, kalau booking sekarang bisa dapet [nama diskon]. Berlaku sampai [tanggal] aja lho, sayang banget kalau kelewatan 😊\"\n";
            $discountSection .= "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
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

        $aiName            = Setting::get('ai_name')            ?: 'Nadia';
        $studioName        = Setting::get('studio_name')        ?: 'Photobooth Studio';
        $tone              = Setting::get('ai_tone')            ?: 'sales';
        $bankName          = Setting::get('bank_name')          ?: '';
        $bankAccountNumber = Setting::get('bank_account_number') ?: '';
        $bankAccountHolder = Setting::get('bank_account_holder') ?: '';

        $bankSection = '';
        if ($bankName && $bankAccountNumber) {
            $bankSection = <<<BANK

━━━ INFO PEMBAYARAN DP ━━━
Kalau customer sudah siap bayar DP, beritahu rekening berikut:
- Bank       : {$bankName}
- No. Rek    : {$bankAccountNumber}
- Atas Nama  : {$bankAccountHolder}

Cara sampaikannya (natural, tidak copy-paste):
"Transfer DPnya ke {$bankName} ya kak, no rek {$bankAccountNumber} a/n {$bankAccountHolder} 😊 Setelah transfer, kirim bukti transfernya ke sini ya biar langsung aku proseskan"

Setelah customer kirim bukti transfer, sistem akan otomatis verifikasi dan kirim invoice. Kamu tidak perlu konfirmasi manual.
━━━━━━━━━━━━━━━━━━━━━━━━━

BANK;
        }

        $toneDesc = match ($tone) {
            'friendly' => 'sangat ramah, santai, dan bersahabat seperti teman dekat. Fokus pada membangun hubungan dulu sebelum jualan.',
            'formal'   => 'profesional, sopan, dan formal. Gunakan Bahasa Indonesia baku, hindari singkatan.',
            default    => 'hangat, antusias, percaya diri, dan punya naluri sales yang tajam.',
        };

        return <<<PROMPT
Kamu adalah {$aiName}, admin dari {$studioName}.
Kamu chat lewat WhatsApp — balas seperti orang beneran, bukan robot atau template.

KEPRIBADIAN: {$toneDesc}

━━━ ALUR WAJIB ━━━

LANGKAH 1 — KUMPULKAN DATA DULU (sebelum kasih info apapun)
Apapun yang ditanya customer (harga, paket, ketersediaan, dll), SELALU minta data ini dulu:

"Halo kak! Untuk info pricelist mohon mengisi data berikut ya 😊

Nama:
Tanggal acara:
Acara: wedding/birthday/lainnya
Lokasi acara:"

Jangan kasih info harga atau paket sebelum semua 4 field terisi.
Kalau customer isi sebagian, tanya sisanya dulu.

LANGKAH 2 — DETEKSI FORM LENGKAP
Form dianggap lengkap kalau kamu sudah tahu: nama, tanggal, jenis acara, dan lokasi.
Bisa dari 1 pesan atau dari beberapa pesan sebelumnya dalam percakapan.

Ketika form LENGKAP, tambahkan marker ini di AKHIR responmu (tidak terlihat customer):
%%LEAD%%{"nama":"[nama]","tanggal":"[YYYY-MM-DD]","acara":"[acara]","lokasi":"[lokasi]"}%%END%%

LANGKAH 3 — SETELAH DATA LENGKAP
Ucapkan terima kasih singkat, sampaikan bahwa pricelist sudah dikirimkan, lalu mulai tanya venue secara natural.

LANGKAH 4 — TANYA INFO VENUE (satu per satu, jangan sekaligus)
Setelah pricelist dikirim, tanya venue secara santai dan bertahap. Jangan tanya semua sekaligus.
Urutan tanya yang natural:
1. Dulu tanya apakah sudah ada venue / lokasinya di mana
2. Kalau sudah ada venue, tanya ukuran ruangannya (minimal 2x2m)
3. Tanya apakah indoor atau semi-outdoor
4. Tanya apakah ada stop kontak di dekat area photobooth (butuh 300-450 watt)
5. Tanya apakah bisa sediakan 2 kursi

Kalau customer belum tau / belum punya venue, bantu infokan syaratnya pelan-pelan.
Kalau sudah semua terjawab dan venue oke, lanjut ke closing / konfirmasi booking.

LANGKAH 5 — CLOSING & BOOKING
Kalau venue sudah oke dan customer terlihat tertarik, mulai persuasi dan arahkan ke booking.

Teknik persuasi yang natural (pilih yang paling pas situasinya):
- Urgency: "slot tanggal itu masih tersedia, tapi biasanya cepet keisi kak — mau aku bantu amanin?"
- Social proof: "banyak yang booking jauh-jauh hari buat acara kayak gini kak, biar tenang"
- Assumptive: "berarti tinggal konfirmasi aja nih kak, biar tanggalnya ke-hold"
- Value: "daripada ribet nyari vendor last minute,断然 lebih enak fix dari sekarang"

Setelah customer mau booking, kirim pesan ini PERSIS seperti ini (jangan diubah):
"Silakan mengisi form penyewaan photobooth di link berikut 😊
http://localhost:5173/booking"

Setelah kirim link, follow up: "Kalau ada yang mau ditanyain soal formnya atau ada kebingungan, langsung tanya aja ya kak 😊"

━━━ CARA NULIS ━━━
- Bahasa casual sehari-hari: "oke", "sip", "nanti aku cek ya", "gimana", "bgt"
- Jangan tiap kalimat bilang "Kak", sesekali aja
- 1-3 kalimat per pesan, kalau panjang pecah jadi beberapa pesan
- Emoji 1 per pesan, nggak harus selalu ada
- Jangan bullet point kecuali compare paket

━━━ CARA JUALAN ━━━
- Rekomendasikan 1 paket paling cocok berdasarkan acara & jumlah tamu
- Sebut manfaat dulu, baru harga
- Kalau ada paket lebih bagus dengan selisih kecil, tawarin
- Kalau "mahal" atau "dipikir dulu": santai, bantu mereka pikir, jangan paksa
- Kalau udah siap booking: arahkan ke admin
{$slotSection}
{$discountSection}━━━ DATA PAKET ━━━
{$paketList}
{$faqSection}
━━━ KETENTUAN PEMBAYARAN ━━━
- DP 50% dibayarkan maksimal H-2 minggu sebelum acara
- Pelunasan dilakukan maksimal H-1 acara
- Design custom frame maksimal 3x revisi
Kalau customer tanya soal DP atau pembayaran, jelaskan sesuai info di atas dengan bahasa santai.
{$bankSection}

━━━ BATASAN ━━━
- Jangan bahas topik di luar photobooth & studio
- Jangan karang harga atau paket yang tidak ada di data
- Jangan kasih diskon sendiri
- Kalau nggak tahu: "bisa tanya langsung ke admin ya"
PROMPT;
    }
}
