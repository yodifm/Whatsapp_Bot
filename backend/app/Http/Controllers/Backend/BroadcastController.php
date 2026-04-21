<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\ChatHistory;
use App\Models\Customer;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BroadcastController extends Controller
{
    public function send(Request $request): JsonResponse
    {
        $request->validate([
            'message'       => 'required|string|max:4096',
            'filter_status' => 'nullable|array',
            'filter_status.*' => 'in:new,interested,followup,booked,done',
        ]);

        $query = Customer::query();

        if (!empty($request->filter_status)) {
            $query->whereIn('status', $request->filter_status);
        }

        $customers = $query->get();

        if ($customers->isEmpty()) {
            return response()->json(['message' => 'Tidak ada customer yang sesuai filter.', 'sent' => 0, 'failed' => 0]);
        }

        $wa   = new WhatsAppService();
        $sent = 0;
        $failed = 0;
        $failedList = [];

        foreach ($customers as $customer) {
            try {
                $wa->sendText($customer->whatsapp_id, $request->message);

                ChatHistory::create([
                    'customer_id' => $customer->id,
                    'role'        => 'assistant',
                    'content'     => '[Broadcast] ' . $request->message,
                ]);

                $sent++;
            } catch (\Throwable $e) {
                $failed++;
                $failedList[] = $customer->nama ?? $customer->whatsapp_id;
            }
        }

        return response()->json([
            'message'     => "Broadcast selesai. Terkirim: {$sent}, Gagal: {$failed}.",
            'sent'        => $sent,
            'failed'      => $failed,
            'failed_list' => $failedList,
        ]);
    }

    public function preview(Request $request): JsonResponse
    {
        $request->validate([
            'filter_status' => 'nullable|array',
            'filter_status.*' => 'in:new,interested,followup,booked,done',
        ]);

        $query = Customer::query();
        if (!empty($request->filter_status)) {
            $query->whereIn('status', $request->filter_status);
        }

        $count     = $query->count();
        $customers = $query->limit(5)->get(['nama', 'whatsapp_id', 'status']);

        return response()->json(['count' => $count, 'preview' => $customers]);
    }
}
