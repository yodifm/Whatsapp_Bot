import { useState, useEffect } from 'react';
import BackendLayout from '@/Layouts/BackendLayout';
import api from '@/lib/api';

function formatRp(n) {
    if (!n && n !== 0) return '—';
    return 'Rp ' + Number(n).toLocaleString('id-ID');
}

function formatDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Checkout form ────────────────────────────────────────────────────────────
function CheckoutForm({ masterItems, onSuccess }) {
    const [staffNama, setStaffNama] = useState('');
    const [eventNama, setEventNama] = useState('');
    const [tanggal, setTanggal]     = useState(new Date().toISOString().slice(0, 10));
    const [catatan, setCatatan]     = useState('');
    const [rows, setRows]           = useState([{ logistic_id: '', qty: 1 }]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]           = useState('');

    const addRow    = () => setRows(r => [...r, { logistic_id: '', qty: 1 }]);
    const removeRow = (idx) => setRows(r => r.filter((_, i) => i !== idx));
    const setRow    = (idx, key, val) => setRows(r => r.map((row, i) => i === idx ? { ...row, [key]: val } : row));
    const getItem   = (id) => masterItems.find(i => i.id === Number(id));

    const total = rows.reduce((sum, row) => {
        const item = getItem(row.logistic_id);
        return sum + (item ? item.harga * Number(row.qty || 0) : 0);
    }, 0);

    const handleSubmit = async () => {
        setError('');
        if (!staffNama.trim()) { setError('Nama staff wajib diisi.'); return; }
        const validRows = rows.filter(r => r.logistic_id && Number(r.qty) > 0);
        if (!validRows.length) { setError('Tambahkan minimal 1 barang.'); return; }

        setSubmitting(true);
        try {
            await api.post('/logistic-staff', {
                type: 'checkout',
                staff_nama: staffNama,
                event_nama: eventNama || null,
                tanggal,
                catatan: catatan || null,
                items: validRows.map(r => ({ logistic_id: Number(r.logistic_id), qty: Number(r.qty) })),
            });
            onSuccess('checkout');
        } catch (err) {
            setError(err.response?.data?.message
                || Object.values(err.response?.data?.errors || {}).flat().join(' ')
                || 'Gagal menyimpan.');
        } finally { setSubmitting(false); }
    };

    return (
        <div className="space-y-5">
            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Info Event</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Nama Staff *</label>
                            <input value={staffNama} onChange={e => setStaffNama(e.target.value)}
                                placeholder="Nama kamu"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Event *</label>
                            <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Nama Event / Venue</label>
                            <input value={eventNama} onChange={e => setEventNama(e.target.value)}
                                placeholder="Misal: Wedding Budi & Ani — Hotel Grand Hyatt"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        </div>
                    </div>
                </div>

                <div className="h-px bg-gray-100" />

                <div>
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Barang Dibawa</p>
                        <button onClick={addRow}
                            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Tambah Barang
                        </button>
                    </div>

                    <div className="space-y-2">
                        {rows.map((row, idx) => {
                            const selectedItem = getItem(row.logistic_id);
                            return (
                                <div key={idx} className="flex items-center gap-2">
                                    <select value={row.logistic_id}
                                        onChange={e => setRow(idx, 'logistic_id', e.target.value)}
                                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                                        <option value="">— Pilih barang —</option>
                                        {masterItems.map(item => (
                                            <option key={item.id} value={item.id}>{item.nama} ({item.satuan})</option>
                                        ))}
                                    </select>
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs text-gray-400">Qty</span>
                                        <input type="number" min="1" value={row.qty}
                                            onChange={e => setRow(idx, 'qty', e.target.value)}
                                            className="w-16 px-2 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-center" />
                                    </div>
                                    {selectedItem && (
                                        <span className="text-xs text-gray-400 w-24 text-right flex-shrink-0">
                                            {formatRp(selectedItem.harga * Number(row.qty || 0))}
                                        </span>
                                    )}
                                    {rows.length > 1 && (
                                        <button onClick={() => removeRow(idx)}
                                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition flex-shrink-0">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                            <span className="text-xs text-gray-400">Total estimasi nilai</span>
                            <span className="text-sm font-bold text-indigo-600">{formatRp(total)}</span>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-gray-100" />

                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Catatan (opsional)</label>
                    <textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={2}
                        placeholder="Catatan tambahan..."
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
                </div>
            </div>

            <button onClick={handleSubmit} disabled={submitting}
                className="w-full py-3 bg-indigo-600 text-white text-sm font-semibold rounded-2xl hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-indigo-200">
                {submitting && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
                {submitting ? 'Menyimpan...' : '🚗 Simpan Checklist Keberangkatan'}
            </button>
        </div>
    );
}

// ─── Return form ─────────────────────────────────────────────────────────────
function ReturnForm({ onSuccess }) {
    const [staffNama, setStaffNama]   = useState('');
    const [searching, setSearching]   = useState(false);
    const [checkout, setCheckout]     = useState(null);
    const [notFound, setNotFound]     = useState(false);
    const [tanggal, setTanggal]       = useState(new Date().toISOString().slice(0, 10));
    const [catatan, setCatatan]       = useState('');
    const [returnRows, setReturnRows] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]           = useState('');

    const search = async () => {
        if (!staffNama.trim()) { setError('Masukkan nama staff dulu.'); return; }
        setError(''); setSearching(true); setCheckout(null); setNotFound(false);
        try {
            const res = await api.get('/logistic-staff/active-checkout', { params: { staff_nama: staffNama } });
            if (res.data.checkout) {
                setCheckout(res.data.checkout);
                setReturnRows(res.data.checkout.items.map(item => ({
                    logistic_id:  item.logistic_id,
                    nama_barang:  item.nama_barang,
                    qty_dibawa:   item.qty_dibawa,
                    harga_satuan: item.harga_satuan,
                    qty_sisa:     item.qty_dibawa,  // default = semua kembali
                })));
            } else {
                setNotFound(true);
            }
        } catch { setError('Gagal mencari checkout.'); }
        finally { setSearching(false); }
    };

    const setSisa = (idx, val) => setReturnRows(r =>
        r.map((row, i) => i === idx ? { ...row, qty_sisa: Math.max(0, Math.min(Number(val), row.qty_dibawa)) } : row)
    );

    const handleSubmit = async () => {
        setError('');
        setSubmitting(true);
        try {
            await api.post('/logistic-staff', {
                type:             'return',
                staff_nama:       staffNama,
                checkout_log_id:  checkout.id,
                tanggal,
                catatan: catatan || null,
                items: returnRows.map(r => ({
                    logistic_id:  r.logistic_id,
                    nama_barang:  r.nama_barang,
                    qty_sisa:     Number(r.qty_sisa),
                    harga_satuan: r.harga_satuan,
                })),
            });
            onSuccess('return');
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan.');
        } finally { setSubmitting(false); }
    };

    const totalDibawa = returnRows.reduce((s, r) => s + r.qty_dibawa, 0);
    const totalSisa   = returnRows.reduce((s, r) => s + Number(r.qty_sisa || 0), 0);
    const totalDipakai = totalDibawa - totalSisa;

    return (
        <div className="space-y-5">
            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

            {/* Search */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Cari Checkout Aktif</p>
                <div className="flex gap-2">
                    <input value={staffNama} onChange={e => { setStaffNama(e.target.value); setCheckout(null); setNotFound(false); }}
                        onKeyDown={e => e.key === 'Enter' && search()}
                        placeholder="Nama kamu (sama persis dengan saat berangkat)"
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    <button onClick={search} disabled={searching}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition disabled:opacity-60 flex items-center gap-2">
                        {searching
                            ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                            : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        }
                        Cari
                    </button>
                </div>

                {notFound && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-4 py-3 rounded-xl">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Tidak ada checkout aktif untuk nama ini. Pastikan nama sama persis.
                    </div>
                )}
            </div>

            {/* Return detail */}
            {checkout && (
                <>
                    <div className="bg-indigo-50 rounded-2xl border border-indigo-100 px-5 py-4 flex items-start gap-3">
                        <svg className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="text-sm font-semibold text-indigo-800">Checkout ditemukan</p>
                            <p className="text-xs text-indigo-600 mt-0.5">
                                {checkout.event_nama && <span>{checkout.event_nama} · </span>}
                                {formatDate(checkout.tanggal)}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Barang Sisa / Dikembalikan</p>
                        <p className="text-xs text-gray-400">Isi jumlah barang yang tersisa (dibawa pulang). Barang yang terpakai = dibawa − sisa.</p>

                        <div className="space-y-3">
                            {/* Header */}
                            <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wide pb-1 border-b border-gray-100">
                                <div className="col-span-5">Barang</div>
                                <div className="col-span-2 text-center">Dibawa</div>
                                <div className="col-span-2 text-center">Sisa</div>
                                <div className="col-span-3 text-center">Terpakai</div>
                            </div>

                            {returnRows.map((row, idx) => {
                                const terpakai = row.qty_dibawa - Number(row.qty_sisa || 0);
                                return (
                                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-5 text-sm text-gray-700 font-medium">{row.nama_barang}</div>
                                        <div className="col-span-2 text-center text-sm text-gray-400">{row.qty_dibawa}</div>
                                        <div className="col-span-2">
                                            <input type="number" min="0" max={row.qty_dibawa}
                                                value={row.qty_sisa}
                                                onChange={e => setSisa(idx, e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-center" />
                                        </div>
                                        <div className={`col-span-3 text-center text-sm font-semibold ${terpakai > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                                            {terpakai > 0 ? `−${terpakai}` : '0'}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Summary footer */}
                            <div className="grid grid-cols-12 gap-2 pt-2 border-t border-gray-100 text-xs font-semibold">
                                <div className="col-span-5 text-gray-500">Total</div>
                                <div className="col-span-2 text-center text-gray-500">{totalDibawa}</div>
                                <div className="col-span-2 text-center text-indigo-600">{totalSisa}</div>
                                <div className="col-span-3 text-center text-orange-500">{totalDipakai > 0 ? `−${totalDipakai}` : '0'}</div>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100" />

                        <div>
                            <div className="mb-3">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Pulang *</label>
                                <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)}
                                    className="w-full sm:w-48 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                            </div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Catatan (opsional)</label>
                            <textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={2}
                                placeholder="Ada kerusakan, barang hilang, atau catatan lain?"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
                        </div>
                    </div>

                    <button onClick={handleSubmit} disabled={submitting}
                        className="w-full py-3 bg-emerald-600 text-white text-sm font-semibold rounded-2xl hover:bg-emerald-700 transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-emerald-200">
                        {submitting && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
                        {submitting ? 'Menyimpan...' : '🏠 Simpan Laporan Kepulangan'}
                    </button>
                </>
            )}
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LogisticStaff() {
    const [tab, setTab]           = useState('checkout');
    const [masterItems, setMasterItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(true);
    const [successType, setSuccessType]   = useState(null); // 'checkout' | 'return'

    useEffect(() => {
        api.get('/logistic-staff/items')
            .then(r => setMasterItems(r.data))
            .catch(() => {})
            .finally(() => setLoadingItems(false));
    }, []);

    if (successType) {
        const isReturn = successType === 'return';
        return (
            <BackendLayout>
                <div className="min-h-screen flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 max-w-md w-full text-center space-y-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${isReturn ? 'bg-emerald-50' : 'bg-indigo-50'}`}>
                            <svg className={`w-8 h-8 ${isReturn ? 'text-emerald-500' : 'text-indigo-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">
                            {isReturn ? 'Laporan Kepulangan Tersimpan!' : 'Checklist Keberangkatan Tersimpan!'}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {isReturn
                                ? 'Data barang sisa sudah dicatat. Terima kasih!'
                                : 'Data barang dibawa sudah dicatat. Selamat bertugas!'}
                        </p>
                        <div className="flex justify-center gap-3">
                            <button onClick={() => { setSuccessType(null); setTab('checkout'); }}
                                className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition">
                                Isi Baru
                            </button>
                            {!isReturn && (
                                <button onClick={() => { setSuccessType(null); setTab('return'); }}
                                    className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition">
                                    Lapor Pulang
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </BackendLayout>
        );
    }

    return (
        <BackendLayout>
            <div className="p-6 max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Logistik Staff</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Catat barang sebelum berangkat & laporkan sisa saat pulang</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                    <button onClick={() => setTab('checkout')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'checkout' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        🚗 Berangkat
                    </button>
                    <button onClick={() => setTab('return')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'return' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        🏠 Pulang
                    </button>
                </div>

                {tab === 'checkout' && (
                    loadingItems
                        ? <div className="text-center py-8 text-sm text-gray-400">Memuat daftar barang...</div>
                        : masterItems.length === 0
                            ? <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-400">
                                Inventaris kosong. Admin perlu menambahkan barang terlebih dahulu.
                              </div>
                            : <CheckoutForm masterItems={masterItems} onSuccess={setSuccessType} />
                )}

                {tab === 'return' && (
                    <ReturnForm onSuccess={setSuccessType} />
                )}
            </div>
        </BackendLayout>
    );
}
