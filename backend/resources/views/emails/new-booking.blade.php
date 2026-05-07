<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Booking Baru</title>
<style>
  body { margin: 0; padding: 0; background: #f3f4f6; font-family: 'Segoe UI', Arial, sans-serif; }
  .wrap { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
  .header { background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%); padding: 32px 36px 28px; }
  .header h1 { margin: 0; color: #fff; font-size: 22px; font-weight: 700; letter-spacing: -.3px; }
  .header p { margin: 6px 0 0; color: rgba(255,255,255,.75); font-size: 14px; }
  .badge { display: inline-block; margin-top: 12px; background: rgba(255,255,255,.2); color: #fff; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 999px; }
  .body { padding: 28px 36px; }
  .section-title { font-size: 11px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px; }
  .row { display: flex; justify-content: space-between; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
  .row:last-child { border-bottom: none; }
  .row .label { font-size: 13px; color: #9ca3af; min-width: 130px; }
  .row .value { font-size: 13px; color: #111827; font-weight: 600; text-align: right; word-break: break-word; }
  .divider { height: 1px; background: #f3f4f6; margin: 20px 0; }
  .highlight { background: #fef3c7; border: 1px solid #fde68a; border-radius: 10px; padding: 14px 18px; margin-top: 20px; }
  .highlight p { margin: 0; font-size: 13px; color: #92400e; }
  .footer { background: #f9fafb; padding: 18px 36px; text-align: center; border-top: 1px solid #f3f4f6; }
  .footer p { margin: 0; font-size: 12px; color: #9ca3af; }
  .status-pending { background: #fef3c7; color: #92400e; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 999px; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>📸 Ada Booking Baru!</h1>
    <p>Segera tindak lanjuti dan konfirmasi ke customer.</p>
    <span class="badge">STATUS: PENDING</span>
  </div>

  <div class="body">
    <p class="section-title">Info Customer</p>
    <div class="row">
      <span class="label">Nama</span>
      <span class="value">{{ $booking->customer?->nama ?? '-' }}</span>
    </div>
    <div class="row">
      <span class="label">No. WhatsApp</span>
      <span class="value">{{ $booking->no_whatsapp ?? $booking->customer?->whatsapp_id ?? '-' }}</span>
    </div>
    @if($booking->email)
    <div class="row">
      <span class="label">Email</span>
      <span class="value">{{ $booking->email }}</span>
    </div>
    @endif

    <div class="divider"></div>

    <p class="section-title">Detail Booking</p>
    <div class="row">
      <span class="label">Nama Acara</span>
      <span class="value">{{ $booking->nama_acara ?? '-' }}</span>
    </div>
    <div class="row">
      <span class="label">Tanggal</span>
      <span class="value">{{ $booking->tanggal->format('l, d M Y') }}</span>
    </div>
    <div class="row">
      <span class="label">Jam Mulai</span>
      <span class="value">{{ $booking->jam_mulai ?? '-' }}</span>
    </div>
    @if($booking->package)
    <div class="row">
      <span class="label">Paket</span>
      <span class="value">{{ $booking->package->nama }} — Rp {{ number_format($booking->package->harga, 0, ',', '.') }}</span>
    </div>
    @endif
    <div class="row">
      <span class="label">Frame</span>
      <span class="value">{{ strtoupper($booking->frame ?? '-') }}</span>
    </div>
    <div class="row">
      <span class="label">Warna Backdrop</span>
      <span class="value">{{ $booking->warna_backdrop ?? '-' }}</span>
    </div>
    @if($booking->catatan)
    <div class="row">
      <span class="label">Lokasi / Catatan</span>
      <span class="value">{{ $booking->catatan }}</span>
    </div>
    @endif

    <div class="highlight">
      <p>⚡ Segera buka dashboard admin untuk konfirmasi booking ini ya!</p>
    </div>
  </div>

  <div class="footer">
    <p>Email ini dikirim otomatis oleh sistem Waktunya Photobooth · {{ now()->format('d M Y, H:i') }} WIB</p>
  </div>
</div>
</body>
</html>
