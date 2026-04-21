<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Gallery extends Model
{
    protected $fillable = [
        'judul', 'file_path', 'thumbnail_path',
        'kategori', 'deskripsi', 'aktif', 'urutan',
    ];

    protected $casts = [
        'aktif'  => 'boolean',
        'urutan' => 'integer',
    ];

    public function getUrlAttribute(): string
    {
        return asset('storage/' . $this->file_path);
    }

    public function getThumbnailUrlAttribute(): string
    {
        return $this->thumbnail_path
            ? asset('storage/' . $this->thumbnail_path)
            : $this->url;
    }
}
