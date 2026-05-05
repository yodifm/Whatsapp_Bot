<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LogisticLog extends Model
{
    protected $fillable = ['staff_nama', 'event_nama', 'tanggal', 'catatan'];

    protected $casts = ['tanggal' => 'date'];

    public function items(): HasMany
    {
        return $this->hasMany(LogisticLogItem::class, 'log_id');
    }
}
