<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Discount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiscountController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Discount::orderBy('berlaku_sampai')->get()->map(fn($d) => [
                'id'             => $d->id,
                'nama'           => $d->nama,
                'tipe'           => $d->tipe,
                'nilai'          => $d->nilai,
                'label'          => $d->label,
                'berlaku_sampai' => $d->berlaku_sampai->format('Y-m-d'),
                'aktif'          => $d->aktif,
                'expired'        => $d->isExpired(),
            ])
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama'           => 'required|string|max:255',
            'tipe'           => 'required|in:potongan_harga,tambahan_waktu',
            'nilai'          => 'required|integer|min:1',
            'berlaku_sampai' => 'required|date|after:today',
            'aktif'          => 'boolean',
        ]);

        $discount = Discount::create($validated);

        return response()->json(array_merge($discount->toArray(), [
            'label'   => $discount->label,
            'expired' => false,
        ]), 201);
    }

    public function update(Request $request, Discount $discount): JsonResponse
    {
        $validated = $request->validate([
            'nama'           => 'sometimes|string|max:255',
            'tipe'           => 'sometimes|in:potongan_harga,tambahan_waktu',
            'nilai'          => 'sometimes|integer|min:1',
            'berlaku_sampai' => 'sometimes|date',
            'aktif'          => 'boolean',
        ]);

        $discount->update($validated);

        return response()->json(array_merge($discount->fresh()->toArray(), [
            'label'   => $discount->fresh()->label,
            'expired' => $discount->fresh()->isExpired(),
        ]));
    }

    public function destroy(Discount $discount): JsonResponse
    {
        $discount->delete();
        return response()->json(['message' => 'Diskon dihapus']);
    }
}
