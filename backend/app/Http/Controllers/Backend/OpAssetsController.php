<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OpAssetsController extends Controller
{
    private function load(string $key): array
    {
        $raw = Setting::get($key, '[]');
        return json_decode($raw, true) ?? [];
    }

    public function index(): JsonResponse
    {
        return response()->json([
            'booths'     => $this->load('op_booths'),
            'printers'   => $this->load('op_printers'),
            'transports' => $this->load('op_transports'),
            'staff'      => User::where('role', 'staff_operasional')
                                ->orderBy('name')
                                ->get(['id', 'name', 'email']),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'booths'       => 'nullable|array',
            'booths.*'     => 'string|max:100',
            'printers'     => 'nullable|array',
            'printers.*'   => 'string|max:100',
            'transports'   => 'nullable|array',
            'transports.*' => 'string|max:100',
        ]);

        foreach (['booths', 'printers', 'transports'] as $key) {
            if (array_key_exists($key, $data)) {
                Setting::set("op_{$key}", json_encode(array_values($data[$key] ?? [])));
            }
        }

        return $this->index();
    }
}
