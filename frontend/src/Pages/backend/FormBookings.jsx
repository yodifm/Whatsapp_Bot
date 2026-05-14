import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import BackendLayout from '@/layouts/BackendLayout';
import api from '@/api/axios';
import { useToast } from '@/context/ToastContext';
import ConfirmModal from '@/components/ConfirmModal';
import { TableSkeleton } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_OPTS = [
    { val: 'pending',   label: 'Pending',    color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { val: 'confirmed', label: 'Confirmed',  color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { val: 'dp_paid',   label: 'DP Paid',    color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    { val: 'completed', label: 'Selesai',    color: 'bg-green-100 text-green-700 border-green-200' },
    { val: 'cancelled', label: 'Dibatalkan', color: 'bg-red-100 text-red-700 border-red-200' },
];

const DP_STATUSES = ['dp_paid', 'completed'];

// Fallbacks used before /op-assets loads
const DEFAULT_BOOTHS   = ['Booth 1', 'Booth 2', 'Booth 3', 'Open Booth', 'Selfie Booth', 'Ringlight', 'Custom'];
const DEFAULT_PRINTERS = ['DNP', 'Fuji', 'Canon', 'Epson', 'Mitsubishi', 'Lainnya'];

const BACKDROP_COLORS = {
    Black: '#1a1a1a', Silver: '#C0C0C0', Gold: '#D4AF37',
    Maroon: '#800000', 'Putih Polos': '#F5F5F5',
};

function statusBadge(val) {
    return STATUS_OPTS.find(o => o.val === val) ?? { label: val, color: 'bg-gray-100 text-gray-600 border-gray-200' };
}

// ─── Inline Cell Components ───────────────────────────────────────────────────

function CheckCell({ checked, onToggle }) {
    return (
        <button onClick={onToggle}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all mx-auto
                ${checked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400'}`}>
            {checked && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            )}
        </button>
    );
}

function AmtCell({ value, onSave }) {
    const [editing, setEditing] = useState(false);
    const [val, setVal]         = useState('');
    const ref = useRef();

    const start = () => { setVal(value ?? ''); setEditing(true); setTimeout(() => ref.current?.select(), 0); };
    const save  = () => {
        setEditing(false);
        const n = val === '' ? null : parseInt(String(val).replace(/\D/g, ''), 10) || null;
        if (n !== value) onSave(n);
    };

    if (editing) {
        return (
            <input ref={ref} type="text" value={val ?? ''}
                onChange={e => setVal(e.target.value)}
                onBlur={save}
                onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
                className="w-full text-xs border border-indigo-400 rounded px-1.5 py-0.5 focus:outline-none"
                placeholder="0" />
        );
    }
    return (
        <button onClick={start} className="text-xs text-left w-full hover:bg-indigo-50 px-1.5 py-0.5 rounded transition min-h-[22px]">
            {value ? <span className="font-medium text-gray-800">Rp {Number(value).toLocaleString('id-ID')}</span>
                   : <span className="text-gray-300">--</span>}
        </button>
    );
}

function TxtCell({ value, onSave, placeholder = '--' }) {
    const [editing, setEditing] = useState(false);
    const [val, setVal]         = useState('');
    const ref = useRef();

    const start = () => { setVal(value ?? ''); setEditing(true); setTimeout(() => ref.current?.focus(), 0); };
    const save  = () => { setEditing(false); const v = val.trim() || null; if (v !== value) onSave(v); };

    if (editing) {
        return (
            <input ref={ref} type="text" value={val}
                onChange={e => setVal(e.target.value)}
                onBlur={save}
                onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
                className="w-full text-xs border border-indigo-400 rounded px-1.5 py-0.5 focus:outline-none"
                placeholder={placeholder} />
        );
    }
    return (
        <button onClick={start} className="text-xs text-left w-full hover:bg-indigo-50 px-1.5 py-0.5 rounded transition min-h-[22px]">
            {value ? <span className="text-gray-800">{value}</span> : <span className="text-gray-300">{placeholder}</span>}
        </button>
    );
}

function NumCell({ value, onSave, unit = '' }) {
    const [editing, setEditing] = useState(false);
    const [val, setVal]         = useState('');
    const ref = useRef();

    const start = () => { setVal(value ?? ''); setEditing(true); setTimeout(() => ref.current?.select(), 0); };
    const save  = () => {
        setEditing(false);
        const n = val === '' ? null : parseFloat(val) || null;
        if (n !== value) onSave(n);
    };

    if (editing) {
        return (
            <input ref={ref} type="number" step="0.1" value={val}
                onChange={e => setVal(e.target.value)}
                onBlur={save}
                onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
                className="w-full text-xs border border-indigo-400 rounded px-1.5 py-0.5 focus:outline-none" />
        );
    }
    return (
        <button onClick={start} className="text-xs text-left w-full hover:bg-indigo-50 px-1.5 py-0.5 rounded transition min-h-[22px]">
            {value != null ? <span className="text-gray-800">{value}{unit && ` ${unit}`}</span>
                           : <span className="text-gray-300">--</span>}
        </button>
    );
}

function PickCell({ value, options, labels, onSave }) {
    const [open, setOpen] = useState(false);
    const [pos,  setPos]  = useState({ top: 0, left: 0 });
    const btnRef  = useRef();
    const menuRef = useRef();

    useEffect(() => {
        if (!open) return;
        const close = e => {
            if (!menuRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [open]);

    const toggle = () => {
        if (!open && btnRef.current) {
            const r = btnRef.current.getBoundingClientRect();
            setPos({ top: r.bottom + 4, left: r.left });
        }
        setOpen(o => !o);
    };

    const label = value ? (labels ? (labels[value] ?? value) : value) : null;

    return (
        <>
            <button ref={btnRef} onClick={toggle}
                className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border font-medium transition whitespace-nowrap
                    ${label
                        ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                        : 'text-gray-300 border-gray-200 hover:border-sky-300 hover:text-sky-500'}`}>
                {label || '+ pilih'}
                <svg className="w-2.5 h-2.5 flex-shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
            </button>

            {open && createPortal(
                <div ref={menuRef}
                    style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
                    className="bg-white shadow-2xl rounded-2xl border border-gray-100 py-1.5 min-w-[140px] overflow-hidden">
                    <button onClick={() => { onSave(null); setOpen(false); }}
                        className="w-full text-left text-xs px-4 py-2 text-gray-400 hover:bg-gray-50 transition">
                        — Hapus pilihan
                    </button>
                    <div className="h-px bg-gray-100 mx-2 my-1" />
                    {options.map(o => {
                        const lbl = labels ? (labels[o] ?? o) : o;
                        const active = value === o || (labels && value === o);
                        return (
                            <button key={o} onClick={() => { onSave(o); setOpen(false); }}
                                className={`w-full text-left text-xs px-4 py-2 flex items-center justify-between transition
                                    ${active ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>
                                {lbl}
                                {active && (
                                    <svg className="w-3 h-3 text-sky-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                                    </svg>
                                )}
                            </button>
                        );
                    })}
                </div>,
                document.body
            )}
        </>
    );
}

// TagChips: display only (used inside table rows)
function TagChips({ tags, color = 'violet' }) {
    if (!tags?.length) return <span className="text-gray-300 text-xs">--</span>;
    const cls = {
        violet: 'bg-violet-100 text-violet-700',
        sky:    'bg-sky-100 text-sky-700',
    }[color] ?? 'bg-gray-100 text-gray-600';
    return (
        <div className="flex flex-wrap gap-1">
            {tags.map(t => (
                <span key={t} className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${cls}`}>{t}</span>
            ))}
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function FormBookings() {
    const toast = useToast();
    const [confirmCfg, setConfirmCfg] = useState(null);
    const [data,       setData]       = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [search,     setSearch]     = useState('');
    const [filter,     setFilter]     = useState('');
    const [detail,     setDetail]     = useState(null);
    const [updating,   setUpdating]   = useState(null);
    const [uploading,  setUploading]  = useState(false);
    const [previewImg, setPreviewImg] = useState(null);
    const [briefing,   setBriefing]   = useState(null);
    const [copied,     setCopied]     = useState(false);

    // Popover state for tag fields
    const [popover, setPopover] = useState(null); // { id, field, rect }
    const [staffInput, setStaffInput] = useState('');
    const popoverRef = useRef();
    const fileRef    = useRef();

    const [page,     setPage]     = useState(1);
    const PAGE_SIZE = 20;

    const [opAssets, setOpAssets] = useState({ booths: [], printers: [], transports: [], staff: [] });
    const [kiosks,   setKiosks]   = useState([]);

    // Close popover on outside click
    useEffect(() => {
        const handler = e => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) setPopover(null);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const load = async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            if (filter) params.status = filter;
            const r = await api.get('/bookings/form-submissions', { params });
            setData(r.data);
        } catch { setData([]); }
        finally  { setLoading(false); }
    };

    useEffect(() => { load(); setPage(1); }, [search, filter]);

    useEffect(() => {
        api.get('/op-assets').then(r => setOpAssets(r.data)).catch(() => {});
        api.get('/kiosks').then(r => setKiosks(r.data)).catch(() => {});
    }, []);

    const boothOpts    = opAssets.booths.length    ? opAssets.booths    : DEFAULT_BOOTHS;
    const printerOpts  = opAssets.printers.length  ? opAssets.printers  : DEFAULT_PRINTERS;
    const transportOpts = opAssets.transports;

    // Save a single operational field
    const saveOps = async (id, field, value) => {
        try {
            const { data: updated } = await api.patch(`/bookings/${id}/ops`, { [field]: value });
            setData(d => d.map(b => b.id === id ? { ...b, ...updated } : b));
            if (briefing?.id === id) setBriefing(b => ({ ...b, ...updated }));
        } catch (err) {
            console.error('saveOps', err);
        }
    };

    const changeStatus = async (id, status) => {
        setUpdating(id);
        try {
            await api.patch(`/bookings/${id}/form-status`, { status });
            setData(d => d.map(b => b.id === id ? { ...b, status } : b));
            if (detail?.id === id) setDetail(d => ({ ...d, status }));
        } finally { setUpdating(null); }
    };

    const uploadDesign = async (bookingId, file) => {
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('image', file);
            const r = await api.post(`/bookings/${bookingId}/frame-design`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const updated = {
                frame_design_url:         r.data.frame_design_url,
                frame_design_notified_at: r.data.frame_design_notified_at,
            };
            setData(d => d.map(b => b.id === bookingId ? { ...b, ...updated } : b));
            if (detail?.id === bookingId) setDetail(d => ({ ...d, ...updated }));
            toast.success('Desain berhasil diupload dan dikirim ke customer!');
        } catch { toast.error('Gagal upload desain, coba lagi.'); }
        finally  { setUploading(false); }
    };

    // Open tag popover anchored to a cell
    const openPopover = (e, id, field) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setStaffInput('');
        setPopover({ id, field, rect });
    };

    const toggleBoothTag = (id, tags, opt) => {
        const next = tags.includes(opt) ? tags.filter(t => t !== opt) : [...tags, opt];
        saveOps(id, 'type_booth', next);
    };

    const addStaffTag = (id, tags) => {
        const name = staffInput.trim();
        if (!name || tags.includes(name)) return;
        saveOps(id, 'staff_operasional', [...tags, name]);
        setStaffInput('');
    };

    const removeStaffTag = (id, tags, name) => {
        saveOps(id, 'staff_operasional', tags.filter(t => t !== name));
    };

    // ── WA Briefing text generator ──
    const buildWaText = (b) => {
        const fmtDate = b.tanggal
            ? new Date(b.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            : '-';
        const booth  = (b.type_booth ?? []).join(', ')        || '-';
        const staff  = (b.staff_operasional ?? []).join(', ') || '-';
        const fmtAmt = n => n ? `Rp ${Number(n).toLocaleString('id-ID')}` : '-';

        return `📸 *BRIEFING EVENT*
━━━━━━━━━━━━━━━━━━━━
📋 *${b.nama_acara || '-'}*
📅 ${fmtDate}${b.jam_mulai ? ` · ${b.jam_mulai.substring(0,5)}` : ''}
📍 ${b.lokasi || '-'}${b.catatan ? `\n📝 ${b.catatan}` : ''}
📦 Paket: ${b.package?.nama || '-'}

🎪 *Booth:* ${booth}
📟 *Kiosk:* ${b.kiosk?.name || '-'}
🖨️ *Printer:* ${b.printer || '-'}
🚗 *Transport:* ${b.transport || '-'}${b.total_jarak ? ` (${b.total_jarak} km)` : ''}
👥 *Staff Ops:* ${staff}

💰 *Pembayaran:*
• Invoice Terkirim : ${b.kirim_invoice ? '✅' : '❌'}
• DP               : ${b.sudah_dp ? `✅ ${fmtAmt(b.dp_amount)}` : '❌ Belum'}
• Pelunasan        : ${b.pelunasan ? `✅ ${fmtAmt(b.jumlah_pelunasan)}` : '❌ Belum'}${b.additional_info ? `\n\n📝 *Catatan:* ${b.additional_info}` : ''}
━━━━━━━━━━━━━━━━━━━━`;
    };

    const copyWaText = () => {
        if (!briefing) return;
        navigator.clipboard.writeText(buildWaText(briefing));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const exportCSV = () => {
        const headers = ['Nama', 'WhatsApp', 'Email', 'Acara', 'Tanggal', 'Jam', 'Lokasi', 'Paket', 'Frame', 'Backdrop', 'Status',
                         'Invoice', 'DP', 'Jumlah DP', 'Pelunasan', 'Jumlah Lunas', 'Kiosk', 'Printer', 'Transport', 'Jarak', 'Dibuat'];
        const csvRows = [
            headers.join(','),
            ...data.map(b => [
                `"${(b.customer.nama||'').replace(/"/g,'""')}"`,
                `"${(b.no_whatsapp||'').replace(/"/g,'""')}"`,
                `"${(b.email||'').replace(/"/g,'""')}"`,
                `"${(b.nama_acara||'').replace(/"/g,'""')}"`,
                b.tanggal,
                b.jam_mulai ? b.jam_mulai.substring(0,5) : '',
                `"${(b.lokasi||'').replace(/"/g,'""')}"`,
                `"${(b.package?.nama||'').replace(/"/g,'""')}"`,
                b.frame || '',
                `"${(b.warna_backdrop||'').replace(/"/g,'""')}"`,
                b.status,
                b.kirim_invoice ? 'Ya' : 'Tidak',
                b.sudah_dp ? 'Ya' : 'Tidak',
                b.dp_amount || 0,
                b.pelunasan ? 'Ya' : 'Tidak',
                b.jumlah_pelunasan || 0,
                `"${(b.kiosk?.name||'').replace(/"/g,'""')}"`,
                `"${(b.printer||'').replace(/"/g,'""')}"`,
                `"${(b.transport||'').replace(/"/g,'""')}"`,
                b.total_jarak || '',
                b.created_at,
            ].join(',')),
        ];
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `form-booking-${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
    };

    const printBriefing = (b) => {
        const fmtDate = b.tanggal
            ? new Date(b.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            : '-';
        const booth  = (b.type_booth ?? []).join(', ')        || '-';
        const staff  = (b.staff_operasional ?? []).join(', ') || '-';
        const fmtAmt = n => n ? `Rp ${Number(n).toLocaleString('id-ID')}` : '-';

        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Briefing — ${b.nama_acara}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;padding:32px;max-width:560px;margin:auto;color:#111}
  h1{font-size:20px;color:#4f46e5;margin-bottom:4px}
  h2{font-size:13px;color:#6b7280;font-weight:500;margin-bottom:20px}
  .section{margin-bottom:20px}
  .section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#9ca3af;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #f0f0f0}
  .row{display:flex;justify-content:space-between;align-items:flex-start;padding:6px 0;border-bottom:1px solid #f9f9f9}
  .lbl{font-size:12px;color:#6b7280;flex-shrink:0;width:140px}
  .val{font-size:12px;font-weight:600;text-align:right;flex:1}
  .chip{display:inline-block;background:#ede9fe;color:#7c3aed;padding:2px 8px;border-radius:99px;font-size:11px;margin:2px}
  .check-yes{color:#16a34a}.check-no{color:#ef4444}
  .footer{margin-top:32px;font-size:10px;color:#9ca3af;text-align:center}
</style></head><body>
<h1>📸 Briefing Event</h1>
<h2>Dicetak ${new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}</h2>

<div class="section">
  <div class="section-title">Detail Acara</div>
  <div class="row"><span class="lbl">Nama Acara</span><span class="val">${b.nama_acara || '-'}</span></div>
  <div class="row"><span class="lbl">Tanggal</span><span class="val">${fmtDate}</span></div>
  ${b.jam_mulai ? `<div class="row"><span class="lbl">Jam Mulai</span><span class="val">${b.jam_mulai.substring(0,5)}</span></div>` : ''}
  <div class="row"><span class="lbl">Lokasi</span><span class="val">${b.lokasi || '-'}</span></div>
  ${b.catatan ? `<div class="row"><span class="lbl">Catatan Cust.</span><span class="val" style="font-style:italic;color:#6b7280">${b.catatan}</span></div>` : ''}
  <div class="row"><span class="lbl">Paket</span><span class="val">${b.package?.nama || '-'}</span></div>
  <div class="row"><span class="lbl">Customer</span><span class="val">${b.customer?.nama || '-'} · ${b.no_whatsapp || '-'}</span></div>
</div>

<div class="section">
  <div class="section-title">Operasional</div>
  <div class="row"><span class="lbl">Type Booth</span><span class="val">${(b.type_booth ?? []).map(t => `<span class="chip">${t}</span>`).join('') || '-'}</span></div>
  <div class="row"><span class="lbl">Kiosk</span><span class="val">${b.kiosk?.name || '-'}</span></div>
  <div class="row"><span class="lbl">Printer</span><span class="val">${b.printer || '-'}</span></div>
  <div class="row"><span class="lbl">Transport</span><span class="val">${b.transport || '-'}${b.total_jarak ? ` (${b.total_jarak} km)` : ''}</span></div>
  <div class="row"><span class="lbl">Staff Operasional</span><span class="val">${(b.staff_operasional ?? []).map(s => `<span class="chip">${s}</span>`).join('') || '-'}</span></div>
</div>

<div class="section">
  <div class="section-title">Pembayaran</div>
  <div class="row"><span class="lbl">Invoice Terkirim</span><span class="val ${b.kirim_invoice ? 'check-yes' : 'check-no'}">${b.kirim_invoice ? '✅ Ya' : '❌ Belum'}</span></div>
  <div class="row"><span class="lbl">DP</span><span class="val ${b.sudah_dp ? 'check-yes' : 'check-no'}">${b.sudah_dp ? `✅ ${fmtAmt(b.dp_amount)}` : '❌ Belum'}</span></div>
  <div class="row"><span class="lbl">Pelunasan</span><span class="val ${b.pelunasan ? 'check-yes' : 'check-no'}">${b.pelunasan ? `✅ ${fmtAmt(b.jumlah_pelunasan)}` : '❌ Belum'}</span></div>
</div>

${b.additional_info ? `<div class="section"><div class="section-title">Catatan</div><p style="font-size:12px;color:#374151;line-height:1.5">${b.additional_info}</p></div>` : ''}

<div class="footer">Waktu Photobooth · Briefing Document</div>
<script>window.onload=()=>{window.print();}</script>
</body></html>`;

        const win = window.open('', '_blank', 'width=700,height=900');
        win.document.write(html);
        win.document.close();
    };

    // ── Stats ──
    const counts = STATUS_OPTS.reduce((acc, s) => {
        acc[s.val] = data.filter(b => b.status === s.val).length;
        return acc;
    }, {});

    const totalPages  = Math.ceil(data.length / PAGE_SIZE);
    const pagedData   = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <BackendLayout>
            <div className="p-4 sm:p-6 max-w-full space-y-4 sm:space-y-5">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Form Booking</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {data.length} submisi · halaman {page}/{totalPages || 1} · klik sel untuk edit langsung
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {data.length > 0 && (
                            <button onClick={exportCSV}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 font-medium hover:bg-gray-50 transition shadow-sm">
                                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export CSV
                            </button>
                        )}
                        <a href="http://localhost:5173/booking" target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Lihat Form
                        </a>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                    {STATUS_OPTS.map(s => (
                        <button key={s.val} onClick={() => setFilter(filter === s.val ? '' : s.val)}
                            className={`rounded-2xl p-3 border text-left transition-all ${
                                filter === s.val ? s.color + ' ring-2 ring-offset-1 ring-current' : 'bg-white border-gray-100 hover:border-gray-200'
                            }`}>
                            <p className="text-2xl font-bold text-gray-900">{counts[s.val] ?? 0}</p>
                            <p className={`text-xs font-medium mt-0.5 ${filter === s.val ? '' : 'text-gray-500'}`}>{s.label}</p>
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="flex gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Cari nama, WA, atau acara..."
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400 bg-white" />
                    </div>
                    {filter && (
                        <button onClick={() => setFilter('')}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 transition whitespace-nowrap">
                            Hapus filter ✕
                        </button>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 ml-auto">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Geser kanan untuk kolom operasional
                    </div>
                </div>

                {/* ── Airtable Table ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="overflow-x-auto">
                            <table className="text-sm border-collapse" style={{ minWidth: '1680px' }}>
                                <TableSkeleton rows={6} cols={14} />
                            </table>
                        </div>
                    ) : data.length === 0 ? (
                        <EmptyState icon="📋" title="Belum ada submisi"
                            description={search || filter ? 'Tidak ada hasil untuk filter ini.' : 'Booking form belum ada yang masuk.'} />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="text-sm border-collapse" style={{ minWidth: '1680px' }}>
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/60">
                                        {/* Sticky left cols */}
                                        <th className="sticky left-0 z-10 bg-gray-50/90 text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider w-48 whitespace-nowrap border-r border-gray-100">Nama & Kontak</th>
                                        <th className="text-left px-3 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider w-44 whitespace-nowrap">Acara / Tanggal</th>
                                        <th className="text-left px-3 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider w-28 whitespace-nowrap">Status</th>

                                        {/* Divider label */}
                                        <th colSpan={5} className="text-center px-3 py-3 text-[11px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-50/40 whitespace-nowrap border-l border-r border-indigo-100/60">
                                            💰 Pembayaran
                                        </th>

                                        <th colSpan={5} className="text-center px-3 py-3 text-[11px] font-bold text-violet-400 uppercase tracking-wider bg-violet-50/40 whitespace-nowrap border-l border-r border-violet-100/60">
                                            🎪 Operasional
                                        </th>

                                        <th className="text-left px-3 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider w-24 whitespace-nowrap border-l border-gray-100">Design</th>
                                        <th className="px-3 py-3 w-20 border-l border-gray-100"/>
                                    </tr>
                                    <tr className="border-b border-gray-100 bg-white">
                                        <th className="sticky left-0 z-10 bg-white border-r border-gray-100"/>
                                        <th/><th/>
                                        {/* Payment sub-headers */}
                                        <th className="text-center px-2 py-2 text-[10px] font-semibold text-gray-400 w-14 border-l border-indigo-50">Invoice</th>
                                        <th className="text-center px-2 py-2 text-[10px] font-semibold text-gray-400 w-12">DP</th>
                                        <th className="text-left px-2 py-2 text-[10px] font-semibold text-gray-400 w-28">Jumlah DP</th>
                                        <th className="text-center px-2 py-2 text-[10px] font-semibold text-gray-400 w-20">Pelunasan</th>
                                        <th className="text-left px-2 py-2 text-[10px] font-semibold text-gray-400 w-32 border-r border-indigo-50">Jml Lunas</th>
                                        {/* Ops sub-headers */}
                                        <th className="text-left px-2 py-2 text-[10px] font-semibold text-gray-400 w-36 border-l border-violet-50">Type Booth</th>
                                        <th className="text-left px-2 py-2 text-[10px] font-semibold text-gray-400 w-32">Kiosk</th>
                                        <th className="text-left px-2 py-2 text-[10px] font-semibold text-gray-400 w-24">Printer</th>
                                        <th className="text-left px-2 py-2 text-[10px] font-semibold text-gray-400 w-28">Transport</th>
                                        <th className="text-left px-2 py-2 text-[10px] font-semibold text-gray-400 w-20">Jarak</th>
                                        <th className="text-left px-2 py-2 text-[10px] font-semibold text-gray-400 w-36 border-r border-violet-50">Staff Ops</th>
                                        <th/><th/>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-50">
                                    {pagedData.map(b => {
                                        const st    = statusBadge(b.status);
                                        const hasDp = DP_STATUSES.includes(b.status);

                                        return (
                                            <tr key={b.id} className="hover:bg-gray-50/40 transition group">
                                                {/* ── Sticky: Nama ── */}
                                                <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50/40 border-r border-gray-100 px-4 py-3 align-top" style={{ minWidth: '192px' }}>
                                                    <p className="font-semibold text-gray-900 truncate">{b.customer.nama}</p>
                                                    <p className="text-gray-400 text-xs mt-0.5">{b.no_whatsapp}</p>
                                                    {b.email && <p className="text-gray-400 text-xs truncate">{b.email}</p>}
                                                </td>

                                                {/* Acara */}
                                                <td className="px-3 py-3 align-top">
                                                    <p className="font-medium text-gray-800 text-xs truncate max-w-[160px]">{b.nama_acara}</p>
                                                    <p className="text-gray-400 text-[11px] mt-0.5">
                                                        {new Date(b.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        {b.jam_mulai && ` · ${b.jam_mulai.substring(0, 5)}`}
                                                    </p>
                                                </td>

                                                {/* Status */}
                                                <td className="px-3 py-3 align-top">
                                                    <select value={b.status} disabled={updating === b.id}
                                                        onChange={e => changeStatus(b.id, e.target.value)}
                                                        className={`text-[11px] font-semibold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none focus:ring-1 focus:ring-violet-300 ${st.color} ${updating === b.id ? 'opacity-50' : ''}`}>
                                                        {STATUS_OPTS.map(s => <option key={s.val} value={s.val}>{s.label}</option>)}
                                                    </select>
                                                </td>

                                                {/* ── Payment cols ── */}
                                                <td className="px-2 py-3 align-middle text-center border-l border-indigo-50/60">
                                                    <CheckCell checked={b.kirim_invoice} onToggle={() => saveOps(b.id, 'kirim_invoice', !b.kirim_invoice)} />
                                                </td>
                                                <td className="px-2 py-3 align-middle text-center">
                                                    <CheckCell checked={b.sudah_dp} onToggle={() => saveOps(b.id, 'sudah_dp', !b.sudah_dp)} />
                                                </td>
                                                <td className="px-2 py-3 align-middle">
                                                    <AmtCell value={b.dp_amount} onSave={v => saveOps(b.id, 'dp_amount', v)} />
                                                </td>
                                                <td className="px-2 py-3 align-middle text-center">
                                                    <CheckCell checked={b.pelunasan} onToggle={() => saveOps(b.id, 'pelunasan', !b.pelunasan)} />
                                                </td>
                                                <td className="px-2 py-3 align-middle border-r border-indigo-50/60">
                                                    <AmtCell value={b.jumlah_pelunasan} onSave={v => saveOps(b.id, 'jumlah_pelunasan', v)} />
                                                </td>

                                                {/* ── Ops cols ── */}
                                                {/* Type Booth */}
                                                <td className="px-2 py-3 align-middle border-l border-violet-50/60">
                                                    <button onClick={e => openPopover(e, b.id, 'type_booth')}
                                                        className="w-full text-left hover:bg-violet-50 rounded px-1 py-0.5 transition">
                                                        {b.type_booth?.length
                                                            ? <TagChips tags={b.type_booth} color="violet" />
                                                            : <span className="text-gray-300 text-xs">+ Pilih booth</span>}
                                                    </button>
                                                </td>

                                                {/* Kiosk */}
                                                <td className="px-2 py-3 align-middle">
                                                    <div className="flex flex-wrap gap-1">
                                                        {kiosks.length === 0
                                                            ? <span className="text-gray-300 text-xs">--</span>
                                                            : kiosks.map(k => {
                                                                const active = b.kiosk?.id === k.id;
                                                                return (
                                                                    <button key={k.id}
                                                                        onClick={() => saveOps(b.id, 'kiosk_id', active ? null : k.id)}
                                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition border ${
                                                                            active
                                                                                ? 'bg-sky-500 text-white border-sky-500'
                                                                                : 'bg-white text-gray-400 border-gray-200 hover:border-sky-400 hover:text-sky-600'
                                                                        }`}>
                                                                        {k.name}
                                                                    </button>
                                                                );
                                                            })
                                                        }
                                                    </div>
                                                </td>

                                                {/* Printer */}
                                                <td className="px-2 py-3 align-middle">
                                                    <PickCell value={b.printer} options={printerOpts}
                                                        onSave={v => saveOps(b.id, 'printer', v)} />
                                                </td>

                                                {/* Transport */}
                                                <td className="px-2 py-3 align-middle">
                                                    {transportOpts.length > 0
                                                        ? <PickCell value={b.transport} options={transportOpts} onSave={v => saveOps(b.id, 'transport', v)} />
                                                        : <TxtCell value={b.transport} onSave={v => saveOps(b.id, 'transport', v)} placeholder="Nama driver..." />}
                                                </td>

                                                {/* Jarak */}
                                                <td className="px-2 py-3 align-middle">
                                                    <NumCell value={b.total_jarak} onSave={v => saveOps(b.id, 'total_jarak', v)} unit="km" />
                                                </td>

                                                {/* Staff Ops */}
                                                <td className="px-2 py-3 align-middle border-r border-violet-50/60">
                                                    <button onClick={e => openPopover(e, b.id, 'staff_operasional')}
                                                        className="w-full text-left hover:bg-violet-50 rounded px-1 py-0.5 transition">
                                                        {b.staff_operasional?.length
                                                            ? <TagChips tags={b.staff_operasional} color="sky" />
                                                            : <span className="text-gray-300 text-xs">+ Tambah staff</span>}
                                                    </button>
                                                </td>

                                                {/* Design Frame */}
                                                <td className="px-3 py-3 align-middle">
                                                    {!hasDp ? (
                                                        <span className="text-[11px] text-gray-300 italic">Tunggu DP</span>
                                                    ) : b.frame_design_url ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <img src={b.frame_design_url} alt="design"
                                                                onClick={() => setPreviewImg(b.frame_design_url)}
                                                                className="w-8 h-8 rounded object-cover border border-gray-200 cursor-pointer hover:scale-105 transition" />
                                                            {b.frame_design_notified_at && (
                                                                <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <label className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-dashed border-violet-300 text-violet-600 text-[11px] font-semibold hover:bg-violet-50 transition">
                                                            ↑ Upload
                                                            <input type="file" accept="image/*" className="hidden"
                                                                onChange={e => e.target.files[0] && uploadDesign(b.id, e.target.files[0])} />
                                                        </label>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-3 py-3 align-middle">
                                                    <div className="flex items-center gap-1.5">
                                                        {/* Detail */}
                                                        <button onClick={() => setDetail(b)} title="Detail"
                                                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 hover:text-violet-800 transition">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                        {/* Briefing */}
                                                        <button onClick={() => { setBriefing(data.find(d => d.id === b.id) || b); setCopied(false); }} title="Briefing"
                                                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-800 transition">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-3 px-1">
                        <p className="text-xs text-gray-400">
                            Menampilkan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.length)} dari {data.length} booking
                        </p>
                        <div className="flex items-center gap-1">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition">
                                ← Prev
                            </button>
                            {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                                let p;
                                if (totalPages <= 7) {
                                    p = i + 1;
                                } else if (page <= 4) {
                                    p = i < 6 ? i + 1 : totalPages;
                                } else if (page >= totalPages - 3) {
                                    p = i === 0 ? 1 : totalPages - 6 + i;
                                } else {
                                    p = i === 0 ? 1 : i === 6 ? totalPages : page - 3 + i;
                                }
                                return (
                                    <button key={i} onClick={() => setPage(p)}
                                        className={`w-8 h-8 text-xs rounded-lg border transition ${
                                            page === p ? 'bg-violet-600 text-white border-violet-600' : 'border-gray-200 hover:bg-gray-50'
                                        }`}>
                                        {p}
                                    </button>
                                );
                            })}
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition">
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Tag Popover ── */}
            {popover && (() => {
                const booking     = data.find(b => b.id === popover.id);
                const currentTags = booking?.[popover.field] ?? [];
                const isBoothField = popover.field === 'type_booth';

                return (
                    <div ref={popoverRef}
                        style={{
                            position: 'fixed',
                            top:  popover.rect.bottom + 6,
                            left: Math.min(popover.rect.left, window.innerWidth - 220),
                            zIndex: 1000,
                        }}
                        className="bg-white shadow-2xl rounded-2xl border border-gray-200 p-3 w-52">

                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                            {isBoothField ? 'Type Booth' : 'Staff Operasional'}
                        </p>

                        {isBoothField ? (
                            <div className="space-y-0.5">
                                {boothOpts.map(opt => (
                                    <label key={opt} className="flex items-center gap-2 py-1.5 px-1 cursor-pointer hover:bg-gray-50 rounded-lg transition">
                                        <input type="checkbox"
                                            checked={currentTags.includes(opt)}
                                            onChange={() => toggleBoothTag(popover.id, currentTags, opt)}
                                            className="w-3.5 h-3.5 rounded accent-violet-600" />
                                        <span className="text-xs text-gray-700">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div>
                                {/* Current staff chips */}
                                {currentTags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {currentTags.map(t => (
                                            <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-100 text-sky-700 text-[11px] rounded-full">
                                                {t}
                                                <button onClick={() => removeStaffTag(popover.id, currentTags, t)}
                                                    className="hover:text-red-500 transition font-bold leading-none">×</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {/* Quick-pick from registered staff */}
                                {opAssets.staff.length > 0 && (
                                    <div className="space-y-0.5 mb-2">
                                        {opAssets.staff
                                            .filter(s => !currentTags.includes(s.name))
                                            .map(s => (
                                                <button key={s.id} onClick={() => saveOps(popover.id, 'staff_operasional', [...currentTags, s.name])}
                                                    className="w-full text-left text-xs text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 px-2 py-1 rounded-lg transition flex items-center gap-2">
                                                    <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                                        {s.name.charAt(0).toUpperCase()}
                                                    </span>
                                                    {s.name}
                                                </button>
                                            ))}
                                    </div>
                                )}
                                {/* Manual add input */}
                                <div className="flex gap-1">
                                    <input type="text" value={staffInput}
                                        onChange={e => setStaffInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') addStaffTag(popover.id, currentTags); }}
                                        placeholder="Nama staff..."
                                        autoFocus={opAssets.staff.length === 0}
                                        className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-violet-400" />
                                    <button onClick={() => addStaffTag(popover.id, currentTags)}
                                        className="text-xs bg-violet-600 text-white px-2.5 rounded-lg hover:bg-violet-700 transition font-semibold">
                                        +
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* ── Briefing Modal ── */}
            {briefing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="font-bold text-gray-900">📤 Briefing Event</h2>
                                <p className="text-xs text-gray-400 mt-0.5">{briefing.nama_acara}</p>
                            </div>
                            <button onClick={() => setBriefing(null)} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Briefing Content */}
                        <div className="p-6 space-y-4">
                            {/* Event info */}
                            <div className="bg-indigo-50 rounded-2xl p-4 space-y-2">
                                <p className="text-sm font-bold text-indigo-900">{briefing.nama_acara || '-'}</p>
                                <p className="text-xs text-indigo-700">
                                    {briefing.tanggal && new Date(briefing.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    {briefing.jam_mulai && ` · ${briefing.jam_mulai.substring(0,5)}`}
                                </p>
                                {briefing.lokasi  && <p className="text-xs text-indigo-600">📍 {briefing.lokasi}</p>}
                                {briefing.catatan && <p className="text-xs text-indigo-400 italic">📝 {briefing.catatan}</p>}
                                {briefing.package && <p className="text-xs text-indigo-600">📦 {briefing.package.nama}</p>}
                            </div>

                            {/* Ops grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <BriefCard label="Type Booth" icon="🎪">
                                    {briefing.type_booth?.length
                                        ? <TagChips tags={briefing.type_booth} color="violet" />
                                        : <span className="text-gray-400 text-xs">--</span>}
                                </BriefCard>
                                <BriefCard label="Kiosk" icon="📟">
                                    <span className="text-sm font-semibold text-gray-800">{briefing.kiosk?.name || '--'}</span>
                                </BriefCard>
                                <BriefCard label="Printer" icon="🖨️">
                                    <span className="text-sm font-semibold text-gray-800">{briefing.printer || '--'}</span>
                                </BriefCard>
                                <BriefCard label="Transport" icon="🚗">
                                    <span className="text-sm font-semibold text-gray-800">{briefing.transport || '--'}</span>
                                    {briefing.total_jarak && <span className="text-xs text-gray-500 block">{briefing.total_jarak} km</span>}
                                </BriefCard>
                                <BriefCard label="Staff Operasional" icon="👥">
                                    {briefing.staff_operasional?.length
                                        ? <TagChips tags={briefing.staff_operasional} color="sky" />
                                        : <span className="text-gray-400 text-xs">--</span>}
                                </BriefCard>
                            </div>

                            {/* Payment status */}
                            <div className="bg-gray-50 rounded-2xl p-4">
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Pembayaran</p>
                                <div className="space-y-2">
                                    {[
                                        { label: 'Invoice Terkirim', ok: briefing.kirim_invoice, extra: null },
                                        { label: 'DP',           ok: briefing.sudah_dp,   extra: briefing.sudah_dp   && briefing.dp_amount        ? `Rp ${Number(briefing.dp_amount).toLocaleString('id-ID')}` : null },
                                        { label: 'Pelunasan',    ok: briefing.pelunasan,  extra: briefing.pelunasan  && briefing.jumlah_pelunasan  ? `Rp ${Number(briefing.jumlah_pelunasan).toLocaleString('id-ID')}` : null },
                                    ].map(({ label, ok, extra }) => (
                                        <div key={label} className="flex items-center justify-between">
                                            <span className="text-xs text-gray-600">{label}</span>
                                            <div className="flex items-center gap-2">
                                                {extra && <span className="text-xs font-semibold text-gray-700">{extra}</span>}
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ok ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-400'}`}>
                                                    {ok ? '✅ Ya' : '❌ Belum'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {briefing.additional_info && (
                                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                                    <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-1">Catatan</p>
                                    <p className="text-xs text-amber-800">{briefing.additional_info}</p>
                                </div>
                            )}
                        </div>

                        {/* Additional info editor */}
                        <div className="px-6 pb-3">
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Catatan Tambahan</label>
                            <textarea
                                defaultValue={briefing.additional_info ?? ''}
                                onBlur={e => { if (e.target.value !== (briefing.additional_info ?? '')) saveOps(briefing.id, 'additional_info', e.target.value.trim() || null); }}
                                rows={2}
                                placeholder="Catatan untuk tim..."
                                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 resize-none" />
                        </div>

                        {/* Action buttons */}
                        <div className="px-6 pb-6 flex gap-3">
                            <button onClick={copyWaText}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition
                                    ${copied ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                                {copied ? (
                                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> Disalin!</>
                                ) : (
                                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg> Salin ke WA</>
                                )}
                            </button>
                            <button onClick={() => printBriefing(data.find(d => d.id === briefing.id) || briefing)}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                                </svg>
                                Cetak PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Image Preview Lightbox ── */}
            {previewImg && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setPreviewImg(null)}>
                    <img src={previewImg} alt="preview" className="max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl" />
                    <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* ── Detail Drawer ── */}
            {detail && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setDetail(null)} />
                    <div className="relative w-full max-w-sm bg-white h-full shadow-2xl overflow-y-auto flex flex-col">
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
                            <div>
                                <h2 className="font-bold text-gray-900">Detail Booking</h2>
                                <p className="text-xs text-gray-400">#{detail.id} · {detail.created_at}</p>
                            </div>
                            <button onClick={() => setDetail(null)} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 transition">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-5 space-y-5 flex-1">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Status</p>
                                <div className="flex flex-wrap gap-2">
                                    {STATUS_OPTS.map(s => (
                                        <button key={s.val} disabled={updating === detail.id}
                                            onClick={() => changeStatus(detail.id, s.val)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                                                detail.status === s.val
                                                    ? s.color + ' ring-2 ring-offset-1 ring-current'
                                                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                                            } ${updating === detail.id ? 'opacity-50' : ''}`}>
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <DrawerSection title="Data Diri">
                                <DrawerRow label="Nama" value={detail.customer.nama} />
                                <DrawerRow label="WhatsApp" value={detail.no_whatsapp}
                                    extra={<a href={`https://wa.me/${detail.no_whatsapp?.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="text-xs text-green-600 font-semibold hover:underline">Hubungi ↗</a>} />
                                {detail.email && <DrawerRow label="Email" value={detail.email} />}
                            </DrawerSection>

                            <DrawerSection title="Detail Acara">
                                <DrawerRow label="Jenis Acara" value={detail.nama_acara} />
                                <DrawerRow label="Tanggal" value={new Date(detail.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />
                                {detail.jam_mulai && <DrawerRow label="Jam Mulai" value={detail.jam_mulai.substring(0, 5)} />}
                                {detail.lokasi    && <DrawerRow label="Lokasi"    value={detail.lokasi} />}
                                {detail.catatan   && <DrawerRow label="Catatan"   value={detail.catatan} />}
                            </DrawerSection>

                            <DrawerSection title="Paket & Dekorasi">
                                <DrawerRow label="Paket"    value={detail.package?.nama ?? 'Belum dipilih'} />
                                <DrawerRow label="Frame"    value={detail.frame?.toUpperCase()} />
                                <DrawerRow label="Backdrop" value={
                                    <span className="flex items-center gap-2">
                                        {BACKDROP_COLORS[detail.warna_backdrop] && (
                                            <span className="w-3.5 h-3.5 rounded-full border border-black/10 inline-block"
                                                style={{ backgroundColor: BACKDROP_COLORS[detail.warna_backdrop] }} />
                                        )}
                                        {detail.warna_backdrop}
                                    </span>
                                } />
                            </DrawerSection>

                            {DP_STATUSES.includes(detail.status) && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Design Frame</p>
                                    <div className="rounded-2xl border-2 border-dashed border-violet-200 overflow-hidden">
                                        {detail.frame_design_url ? (
                                            <div>
                                                <div className="relative group cursor-pointer" onClick={() => setPreviewImg(detail.frame_design_url)}>
                                                    <img src={detail.frame_design_url} alt="frame design" className="w-full h-44 object-contain bg-gray-50" />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                                                        <span className="opacity-0 group-hover:opacity-100 bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-full transition">Lihat penuh</span>
                                                    </div>
                                                </div>
                                                <div className="px-4 py-3 bg-white flex items-center justify-between">
                                                    {detail.frame_design_notified_at
                                                        ? <span className="text-green-600 text-xs font-medium flex items-center gap-1">✓ Dikirim {detail.frame_design_notified_at}</span>
                                                        : <span className="text-orange-500 text-xs font-medium">⚠ Belum terkirim</span>}
                                                    <label className="cursor-pointer text-xs text-violet-600 font-semibold hover:text-violet-800 transition">
                                                        Ganti
                                                        <input type="file" accept="image/*" className="hidden"
                                                            onChange={e => e.target.files[0] && uploadDesign(detail.id, e.target.files[0])} />
                                                    </label>
                                                </div>
                                            </div>
                                        ) : (
                                            <label className={`flex flex-col items-center justify-center gap-3 py-8 cursor-pointer hover:bg-violet-50/50 transition ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                                                {uploading ? (
                                                    <><svg className="animate-spin w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg><span className="text-sm text-violet-500 font-medium">Mengupload...</span></>
                                                ) : (
                                                    <><div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center text-2xl">🎨</div><div className="text-center"><p className="text-sm font-semibold text-violet-700">Upload Design Frame</p><p className="text-xs text-gray-400 mt-0.5">Otomatis dikirim ke customer via WA</p></div><span className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold">Pilih Gambar</span></>
                                                )}
                                                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                                                    onChange={e => e.target.files[0] && uploadDesign(detail.id, e.target.files[0])} />
                                            </label>
                                        )}
                                    </div>
                                    {detail.frame_design_reference && (
                                        <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-800">
                                            <span className="font-semibold">Referensi dari customer:</span> {detail.frame_design_reference}
                                        </div>
                                    )}
                                </div>
                            )}

                            <DrawerSection title="Persetujuan">
                                <DrawerRow label="Syarat Venue"      value={detail.syarat_venue      ? '✅ Disetujui' : '❌ Belum'} />
                                <DrawerRow label="Syarat Pembayaran" value={detail.syarat_pembayaran ? '✅ Disetujui' : '❌ Belum'} />
                            </DrawerSection>
                        </div>

                        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
                            <a href={`https://wa.me/${detail.no_whatsapp?.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.524 5.847L.057 23.882l6.178-1.625A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.651-.5-5.178-1.372l-.372-.22-3.668.964.981-3.582-.242-.381A9.97 9.97 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                                </svg>
                                Hubungi via WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            )}
            <ConfirmModal config={confirmCfg} onClose={() => setConfirmCfg(null)} />
        </BackendLayout>
    );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function BriefCard({ label, icon, children }) {
    return (
        <div className="bg-gray-50 rounded-2xl p-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{icon} {label}</p>
            {children}
        </div>
    );
}

function DrawerSection({ title, children }) {
    return (
        <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</p>
            <div className="bg-gray-50 rounded-2xl overflow-hidden divide-y divide-gray-100">{children}</div>
        </div>
    );
}

function DrawerRow({ label, value, extra }) {
    return (
        <div className="flex items-start justify-between gap-3 px-4 py-2.5">
            <span className="text-xs text-gray-500 flex-shrink-0 pt-0.5 w-28">{label}</span>
            <div className="flex items-center gap-2 flex-1 justify-end">
                <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
                {extra}
            </div>
        </div>
    );
}
