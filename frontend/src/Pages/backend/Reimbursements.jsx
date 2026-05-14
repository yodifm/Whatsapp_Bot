import { useEffect, useState } from 'react';
import BackendLayout from '@/layouts/BackendLayout';
import api from '@/api/axios';
import { useToast } from '@/context/ToastContext';
import ConfirmModal from '@/components/ConfirmModal';
import EmptyState from '@/components/EmptyState';

const STATUS_CFG = {
    pending:  { label: 'Pending',  color: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-400' },
    approved: { label: 'Approved', color: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-600',      dot: 'bg-red-400'   },
};

function StatusChip({ status }) {
    const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

function StatCard({ icon, label, value, sub, color }) {
    return (
        <div className={`bg-white rounded-2xl shadow-sm p-5 border border-gray-100`}>
            <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-xl shrink-0`}>{icon}</div>
                <div>
                    <p className="text-xs text-gray-400 font-medium">{label}</p>
                    <p className="text-xl font-bold text-gray-800 mt-0.5">{value}</p>
                    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
                </div>
            </div>
        </div>
    );
}

function formatRp(n) {
    return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
}

export default function Reimbursements() {
    const toast = useToast();
    const [confirmCfg, setConfirmCfg] = useState(null);
    const [data,     setData]     = useState({ items: [], stats: null });
    const [loading,  setLoading]  = useState(true);
    const [detail,   setDetail]   = useState(null);
    const [search,   setSearch]   = useState('');
    const [filter,   setFilter]   = useState('all');
    const [saving,   setSaving]   = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [actionForm, setActionForm] = useState({ status: '', catatan_admin: '' });

    const load = () => {
        setLoading(true);
        api.get('/reimbursements').then(r => setData(r.data)).finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    // Sync action form when detail opens
    useEffect(() => {
        if (detail) setActionForm({ status: detail.status, catatan_admin: detail.catatan_admin || '' });
    }, [detail?.id]);

    const filtered = data.items.filter(r => {
        const matchFilter = filter === 'all' || r.status === filter;
        const q = search.toLowerCase();
        const matchSearch = !search ||
            r.nama_staff.toLowerCase().includes(q) ||
            (r.event_name || '').toLowerCase().includes(q) ||
            (r.kiosk_name || '').toLowerCase().includes(q) ||
            r.tujuan.toLowerCase().includes(q);
        return matchFilter && matchSearch;
    });

    const handleApprove = async () => {
        if (!detail) return;
        setSaving(true);
        try {
            const res = await api.put(`/reimbursements/${detail.id}`, actionForm);
            setDetail(d => ({ ...d, ...res.data }));
            load();
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id) => {
        setConfirmCfg({
            title: 'Hapus Reimbursement',
            message: 'Data reimbursement ini akan dihapus permanen.',
            confirmText: 'Ya, Hapus',
            onConfirm: async () => {
                setDeleting(id);
                try {
                    await api.delete(`/reimbursements/${id}`);
                    load();
                    if (detail?.id === id) setDetail(null);
                    toast.success('Reimbursement berhasil dihapus');
                } finally {
                    setDeleting(null);
                }
            },
        });
    };

    const { stats } = data;

    return (
        <BackendLayout>
            <div className="p-6 space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Reimbursement</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Pengajuan biaya operasional staff</p>
                    </div>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <StatCard icon="📋" label="Total Pengajuan" value={stats.total}         color="bg-blue-50" />
                        <StatCard icon="⏳" label="Menunggu"        value={stats.pending_count}  color="bg-amber-50"
                            sub={formatRp(stats.pending_amount)} />
                        <StatCard icon="✅" label="Disetujui"        value={formatRp(stats.approved_amount)} color="bg-green-50" />
                        <StatCard icon="💸" label="Total Diajukan"   value={formatRp(stats.pending_amount + stats.approved_amount)} color="bg-purple-50" />
                    </div>
                )}

                {/* Filters + search */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 flex flex-wrap items-center gap-3 border-b border-gray-100">
                        <input type="text" placeholder="Cari nama, event, tujuan..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="flex-1 min-w-48 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                        />
                        <div className="flex gap-1">
                            {['all', 'pending', 'approved', 'rejected'].map(s => (
                                <button key={s} onClick={() => setFilter(s)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize
                                        ${filter === s ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                    {s === 'all' ? 'Semua' : STATUS_CFG[s]?.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-16 text-center text-gray-400 text-sm">Memuat...</div>
                    ) : filtered.length === 0 ? (
                        <EmptyState icon="💸" title="Belum ada reimbursement" description="Reimbursement dari staff akan muncul di sini." />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                                        <th className="text-left px-4 py-3 font-medium">Staff</th>
                                        <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Event</th>
                                        <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Kiosk</th>
                                        <th className="text-left px-4 py-3 font-medium">Jumlah</th>
                                        <th className="text-left px-4 py-3 font-medium">Status</th>
                                        <th className="text-left px-4 py-3 font-medium hidden xl:table-cell">Tanggal</th>
                                        <th className="text-right px-4 py-3 font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filtered.map(r => (
                                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-800">{r.nama_staff}</p>
                                                <p className="text-xs text-gray-400 truncate max-w-[140px]">{r.tujuan}</p>
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                {r.event_name
                                                    ? <div>
                                                        <p className="text-xs font-medium text-gray-700">{r.event_name}</p>
                                                        <p className="text-xs text-gray-400">{r.event_date || r.tanggal}</p>
                                                      </div>
                                                    : <span className="text-xs text-gray-300">{r.tanggal}</span>}
                                            </td>
                                            <td className="px-4 py-3 hidden lg:table-cell">
                                                {r.kiosk_name
                                                    ? <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">{r.kiosk_name}</span>
                                                    : <span className="text-gray-300 text-xs">—</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-semibold text-gray-800">{r.jumlah_fmt}</span>
                                            </td>
                                            <td className="px-4 py-3"><StatusChip status={r.status} /></td>
                                            <td className="px-4 py-3 text-xs text-gray-400 hidden xl:table-cell">{r.created_at}</td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => setDetail(r)}
                                                        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-medium transition-colors">
                                                        Review
                                                    </button>
                                                    <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id}
                                                        className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 font-medium transition-colors disabled:opacity-50">
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Detail / Review Modal ── */}
            {detail && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                    onClick={() => setDetail(null)}>
                    <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh]"
                        onClick={e => e.stopPropagation()}>

                        {/* Modal header */}
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
                            <div>
                                <h2 className="font-bold text-gray-800">Detail Reimbursement</h2>
                                <p className="text-xs text-gray-400">{detail.created_at}</p>
                            </div>
                            <button onClick={() => setDetail(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-lg">&times;</button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Event context */}
                            {detail.event_name && (
                                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                                    <div className="flex items-start gap-2">
                                        <span className="text-lg">🎪</span>
                                        <div>
                                            <p className="text-sm font-semibold text-emerald-700">{detail.event_name}</p>
                                            <p className="text-xs text-gray-400">{detail.event_date}</p>
                                            {detail.kiosk_name && (
                                                <p className="text-xs text-gray-400 mt-0.5">Kiosk: {detail.kiosk_name}</p>
                                            )}
                                            {detail.staff_on_duty?.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                    {detail.staff_on_duty.map((s, i) => (
                                                        <span key={i} className="px-2 py-0.5 rounded-full bg-white border border-emerald-200 text-emerald-700 text-xs">
                                                            👤 {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Staff + date */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-xs text-gray-400 mb-0.5">Staff</p>
                                    <p className="text-sm font-semibold text-gray-800">{detail.nama_staff}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-xs text-gray-400 mb-0.5">Tanggal Event</p>
                                    <p className="text-sm font-semibold text-gray-800">{detail.event_date || detail.tanggal}</p>
                                </div>
                            </div>

                            {/* Customers */}
                            {detail.nama_customers?.length > 0 && (
                                <div>
                                    <p className="text-xs text-gray-400 font-medium mb-1.5">Nama Customer</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {detail.nama_customers.filter(Boolean).map((c, i) => (
                                            <span key={i} className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Amount */}
                            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-amber-500 font-semibold">Jumlah Reimbursement</p>
                                    <p className="text-2xl font-bold text-amber-600 mt-0.5">{detail.jumlah_fmt}</p>
                                </div>
                                <span className="text-3xl">💰</span>
                            </div>

                            {/* Tujuan */}
                            <div>
                                <p className="text-xs text-gray-400 font-medium mb-1">Tujuan Penggunaan</p>
                                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed">{detail.tujuan}</p>
                            </div>

                            {/* Kebutuhan lainnya */}
                            {detail.kebutuhan_lainnya && (
                                <div>
                                    <p className="text-xs text-gray-400 font-medium mb-1">Kebutuhan Lainnya</p>
                                    <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{detail.kebutuhan_lainnya}</p>
                                </div>
                            )}

                            {/* Bukti file */}
                            {detail.bukti_url && (
                                <div>
                                    <p className="text-xs text-gray-400 font-medium mb-1.5">Bukti Transaksi</p>
                                    {detail.bukti_url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                                        ? <img src={detail.bukti_url} alt="Bukti" className="w-full rounded-2xl object-cover max-h-48 border border-gray-100" />
                                        : (
                                            <a href={detail.bukti_url} target="_blank" rel="noreferrer"
                                                className="flex items-center gap-2 px-4 py-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors">
                                                <span>📄</span> Download Bukti
                                            </a>
                                        )
                                    }
                                </div>
                            )}

                            {/* ── Admin action ── */}
                            <div className="border-t border-gray-100 pt-4 space-y-3">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Keputusan Admin</p>

                                <div className="grid grid-cols-3 gap-2">
                                    {['pending', 'approved', 'rejected'].map(s => (
                                        <button key={s} type="button"
                                            onClick={() => setActionForm(f => ({ ...f, status: s }))}
                                            className={`py-2.5 rounded-xl text-xs font-semibold transition-all
                                                ${actionForm.status === s
                                                    ? s === 'approved' ? 'bg-green-500 text-white shadow-sm'
                                                    : s === 'rejected' ? 'bg-red-500 text-white shadow-sm'
                                                    : 'bg-amber-400 text-white shadow-sm'
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                            {s === 'pending' ? '⏳ Pending' : s === 'approved' ? '✅ Approve' : '❌ Reject'}
                                        </button>
                                    ))}
                                </div>

                                <textarea rows={2}
                                    value={actionForm.catatan_admin}
                                    onChange={e => setActionForm(f => ({ ...f, catatan_admin: e.target.value }))}
                                    placeholder="Catatan untuk staff (opsional)..."
                                    className="w-full border-2 border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-emerald-400 focus:bg-white transition-colors"
                                />

                                <button onClick={handleApprove} disabled={saving}
                                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-colors disabled:opacity-60">
                                    {saving ? 'Menyimpan...' : 'Simpan Keputusan'}
                                </button>

                                {detail.catatan_admin && (
                                    <div className="bg-gray-50 rounded-xl p-3">
                                        <p className="text-xs text-gray-400 mb-0.5">Catatan sebelumnya</p>
                                        <p className="text-sm text-gray-600">{detail.catatan_admin}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <ConfirmModal config={confirmCfg} onClose={() => setConfirmCfg(null)} />
        </BackendLayout>
    );
}
