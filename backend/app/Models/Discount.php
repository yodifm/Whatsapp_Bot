<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Discount extends Model
{
    protected $fillable = ['nama', 'tipe', 'nilai', 'berlaku_sampai', 'aktif'];

    protected $casts = [
        'berlaku_sampai' => 'date',
        'aktif'          => 'boolean',
        'nilai'          => 'integer',
    ];

    public function isExpired(): bool
    {
        return $this->berlaku_sampai->isPast();
    }

    public function getLabelAttribute(): string
    {
        if ($this->tipe === 'potongan_harga') {
            return 'Diskon Rp ' . number_format($this->nilai, 0, ',', '.');
        }
        return 'Tambahan ' . $this->nilai . ' menit';
    }
}
