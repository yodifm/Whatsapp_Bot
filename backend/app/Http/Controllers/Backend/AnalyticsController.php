<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\ChatHistory;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function index(): JsonResponse
    {
        $totalCustomers  = Customer::count();
        $totalMessages   = ChatHistory::count();
        $totalIncoming   = ChatHistory::where('role', 'user')->count();
        $aiPaused        = Customer::where('ai_paused', true)->count();

        // Status breakdown
        $statusBreakdown = Customer::select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $statusDefaults = ['new' => 0, 'interested' => 0, 'followup' => 0, 'booked' => 0, 'done' => 0];
        $statusBreakdown = array_merge($statusDefaults, $statusBreakdown);

        // Chat per hari (7 hari terakhir)
        $dailyChats = ChatHistory::where('role', 'user')
            ->where('created_at', '>=', now()->subDays(6)->startOfDay())
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as total'))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date')
            ->map(fn($r) => $r->total);

        $chartDays = [];
        for ($i = 6; $i >= 0; $i--) {
            $day = now()->subDays($i)->format('Y-m-d');
            $chartDays[] = [
                'date'  => now()->subDays($i)->format('d M'),
                'total' => $dailyChats[$day] ?? 0,
            ];
        }

        // Jam tersibuk (distribusi per jam)
        $hourlyDist = ChatHistory::where('role', 'user')
            ->select(DB::raw('HOUR(created_at) as hour'), DB::raw('count(*) as total'))
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->keyBy('hour')
            ->map(fn($r) => $r->total);

        $hourlyChart = [];
        for ($h = 0; $h < 24; $h++) {
            $hourlyChart[] = ['hour' => sprintf('%02d:00', $h), 'total' => $hourlyDist[$h] ?? 0];
        }

        // Customer terbaru
        $recentCustomers = Customer::withCount('chatHistories')
            ->latest()
            ->limit(5)
            ->get(['id', 'nama', 'whatsapp_id', 'status', 'created_at']);

        return response()->json([
            'summary' => [
                'total_customers' => $totalCustomers,
                'total_messages'  => $totalMessages,
                'total_incoming'  => $totalIncoming,
                'ai_paused'       => $aiPaused,
                'booked'          => $statusBreakdown['booked'],
                'conversion_rate' => $totalCustomers > 0
                    ? round(($statusBreakdown['booked'] + $statusBreakdown['done']) / $totalCustomers * 100, 1)
                    : 0,
            ],
            'status_breakdown' => $statusBreakdown,
            'daily_chats'      => $chartDays,
            'hourly_dist'      => $hourlyChart,
            'recent_customers' => $recentCustomers,
        ]);
    }
}
