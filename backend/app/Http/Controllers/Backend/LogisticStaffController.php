<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Booking;
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

    /** Upcoming/recent bookings for the booking-link dropdown. */
    public function upcomingBookings(): JsonResponse
    {
        $bookings = Booking::with('customer')
            ->whereNotIn('status', ['cancelled'])
            ->where('tanggal', '>=', now()->subDays(7)->toDateString())
            ->orderBy('tanggal')
            ->limit(30)
            ->get()
            ->map(fn($b) => [
                'id'           => $b->id,
                'tanggal'      => $b->tanggal->format('Y-m-d'),
                'nama_acara'   => $b->nama_acara,
                'customer_nama'=> $b->customer?->nama ?? '—',
                'label'        => trim(($b->nama_acara ?: '') . ' — ' . ($b->customer?->nama ?? '—') . ' (' . $b->tanggal->format('d M') . ')'),
            ]);

        return response()->json($bookings);
    }

    /** Find the most recent checkout for a staff member that has no return yet. */
    public function activeCheckout(Request $request): JsonResponse
    {
        $staffNama = trim($request->query('staff_nama', ''));

        if (! $staffNama) {
            return response()->json(['checkout' => null]);
        }

        $checkout = LogisticLog::where('staff_nama', $staffNama)
            ->where('type', 'checkout')
            ->whereDoesntHave('returnLog')
            ->with('items')
            ->latest()
            ->first();

        if (! $checkout) {
            return response()->json(['checkout' => null]);
        }

        return response()->json([
            'checkout' => [
                'id'         => $checkout->id,
                'event_nama' => $checkout->event_nama,
                'tanggal'    => $checkout->tanggal->format('Y-m-d'),
                'items'      => $checkout->items->map(fn($item) => [
                    'logistic_id'  => $item->logistic_id,
                    'nama_barang'  => $item->nama_barang,
                    'qty_dibawa'   => $item->qty,
                    'harga_satuan' => $item->harga_satuan,
                ]),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $type = $request->input('type', 'checkout');

        if ($type === 'return') {
            return $this->storeReturn($request);
        }

        return $this->storeCheckout($request);
    }

    private function storeCheckout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'staff_nama' => 'required|string|max:100',
            'event_nama' => 'nullable|string|max:200',
            'booking_id' => 'nullable|exists:bookings,id',
            'tanggal'    => 'required|date',
            'catatan'    => 'nullable|string|max:1000',
            'items'      => 'required|array|min:1',
            'items.*.logistic_id' => 'required|exists:logistics,id',
            'items.*.qty'         => 'required|integer|min:1',
        ]);

        // Auto-fill event_nama from booking if not provided
        $eventNama = $validated['event_nama'] ?? null;
        if (! $eventNama && ! empty($validated['booking_id'])) {
            $booking   = Booking::with('customer')->find($validated['booking_id']);
            $eventNama = trim(($booking?->nama_acara ?: '') . ' — ' . ($booking?->customer?->nama ?? ''));
        }

        $log = LogisticLog::create([
            'type'       => 'checkout',
            'staff_nama' => $validated['staff_nama'],
            'event_nama' => $eventNama,
            'booking_id' => $validated['booking_id'] ?? null,
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

        return response()->json(['message' => 'Checklist keberangkatan disimpan.', 'id' => $log->id], 201);
    }

    private function storeReturn(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'staff_nama'      => 'required|string|max:100',
            'checkout_log_id' => 'required|exists:logistic_logs,id',
            'tanggal'         => 'required|date',
            'catatan'         => 'nullable|string|max:1000',
            'items'           => 'required|array|min:1',
            'items.*.logistic_id'  => 'nullable|exists:logistics,id',
            'items.*.nama_barang'  => 'required|string|max:200',
            'items.*.qty_sisa'     => 'required|integer|min:0',
            'items.*.harga_satuan' => 'required|integer|min:0',
        ]);

        // Guard: only one return per checkout
        $alreadyReturned = LogisticLog::where('checkout_log_id', $validated['checkout_log_id'])->exists();
        if ($alreadyReturned) {
            return response()->json(['message' => 'Checkout ini sudah memiliki laporan kepulangan.'], 422);
        }

        $checkout = LogisticLog::find($validated['checkout_log_id']);

        $log = LogisticLog::create([
            'type'            => 'return',
            'staff_nama'      => $validated['staff_nama'],
            'event_nama'      => $checkout->event_nama,
            'tanggal'         => $validated['tanggal'],
            'catatan'         => $validated['catatan'] ?? null,
            'checkout_log_id' => $validated['checkout_log_id'],
        ]);

        foreach ($validated['items'] as $row) {
            $log->items()->create([
                'logistic_id'  => $row['logistic_id'] ?? null,
                'nama_barang'  => $row['nama_barang'],
                'qty'          => $row['qty_sisa'],
                'harga_satuan' => $row['harga_satuan'],
            ]);
        }

        return response()->json(['message' => 'Laporan kepulangan disimpan.', 'id' => $log->id], 201);
    }
}
