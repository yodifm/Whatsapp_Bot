<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\ChatHistory;
use App\Models\Customer;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function show(Customer $customer): JsonResponse
    {
        $customer->loadMissing('bookings.package');

        $bookings = $customer->bookings()
            ->with('package')
            ->orderByDesc('tanggal')
            ->get()
            ->map(fn($b) => [
                'id'             => $b->id,
                'tanggal'        => $b->tanggal->format('Y-m-d'),
                'nama_acara'     => $b->nama_acara,
                'package'        => $b->package ? ['id' => $b->package->id, 'nama' => $b->package->nama] : null,
                'status'         => $b->status,
                'dp_amount'      => $b->dp_amount,
                'jumlah_pelunasan' => $b->jumlah_pelunasan,
                'lokasi'         => $b->lokasi ?? $b->catatan,
                'jam_mulai'      => $b->jam_mulai ? substr($b->jam_mulai, 0, 5) : null,
            ]);

        $totalSpent = $bookings->sum('dp_amount') + $bookings->sum('jumlah_pelunasan');

        return response()->json([
            'id'          => $customer->id,
            'nama'        => $customer->nama,
            'email'       => $customer->email,
            'no_whatsapp' => $customer->no_whatsapp,
            'status'      => $customer->status,
            'ai_paused'   => $customer->ai_paused,
            'created_at'  => $customer->created_at->format('d M Y'),
            'bookings'    => $bookings,
            'total_spent' => $totalSpent,
            'total_booking' => $bookings->count(),
        ]);
    }

    public function updateStatus(Request $request, Customer $customer): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:new,interested,followup,booked,done',
        ]);

        $customer->update(['status' => $request->status]);

        return response()->json(['status' => $customer->status]);
    }

    public function toggleAI(Customer $customer): JsonResponse
    {
        $customer->update(['ai_paused' => !$customer->ai_paused]);

        return response()->json(['ai_paused' => $customer->ai_paused]);
    }

    public function send(Request $request, Customer $customer, WhatsAppService $wa): JsonResponse
    {
        $request->validate(['message' => 'required|string|max:4000']);

        $wa->sendText($customer->whatsapp_id, $request->message);

        $chat = ChatHistory::create([
            'customer_id' => $customer->id,
            'role'        => 'assistant',
            'content'     => $request->message,
        ]);

        return response()->json([
            'id'         => $chat->id,
            'role'       => $chat->role,
            'content'    => $chat->content,
            'created_at' => $chat->created_at->setTimezone('Asia/Jakarta')->format('d M Y, H:i'),
        ], 201);
    }
}
