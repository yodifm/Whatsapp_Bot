<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Package;
use App\Services\AIService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TestAIController extends Controller
{
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'history' => 'array',
            'history.*.role'    => 'required|in:user,assistant',
            'history.*.content' => 'required|string',
        ]);

        $packages = Package::where('aktif', true)->get()->toArray();

        try {
            $ai    = new AIService();
            $reply = $ai->getReply($request->message, $request->history ?? [], $packages);

            return response()->json(['reply' => $reply]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
