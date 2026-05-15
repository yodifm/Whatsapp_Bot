<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE customers MODIFY COLUMN status ENUM('new','interested','followup','booked','done','no_reply_yet') NOT NULL DEFAULT 'new'");
    }

    public function down(): void
    {
        // Move no_reply_yet back to interested before removing the value
        DB::statement("UPDATE customers SET status = 'interested' WHERE status = 'no_reply_yet'");
        DB::statement("ALTER TABLE customers MODIFY COLUMN status ENUM('new','interested','followup','booked','done') NOT NULL DEFAULT 'new'");
    }
};
