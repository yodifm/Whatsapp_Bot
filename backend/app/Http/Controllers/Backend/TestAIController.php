<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\Discount;
use App\Models\Faq;
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
        ]);

        $packages    = Package::where('aktif', true)->get()->toArray();
        $faqs        = Faq::where('aktif', true)->orderBy('urutan')->get()->toArray();
        $discounts   = Discount::where('aktif', true)
            ->where('berlaku_sampai', '>=', now()->toDateString())
            ->get()->map(fn($d) => [
                'nama'           => $d->nama,
                'label'          => $d->label,
                'berlaku_sampai' => $d->berlaku_sampai->format('d M Y'),
            ])->toArray();
        $bookedDates = Booking::whereNotIn('status', ['cancelled'])
            ->pluck('tanggal')
            ->map(fn($d) => $d->format('Y-m-d'))
            ->unique()->values()->toArray();

        try {
            $ai       = new AIService();
            $rawReply = $ai->getReply(
                $request->message,
                $request->history ?? [],
                $packages,
                $faqs,
                $bookedDates,
                $discounts,
            );

            ['reply' => $reply, 'lead' => $lead] = $ai->extractLeadData($rawReply);

            $savedLead = null;
            if ($lead && ! empty($lead['nama'])) {
                $savedLead = $this->saveLead($lead);
            }

            return response()->json([
                'reply'         => $reply,
                'lead_saved'    => $savedLead,
                'pricelist_url' => $savedLead ? url('images/pricelist.jpg') : null,
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
