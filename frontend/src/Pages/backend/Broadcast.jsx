import BackendLayout from '@/layouts/BackendLayout';
import { useState, useEffect } from 'react';
import api from '@/api/axios';

const STATUS_CONFIG = {
    new:        { label: 'Baru',      color: 'bg-gray-100 text-gray-600' },
    interested: { label: 'Tertarik',  color: 'bg-blue-100 text-blue-700' },
    followup:   { label: 'Follow-up', color: 'bg-orange-100 text-orange-700' },
    booked:     { label: 'Booking',   color: 'bg-green-100 text-green-700' },
    done:       { label: 'Selesai',   color: 'bg-violet-100 text-violet-700' },
};

const TEMPLATES = [
    {
        label: 'Promo Weekend',
        text: 'Halo Kak! 👋 Ada promo spesial weekend ini nih dari kami — diskon 15% untuk semua paket photobooth! Yuk book sekarang sebelum slot habis 📸✨',
    },
    {
        label: 'Follow-up Lunak',
        text: 'Halo Kak 😊 Masih ingat dengan kami? Kami dari Photobooth Studio siap bantu Kakak abadikan momen spesial. Ada yang bisa kami bantu?',
    },
    {
        label: 'Pengumuman Paket Baru',
        text: 'Kabar gembira Kak! 🎉 Kami baru saja meluncurkan paket baru yang lebih lengkap dengan harga yang lebih terjangkau. Yuk cek sekarang!',
    },
];

export default function Broadcast() {
    const [message, setMessage]         = useState('');
    const [filterStatus, setFilterStatus] = useState([]);
    const [preview, setPreview]         = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [sending, setSending]         = useState(false);
    const [result, setResult]           = useState(null);

    // Auto-load preview saat filter berubah
    useEffect(() => {
        const load = async () => {
            setLoadingPreview(true);
            try {
                const r = await api.post('/broadcast/preview', { filter_status: filterStatus });
                setPreview(r.data);
            } finally {
                setLoadingPreview(false);
            }
        };
        load();
    }, [filterStatus]);

    const toggleStatus = (s) => {
        setFilterStatus(prev =>
            prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
        );
    };

    const handleSend = async () => {
        if (!message.trim()) return;
        if (!window.confirm(`Kirim pesan ke ${preview?.count ?? 0} customer?`)) return;

        setSending(true);
        setResult(null);
        try {
            const r = await api.post('/broadcast', { message, filter_status: filterStatus });
            setResult(r.data);
            setMessage('');
        } catch (err) {
            setResult({ message: 'Gagal mengirim broadcast.', sent: 0, failed: 0 });
        } finally {
            setSending(false);
        }
    };

    const charCount = message.length;
    const isOverLimit = charCount > 4096;

    return (
        <BackendLayout>
            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900">Broadcast</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Kirim pesan massal ke customer via WhatsApp.</p>
                </div>

                {result && (
                    <div className={`mb-5 rounded-xl border px-4 py-3.5 flex items-start gap-3 text-sm ${
                        result.failed === 0
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}>
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            {result.failed === 0
                                ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                : <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            }
                        </svg>
                        <div>
                            <p className="font-medium">{result.message}</p>
                            {result.failed_list?.length > 0 && (
                                <p className="text-xs mt-1 opacity-80">Gagal: {result.failed_list.join(', ')}</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    {/* Composer */}
                    <div className="lg:col-span-3 space-y-4">
                        {/* Templates */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                            <p className="text-sm font-semibold text-gray-900 mb-3">Template Pesan</p>
                            <div className="space-y-2">
                                {TEMPLATES.map(t => (
                                    <button key={t.label} onClick={() => setMessage(t.text)}
                                        className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition group">
                                        <p className="text-xs font-semibold text-gray-700 group-hover:text-indigo-700 mb-1">{t.label}</p>
                                        <p className="text-xs text-gray-400 line-clamp-2">{t.text}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Message composer */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold text-gray-900">Pesan</p>
                                <span className={`text-xs ${isOverLimit ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                                    {charCount}/4096
                                </span>
                            </div>
                            <textarea
                                rows={5}
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="Tulis pesan broadcast kamu di sini..."
                                className={`w-full rounded-xl border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition ${
                                    isOverLimit ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                }`}
                            />

                            {/* WA-style preview */}
                            {message.trim() && (
                                <div className="mt-3 rounded-xl bg-gray-50 border border-gray-100 p-3">
                                    <p className="text-[11px] text-gray-400 mb-2 font-medium uppercase tracking-wide">Preview WhatsApp</p>
                                    <div className="flex justify-start">
                                        <div className="bg-white rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-gray-800 shadow-sm border border-gray-100 max-w-sm whitespace-pre-wrap">
                                            {message}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Target & Send */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Filter */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                            <p className="text-sm font-semibold text-gray-900 mb-1">Target Customer</p>
                            <p className="text-xs text-gray-400 mb-3">Kosongkan untuk kirim ke semua customer.</p>
                            <div className="space-y-2">
                                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                    <label key={key} className="flex items-center gap-3 cursor-pointer group">
                                        <div onClick={() => toggleStatus(key)}
                                            className={`w-5 h-5 rounded flex items-center justify-center border-2 transition flex-shrink-0 ${
                                                filterStatus.includes(key)
                                                    ? 'bg-indigo-600 border-indigo-600'
                                                    : 'border-gray-300 group-hover:border-indigo-400'
                                            }`}>
                                            {filterStatus.includes(key) && (
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>{cfg.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Recipient preview */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-semibold text-gray-900">Penerima</p>
                                {loadingPreview ? (
                                    <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                                ) : (
                                    <span className="text-lg font-bold text-indigo-600">{preview?.count ?? 0}</span>
                                )}
                            </div>
                            {preview?.preview?.length > 0 ? (
                                <div className="space-y-2">
                                    {preview.preview.map((c, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-[10px] font-bold flex-shrink-0">
                                                {(c.nama ?? '?').charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-xs text-gray-600 truncate">{c.nama ?? 'Tanpa Nama'}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-auto flex-shrink-0 ${STATUS_CONFIG[c.status]?.color ?? ''}`}>
                                                {STATUS_CONFIG[c.status]?.label}
                                            </span>
                                        </div>
                                    ))}
                                    {preview.count > 5 && (
                                        <p className="text-xs text-gray-400 text-center pt-1">+{preview.count - 5} customer lainnya</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 text-center py-3">Tidak ada customer</p>
                            )}
                        </div>

                        <button onClick={handleSend}
                            disabled={sending || !message.trim() || isOverLimit || (preview?.count ?? 0) === 0}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-3 rounded-xl transition shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
                            {sending ? (
                                <>
                                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                    Mengirim...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                    </svg>
                                    Kirim ke {preview?.count ?? 0} Customer
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </BackendLayout>
    );
}
