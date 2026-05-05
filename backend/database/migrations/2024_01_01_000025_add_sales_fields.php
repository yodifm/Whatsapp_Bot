<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->unsignedInteger('biaya_transport')->default(0)->after('dp_amount');
            $table->unsignedInteger('biaya_staff')->default(0)->after('biaya_transport');
        });

        Schema::table('logistic_logs', function (Blueprint $table) {
            $table->foreignId('booking_id')->nullable()->after('checkout_log_id')
                ->constrained('bookings')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('logistic_logs', function (Blueprint $table) {
            $table->dropForeign(['booking_id']);
            $table->dropColumn('booking_id');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['biaya_transport', 'biaya_staff']);
        });
    }
};
