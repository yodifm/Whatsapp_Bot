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
        return response()->json(Package::orderBy('harga')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nama'       => 'required|string|max:100',
            'harga'      => 'required|integer|min:0',
            'durasi_jam' => 'required|integer|min:1|max:24',
            'fitur'      => 'nullable|array',
            'fitur.*'    => 'string|max:200',
            'aktif'      => 'boolean',
        ]);

        $package = Package::create($data);

        return response()->json($package, 201);
    }

    public function update(Request $request, Package $package): JsonResponse
    {
        $data = $request->validate([
            'nama'       => 'sometimes|string|max:100',
            'harga'      => 'sometimes|integer|min:0',
            'durasi_jam' => 'sometimes|integer|min:1|max:24',
            'fitur'      => 'nullable|array',
            'fitur.*'    => 'string|max:200',
            'aktif'      => 'boolean',
        ]);

        $package->update($data);

        return response()->json($package);
    }

    public function destroy(Package $package): JsonResponse
    {
        $package->delete();

        return response()->json(['message' => 'Paket dihapus.']);
    }
}
