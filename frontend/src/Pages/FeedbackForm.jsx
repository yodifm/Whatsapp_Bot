import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const api  = axios.create({ baseURL: BASE, headers: { Accept: 'application/json' } });

const SUMBER_OPTS = [
    { label: 'Instagram',                     icon: '📷' },
    { label: 'Instagram Ads',                 icon: '📣' },
    { label: 'TikTok',                        icon: '🎵' },
    { label: 'Website',                       icon: '🌐' },
    { label: 'Exhibition / Wedding Fair',     icon: '🎪' },
    { label: 'Teman atau keluarga',           icon: '👥' },
    { label: 'Marketplace (Bridestory, dll)', icon: '🛒' },
    { label: 'Lainnya',                       icon: '✨' },
];

const RATINGS_CONFIG = [
    { key: 'rating_print', label: 'Kecepatan Print Foto',       icon: '🖨️' },
    { key: 'rating_foto',  label: 'Kualitas Foto',              icon: '📸' },
    { key: 'rating_staff', label: 'Pelayanan Staff Photobooth', icon: '🤝' },
    { key: 'rating_frame', label: 'Hasil Design Frame',         icon: '🎨' },
    { key: 'rating_admin', label: 'Pelayanan Admin',            icon: '💬' },
];

const STAR_LABELS = ['', 'Sangat Kurang', 'Kurang', 'Cukup', 'Bagus', 'Luar Biasa!'];

// ── Star Rating Row ────────────────────────────────────────────────────────
function StarRow({ label, icon, ratingKey, value, onChange, error }) {
    const [hovered, setHovered] = useState(0);
    const active = hovered || value;

    return (
        <div className={`rounded-2xl p-4 transition-all duration-200
            ${error    ? 'bg-red-50 ring-1 ring-red-200'
            : active   ? 'bg-violet-50'
            : 'bg-gray-50/70'}`}>

            <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span>{icon}</span>{label}
                </span>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full transition-all
                    ${active >= 4 ? 'bg-green-100 text-green-600'
                    : active >= 3 ? 'bg-amber-100 text-amber-600'
                    : active >= 1 ? 'bg-red-100 text-red-500'
                    : 'bg-gray-100 text-gray-400'}`}>
                    {active ? STAR_LABELS[active] : 'Belum dinilai'}
                </span>
            </div>

            <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button"
                        onClick={() => onChange(ratingKey, n)}
                        onMouseEnter={() => setHovered(n)}
                        onMouseLeave={() => setHovered(0)}
                        className="flex-1 focus:outline-none"
                    >
                        <svg viewBox="0 0 24 24" className={`w-full transition-all duration-100
                            ${n <= active ? 'text-amber-400' : 'text-gray-200 hover:text-amber-200'}`}
                            style={{ height: '36px', transform: n <= active ? 'scale(1.08)' : 'scale(1)' }}
                            fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                    </button>
                ))}
            </div>

            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </div>
    );
}

// ── Section header ─────────────────────────────────────────────────────────
function SectionHeader({ emoji, label, color }) {
    return (
        <div className="flex items-center gap-2.5 mb-5">
            <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center text-base shadow-sm`}>
                {emoji}
            </div>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</h2>
        </div>
    );
}

const initForm = {
    kiosk_id: null, booking_id: null, nama: '', sumber: '',
    rating_print: 0, rating_foto: 0, rating_staff: 0, rating_frame: 0, rating_admin: 0,
    rekomendasikan: '', pakai_lagi: '', saran: '',
};

export default function FeedbackForm() {
    const [form,        setForm]        = useState(initForm);
    const [errors,      setErrors]      = useState({});
    const [loading,     setLoading]     = useState(false);
    const [success,     setSuccess]     = useState(false);
    const [studioName,  setStudioName]  = useState('Waktunya Photobooth');
    const [bookingInfo, setBookingInfo] = useState(null); // { event_name, event_date, staff_names }
    const [sumberOpen,  setSumberOpen]  = useState(false);
    const sumberRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (sumberRef.current && !sumberRef.current.contains(e.target)) setSumberOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        const params    = new URLSearchParams(window.location.search);
        const kioskId   = params.get('kiosk');
        const bookingId = params.get('booking');

        // Fetch studio name
        const studioUrl = kioskId ? `/studio-info?kiosk_id=${kioskId}` : '/studio-info';
        api.get(studioUrl).then(r => {
            setStudioName(r.data.studio_name);
            if (r.data.kiosk_id) setForm(f => ({ ...f, kiosk_id: r.data.kiosk_id }));
        }).catch(() => {});

        // Fetch booking + staff info
        if (bookingId) {
            api.get(`/booking-info/${bookingId}`).then(r => {
                setBookingInfo(r.data);
                setForm(f => ({ ...f, booking_id: r.data.booking_id, nama: r.data.customer_name || '' }));
            }).catch(() => {});
        }
    }, []);

    const set = (key, val) => {
        setForm(f => ({ ...f, [key]: val }));
        if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
    };

    const validate = () => {
        const e = {};
        if (!form.nama.trim()) e.nama = 'Nama wajib diisi';
        RATINGS_CONFIG.forEach(r => { if (!form[r.key]) e[r.key] = 'Rating wajib dipilih'; });
        if (!form.rekomendasikan) e.rekomendasikan = 'Pilihan wajib diisi';
        if (!form.pakai_lagi)     e.pakai_lagi     = 'Pilihan wajib diisi';
        if (!form.saran.trim())   e.saran           = 'Saran & kritik wajib diisi';
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) {
            setErrors(errs);
            document.querySelector('[data-has-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        setLoading(true);
        try {
            await api.post('/feedback', {
                ...form,
                rekomendasikan: form.rekomendasikan.toLowerCase(),
                pakai_lagi:     form.pakai_lagi.toLowerCase(),
            });
            setSuccess(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            const s = err.response?.data?.errors ?? {};
            setErrors(Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v[0]])));
        } finally {
            setLoading(false);
        }
    };

    const avgRating = RATINGS_CONFIG.reduce((s, r) => s + (form[r.key] || 0), 0) / RATINGS_CONFIG.length;

    // ── Success ────────────────────────────────────────────────────────────
    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 flex items-center justify-center p-6">
                {/* Decorative background circles */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/5" />
                    <div className="absolute top-1/3 left-1/4 w-40 h-40 rounded-full bg-pink-400/10" />
                </div>

                <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center">
                    {/* Check icon */}
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-200">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <div className="text-4xl mb-3">🎉</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">Terima Kasih!</h2>
                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                        Feedback kamu sudah kami terima, <span className="text-gray-600 font-semibold">{form.nama}</span>! Masukan kamu sangat berarti untuk kami 🙏
                    </p>

                    {/* Average rating display */}
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-5 mb-4 border border-amber-100">
                        <p className="text-xs text-amber-500 font-semibold uppercase tracking-wider mb-2">Rating kamu</p>
                        <div className="flex justify-center gap-1 mb-2">
                            {[1,2,3,4,5].map(n => (
                                <svg key={n} className={`w-7 h-7 ${n <= Math.round(avgRating) ? 'text-amber-400' : 'text-gray-200'}`}
                                    fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                            ))}
                        </div>
                        <p className="text-3xl font-bold text-amber-500">
                            {avgRating.toFixed(1)}
                            <span className="text-base font-normal text-gray-400 ml-1">/ 5.0</span>
                        </p>
                    </div>

                    <p className="text-xs text-gray-400">Sampai jumpa di event berikutnya! 📸</p>
                </div>
            </div>
        );
    }

    // ── Form ───────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-100">

            {/* ── HERO HEADER ── */}
            <div className="relative bg-gradient-to-b from-violet-700 via-violet-600 to-purple-500 px-6 pt-12 pb-10 overflow-hidden">
                {/* Decorative shapes */}
                <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-52 h-52 rounded-full bg-pink-500/20 translate-y-1/2 -translate-x-1/3" />
                <div className="absolute top-8 right-12 w-8 h-8 rounded-full bg-white/10" />
                <div className="absolute bottom-12 right-8 w-5 h-5 rounded-full bg-amber-300/30" />

                <div className="relative max-w-md mx-auto text-center text-white">
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur border border-white/20 mb-4 shadow-lg shadow-violet-900/30">
                        <span className="text-3xl">📸</span>
                    </div>

                    <h1 className="text-2xl font-bold mb-1 tracking-tight drop-shadow">{studioName}</h1>
                    <p className="text-white/60 text-sm mb-5">Ceritakan pengalaman kamu bersama kami</p>

                    {/* Stars row */}
                    <div className="flex justify-center gap-2 mb-6">
                        {[1,2,3,4,5].map(n => (
                            <svg key={n} className="w-6 h-6 text-amber-300 drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                        ))}
                    </div>

                    {/* Intro text inline in header */}
                    <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/20 px-5 py-4">
                        <p className="text-white/85 text-sm leading-relaxed">
                            Terimakasih sudah menggunakan jasa <strong className="text-white">{studioName}</strong> untuk memeriahkan acara kamu! Apresiasi dan masukan kamu sangat berarti untuk kami 🙏
                        </p>
                    </div>
                </div>
            </div>

            {/* ── FORM BODY ── */}
            <div className="max-w-md mx-auto px-4 py-5 pb-10 space-y-4">

                {/* Event info banner — shown only when ?booking=ID is in URL */}
                {bookingInfo && (
                    <div className="bg-white rounded-3xl shadow-sm p-5 border-l-4 border-violet-500">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-lg">🎪</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-violet-500 uppercase tracking-wider mb-0.5">Event kamu</p>
                                <p className="text-sm font-bold text-gray-800 truncate">{bookingInfo.event_name || 'Event Photobooth'}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{bookingInfo.event_date}</p>

                                {bookingInfo.staff_names?.length > 0 && (
                                    <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                                        <p className="text-xs text-gray-400 mb-1.5">Staff yang bertugas:</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {bookingInfo.staff_names.map((s, i) => (
                                                <span key={i}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-medium border border-violet-100">
                                                    <span className="text-sm">👤</span> {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {bookingInfo.staff_names?.length === 0 && (
                                    <p className="text-xs text-amber-500 mt-2 flex items-center gap-1">
                                        <span>⚠️</span> Data staff belum tersedia
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-4">

                    {/* ── SECTION 1: Tentang Kamu ── */}
                    <div className="bg-white rounded-3xl shadow-sm p-5">
                        <SectionHeader emoji="👤" label="Tentang Kamu" color="bg-violet-100" />

                        {/* Nama */}
                        <div className="mb-4" data-has-error={errors.nama ? '' : undefined}>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Nama <span className="text-pink-500">*</span>
                            </label>
                            <input type="text"
                                value={form.nama}
                                onChange={e => set('nama', e.target.value)}
                                placeholder="Nama lengkap kamu"
                                className={`w-full rounded-xl px-4 py-3 text-sm border-2 transition-colors focus:outline-none
                                    ${errors.nama
                                        ? 'border-red-200 bg-red-50 focus:border-red-400'
                                        : 'border-gray-100 bg-gray-50 focus:border-violet-400 focus:bg-white'}`}
                            />
                            {errors.nama && <p className="text-red-500 text-xs mt-1.5">{errors.nama}</p>}
                        </div>

                        {/* Sumber */}
                        <div ref={sumberRef} className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Mengetahui {studioName} darimana?
                            </label>
                            <button type="button"
                                onClick={() => setSumberOpen(o => !o)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm transition-colors focus:outline-none
                                    ${sumberOpen
                                        ? 'border-violet-400 bg-white'
                                        : 'border-gray-100 bg-gray-50 hover:border-violet-200'}`}
                            >
                                <span className={form.sumber ? 'text-gray-800' : 'text-gray-400'}>
                                    {form.sumber
                                        ? `${SUMBER_OPTS.find(o => o.label === form.sumber)?.icon} ${form.sumber}`
                                        : 'Pilih sumber...'}
                                </span>
                                <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${sumberOpen ? 'rotate-180' : ''}`}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {sumberOpen && (
                                <div className="absolute z-30 mt-1.5 w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                    {SUMBER_OPTS.map(opt => (
                                        <button key={opt.label} type="button"
                                            onClick={() => { set('sumber', opt.label); setSumberOpen(false); }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left
                                                ${form.sumber === opt.label
                                                    ? 'bg-violet-50 text-violet-700 font-medium'
                                                    : 'text-gray-700 hover:bg-gray-50'}`}
                                        >
                                            <span className="text-lg w-6 text-center">{opt.icon}</span>
                                            <span className="flex-1">{opt.label}</span>
                                            {form.sumber === opt.label && (
                                                <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── SECTION 2: Rating Layanan ── */}
                    <div className="bg-white rounded-3xl shadow-sm p-5">
                        <SectionHeader emoji="⭐" label="Rating Layanan" color="bg-amber-100" />

                        <div className="space-y-3">
                            {RATINGS_CONFIG.map(r => (
                                <div key={r.key} data-has-error={errors[r.key] ? '' : undefined}>
                                    <StarRow
                                        label={r.label} icon={r.icon}
                                        ratingKey={r.key} value={form[r.key]}
                                        onChange={set} error={errors[r.key]}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── SECTION 3: Pendapat ── */}
                    <div className="bg-white rounded-3xl shadow-sm p-5">
                        <SectionHeader emoji="💬" label="Pendapat Kamu" color="bg-green-100" />

                        {[
                            { key: 'rekomendasikan', label: 'Apakah kamu akan merekomendasikan kami ke kerabatmu?' },
                            { key: 'pakai_lagi',     label: 'Jika ada event lain, apakah kamu akan menggunakan kami lagi?' },
                        ].map(q => (
                            <div key={q.key} className="mb-5" data-has-error={errors[q.key] ? '' : undefined}>
                                <p className="text-sm font-medium text-gray-700 mb-3">
                                    {q.label} <span className="text-pink-500">*</span>
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { val: 'Iya',       emoji: '😍', selectedClass: 'bg-green-50 border-green-400 text-green-700 ring-2 ring-green-300 ring-offset-1' },
                                        { val: 'Ragu-ragu', emoji: '🤔', selectedClass: 'bg-amber-50 border-amber-400 text-amber-700 ring-2 ring-amber-300 ring-offset-1' },
                                        { val: 'Tidak',     emoji: '😕', selectedClass: 'bg-red-50 border-red-400 text-red-600 ring-2 ring-red-300 ring-offset-1' },
                                    ].map(opt => (
                                        <button key={opt.val} type="button"
                                            onClick={() => set(q.key, opt.val)}
                                            className={`flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-2xl border-2 text-xs font-semibold transition-all duration-150
                                                ${form[q.key] === opt.val
                                                    ? opt.selectedClass
                                                    : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200 hover:bg-gray-100'}`}
                                        >
                                            <span className="text-2xl">{opt.emoji}</span>
                                            {opt.val}
                                        </button>
                                    ))}
                                </div>
                                {errors[q.key] && <p className="text-red-500 text-xs mt-1.5">{errors[q.key]}</p>}
                            </div>
                        ))}

                        {/* Saran */}
                        <div data-has-error={errors.saran ? '' : undefined}>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Saran & Kritik <span className="text-pink-500">*</span>
                            </label>
                            <textarea rows={4}
                                value={form.saran}
                                onChange={e => set('saran', e.target.value)}
                                placeholder="Ceritakan pengalaman kamu... Ada hal yang kurang? Atau hal yang kamu sukai? 😊"
                                className={`w-full rounded-xl px-4 py-3 text-sm border-2 resize-none transition-colors focus:outline-none
                                    ${errors.saran
                                        ? 'border-red-200 bg-red-50 focus:border-red-400'
                                        : 'border-gray-100 bg-gray-50 focus:border-violet-400 focus:bg-white'}`}
                            />
                            {errors.saran && <p className="text-red-500 text-xs mt-1.5">{errors.saran}</p>}
                        </div>
                    </div>

                    {/* ── SUBMIT ── */}
                    <button type="submit" disabled={loading}
                        className="w-full py-4 rounded-2xl font-bold text-white text-[15px] shadow-lg shadow-violet-200
                            bg-gradient-to-r from-violet-600 to-purple-500
                            hover:from-violet-700 hover:to-purple-600
                            active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed
                            transition-all duration-150"
                    >
                        {loading
                            ? <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Mengirim...
                              </span>
                            : '🚀  Kirim Feedback'}
                    </button>

                    <p className="text-center text-xs text-gray-400 pb-2">
                        🔒 Data kamu aman dan hanya digunakan untuk meningkatkan layanan kami
                    </p>
                </form>

            </div>{/* end form body */}
        </div>
    );
}
