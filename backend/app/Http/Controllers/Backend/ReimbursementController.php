<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Kiosk;
use App\Models\LogisticLog;
use App\Models\Reimbursement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ReimbursementController extends Controller
{
    // Public — staff submits reimbursement
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'booking_id'       => 'nullable|integer',
            'kiosk_id'         => 'nullable|integer',
            'nama_staff'       => 'required|string|max:100',
            'tanggal'          => 'required|date',
            'nama_customers'   => 'nullable|array',
            'nama_customers.*' => 'string|max:100',
            'kebutuhan_lainnya'=> 'nullable|string|max:500',
            'jumlah'           => 'required|integer|min:1',
            'tujuan'           => 'required|string|max:1000',
        ]);

        // Handle optional file upload
        if ($request->hasFile('bukti')) {
            $file    = $request->file('bukti');
            $dir     = public_path('reimbursements');
            if (! is_dir($dir)) mkdir($dir, 0775, true);

            $filename = 'bukti-' . now()->format('Ymd-His') . '-' . Str::random(6) . '.' . $file->getClientOriginalExtension();
            $file->move($dir, $filename);
            $data['bukti_path'] = 'reimbursements/' . $filename;
        }

        Reimbursement::create($data);

        return response()->json(['message' => 'Reimbursement berhasil diajukan! 🙏'], 201);
    }

    // Protected — admin views all reimbursements
    public function index(): JsonResponse
    {
        $items = Reimbursement::latest()->get()->map(function ($r) {
            $booking = $r->booking_id ? Booking::with(['customer', 'package'])->find($r->booking_id) : null;
            $kiosk   = $r->kiosk_id  ? Kiosk::find($r->kiosk_id) : null;

            $staffOnDuty = $r->booking_id
                ? LogisticLog::where('booking_id', $r->booking_id)
                    ->where('type', 'checkout')->pluck('staff_nama')
                    ->filter()->unique()->values()->toArray()
                : [];

            return [
                'id'                => $r->id,
                'nama_staff'        => $r->nama_staff,
                'tanggal'           => $r->tanggal->format('d M Y'),
                'nama_customers'    => $r->nama_customers ?? [],
                'kebutuhan_lainnya' => $r->kebutuhan_lainnya,
                'jumlah'            => $r->jumlah,
                'jumlah_fmt'        => 'Rp ' . number_format($r->jumlah, 0, ',', '.'),
                'tujuan'            => $r->tujuan,
                'bukti_url'         => $r->bukti_path ? url($r->bukti_path) : null,
                'status'            => $r->status,
                'catatan_admin'     => $r->catatan_admin,
                'created_at'        => $r->created_at->setTimezone('Asia/Jakarta')->format('d M Y, H:i'),
                // Context
                'booking_id'        => $r->booking_id,
                'event_name'        => $booking?->nama_acara,
                'event_date'        => $booking?->tanggal?->format('d M Y'),
                'kiosk_id'          => $r->kiosk_id,
                'kiosk_name'        => $kiosk?->studio_name ?? $kiosk?->name,
                'staff_on_duty'     => $staffOnDuty,
            ];
        });

        // Summary stats
        $stats = [
            'total'            => Reimbursement::count(),
            'pending_count'    => Reimbursement::where('status', 'pending')->count(),
            'pending_amount'   => Reimbursement::where('status', 'pending')->sum('jumlah'),
            'approved_amount'  => Reimbursement::where('status', 'approved')->sum('jumlah'),
        ];

        return response()->json(compact('items', 'stats'));
    }

    // Protected — admin approve / reject with optional notes
    public function update(Request $request, Reimbursement $reimbursement): JsonResponse
    {
        $data = $request->validate([
            'status'        => 'required|in:pending,approved,rejected',
            'catatan_admin' => 'nullable|string|max:500',
        ]);

        $reimbursement->update($data);

        return response()->json([
            'status'        => $reimbursement->status,
            'catatan_admin' => $reimbursement->catatan_admin,
        ]);
    }

    public function destroy(Reimbursement $reimbursement): JsonResponse
    {
        // Delete associated file if exists
        if ($reimbursement->bukti_path) {
            $path = public_path($reimbursement->bukti_path);
            if (file_exists($path)) unlink($path);
        }

        $reimbursement->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
