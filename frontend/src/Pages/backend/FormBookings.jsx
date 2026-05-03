import { useEffect, useState } from 'react';
import BackendLayout from '@/layouts/BackendLayout';
import api from '@/api/axios';

const STATUS_OPTS = [
    { val: 'pending',   label: 'Pending',    color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { val: 'confirmed', label: 'Confirmed',  color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { val: 'dp_paid',   label: 'DP Paid',    color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    { val: 'completed', label: 'Selesai',    color: 'bg-green-100 text-green-700 border-green-200' },
    { val: 'cancelled', label: 'Dibatalkan', color: 'bg-red-100 text-red-700 border-red-200' },
];

const BACKDROP_COLORS = {
    Black:            '#1a1a1a',
    Silver:           '#C0C0C0',
    Gold:             '#D4AF37',
    Maroon:           '#800000',
    'Putih Polos':    '#F5F5F5',
};

function statusBadge(val) {
    const s = STATUS_OPTS.find(o => o.val === val);
    return s ? s : { label: val, color: 'bg-gray-100 text-gray-600 border-gray-200' };
}

export default function FormBookings() {
    const [data,     setData]     = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [search,   setSearch]   = useState('');
    const [filter,   setFilter]   = useState('');
    const [detail,   setDetail]   = useState(null);
    const [updating, setUpdating] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            if (filter) params.status = filter;
            const r = await api.get('/bookings/form-submissions', { params });
            setData(r.data);
        } catch {
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [search, filter]);

    const changeStatus = async (id, status) => {
        setUpdating(id);
        try {
            await api.patch(`/bookings/${id}/form-status`, { status });
            setData(d => d.map(b => b.id === id ? { ...b, status } : b));
            if (detail?.id === id) setDetail(d => ({ ...d, status }));
        } finally {
            setUpdating(null);
        }
    };

    const counts = STATUS_OPTS.reduce((acc, s) => {
        acc[s.val] = data.filter(b => b.status === s.val).length;
        return acc;
    }, {});

    return (
        <BackendLayout>
            <div className="p-6 max-w-6xl mx-auto space-y-5">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Form Booking</h1>
                        <p className="text-sm text-gray-500 mt-0.5">{data.length} submisi masuk dari booking form</p>
                    </div>
                    <a href="http://localhost:5173/booking" target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Lihat Form
                    </a>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {STATUS_OPTS.map(s => (
                        <button key={s.val} onClick={() => setFilter(filter === s.val ? '' : s.val)}
                            className={`rounded-2xl p-3 border text-left transition-all ${
                                filter === s.val ? s.color + ' ring-2 ring-offset-1 ring-current' : 'bg-white border-gray-100 hover:border-gray-200'
                            }`}>
                            <p className="text-2xl font-bold text-gray-900">{counts[s.val] ?? 0}</p>
                            <p className={`text-xs font-medium mt-0.5 ${filter === s.val ? '' : 'text-gray-500'}`}>{s.label}</p>
                        </button>
                    ))}
                </div>

                {/* Search + filter */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Cari nama, WA, atau acara..."
                            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400 bg-white" />
                    </div>
                    {filter && (
                        <button onClick={() => setFilter('')}
                            className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 transition whitespace-nowrap">
                            Hapus filter ✕
                        </button>
                    )}
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
                            <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            <span className="text-sm">Memuat data...</span>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="text-4xl mb-3">📋</div>
                            <p className="text-gray-500 font-medium">Belum ada submisi</p>
                            <p className="text-gray-400 text-sm mt-1">Submisi dari form booking akan muncul di sini</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama & Kontak</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acara</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Detail</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Masuk</th>
                                        <th className="px-4 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {data.map(b => {
                                        const st = statusBadge(b.status);
                                        return (
                                            <tr key={b.id} className="hover:bg-gray-50/50 transition">
                                                <td className="px-4 py-3">
                                                    <p className="font-semibold text-gray-900">{b.customer.nama}</p>
                                                    <p className="text-gray-400 text-xs mt-0.5">{b.no_whatsapp}</p>
                                                    {b.email && <p className="text-gray-400 text-xs truncate max-w-[160px]">{b.email}</p>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-gray-800">{b.nama_acara}</p>
                                                    <p className="text-gray-400 text-xs mt-0.5">
                                                        {new Date(b.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        {b.jam_mulai && ` · ${b.jam_mulai}`}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                                                            Frame {b.frame?.toUpperCase()}
                                                        </span>
                                                        {b.warna_backdrop && (
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                                                                {BACKDROP_COLORS[b.warna_backdrop] && (
                                                                    <span className="w-2.5 h-2.5 rounded-full border border-black/10 flex-shrink-0"
                                                                        style={{ backgroundColor: BACKDROP_COLORS[b.warna_backdrop] }} />
                                                                )}
                                                                {b.warna_backdrop}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {b.package && (
                                                        <p className="text-violet-600 text-xs mt-1 font-medium">{b.package.nama}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        value={b.status}
                                                        disabled={updating === b.id}
                                                        onChange={e => changeStatus(b.id, e.target.value)}
                                                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-300 transition ${st.color} ${updating === b.id ? 'opacity-50' : ''}`}>
                                                        {STATUS_OPTS.map(s => (
                                                            <option key={s.val} value={s.val}>{s.label}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                                                    {b.created_at}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button onClick={() => setDetail(b)}
                                                        className="text-xs text-violet-600 font-semibold hover:text-violet-800 transition px-2 py-1 rounded-lg hover:bg-violet-50">
                                                        Detail
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail drawer */}
            {detail && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setDetail(null)} />
                    <div className="relative w-full max-w-sm bg-white h-full shadow-2xl overflow-y-auto flex flex-col">
                        {/* Drawer header */}
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
                            <div>
                                <h2 className="font-bold text-gray-900">Detail Booking</h2>
                                <p className="text-xs text-gray-400">#{detail.id} · {detail.created_at}</p>
                            </div>
                            <button onClick={() => setDetail(null)}
                                className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 transition">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-5 space-y-5 flex-1">
                            {/* Status */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Status</p>
                                <div className="flex flex-wrap gap-2">
                                    {STATUS_OPTS.map(s => (
                                        <button key={s.val}
                                            disabled={updating === detail.id}
                                            onClick={() => changeStatus(detail.id, s.val)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                                                detail.status === s.val
                                                    ? s.color + ' ring-2 ring-offset-1 ring-current'
                                                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                                            } ${updating === detail.id ? 'opacity-50' : ''}`}>
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <DrawerSection title="Data Diri">
                                <DrawerRow label="Nama"       value={detail.customer.nama} />
                                <DrawerRow label="WhatsApp"   value={detail.no_whatsapp}
                                    extra={
                                        <a href={`https://wa.me/${detail.no_whatsapp?.replace(/\D/g,'')}`}
                                            target="_blank" rel="noreferrer"
                                            className="text-xs text-green-600 font-semibold hover:underline">
                                            Hubungi ↗
                                        </a>
                                    } />
                                {detail.email && <DrawerRow label="Email" value={detail.email} />}
                            </DrawerSection>

                            <DrawerSection title="Detail Acara">
                                <DrawerRow label="Jenis Acara" value={detail.nama_acara} />
                                <DrawerRow label="Tanggal" value={
                                    new Date(detail.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                                } />
                                {detail.jam_mulai && <DrawerRow label="Jam Mulai" value={detail.jam_mulai} />}
                                {detail.lokasi && <DrawerRow label="Lokasi" value={detail.lokasi} />}
                            </DrawerSection>

                            <DrawerSection title="Paket & Dekorasi">
                                <DrawerRow label="Paket"    value={detail.package?.nama ?? 'Belum dipilih'} />
                                <DrawerRow label="Frame"    value={detail.frame?.toUpperCase()} />
                                <DrawerRow label="Backdrop" value={
                                    <span className="flex items-center gap-2">
                                        {BACKDROP_COLORS[detail.warna_backdrop] && (
                                            <span className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0 inline-block"
                                                style={{ backgroundColor: BACKDROP_COLORS[detail.warna_backdrop] }} />
                                        )}
                                        {detail.warna_backdrop}
                                    </span>
                                } />
                            </DrawerSection>

                            <DrawerSection title="Persetujuan">
                                <DrawerRow label="Syarat Venue"      value={detail.syarat_venue ? '✅ Disetujui' : '❌ Belum'} />
                                <DrawerRow label="Syarat Pembayaran" value={detail.syarat_pembayaran ? '✅ Disetujui' : '❌ Belum'} />
                            </DrawerSection>
                        </div>

                        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
                            <a href={`https://wa.me/${detail.no_whatsapp?.replace(/\D/g,'')}`}
                                target="_blank" rel="noreferrer"
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.524 5.847L.057 23.882l6.178-1.625A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.651-.5-5.178-1.372l-.372-.22-3.668.964.981-3.582-.242-.381A9.97 9.97 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                                </svg>
                                Hubungi via WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </BackendLayout>
    );
}

function DrawerSection({ title, children }) {
    return (
        <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</p>
            <div className="bg-gray-50 rounded-2xl overflow-hidden divide-y divide-gray-100">
                {children}
            </div>
        </div>
    );
}

function DrawerRow({ label, value, extra }) {
    return (
        <div className="flex items-start justify-between gap-3 px-4 py-2.5">
            <span className="text-xs text-gray-500 flex-shrink-0 pt-0.5 w-28">{label}</span>
            <div className="flex items-center gap-2 flex-1 justify-end">
                <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
                {extra}
            </div>
        </div>
    );
}
