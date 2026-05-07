<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewBookingMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly Booking $booking) {}

    public function envelope(): Envelope
    {
        $acara  = $this->booking->nama_acara ?? 'Tanpa Nama Acara';
        $nama   = $this->booking->customer?->nama ?? $this->booking->no_whatsapp;
        $tgl    = $this->booking->tanggal->format('d M Y');

        return new Envelope(
            subject: "📸 Booking Baru — {$nama} ({$tgl})",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.new-booking',
        );
    }
}
