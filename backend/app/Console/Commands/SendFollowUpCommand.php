<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Models\ChatHistory;
use App\Models\Customer;
use App\Models\Setting;
use App\Services\WhatsAppService;
use Illuminate\Console\Command;

class SendFollowUpCommand extends Command
{
    protected $signature   = 'wa:followup';
    protected $description = 'Kirim follow-up kontekstual ke customer yang belum balas';

    public function handle(): void
    {
        if (! Setting::get('followup_enabled')) {
            $this->line('Follow-up dinonaktifkan.');
            return;
        }

        $delayHours = (int) (Setting::get('followup_delay_hours') ?: 3);
        $cutoff     = now()->subHours($delayHours);

        // Customers whose last message was FROM THEM (role=user), older than cutoff,
        // AI is not paused, and no handoff requested.
        $customers = Customer::where('ai_paused', false)
            ->where('handoff_requested', false)
            ->whereHas('chatHistories', function ($q) use ($cutoff) {
                $q->where('role', 'user')->where('created_at', '<=', $cutoff);
            })
            ->whereDoesntHave('chatHistories', function ($q) use ($cutoff) {
                $q->where('created_at', '>', $cutoff);
            })
            ->get()
            ->filter(function (Customer $c) use ($cutoff) {
                return is_null($c->last_followup_at) || $c->last_followup_at->lt($cutoff);
            });

        if ($customers->isEmpty()) {
            $this->line('Tidak ada customer yang perlu di-followup saat ini.');
            return;
        }

        $wa = new WhatsAppService();

        foreach ($customers as $customer) {
            try {
                $message = $this->buildContextualMessage($customer);
                if (! $message) continue;

                $wa->sendText($customer->whatsapp_id, $message);

                ChatHistory::create([
                    'customer_id' => $customer->id,
                    'role'        => 'assistant',
                    'content'     => '[Follow-up] ' . $message,
                ]);

                $customer->update(['last_followup_at' => now()]);
                $this->info("Follow-up → {$customer->nama} (+{$customer->whatsapp_id})");

            } catch (\Throwable $e) {
                $this->error("Gagal kirim ke {$customer->whatsapp_id}: {$e->getMessage()}");
            }
        }

        $this->info("Selesai. Total: {$customers->count()} customer.");
    }

    private function buildContextualMessage(Customer $customer): ?string
    {
        $history = $customer->chatHistories()->pluck('content')->toArray();
        $historyStr = implode(' ', $history);

        $pricelistSent = str_contains($historyStr, '[Pricelist dikirim]');
        $nama          = $customer->nama ? "kak {$customer->nama}" : 'kak';

        // Stage 3+: pricelist already sent — nudge toward booking or DP
        if ($pricelistSent) {
            $pendingBooking = Booking::where('customer_id', $customer->id)
                ->whereNotIn('status', ['cancelled', 'completed', 'dp_paid'])
                ->first();

            if ($pendingBooking) {
                $tanggal = $pendingBooking->tanggal->format('d M Y');
                return "Hai {$nama}! Slot tanggal *{$tanggal}* masih aman 😊 Kalau fix jadi, bisa DP dulu ya biar aman — sering rebutan tanggal soalnya!";
            }

            return "Hai {$nama}! Ada yang mau ditanyain dari pricelist yang tadi? Atau mau langsung cek ketersediaan tanggal? 😊";
        }

        // Stage 1: they messaged but never filled in data — gentle re-engage
        $dataSection = "Nama:\nTanggal acara:\nAcara:\nLokasi acara:";
        $context = $customer->ai_context ?? [];
        if (! empty($context['nama']) && ! empty($context['tanggal'])) {
            // Data collected but pricelist not yet sent (edge case) — skip follow-up
            return null;
        }

        // Default: early stage, just re-engage warmly
        $defaultMsg = Setting::get('followup_message')
            ?: "Hai {$nama}! Masih tertarik dengan photobooth? Isi data singkat ini ya biar aku bisa bantu cari paket yang pas 😊\n\n{$dataSection}";

        // Substitute {$nama} placeholder from settings if used
        return str_replace('{nama}', $nama, $defaultMsg);
    }
}
