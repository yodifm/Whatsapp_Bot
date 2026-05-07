<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Cek follow-up setiap 15 menit
Schedule::command('wa:followup')->everyFifteenMinutes();

// Reminder H-7, H-3, H-1 setiap hari jam 09:00
Schedule::command('wa:reminder')->dailyAt('09:00');
