<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $primaryKey = 'key';
    protected $keyType    = 'string';
    public    $incrementing = false;

    protected $fillable = ['key', 'value'];

    public static function get(string $key, string $default = ''): string
    {
        return static::all_cached()[$key] ?? $default;
    }

    public static function set(string $key, string $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
        Cache::forget('settings:all');
    }

    /** All settings, cached for 5 minutes. */
    public static function all_cached(): array
    {
        return Cache::remember('settings:all', 300, fn() =>
            static::pluck('value', 'key')->toArray()
        );
    }
}
