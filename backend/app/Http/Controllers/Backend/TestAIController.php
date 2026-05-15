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
use App\Services\DistanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TestAIController extends Controller
{
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message'            => 'required|string|max:1000',
            'history'            => 'array',
            'history.*.role'     => 'required|in:user,assistant',
            'history.*.content'  => 'required|string',
            'kiosk_id'           => 'nullable|exists:kiosks,id',
            'customer_context'   => 'array',
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

        $faqs = Faq::where('aktif', true)->orderBy('urutan')->limit(30)->get()->toArray();

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
            $customerContext    = $request->customer_context ?? [];
            $pricelistAlready   = ! empty($customerContext['pricelist_sent']);

            $ai     = new AIService();
            $result = $ai->getReply(
                $request->message,
                $request->history ?? [],
                $packages,
                $faqs,
                $bookedSlots,
                $discounts,
                $kiosk,
                $customerContext,
            );

            $reply    = $result['reply'];
            $leadData = $result['leadData'];

            $savedLead    = null;
            $pricelistUrl = null;

            if ($leadData && ! empty($leadData['nama'])) {
                $jarakResult = null;
                if (! empty($leadData['lokasi'])) {
                    $jarakResult = app(DistanceService::class)->calculate($leadData['lokasi']);
                    if ($jarakResult) {
                        $customerContext['jarak_km']        = $jarakResult['km'];
                        $customerContext['transport_gratis'] = $jarakResult['gratis'];
                    }
                }

                $savedLead = $this->saveLead($leadData, $jarakResult);

                // Only send pricelist once per sandbox session
                if (! $pricelistAlready) {
                    // Use ?: (not ??) to treat empty strings same as null
                    $pricelistUrl = $kiosk?->pricelist_cdn_url
                        ?: $kiosk?->pricelist_url
                        ?: (\App\Models\Setting::get('pricelist_url') ?: null)
                        ?: url('images/pricelist.jpg');
                }

                // AI returned tool_use only (no text) + pricelist already sent in a prior turn
                // → send an ack so user isn't left with a blank response
                if ($pricelistAlready && empty(trim($reply))) {
                    $reply = 'Makasih kak ' . ($leadData['nama'] ?? '') . '! Data sudah kami catat 😊 Ada yang bisa dibantu lagi?';
                }
            }

            return response()->json([
                'reply'            => $reply,
                'lead_saved'       => $savedLead,
                'pricelist_url'    => $pricelistUrl,
                'customer_context' => $customerContext,
                'model'            => $result['model'],
                'usage'            => $result['usage'],
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    private function saveLead(array $lead, ?array $jarak = null): array
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
                    'tanggal'     => $lead['tanggal'],
                    'nama_acara'  => $lead['acara']   ?? null,
                    'lokasi'      => $lead['lokasi']  ?? null,
                    'catatan'     => isset($lead['lokasi']) ? 'Lokasi: ' . $lead['lokasi'] : null,
                    'total_jarak' => $jarak['km'] ?? null,
                ],
            );
        }

        return [
            'customer_id'      => $customer->id,
            'nama'             => $customer->nama,
            'tanggal'          => $lead['tanggal']  ?? null,
            'acara'            => $lead['acara']    ?? null,
            'lokasi'           => $lead['lokasi']   ?? null,
            'jarak_km'         => $jarak['km']      ?? null,
            'transport_gratis' => $jarak['gratis']  ?? null,
            'booking_id'       => $booking?->id,
        ];
    }
}
