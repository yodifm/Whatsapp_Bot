<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoiceService
{
    /**
     * Generate a DP invoice PDF, save it to public/invoices/, and return the URL.
     */
    public function generateDpInvoice(Booking $booking): string
    {
        $booking->loadMissing(['customer', 'package']);

        $dir = public_path('invoices');
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $slug     = str($booking->customer->nama)->slug();
        $filename = "invoice-dp-{$booking->id}-{$slug}.pdf";
        $path     = $dir . DIRECTORY_SEPARATOR . $filename;

        $pdf = Pdf::loadView('invoices.booking', [
            'booking'            => $booking,
            'studioName'         => Setting::get('studio_name')         ?: 'Poonya Bot Photobooth',
            'bankName'           => Setting::get('bank_name')           ?: '',
            'bankAccountNumber'  => Setting::get('bank_account_number') ?: '',
            'bankAccountHolder'  => Setting::get('bank_account_holder') ?: '',
            'invoiceType'        => 'dp',
        ])->setPaper('a4');

        $pdf->save($path);

        return url("invoices/{$filename}");
    }
}
