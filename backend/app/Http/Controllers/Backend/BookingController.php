<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Mail\NewBookingMail;
use App\Models\Booking;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Throwable;

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
        $query = Booking::with(['customer', 'package', 'kiosk'])
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
            'lokasi'            => $b->lokasi ?? $b->catatan,
            'catatan'           => $b->lokasi ? $b->catatan : null,
            'frame'             => $b->frame,
            'warna_backdrop'    => $b->warna_backdrop,
            'status'                    => $b->status,
            'dp_amount'                 => $b->dp_amount,
            'syarat_venue'              => $b->syarat_venue,
            'syarat_pembayaran'         => $b->syarat_pembayaran,
            'frame_design_url'          => $b->frame_design_url,
            'frame_design_reference'    => $b->frame_design_reference,
            'frame_design_notified_at'  => $b->frame_design_notified_at?->format('Y-m-d H:i'),
            'created_at'                => $b->created_at->format('Y-m-d H:i'),
            // Operational fields
            'kirim_invoice'     => (bool) $b->kirim_invoice,
            'sudah_dp'          => (bool) $b->sudah_dp,
            'pelunasan'         => (bool) $b->pelunasan,
            'jumlah_pelunasan'  => $b->jumlah_pelunasan,
            'type_booth'        => $b->type_booth ?? [],
            'kiosk'             => $b->kiosk ? ['id' => $b->kiosk->id, 'name' => $b->kiosk->name] : null,
            'printer'           => $b->printer,
            'transport'         => $b->transport,
            'total_jarak'       => $b->total_jarak,
            'staff_operasional' => $b->staff_operasional ?? [],
            'additional_info'   => $b->additional_info,
        ]));
    }

    public function uploadFrameDesign(Request $request, Booking $booking): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|max:5120',
        ]);

        // Save image to public/frame-designs/
        $dir  = public_path('frame-designs');
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $filename = 'frame-' . $booking->id . '-' . time() . '.' . $request->file('image')->getClientOriginalExtension();
        $request->file('image')->move($dir, $filename);
        $imageUrl = url("frame-designs/{$filename}");

        $booking->update([
            'frame_design_url'          => $imageUrl,
            'frame_design_notified_at'  => null,
        ]);

        // Notify customer via WhatsApp
        $waId = $booking->customer->whatsapp_id ?? null;
        if ($waId) {
            try {
                $wa = app(WhatsAppService::class);
                $customerName = $booking->customer->nama ?? 'Kak';
                $revisiInfo   = 'Kalau ada yang ingin direvisi, langsung kabarin kami ya (maks. 3x revisi) 😊';

                $wa->sendImage(
                    $waId,
                    $imageUrl,
                    "Halo {$customerName}! Desain frame foto kamu sudah siap nih 🎨\n{$revisiInfo}"
                );

                $booking->update(['frame_design_notified_at' => now()]);

                \App\Models\ChatHistory::create([
                    'customer_id' => $booking->customer_id,
                    'role'        => 'assistant',
                    'content'     => '[Desain frame dikirim]',
                ]);
            } catch (Throwable $e) {
                logger()->error('Frame design notify error', ['message' => $e->getMessage()]);
            }
        }

        return response()->json([
            'frame_design_url'         => $imageUrl,
            'frame_design_notified_at' => $booking->frame_design_notified_at?->format('Y-m-d H:i'),
        ]);
    }

    public function updateOps(Request $request, Booking $booking): JsonResponse
    {
        $data = $request->validate([
            'kirim_invoice'       => 'sometimes|boolean',
            'sudah_dp'            => 'sometimes|boolean',
            'pelunasan'           => 'sometimes|boolean',
            'dp_amount'           => 'sometimes|nullable|integer|min:0',
            'jumlah_pelunasan'    => 'sometimes|nullable|integer|min:0',
            'type_booth'          => 'sometimes|nullable|array',
            'type_booth.*'        => 'string|max:100',
            'kiosk_id'            => 'sometimes|nullable|exists:kiosks,id',
            'printer'             => 'sometimes|nullable|string|max:100',
            'transport'           => 'sometimes|nullable|string|max:100',
            'total_jarak'         => 'sometimes|nullable|numeric|min:0',
            'staff_operasional'   => 'sometimes|nullable|array',
            'staff_operasional.*' => 'string|max:100',
            'additional_info'     => 'sometimes|nullable|string|max:2000',
        ]);

        $booking->update($data);

        return response()->json([
            'kirim_invoice'     => (bool) $booking->kirim_invoice,
            'sudah_dp'          => (bool) $booking->sudah_dp,
            'pelunasan'         => (bool) $booking->pelunasan,
            'dp_amount'         => $booking->dp_amount,
            'jumlah_pelunasan'  => $booking->jumlah_pelunasan,
            'type_booth'        => $booking->type_booth ?? [],
            'kiosk'             => $booking->kiosk ? ['id' => $booking->kiosk->id, 'name' => $booking->kiosk->name] : null,
            'printer'           => $booking->printer,
            'transport'         => $booking->transport,
            'total_jarak'       => $booking->total_jarak,
            'staff_operasional' => $booking->staff_operasional ?? [],
            'additional_info'   => $booking->additional_info,
        ]);
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

        try {
            Mail::to(config('app.notify_email', 'waktunyaphotobooth@gmail.com'))
                ->send(new NewBookingMail($booking));
        } catch (Throwable $e) {
            logger()->error('New booking email error', ['message' => $e->getMessage()]);
        }

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

        $prevStatus = $booking->status;
        $booking->update($validated);
        $newStatus  = $booking->status;

        if ($prevStatus !== $newStatus) {
            if ($newStatus === 'dp_paid') {
                $this->sendDesignReferenceQuestion($booking);
            } elseif ($newStatus === 'confirmed') {
                $this->sendStatusNotification($booking, 'confirmed');
            } elseif ($newStatus === 'completed') {
                $this->sendStatusNotification($booking, 'completed');
            }
        }

        return response()->json($booking->load(['customer', 'package']));
    }

    private function sendStatusNotification(Booking $booking, string $status): void
    {
        $booking->loadMissing(['customer', 'package']);
        $waId = $booking->customer->whatsapp_id ?? null;
        if (! $waId) {
            return;
        }

        $nama  = $booking->customer->nama ?? 'Kak';
        $paket = $booking->package?->nama ?? '-';
        $tgl   = $booking->tanggal->format('d M Y');
        $jam   = $booking->jam_mulai ?? '-';
        $acara = $booking->nama_acara ?? '-';

        $msg = match ($status) {
            'confirmed' => "Halo *{$nama}*! 🎉\n\nBooking kamu sudah *dikonfirmasi* oleh tim kami ya kak!\n\n"
                         . "📌 *Acara:* {$acara}\n📦 *Paket:* {$paket}\n📅 *Tanggal:* {$tgl}\n⏰ *Jam:* {$jam}\n\n"
                         . "Selanjutnya, silakan lakukan pembayaran DP untuk mengunci jadwal ya kak 😊\n"
                         . "Kalau ada pertanyaan, hubungi kami di sini!",
            'completed' => "Halo *{$nama}*! 🌟\n\nTerima kasih sudah menggunakan layanan kami!\n\n"
                         . "Acara *{$acara}* pada *{$tgl}* telah selesai. "
                         . "Semoga momen yang kami abadikan menjadi kenangan indah ya kak 🥰\n\n"
                         . "Kalau ada feedback atau ingin booking lagi, hubungi kami kapan saja!",
        };

        try {
            $wa = app(WhatsAppService::class);
            $wa->sendText($waId, $msg);

            \App\Models\ChatHistory::create([
                'customer_id' => $booking->customer_id,
                'role'        => 'assistant',
                'content'     => $msg,
            ]);
        } catch (Throwable $e) {
            logger()->error('Status notification error', ['status' => $status, 'message' => $e->getMessage()]);
        }
    }

    private function sendDesignReferenceQuestion(Booking $booking): void
    {
        $booking->loadMissing('customer');
        $waId = $booking->customer->whatsapp_id ?? null;
        if (! $waId) {
            return;
        }

        try {
            $wa  = app(WhatsAppService::class);
            $msg = "Halo {$booking->customer->nama}! DP kamu sudah kami terima ya kak, terima kasih 🎉\n\n"
                 . "Btw, untuk desain frame fotonya — ada referensi atau konsep tertentu yang diinginkan? "
                 . "Misalnya tema warna, font, atau contoh desain? 🎨\n\n"
                 . "Kalau ada, kirim aja ke sini ya, nanti tim kami yang proses. "
                 . "Estimasi selesai 3 hari kerja. Kalau belum ada bayangan juga gapapa, "
                 . "tim kami bisa buatkan sesuai tema acara kamu 😊";

            $wa->sendText($waId, $msg);

            \App\Models\ChatHistory::create([
                'customer_id' => $booking->customer_id,
                'role'        => 'assistant',
                'content'     => $msg,
            ]);
        } catch (Throwable $e) {
            logger()->error('Design reference question error', ['message' => $e->getMessage()]);
        }
    }

    public function destroy(Booking $booking): JsonResponse
    {
        $booking->delete();
        return response()->json(['message' => 'Booking dihapus']);
    }
}
