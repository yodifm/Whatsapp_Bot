<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Booking extends Model
{
    protected $fillable = [
        'customer_id', 'package_id', 'no_whatsapp', 'email',
        'tanggal', 'jam_mulai', 'durasi_jam', 'nama_acara',
        'frame', 'warna_backdrop', 'catatan', 'status', 'dp_amount',
        'syarat_venue', 'syarat_pembayaran',
    ];

    protected $casts = [
        'tanggal'           => 'date',
        'dp_amount'         => 'integer',
        'durasi_jam'        => 'integer',
        'syarat_venue'      => 'boolean',
        'syarat_pembayaran' => 'boolean',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(Package::class);
    }
}
