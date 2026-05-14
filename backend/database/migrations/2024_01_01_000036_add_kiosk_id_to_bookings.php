<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->foreignId('kiosk_id')->nullable()->constrained('kiosks')->nullOnDelete()->after('type_booth');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeignIdFor(\App\Models\Kiosk::class);
            $table->dropColumn('kiosk_id');
        });
    }
};
