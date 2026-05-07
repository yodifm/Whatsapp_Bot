<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Package;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PackageController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Package::with('kiosk:id,name')->orderBy('kiosk_id')->orderBy('harga')->get()
                ->map(fn($p) => [
                    'id'         => $p->id,
                    'kiosk_id'   => $p->kiosk_id,
                    'kiosk_name' => $p->kiosk?->name,
                    'nama'       => $p->nama,
                    'harga'      => $p->harga,
                    'durasi_jam' => $p->durasi_jam,
                    'fitur'      => $p->fitur,
                    'aktif'      => $p->aktif,
                ])
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'kiosk_id'   => 'nullable|exists:kiosks,id',
            'nama'       => 'required|string|max:100',
            'harga'      => 'required|integer|min:0',
            'durasi_jam' => 'required|integer|min:1|max:24',
            'fitur'      => 'nullable|array',
            'fitur.*'    => 'string|max:200',
            'aktif'      => 'boolean',
        ]);

        $package = Package::create($data);
        $package->load('kiosk:id,name');

        return response()->json([
            'id'         => $package->id,
            'kiosk_id'   => $package->kiosk_id,
            'kiosk_name' => $package->kiosk?->name,
            'nama'       => $package->nama,
            'harga'      => $package->harga,
            'durasi_jam' => $package->durasi_jam,
            'fitur'      => $package->fitur,
            'aktif'      => $package->aktif,
        ], 201);
    }

    public function update(Request $request, Package $package): JsonResponse
    {
        $data = $request->validate([
            'kiosk_id'   => 'nullable|exists:kiosks,id',
            'nama'       => 'sometimes|string|max:100',
            'harga'      => 'sometimes|integer|min:0',
            'durasi_jam' => 'sometimes|integer|min:1|max:24',
            'fitur'      => 'nullable|array',
            'fitur.*'    => 'string|max:200',
            'aktif'      => 'boolean',
        ]);

        $package->update($data);
        $package->load('kiosk:id,name');

        return response()->json([
            'id'         => $package->id,
            'kiosk_id'   => $package->kiosk_id,
            'kiosk_name' => $package->kiosk?->name,
            'nama'       => $package->nama,
            'harga'      => $package->harga,
            'durasi_jam' => $package->durasi_jam,
            'fitur'      => $package->fitur,
            'aktif'      => $package->aktif,
        ]);
    }

    public function destroy(Package $package): JsonResponse
    {
        $package->delete();

        return response()->json(['message' => 'Paket dihapus.']);
    }
}
