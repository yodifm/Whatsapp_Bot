<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('package_id')->nullable()->constrained()->nullOnDelete();
            $table->date('tanggal');
            $table->time('jam_mulai')->nullable();
            $table->unsignedTinyInteger('durasi_jam')->nullable();
            $table->string('nama_acara')->nullable();
            $table->text('catatan')->nullable();
            $table->enum('status', ['pending', 'confirmed', 'dp_paid', 'completed', 'cancelled'])->default('pending');
            $table->unsignedBigInteger('dp_amount')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
