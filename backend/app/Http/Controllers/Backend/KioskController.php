<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Kiosk;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class KioskController extends Controller
{
    private function mapKiosk(Kiosk $k): array
    {
        return [
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
            'pricelist_url'       => $k->pricelist_url,
            'pricelist_cdn_url'   => $k->pricelist_cdn_url,
            'aktif'               => $k->aktif,
            'ai_enabled'          => $k->ai_enabled,
            'ai_mode'             => $k->ai_mode ?? 'active',
            'created_at'          => $k->created_at->format('d M Y'),
        ];
    }

    public function index(): JsonResponse
    {
        return response()->json(
            Kiosk::orderBy('created_at')->get()->map(fn($k) => $this->mapKiosk($k))
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
            'ai_tone'             => 'nullable|string|max:200',
            'studio_name'         => 'nullable|string|max:100',
            'bank_name'           => 'nullable|string|max:100',
            'bank_account_number' => 'nullable|string|max:50',
            'bank_account_holder' => 'nullable|string|max:100',
            'pricelist_cdn_url'   => 'nullable|url|max:1000',
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
            'ai_tone'             => 'nullable|string|max:200',
            'studio_name'         => 'nullable|string|max:100',
            'bank_name'           => 'nullable|string|max:100',
            'bank_account_number' => 'nullable|string|max:50',
            'bank_account_holder' => 'nullable|string|max:100',
            'pricelist_cdn_url'   => 'nullable|url|max:1000',
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
        // Cycle: active → human → test → active
        $next = match ($kiosk->ai_mode ?? 'active') {
            'active' => 'human',
            'human'  => 'test',
            default  => 'active',
        };

        $kiosk->update([
            'ai_mode'    => $next,
            'ai_enabled' => $next === 'active',
        ]);

        return response()->json(['ai_mode' => $next]);
    }

    public function uploadPricelist(Request $request, Kiosk $kiosk): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        // Delete old file if exists
        if ($kiosk->pricelist_path) {
            $oldPath = public_path('pricelists/' . $kiosk->pricelist_path);
            if (file_exists($oldPath)) unlink($oldPath);
        }

        $dir = public_path('pricelists');
        if (! is_dir($dir)) mkdir($dir, 0755, true);

        $ext      = $request->file('file')->getClientOriginalExtension();
        $filename = 'kiosk-' . $kiosk->id . '-' . time() . '.' . $ext;
        $request->file('file')->move($dir, $filename);

        $kiosk->update(['pricelist_path' => $filename]);

        return response()->json([
            'message'      => 'Pricelist berhasil diupload.',
            'pricelist_url'=> $kiosk->fresh()->pricelist_url,
        ]);
    }

    public function destroy(Kiosk $kiosk): JsonResponse
    {
        if ($kiosk->pricelist_path) {
            $path = public_path('pricelists/' . $kiosk->pricelist_path);
            if (file_exists($path)) unlink($path);
        }

        $kiosk->delete();

        return response()->json(['message' => 'Kiosk dihapus.']);
    }
}
