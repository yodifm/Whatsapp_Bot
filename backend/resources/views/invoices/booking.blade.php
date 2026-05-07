<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Invoice #{{ $booking->id }}</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'DejaVu Sans', sans-serif; font-size: 13px; color: #1f2937; background: #fff; }
    .page { padding: 40px 48px; }

    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
    .brand-name { font-size: 22px; font-weight: 700; color: #4f46e5; letter-spacing: -0.5px; }
    .brand-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .invoice-meta { text-align: right; }
    .invoice-title { font-size: 26px; font-weight: 700; color: #4f46e5; letter-spacing: -1px; }
    .invoice-type { display: inline-block; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 99px; margin-top: 4px; letter-spacing: 0.5px; }
    .invoice-type-dp       { background: #d1fae5; color: #065f46; }
    .invoice-type-full     { background: #ede9fe; color: #5b21b6; }
    .invoice-type-proforma { background: #fef3c7; color: #92400e; }
    .invoice-num { font-size: 12px; color: #6b7280; margin-top: 5px; }

    /* Divider */
    .divider { border: none; border-top: 2px solid #e5e7eb; margin: 0 0 28px; }
    .divider-light { border: none; border-top: 1px solid #f3f4f6; margin: 12px 0; }

    /* Info grid */
    .info-grid { display: flex; gap: 0; margin-bottom: 28px; }
    .info-col { flex: 1; }
    .info-col + .info-col { border-left: 1px solid #f3f4f6; padding-left: 24px; margin-left: 24px; }
    .info-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #9ca3af; margin-bottom: 5px; }
    .info-value { font-size: 13px; color: #111827; font-weight: 600; line-height: 1.5; }
    .info-sub { font-size: 12px; color: #6b7280; margin-top: 1px; }

    /* Status badge */
    .badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-pending   { background: #fef3c7; color: #92400e; }
    .badge-confirmed { background: #dbeafe; color: #1e40af; }
    .badge-dp_paid   { background: #d1fae5; color: #065f46; }
    .badge-completed { background: #ede9fe; color: #5b21b6; }
    .badge-cancelled { background: #fee2e2; color: #991b1b; }

    /* Table */
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { background: #4f46e5; color: #fff; }
    thead th { padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 600; letter-spacing: 0.3px; }
    tbody tr { border-bottom: 1px solid #f3f4f6; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    tbody td { padding: 10px 14px; font-size: 13px; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }

    /* Totals */
    .totals { width: 300px; margin-left: auto; margin-bottom: 28px; }
    .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
    .totals-row.grand-total { border-top: 2px solid #4f46e5; margin-top: 4px; padding-top: 10px; font-size: 15px; font-weight: 700; color: #4f46e5; }
    .totals-row.dp-paid { color: #059669; font-weight: 600; }
    .totals-row.sisa { font-size: 14px; font-weight: 700; color: #dc2626; border-top: 1px dashed #e5e7eb; padding-top: 8px; margin-top: 4px; }

    /* Payment info box */
    .payment-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 14px 16px; margin-bottom: 24px; }
    .payment-box-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #059669; margin-bottom: 8px; }
    .payment-row { display: flex; justify-content: space-between; font-size: 12px; color: #374151; padding: 2px 0; }
    .payment-row .label { color: #6b7280; }

    /* Notes */
    .notes { background: #f8faff; border-left: 3px solid #4f46e5; padding: 12px 16px; border-radius: 0 6px 6px 0; margin-bottom: 28px; font-size: 12px; color: #4b5563; line-height: 1.6; }

    /* Terms */
    .terms { font-size: 11px; color: #9ca3af; margin-bottom: 24px; line-height: 1.6; }
    .terms-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #9ca3af; margin-bottom: 4px; }

    /* Footer */
    .footer { border-top: 1px solid #e5e7eb; padding-top: 14px; display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af; }
</style>
</head>
<body>
<div class="page">

    {{-- Header --}}
    <div class="header">
        <div>
            <div class="brand-name">{{ $studioName }}</div>
            <div class="brand-sub">Photobooth &amp; Studio Photography</div>
        </div>
        <div class="invoice-meta">
            <div class="invoice-title">INVOICE</div>
            @if(($invoiceType ?? 'proforma') === 'dp')
                <div><span class="invoice-type invoice-type-dp">TANDA TERIMA DP</span></div>
            @elseif(($invoiceType ?? 'proforma') === 'full')
                <div><span class="invoice-type invoice-type-full">INVOICE LUNAS</span></div>
            @else
                <div><span class="invoice-type invoice-type-proforma">TAGIHAN BOOKING</span></div>
            @endif
            <div class="invoice-num">#INV-{{ str_pad($booking->id, 4, '0', STR_PAD_LEFT) }}</div>
            <div class="invoice-num">Diterbitkan: {{ now()->translatedFormat('d F Y') }}</div>
        </div>
    </div>

    <hr class="divider">

    {{-- Customer & event info --}}
    <div class="info-grid">
        <div class="info-col">
            <div class="info-label">Ditagihkan kepada</div>
            <div class="info-value">{{ $booking->customer->nama }}</div>
            @if($booking->no_whatsapp ?? $booking->customer->no_whatsapp)
                <div class="info-sub">WhatsApp: {{ $booking->no_whatsapp ?? $booking->customer->no_whatsapp }}</div>
            @endif
            @if($booking->email ?? $booking->customer->email)
                <div class="info-sub">{{ $booking->email ?? $booking->customer->email }}</div>
            @endif
        </div>
        <div class="info-col">
            <div class="info-label">Detail Acara</div>
            @if($booking->nama_acara)
                <div class="info-value">{{ $booking->nama_acara }}</div>
            @endif
            <div class="info-sub">{{ $booking->tanggal->translatedFormat('l, d F Y') }}</div>
            @if($booking->jam_mulai)
                <div class="info-sub">Pukul {{ $booking->jam_mulai }}
                    @if($booking->durasi_jam)({{ $booking->durasi_jam }} jam)@endif
                </div>
            @endif
            @if($booking->frame)
                <div class="info-sub">Frame {{ strtoupper($booking->frame) }}
                    @if($booking->warna_backdrop) · Backdrop {{ $booking->warna_backdrop }}@endif
                </div>
            @endif
        </div>
        <div class="info-col" style="flex: 0 0 auto; text-align: right;">
            <div class="info-label">Status</div>
            <span class="badge badge-{{ $booking->status }}">{{ strtoupper(str_replace('_', ' ', $booking->status)) }}</span>
        </div>
    </div>

    {{-- Items table --}}
    <table>
        <thead>
            <tr>
                <th>Deskripsi</th>
                <th class="text-center" style="width:60px">Qty</th>
                <th class="text-right" style="width:140px">Harga</th>
                <th class="text-right" style="width:140px">Total</th>
            </tr>
        </thead>
        <tbody>
            @if($booking->package)
            <tr>
                <td>
                    <strong>{{ $booking->package->nama }}</strong>
                    <br><span style="color:#6b7280;font-size:11px">Sewa Photobooth – {{ $booking->package->durasi_jam }} jam</span>
                    @if($booking->package->deskripsi)
                        <br><span style="color:#9ca3af;font-size:11px">{{ $booking->package->deskripsi }}</span>
                    @endif
                </td>
                <td class="text-center">1</td>
                <td class="text-right">Rp {{ number_format($booking->package->harga, 0, ',', '.') }}</td>
                <td class="text-right">Rp {{ number_format($booking->package->harga, 0, ',', '.') }}</td>
            </tr>
            @else
            <tr>
                <td>
                    <strong>Sewa Photobooth</strong>
                    <br><span style="color:#9ca3af;font-size:11px">Paket belum dipilih — akan dikonfirmasi admin</span>
                </td>
                <td class="text-center">1</td>
                <td class="text-right" style="color:#9ca3af">—</td>
                <td class="text-right" style="color:#9ca3af">—</td>
            </tr>
            @endif
        </tbody>
    </table>

    @php
        $total = $booking->package ? $booking->package->harga : 0;
        $dp    = $booking->dp_amount ?? 0;
        $sisa  = max(0, $total - $dp);
    @endphp

    {{-- Totals --}}
    <div class="totals">
        <div class="totals-row"><span>Subtotal</span><span>Rp {{ number_format($total, 0, ',', '.') }}</span></div>
        <div class="totals-row"><span>Diskon</span><span>Rp 0</span></div>
        <div class="totals-row grand-total"><span>Total</span><span>Rp {{ number_format($total, 0, ',', '.') }}</span></div>
        @if($dp > 0)
        <div class="totals-row dp-paid">
            <span>✓ DP Diterima</span>
            <span>- Rp {{ number_format($dp, 0, ',', '.') }}</span>
        </div>
        <div class="totals-row sisa">
            <span>Sisa Pelunasan</span>
            <span>Rp {{ number_format($sisa, 0, ',', '.') }}</span>
        </div>
        @endif
    </div>

    {{-- Payment info box --}}
    @if(($invoiceType ?? 'proforma') === 'dp' && $dp > 0)
    <div class="payment-box">
        <div class="payment-box-title">✓ Pembayaran DP Diterima</div>
        <div class="payment-row"><span class="label">Jumlah DP</span><span>Rp {{ number_format($dp, 0, ',', '.') }}</span></div>
        <div class="payment-row"><span class="label">Tanggal Diterima</span><span>{{ now()->translatedFormat('d F Y') }}</span></div>
        <div class="payment-row"><span class="label">Sisa Pelunasan</span><span style="color:#dc2626; font-weight:700">Rp {{ number_format($sisa, 0, ',', '.') }}</span></div>
    </div>
    @elseif(($invoiceType ?? 'proforma') === 'proforma' && $total > 0)
    @php $dp50 = (int) round($total * 0.5); @endphp
    <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:6px; padding:14px 16px; margin-bottom:24px;">
        <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:#b45309; margin-bottom:8px;">
            ⏳ Tagihan DP — Harap Segera Dibayarkan
        </div>
        <div style="display:flex; justify-content:space-between; font-size:13px; padding:3px 0; color:#374151;">
            <span style="color:#6b7280;">Total Paket</span><span>Rp {{ number_format($total, 0, ',', '.') }}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:14px; font-weight:700; padding:3px 0; color:#b45309;">
            <span>DP 50% yang harus dibayar</span><span>Rp {{ number_format($dp50, 0, ',', '.') }}</span>
        </div>
        <div style="margin-top:6px; font-size:11px; color:#92400e;">
            Batas pembayaran DP: paling lambat H-2 minggu sebelum acara
        </div>
    </div>
    @endif

    {{-- Catatan --}}
    @if($booking->catatan)
    <div class="notes">
        <strong>Catatan:</strong> {{ $booking->catatan }}
    </div>
    @endif

    {{-- Bank account for payment --}}
    @php
        $sisa2         = max(0, ($booking->package ? $booking->package->harga : 0) - ($booking->dp_amount ?? 0));
        $transferLabel = ($invoiceType ?? 'proforma') === 'proforma'
            ? 'Transfer DP 50% ke:'
            : 'Transfer Sisa Pelunasan ke:';
        $transferAmt   = ($invoiceType ?? 'proforma') === 'proforma'
            ? (int) round($total * 0.5)
            : $sisa2;
    @endphp
    @if($transferAmt > 0 && !empty($bankName ?? '') && !empty($bankAccountNumber ?? ''))
    <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:6px; padding:14px 16px; margin-bottom:24px;">
        <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:#b45309; margin-bottom:8px;">
            💳 {{ $transferLabel }}
        </div>
        <div style="display:flex; gap:24px; font-size:13px;">
            <div>
                <div style="color:#92400e; font-size:10px; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:3px;">Bank</div>
                <div style="font-weight:700; color:#1f2937;">{{ $bankName }}</div>
            </div>
            <div>
                <div style="color:#92400e; font-size:10px; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:3px;">No. Rekening</div>
                <div style="font-weight:700; color:#1f2937; font-size:15px; letter-spacing:1px;">{{ $bankAccountNumber }}</div>
            </div>
            @if(!empty($bankAccountHolder ?? ''))
            <div>
                <div style="color:#92400e; font-size:10px; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:3px;">Atas Nama</div>
                <div style="font-weight:700; color:#1f2937;">{{ $bankAccountHolder }}</div>
            </div>
            @endif
        </div>
        <div style="margin-top:8px; font-size:11px; color:#92400e;">
            @if(($invoiceType ?? 'proforma') === 'proforma')
                DP <strong>Rp {{ number_format($transferAmt, 0, ',', '.') }}</strong> paling lambat H-2 minggu sebelum acara.
            @else
                Sisa pelunasan <strong>Rp {{ number_format($transferAmt, 0, ',', '.') }}</strong> paling lambat H-1 sebelum acara.
            @endif
        </div>
    </div>
    @endif

    {{-- Payment terms --}}
    <div class="terms">
        <div class="terms-title">Syarat Pembayaran</div>
        • DP 50% dibayarkan maksimal H-2 minggu sebelum acara &nbsp;|&nbsp;
        • Pelunasan dilakukan maksimal H-1 acara &nbsp;|&nbsp;
        • Design custom frame maksimal 3x revisi
    </div>

    <div class="footer">
        <span>Terima kasih telah mempercayakan momen spesial Anda kepada kami 🎉</span>
        <span>{{ $studioName }} · {{ now()->format('Y') }}</span>
    </div>

</div>
</body>
</html>
