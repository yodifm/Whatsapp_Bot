<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    protected $fillable = [
        'kiosk_id', 'booking_id', 'nama', 'sumber',
        'rating_print', 'rating_foto', 'rating_staff', 'rating_frame', 'rating_admin',
        'rekomendasikan', 'pakai_lagi', 'saran',
    ];
}
