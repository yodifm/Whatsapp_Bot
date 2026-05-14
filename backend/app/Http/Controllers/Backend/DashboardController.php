<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function customers(): JsonResponse
    {
        $customers = Customer::withCount('chatHistories')
            ->with('latestChat')
            ->latest()
            ->get()
            ->map(fn($c) => [
                'id'              => $c->id,
                'nama'            => $c->nama ?? 'Tanpa Nama',
                'whatsapp_id'     => $c->whatsapp_id,
                'status'          => $c->status ?? 'new',
                'ai_paused'       => (bool) $c->ai_paused,
                'total_pesan'     => $c->chat_histories_count,
                'pesan_terakhir'  => $c->latestChat?->content,
                'waktu_terakhir'  => $c->latestChat?->created_at?->setTimezone('Asia/Jakarta')->diffForHumans(),
                'last_message_at' => $c->latestChat?->created_at?->setTimezone('Asia/Jakarta')->toIso8601String(),
            ]);

        return response()->json($customers);
    }

    public function stats(): JsonResponse
    {
        $now            = now();
        $monthStart     = $now->copy()->startOfMonth()->toDateString();
        $monthEnd       = $now->copy()->endOfMonth()->toDateString();
        $lastMonthStart = $now->copy()->subMonth()->startOfMonth()->toDateString();
        $lastMonthEnd   = $now->copy()->subMonth()->endOfMonth()->toDateString();
        $today          = $now->toDateString();
        $in7Days        = $now->copy()->addDays(7)->toDateString();
        $in14Days       = $now->copy()->addDays(14)->toDateString();

        // Revenue bulan ini & lalu
        $monthBookings     = Booking::with('package')->whereNotIn('status', ['cancelled'])->whereBetween('tanggal', [$monthStart, $monthEnd])->get();
        $lastMonthBookings = Booking::with('package')->whereNotIn('status', ['cancelled'])->whereBetween('tanggal', [$lastMonthStart, $lastMonthEnd])->get();
        $revenueNow  = $monthBookings->sum(fn($b) => $b->package?->harga ?? 0);
        $revenueLast = $lastMonthBookings->sum(fn($b) => $b->package?->harga ?? 0);

        // Pending konfirmasi
        $pendingCount = Booking::where('status', 'pending')->count();

        // Upcoming 7 hari
        $upcomingCount = Booking::whereNotIn('status', ['cancelled', 'completed'])
            ->whereBetween('tanggal', [$today, $in7Days])->count();

        // DP belum bayar & acara < 14 hari (warning)
        $dpWarningCount = Booking::whereIn('status', ['pending', 'confirmed'])
            ->where(fn($q) => $q->whereNull('dp_amount')->orWhere('dp_amount', 0))
            ->where('tanggal', '<=', $in14Days)
            ->where('tanggal', '>=', $today)
            ->count();

        // Upcoming bookings list (7 hari ke depan)
        $upcoming = Booking::with(['customer', 'package'])
            ->whereNotIn('status', ['cancelled', 'completed'])
            ->where('tanggal', '>=', $today)
            ->orderBy('tanggal')->orderBy('jam_mulai')
            ->limit(6)
            ->get()
            ->map(fn($b) => [
                'id'         => $b->id,
                'customer'   => $b->customer?->nama ?? '-',
                'nama_acara' => $b->nama_acara,
                'tanggal'    => $b->tanggal->format('d M Y'),
                'jam_mulai'  => $b->jam_mulai,
                'status'     => $b->status,
                'paket'      => $b->package?->nama,
            ]);

        // Customer stats
        $totalCustomers  = Customer::count();
        $newThisMonth    = Customer::whereBetween('created_at', [$monthStart . ' 00:00:00', $monthEnd . ' 23:59:59'])->count();

        return response()->json([
            'revenue_this_month'  => $revenueNow,
            'revenue_last_month'  => $revenueLast,
            'revenue_growth'      => $revenueLast > 0 ? round((($revenueNow - $revenueLast) / $revenueLast) * 100, 1) : null,
            'bookings_this_month' => $monthBookings->count(),
            'pending_count'       => $pendingCount,
            'upcoming_count'      => $upcomingCount,
            'dp_warning_count'    => $dpWarningCount,
            'total_customers'     => $totalCustomers,
            'new_customers'       => $newThisMonth,
            'upcoming'            => $upcoming,
        ]);
    }

    public function messages(int $id): JsonResponse
    {
        $customer = Customer::with(['chatHistories' => fn($q) => $q->oldest()])->findOrFail($id);

        $messages = $customer->chatHistories->map(fn($m) => [
            'id'         => $m->id,
            'role'       => $m->role,
            'content'    => $m->content,
            'created_at' => $m->created_at->setTimezone('Asia/Jakarta')->format('d M Y, H:i'),
        ])->values();

        return response()->json($messages);
    }
}
