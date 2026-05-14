<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feedbacks', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('sumber')->nullable();          // how they found the studio
            $table->unsignedTinyInteger('rating_print');   // kecepatan print foto
            $table->unsignedTinyInteger('rating_foto');    // kualitas foto
            $table->unsignedTinyInteger('rating_staff');   // pelayanan staff photobooth
            $table->unsignedTinyInteger('rating_frame');   // hasil desain frame
            $table->unsignedTinyInteger('rating_admin');   // pelayanan admin (Minpoo)
            $table->string('rekomendasikan')->nullable();  // iya / ragu-ragu / tidak
            $table->string('pakai_lagi')->nullable();      // iya / ragu-ragu / tidak
            $table->text('saran')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feedbacks');
    }
};
