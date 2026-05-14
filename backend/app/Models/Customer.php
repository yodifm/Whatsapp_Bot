<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    protected $fillable = [
        'whatsapp_id', 'nama', 'email', 'no_whatsapp', 'status',
        'ai_paused', 'last_followup_at', 'ai_context', 'ab_variant', 'handoff_requested',
    ];

    protected $casts = [
        'last_followup_at'  => 'datetime',
        'ai_paused'         => 'boolean',
        'handoff_requested' => 'boolean',
        'ai_context'        => 'array',
    ];

    public function chatHistories(): HasMany
    {
        return $this->hasMany(ChatHistory::class)->orderBy('created_at');
    }

    public function latestChat(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(ChatHistory::class)->latestOfMany('id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(\App\Models\Booking::class);
    }
}
