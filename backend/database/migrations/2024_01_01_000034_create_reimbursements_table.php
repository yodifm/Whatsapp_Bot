<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reimbursements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('booking_id')->nullable();
            $table->unsignedBigInteger('kiosk_id')->nullable();
            $table->string('nama_staff');
            $table->date('tanggal');
            $table->json('nama_customers')->nullable();     // array of customer names
            $table->text('kebutuhan_lainnya')->nullable();  // other needs description
            $table->unsignedBigInteger('jumlah');           // total reimbursement amount
            $table->text('tujuan');                         // purpose / breakdown
            $table->string('bukti_path')->nullable();       // optional file upload
            $table->string('status')->default('pending');   // pending / approved / rejected
            $table->text('catatan_admin')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reimbursements');
    }
};
