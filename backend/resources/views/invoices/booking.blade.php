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
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; }
    .brand-name { font-size: 22px; font-weight: 700; color: #4f46e5; letter-spacing: -0.5px; }
    .brand-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .invoice-meta { text-align: right; }
    .invoice-title { font-size: 28px; font-weight: 700; color: #4f46e5; letter-spacing: -1px; }
    .invoice-num { font-size: 13px; color: #6b7280; margin-top: 2px; }

    /* Divider */
    .divider { border: none; border-top: 2px solid #e5e7eb; margin: 0 0 28px; }

    /* Info grid */
    .info-grid { display: flex; gap: 0; margin-bottom: 32px; }
    .info-col { flex: 1; }
    .info-col + .info-col { border-left: 1px solid #f3f4f6; padding-left: 24px; margin-left: 24px; }
    .info-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #9ca3af; margin-bottom: 6px; }
    .info-value { font-size: 13px; color: #111827; font-weight: 600; line-height: 1.5; }
    .info-sub { font-size: 12px; color: #6b7280; }

    /* Status badge */
    .badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-pending    { background: #fef3c7; color: #92400e; }
    .badge-confirmed  { background: #dbeafe; color: #1e40af; }
    .badge-dp_paid    { background: #d1fae5; color: #065f46; }
    .badge-completed  { background: #ede9fe; color: #5b21b6; }
    .badge-cancelled  { background: #fee2e2; color: #991b1b; }

    /* Table */
    table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    thead tr { background: #4f46e5; color: #fff; }
    thead th { padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 600; letter-spacing: 0.3px; }
    tbody tr { border-bottom: 1px solid #f3f4f6; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    tbody td { padding: 10px 14px; font-size: 13px; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }

    /* Totals */
    .totals { width: 280px; margin-left: auto; margin-bottom: 32px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .totals-row.total { border-top: 2px solid #4f46e5; margin-top: 4px; padding-top: 10px; font-size: 15px; font-weight: 700; color: #4f46e5; }
    .totals-row.sisa { font-size: 14px; font-weight: 600; color: #dc2626; }

    /* Notes */
    .notes { background: #f8faff; border-left: 3px solid #4f46e5; padding: 12px 16px; border-radius: 0 6px 6px 0; margin-bottom: 32px; font-size: 12px; color: #4b5563; line-height: 1.6; }

    /* Footer */
    .footer { border-top: 1px solid #e5e7eb; padding-top: 16px; display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af; }
</style>
</head>
<body>
<div class="page">

    <div class="header">
        <div>
            <div class="brand-name">{{ $studioName }}</div>
            <div class="brand-sub">Photobooth &amp; Studio Photography</div>
        </div>
        <div class="invoice-meta">
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-num">#INV-{{ str_pad($booking->id, 4, '0', STR_PAD_LEFT) }}</div>
            <div class="invoice-num" style="margin-top:4px">
                Tgl: {{ now()->format('d F Y') }}
            </div>
        </div>
    </div>

    <hr class="divider">

    <div class="info-grid">
        <div class="info-col">
            <div class="info-label">Ditagihkan kepada</div>
            <div class="info-value">{{ $booking->customer->nama }}</div>
            <div class="info-sub">{{ $booking->customer->whatsapp_id }}</div>
        </div>
        <div class="info-col">
            <div class="info-label">Detail Acara</div>
            @if($booking->nama_acara)
                <div class="info-value">{{ $booking->nama_acara }}</div>
            @endif
            <div class="info-sub">{{ $booking->tanggal->translatedFormat('d F Y') }}</div>
            @if($booking->jam_mulai)
                <div class="info-sub">Pukul {{ $booking->jam_mulai }}
                    @if($booking->durasi_jam) ({{ $booking->durasi_jam }} jam) @endif
                </div>
            @endif
        </div>
        <div class="info-col" style="text-align:right; flex: 0 0 auto; border-left: 1px solid #f3f4f6; padding-left: 24px;">
            <div class="info-label">Status</div>
            <span class="badge badge-{{ $booking->status }}">{{ strtoupper($booking->status) }}</span>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Deskripsi</th>
                <th class="text-center">Qty</th>
                <th class="text-right">Harga</th>
                <th class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @if($booking->package)
            <tr>
                <td>
                    <strong>{{ $booking->package->nama }}</strong>
                    @if($booking->package->deskripsi)
                        <br><span style="color:#6b7280;font-size:11px">{{ $booking->package->deskripsi }}</span>
                    @endif
                </td>
                <td class="text-center">1</td>
                <td class="text-right">Rp {{ number_format($booking->package->harga, 0, ',', '.') }}</td>
                <td class="text-right">Rp {{ number_format($booking->package->harga, 0, ',', '.') }}</td>
            </tr>
            @else
            <tr>
                <td colspan="4" style="color:#9ca3af; font-style:italic; text-align:center;">
                    Paket belum dipilih
                </td>
            </tr>
            @endif
        </tbody>
    </table>

    @php
        $total = $booking->package ? $booking->package->harga : 0;
        $dp    = $booking->dp_amount ?? 0;
        $sisa  = $total - $dp;
    @endphp

    <div class="totals">
        <div class="totals-row"><span>Subtotal</span><span>Rp {{ number_format($total, 0, ',', '.') }}</span></div>
        <div class="totals-row total"><span>Total</span><span>Rp {{ number_format($total, 0, ',', '.') }}</span></div>
        @if($dp > 0)
        <div class="totals-row" style="color:#059669"><span>DP Terbayar</span><span>- Rp {{ number_format($dp, 0, ',', '.') }}</span></div>
        <div class="totals-row sisa"><span>Sisa Pembayaran</span><span>Rp {{ number_format($sisa, 0, ',', '.') }}</span></div>
        @endif
    </div>

    @if($booking->catatan)
    <div class="notes">
        <strong>Catatan:</strong><br>{{ $booking->catatan }}
    </div>
    @endif

    <div class="footer">
        <span>Terima kasih telah mempercayakan momen spesial Anda kepada kami 🎉</span>
        <span>{{ $studioName }} · {{ now()->format('Y') }}</span>
    </div>

</div>
</body>
</html>
