<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
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
}
