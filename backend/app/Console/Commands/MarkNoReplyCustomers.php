<?php

namespace App\Console\Commands;

use App\Models\Customer;
use Illuminate\Console\Command;

class MarkNoReplyCustomers extends Command
{
    protected $signature   = 'customers:mark-no-reply {--hours=24 : Hours of silence before marking}';
    protected $description = 'Mark customers as no_reply_yet if AI asked for data but they did not reply';

    public function handle(): void
    {
        $hours    = (int) $this->option('hours');
        $cutoff   = now()->subHours($hours);
        $marked   = 0;

        // Candidates: interested customers whose last chat is from the AI
        Customer::where('status', 'interested')
            ->whereHas('latestChat', fn($q) => $q->where('role', 'assistant')->where('created_at', '<', $cutoff))
            ->whereDoesntHave('latestChat', fn($q) => $q->where('role', 'user')->where('created_at', '>=', $cutoff))
            ->each(function (Customer $customer) use (&$marked) {
                // Only flag if the last AI message looks like a data-collection form
                $lastMsg = $customer->latestChat?->content ?? '';
                if (str_contains($lastMsg, 'Nama:') || str_contains($lastMsg, 'Tanggal acara:') || str_contains($lastMsg, 'boleh isi data')) {
                    $customer->update(['status' => 'no_reply_yet']);
                    $marked++;
                }
            });

        $this->info("Marked {$marked} customer(s) as no_reply_yet.");
    }
}
