import { useEffect, useState } from 'react';
import BackendLayout from '@/layouts/BackendLayout';
import api from '@/api/axios';
import { useToast } from '@/context/ToastContext';
import ConfirmModal from '@/components/ConfirmModal';
import EmptyState from '@/components/EmptyState';

const RATING_LABELS = {
    print: 'Print Foto',
    foto:  'Kualitas Foto',
    staff: 'Staff',
    frame: 'Design Frame',
    admin: 'Admin',
};

function Stars({ value, size = 'sm' }) {
    const sz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
    return (
        <span className="flex gap-0.5 items-center">
            {[1, 2, 3, 4, 5].map(n => (
                <svg key={n} className={`${sz} ${n <= value ? 'text-amber-400' : 'text-gray-200'}`}
                    fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
            ))}
            <span className="ml-1 text-xs text-gray-500 font-medium">{value}/5</span>
        </span>
    );
}

function AvgBar({ label, value }) {
    const pct = value ? (value / 5) * 100 : 0;
    const color = value >= 4 ? 'bg-green-500' : value >= 3 ? 'bg-amber-400' : 'bg-red-400';
    return (
        <div className="flex items-center gap-2 text-xs">
            <span className="w-24 text-gray-500 shrink-0">{label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
            </div>
            <span className="w-8 text-right font-semibold text-gray-700">{value ?? '—'}</span>
        </div>
    );
}

const CHIP_COLOR = {
    iya:        'bg-green-100 text-green-700',
    'ragu-ragu':'bg-amber-100 text-amber-700',
    tidak:      'bg-red-100 text-red-700',
};

export default function Feedbacks() {
    const toast = useToast();
    const [confirmCfg, setConfirmCfg] = useState(null);
    const [data,    setData]    = useState({ feedbacks: [], avg: null });
    const [loading, setLoading] = useState(true);
    const [detail,  setDetail]  = useState(null);
    const [search,  setSearch]  = useState('');
    const [deleting, setDeleting] = useState(null);

    const load = () => {
        setLoading(true);
        api.get('/feedbacks')
            .then(r => setData(r.data))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const filtered = data.feedbacks.filter(f =>
        !search ||
        f.nama.toLowerCase().includes(search.toLowerCase()) ||
        (f.sumber || '').toLowerCase().includes(search.toLowerCase()) ||
        (f.saran  || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = (id) => {
        setConfirmCfg({
            title: 'Hapus Feedback',
            message: 'Feedback ini akan dihapus permanen.',
            confirmText: 'Ya, Hapus',
            onConfirm: async () => {
                setDeleting(id);
                try {
                    await api.delete(`/feedbacks/${id}`);
                    load();
                    if (detail?.id === id) setDetail(null);
                    toast.success('Feedback berhasil dihapus');
                } finally {
                    setDeleting(null);
                }
            },
        });
    };

    const avg = data.avg;

    return (
        <BackendLayout>
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Feedback Customer</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {avg ? `${avg.count} responden · Rata-rata keseluruhan: ★ ${avg.total}` : 'Belum ada data'}
                        </p>
                    </div>
                    <a
                        href="/feedback"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Buka Form
                    </a>
                </div>

                {/* Average ratings cards */}
                {avg && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Overall score */}
                        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-indigo-50 flex flex-col items-center justify-center border-2 border-indigo-200 shrink-0">
                                <span className="text-xl font-bold text-indigo-600">{avg.total}</span>
                                <span className="text-xs text-indigo-400">/ 5</span>
                            </div>
                            <div className="flex-1 space-y-1">
                                {Object.entries(RATING_LABELS).map(([key, label]) => (
                                    <AvgBar key={key} label={label} value={avg[key]} />
                                ))}
                            </div>
                        </div>

                        {/* NPS-style metrics */}
                        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 space-y-4">
                            <h3 className="text-sm font-semibold text-gray-600">Loyalitas Customer</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-green-50 rounded-lg p-4 text-center">
                                    <div className="text-3xl font-bold text-green-600">
                                        {avg.count > 0 ? Math.round((avg.rekomendasikan_iya / avg.count) * 100) : 0}%
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">Akan rekomendasikan</div>
                                </div>
                                <div className="bg-indigo-50 rounded-lg p-4 text-center">
                                    <div className="text-3xl font-bold text-indigo-600">{avg.count}</div>
                                    <div className="text-xs text-gray-500 mt-1">Total responden</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                        <input
                            type="text"
                            placeholder="Cari nama, sumber, saran..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full sm:w-72 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                    </div>

                    {loading ? (
                        <div className="py-16 text-center text-gray-400 text-sm">Memuat...</div>
                    ) : filtered.length === 0 ? (
                        <EmptyState icon="⭐" title="Belum ada feedback" description="Bagikan link feedback ke customer setelah event selesai." />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                                        <th className="text-left px-4 py-3 font-medium">Nama</th>
                                        <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Event</th>
                                        <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Staff Bertugas</th>
                                        <th className="text-left px-4 py-3 font-medium">Rating</th>
                                        <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Rekomendasikan</th>
                                        <th className="text-left px-4 py-3 font-medium hidden xl:table-cell">Tanggal Isi</th>
                                        <th className="text-right px-4 py-3 font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filtered.map(f => {
                                        const avgRating = ((f.rating_print + f.rating_foto + f.rating_staff + f.rating_frame + f.rating_admin) / 5).toFixed(1);
                                        return (
                                            <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <span className="font-medium text-gray-800 block">{f.nama}</span>
                                                    {f.sumber && <span className="text-xs text-gray-400">{f.sumber}</span>}
                                                </td>
                                                <td className="px-4 py-3 hidden md:table-cell">
                                                    {f.event_name ? (
                                                        <div>
                                                            <span className="text-gray-700 block font-medium text-xs">{f.event_name}</span>
                                                            <span className="text-gray-400 text-xs">{f.event_date}</span>
                                                        </div>
                                                    ) : <span className="text-gray-300 text-xs">Tanpa booking</span>}
                                                </td>
                                                <td className="px-4 py-3 hidden lg:table-cell">
                                                    {f.staff_names?.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {f.staff_names.map((s, i) => (
                                                                <span key={i} className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-xs font-medium border border-violet-100">
                                                                    👤 {s}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-300 text-xs">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                        </svg>
                                                        <span className="font-semibold text-gray-700">{avgRating}</span>
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 hidden lg:table-cell">
                                                    {f.rekomendasikan ? (
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CHIP_COLOR[f.rekomendasikan] ?? 'bg-gray-100 text-gray-600'}`}>
                                                            {f.rekomendasikan}
                                                        </span>
                                                    ) : <span className="text-gray-300">—</span>}
                                                </td>
                                                <td className="px-4 py-3 text-gray-400 text-xs hidden xl:table-cell">{f.created_at}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => setDetail(f)}
                                                            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-medium transition-colors">
                                                            Detail
                                                        </button>
                                                        <button onClick={() => handleDelete(f.id)} disabled={deleting === f.id}
                                                            className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 font-medium transition-colors disabled:opacity-50">
                                                            Hapus
                                                        </button>
                                                    </div>
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

            {/* Detail modal */}
            {detail && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">{detail.nama}</h2>
                                <p className="text-xs text-gray-400">{detail.created_at} · {detail.sumber || 'Sumber tidak diisi'}</p>
                            </div>
                            <button onClick={() => setDetail(null)}
                                className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
                        </div>

                        {/* Booking + staff context */}
                        {detail.event_name && (
                            <div className="bg-violet-50 rounded-xl p-3 border border-violet-100">
                                <div className="flex items-start gap-2">
                                    <span className="text-base mt-0.5">🎪</span>
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-violet-600">{detail.event_name}</p>
                                        <p className="text-xs text-gray-400">{detail.event_date}</p>
                                        {detail.staff_names?.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                {detail.staff_names.map((s, i) => (
                                                    <span key={i} className="px-2 py-0.5 rounded-full bg-white text-violet-700 text-xs font-medium border border-violet-200">
                                                        👤 {s}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2.5">
                            {[
                                { key: 'rating_print', label: 'Kecepatan Print Foto' },
                                { key: 'rating_foto',  label: 'Kualitas Foto' },
                                { key: 'rating_staff', label: 'Pelayanan Staff' },
                                { key: 'rating_frame', label: 'Design Frame' },
                                { key: 'rating_admin', label: 'Pelayanan Admin' },
                            ].map(r => (
                                <div key={r.key} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">{r.label}</span>
                                    <Stars value={detail[r.key]} size="md" />
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-400 mb-1">Rekomendasikan?</p>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CHIP_COLOR[detail.rekomendasikan] ?? 'bg-gray-100 text-gray-600'}`}>
                                    {detail.rekomendasikan || '—'}
                                </span>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-400 mb-1">Pakai lagi?</p>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CHIP_COLOR[detail.pakai_lagi] ?? 'bg-gray-100 text-gray-600'}`}>
                                    {detail.pakai_lagi || '—'}
                                </span>
                            </div>
                        </div>

                        {detail.saran && (
                            <div className="bg-indigo-50 rounded-xl p-4">
                                <p className="text-xs text-indigo-400 font-medium mb-1">Saran & Kritik</p>
                                <p className="text-sm text-gray-700 leading-relaxed">{detail.saran}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <ConfirmModal config={confirmCfg} onClose={() => setConfirmCfg(null)} />
        </BackendLayout>
    );
}
