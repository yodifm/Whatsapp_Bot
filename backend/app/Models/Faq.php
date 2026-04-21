<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Faq extends Model
{
    protected $fillable = ['pertanyaan', 'jawaban', 'kategori', 'urutan', 'aktif'];

    protected $casts = [
        'aktif'  => 'boolean',
        'urutan' => 'integer',
    ];
}
