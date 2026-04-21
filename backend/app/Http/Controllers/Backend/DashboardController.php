<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function customers(): JsonResponse
    {
        $customers = Customer::withCount('chatHistories')
            ->with(['chatHistories' => fn($q) => $q->latest()->limit(1)])
            ->latest()
            ->get()
            ->map(fn($c) => [
                'id'             => $c->id,
                'nama'           => $c->nama ?? 'Tanpa Nama',
                'whatsapp_id'    => $c->whatsapp_id,
                'status'         => $c->status ?? 'new',
                'ai_paused'      => (bool) $c->ai_paused,
                'total_pesan'    => $c->chat_histories_count,
                'pesan_terakhir' => $c->chatHistories->first()?->content,
                'waktu_terakhir' => $c->chatHistories->first()?->created_at?->diffForHumans(),
            ]);

        return response()->json($customers);
    }

    public function messages(int $id): JsonResponse
    {
        $customer = Customer::with(['chatHistories' => fn($q) => $q->oldest()])->findOrFail($id);

        $messages = $customer->chatHistories->map(fn($m) => [
            'id'         => $m->id,
            'role'       => $m->role,
            'content'    => $m->content,
            'created_at' => $m->created_at->format('d M Y, H:i'),
        ])->values();

        return response()->json($messages);
    }
}
