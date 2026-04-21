<?php

namespace App\Console\Commands;

use App\Models\ChatHistory;
use App\Models\Customer;
use App\Models\Setting;
use App\Services\WhatsAppService;
use Illuminate\Console\Command;

class SendFollowUpCommand extends Command
{
    protected $signature   = 'wa:followup';
    protected $description = 'Kirim follow-up otomatis ke customer yang belum balas';

    public function handle(): void
    {
        if (!Setting::get('followup_enabled')) {
            $this->line('Follow-up dinonaktifkan.');
            return;
        }

        $delayHours = (int) (Setting::get('followup_delay_hours') ?: 3);
        $message    = Setting::get('followup_message')
            ?: 'Halo Kak 👋 Masih ada yang bisa kami bantu? Kami siap membantu Kakak menemukan paket photobooth yang pas 😊';

        $cutoff = now()->subHours($delayHours);

        // Cari customer yang:
        // 1. Pesan terakhir dari customer (role=user) sudah lebih dari X jam lalu
        // 2. Belum pernah di-followup sejak pesan terakhir customer
        $customers = Customer::with(['chatHistories' => fn($q) => $q->latest()->limit(1)])
            ->whereHas('chatHistories', function ($q) use ($cutoff) {
                $q->where('role', 'user')->where('created_at', '<=', $cutoff);
            })
            ->whereDoesntHave('chatHistories', function ($q) use ($cutoff) {
                // Pastikan tidak ada pesan masuk setelah cutoff
                $q->where('created_at', '>', $cutoff);
            })
            ->get()
            ->filter(function (Customer $c) use ($cutoff) {
                // Jangan kirim lagi kalau follow-up terakhir sudah dikirim setelah pesan terakhir customer
                return is_null($c->last_followup_at) || $c->last_followup_at->lt($cutoff);
            });

        if ($customers->isEmpty()) {
            $this->line('Tidak ada customer yang perlu di-followup saat ini.');
            return;
        }

        $wa = new WhatsAppService();

        foreach ($customers as $customer) {
            try {
                $wa->sendText($customer->whatsapp_id, $message);

                // Catat ke chat history
                ChatHistory::create([
                    'customer_id' => $customer->id,
                    'role'        => 'assistant',
                    'content'     => '[Follow-up otomatis] ' . $message,
                ]);

                $customer->update(['last_followup_at' => now()]);

                $this->info("Follow-up terkirim ke: {$customer->nama} (+{$customer->whatsapp_id})");
            } catch (\Throwable $e) {
                $this->error("Gagal kirim ke {$customer->whatsapp_id}: {$e->getMessage()}");
            }
        }

        $this->info("Selesai. Total: {$customers->count()} customer.");
    }
}
