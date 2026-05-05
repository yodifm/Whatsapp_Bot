import { useState, useEffect } from 'react';
import axios from 'axios';

const http = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' });

function formatRp(n) {
    if (!n && n !== 0) return 'Rp 0';
    return 'Rp ' + Number(n).toLocaleString('id-ID');
}
function formatDate(d) {
    if (!d) return '';
    return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Berangkat ────────────────────────────────────────────────────────────────
function BerangkatForm({ onSuccess }) {
    const [items, setItems]         = useState([]);
    const [bookings, setBookings]   = useState([]);
    const [loading, setLoading]     = useState(true);

    const [staffNama, setStaffNama] = useState('');
    const [bookingId, setBookingId] = useState('');
    const [eventNama, setEventNama] = useState('');
    const [tanggal, setTanggal]     = useState(new Date().toISOString().slice(0, 10));
    const [catatan, setCatatan]     = useState('');
    const [rows, setRows]           = useState([{ logistic_id: '', qty: 1 }]);
    const [saving, setSaving]       = useState(false);
    const [error, setError]         = useState('');

    useEffect(() => {
        Promise.all([
            http.get('/staff-checkin/items'),
            http.get('/staff-checkin/upcoming-bookings'),
        ]).then(([r1, r2]) => { setItems(r1.data); setBookings(r2.data); })
          .catch(() => {})
          .finally(() => setLoading(false));
    }, []);

    const getItem   = (id) => items.find(i => i.id === Number(id));
    const addRow    = () => setRows(r => [...r, { logistic_id: '', qty: 1 }]);
    const removeRow = (idx) => setRows(r => r.filter((_, i) => i !== idx));
    const setRow    = (idx, k, v) => setRows(r => r.map((row, i) => i === idx ? { ...row, [k]: v } : row));

    const total = rows.reduce((s, row) => {
        const item = getItem(row.logistic_id);
        return s + (item ? item.harga * Number(row.qty || 0) : 0);
    }, 0);

    const handleSubmit = async () => {
        setError('');
        if (!staffNama.trim()) { setError('Nama kamu wajib diisi.'); return; }
        const validRows = rows.filter(r => r.logistic_id && Number(r.qty) > 0);
        if (!validRows.length) { setError('Pilih minimal 1 barang.'); return; }

        setSaving(true);
        try {
            await http.post('/staff-checkin', {
                type:       'checkout',
                staff_nama: staffNama,
                event_nama: eventNama || null,
                booking_id: bookingId ? Number(bookingId) : null,
                tanggal,
                catatan:    catatan || null,
                items:      validRows.map(r => ({ logistic_id: Number(r.logistic_id), qty: Number(r.qty) })),
            });
            onSuccess('checkout');
        } catch (err) {
            setError(err.response?.data?.message
                || Object.values(err.response?.data?.errors || {}).flat().join(' ')
                || 'Gagal menyimpan, coba lagi.');
        } finally { setSaving(false); }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                <span className="text-sm">Memuat data barang...</span>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3">📦</div>
                <p className="text-sm">Belum ada inventaris. Hubungi admin.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl flex items-start gap-2">
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    </svg>
                    {error}
                </div>
            )}

            {/* Nama + tanggal */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Siapa kamu?</p>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Nama Staff *</label>
                    <input value={staffNama} onChange={e => setStaffNama(e.target.value)}
                        placeholder="Nama kamu"
                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 focus:bg-white transition" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Tanggal Event *</label>
                    <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)}
                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 focus:bg-white transition" />
                </div>
            </div>

            {/* Event */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Info Event</p>
                {bookings.length > 0 && (
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Link ke Booking (opsional)</label>
                        <select value={bookingId}
                            onChange={e => {
                                setBookingId(e.target.value);
                                const b = bookings.find(b => b.id === Number(e.target.value));
                                if (b) { setTanggal(b.tanggal); setEventNama(''); }
                            }}
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 focus:bg-white transition">
                            <option value="">— Tidak perlu link —</option>
                            {bookings.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
                        </select>
                    </div>
                )}
                {!bookingId && (
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Nama Event / Venue</label>
                        <input value={eventNama} onChange={e => setEventNama(e.target.value)}
                            placeholder="Misal: Wedding Budi & Ani — Hotel Grand Hyatt"
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 focus:bg-white transition" />
                    </div>
                )}
            </div>

            {/* Barang */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Barang Dibawa</p>
                    <button onClick={addRow}
                        className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 transition bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                        </svg>
                        Tambah
                    </button>
                </div>

                <div className="space-y-2.5">
                    {rows.map((row, idx) => {
                        const sel = getItem(row.logistic_id);
                        return (
                            <div key={idx} className="flex gap-2 items-center">
                                <select value={row.logistic_id}
                                    onChange={e => setRow(idx, 'logistic_id', e.target.value)}
                                    className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 focus:bg-white transition">
                                    <option value="">— Pilih barang —</option>
                                    {items.map(i => <option key={i.id} value={i.id}>{i.nama} ({i.satuan})</option>)}
                                </select>
                                <input type="number" min="1" value={row.qty}
                                    onChange={e => setRow(idx, 'qty', e.target.value)}
                                    className="w-16 px-2 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 text-center bg-gray-50 focus:bg-white transition" />
                                {rows.length > 1 && (
                                    <button onClick={() => removeRow(idx)}
                                        className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-300 hover:text-red-400 hover:bg-red-50 transition flex-shrink-0">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                                        </svg>
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {total > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-400">Estimasi nilai barang</span>
                        <span className="text-sm font-bold text-violet-600">{formatRp(total)}</span>
                    </div>
                )}
            </div>

            {/* Catatan */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Catatan (opsional)</label>
                <textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={2}
                    placeholder="Ada catatan tambahan?"
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none bg-gray-50 focus:bg-white transition" />
            </div>

            <button onClick={handleSubmit} disabled={saving}
                className="w-full py-4 bg-violet-600 text-white font-bold rounded-2xl hover:bg-violet-700 active:scale-[.98] transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-violet-200 text-sm">
                {saving && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
                {saving ? 'Menyimpan...' : 'Simpan & Berangkat 🚗'}
            </button>
        </div>
    );
}

// ─── Pulang ───────────────────────────────────────────────────────────────────
function PulangForm({ onSuccess }) {
    const [staffNama, setStaffNama]   = useState('');
    const [searching, setSearching]   = useState(false);
    const [checkout, setCheckout]     = useState(null);
    const [notFound, setNotFound]     = useState(false);
    const [tanggal, setTanggal]       = useState(new Date().toISOString().slice(0, 10));
    const [catatan, setCatatan]       = useState('');
    const [returnRows, setReturnRows] = useState([]);
    const [saving, setSaving]         = useState(false);
    const [error, setError]           = useState('');

    const search = async () => {
        if (!staffNama.trim()) { setError('Masukkan nama kamu dulu.'); return; }
        setError(''); setSearching(true); setCheckout(null); setNotFound(false);
        try {
            const res = await http.get('/staff-checkin/active-checkout', { params: { staff_nama: staffNama } });
            if (res.data.checkout) {
                setCheckout(res.data.checkout);
                setReturnRows(res.data.checkout.items.map(item => ({
                    ...item, qty_sisa: item.qty_dibawa,
                })));
            } else {
                setNotFound(true);
            }
        } catch { setError('Gagal mencari data.'); }
        finally { setSearching(false); }
    };

    const setSisa = (idx, val) => setReturnRows(r =>
        r.map((row, i) => i === idx ? { ...row, qty_sisa: Math.max(0, Math.min(Number(val), row.qty_dibawa)) } : row)
    );

    const handleSubmit = async () => {
        setError('');
        setSaving(true);
        try {
            await http.post('/staff-checkin', {
                type:             'return',
                staff_nama:       staffNama,
                checkout_log_id:  checkout.id,
                tanggal,
                catatan:          catatan || null,
                items:            returnRows.map(r => ({
                    logistic_id:  r.logistic_id,
                    nama_barang:  r.nama_barang,
                    qty_sisa:     Number(r.qty_sisa),
                    harga_satuan: r.harga_satuan,
                })),
            });
            onSuccess('return');
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan, coba lagi.');
        } finally { setSaving(false); }
    };

    const totalDibawa  = returnRows.reduce((s, r) => s + r.qty_dibawa, 0);
    const totalSisa    = returnRows.reduce((s, r) => s + Number(r.qty_sisa || 0), 0);
    const totalTerpakai = totalDibawa - totalSisa;

    return (
        <div className="space-y-4">
            {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl flex items-start gap-2">
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    </svg>
                    {error}
                </div>
            )}

            {/* Search */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Cari Data Keberangkatan</p>
                <div className="flex gap-2">
                    <input value={staffNama}
                        onChange={e => { setStaffNama(e.target.value); setCheckout(null); setNotFound(false); }}
                        onKeyDown={e => e.key === 'Enter' && search()}
                        placeholder="Nama kamu (sama persis)"
                        className="flex-1 px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-gray-50 focus:bg-white transition" />
                    <button onClick={search} disabled={searching}
                        className="px-4 py-3 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition disabled:opacity-60 flex items-center gap-2">
                        {searching
                            ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                            : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        }
                        Cari
                    </button>
                </div>

                {notFound && (
                    <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-4 py-3 rounded-xl">
                        <span>⚠️</span>
                        Tidak ada checkout aktif untuk nama ini. Pastikan nama sama persis.
                    </div>
                )}
            </div>

            {/* Checkout found */}
            {checkout && (
                <>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 flex items-center gap-3">
                        <span className="text-2xl">✅</span>
                        <div>
                            <p className="text-sm font-semibold text-emerald-800">Data keberangkatan ditemukan</p>
                            <p className="text-xs text-emerald-600 mt-0.5">
                                {checkout.event_nama && <span>{checkout.event_nama} · </span>}
                                {formatDate(checkout.tanggal)}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Barang Sisa</p>
                            <p className="text-xs text-gray-400">Isi jumlah barang yang kamu bawa pulang (sisa yang tidak terpakai).</p>
                        </div>

                        {/* Table */}
                        <div className="space-y-3">
                            <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-gray-400 uppercase pb-1 border-b border-gray-100">
                                <div className="col-span-5">Barang</div>
                                <div className="col-span-2 text-center">Dibawa</div>
                                <div className="col-span-3 text-center">Sisa</div>
                                <div className="col-span-2 text-center">Terpakai</div>
                            </div>
                            {returnRows.map((row, idx) => {
                                const terpakai = row.qty_dibawa - Number(row.qty_sisa || 0);
                                return (
                                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-5 text-sm font-medium text-gray-800 leading-tight">{row.nama_barang}</div>
                                        <div className="col-span-2 text-center text-sm text-gray-400">{row.qty_dibawa}</div>
                                        <div className="col-span-3">
                                            <input type="number" min="0" max={row.qty_dibawa} value={row.qty_sisa}
                                                onChange={e => setSisa(idx, e.target.value)}
                                                className="w-full px-2 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-center bg-gray-50 focus:bg-white" />
                                        </div>
                                        <div className={`col-span-2 text-center text-sm font-bold ${terpakai > 0 ? 'text-orange-500' : 'text-gray-300'}`}>
                                            {terpakai > 0 ? `-${terpakai}` : '0'}
                                        </div>
                                    </div>
                                );
                            })}
                            <div className="grid grid-cols-12 gap-2 pt-2 border-t border-gray-100 text-xs font-bold">
                                <div className="col-span-5 text-gray-500">Total</div>
                                <div className="col-span-2 text-center text-gray-400">{totalDibawa}</div>
                                <div className="col-span-3 text-center text-emerald-600">{totalSisa}</div>
                                <div className="col-span-2 text-center text-orange-500">{totalTerpakai > 0 ? `-${totalTerpakai}` : '0'}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Tanggal Pulang *</label>
                            <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)}
                                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-gray-50 focus:bg-white transition" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Catatan (opsional)</label>
                            <textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={2}
                                placeholder="Ada kerusakan, barang hilang, atau catatan lain?"
                                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none bg-gray-50 focus:bg-white transition" />
                        </div>
                    </div>

                    <button onClick={handleSubmit} disabled={saving}
                        className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 active:scale-[.98] transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 text-sm">
                        {saving && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
                        {saving ? 'Menyimpan...' : 'Simpan & Pulang 🏠'}
                    </button>
                </>
            )}
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function StaffCheckin() {
    const [tab, setTab]             = useState('berangkat');
    const [successType, setSuccessType] = useState(null);

    if (successType) {
        const isReturn = successType === 'return';
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-5">
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 max-w-sm w-full text-center space-y-5">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto text-4xl ${isReturn ? 'bg-emerald-50' : 'bg-violet-50'}`}>
                        {isReturn ? '🏠' : '🚗'}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {isReturn ? 'Sampai di rumah!' : 'Selamat bertugas!'}
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            {isReturn
                                ? 'Laporan kepulangan berhasil disimpan.'
                                : 'Checklist keberangkatan berhasil disimpan.'}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        {!isReturn && (
                            <button onClick={() => { setSuccessType(null); setTab('pulang'); }}
                                className="w-full py-3 bg-emerald-600 text-white text-sm font-bold rounded-2xl hover:bg-emerald-700 transition">
                                Lapor Saat Pulang 🏠
                            </button>
                        )}
                        <button onClick={() => { setSuccessType(null); setTab('berangkat'); }}
                            className="w-full py-3 bg-gray-100 text-gray-600 text-sm font-semibold rounded-2xl hover:bg-gray-200 transition">
                            Isi Baru
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <div className="max-w-lg mx-auto px-4 py-8 space-y-5">

                {/* Header */}
                <div className="text-center pt-4 pb-2">
                    <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg shadow-violet-200">
                        📋
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Checklist Logistik</h1>
                    <p className="text-sm text-gray-400 mt-1">Catat barang sebelum & sesudah event</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl">
                    <button onClick={() => setTab('berangkat')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                            tab === 'berangkat'
                                ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}>
                        🚗 Berangkat
                    </button>
                    <button onClick={() => setTab('pulang')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                            tab === 'pulang'
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}>
                        🏠 Pulang
                    </button>
                </div>

                {tab === 'berangkat' && <BerangkatForm onSuccess={setSuccessType} />}
                {tab === 'pulang'    && <PulangForm    onSuccess={setSuccessType} />}

                <p className="text-center text-xs text-gray-300 pb-4">Waktunya Photobooth</p>
            </div>
        </div>
    );
}
