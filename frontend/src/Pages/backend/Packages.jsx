import BackendLayout from '@/layouts/BackendLayout';
import { useState, useEffect, useMemo } from 'react';
import api from '@/api/axios';
import { useToast } from '@/context/ToastContext';
import ConfirmModal from '@/components/ConfirmModal';

const EMPTY = { kiosk_id: '', nama: '', harga: '', durasi_jam: '', fitur: '', aktif: true };

function formatRupiah(n) {
    return 'Rp ' + Number(n).toLocaleString('id-ID');
}

function Modal({ pkg, kiosks, onClose, onSave }) {
    const [form, setForm]     = useState(pkg ?? EMPTY);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            const payload = {
                ...form,
                kiosk_id:   form.kiosk_id ? Number(form.kiosk_id) : null,
                harga:      parseInt(form.harga) || 0,
                durasi_jam: parseInt(form.durasi_jam) || 1,
                fitur: typeof form.fitur === 'string'
                    ? form.fitur.split('\n').map(s => s.trim()).filter(Boolean)
                    : form.fitur,
            };
            if (pkg?.id) {
                const r = await api.put(`/packages/${pkg.id}`, payload);
                onSave(r.data, 'update');
            } else {
                const r = await api.post('/packages', payload);
                onSave(r.data, 'create');
            }
        } catch (err) {
            if (err.response?.status === 422) setErrors(err.response.data.errors ?? {});
        } finally {
            setSaving(false);
        }
    };

    const fiturStr = Array.isArray(form.fitur) ? form.fitur.join('\n') : form.fitur;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{pkg?.id ? 'Edit Paket' : 'Tambah Paket'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={submit} className="px-6 py-5 space-y-4">

                    {/* Kiosk assignment */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kiosk</label>
                        <select value={form.kiosk_id ?? ''} onChange={e => set('kiosk_id', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition">
                            <option value="">🌐 Semua Kiosk (Global)</option>
                            {kiosks.map(k => (
                                <option key={k.id} value={k.id}>📱 {k.name}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-400">Pilih kiosk spesifik atau biarkan global untuk semua kiosk</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Paket</label>
                        <input value={form.nama} onChange={e => set('nama', e.target.value)}
                            placeholder="Basic / Premium / VIP"
                            className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition ${errors.nama ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
                        {errors.nama && <p className="mt-1 text-xs text-red-600">{errors.nama[0]}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
                            <input type="number" value={form.harga} onChange={e => set('harga', e.target.value)}
                                placeholder="250000"
                                className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition ${errors.harga ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
                            {errors.harga && <p className="mt-1 text-xs text-red-600">{errors.harga[0]}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (jam)</label>
                            <input type="number" min={1} max={24} value={form.durasi_jam} onChange={e => set('durasi_jam', e.target.value)}
                                placeholder="2"
                                className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition ${errors.durasi_jam ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
                            {errors.durasi_jam && <p className="mt-1 text-xs text-red-600">{errors.durasi_jam[0]}</p>}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fitur <span className="text-gray-400 font-normal">(satu per baris)</span></label>
                        <textarea rows={4} value={fiturStr} onChange={e => set('fitur', e.target.value)}
                            placeholder={"Unlimited foto\nCetak on-spot 4R\nBackground custom\nProp lengkap"}
                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition" />
                    </div>
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => set('aktif', !form.aktif)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${form.aktif ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${form.aktif ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                        <span className="text-sm text-gray-600">Paket aktif (ditampilkan ke AI)</span>
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose}
                            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                            Batal
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition">
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function PackageCard({ pkg, onEdit, onDelete, onToggle, deleting }) {
    return (
        <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition ${pkg.aktif ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
            <div className="px-5 pt-5 pb-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                        <h3 className="font-bold text-gray-900">{pkg.nama}</h3>
                        <p className="text-2xl font-bold text-indigo-600 mt-1">{formatRupiah(pkg.harga)}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${pkg.aktif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        {pkg.aktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {pkg.durasi_jam} jam
                </div>
                {pkg.fitur?.length > 0 && (
                    <ul className="space-y-1.5">
                        {pkg.fitur.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                <svg className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                {f}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <button onClick={() => onToggle(pkg)} className="text-xs text-gray-400 hover:text-gray-700 transition">
                    {pkg.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                <div className="flex gap-2">
                    <button onClick={() => onEdit(pkg)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition">
                        Edit
                    </button>
                    <button onClick={() => onDelete(pkg.id)} disabled={deleting === pkg.id}
                        className="text-xs font-medium text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                        {deleting === pkg.id ? '...' : 'Hapus'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Packages() {
    const toast = useToast();
    const [confirmCfg, setConfirmCfg] = useState(null);
    const [packages, setPackages] = useState([]);
    const [kiosks,   setKiosks]   = useState([]);
    const [modal,    setModal]     = useState(null);
    const [deleting, setDeleting]  = useState(null);

    useEffect(() => {
        api.get('/packages').then(r => setPackages(r.data));
        api.get('/kiosks').then(r => setKiosks(r.data));
    }, []);

    const handleSave = (pkg, mode) => {
        setPackages(prev => mode === 'create'
            ? [...prev, pkg]
            : prev.map(p => p.id === pkg.id ? pkg : p)
        );
        setModal(null);
    };

    const handleDelete = (id) => {
        setConfirmCfg({
            title: 'Hapus Paket',
            message: 'Paket ini akan dihapus permanen. Booking yang ada tidak terpengaruh.',
            confirmText: 'Ya, Hapus',
            onConfirm: async () => {
                setDeleting(id);
                await api.delete(`/packages/${id}`);
                setPackages(prev => prev.filter(p => p.id !== id));
                setDeleting(null);
                toast.success('Paket berhasil dihapus');
            },
        });
    };

    const toggleAktif = async (pkg) => {
        const r = await api.put(`/packages/${pkg.id}`, { aktif: !pkg.aktif });
        setPackages(prev => prev.map(p => p.id === pkg.id ? r.data : p));
    };

    const openEdit = (pkg) => setModal({ ...pkg, fitur: pkg.fitur?.join('\n') ?? '' });

    // Group packages: global first, then per kiosk
    const grouped = useMemo(() => {
        const global = packages.filter(p => !p.kiosk_id);
        const byKiosk = kiosks.map(k => ({
            kiosk: k,
            items: packages.filter(p => p.kiosk_id === k.id),
        })).filter(g => g.items.length > 0);
        return { global, byKiosk };
    }, [packages, kiosks]);

    const cardProps = { onEdit: openEdit, onDelete: handleDelete, onToggle: toggleAktif, deleting };

    const isEmpty = packages.length === 0;

    return (
        <BackendLayout>
            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Paket Photobooth</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Kelola paket yang ditawarkan AI ke customer.</p>
                    </div>
                    <button onClick={() => setModal({})}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-sm shadow-indigo-200">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Paket
                    </button>
                </div>

                {isEmpty ? (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                            <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <p className="font-semibold text-gray-700">Belum ada paket</p>
                        <p className="text-sm text-gray-400 mt-1 mb-5">Tambah paket agar AI bisa menawarkan ke customer</p>
                        <button onClick={() => setModal({})}
                            className="bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition">
                            Tambah Paket Pertama
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8">

                        {/* Global packages */}
                        {grouped.global.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-base">🌐</span>
                                    <h3 className="font-semibold text-gray-800 text-sm">Semua Kiosk</h3>
                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{grouped.global.length} paket</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {grouped.global.map(pkg => (
                                        <PackageCard key={pkg.id} pkg={pkg} {...cardProps} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Per-kiosk groups */}
                        {grouped.byKiosk.map(({ kiosk, items }) => (
                            <section key={kiosk.id}>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-base">📱</span>
                                    <h3 className="font-semibold text-gray-800 text-sm">{kiosk.name}</h3>
                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{items.length} paket</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {items.map(pkg => (
                                        <PackageCard key={pkg.id} pkg={pkg} {...cardProps} />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>

            {modal !== null && (
                <Modal
                    pkg={modal?.id ? modal : null}
                    kiosks={kiosks}
                    onClose={() => setModal(null)}
                    onSave={handleSave}
                />
            )}
            <ConfirmModal config={confirmCfg} onClose={() => setConfirmCfg(null)} />
        </BackendLayout>
    );
}
