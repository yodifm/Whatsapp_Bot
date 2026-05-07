<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\Discount;
use App\Models\Faq;
use App\Models\Kiosk;
use App\Models\Package;
use App\Services\AIService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TestAIController extends Controller
{
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message'           => 'required|string|max:1000',
            'history'           => 'array',
            'history.*.role'    => 'required|in:user,assistant',
            'history.*.content' => 'required|string',
            'kiosk_id'          => 'nullable|exists:kiosks,id',
        ]);

        $kiosk = $request->filled('kiosk_id')
            ? Kiosk::find($request->kiosk_id)
            : null;

        // Packages: global + kiosk-specific (mirrors production behaviour)
        $packages = Package::where('aktif', true)
            ->where(function ($q) use ($kiosk) {
                $q->whereNull('kiosk_id');
                if ($kiosk) $q->orWhere('kiosk_id', $kiosk->id);
            })->get()->toArray();

        $faqs = Faq::where('aktif', true)->orderBy('urutan')->get()->toArray();

        $discounts = Discount::where('aktif', true)
            ->where('berlaku_sampai', '>=', now()->toDateString())
            ->get()->map(fn($d) => [
                'nama'           => $d->nama,
                'label'          => $d->label,
                'berlaku_sampai' => $d->berlaku_sampai->format('d M Y'),
            ])->toArray();

        $bookedSlots = Booking::whereNotIn('status', ['cancelled'])
            ->get(['tanggal', 'jam_mulai'])
            ->map(fn($b) => $b->tanggal->format('Y-m-d') . ($b->jam_mulai ? ' jam ' . $b->jam_mulai : ''))
            ->unique()->values()->toArray();

        try {
            $ai     = new AIService();
            $result = $ai->getReply(
                $request->message,
                $request->history ?? [],
                $packages,
                $faqs,
                $bookedSlots,
                $discounts,
                $kiosk,
            );

            $reply    = $result['reply'];
            $leadData = $result['leadData'];

            $savedLead = null;
            if ($leadData && ! empty($leadData['nama'])) {
                $savedLead = $this->saveLead($leadData);
            }

            return response()->json([
                'reply'         => $reply,
                'lead_saved'    => $savedLead,
                'pricelist_url' => $savedLead ? url('images/pricelist.jpg') : null,
                'model'         => $result['model'],
                'usage'         => $result['usage'],
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    private function saveLead(array $lead): array
    {
        $customer = Customer::firstOrCreate(
            ['whatsapp_id' => 'sandbox_' . strtolower(str_replace(' ', '_', $lead['nama']))],
            ['nama' => $lead['nama'], 'status' => 'interested'],
        );
        $customer->update(['nama' => $lead['nama'], 'status' => 'interested']);

        $booking = null;
        if (! empty($lead['tanggal'])) {
            $booking = Booking::updateOrCreate(
                ['customer_id' => $customer->id, 'status' => 'pending'],
                [
                    'tanggal'    => $lead['tanggal'],
                    'nama_acara' => $lead['acara'] ?? null,
                    'catatan'    => isset($lead['lokasi']) ? 'Lokasi: ' . $lead['lokasi'] : null,
                ],
            );
        }

        return [
            'customer_id' => $customer->id,
            'nama'        => $customer->nama,
            'tanggal'     => $lead['tanggal'] ?? null,
            'acara'       => $lead['acara']   ?? null,
            'lokasi'      => $lead['lokasi']  ?? null,
            'booking_id'  => $booking?->id,
        ];
    }
}
