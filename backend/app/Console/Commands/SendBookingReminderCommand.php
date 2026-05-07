<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Services\WhatsAppService;
use Illuminate\Console\Command;

class SendBookingReminderCommand extends Command
{
    protected $signature   = 'wa:reminder';
    protected $description = 'Kirim reminder H-7, H-3, H-1 ke customer yang punya booking mendatang';

    private const DAYS = [7, 3, 1];

    public function handle(): void
    {
        $wa    = new WhatsAppService();
        $today = now()->toDateString();
        $total = 0;

        foreach (self::DAYS as $d) {
            $target = now()->addDays($d)->toDateString();

            $bookings = Booking::with(['customer', 'package'])
                ->whereNotIn('status', ['cancelled', 'completed'])
                ->where('tanggal', $target)
                ->whereNotNull('customer_id')
                ->get();

            foreach ($bookings as $booking) {
                $customer = $booking->customer;
                if (!$customer || !$customer->whatsapp_id) continue;

                $waId   = $customer->whatsapp_id;
                $nama   = $customer->nama ?? 'Kakak';
                $paket  = $booking->package?->nama ?? '-';
                $tgl    = $booking->tanggal->format('d M Y');
                $jam    = $booking->jam_mulai ?? '-';
                $acara  = $booking->nama_acara ?? '-';

                $msg = $this->buildMessage($d, $nama, $paket, $tgl, $jam, $acara);

                try {
                    $wa->sendText($waId, $msg);
                    $this->info("H-{$d} reminder terkirim → {$nama} (+{$waId}) tgl {$tgl}");
                    $total++;
                } catch (\Throwable $e) {
                    $this->error("Gagal kirim ke {$waId}: {$e->getMessage()}");
                }
            }
        }

        $this->info("Selesai. Total reminder terkirim: {$total}");
    }

    private function buildMessage(int $days, string $nama, string $paket, string $tgl, string $jam, string $acara): string
    {
        $header = match ($days) {
            7 => "📅 *Reminder H-7 — 1 Minggu Lagi!*",
            3 => "⏰ *Reminder H-3 — 3 Hari Lagi!*",
            1 => "🔔 *Reminder H-1 — Besok Acara!*",
        };

        $tips = match ($days) {
            7 => "Pastikan semua persiapan sudah berjalan dengan baik ya Kak 😊",
            3 => "Jangan lupa siapkan outfit dan dekorasi tambahan kalau ada ya Kak!",
            1 => "Sampai jumpa besok! Tim kami akan hadir tepat waktu. Jika ada pertanyaan, hubungi kami segera.",
        };

        return <<<MSG
{$header}

Halo *{$nama}* 👋

Kami mengingatkan bahwa acara Anda sudah dekat:

📌 *Acara:* {$acara}
📦 *Paket:* {$paket}
📅 *Tanggal:* {$tgl}
⏰ *Jam Mulai:* {$jam}

{$tips}

Terima kasih telah mempercayakan momen spesial Anda kepada kami! 🎉
MSG;
    }
}
