import { useState, useEffect, useCallback } from 'react';
import BackendLayout from '@/Layouts/BackendLayout';
import api from '@/api/axios';

function formatRp(n) {
    if (!n && n !== 0) return 'Rp 0';
    return 'Rp ' + Number(n).toLocaleString('id-ID');
}

function formatDate(d) {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

const STATUS_LABEL = {
    pending:   { label: 'Pending',  cls: 'bg-yellow-50 text-yellow-600' },
    dp_paid:   { label: 'DP Paid',  cls: 'bg-blue-50 text-blue-600' },
    completed: { label: 'Selesai',  cls: 'bg-green-50 text-green-600' },
    lunas:     { label: 'Lunas',    cls: 'bg-green-50 text-green-600' },
    cancelled: { label: 'Batal',    cls: 'bg-red-50 text-red-500' },
};

const LOGISTIC_STATUS = {
    none:          { icon: '—',  tip: 'Tidak ada log logistik',         cls: 'text-gray-300' },
    checkout_only: { icon: '⏳', tip: 'Checkout ada, belum ada return', cls: 'text-amber-400' },
    complete:      { icon: '✅', tip: 'Terpakai dihitung dari return',   cls: '' },
};

// Inline-editable currency cell
function EditableCell({ value, onSave }) {
    const [editing, setEditing] = useState(false);
    const [val, setVal]         = useState(value);

    useEffect(() => { setVal(value); }, [value]);

    const commit = () => {
        setEditing(false);
        const num = parseInt(val, 10) || 0;
        if (num !== value) onSave(num);
        setVal(num);
    };

    if (editing) {
        return (
            <input
                type="number" min="0"
                value={val}
                autoFocus
                onChange={e => setVal(e.target.value)}
                onBlur={commit}
                onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setEditing(false); setVal(value); } }}
                className="w-28 px-2 py-1 text-sm border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-right"
            />
        );
    }

    return (
        <button onClick={() => setEditing(true)}
            className="group flex items-center justify-end gap-1 hover:text-indigo-600 transition w-full">
            <span>{formatRp(value)}</span>
            <svg className="w-3 h-3 text-gray-300 group-hover:text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
        </button>
    );
}

export default function Sales() {
    const [month, setMonth]     = useState(new Date().toISOString().slice(0, 7));
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(null); // booking id being saved

    const load = useCallback(async (m) => {
        setLoading(true);
        try {
            const res = await api.get('/sales', { params: { month: m } });
            setData(res.data);
        } catch {} finally { setLoading(false); }
    }, []);

    useEffect(() => { load(month); }, [month]);

    const handleSaveExpense = async (bookingId, field, value) => {
        setSaving(bookingId);
        try {
            // Build current row values then update single field
            const row = data.rows.find(r => r.id === bookingId);
            const payload = {
                biaya_transport: field === 'biaya_transport' ? value : row.biaya_transport,
                biaya_staff:     field === 'biaya_staff'     ? value : row.biaya_staff,
            };
            const res = await api.patch(`/sales/${bookingId}/expenses`, payload);
            // Replace row with updated server response
            setData(prev => ({
                ...prev,
                rows: prev.rows.map(r => r.id === bookingId ? res.data : r),
                summary: recalcSummary([...prev.rows.map(r => r.id === bookingId ? res.data : r)]),
            }));
        } catch {} finally { setSaving(null); }
    };

    const recalcSummary = (rows) => {
        const gross    = rows.reduce((s, r) => s + r.gross, 0);
        const expenses = rows.reduce((s, r) => s + r.total_expenses, 0);
        const net      = gross - expenses;
        return { gross, total_expenses: expenses, net, margin_pct: gross > 0 ? +(net / gross * 100).toFixed(1) : 0 };
    };

    const summary = data?.summary;
    const rows    = data?.rows ?? [];

    // Month navigation helpers
    const shiftMonth = (delta) => {
        const [y, m] = month.split('-').map(Number);
        const d = new Date(y, m - 1 + delta, 1);
        setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    };

    const monthLabel = () => {
        const [y, m] = month.split('-');
        return new Date(+y, +m - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    };

    return (
        <BackendLayout>
            <div className="p-6 max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Sales</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Pendapatan kotor vs bersih per event</p>
                    </div>

                    {/* Month picker */}
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <button onClick={() => shiftMonth(-1)}
                            className="px-3 py-2 hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
                            className="text-sm font-medium text-gray-700 text-center border-none focus:outline-none px-1 py-2 bg-transparent cursor-pointer" />
                        <button onClick={() => shiftMonth(1)}
                            className="px-3 py-2 hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Summary cards */}
                {summary && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <SummaryCard label="Pendapatan Kotor" value={formatRp(summary.gross)} icon="💰"
                            sub={`${rows.length} booking`} color="indigo" />
                        <SummaryCard label="Total Pengeluaran" value={formatRp(summary.total_expenses)} icon="📉"
                            sub="transport + staff + logistik" color="orange" />
                        <SummaryCard label="Pendapatan Bersih" value={formatRp(summary.net)} icon="✨"
                            sub={summary.net >= 0 ? 'profit' : 'rugi'} color={summary.net >= 0 ? 'green' : 'red'} />
                        <SummaryCard label="Margin" value={`${summary.margin_pct}%`} icon="📊"
                            sub={summary.margin_pct >= 50 ? 'Sehat' : 'Perlu evaluasi'} color={summary.margin_pct >= 50 ? 'green' : 'amber'} />
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-sm text-gray-400">Memuat data {monthLabel()}...</div>
                    ) : rows.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="text-4xl mb-3">📭</div>
                            <p className="text-gray-500 text-sm">Tidak ada booking di {monthLabel()}.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[900px]">
                                <thead>
                                    <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50">
                                        <th className="text-left px-4 py-3">Tgl</th>
                                        <th className="text-left px-4 py-3">Customer</th>
                                        <th className="text-left px-4 py-3">Paket</th>
                                        <th className="text-right px-4 py-3">Kotor</th>
                                        <th className="text-right px-4 py-3 text-orange-400">Transport ✏️</th>
                                        <th className="text-right px-4 py-3 text-orange-400">Staff ✏️</th>
                                        <th className="text-right px-4 py-3">Logistik</th>
                                        <th className="text-right px-4 py-3 font-bold text-gray-600">Bersih</th>
                                        <th className="px-4 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {rows.map(row => {
                                        const ls = LOGISTIC_STATUS[row.logistic_status] ?? LOGISTIC_STATUS.none;
                                        const st = STATUS_LABEL[row.status] ?? { label: row.status, cls: 'bg-gray-100 text-gray-500' };
                                        const isProfit = row.net >= 0;
                                        return (
                                            <tr key={row.id} className={`hover:bg-gray-50 transition ${saving === row.id ? 'opacity-60' : ''}`}>
                                                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(row.tanggal)}</td>
                                                <td className="px-4 py-3 font-medium text-gray-900 max-w-[140px] truncate">{row.customer_nama}</td>
                                                <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate">{row.paket_nama}</td>
                                                <td className="px-4 py-3 text-right font-semibold text-gray-700">{formatRp(row.gross)}</td>
                                                <td className="px-4 py-3 text-right text-orange-500">
                                                    <EditableCell value={row.biaya_transport}
                                                        onSave={v => handleSaveExpense(row.id, 'biaya_transport', v)} />
                                                </td>
                                                <td className="px-4 py-3 text-right text-orange-500">
                                                    <EditableCell value={row.biaya_staff}
                                                        onSave={v => handleSaveExpense(row.id, 'biaya_staff', v)} />
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="flex items-center justify-end gap-1">
                                                        <span title={ls.tip} className={`text-base ${ls.cls}`}>{ls.icon}</span>
                                                        <span className="text-gray-600">{formatRp(row.biaya_logistik)}</span>
                                                    </span>
                                                </td>
                                                <td className={`px-4 py-3 text-right font-bold ${isProfit ? 'text-green-600' : 'text-red-500'}`}>
                                                    {isProfit ? '' : '−'}{formatRp(Math.abs(row.net))}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${st.cls}`}>
                                                        {st.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold text-sm">
                                        <td colSpan={3} className="px-4 py-3 text-gray-500">Total {monthLabel()}</td>
                                        <td className="px-4 py-3 text-right text-gray-700">{formatRp(summary?.gross)}</td>
                                        <td className="px-4 py-3 text-right text-orange-500">{formatRp(rows.reduce((s, r) => s + r.biaya_transport, 0))}</td>
                                        <td className="px-4 py-3 text-right text-orange-500">{formatRp(rows.reduce((s, r) => s + r.biaya_staff, 0))}</td>
                                        <td className="px-4 py-3 text-right text-gray-600">{formatRp(rows.reduce((s, r) => s + r.biaya_logistik, 0))}</td>
                                        <td className={`px-4 py-3 text-right font-bold text-lg ${(summary?.net ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {formatRp(summary?.net)}
                                        </td>
                                        <td />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>✏️ Klik biaya transport/staff untuk edit langsung</span>
                    <span>⏳ Logistik belum ada return (estimasi penuh)</span>
                    <span>✅ Logistik dihitung dari barang terpakai</span>
                </div>
            </div>
        </BackendLayout>
    );
}

function SummaryCard({ label, value, icon, sub, color }) {
    const colors = {
        indigo: 'bg-indigo-50 text-indigo-600',
        green:  'bg-green-50 text-green-600',
        red:    'bg-red-50 text-red-500',
        orange: 'bg-orange-50 text-orange-500',
        amber:  'bg-amber-50 text-amber-600',
    };
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${colors[color] ?? colors.indigo}`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="font-bold text-gray-900 text-base leading-tight">{value}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
            </div>
        </div>
    );
}
