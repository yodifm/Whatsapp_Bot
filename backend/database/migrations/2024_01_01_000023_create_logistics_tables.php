<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('logistics', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->integer('qty')->default(0);
            $table->decimal('harga', 12, 0)->default(0);
            $table->string('satuan')->default('pcs');
            $table->boolean('aktif')->default(true);
            $table->timestamps();
        });

        Schema::create('logistic_logs', function (Blueprint $table) {
            $table->id();
            $table->string('staff_nama');
            $table->string('event_nama')->nullable();
            $table->date('tanggal');
            $table->text('catatan')->nullable();
            $table->timestamps();
        });

        Schema::create('logistic_log_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('log_id')->constrained('logistic_logs')->cascadeOnDelete();
            $table->foreignId('logistic_id')->nullable()->nullOnDelete()->constrained('logistics');
            $table->string('nama_barang');
            $table->integer('qty');
            $table->decimal('harga_satuan', 12, 0)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('logistic_log_items');
        Schema::dropIfExists('logistic_logs');
        Schema::dropIfExists('logistics');
    }
};
