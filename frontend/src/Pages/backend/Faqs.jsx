import { useEffect, useState } from 'react';
import BackendLayout from '@/layouts/BackendLayout';
import api from '@/api/axios';

const KATEGORI_COLORS = {
    umum:     'bg-gray-100 text-gray-700',
    paket:    'bg-blue-100 text-blue-700',
    teknis:   'bg-purple-100 text-purple-700',
    payment:  'bg-green-100 text-green-700',
    booking:  'bg-orange-100 text-orange-700',
};

export default function Faqs() {
    const [faqs,        setFaqs]        = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [showModal,   setShowModal]   = useState(false);
    const [editFaq,     setEditFaq]     = useState(null);
    const [saving,      setSaving]      = useState(false);
    const [error,       setError]       = useState('');
    const [search,      setSearch]      = useState('');
    const [filterKat,   setFilterKat]   = useState('');
    const [expanded,    setExpanded]    = useState(null);

    const [form, setForm] = useState({
        pertanyaan: '', jawaban: '', kategori: 'umum', urutan: 0, aktif: true,
    });

    useEffect(() => {
        api.get('/faqs').then(r => setFaqs(r.data)).finally(() => setLoading(false));
    }, []);

    const filtered = faqs.filter(f => {
        const matchSearch = !search ||
            f.pertanyaan.toLowerCase().includes(search.toLowerCase()) ||
            f.jawaban.toLowerCase().includes(search.toLowerCase());
        const matchKat = !filterKat || f.kategori === filterKat;
        return matchSearch && matchKat;
    });

    const openCreate = () => {
        setForm({ pertanyaan: '', jawaban: '', kategori: 'umum', urutan: 0, aktif: true });
        setEditFaq(null); setError(''); setShowModal(true);
    };

    const openEdit = (f) => {
        setForm({ pertanyaan: f.pertanyaan, jawaban: f.jawaban, kategori: f.kategori, urutan: f.urutan, aktif: f.aktif });
        setEditFaq(f); setError(''); setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true); setError('');
        try {
            if (editFaq) {
                const { data } = await api.put(`/faqs/${editFaq.id}`, form);
                setFaqs(fs => fs.map(f => f.id === data.id ? data : f));
            } else {
                const { data } = await api.post('/faqs', form);
                setFaqs(fs => [...fs, data]);
            }
            setShowModal(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan FAQ');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus FAQ ini?')) return;
        await api.delete(`/faqs/${id}`);
        setFaqs(fs => fs.filter(f => f.id !== id));
    };

    const toggleAktif = async (faq) => {
        const { data } = await api.put(`/faqs/${faq.id}`, { aktif: !faq.aktif });
        setFaqs(fs => fs.map(f => f.id === data.id ? data : f));
    };

    const allKategori = [...new Set(faqs.map(f => f.kategori))];

    if (loading) return (
        <BackendLayout>
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        </BackendLayout>
    );

    return (
        <BackendLayout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">FAQ Manager</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Kelola pertanyaan yang sering ditanya — akan otomatis disuntikkan ke konteks AI
                        </p>
                    </div>
                    <button onClick={openCreate}
                        className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah FAQ
                    </button>
                </div>

                {/* Info banner */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 flex gap-3">
                    <svg className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-indigo-700">
                        FAQ yang aktif akan otomatis dimasukkan ke dalam konteks AI. AI akan menggunakan jawaban ini saat customer bertanya tentang topik yang relevan.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-5">
                    <div className="relative flex-1 min-w-[200px]">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Cari pertanyaan atau jawaban..."
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                    <select value={filterKat} onChange={e => setFilterKat(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                        <option value="">Semua kategori</option>
                        {allKategori.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                </div>

                {/* Stats */}
                <div className="flex gap-4 mb-5 text-sm text-gray-500">
                    <span><strong className="text-gray-900">{faqs.filter(f => f.aktif).length}</strong> FAQ aktif</span>
                    <span><strong className="text-gray-900">{faqs.filter(f => !f.aktif).length}</strong> tidak aktif</span>
                    <span><strong className="text-gray-900">{filtered.length}</strong> hasil filter</span>
                </div>

                {/* FAQ List */}
                {filtered.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                        <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 font-medium">Belum ada FAQ</p>
                        <p className="text-gray-400 text-sm mt-1">Klik "Tambah FAQ" untuk menambahkan pertanyaan umum</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map(faq => (
                            <div key={faq.id}
                                className={`bg-white rounded-xl border transition ${faq.aktif ? 'border-gray-100' : 'border-dashed border-gray-200 opacity-60'}`}>
                                <button onClick={() => setExpanded(expanded === faq.id ? null : faq.id)}
                                    className="w-full text-left px-4 py-3.5 flex items-start gap-3">
                                    <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center transition
                                        ${expanded === faq.id ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>
                                        {expanded === faq.id && (
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-semibold text-gray-900">{faq.pertanyaan}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${KATEGORI_COLORS[faq.kategori] || 'bg-gray-100 text-gray-700'}`}>
                                                {faq.kategori}
                                            </span>
                                            {!faq.aktif && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Nonaktif</span>
                                            )}
                                        </div>
                                    </div>
                                    <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 transition-transform ${expanded === faq.id ? 'rotate-180' : ''}`}
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {expanded === faq.id && (
                                    <div className="px-4 pb-4 pt-0 space-y-3">
                                        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                            {faq.jawaban}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => toggleAktif(faq)}
                                                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                                                    faq.aktif
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}>
                                                {faq.aktif ? 'Aktif' : 'Nonaktif'}
                                            </button>
                                            <button onClick={() => openEdit(faq)}
                                                className="text-xs font-medium text-indigo-600 hover:underline px-1">Edit</button>
                                            <button onClick={() => handleDelete(faq.id)}
                                                className="text-xs font-medium text-red-500 hover:underline px-1 ml-auto">Hapus</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="font-semibold text-gray-900">{editFaq ? 'Edit FAQ' : 'Tambah FAQ'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Pertanyaan *</label>
                                <input value={form.pertanyaan} onChange={e => setForm(f => ({...f, pertanyaan: e.target.value}))} required
                                    placeholder="Contoh: Berapa harga sewa photobooth?"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Jawaban *</label>
                                <textarea value={form.jawaban} onChange={e => setForm(f => ({...f, jawaban: e.target.value}))} required
                                    rows={5} placeholder="Tulis jawaban lengkap di sini..."
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Kategori</label>
                                    <input value={form.kategori} onChange={e => setForm(f => ({...f, kategori: e.target.value}))}
                                        list="kategori-options" placeholder="umum"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                    <datalist id="kategori-options">
                                        <option value="umum" />
                                        <option value="paket" />
                                        <option value="teknis" />
                                        <option value="payment" />
                                        <option value="booking" />
                                    </datalist>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Urutan</label>
                                    <input type="number" min="0" value={form.urutan} onChange={e => setForm(f => ({...f, urutan: Number(e.target.value)}))}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" checked={form.aktif} onChange={e => setForm(f => ({...f, aktif: e.target.checked}))}
                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                                <span className="text-sm text-gray-700">Aktifkan FAQ (akan digunakan oleh AI)</span>
                            </label>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition">
                                    Batal
                                </button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 bg-indigo-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-60">
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
