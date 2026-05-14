<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Split old "lokasi | catatan" values that were concatenated before the lokasi column existed
        DB::table('bookings')
            ->whereNull('lokasi')
            ->whereNotNull('catatan')
            ->get()
            ->each(function ($booking) {
                $parts = explode(' | ', $booking->catatan, 2);
                DB::table('bookings')
                    ->where('id', $booking->id)
                    ->update([
                        'lokasi'  => trim($parts[0]) ?: null,
                        'catatan' => isset($parts[1]) ? trim($parts[1]) : null,
                    ]);
            });
    }

    public function down(): void {}
};
