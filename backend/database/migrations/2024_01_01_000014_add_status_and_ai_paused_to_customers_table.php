<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->enum('status', ['new', 'interested', 'followup', 'booked', 'done'])
                  ->default('new')
                  ->after('nama');
            $table->boolean('ai_paused')->default(false)->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['status', 'ai_paused']);
        });
    }
};
