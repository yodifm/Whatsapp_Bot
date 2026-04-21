<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('galleries', function (Blueprint $table) {
            $table->id();
            $table->string('judul');
            $table->string('file_path');
            $table->string('thumbnail_path')->nullable();
            $table->enum('kategori', ['wedding', 'birthday', 'corporate', 'other'])->default('other');
            $table->text('deskripsi')->nullable();
            $table->boolean('aktif')->default(true);
            $table->unsignedSmallInteger('urutan')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('galleries');
    }
};
