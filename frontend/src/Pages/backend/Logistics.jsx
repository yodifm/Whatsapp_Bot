import { useState, useEffect } from 'react';
import BackendLayout from '@/Layouts/BackendLayout';
import api from '@/lib/api';

const EMPTY_FORM = { nama: '', qty: '', harga: '', satuan: 'pcs', aktif: true };

function formatRp(n) {
    if (!n && n !== 0) return '—';
    return 'Rp ' + Number(n).toLocaleString('id-ID');
}

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Logistics() {
    const [tab, setTab]             = useState('inventory'); // 'inventory' | 'logs'
    const [items, setItems]         = useState([]);
    const [logs, setLogs]           = useState([]);
    const [loadingItems, setLoadingItems] = useState(true);
    const [loadingLogs, setLoadingLogs]   = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing]     = useState(null);
    const [form, setForm]           = useState(EMPTY_FORM);
    const [saving, setSaving]       = useState(false);
    const [error, setError]         = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLogTarget, setDeleteLogTarget] = useState(null);
    const [expandedLog, setExpandedLog] = useState(null);

    const loadItems = async () => {
        setLoadingItems(true);
        try { const r = await api.get('/logistics'); setItems(r.data); }
        catch {} finally { setLoadingItems(false); }
    };

    const loadLogs = async () => {
        setLoadingLogs(true);
        try { const r = await api.get('/logistic-logs'); setLogs(r.data); }
        catch {} finally { setLoadingLogs(false); }
    };

    useEffect(() => { loadItems(); }, []);
    useEffect(() => { if (tab === 'logs') loadLogs(); }, [tab]);

    const openCreate = () => {
        setEditing(null); setForm(EMPTY_FORM); setError(''); setShowModal(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        setForm({ nama: item.nama, qty: item.qty, harga: item.harga, satuan: item.satuan, aktif: item.aktif });
        setError(''); setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.nama.trim()) { setError('Nama barang wajib diisi.'); return; }
        if (form.qty === '' || form.harga === '') { setError('Qty dan harga wajib diisi.'); return; }
        setSaving(true); setError('');
        try {
            const payload = { ...form, qty: Number(form.qty), harga: Number(form.harga) };
            if (editing) await api.put(`/logistics/${editing.id}`, payload);
            else await api.post('/logistics', payload);
            setShowModal(false); loadItems();
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan.');
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try { await api.delete(`/logistics/${deleteTarget.id}`); setDeleteTarget(null); loadItems(); }
        catch {}
    };

    const handleDeleteLog = async () => {
        if (!deleteLogTarget) return;
        try { await api.delete(`/logistic-logs/${deleteLogTarget.id}`); setDeleteLogTarget(null); loadLogs(); }
        catch {}
    };

    const totalStockValue = items.reduce((sum, i) => sum + i.qty * i.harga, 0);

    return (
        <BackendLayout>
            <div className="p-6 max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Logistik</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Kelola inventaris & log pengambilan staff</p>
                    </div>
                    {tab === 'inventory' && (
                        <button onClick={openCreate}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition shadow-sm">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Tambah Barang
                        </button>
                    )}
                </div>

                {/* Stats strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Total Item', value: items.length, icon: '📦' },
                        { label: 'Item Aktif', value: items.filter(i => i.aktif).length, icon: '✅' },
                        { label: 'Nilai Stok', value: formatRp(totalStockValue), icon: '💰' },
                        { label: 'Log Pengambilan', value: logs.length || '—', icon: '📋' },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                            <span className="text-2xl">{s.icon}</span>
                            <div>
                                <p className="text-xs text-gray-400">{s.label}</p>
                                <p className="font-bold text-gray-900 text-sm">{s.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                    {[
                        { key: 'inventory', label: 'Inventaris' },
                        { key: 'logs',      label: 'Log Pengambilan' },
                    ].map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ─── Inventory Tab ─── */}
                {tab === 'inventory' && (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        {loadingItems ? (
                            <div className="p-8 text-center text-sm text-gray-400">Memuat...</div>
                        ) : items.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="text-4xl mb-3">📦</div>
                                <p className="text-gray-500 text-sm">Belum ada barang. Tambah inventaris!</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                        <th className="text-left px-5 py-3">Nama Barang</th>
                                        <th className="text-center px-3 py-3">Qty Stok</th>
                                        <th className="text-right px-3 py-3">Harga Satuan</th>
                                        <th className="text-right px-3 py-3">Total Nilai</th>
                                        <th className="text-center px-3 py-3">Status</th>
                                        <th className="px-3 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {items.map(item => (
                                        <tr key={item.id} className={`hover:bg-gray-50 transition ${!item.aktif ? 'opacity-50' : ''}`}>
                                            <td className="px-5 py-3.5 font-medium text-gray-900">
                                                {item.nama}
                                                <span className="ml-1.5 text-xs text-gray-400">/ {item.satuan}</span>
                                            </td>
                                            <td className="px-3 py-3.5 text-center text-gray-700 font-semibold">{item.qty}</td>
                                            <td className="px-3 py-3.5 text-right text-gray-600">{formatRp(item.harga)}</td>
                                            <td className="px-3 py-3.5 text-right text-gray-600">{formatRp(item.qty * item.harga)}</td>
                                            <td className="px-3 py-3.5 text-center">
                                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${item.aktif ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                                    {item.aktif ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3.5">
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => openEdit(item)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button onClick={() => setDeleteTarget(item)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-gray-100 bg-gray-50">
                                        <td colSpan={3} className="px-5 py-3 text-xs font-semibold text-gray-500">Total Nilai Inventaris</td>
                                        <td className="px-3 py-3 text-right text-sm font-bold text-indigo-600">{formatRp(totalStockValue)}</td>
                                        <td colSpan={2} />
                                    </tr>
                                </tfoot>
                            </table>
                        )}
                    </div>
                )}

                {/* ─── Logs Tab ─── */}
                {tab === 'logs' && (
                    <div className="space-y-3">
                        {loadingLogs ? (
                            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">Memuat...</div>
                        ) : logs.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                                <div className="text-4xl mb-3">📋</div>
                                <p className="text-gray-500 text-sm">Belum ada log pengambilan barang.</p>
                            </div>
                        ) : logs.map(log => (
                            <div key={log.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                <button
                                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition text-left gap-4">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 text-sm">{log.staff_nama}</p>
                                            <p className="text-xs text-gray-400">
                                                {log.event_nama && <span className="mr-2">{log.event_nama} ·</span>}
                                                {formatDate(log.tanggal)} · {log.created_at}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400">{log.items.length} item</p>
                                            <p className="text-sm font-bold text-indigo-600">{formatRp(log.total)}</p>
                                        </div>
                                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedLog === log.id ? 'rotate-180' : ''}`}
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </button>

                                {expandedLog === log.id && (
                                    <div className="border-t border-gray-100 px-5 pb-4">
                                        <table className="w-full text-sm mt-3">
                                            <thead>
                                                <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                                    <th className="text-left pb-2">Barang</th>
                                                    <th className="text-center pb-2">Qty</th>
                                                    <th className="text-right pb-2">Harga</th>
                                                    <th className="text-right pb-2">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {log.items.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="py-2 text-gray-700">{item.nama_barang}</td>
                                                        <td className="py-2 text-center text-gray-600">{item.qty}</td>
                                                        <td className="py-2 text-right text-gray-500">{formatRp(item.harga_satuan)}</td>
                                                        <td className="py-2 text-right font-medium text-gray-700">{formatRp(item.subtotal)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="border-t border-gray-100">
                                                    <td colSpan={3} className="pt-2 text-xs font-semibold text-gray-500">Total</td>
                                                    <td className="pt-2 text-right font-bold text-indigo-600">{formatRp(log.total)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                        {log.catatan && (
                                            <p className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
                                                📝 {log.catatan}
                                            </p>
                                        )}
                                        <div className="mt-3 flex justify-end">
                                            <button onClick={() => setDeleteLogTarget(log)}
                                                className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Hapus log
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Item modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="font-semibold text-gray-900">{editing ? 'Edit Barang' : 'Tambah Barang'}</h2>
                            <button onClick={() => setShowModal(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Nama Barang *</label>
                                <input value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                                    placeholder="Misal: Tripod, Printer, Roll Film"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Qty Stok *</label>
                                    <input type="number" min="0" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
                                        placeholder="0"
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Satuan</label>
                                    <input value={form.satuan} onChange={e => setForm(f => ({ ...f, satuan: e.target.value }))}
                                        placeholder="pcs, roll, unit..."
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Harga Satuan (Rp) *</label>
                                <input type="number" min="0" value={form.harga} onChange={e => setForm(f => ({ ...f, harga: e.target.value }))}
                                    placeholder="0"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                            </div>

                            <div className="flex items-center gap-3">
                                <button onClick={() => setForm(f => ({ ...f, aktif: !f.aktif }))}
                                    className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${form.aktif ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.aktif ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                </button>
                                <span className="text-sm text-gray-600">Tampilkan di form staff</span>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition">
                                Batal
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-60">
                                {saving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete item confirm */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
                        <p className="font-semibold text-gray-900">Hapus <span className="text-indigo-600">{deleteTarget.nama}</span>?</p>
                        <p className="text-sm text-gray-500">Item ini akan dihapus dari inventaris.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteTarget(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition">Batal</button>
                            <button onClick={handleDelete}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition">Hapus</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete log confirm */}
            {deleteLogTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteLogTarget(null)} />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
                        <p className="font-semibold text-gray-900">Hapus log pengambilan?</p>
                        <p className="text-sm text-gray-500">Log {deleteLogTarget.staff_nama} — {formatDate(deleteLogTarget.tanggal)} akan dihapus.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteLogTarget(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition">Batal</button>
                            <button onClick={handleDeleteLog}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition">Hapus</button>
                        </div>
                    </div>
                </div>
            )}
        </BackendLayout>
    );
}
