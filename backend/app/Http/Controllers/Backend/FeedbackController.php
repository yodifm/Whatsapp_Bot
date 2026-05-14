<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Feedback;
use App\Models\Kiosk;
use App\Models\LogisticLog;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    // Public — return studio name for the form header
    public function studioInfo(Request $request): JsonResponse
    {
        $kioskId = $request->query('kiosk_id');
        $kiosk   = $kioskId ? Kiosk::find($kioskId) : null;
        $name    = $kiosk?->studio_name ?: Setting::get('studio_name', 'Waktunya Photobooth');

        return response()->json([
            'studio_name' => $name,
            'kiosk_id'    => $kiosk?->id,
        ]);
    }

    // Public — return event + staff info for a booking (used to pre-fill feedback form)
    public function bookingInfo(int $id): JsonResponse
    {
        $booking = Booking::with(['customer', 'package'])->find($id);
        if (! $booking) {
            return response()->json(['error' => 'Booking tidak ditemukan'], 404);
        }

        // Get staff who handled this event (checkout logistic logs)
        $staffNames = LogisticLog::where('booking_id', $id)
            ->where('type', 'checkout')
            ->pluck('staff_nama')
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        return response()->json([
            'booking_id'    => $booking->id,
            'event_name'    => $booking->nama_acara,
            'event_date'    => $booking->tanggal->locale('id')->isoFormat('dddd, D MMMM Y'),
            'customer_name' => $booking->customer?->nama,
            'package_name'  => $booking->package?->nama,
            'staff_names'   => $staffNames,
        ]);
    }

    // Public — customer submits feedback
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'kiosk_id'       => 'nullable|integer',
            'booking_id'     => 'nullable|integer',
            'nama'           => 'required|string|max:100',
            'sumber'         => 'nullable|string|max:100',
            'rating_print'   => 'required|integer|min:1|max:5',
            'rating_foto'    => 'required|integer|min:1|max:5',
            'rating_staff'   => 'required|integer|min:1|max:5',
            'rating_frame'   => 'required|integer|min:1|max:5',
            'rating_admin'   => 'required|integer|min:1|max:5',
            'rekomendasikan' => 'nullable|in:iya,ragu-ragu,tidak',
            'pakai_lagi'     => 'nullable|in:iya,ragu-ragu,tidak',
            'saran'          => 'nullable|string|max:2000',
        ]);

        Feedback::create($data);

        return response()->json(['message' => 'Terima kasih atas feedback kamu! 🙏'], 201);
    }

    // Protected — admin views all feedback with booking + staff info
    public function index(Request $request): JsonResponse
    {
        $feedbacks = Feedback::latest()->get()->map(function ($f) {
            $booking    = $f->booking_id ? Booking::with(['customer', 'package'])->find($f->booking_id) : null;
            $staffNames = $f->booking_id
                ? LogisticLog::where('booking_id', $f->booking_id)
                    ->where('type', 'checkout')
                    ->pluck('staff_nama')->filter()->unique()->values()->toArray()
                : [];

            return [
                'id'             => $f->id,
                'nama'           => $f->nama,
                'sumber'         => $f->sumber,
                'rating_print'   => $f->rating_print,
                'rating_foto'    => $f->rating_foto,
                'rating_staff'   => $f->rating_staff,
                'rating_frame'   => $f->rating_frame,
                'rating_admin'   => $f->rating_admin,
                'rekomendasikan' => $f->rekomendasikan,
                'pakai_lagi'     => $f->pakai_lagi,
                'saran'          => $f->saran,
                'created_at'     => $f->created_at->setTimezone('Asia/Jakarta')->format('d M Y, H:i'),
                // Booking & staff context
                'booking_id'     => $f->booking_id,
                'event_name'     => $booking?->nama_acara,
                'event_date'     => $booking?->tanggal?->locale('id')->isoFormat('D MMM Y'),
                'staff_names'    => $staffNames,
            ];
        });

        $avg = Feedback::count() > 0 ? [
            'print'  => round(Feedback::avg('rating_print'),  1),
            'foto'   => round(Feedback::avg('rating_foto'),   1),
            'staff'  => round(Feedback::avg('rating_staff'),  1),
            'frame'  => round(Feedback::avg('rating_frame'),  1),
            'admin'  => round(Feedback::avg('rating_admin'),  1),
            'total'  => round(Feedback::selectRaw(
                '(AVG(rating_print) + AVG(rating_foto) + AVG(rating_staff) + AVG(rating_frame) + AVG(rating_admin)) / 5 as overall'
            )->value('overall'), 1),
            'count'              => Feedback::count(),
            'rekomendasikan_iya' => Feedback::where('rekomendasikan', 'iya')->count(),
        ] : null;

        return response()->json(compact('feedbacks', 'avg'));
    }

    public function destroy(Feedback $feedback): JsonResponse
    {
        $feedback->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
