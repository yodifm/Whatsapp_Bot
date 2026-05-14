import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const api  = axios.create({ baseURL: BASE, headers: { Accept: 'application/json' } });

const BACKDROPS = [
    { label: 'Black',         color: '#1a1a1a' },
    { label: 'Silver',        color: '#C0C0C0' },
    { label: 'Gold',          color: '#D4AF37' },
    { label: 'Maroon',        color: '#800000' },
    { label: 'Putih Polos',   color: '#F5F5F5' },
    { label: 'Tidak Pakai',   color: null },
    { label: 'To Be Confirmed', color: null },
];

const ACARA_OPTS = [
    { val: 'Pernikahan',    icon: '💍', desc: 'Wedding & Reception' },
    { val: 'Birthday',      icon: '🎂', desc: 'Ulang Tahun' },
    { val: 'Another Event', icon: '🎊', desc: 'Event Lainnya' },
];

const FRAME_OPTS = [
    { val: '2r', label: '2R', desc: 'Cetak 2 foto per strip' },
    { val: '4r', label: '4R', desc: 'Cetak 4 foto per strip' },
];

const SYARAT_VENUE = [
    'Space photobooth minimal berukuran 2x2m',
    'Space photobooth indoor atau semi outdoor',
    'Tidak terkena cahaya matahari langsung atau tampias hujan',
    'Dekat dengan stop kontak, daya listrik 300–450 watt',
];

const SYARAT_BAYAR = [
    'DP 50% dibayarkan maksimal H-2 minggu acara',
    'Pelunasan dilakukan maksimal H-1 acara',
    'Design custom frame maksimal 3x revisi',
];

const STEPS = ['Data Diri', 'Detail Acara', 'Paket & Dekorasi', 'Syarat & Ketentuan'];

const initForm = {
    nama: '', no_whatsapp: '', email: '', acara: '', tanggal: '',
    jam_mulai: '', lokasi: '', package_id: '', frame: '', warna_backdrop: '',
    catatan: '', syarat_venue: false, syarat_pembayaran: false, setuju: false,
};

export default function BookingForm() {
    const [form,     setForm]     = useState(initForm);
    const [packages, setPackages] = useState([]);
    const [errors,   setErrors]   = useState({});
    const [loading,  setLoading]  = useState(false);
    const [success,  setSuccess]  = useState(false);
    const [step,     setStep]     = useState(0);

    useEffect(() => {
        api.get('/booking-form/packages').then(r => setPackages(r.data)).catch(() => {});
    }, []);

    const set = (key, val) => {
        setForm(f => ({ ...f, [key]: val }));
        setErrors(e => ({ ...e, [key]: undefined }));
    };

    const validateStep = () => {
        const errs = {};
        if (step === 0) {
            if (!form.nama.trim())         errs.nama         = ['Nama wajib diisi'];
            if (!form.no_whatsapp.trim())  errs.no_whatsapp  = ['No. WhatsApp wajib diisi'];
        }
        if (step === 1) {
            if (!form.acara)               errs.acara      = ['Pilih jenis acara'];
            if (!form.tanggal)             errs.tanggal    = ['Tanggal wajib diisi'];
            if (!form.jam_mulai)           errs.jam_mulai  = ['Jam mulai wajib diisi'];
            if (!form.lokasi.trim())       errs.lokasi     = ['Lokasi wajib diisi'];
        }
        if (step === 2) {
            if (!form.frame)               errs.frame          = ['Pilih ukuran frame'];
            if (!form.warna_backdrop)      errs.warna_backdrop = ['Pilih warna backdrop'];
        }
        return errs;
    };

    const nextStep = () => {
        const errs = validateStep();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setErrors({});
        setStep(s => s + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const prevStep = () => {
        setErrors({});
        setStep(s => s - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.syarat_venue || !form.syarat_pembayaran || !form.setuju) {
            setErrors({ syarat: 'Harap centang semua persetujuan syarat dan ketentuan.' });
            return;
        }
        setLoading(true); setErrors({});
        try {
            await api.post('/booking-form', {
                ...form,
                syarat_venue:      form.syarat_venue      ? '1' : '0',
                syarat_pembayaran: form.syarat_pembayaran ? '1' : '0',
            });
            setSuccess(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            if (err.response?.status === 422) {
                const errs = err.response.data.errors || {};
                setErrors(errs);
                // jam_mulai/tanggal conflict → jump back to step 1
                if (errs.jam_mulai || errs.tanggal) {
                    setStep(1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            } else {
                setErrors({ general: 'Terjadi kesalahan, coba lagi ya.' });
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) return <SuccessPage />;

    const progress = ((step) / (STEPS.length - 1)) * 100;

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
            {/* Hero header */}
            <div className="relative overflow-hidden pt-10 pb-24 px-4 text-center">
                <div className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #7c3aed 0%, transparent 50%), radial-gradient(circle at 80% 20%, #2563eb 0%, transparent 50%)' }} />
                <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-xl"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                        📸
                    </div>
                    <div>
                        <p className="text-white/60 text-xs font-medium tracking-widest uppercase">Waktunya Photobooth</p>
                        <h1 className="text-white text-2xl font-bold mt-1">Form Penyewaan Photobooth</h1>
                        <p className="text-white/50 text-sm mt-1">Isi data dengan lengkap dan benar ya 😊</p>
                    </div>
                </div>
            </div>

            {/* Card floating over hero */}
            <div className="max-w-xl mx-auto px-4 -mt-16 pb-12 relative z-10">
                {/* Progress card */}
                <div className="rounded-3xl shadow-2xl overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)' }}>

                    {/* Step bar */}
                    <div className="px-6 pt-6 pb-4">
                        <div className="flex items-center justify-between mb-3">
                            {STEPS.map((s, i) => (
                                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                                        i < step  ? 'bg-violet-600 text-white scale-90' :
                                        i === step ? 'bg-violet-600 text-white ring-4 ring-violet-200' :
                                                     'bg-gray-100 text-gray-400'
                                    }`}>
                                        {i < step ? (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : i + 1}
                                    </div>
                                    <span className={`text-[10px] font-medium text-center leading-tight hidden sm:block ${i === step ? 'text-violet-700' : 'text-gray-400'}`}>
                                        {s}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {/* Progress bar */}
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #7c3aed, #4f46e5)' }} />
                        </div>
                        <div className="flex justify-between mt-1.5">
                            <span className="text-xs text-gray-400">Langkah {step + 1} dari {STEPS.length}</span>
                            <span className="text-xs font-semibold text-violet-600">{STEPS[step]}</span>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* Form body */}
                    <form onSubmit={handleSubmit}>
                        <div className="px-6 py-6 space-y-5">
                            {errors.general && (
                                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl">
                                    {errors.general}
                                </div>
                            )}

                            {/* ── STEP 0: Data Diri ── */}
                            {step === 0 && (
                                <div className="space-y-4">
                                    <SectionLabel icon="👤" text="Data Diri" />
                                    <Field label="Nama Lengkap" required error={errors.nama?.[0]}>
                                        <FloatInput
                                            value={form.nama}
                                            onChange={e => set('nama', e.target.value)}
                                            placeholder="Nama lengkap kamu"
                                            error={errors.nama}
                                        />
                                    </Field>
                                    <Field label="No. WhatsApp" required error={errors.no_whatsapp?.[0]}>
                                        <FloatInput
                                            value={form.no_whatsapp}
                                            onChange={e => set('no_whatsapp', e.target.value)}
                                            placeholder="08xx xxxx xxxx"
                                            error={errors.no_whatsapp}
                                        />
                                    </Field>
                                    <Field label="Email" error={errors.email?.[0]}>
                                        <FloatInput
                                            type="email"
                                            value={form.email}
                                            onChange={e => set('email', e.target.value)}
                                            placeholder="email@contoh.com (opsional)"
                                            error={errors.email}
                                        />
                                    </Field>
                                </div>
                            )}

                            {/* ── STEP 1: Detail Acara ── */}
                            {step === 1 && (
                                <div className="space-y-5">
                                    <SectionLabel icon="🎉" text="Detail Acara" />
                                    <Field label="Jenis Acara" required error={errors.acara?.[0]}>
                                        <div className="grid grid-cols-3 gap-2.5">
                                            {ACARA_OPTS.map(a => (
                                                <button key={a.val} type="button" onClick={() => set('acara', a.val)}
                                                    className={`py-3.5 px-2 rounded-2xl text-center border-2 transition-all duration-200 ${
                                                        form.acara === a.val
                                                            ? 'border-violet-500 bg-violet-50 shadow-md shadow-violet-100'
                                                            : 'border-gray-100 bg-gray-50 hover:border-violet-200'
                                                    }`}>
                                                    <div className="text-xl mb-1">{a.icon}</div>
                                                    <div className={`text-xs font-semibold leading-tight ${form.acara === a.val ? 'text-violet-700' : 'text-gray-600'}`}>{a.val}</div>
                                                    <div className="text-[10px] text-gray-400 mt-0.5">{a.desc}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </Field>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Tanggal Acara" required error={errors.tanggal?.[0]}>
                                            <DatePickerField value={form.tanggal}
                                                onChange={v => set('tanggal', v)} error={errors.tanggal} />
                                        </Field>
                                        <Field label="Jam Mulai" required error={errors.jam_mulai?.[0]}>
                                            <TimePickerField value={form.jam_mulai}
                                                onChange={v => set('jam_mulai', v)} error={errors.jam_mulai} />
                                        </Field>
                                    </div>
                                    <Field label="Lokasi Acara" required error={errors.lokasi?.[0]}>
                                        <FloatInput value={form.lokasi} onChange={e => set('lokasi', e.target.value)}
                                            placeholder="Nama gedung / alamat lengkap" error={errors.lokasi} />
                                    </Field>
                                </div>
                            )}

                            {/* ── STEP 2: Paket & Dekorasi ── */}
                            {step === 2 && (
                                <div className="space-y-5">
                                    <SectionLabel icon="✨" text="Paket & Dekorasi" />

                                    {packages.length > 0 && (
                                        <Field label="Pilihan Paket" error={errors.package_id?.[0]}>
                                            <div className="space-y-2">
                                                <button type="button" onClick={() => set('package_id', '')}
                                                    className={`w-full text-left px-4 py-3 rounded-2xl border-2 transition-all duration-200 ${
                                                        !form.package_id ? 'border-violet-500 bg-violet-50' : 'border-gray-100 bg-gray-50 hover:border-violet-200'
                                                    }`}>
                                                    <p className={`text-sm font-semibold ${!form.package_id ? 'text-violet-700' : 'text-gray-500'}`}>Belum tahu / Tanya dulu</p>
                                                </button>
                                                {packages.map(p => (
                                                    <button key={p.id} type="button" onClick={() => set('package_id', p.id)}
                                                        className={`w-full text-left px-4 py-3 rounded-2xl border-2 transition-all duration-200 ${
                                                            form.package_id === p.id ? 'border-violet-500 bg-violet-50' : 'border-gray-100 bg-gray-50 hover:border-violet-200'
                                                        }`}>
                                                        <div className="flex justify-between items-center">
                                                            <p className={`text-sm font-semibold ${form.package_id === p.id ? 'text-violet-700' : 'text-gray-700'}`}>{p.nama}</p>
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${form.package_id === p.id ? 'bg-violet-200 text-violet-700' : 'bg-gray-200 text-gray-500'}`}>
                                                                {p.durasi_jam} jam
                                                            </span>
                                                        </div>
                                                        <p className={`text-xs mt-0.5 ${form.package_id === p.id ? 'text-violet-500' : 'text-gray-400'}`}>
                                                            Rp {Number(p.harga).toLocaleString('id-ID')}
                                                        </p>
                                                    </button>
                                                ))}
                                            </div>
                                        </Field>
                                    )}

                                    <Field label="Ukuran Frame" required error={errors.frame?.[0]}>
                                        <div className="grid grid-cols-2 gap-3">
                                            {FRAME_OPTS.map(f => (
                                                <button key={f.val} type="button" onClick={() => set('frame', f.val)}
                                                    className={`py-4 px-4 rounded-2xl border-2 transition-all duration-200 text-center ${
                                                        form.frame === f.val
                                                            ? 'border-violet-500 bg-violet-50 shadow-md shadow-violet-100'
                                                            : 'border-gray-100 bg-gray-50 hover:border-violet-200'
                                                    }`}>
                                                    <div className={`text-xl font-black mb-0.5 ${form.frame === f.val ? 'text-violet-700' : 'text-gray-300'}`}>
                                                        {f.label}
                                                    </div>
                                                    <div className={`text-[11px] ${form.frame === f.val ? 'text-violet-500' : 'text-gray-400'}`}>{f.desc}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </Field>

                                    <Field label="Warna Backdrop" required error={errors.warna_backdrop?.[0]}>
                                        <div className="grid grid-cols-4 gap-2">
                                            {BACKDROPS.map(b => (
                                                <button key={b.label} type="button" onClick={() => set('warna_backdrop', b.label)}
                                                    className={`relative flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl border-2 transition-all duration-200 ${
                                                        form.warna_backdrop === b.label
                                                            ? 'border-violet-500 bg-violet-50 shadow-md shadow-violet-100'
                                                            : 'border-gray-100 bg-gray-50 hover:border-violet-200'
                                                    }`}>
                                                    {b.color ? (
                                                        <div className="w-7 h-7 rounded-full border border-black/10 shadow-sm flex-shrink-0"
                                                            style={{ backgroundColor: b.color }} />
                                                    ) : (
                                                        <div className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                                                            {b.label === 'Tidak Pakai' ? '✕' : '?'}
                                                        </div>
                                                    )}
                                                    <span className={`text-[10px] font-medium text-center leading-tight ${form.warna_backdrop === b.label ? 'text-violet-700' : 'text-gray-500'}`}>
                                                        {b.label}
                                                    </span>
                                                    {form.warna_backdrop === b.label && (
                                                        <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-violet-500 flex items-center justify-center">
                                                            <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </Field>

                                    <Field label="Catatan Tambahan" error={errors.catatan?.[0]}>
                                        <textarea value={form.catatan} onChange={e => set('catatan', e.target.value)}
                                            rows={3} placeholder="cth: Extra 2 jam, request khusus, dll"
                                            className={`w-full border-2 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-violet-400 transition resize-none bg-gray-50 ${
                                                errors.catatan ? 'border-red-300' : 'border-gray-100'
                                            }`} />
                                    </Field>
                                </div>
                            )}

                            {/* ── STEP 3: Syarat & Ketentuan ── */}
                            {step === 3 && (
                                <div className="space-y-5">
                                    <SectionLabel icon="📋" text="Syarat & Ketentuan" />

                                    <SyaratBlock
                                        title="Syarat Venue Photobooth"
                                        items={SYARAT_VENUE}
                                        checked={form.syarat_venue}
                                        onChange={v => set('syarat_venue', v)}
                                        checkLabel="Saya menyetujui syarat dan ketentuan venue di atas"
                                        icon="🏠"
                                    />

                                    <SyaratBlock
                                        title="Syarat Pembayaran"
                                        items={SYARAT_BAYAR}
                                        checked={form.syarat_pembayaran}
                                        onChange={v => set('syarat_pembayaran', v)}
                                        checkLabel="Saya menyetujui syarat dan ketentuan pembayaran di atas"
                                        icon="💳"
                                    />

                                    {/* Final consent */}
                                    <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-2xl border-2 transition-all ${
                                        form.setuju ? 'border-violet-400 bg-violet-50' : 'border-gray-200 bg-gray-50'
                                    }`}>
                                        <div className={`w-5 h-5 mt-0.5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                                            form.setuju ? 'bg-violet-600 border-violet-600' : 'border-gray-300 bg-white'
                                        }`}>
                                            {form.setuju && (
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <input type="checkbox" checked={form.setuju}
                                            onChange={e => set('setuju', e.target.checked)} className="sr-only" />
                                        <span className={`text-sm leading-relaxed ${form.setuju ? 'text-violet-800 font-medium' : 'text-gray-600'}`}>
                                            Saya menyetujui seluruh <span className="font-bold">Syarat dan Ketentuan</span> serta Kebijakan yang berlaku
                                        </span>
                                    </label>

                                    {errors.syarat && (
                                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-2xl">
                                            <span>⚠️</span> {errors.syarat}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Navigation buttons */}
                        <div className="px-6 pb-6 flex gap-3">
                            {step > 0 && (
                                <button type="button" onClick={prevStep}
                                    className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all">
                                    ← Kembali
                                </button>
                            )}
                            {step < STEPS.length - 1 ? (
                                <button type="button" onClick={nextStep}
                                    className="flex-1 py-3.5 rounded-2xl text-sm font-semibold text-white shadow-lg transition-all active:scale-[0.98]"
                                    style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 8px 24px rgba(124,58,237,0.35)' }}>
                                    Lanjut →
                                </button>
                            ) : (
                                <button type="submit" disabled={loading}
                                    className="flex-1 py-3.5 rounded-2xl text-sm font-semibold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-60"
                                    style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 8px 24px rgba(124,58,237,0.35)' }}>
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                            </svg>
                                            Mengirim...
                                        </span>
                                    ) : 'Kirim Form Booking 🎉'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <p className="text-center text-xs text-white/30 mt-4 pb-2">
                    Tim kami akan menghubungi kamu via WhatsApp dalam 1×24 jam
                </p>
            </div>
        </div>
    );
}

function SyaratBlock({ title, items, checked, onChange, checkLabel, icon }) {
    return (
        <div className={`rounded-2xl border-2 overflow-hidden transition-all ${checked ? 'border-violet-300' : 'border-gray-100'}`}>
            <div className={`px-4 py-2.5 flex items-center gap-2 ${checked ? 'bg-violet-50' : 'bg-gray-50'}`}>
                <span>{icon}</span>
                <span className={`text-sm font-semibold ${checked ? 'text-violet-800' : 'text-gray-700'}`}>{title}</span>
            </div>
            <div className="px-4 py-3 space-y-2 bg-white">
                {items.map((s, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 flex-shrink-0" />
                        <p className="text-sm text-gray-600 leading-relaxed">{s}</p>
                    </div>
                ))}
            </div>
            <label className={`flex items-center gap-3 cursor-pointer px-4 py-3 border-t border-gray-100 transition-all ${checked ? 'bg-violet-50' : 'bg-gray-50/50'}`}>
                <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    checked ? 'bg-violet-600 border-violet-600' : 'border-gray-300 bg-white'
                }`}>
                    {checked && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>
                <input type="checkbox" checked={checked}
                    onChange={e => onChange(e.target.checked)} className="sr-only" />
                <span className={`text-sm ${checked ? 'text-violet-700 font-medium' : 'text-gray-600'}`}>{checkLabel}</span>
            </label>
        </div>
    );
}

function SuccessPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4"
            style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
            <div className="max-w-sm w-full">
                <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                        style={{ background: 'linear-gradient(135deg, #7c3aed22, #4f46e522)' }}>
                        <div className="w-14 h-14 rounded-full flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                    <div className="text-3xl mb-3">🎉</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Terkirim!</h2>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6">
                        Makasih ya sudah booking! Form kamu sudah kami terima dan tim kami akan menghubungi via WhatsApp dalam{' '}
                        <span className="font-semibold text-gray-800">1×24 jam</span> untuk konfirmasi & info DP.
                    </p>
                    <div className="rounded-2xl px-5 py-4 text-sm"
                        style={{ background: 'linear-gradient(135deg, #7c3aed15, #4f46e515)', border: '1px solid #7c3aed30' }}>
                        <p className="font-bold text-violet-700">📸 Waktunya Photobooth</p>
                        <p className="text-violet-500 text-xs mt-0.5">Photobooth terbaik untuk momen spesialmu</p>
                    </div>
                </div>
                <p className="text-center text-white/30 text-xs mt-4">Kamu bisa menutup halaman ini</p>
            </div>
        </div>
    );
}

function SectionLabel({ icon, text }) {
    return (
        <div className="flex items-center gap-2 pb-1">
            <span className="text-lg">{icon}</span>
            <h2 className="text-base font-bold text-gray-900">{text}</h2>
        </div>
    );
}

function Field({ label, required, error, children }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            {children}
            {error && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><span>⚠</span>{error}</p>}
        </div>
    );
}

function FloatInput({ error, ...props }) {
    return (
        <input
            {...props}
            className={`w-full border-2 rounded-2xl px-4 py-3 text-sm focus:outline-none transition-all bg-gray-50 focus:bg-white ${
                error ? 'border-red-300 focus:border-red-400' : 'border-gray-100 focus:border-violet-400'
            }`}
        />
    );
}

// ─── Custom Date Picker ────────────────────────────────────────────────────────
const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const DAYS_ID   = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

function DatePickerField({ value, onChange, error }) {
    const [open, setOpen]         = useState(false);
    const [viewYear,  setViewYear]  = useState(() => value ? parseInt(value.substring(0,4)) : new Date().getFullYear());
    const [viewMonth, setViewMonth] = useState(() => value ? parseInt(value.substring(5,7)) - 1 : new Date().getMonth());
    const [pos, setPos]           = useState({ top: 0, left: 0, width: 280 });
    const triggerRef = useRef();
    const popupRef   = useRef();

    const today    = new Date(); today.setHours(0,0,0,0);
    const selected = value ? (() => { const d = new Date(value + 'T00:00:00'); d.setHours(0,0,0,0); return d; })() : null;

    const openPicker = () => {
        if (triggerRef.current) {
            const r = triggerRef.current.getBoundingClientRect();
            setPos({ top: r.bottom + window.scrollY + 8, left: r.left + window.scrollX, width: Math.max(r.width, 288) });
        }
        if (value) { setViewYear(parseInt(value.substring(0,4))); setViewMonth(parseInt(value.substring(5,7)) - 1); }
        setOpen(o => !o);
    };

    useEffect(() => {
        if (!open) return;
        const onDown   = e => { if (!popupRef.current?.contains(e.target) && !triggerRef.current?.contains(e.target)) setOpen(false); };
        const onScroll = () => setOpen(false);
        document.addEventListener('mousedown', onDown);
        window.addEventListener('scroll', onScroll, true);
        return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('scroll', onScroll, true); };
    }, [open]);

    const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y-1)) : setViewMonth(m => m-1);
    const nextMonth = () => viewMonth === 11 ? (setViewMonth(0),  setViewYear(y => y+1)) : setViewMonth(m => m+1);

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDay    = new Date(viewYear, viewMonth, 1).getDay();

    const selectDay = (day) => {
        const d = new Date(viewYear, viewMonth, day); d.setHours(0,0,0,0);
        if (d < today) return;
        onChange(`${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`);
        setOpen(false);
    };

    const displayValue = selected
        ? selected.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;

    return (
        <>
            <button ref={triggerRef} type="button" onClick={openPicker}
                className={`w-full flex items-center justify-between border-2 rounded-2xl px-4 py-3 text-sm transition-all
                    ${error ? 'border-red-300 bg-red-50/30'
                            : open ? 'border-violet-400 bg-white shadow-sm shadow-violet-100'
                                   : 'border-gray-100 bg-gray-50 hover:border-violet-200'}`}>
                <span className={displayValue ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                    {displayValue || 'Pilih tanggal'}
                </span>
                <svg className={`w-4 h-4 flex-shrink-0 transition-colors ${open ? 'text-violet-500' : 'text-gray-300'}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
            </button>

            {open && createPortal(
                <div ref={popupRef}
                    style={{ position: 'absolute', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
                    className="bg-white rounded-3xl shadow-2xl border border-gray-100/80 p-4">

                    {/* Month navigation */}
                    <div className="flex items-center justify-between mb-4">
                        <button type="button" onClick={prevMonth}
                            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 transition">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                            </svg>
                        </button>
                        <span className="text-sm font-bold text-gray-800">{MONTHS_ID[viewMonth]} {viewYear}</span>
                        <button type="button" onClick={nextMonth}
                            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 transition">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                            </svg>
                        </button>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 mb-1">
                        {DAYS_ID.map(d => (
                            <div key={d} className="text-center text-[11px] font-bold text-gray-400 py-1">{d}</div>
                        ))}
                    </div>

                    {/* Day cells */}
                    <div className="grid grid-cols-7 gap-0.5">
                        {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
                        {Array.from({ length: daysInMonth }, (_, i) => {
                            const day  = i + 1;
                            const date = new Date(viewYear, viewMonth, day); date.setHours(0,0,0,0);
                            const isPast  = date < today;
                            const isToday = date.getTime() === today.getTime();
                            const isSel   = selected && date.getTime() === selected.getTime();
                            return (
                                <button key={day} type="button" disabled={isPast}
                                    onClick={() => selectDay(day)}
                                    className={`h-9 rounded-xl text-sm font-medium transition-all
                                        ${isSel   ? 'text-white shadow-lg shadow-violet-200'
                                                  : isToday  ? 'ring-2 ring-violet-400 text-violet-700 font-bold'
                                                  : isPast   ? 'text-gray-200 cursor-not-allowed'
                                                             : 'text-gray-700 hover:bg-violet-50 hover:text-violet-700'}`}
                                    style={isSel ? { background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' } : {}}>
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <button type="button" onClick={() => { onChange(''); setOpen(false); }}
                            className="text-xs text-gray-400 hover:text-gray-600 transition font-medium px-2 py-1 rounded-lg hover:bg-gray-100">
                            Hapus
                        </button>
                        <button type="button" onClick={() => {
                            const d = new Date();
                            if (d >= today) {
                                onChange(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
                                setOpen(false);
                            }
                        }} className="text-xs text-violet-600 font-bold hover:text-violet-800 transition px-2 py-1 rounded-lg hover:bg-violet-50">
                            Hari ini
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

// ─── Custom Time Picker ────────────────────────────────────────────────────────
const JAM_OPTS   = Array.from({ length: 15 }, (_, i) => i + 8); // 08–22
const MENIT_OPTS = [0, 15, 30, 45];

function TimePickerField({ value, onChange, error }) {
    const [open, setOpen] = useState(false);
    const [selH, setSelH] = useState(() => value ? parseInt(value.split(':')[0]) : null);
    const [selM, setSelM] = useState(() => value ? parseInt(value.split(':')[1]) : null);
    const [pos,  setPos]  = useState({ top: 0, left: 0 });
    const triggerRef  = useRef();
    const popupRef    = useRef();
    const hourListRef = useRef();

    useEffect(() => {
        if (value) {
            setSelH(parseInt(value.split(':')[0]));
            setSelM(parseInt(value.split(':')[1]));
        }
    }, [value]);

    const openPicker = () => {
        if (triggerRef.current) {
            const r = triggerRef.current.getBoundingClientRect();
            setPos({ top: r.bottom + window.scrollY + 8, left: r.left + window.scrollX });
        }
        setOpen(o => !o);
        setTimeout(() => {
            if (hourListRef.current && selH !== null) {
                hourListRef.current.scrollTop = JAM_OPTS.indexOf(selH) * 44;
            }
        }, 60);
    };

    useEffect(() => {
        if (!open) return;
        const onDown   = e => { if (!popupRef.current?.contains(e.target) && !triggerRef.current?.contains(e.target)) setOpen(false); };
        const onScroll = e => { if (!popupRef.current?.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', onDown);
        window.addEventListener('scroll', onScroll, true);
        return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('scroll', onScroll, true); };
    }, [open]);

    const confirm = (h, m) => {
        onChange(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
        setOpen(false);
    };

    const displayValue = value || null;

    return (
        <>
            <button ref={triggerRef} type="button" onClick={openPicker}
                className={`w-full flex items-center justify-between border-2 rounded-2xl px-4 py-3 text-sm transition-all
                    ${error ? 'border-red-300 bg-red-50/30'
                            : open ? 'border-violet-400 bg-white shadow-sm shadow-violet-100'
                                   : 'border-gray-100 bg-gray-50 hover:border-violet-200'}`}>
                <span className={displayValue ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                    {displayValue || 'Pilih jam'}
                </span>
                <svg className={`w-4 h-4 flex-shrink-0 transition-colors ${open ? 'text-violet-500' : 'text-gray-300'}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            </button>

            {open && createPortal(
                <div ref={popupRef}
                    style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 9999 }}
                    className="bg-white rounded-3xl shadow-2xl border border-gray-100/80 p-4 w-60">

                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 text-center">
                        Jam Mulai Acara
                    </p>

                    <div className="flex gap-3">
                        {/* Hour column */}
                        <div className="flex-1 flex flex-col">
                            <p className="text-[10px] font-bold text-gray-400 uppercase text-center mb-2">Jam</p>
                            <div ref={hourListRef}
                                className="h-44 overflow-y-auto space-y-0.5 pr-0.5"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {JAM_OPTS.map(h => (
                                    <button key={h} type="button"
                                        onClick={() => { setSelH(h); if (selM !== null) confirm(h, selM); }}
                                        className={`w-full h-10 rounded-xl text-sm font-bold transition-all
                                            ${selH === h ? 'text-white shadow-md shadow-violet-200'
                                                         : 'text-gray-600 hover:bg-violet-50 hover:text-violet-700'}`}
                                        style={selH === h ? { background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' } : {}}>
                                        {String(h).padStart(2,'0')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="flex flex-col items-center justify-center gap-1 py-8">
                            <div className="w-1 h-1 rounded-full bg-gray-300" />
                            <div className="w-1 h-1 rounded-full bg-gray-300" />
                        </div>

                        {/* Minute column */}
                        <div className="flex-1 flex flex-col">
                            <p className="text-[10px] font-bold text-gray-400 uppercase text-center mb-2">Menit</p>
                            <div className="space-y-1.5">
                                {MENIT_OPTS.map(m => (
                                    <button key={m} type="button"
                                        onClick={() => { setSelM(m); if (selH !== null) confirm(selH, m); }}
                                        className={`w-full h-10 rounded-xl text-sm font-bold transition-all
                                            ${selM === m ? 'text-white shadow-md shadow-violet-200'
                                                         : 'text-gray-600 hover:bg-violet-50 hover:text-violet-700'}`}
                                        style={selM === m ? { background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' } : {}}>
                                        :{String(m).padStart(2,'0')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Confirm pill */}
                    {selH !== null && selM !== null && (
                        <button type="button" onClick={() => confirm(selH, selM)}
                            className="mt-4 w-full h-10 rounded-2xl text-sm font-bold text-white transition-all"
                            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}>
                            ✓ &nbsp;{String(selH).padStart(2,'0')}:{String(selM).padStart(2,'0')} dipilih
                        </button>
                    )}
                </div>,
                document.body
            )}
        </>
    );
}
