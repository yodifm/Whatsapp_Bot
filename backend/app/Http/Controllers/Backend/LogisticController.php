<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Logistic;
use App\Models\LogisticLog;
use App\Models\LogisticLogItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LogisticController extends Controller
{
    public function index(): JsonResponse
    {
        $items = Logistic::orderBy('nama')->get()->map(fn($i) => [
            'id'     => $i->id,
            'nama'   => $i->nama,
            'qty'    => $i->qty,
            'harga'  => $i->harga,
            'satuan' => $i->satuan,
            'aktif'  => $i->aktif,
        ]);

        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama'   => 'required|string|max:200',
            'qty'    => 'required|integer|min:0',
            'harga'  => 'required|integer|min:0',
            'satuan' => 'nullable|string|max:50',
            'aktif'  => 'boolean',
        ]);

        $item = Logistic::create($validated + ['satuan' => $validated['satuan'] ?? 'pcs']);

        return response()->json(['message' => 'Item berhasil ditambahkan.', 'id' => $item->id], 201);
    }

    public function update(Request $request, Logistic $logistic): JsonResponse
    {
        $validated = $request->validate([
            'nama'   => 'required|string|max:200',
            'qty'    => 'required|integer|min:0',
            'harga'  => 'required|integer|min:0',
            'satuan' => 'nullable|string|max:50',
            'aktif'  => 'boolean',
        ]);

        $logistic->update($validated);

        return response()->json(['message' => 'Item berhasil diupdate.']);
    }

    public function destroy(Logistic $logistic): JsonResponse
    {
        $logistic->delete();

        return response()->json(['message' => 'Item dihapus.']);
    }

    public function logs(): JsonResponse
    {
        $logs = LogisticLog::with(['items', 'returnLog', 'checkoutLog'])
            ->orderByDesc('tanggal')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($log) => [
                'id'              => $log->id,
                'type'            => $log->type,
                'checkout_log_id' => $log->checkout_log_id,
                'staff_nama'      => $log->staff_nama,
                'event_nama'      => $log->event_nama,
                'tanggal'         => $log->tanggal->format('Y-m-d'),
                'catatan'         => $log->catatan,
                'created_at'      => $log->created_at->format('d M Y H:i'),
                'has_return'      => $log->type === 'checkout' && $log->returnLog !== null,
                'items'           => $log->items->map(fn($item) => [
                    'id'           => $item->id,
                    'nama_barang'  => $item->nama_barang,
                    'qty'          => $item->qty,
                    'harga_satuan' => $item->harga_satuan,
                    'subtotal'     => $item->qty * $item->harga_satuan,
                ]),
                'total' => $log->items->sum(fn($i) => $i->qty * $i->harga_satuan),
            ]);

        return response()->json($logs);
    }

    public function destroyLog(LogisticLog $log): JsonResponse
    {
        $log->delete();

        return response()->json(['message' => 'Log dihapus.']);
    }
}
