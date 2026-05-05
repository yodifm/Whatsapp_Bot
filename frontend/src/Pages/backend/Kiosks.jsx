import { useState, useEffect } from 'react';
import BackendLayout from '@/Layouts/BackendLayout';
import api from '@/api/axios';

const TONE_OPTIONS = [
    { value: 'sales',    label: 'Sales — Hangat & persuasif' },
    { value: 'friendly', label: 'Friendly — Santai seperti teman' },
    { value: 'formal',   label: 'Formal — Profesional & baku' },
];

const EMPTY_FORM = {
    name: '',
    wa_phone_number_id: '',
    wa_access_token: '',
    wa_verify_token: '',
    ai_name: '',
    ai_tone: 'sales',
    studio_name: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_holder: '',
};

export default function Kiosks() {
    const [kiosks, setKiosks]       = useState([]);
    const [loading, setLoading]     = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing]     = useState(null); // kiosk object or null
    const [form, setForm]           = useState(EMPTY_FORM);
    const [saving, setSaving]       = useState(false);
    const [error, setError]         = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const res = await api.get('/kiosks');
            setKiosks(res.data);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setError('');
        setShowModal(true);
    };

    const openEdit = (k) => {
        setEditing(k);
        setForm({
            name:                k.name                || '',
            wa_phone_number_id:  k.wa_phone_number_id  || '',
            wa_access_token:     k.wa_access_token     || '', // masked
            wa_verify_token:     k.wa_verify_token     || '',
            ai_name:             k.ai_name             || '',
            ai_tone:             k.ai_tone             || 'sales',
            studio_name:         k.studio_name         || '',
            bank_name:           k.bank_name           || '',
            bank_account_number: k.bank_account_number || '',
            bank_account_holder: k.bank_account_holder || '',
        });
        setError('');
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.wa_phone_number_id.trim()) {
            setError('Nama kiosk dan Phone Number ID wajib diisi.');
            return;
        }
        if (!editing && !form.wa_access_token.trim()) {
            setError('Access Token wajib diisi untuk kiosk baru.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            if (editing) {
                await api.put(`/kiosks/${editing.id}`, form);
            } else {
                await api.post('/kiosks', form);
            }
            setShowModal(false);
            load();
        } catch (err) {
            const msg = err.response?.data?.message
                || Object.values(err.response?.data?.errors || {}).flat().join(' ')
                || 'Gagal menyimpan.';
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (k) => {
        try {
            await api.patch(`/kiosks/${k.id}/toggle`);
            setKiosks(prev => prev.map(item =>
                item.id === k.id ? { ...item, aktif: !item.aktif } : item
            ));
        } catch { /* ignore */ }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/kiosks/${deleteTarget.id}`);
            setDeleteTarget(null);
            load();
        } catch { /* ignore */ }
    };

    const field = (key, label, type = 'text', placeholder = '') => (
        <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input
                type={type}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                autoComplete="off"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
        </div>
    );

    return (
        <BackendLayout>
            <div className="p-6 max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Kiosks</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Kelola nomor WA dan persona AI per kiosk</p>
                    </div>
                    <button onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Kiosk
                    </button>
                </div>

                {/* Cards */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                                <div className="h-4 bg-gray-100 rounded w-2/3 mb-3" />
                                <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                                <div className="h-3 bg-gray-100 rounded w-1/3" />
                            </div>
                        ))}
                    </div>
                ) : kiosks.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                        <div className="text-4xl mb-3">📱</div>
                        <p className="text-gray-500 text-sm">Belum ada kiosk. Tambah kiosk pertama!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {kiosks.map(k => (
                            <div key={k.id} className={`bg-white rounded-2xl border p-5 flex flex-col gap-3 transition-all
                                ${k.aktif ? 'border-gray-100 shadow-sm' : 'border-gray-100 opacity-60'}`}>

                                {/* Top row */}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 text-sm truncate">{k.name}</p>
                                            <p className="text-xs text-gray-400 truncate">{k.studio_name || '—'}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleToggle(k)}
                                        className={`flex-shrink-0 w-10 h-5 rounded-full transition-colors relative ${k.aktif ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${k.aktif ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                    </button>
                                </div>

                                {/* Info rows */}
                                <div className="space-y-1.5 text-xs text-gray-500">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-gray-300">#</span>
                                        <span className="font-mono">{k.wa_phone_number_id}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-gray-300">🤖</span>
                                        <span>{k.ai_name || 'Nadia'} — {TONE_OPTIONS.find(t => t.value === k.ai_tone)?.label.split(' — ')[0] || 'Sales'}</span>
                                    </div>
                                    {k.bank_name && (
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-gray-300">🏦</span>
                                            <span>{k.bank_name} · {k.bank_account_number}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Status + Actions */}
                                <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${k.aktif ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                        {k.aktif ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => openEdit(k)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button onClick={() => setDeleteTarget(k)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">

                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="font-semibold text-gray-900">{editing ? 'Edit Kiosk' : 'Tambah Kiosk Baru'}</h2>
                            <button onClick={() => setShowModal(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal body */}
                        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
                                    {error}
                                </div>
                            )}

                            {/* Identitas kiosk */}
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Identitas Kiosk</p>
                                <div className="space-y-3">
                                    {field('name', 'Nama Kiosk *', 'text', 'Misal: Kiosk Jakarta')}
                                    {field('studio_name', 'Nama Studio', 'text', 'Misal: Waktunya Photobooth Kemang')}
                                </div>
                            </div>

                            {/* WA credentials */}
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">WhatsApp Credentials</p>
                                <div className="space-y-3">
                                    {field('wa_phone_number_id', 'Phone Number ID *', 'text', '1234567890')}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Access Token {editing ? '(kosongkan jika tidak diubah)' : '*'}
                                        </label>
                                        <input
                                            type="password"
                                            value={form.wa_access_token}
                                            onChange={e => setForm(f => ({ ...f, wa_access_token: e.target.value }))}
                                            placeholder={editing ? '••••••••' : 'EAAxxxxxx...'}
                                            autoComplete="new-password"
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        />
                                    </div>
                                    {field('wa_verify_token', 'Verify Token (opsional)', 'text', 'token-unik-kiosk-ini')}
                                </div>
                            </div>

                            {/* AI persona */}
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Persona AI</p>
                                <div className="space-y-3">
                                    {field('ai_name', 'Nama AI', 'text', 'Misal: Nadia, Sari, Budi')}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Tone AI</label>
                                        <select
                                            value={form.ai_tone}
                                            onChange={e => setForm(f => ({ ...f, ai_tone: e.target.value }))}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                                            {TONE_OPTIONS.map(t => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Bank info */}
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Rekening Pembayaran</p>
                                <div className="space-y-3">
                                    {field('bank_name', 'Nama Bank', 'text', 'BCA / Mandiri / BRI ...')}
                                    {field('bank_account_number', 'Nomor Rekening', 'text', '1234567890')}
                                    {field('bank_account_holder', 'Atas Nama', 'text', 'John Doe')}
                                </div>
                            </div>
                        </div>

                        {/* Modal footer */}
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition">
                                Batal
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-60 flex items-center gap-2">
                                {saving && (
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                )}
                                {saving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirm */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 text-sm">Hapus Kiosk?</p>
                                <p className="text-xs text-gray-500">{deleteTarget.name}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600">
                            Kiosk ini akan dihapus permanen. Pesan WA yang masuk ke nomor ini tidak akan diproses lagi.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteTarget(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition">
                                Batal
                            </button>
                            <button onClick={handleDelete}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition">
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </BackendLayout>
    );
}
