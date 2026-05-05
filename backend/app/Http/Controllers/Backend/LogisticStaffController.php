<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Logistic;
use App\Models\LogisticLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LogisticStaffController extends Controller
{
    public function items(): JsonResponse
    {
        $items = Logistic::where('aktif', true)->orderBy('nama')->get(['id', 'nama', 'harga', 'satuan', 'qty']);

        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'staff_nama' => 'required|string|max:100',
            'event_nama' => 'nullable|string|max:200',
            'tanggal'    => 'required|date',
            'catatan'    => 'nullable|string|max:1000',
            'items'      => 'required|array|min:1',
            'items.*.logistic_id' => 'required|exists:logistics,id',
            'items.*.qty'         => 'required|integer|min:1',
        ]);

        $log = LogisticLog::create([
            'staff_nama' => $validated['staff_nama'],
            'event_nama' => $validated['event_nama'] ?? null,
            'tanggal'    => $validated['tanggal'],
            'catatan'    => $validated['catatan'] ?? null,
        ]);

        foreach ($validated['items'] as $row) {
            $logistic = Logistic::find($row['logistic_id']);
            $log->items()->create([
                'logistic_id'  => $logistic->id,
                'nama_barang'  => $logistic->nama,
                'qty'          => $row['qty'],
                'harga_satuan' => $logistic->harga,
            ]);
        }

        return response()->json(['message' => 'Log berhasil disimpan.', 'id' => $log->id], 201);
    }
}
