<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Booking::with(['customer', 'package'])
            ->orderBy('tanggal');

        if ($request->filled('bulan')) {
            $query->whereYear('tanggal', substr($request->bulan, 0, 4))
                  ->whereMonth('tanggal', substr($request->bulan, 5, 2));
        }

        return response()->json($query->get()->map(fn($b) => [
            'id'         => $b->id,
            'customer'   => ['id' => $b->customer->id, 'nama' => $b->customer->nama],
            'package'    => $b->package ? ['id' => $b->package->id, 'nama' => $b->package->nama] : null,
            'tanggal'    => $b->tanggal->format('Y-m-d'),
            'jam_mulai'  => $b->jam_mulai,
            'durasi_jam' => $b->durasi_jam,
            'nama_acara' => $b->nama_acara,
            'catatan'    => $b->catatan,
            'status'     => $b->status,
            'dp_amount'  => $b->dp_amount,
        ]));
    }

    public function formSubmissions(Request $request): JsonResponse
    {
        $query = Booking::with(['customer', 'package'])
            ->whereNotNull('frame')
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('no_whatsapp', 'like', "%$s%")
                  ->orWhere('nama_acara', 'like', "%$s%")
                  ->orWhereHas('customer', fn($q2) => $q2->where('nama', 'like', "%$s%"));
            });
        }

        return response()->json($query->get()->map(fn($b) => [
            'id'                => $b->id,
            'customer'          => ['id' => $b->customer->id, 'nama' => $b->customer->nama],
            'package'           => $b->package ? ['id' => $b->package->id, 'nama' => $b->package->nama] : null,
            'no_whatsapp'       => $b->no_whatsapp,
            'email'             => $b->email,
            'tanggal'           => $b->tanggal->format('Y-m-d'),
            'jam_mulai'         => $b->jam_mulai,
            'nama_acara'        => $b->nama_acara,
            'lokasi'            => $b->catatan,
            'frame'             => $b->frame,
            'warna_backdrop'    => $b->warna_backdrop,
            'status'            => $b->status,
            'syarat_venue'      => $b->syarat_venue,
            'syarat_pembayaran' => $b->syarat_pembayaran,
            'created_at'        => $b->created_at->format('Y-m-d H:i'),
        ]));
    }

    public function updateFormStatus(Request $request, Booking $booking): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,confirmed,dp_paid,completed,cancelled',
        ]);

        $booking->update($validated);

        return response()->json(['status' => $booking->status]);
    }

    public function bookedDates(): JsonResponse
    {
        $dates = Booking::whereNotIn('status', ['cancelled'])
            ->pluck('tanggal')
            ->map(fn($d) => $d->format('Y-m-d'))
            ->unique()
            ->values();

        return response()->json($dates);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'package_id'  => 'nullable|exists:packages,id',
            'tanggal'     => 'required|date',
            'jam_mulai'   => 'nullable|date_format:H:i',
            'durasi_jam'  => 'nullable|integer|min:1|max:24',
            'nama_acara'  => 'nullable|string|max:255',
            'catatan'     => 'nullable|string',
            'status'      => 'in:pending,confirmed,dp_paid,completed,cancelled',
            'dp_amount'   => 'nullable|integer|min:0',
        ]);

        $booking = Booking::create($validated);
        $booking->load(['customer', 'package']);

        return response()->json($booking, 201);
    }

    public function update(Request $request, Booking $booking): JsonResponse
    {
        $validated = $request->validate([
            'package_id'  => 'nullable|exists:packages,id',
            'tanggal'     => 'sometimes|date',
            'jam_mulai'   => 'nullable|date_format:H:i',
            'durasi_jam'  => 'nullable|integer|min:1|max:24',
            'nama_acara'  => 'nullable|string|max:255',
            'catatan'     => 'nullable|string',
            'status'      => 'in:pending,confirmed,dp_paid,completed,cancelled',
            'dp_amount'   => 'nullable|integer|min:0',
        ]);

        $booking->update($validated);

        return response()->json($booking->load(['customer', 'package']));
    }

    public function destroy(Booking $booking): JsonResponse
    {
        $booking->delete();
        return response()->json(['message' => 'Booking dihapus']);
    }
}
