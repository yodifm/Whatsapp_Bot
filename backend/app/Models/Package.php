<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Package extends Model
{
    protected $fillable = ['nama', 'harga', 'durasi_jam', 'fitur', 'aktif'];

    protected $casts = [
        'fitur' => 'array',
        'aktif' => 'boolean',
    ];
}
