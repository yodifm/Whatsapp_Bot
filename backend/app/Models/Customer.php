<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    protected $fillable = ['whatsapp_id', 'nama', 'status', 'ai_paused', 'last_followup_at'];

    protected $casts = [
        'last_followup_at' => 'datetime',
        'ai_paused'        => 'boolean',
    ];

    public function chatHistories(): HasMany
    {
        return $this->hasMany(ChatHistory::class)->orderBy('created_at');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(\App\Models\Booking::class);
    }
}
