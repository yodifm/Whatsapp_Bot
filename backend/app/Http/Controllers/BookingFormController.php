<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Customer;
use App\Models\Package;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingFormController extends Controller
{
    public function packages(): JsonResponse
    {
        return response()->json(
            Package::where('aktif', true)->get(['id', 'nama', 'harga', 'durasi_jam'])
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama'             => 'required|string|max:255',
            'no_whatsapp'      => 'required|string|max:20',
            'email'            => 'nullable|email|max:255',
            'acara'            => 'required|string|max:100',
            'tanggal'          => 'required|date',
            'jam_mulai'        => 'required|date_format:H:i',
            'lokasi'           => 'required|string|max:255',
            'package_id'       => 'nullable|exists:packages,id',
            'frame'            => 'required|in:2r,4r',
            'warna_backdrop'   => 'required|string|max:50',
            'catatan'          => 'nullable|string|max:500',
            'syarat_venue'     => 'accepted',
            'syarat_pembayaran'=> 'accepted',
        ], [
            'syarat_venue.accepted'      => 'Kamu harus menyetujui syarat dan ketentuan venue.',
            'syarat_pembayaran.accepted' => 'Kamu harus menyetujui syarat dan ketentuan pembayaran.',
        ]);

        // Find or create customer by WA number
        $waId = 'wa_' . preg_replace('/\D/', '', $validated['no_whatsapp']);

        $customer = Customer::firstOrCreate(
            ['whatsapp_id' => $waId],
            [
                'nama'         => $validated['nama'],
                'email'        => $validated['email'] ?? null,
                'no_whatsapp'  => $validated['no_whatsapp'],
                'status'       => 'interested',
            ]
        );

        $customer->update([
            'nama'        => $validated['nama'],
            'email'       => $validated['email'] ?? $customer->email,
            'no_whatsapp' => $validated['no_whatsapp'],
            'status'      => 'booked',
        ]);

        $booking = Booking::create([
            'customer_id'       => $customer->id,
            'package_id'        => $validated['package_id'] ?? null,
            'no_whatsapp'       => $validated['no_whatsapp'],
            'email'             => $validated['email'] ?? null,
            'tanggal'           => $validated['tanggal'],
            'jam_mulai'         => $validated['jam_mulai'],
            'nama_acara'        => $validated['acara'],
            'frame'             => $validated['frame'],
            'warna_backdrop'    => $validated['warna_backdrop'],
            'catatan'           => $validated['lokasi'] . ($validated['catatan'] ? ' | ' . $validated['catatan'] : ''),
            'status'            => 'pending',
            'syarat_venue'      => true,
            'syarat_pembayaran' => true,
        ]);

        return response()->json([
            'message'    => 'Booking berhasil dikirim! Tim kami akan menghubungi kamu segera.',
            'booking_id' => $booking->id,
        ], 201);
    }
}
