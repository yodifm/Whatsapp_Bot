<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\ChatHistory;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function poll(Request $request): JsonResponse
    {
        $since = $request->query('since');

        $query = ChatHistory::with('customer:id,nama,whatsapp_id')
            ->where('role', 'user');

        if ($since) {
            $query->where('created_at', '>', $since);
        } else {
            $query->where('created_at', '>=', now()->subMinutes(1));
        }

        $newMessages = $query->orderBy('created_at')->get()->map(fn($m) => [
            'id'           => $m->id,
            'customer_id'  => $m->customer_id,
            'customer_name'=> $m->customer?->nama ?? 'Unknown',
            'content'      => $m->content,
            'created_at'   => $m->created_at->toISOString(),
        ]);

        return response()->json([
            'messages'   => $newMessages,
            'server_time'=> now()->toISOString(),
        ]);
    }
}
