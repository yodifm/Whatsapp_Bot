<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Setting;
use App\Services\WhatsAppService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Throwable;

class InvoiceController extends Controller
{
    private function resolveType(Booking $booking): string
    {
        return match($booking->status) {
            'dp_paid'   => 'dp',
            'completed' => 'full',
            default     => 'proforma',
        };
    }

    private function buildData(Booking $booking): array
    {
        return [
            'booking'           => $booking,
            'studioName'        => Setting::where('key', 'studio_name')->value('value')           ?? 'Waktunya Photobooth',
            'bankName'          => Setting::where('key', 'bank_name')->value('value')             ?? '',
            'bankAccountNumber' => Setting::where('key', 'bank_account_number')->value('value')   ?? '',
            'bankAccountHolder' => Setting::where('key', 'bank_account_holder')->value('value')   ?? '',
            'invoiceType'       => $this->resolveType($booking),
        ];
    }

    public function download(Booking $booking): Response
    {
        $booking->load(['customer', 'package']);

        $pdf      = Pdf::loadView('invoices.booking', $this->buildData($booking))->setPaper('a4');
        $filename = 'invoice-' . $booking->id . '-' . str($booking->customer->nama)->slug() . '.pdf';

        return $pdf->download($filename);
    }

    public function preview(Booking $booking): Response
    {
        $booking->load(['customer', 'package']);

        $pdf = Pdf::loadView('invoices.booking', $this->buildData($booking))->setPaper('a4');

        return $pdf->stream('invoice-preview.pdf');
    }

    public function sendViaWa(Booking $booking): JsonResponse
    {
        $booking->load(['customer', 'package']);

        $waId = $booking->customer->whatsapp_id ?? null;
        if (! $waId) {
            return response()->json(['message' => 'Customer tidak memiliki nomor WhatsApp.'], 422);
        }

        $data = $this->buildData($booking);
        $pdf  = Pdf::loadView('invoices.booking', $data)->setPaper('a4');

        $dir = public_path('invoices');
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $slug     = str($booking->customer->nama)->slug();
        $filename = "invoice-{$booking->id}-{$slug}.pdf";
        $path     = $dir . DIRECTORY_SEPARATOR . $filename;
        $pdf->save($path);

        $caption = match($data['invoiceType']) {
            'proforma' => "Halo {$booking->customer->nama}! Berikut invoice booking photobooth kamu ya kak 📄\n\nMohon segera lakukan pembayaran DP 50% paling lambat H-2 minggu sebelum acara. Terima kasih! 😊",
            'dp'       => "Halo {$booking->customer->nama}! Berikut invoice DP booking kamu ya kak 📄\n\nTerima kasih atas pembayaran DP-nya! Jangan lupa lunasi sebelum H-1 acara ya 😊",
            default    => "Halo {$booking->customer->nama}! Berikut invoice booking kamu ya kak 📄",
        };

        try {
            $wa = app(WhatsAppService::class);
            $wa->sendDocument($waId, $path, "Invoice-{$booking->id}.pdf", $caption);
        } catch (Throwable $e) {
            return response()->json(['message' => 'Gagal mengirim WhatsApp: ' . $e->getMessage()], 500);
        }

        return response()->json(['message' => 'Invoice berhasil dikirim ke WhatsApp customer.']);
    }
}
