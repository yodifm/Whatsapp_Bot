import { useState, useEffect } from 'react';
import BackendLayout from '@/Layouts/BackendLayout';
import api from '@/lib/api';

function formatRp(n) {
    if (!n && n !== 0) return '—';
    return 'Rp ' + Number(n).toLocaleString('id-ID');
}

export default function LogisticStaff() {
    const [masterItems, setMasterItems] = useState([]);
    const [loading, setLoading]         = useState(true);

    const [staffNama, setStaffNama]     = useState('');
    const [eventNama, setEventNama]     = useState('');
    const [tanggal, setTanggal]         = useState(new Date().toISOString().slice(0, 10));
    const [catatan, setCatatan]         = useState('');
    const [rows, setRows]               = useState([{ logistic_id: '', qty: 1 }]);

    const [submitting, setSubmitting]   = useState(false);
    const [error, setError]             = useState('');
    const [success, setSuccess]         = useState(false);

    useEffect(() => {
        api.get('/logistic-staff/items')
            .then(r => setMasterItems(r.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const addRow = () => setRows(r => [...r, { logistic_id: '', qty: 1 }]);

    const removeRow = (idx) => setRows(r => r.filter((_, i) => i !== idx));

    const setRow = (idx, key, val) => setRows(r => r.map((row, i) => i === idx ? { ...row, [key]: val } : row));

    const getItem = (id) => masterItems.find(i => i.id === Number(id));

    const total = rows.reduce((sum, row) => {
        const item = getItem(row.logistic_id);
        return sum + (item ? item.harga * Number(row.qty || 0) : 0);
    }, 0);

    const handleSubmit = async () => {
        setError('');
        if (!staffNama.trim()) { setError('Nama staff wajib diisi.'); return; }
        if (!tanggal)           { setError('Tanggal wajib diisi.'); return; }
        const validRows = rows.filter(r => r.logistic_id && Number(r.qty) > 0);
        if (validRows.length === 0) { setError('Tambahkan minimal 1 barang.'); return; }

        setSubmitting(true);
        try {
            await api.post('/logistic-staff', {
                staff_nama: staffNama,
                event_nama: eventNama || null,
                tanggal,
                catatan: catatan || null,
                items: validRows.map(r => ({ logistic_id: Number(r.logistic_id), qty: Number(r.qty) })),
            });
            setSuccess(true);
            setStaffNama(''); setEventNama(''); setCatatan('');
            setRows([{ logistic_id: '', qty: 1 }]);
        } catch (err) {
            const msg = err.response?.data?.message
                || Object.values(err.response?.data?.errors || {}).flat().join(' ')
                || 'Gagal menyimpan.';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <BackendLayout>
                <div className="min-h-screen flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 max-w-md w-full text-center space-y-4">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Checklist Tersimpan!</h2>
                        <p className="text-sm text-gray-500">Data pengambilan barang kamu sudah dicatat. Selamat bertugas!</p>
                        <button onClick={() => setSuccess(false)}
                            className="mt-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition">
                            Isi Lagi
                        </button>
                    </div>
                </div>
            </BackendLayout>
        );
    }

    return (
        <BackendLayout>
            <div className="p-6 max-w-2xl mx-auto space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Checklist Logistik Staff</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Catat barang yang kamu bawa sebelum berangkat ke event</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
                )}

                {/* Form card */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">

                    {/* Info section */}
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

                    {/* Items section */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Daftar Barang Dibawa</p>
                            <button onClick={addRow}
                                className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Tambah Barang
                            </button>
                        </div>

                        {loading ? (
                            <div className="text-center py-6 text-sm text-gray-400">Memuat daftar barang...</div>
                        ) : masterItems.length === 0 ? (
                            <div className="text-center py-6 text-sm text-gray-400 bg-gray-50 rounded-xl">
                                Inventaris kosong. Admin perlu menambahkan barang terlebih dahulu.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {rows.map((row, idx) => {
                                    const selectedItem = getItem(row.logistic_id);
                                    return (
                                        <div key={idx} className="flex items-center gap-2">
                                            <select
                                                value={row.logistic_id}
                                                onChange={e => setRow(idx, 'logistic_id', e.target.value)}
                                                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                                                <option value="">— Pilih barang —</option>
                                                {masterItems.map(item => (
                                                    <option key={item.id} value={item.id}>
                                                        {item.nama} ({item.satuan})
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                type="number" min="1"
                                                value={row.qty}
                                                onChange={e => setRow(idx, 'qty', e.target.value)}
                                                className="w-20 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-center" />
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

                                {/* Total */}
                                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                    <span className="text-xs text-gray-500">Total estimasi nilai barang</span>
                                    <span className="text-sm font-bold text-indigo-600">{formatRp(total)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Catatan (opsional)</label>
                        <textarea value={catatan} onChange={e => setCatatan(e.target.value)}
                            rows={3} placeholder="Ada barang yang perlu perhatian khusus, atau catatan tambahan..."
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
                    </div>
                </div>

                {/* Submit */}
                <button onClick={handleSubmit} disabled={submitting || masterItems.length === 0}
                    className="w-full py-3 bg-indigo-600 text-white text-sm font-semibold rounded-2xl hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-indigo-200">
                    {submitting && (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                    )}
                    {submitting ? 'Menyimpan...' : 'Simpan Checklist'}
                </button>
            </div>
        </BackendLayout>
    );
}
