<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reimbursement extends Model
{
    protected $fillable = [
        'booking_id', 'kiosk_id', 'nama_staff', 'tanggal',
        'nama_customers', 'kebutuhan_lainnya', 'jumlah', 'tujuan',
        'bukti_path', 'status', 'catatan_admin',
    ];

    protected $casts = [
        'tanggal'        => 'date',
        'jumlah'         => 'integer',
        'nama_customers' => 'array',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function kiosk(): BelongsTo
    {
        return $this->belongsTo(Kiosk::class);
    }
}
