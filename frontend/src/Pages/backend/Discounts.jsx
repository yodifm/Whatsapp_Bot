import { useEffect, useState } from 'react';
import BackendLayout from '@/layouts/BackendLayout';
import api from '@/api/axios';

const TIPE_LABELS = {
    potongan_harga: 'Potongan Harga',
    tambahan_waktu: 'Tambahan Waktu',
};

const emptyForm = { nama: '', tipe: 'potongan_harga', nilai: '', berlaku_sampai: '', aktif: true };

export default function Discounts() {
    const [discounts, setDiscounts] = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing,   setEditing]   = useState(null);
    const [form,      setForm]      = useState(emptyForm);
    const [saving,    setSaving]    = useState(false);
    const [error,     setError]     = useState('');

    useEffect(() => {
        api.get('/discounts').then(r => setDiscounts(r.data)).finally(() => setLoading(false));
    }, []);

    const openCreate = () => { setEditing(null); setForm(emptyForm); setError(''); setShowModal(true); };
    const openEdit   = (d) => {
        setEditing(d);
        setForm({ nama: d.nama, tipe: d.tipe, nilai: d.nilai, berlaku_sampai: d.berlaku_sampai, aktif: d.aktif });
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true); setError('');
        try {
            if (editing) {
                const { data } = await api.put(`/discounts/${editing.id}`, form);
                setDiscounts(ds => ds.map(d => d.id === data.id ? data : d));
            } else {
                const { data } = await api.post('/discounts', form);
                setDiscounts(ds => [...ds, data]);
            }
            setShowModal(false);
        } catch (err) {
            setError(err.response?.data?.message || Object.values(err.response?.data?.errors || {})[0]?.[0] || 'Gagal menyimpan');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus diskon ini?')) return;
        await api.delete(`/discounts/${id}`);
        setDiscounts(ds => ds.filter(d => d.id !== id));
    };

    const toggleAktif = async (d) => {
        const { data } = await api.put(`/discounts/${d.id}`, { aktif: !d.aktif });
        setDiscounts(ds => ds.map(x => x.id === data.id ? data : x));
    };

    const formatNilai = (d) => {
        if (d.tipe === 'potongan_harga') return 'Rp ' + Number(d.nilai).toLocaleString('id-ID');
        return d.nilai + ' menit';
    };

    const today = new Date().toISOString().split('T')[0];

    const active  = discounts.filter(d => d.aktif && !d.expired);
    const expired = discounts.filter(d => d.expired);
    const nonActive = discounts.filter(d => !d.aktif && !d.expired);

    return (
        <BackendLayout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Diskon & Promo</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Diskon aktif akan ditawarkan AI saat closing ke customer</p>
                    </div>
                    <button onClick={openCreate}
                        className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Diskon
                    </button>
                </div>

                {/* AI info banner */}
                {active.length > 0 && (
                    <div className="mb-5 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-start gap-3">
                        <svg className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-indigo-700">
                            <span className="font-semibold">{active.length} diskon aktif</span> — AI akan menyebutkan promo ini saat persuasi closing ke customer.
                        </p>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : discounts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 text-sm">Belum ada diskon. Tambahkan promo pertamamu!</p>
                        <button onClick={openCreate} className="mt-4 text-sm text-indigo-600 hover:underline font-medium">+ Tambah Diskon</button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Active */}
                        {active.length > 0 && (
                            <Section title="Aktif" count={active.length} color="green">
                                {active.map(d => <DiscountCard key={d.id} d={d} formatNilai={formatNilai} onEdit={openEdit} onDelete={handleDelete} onToggle={toggleAktif} />)}
                            </Section>
                        )}
                        {/* Non-active */}
                        {nonActive.length > 0 && (
                            <Section title="Nonaktif" count={nonActive.length} color="gray">
                                {nonActive.map(d => <DiscountCard key={d.id} d={d} formatNilai={formatNilai} onEdit={openEdit} onDelete={handleDelete} onToggle={toggleAktif} />)}
                            </Section>
                        )}
                        {/* Expired */}
                        {expired.length > 0 && (
                            <Section title="Kedaluwarsa" count={expired.length} color="red">
                                {expired.map(d => <DiscountCard key={d.id} d={d} formatNilai={formatNilai} onEdit={openEdit} onDelete={handleDelete} onToggle={toggleAktif} />)}
                            </Section>
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="font-semibold text-gray-900">{editing ? 'Edit Diskon' : 'Tambah Diskon'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Diskon *</label>
                                <input value={form.nama} onChange={e => setForm(f => ({...f, nama: e.target.value}))} required
                                    placeholder="cth: Promo Lebaran, Early Bird Juni"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Tipe Diskon *</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(TIPE_LABELS).map(([val, label]) => (
                                        <button key={val} type="button"
                                            onClick={() => setForm(f => ({...f, tipe: val}))}
                                            className={`py-2.5 rounded-xl text-sm font-medium border transition ${
                                                form.tipe === val
                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                    : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                                            }`}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    {form.tipe === 'potongan_harga' ? 'Potongan Harga (Rp) *' : 'Tambahan Waktu (menit) *'}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                        {form.tipe === 'potongan_harga' ? 'Rp' : '+'}
                                    </span>
                                    <input type="number" min="1" value={form.nilai}
                                        onChange={e => setForm(f => ({...f, nilai: e.target.value}))} required
                                        placeholder={form.tipe === 'potongan_harga' ? '50000' : '30'}
                                        className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                                        {form.tipe === 'potongan_harga' ? '' : 'menit'}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Berlaku Sampai *</label>
                                <input type="date" value={form.berlaku_sampai} min={today}
                                    onChange={e => setForm(f => ({...f, berlaku_sampai: e.target.value}))} required
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.aktif}
                                    onChange={e => setForm(f => ({...f, aktif: e.target.checked}))}
                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                                <span className="text-sm text-gray-700">Aktifkan diskon (AI akan menyebutkan ke customer)</span>
                            </label>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50">
                                    Batal
                                </button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 bg-indigo-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50">
                                    {saving ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </BackendLayout>
    );
}

function Section({ title, count, color, children }) {
    const colors = {
        green: 'text-green-700 bg-green-50',
        gray:  'text-gray-600 bg-gray-100',
        red:   'text-red-600 bg-red-50',
    };
    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors[color]}`}>{count}</span>
            </div>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

function DiscountCard({ d, formatNilai, onEdit, onDelete, onToggle }) {
    const expiredClass = d.expired ? 'opacity-60' : '';
    return (
        <div className={`bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition ${expiredClass}`}>
            {/* Icon */}
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                d.tipe === 'potongan_harga' ? 'bg-green-50' : 'bg-blue-50'
            }`}>
                {d.tipe === 'potongan_harga' ? (
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{d.nama}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs font-bold text-indigo-600">{formatNilai(d)}</span>
                    <span className="text-gray-300">·</span>
                    <span className={`text-xs ${d.expired ? 'text-red-500' : 'text-gray-400'}`}>
                        {d.expired ? 'Expired ' : 'Berlaku s/d '}
                        {new Date(d.berlaku_sampai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {/* Toggle aktif */}
                <button onClick={() => onToggle(d)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${d.aktif && !d.expired ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${d.aktif && !d.expired ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
                <button onClick={() => onEdit(d)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </button>
                <button onClick={() => onDelete(d.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
