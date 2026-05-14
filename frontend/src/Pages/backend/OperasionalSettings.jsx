import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import BackendLayout from '@/layouts/BackendLayout';
import api from '@/api/axios';

const SECTIONS = [
    { key: 'booths',     label: 'Type Booth',    icon: '🎪', placeholder: 'cth: Booth 1, Open Booth...', color: 'violet' },
    { key: 'printers',   label: 'Printer',        icon: '🖨️', placeholder: 'cth: DNP, Fuji, Canon...',   color: 'sky'    },
    { key: 'transports', label: 'Transport / Driver', icon: '🚗', placeholder: 'cth: Pasha, Budi...', color: 'amber'  },
];

const COLOR = {
    violet: { chip: 'bg-violet-100 text-violet-700',   input: 'focus:border-violet-400', btn: 'bg-violet-600 hover:bg-violet-700', dot: 'bg-violet-400' },
    sky:    { chip: 'bg-sky-100 text-sky-700',         input: 'focus:border-sky-400',    btn: 'bg-sky-600 hover:bg-sky-700',       dot: 'bg-sky-400'    },
    amber:  { chip: 'bg-amber-100 text-amber-700',     input: 'focus:border-amber-400',  btn: 'bg-amber-500 hover:bg-amber-600',   dot: 'bg-amber-400'  },
};

export default function OperasionalSettings() {
    const [assets, setAssets] = useState({ booths: [], printers: [], transports: [], staff: [] });
    const [loading, setLoading] = useState(true);
    const [saved,   setSaved]   = useState(null); // key that was just saved
    const [inputs,  setInputs]  = useState({ booths: '', printers: '', transports: '' });

    useEffect(() => {
        api.get('/op-assets').then(r => setAssets(r.data)).finally(() => setLoading(false));
    }, []);

    const save = async (key, nextList) => {
        try {
            const { data } = await api.post('/op-assets', { [key]: nextList });
            setAssets(a => ({ ...a, [key]: data[key] }));
            setSaved(key);
            setTimeout(() => setSaved(null), 1800);
        } catch { /* silent */ }
    };

    const addItem = (key) => {
        const val = inputs[key].trim();
        if (!val || assets[key].includes(val)) { setInputs(i => ({ ...i, [key]: '' })); return; }
        const next = [...assets[key], val];
        setInputs(i => ({ ...i, [key]: '' }));
        save(key, next);
    };

    const removeItem = (key, item) => {
        save(key, assets[key].filter(x => x !== item));
    };

    if (loading) return (
        <BackendLayout>
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        </BackendLayout>
    );

    return (
        <BackendLayout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Pengaturan Operasional</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Kelola daftar booth, printer, dan driver yang muncul sebagai pilihan di halaman Form Booking.
                    </p>
                </div>

                {/* 3 editable asset sections */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {SECTIONS.map(({ key, label, icon, placeholder, color }) => {
                        const c = COLOR[color];
                        return (
                            <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">

                                {/* Section header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{icon}</span>
                                        <h2 className="font-bold text-gray-800 text-sm">{label}</h2>
                                    </div>
                                    {saved === key && (
                                        <span className="text-[11px] font-semibold text-green-600 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                                            </svg>
                                            Tersimpan
                                        </span>
                                    )}
                                </div>

                                {/* Chip list */}
                                <div className="flex-1 min-h-[80px]">
                                    {assets[key].length === 0 ? (
                                        <p className="text-xs text-gray-400 italic">Belum ada item. Tambahkan di bawah.</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {assets[key].map(item => (
                                                <span key={item}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.chip}`}>
                                                    {item}
                                                    <button onClick={() => removeItem(key, item)}
                                                        className="opacity-60 hover:opacity-100 transition leading-none font-bold text-sm hover:text-red-500">×</button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Add input */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={inputs[key]}
                                        onChange={e => setInputs(i => ({ ...i, [key]: e.target.value }))}
                                        onKeyDown={e => e.key === 'Enter' && addItem(key)}
                                        placeholder={placeholder}
                                        className={`flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none ${c.input} transition`}
                                    />
                                    <button onClick={() => addItem(key)}
                                        disabled={!inputs[key].trim()}
                                        className={`text-xs text-white px-3 py-2 rounded-xl font-bold transition disabled:opacity-40 ${c.btn}`}>
                                        + Tambah
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Staff Operasional section */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">👥</span>
                            <div>
                                <h2 className="font-bold text-gray-800 text-sm">Staff Operasional</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Diambil dari akun dengan role <span className="font-semibold text-emerald-600">Staff Operasional</span></p>
                            </div>
                        </div>
                        <Link to="/users"
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-indigo-50">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                            </svg>
                            Tambah Staff
                        </Link>
                    </div>

                    {assets.staff.length === 0 ? (
                        <div className="py-8 text-center">
                            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">👤</div>
                            <p className="text-sm font-medium text-gray-600">Belum ada staff operasional</p>
                            <p className="text-xs text-gray-400 mt-1">Buat akun baru di halaman Users dengan role <strong>Staff Operasional</strong></p>
                            <Link to="/users"
                                className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition">
                                Buka Halaman Users →
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {assets.staff.map(s => (
                                <div key={s.id} className="flex items-center gap-3 bg-emerald-50 rounded-xl px-4 py-3">
                                    <div className="w-9 h-9 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-800 text-sm font-bold flex-shrink-0">
                                        {s.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{s.name}</p>
                                        <p className="text-[11px] text-gray-500 truncate">{s.email}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info box */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 text-sm text-blue-800 flex gap-3">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <div>
                        <p className="font-semibold">Cara pakai</p>
                        <ul className="mt-1 space-y-0.5 text-blue-700 text-xs list-disc list-inside">
                            <li>Daftar di atas otomatis muncul sebagai pilihan di kolom operasional Form Booking.</li>
                            <li>Tekan <strong>Enter</strong> atau klik <strong>Tambah</strong> untuk menambah item.</li>
                            <li>Klik <strong>×</strong> pada chip untuk menghapus item. Perubahan langsung tersimpan.</li>
                            <li>Staff Operasional dikelola dari halaman <Link to="/users" className="underline font-semibold">Users</Link> dengan role yang sesuai.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </BackendLayout>
    );
}
