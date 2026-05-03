<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('no_whatsapp')->nullable()->after('customer_id');
            $table->string('email')->nullable()->after('no_whatsapp');
            $table->enum('frame', ['2r', '4r'])->nullable()->after('nama_acara');
            $table->string('warna_backdrop')->nullable()->after('frame');
            $table->boolean('syarat_venue')->default(false)->after('catatan');
            $table->boolean('syarat_pembayaran')->default(false)->after('syarat_venue');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->string('email')->nullable()->after('nama');
            $table->string('no_whatsapp')->nullable()->after('email');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['no_whatsapp', 'email', 'frame', 'warna_backdrop', 'syarat_venue', 'syarat_pembayaran']);
        });
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['email', 'no_whatsapp']);
        });
    }
};
