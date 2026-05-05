<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Logistic extends Model
{
    protected $fillable = ['nama', 'qty', 'harga', 'satuan', 'aktif'];

    protected $casts = ['aktif' => 'boolean', 'harga' => 'integer', 'qty' => 'integer'];

    public function logItems(): HasMany
    {
        return $this->hasMany(LogisticLogItem::class);
    }
}
