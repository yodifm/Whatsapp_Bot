import BackendLayout from '@/layouts/BackendLayout';
import { useState, useEffect } from 'react';
import api from '@/api/axios';

const STATUS_LABELS = {
    new:        { label: 'Baru',      color: 'bg-gray-100 text-gray-600' },
    interested: { label: 'Tertarik',  color: 'bg-blue-100 text-blue-700' },
    followup:   { label: 'Follow-up', color: 'bg-orange-100 text-orange-700' },
    booked:     { label: 'Booking',   color: 'bg-green-100 text-green-700' },
    done:       { label: 'Selesai',   color: 'bg-violet-100 text-violet-700' },
};

function StatCard({ icon, label, value, sub, color }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

function MiniBar({ label, value, max, color }) {
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%`, transition: 'width 0.6s ease' }} />
            </div>
            <span className="text-xs font-semibold text-gray-700 w-6 text-right">{value}</span>
        </div>
    );
}

export default function Analytics() {
    const [data, setData]     = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/analytics')
            .then(r => setData(r.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <BackendLayout>
                <div className="flex items-center justify-center h-[calc(100vh-56px)]">
                    <div className="animate-spin h-8 w-8 rounded-full border-4 border-indigo-500 border-t-transparent" />
                </div>
            </BackendLayout>
        );
    }

    const { summary, status_breakdown, daily_chats, hourly_dist, recent_customers } = data;
    const maxDaily  = Math.max(...daily_chats.map(d => d.total), 1);
    const maxHourly = Math.max(...hourly_dist.map(h => h.total), 1);

    // Hanya tampilkan jam yang ada datanya atau range jam aktif
    const activeHours = hourly_dist.filter(h => h.total > 0);
    const peakHour    = activeHours.length > 0
        ? activeHours.reduce((a, b) => a.total > b.total ? a : b)
        : null;

    return (
        <BackendLayout>
            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900">Analytics</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Performa bot dan pipeline sales.</p>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
                    <StatCard
                        color="bg-indigo-50 text-indigo-600"
                        label="Total Customer" value={summary.total_customers}
                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    />
                    <StatCard
                        color="bg-blue-50 text-blue-600"
                        label="Pesan Masuk" value={summary.total_incoming}
                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
                    />
                    <StatCard
                        color="bg-green-50 text-green-600"
                        label="Sudah Booking" value={summary.booked}
                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                    <StatCard
                        color="bg-violet-50 text-violet-600"
                        label="Conversion" value={`${summary.conversion_rate}%`}
                        sub="booking / total customer"
                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                    />
                    <StatCard
                        color="bg-amber-50 text-amber-600"
                        label="Total Pesan" value={summary.total_messages}
                        sub="masuk + balasan AI"
                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>}
                    />
                    <StatCard
                        color="bg-red-50 text-red-500"
                        label="AI Di-pause" value={summary.ai_paused}
                        sub="human takeover aktif"
                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                    {/* Daily chart */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-5">
                        <p className="font-semibold text-gray-900 text-sm mb-4">Pesan Masuk (7 Hari Terakhir)</p>
                        <div className="flex items-end gap-2 h-32">
                            {daily_chats.map((d, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-[10px] text-gray-400">{d.total > 0 ? d.total : ''}</span>
                                    <div className="w-full rounded-t-lg bg-indigo-500 transition-all"
                                        style={{ height: `${(d.total / maxDaily) * 100}%`, minHeight: d.total > 0 ? '4px' : '2px', opacity: d.total > 0 ? 1 : 0.2 }} />
                                    <span className="text-[10px] text-gray-400 text-center leading-tight">{d.date}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Status breakdown */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-5">
                        <p className="font-semibold text-gray-900 text-sm mb-4">Pipeline Status</p>
                        <div className="space-y-3">
                            {Object.entries(STATUS_LABELS).map(([key, cfg]) => (
                                <div key={key} className="flex items-center justify-between">
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>{cfg.label}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 bg-gray-100 rounded-full h-1.5">
                                            <div className="h-1.5 rounded-full bg-indigo-500"
                                                style={{ width: `${summary.total_customers > 0 ? (status_breakdown[key] / summary.total_customers * 100) : 0}%` }} />
                                        </div>
                                        <span className="text-sm font-bold text-gray-700 w-5 text-right">{status_breakdown[key]}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Hourly distribution */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-5">
                        <div className="flex items-center justify-between mb-4">
                            <p className="font-semibold text-gray-900 text-sm">Distribusi Jam Aktif</p>
                            {peakHour && (
                                <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2.5 py-1 rounded-full">
                                    Peak: {peakHour.hour}
                                </span>
                            )}
                        </div>
                        <div className="space-y-2">
                            {hourly_dist.filter(h => h.total > 0).length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-6">Belum ada data</p>
                            ) : (
                                hourly_dist
                                    .filter(h => h.total > 0)
                                    .sort((a, b) => b.total - a.total)
                                    .slice(0, 8)
                                    .map(h => (
                                        <MiniBar key={h.hour} label={h.hour} value={h.total} max={maxHourly} color="bg-indigo-500" />
                                    ))
                            )}
                        </div>
                    </div>

                    {/* Recent customers */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-5">
                        <p className="font-semibold text-gray-900 text-sm mb-4">Customer Terbaru</p>
                        {recent_customers.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-6">Belum ada customer</p>
                        ) : (
                            <div className="space-y-3">
                                {recent_customers.map(c => {
                                    const cfg = STATUS_LABELS[c.status] ?? STATUS_LABELS.new;
                                    return (
                                        <div key={c.id} className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                                                {(c.nama ?? '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">{c.nama ?? 'Tanpa Nama'}</p>
                                                <p className="text-xs text-gray-400">+{c.whatsapp_id} · {c.chat_histories_count} pesan</p>
                                            </div>
                                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.color}`}>
                                                {cfg.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </BackendLayout>
    );
}
