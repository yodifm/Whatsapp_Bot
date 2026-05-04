<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    private array $keys = [
        'anthropic_api_key',
        'wa_access_token',
        'wa_phone_number_id',
        'wa_verify_token',
        'followup_enabled',
        'followup_delay_hours',
        'followup_message',
        'ai_name',
        'studio_name',
        'ai_tone',
        'bank_name',
        'bank_account_number',
        'bank_account_holder',
    ];

    public function index(): JsonResponse
    {
        $settings = [];
        foreach ($this->keys as $key) {
            $settings[$key] = Setting::get($key) ?? '';
        }

        // Cast ke tipe yang benar
        $settings['followup_enabled']      = (bool) $settings['followup_enabled'];
        $settings['followup_delay_hours']  = $settings['followup_delay_hours'] !== '' ? (int) $settings['followup_delay_hours'] : 3;

        return response()->json($settings);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'anthropic_api_key'   => 'nullable|string|max:500',
            'wa_access_token'     => 'nullable|string|max:500',
            'wa_phone_number_id'  => 'nullable|string|max:100',
            'wa_verify_token'     => 'nullable|string|max:200',
            'followup_enabled'    => 'nullable|boolean',
            'followup_delay_hours'=> 'nullable|integer|min:1|max:168',
            'followup_message'    => 'nullable|string|max:1000',
            'ai_name'             => 'nullable|string|max:50',
            'studio_name'         => 'nullable|string|max:100',
            'ai_tone'             => 'nullable|in:sales,friendly,formal',
            'bank_name'           => 'nullable|string|max:100',
            'bank_account_number' => 'nullable|string|max:50',
            'bank_account_holder' => 'nullable|string|max:100',
        ]);

        foreach ($validated as $key => $value) {
            if ($key === 'followup_enabled') {
                Setting::set($key, $value ? '1' : '0');
            } elseif (!is_null($value) && $value !== '') {
                Setting::set($key, $value);
            }
        }

        return response()->json(['message' => 'Pengaturan berhasil disimpan.']);
    }
}
