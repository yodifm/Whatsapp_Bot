<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kiosks', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('wa_phone_number_id')->unique();
            $table->text('wa_access_token');
            $table->string('wa_verify_token')->nullable();
            $table->string('ai_name')->default('Nadia');
            $table->string('ai_tone')->default('sales');
            $table->string('studio_name')->default('Waktunya Photobooth');
            $table->string('bank_name')->nullable();
            $table->string('bank_account_number')->nullable();
            $table->string('bank_account_holder')->nullable();
            $table->boolean('aktif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kiosks');
    }
};
