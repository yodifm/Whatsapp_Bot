<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('logistic_logs', function (Blueprint $table) {
            $table->enum('type', ['checkout', 'return'])->default('checkout')->after('id');
            $table->foreignId('checkout_log_id')->nullable()->after('catatan')
                ->constrained('logistic_logs')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('logistic_logs', function (Blueprint $table) {
            $table->dropForeign(['checkout_log_id']);
            $table->dropColumn(['type', 'checkout_log_id']);
        });
    }
};
