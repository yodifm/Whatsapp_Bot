import { useState, useEffect } from 'react';
import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const api  = axios.create({ baseURL: BASE, headers: { Accept: 'application/json' } });

const KIOSK_CACHE = {};

function formatRp(val) {
    if (!val) return '';
    return 'Rp ' + Number(String(val).replace(/\D/g, '')).toLocaleString('id-ID');
}

const initForm = {
    booking_id: null, kiosk_id: null,
    nama_staff: '', tanggal: new Date().toISOString().split('T')[0],
    nama_customers: [''],
    kebutuhan_lainnya: '', jumlah: '', tujuan: '',
};

export default function ReimbursementForm() {
    const [form,        setForm]        = useState(initForm);
    const [errors,      setErrors]      = useState({});
    const [loading,     setLoading]     = useState(false);
    const [success,     setSuccess]     = useState(false);
    const [bookingInfo, setBookingInfo] = useState(null);
    const [kiosks,      setKiosks]      = useState([]);
    const [buktiFile,   setBuktiFile]   = useState(null);
    const [buktiPreview,setBuktiPreview]= useState(null);
    const [rawJumlah,   setRawJumlah]   = useState('');

    useEffect(() => {
        const params    = new URLSearchParams(window.location.search);
        const bookingId = params.get('booking');
        const kioskId   = params.get('kiosk');

        if (bookingId) {
            api.get(`/booking-info/${bookingId}`).then(r => {
                setBookingInfo(r.data);
                setForm(f => ({
                    ...f,
                    booking_id:     r.data.booking_id,
                    kiosk_id:       kioskId ? Number(kioskId) : f.kiosk_id,
                    nama_customers: r.data.customer_name ? [r.data.customer_name] : [''],
                    tanggal:        r.data.event_date_raw || f.tanggal,
                }));
            }).catch(() => {});
        } else if (kioskId) {
            setForm(f => ({ ...f, kiosk_id: Number(kioskId) }));
        }

        // Fetch kiosks for selector
        api.get('/studio-info').then(() => {}).catch(() => {});
    }, []);

    const set = (key, val) => {
        setForm(f => ({ ...f, [key]: val }));
        if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
    };

    const addCustomer    = () => setForm(f => ({ ...f, nama_customers: [...f.nama_customers, ''] }));
    const removeCustomer = (i) => setForm(f => ({
        ...f,
        nama_customers: f.nama_customers.filter((_, idx) => idx !== i) || [''],
    }));
    const setCustomer = (i, val) => setForm(f => ({
        ...f,
        nama_customers: f.nama_customers.map((c, idx) => idx === i ? val : c),
    }));

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setBuktiFile(file);
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => setBuktiPreview(ev.target.result);
            reader.readAsDataURL(file);
        } else {
            setBuktiPreview(null);
        }
    };

    const validate = () => {
        const e = {};
        if (!form.nama_staff.trim())         e.nama_staff = 'Nama staff wajib diisi';
        if (!form.tanggal)                   e.tanggal    = 'Tanggal wajib diisi';
        if (!rawJumlah || Number(rawJumlah.replace(/\D/g,'')) < 1)
                                             e.jumlah     = 'Jumlah wajib diisi';
        if (!form.tujuan.trim())             e.tujuan     = 'Tujuan wajib diisi';
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setLoading(true);
        try {
            const fd = new FormData();
            if (form.booking_id) fd.append('booking_id', form.booking_id);
            if (form.kiosk_id)   fd.append('kiosk_id',   form.kiosk_id);
            fd.append('nama_staff', form.nama_staff);
            fd.append('tanggal',    form.tanggal);
            fd.append('jumlah',     rawJumlah.replace(/\D/g, ''));
            fd.append('tujuan',     form.tujuan);
            if (form.kebutuhan_lainnya) fd.append('kebutuhan_lainnya', form.kebutuhan_lainnya);

            const filtered = form.nama_customers.filter(c => c.trim());
            filtered.forEach((c, i) => fd.append(`nama_customers[${i}]`, c));

            if (buktiFile) fd.append('bukti', buktiFile);

            await api.post('/reimbursement', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setSuccess(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            const s = err.response?.data?.errors ?? {};
            setErrors(Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v[0]])));
        } finally {
            setLoading(false);
        }
    };

    // ── Success ────────────────────────────────────────────────────────────
    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center p-6">
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/5" />
                </div>
                <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-200">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div className="text-4xl mb-3">💸</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Pengajuan Terkirim!</h2>
                    <p className="text-gray-400 text-sm leading-relaxed mb-5">
                        Reimbursement dari <strong className="text-gray-700">{form.nama_staff}</strong> sudah diterima dan sedang menunggu persetujuan admin.
                    </p>
                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                        <p className="text-xs text-emerald-500 font-semibold uppercase tracking-wider mb-1">Total Diajukan</p>
                        <p className="text-2xl font-bold text-emerald-600">{formatRp(rawJumlah.replace(/\D/g,''))}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-5">Admin akan segera memproses pengajuan kamu 🙏</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">

            {/* ── HERO HEADER ── */}
            <div className="relative bg-gradient-to-b from-emerald-600 via-teal-600 to-cyan-500 px-6 pt-12 pb-10 overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-52 h-52 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/3" />
                <div className="absolute top-8 right-10 w-8 h-8 rounded-full bg-white/10" />

                <div className="relative max-w-md mx-auto text-center text-white">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur border border-white/20 mb-4 shadow-lg">
                        <span className="text-3xl">💸</span>
                    </div>
                    <h1 className="text-2xl font-bold mb-1 tracking-tight drop-shadow">Form Reimbursement</h1>
                    <p className="text-white/60 text-sm mb-5">Ajukan penggantian biaya event kamu</p>

                    {/* Booking info inline */}
                    {bookingInfo && (
                        <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/20 px-5 py-4 text-left">
                            <div className="flex items-start gap-3">
                                <span className="text-xl mt-0.5">🎪</span>
                                <div>
                                    <p className="text-white font-semibold text-sm">{bookingInfo.event_name || 'Event Photobooth'}</p>
                                    <p className="text-white/60 text-xs mt-0.5">{bookingInfo.event_date}</p>
                                    {bookingInfo.package_name && (
                                        <p className="text-white/50 text-xs">Paket: {bookingInfo.package_name}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── FORM BODY ── */}
            <div className="max-w-md mx-auto px-4 py-5 pb-10">
                <form onSubmit={handleSubmit} noValidate encType="multipart/form-data" className="space-y-4">

                    {/* ── SECTION 1: Info Staff ── */}
                    <div className="bg-white rounded-3xl shadow-sm p-5">
                        <div className="flex items-center gap-2.5 mb-5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-base shadow-sm">👤</div>
                            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Info Staff</h2>
                        </div>

                        {/* Nama Staff */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Nama Staff <span className="text-red-500">*</span>
                            </label>
                            <input type="text" value={form.nama_staff}
                                onChange={e => set('nama_staff', e.target.value)}
                                placeholder="Nama kamu"
                                className={`w-full rounded-xl px-4 py-3 text-sm border-2 transition-colors focus:outline-none
                                    ${errors.nama_staff ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50 focus:border-emerald-400 focus:bg-white'}`}
                            />
                            {errors.nama_staff && <p className="text-red-500 text-xs mt-1">{errors.nama_staff}</p>}
                        </div>

                        {/* Tanggal */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Tanggal Event <span className="text-red-500">*</span>
                            </label>
                            <input type="date" value={form.tanggal}
                                onChange={e => set('tanggal', e.target.value)}
                                className={`w-full rounded-xl px-4 py-3 text-sm border-2 transition-colors focus:outline-none
                                    ${errors.tanggal ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50 focus:border-emerald-400 focus:bg-white'}`}
                            />
                            {errors.tanggal && <p className="text-red-500 text-xs mt-1">{errors.tanggal}</p>}
                        </div>

                        {/* Nama Customer(s) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Customer</label>
                            <div className="space-y-2">
                                {form.nama_customers.map((c, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input type="text" value={c}
                                            onChange={e => setCustomer(i, e.target.value)}
                                            placeholder={`Customer ${i + 1}`}
                                            className="flex-1 rounded-xl px-4 py-2.5 text-sm border-2 border-gray-100 bg-gray-50 focus:border-emerald-400 focus:bg-white focus:outline-none transition-colors"
                                        />
                                        {form.nama_customers.length > 1 && (
                                            <button type="button" onClick={() => removeCustomer(i)}
                                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors shrink-0 text-lg font-bold leading-none">
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={addCustomer}
                                    className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium hover:text-emerald-700 transition-colors mt-1">
                                    <span className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-base font-bold leading-none">+</span>
                                    Tambah Customer
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── SECTION 2: Detail Biaya ── */}
                    <div className="bg-white rounded-3xl shadow-sm p-5">
                        <div className="flex items-center gap-2.5 mb-5">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-base shadow-sm">💰</div>
                            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Detail Biaya</h2>
                        </div>

                        {/* Kebutuhan lainnya */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kebutuhan Lainnya</label>
                            <p className="text-xs text-gray-400 mb-1.5">Contoh: keperluan meeting, konsumsi, dll</p>
                            <input type="text" value={form.kebutuhan_lainnya}
                                onChange={e => set('kebutuhan_lainnya', e.target.value)}
                                placeholder="Opsional"
                                className="w-full rounded-xl px-4 py-3 text-sm border-2 border-gray-100 bg-gray-50 focus:border-emerald-400 focus:bg-white focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Jumlah */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Jumlah Reimbursement <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">Rp</span>
                                <input type="text" value={rawJumlah}
                                    onChange={e => {
                                        const raw = e.target.value.replace(/\D/g, '');
                                        setRawJumlah(raw ? Number(raw).toLocaleString('id-ID') : '');
                                        if (errors.jumlah) setErrors(er => ({ ...er, jumlah: undefined }));
                                    }}
                                    placeholder="0"
                                    className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm border-2 transition-colors focus:outline-none
                                        ${errors.jumlah ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50 focus:border-emerald-400 focus:bg-white'}`}
                                />
                            </div>
                            {errors.jumlah && <p className="text-red-500 text-xs mt-1">{errors.jumlah}</p>}
                        </div>

                        {/* Tujuan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tujuan Penggunaan Uang <span className="text-red-500">*</span>
                            </label>
                            <p className="text-xs text-gray-400 mb-1.5">Contoh: membayar tol PP, bensin, makan siang crew</p>
                            <textarea rows={3} value={form.tujuan}
                                onChange={e => set('tujuan', e.target.value)}
                                placeholder="Jelaskan detail penggunaan biaya..."
                                className={`w-full rounded-xl px-4 py-3 text-sm border-2 resize-none transition-colors focus:outline-none
                                    ${errors.tujuan ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50 focus:border-emerald-400 focus:bg-white'}`}
                            />
                            {errors.tujuan && <p className="text-red-500 text-xs mt-1">{errors.tujuan}</p>}
                        </div>
                    </div>

                    {/* ── SECTION 3: Bukti ── */}
                    <div className="bg-white rounded-3xl shadow-sm p-5">
                        <div className="flex items-center gap-2.5 mb-5">
                            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-base shadow-sm">📎</div>
                            <div>
                                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Bukti Transaksi</h2>
                                <span className="text-xs text-gray-400">Opsional</span>
                            </div>
                        </div>

                        <label className="block cursor-pointer">
                            <input type="file" accept="image/*,.pdf" onChange={handleFile} className="hidden" />
                            {buktiPreview ? (
                                <div className="relative">
                                    <img src={buktiPreview} alt="Bukti" className="w-full rounded-2xl object-cover max-h-48 border border-gray-100" />
                                    <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                                        <span className="text-white text-sm font-medium">Ganti Foto</span>
                                    </div>
                                </div>
                            ) : buktiFile ? (
                                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border-2 border-dashed border-blue-200">
                                    <span className="text-2xl">📄</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-blue-700 truncate">{buktiFile.name}</p>
                                        <p className="text-xs text-blue-400">{(buktiFile.size / 1024).toFixed(0)} KB · Klik untuk ganti</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-2 p-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors">
                                    <span className="text-3xl">📸</span>
                                    <p className="text-sm font-medium text-gray-500">Attach Bukti Transaksi</p>
                                    <p className="text-xs text-gray-400">Foto struk, transfer, atau PDF · Opsional</p>
                                </div>
                            )}
                        </label>

                        {buktiFile && (
                            <button type="button" onClick={() => { setBuktiFile(null); setBuktiPreview(null); }}
                                className="mt-2 text-xs text-red-400 hover:text-red-600 transition-colors">
                                × Hapus file
                            </button>
                        )}
                    </div>

                    {/* ── SUBMIT ── */}
                    <button type="submit" disabled={loading}
                        className="w-full py-4 rounded-2xl font-bold text-white text-[15px] shadow-lg shadow-emerald-200
                            bg-gradient-to-r from-emerald-600 to-teal-500
                            hover:from-emerald-700 hover:to-teal-600
                            active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
                    >
                        {loading
                            ? <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Mengirim...
                              </span>
                            : '💸  Ajukan Reimbursement'}
                    </button>

                    <p className="text-center text-xs text-gray-400 pb-2">
                        🔒 Data hanya dilihat oleh tim admin
                    </p>
                </form>
            </div>
        </div>
    );
}
