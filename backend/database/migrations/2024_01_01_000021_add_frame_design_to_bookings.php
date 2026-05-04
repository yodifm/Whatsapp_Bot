<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('frame_design_url')->nullable()->after('warna_backdrop');
            $table->text('frame_design_reference')->nullable()->after('frame_design_url');
            $table->timestamp('frame_design_notified_at')->nullable()->after('frame_design_reference');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['frame_design_url', 'frame_design_reference', 'frame_design_notified_at']);
        });
    }
};
