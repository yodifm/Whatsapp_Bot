<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class LogisticLog extends Model
{
    protected $fillable = ['type', 'staff_nama', 'event_nama', 'tanggal', 'catatan', 'checkout_log_id'];

    protected $casts = ['tanggal' => 'date'];

    public function items(): HasMany
    {
        return $this->hasMany(LogisticLogItem::class, 'log_id');
    }

    /** The return log filed against this checkout. */
    public function returnLog(): HasOne
    {
        return $this->hasOne(LogisticLog::class, 'checkout_log_id');
    }

    /** The original checkout this return belongs to. */
    public function checkoutLog(): BelongsTo
    {
        return $this->belongsTo(LogisticLog::class, 'checkout_log_id');
    }
}
