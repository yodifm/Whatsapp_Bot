<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            // Stores known lead data across sessions: nama, tanggal, acara, lokasi, paket, venue info
            $table->json('ai_context')->nullable()->after('last_followup_at');
            // A/B prompt variant — assigned randomly on first message
            $table->string('ab_variant', 1)->default('A')->after('ai_context');
            // Set when customer requests human agent; admin clears it
            $table->boolean('handoff_requested')->default(false)->after('ab_variant');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['ai_context', 'ab_variant', 'handoff_requested']);
        });
    }
};
