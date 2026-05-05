<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Booking extends Model
{
    protected $fillable = [
        'customer_id', 'package_id', 'no_whatsapp', 'email',
        'tanggal', 'jam_mulai', 'durasi_jam', 'nama_acara',
        'frame', 'warna_backdrop', 'catatan', 'status', 'dp_amount',
        'syarat_venue', 'syarat_pembayaran',
        'frame_design_url', 'frame_design_reference', 'frame_design_notified_at',
        'biaya_transport', 'biaya_staff',
    ];

    protected $casts = [
        'tanggal'                   => 'date',
        'dp_amount'                 => 'integer',
        'durasi_jam'                => 'integer',
        'syarat_venue'              => 'boolean',
        'syarat_pembayaran'         => 'boolean',
        'frame_design_notified_at'  => 'datetime',
        'biaya_transport'           => 'integer',
        'biaya_staff'               => 'integer',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(Package::class);
    }

    public function logisticLogs(): HasMany
    {
        return $this->hasMany(LogisticLog::class);
    }
}
