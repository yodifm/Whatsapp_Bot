<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class InvoiceController extends Controller
{
    public function download(Booking $booking): Response
    {
        $booking->load(['customer', 'package']);

        $studioName = Setting::where('key', 'studio_name')->value('value') ?? 'Waktunya Photobooth';

        $pdf = Pdf::loadView('invoices.booking', [
            'booking'           => $booking,
            'studioName'        => $studioName,
            'bankName'          => Setting::where('key', 'bank_name')->value('value')           ?? '',
            'bankAccountNumber' => Setting::where('key', 'bank_account_number')->value('value') ?? '',
            'bankAccountHolder' => Setting::where('key', 'bank_account_holder')->value('value') ?? '',
            'invoiceType'       => $booking->status === 'dp_paid' ? 'dp' : 'full',
        ])->setPaper('a4');

        $filename = 'invoice-' . $booking->id . '-' . str($booking->customer->nama)->slug() . '.pdf';

        return $pdf->download($filename);
    }

    public function preview(Booking $booking): Response
    {
        $booking->load(['customer', 'package']);

        $studioName = Setting::where('key', 'studio_name')->value('value') ?? 'Waktunya Photobooth';

        $pdf = Pdf::loadView('invoices.booking', [
            'booking'           => $booking,
            'studioName'        => $studioName,
            'bankName'          => Setting::where('key', 'bank_name')->value('value')           ?? '',
            'bankAccountNumber' => Setting::where('key', 'bank_account_number')->value('value') ?? '',
            'bankAccountHolder' => Setting::where('key', 'bank_account_holder')->value('value') ?? '',
            'invoiceType'       => $booking->status === 'dp_paid' ? 'dp' : 'full',
        ])->setPaper('a4');

        return $pdf->stream('invoice-preview.pdf');
    }
}
