<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Package extends Model
{
    protected $fillable = ['kiosk_id', 'nama', 'harga', 'durasi_jam', 'fitur', 'aktif'];

    protected $casts = [
        'fitur' => 'array',
        'aktif' => 'boolean',
    ];

    public function kiosk(): BelongsTo
    {
        return $this->belongsTo(Kiosk::class);
    }
}
