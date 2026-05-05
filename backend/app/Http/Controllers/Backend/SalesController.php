<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\LogisticLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalesController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $month = $request->query('month', now()->format('Y-m'));
        [$year, $mon] = explode('-', $month . '-01');

        $bookings = Booking::with([
            'customer',
            'package',
            'logisticLogs' => fn($q) => $q->where('type', 'checkout')->with(['items', 'returnLog.items']),
        ])
            ->whereYear('tanggal', $year)
            ->whereMonth('tanggal', $mon)
            ->whereNotIn('status', ['cancelled'])
            ->orderBy('tanggal')
            ->get();

        $rows = $bookings->map(fn($booking) => $this->buildRow($booking));

        $gross    = $rows->sum('gross');
        $expenses = $rows->sum('total_expenses');
        $net      = $gross - $expenses;

        return response()->json([
            'month'   => $month,
            'rows'    => $rows->values(),
            'summary' => [
                'gross'          => $gross,
                'total_expenses' => $expenses,
                'net'            => $net,
                'margin_pct'     => $gross > 0 ? round($net / $gross * 100, 1) : 0,
            ],
        ]);
    }

    public function updateExpenses(Request $request, Booking $booking): JsonResponse
    {
        $validated = $request->validate([
            'biaya_transport' => 'required|integer|min:0',
            'biaya_staff'     => 'required|integer|min:0',
        ]);

        $booking->update($validated);

        return response()->json($this->buildRow($booking->fresh(['customer', 'package', 'logisticLogs.items', 'logisticLogs.returnLog.items'])));
    }

    private function buildRow(Booking $booking): array
    {
        $gross     = $booking->package?->harga ?? 0;
        $transport = $booking->biaya_transport ?? 0;
        $staff     = $booking->biaya_staff ?? 0;

        // Calculate logistic cost from linked checkout log
        $logisticCost   = 0;
        $logisticStatus = 'none'; // none | checkout_only | complete

        $checkout = $booking->logisticLogs->first();
        if ($checkout) {
            $returnLog = $checkout->returnLog;
            if ($returnLog) {
                $logisticStatus  = 'complete';
                $checkoutByLogId = $checkout->items->keyBy('logistic_id');
                $returnByLogId   = $returnLog->items->keyBy('logistic_id');

                foreach ($checkoutByLogId as $logisticId => $item) {
                    $sisa      = $returnByLogId[$logisticId]?->qty ?? 0;
                    $terpakai  = max(0, $item->qty - $sisa);
                    $logisticCost += $terpakai * $item->harga_satuan;
                }
            } else {
                // No return yet — use full checkout cost as estimate
                $logisticStatus = 'checkout_only';
                $logisticCost   = $checkout->items->sum(fn($i) => $i->qty * $i->harga_satuan);
            }
        }

        $totalExpenses = $transport + $staff + $logisticCost;
        $net           = $gross - $totalExpenses;

        return [
            'id'              => $booking->id,
            'tanggal'         => $booking->tanggal->format('Y-m-d'),
            'customer_nama'   => $booking->customer?->nama ?? '—',
            'paket_nama'      => $booking->package?->nama ?? '—',
            'status'          => $booking->status,
            'gross'           => $gross,
            'biaya_transport' => $transport,
            'biaya_staff'     => $staff,
            'biaya_logistik'  => $logisticCost,
            'logistic_status' => $logisticStatus,
            'total_expenses'  => $totalExpenses,
            'net'             => $net,
        ];
    }
}
