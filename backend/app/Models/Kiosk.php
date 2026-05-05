<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kiosk extends Model
{
    protected $fillable = [
        'name', 'wa_phone_number_id', 'wa_access_token', 'wa_verify_token',
        'ai_name', 'ai_tone', 'studio_name',
        'bank_name', 'bank_account_number', 'bank_account_holder',
        'aktif',
    ];

    protected $casts = [
        'aktif' => 'boolean',
    ];

    protected $hidden = [
        'wa_access_token',
    ];
}
