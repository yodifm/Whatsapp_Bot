<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kiosk extends Model
{
    protected $fillable = [
        'name', 'wa_phone_number_id', 'wa_access_token', 'wa_verify_token',
        'ai_name', 'ai_tone', 'studio_name',
        'bank_name', 'bank_account_number', 'bank_account_holder',
        'pricelist_path', 'pricelist_cdn_url', 'aktif', 'ai_enabled', 'ai_mode',
    ];

    public function getPricelistUrlAttribute(): ?string
    {
        return $this->pricelist_path ? url('pricelists/' . $this->pricelist_path) : null;
    }

    public function getPricelistFilePathAttribute(): ?string
    {
        return $this->pricelist_path ? public_path('pricelists/' . $this->pricelist_path) : null;
    }

    protected $casts = [
        'aktif'      => 'boolean',
        'ai_enabled' => 'boolean',
    ];

    protected $hidden = [
        'wa_access_token',
    ];
}
