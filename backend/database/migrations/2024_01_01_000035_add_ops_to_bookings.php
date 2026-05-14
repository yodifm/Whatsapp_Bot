<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->boolean('kirim_invoice')->default(false)->after('dp_amount');
            $table->boolean('sudah_dp')->default(false)->after('kirim_invoice');
            $table->boolean('pelunasan')->default(false)->after('sudah_dp');
            $table->bigInteger('jumlah_pelunasan')->nullable()->after('pelunasan');
            $table->json('type_booth')->nullable()->after('jumlah_pelunasan');
            $table->string('printer', 100)->nullable()->after('type_booth');
            $table->string('transport', 100)->nullable()->after('printer');
            $table->decimal('total_jarak', 8, 1)->nullable()->after('transport');
            $table->json('staff_operasional')->nullable()->after('total_jarak');
            $table->text('additional_info')->nullable()->after('staff_operasional');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn([
                'kirim_invoice', 'sudah_dp', 'pelunasan', 'jumlah_pelunasan',
                'type_booth', 'printer', 'transport', 'total_jarak',
                'staff_operasional', 'additional_info',
            ]);
        });
    }
};
