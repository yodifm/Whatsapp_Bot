<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Kiosk;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KioskController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Kiosk::orderBy('created_at')->get()->map(fn($k) => [
                'id'                  => $k->id,
                'name'                => $k->name,
                'wa_phone_number_id'  => $k->wa_phone_number_id,
                'wa_access_token'     => $k->wa_access_token ? '••••' . substr($k->wa_access_token, -6) : '',
                'wa_verify_token'     => $k->wa_verify_token,
                'ai_name'             => $k->ai_name,
                'ai_tone'             => $k->ai_tone,
                'studio_name'         => $k->studio_name,
                'bank_name'           => $k->bank_name,
                'bank_account_number' => $k->bank_account_number,
                'bank_account_holder' => $k->bank_account_holder,
                'aktif'               => $k->aktif,
                'ai_enabled'          => $k->ai_enabled,
                'created_at'          => $k->created_at->format('d M Y'),
            ])
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'                => 'required|string|max:100',
            'wa_phone_number_id'  => 'required|string|max:50|unique:kiosks',
            'wa_access_token'     => 'required|string|max:1000',
            'wa_verify_token'     => 'nullable|string|max:200',
            'ai_name'             => 'nullable|string|max:50',
            'ai_tone'             => 'nullable|in:sales,friendly,formal',
            'studio_name'         => 'nullable|string|max:100',
            'bank_name'           => 'nullable|string|max:100',
            'bank_account_number' => 'nullable|string|max:50',
            'bank_account_holder' => 'nullable|string|max:100',
        ]);

        $kiosk = Kiosk::create($validated + ['aktif' => true, 'ai_enabled' => true]);

        return response()->json(['message' => 'Kiosk berhasil dibuat.', 'id' => $kiosk->id], 201);
    }

    public function update(Request $request, Kiosk $kiosk): JsonResponse
    {
        $validated = $request->validate([
            'name'                => 'required|string|max:100',
            'wa_phone_number_id'  => 'required|string|max:50|unique:kiosks,wa_phone_number_id,' . $kiosk->id,
            'wa_access_token'     => 'nullable|string|max:1000',
            'wa_verify_token'     => 'nullable|string|max:200',
            'ai_name'             => 'nullable|string|max:50',
            'ai_tone'             => 'nullable|in:sales,friendly,formal',
            'studio_name'         => 'nullable|string|max:100',
            'bank_name'           => 'nullable|string|max:100',
            'bank_account_number' => 'nullable|string|max:50',
            'bank_account_holder' => 'nullable|string|max:100',
        ]);

        // Don't overwrite token if not provided (masked value sent back)
        if (empty($validated['wa_access_token']) || str_starts_with($validated['wa_access_token'], '••••')) {
            unset($validated['wa_access_token']);
        }

        $kiosk->update($validated);

        return response()->json(['message' => 'Kiosk berhasil diupdate.']);
    }

    public function toggle(Kiosk $kiosk): JsonResponse
    {
        $kiosk->update(['aktif' => ! $kiosk->aktif]);

        return response()->json(['aktif' => $kiosk->aktif]);
    }

    public function toggleAi(Kiosk $kiosk): JsonResponse
    {
        $kiosk->update(['ai_enabled' => ! $kiosk->ai_enabled]);

        return response()->json(['ai_enabled' => $kiosk->ai_enabled]);
    }

    public function destroy(Kiosk $kiosk): JsonResponse
    {
        $kiosk->delete();

        return response()->json(['message' => 'Kiosk dihapus.']);
    }
}
