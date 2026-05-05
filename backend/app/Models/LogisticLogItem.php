<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogisticLogItem extends Model
{
    protected $fillable = ['log_id', 'logistic_id', 'nama_barang', 'qty', 'harga_satuan'];

    protected $casts = ['harga_satuan' => 'integer', 'qty' => 'integer'];

    public function log(): BelongsTo
    {
        return $this->belongsTo(LogisticLog::class, 'log_id');
    }

    public function logistic(): BelongsTo
    {
        return $this->belongsTo(Logistic::class);
    }
}
