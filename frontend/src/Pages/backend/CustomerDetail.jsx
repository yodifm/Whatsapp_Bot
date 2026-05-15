import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BackendLayout from '@/layouts/BackendLayout';
import api from '@/api/axios';
import { useToast } from '@/context/ToastContext';
import { Skeleton } from '@/components/Skeleton';

const STATUS_CFG = {
    pending:   { label: 'Pending',  cls: 'bg-amber-100 text-amber-700' },
    confirmed: { label: 'Confirmed',cls: 'bg-blue-100 text-blue-700' },
    dp_paid:   { label: 'DP Paid',  cls: 'bg-indigo-100 text-indigo-700' },
    completed: { label: 'Selesai',  cls: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Batal',    cls: 'bg-red-100 text-red-500' },
};

const CUST_STATUS = {
    new:           { cls: 'bg-gray-100 text-gray-600',   label: 'New' },
    interested:    { cls: 'bg-blue-100 text-blue-700',   label: 'Interested' },
    followup:      { cls: 'bg-orange-100 text-orange-700', label: 'Follow-up' },
    booked:        { cls: 'bg-green-100 text-green-700', label: 'Booked' },
    done:          { cls: 'bg-violet-100 text-violet-700', label: 'Done' },
    no_reply_yet:  { cls: 'bg-red-100 text-red-600',     label: 'No Reply Yet' },
};

function formatRp(n) {
    return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
}

export default function CustomerDetail() {
    const { id }     = useParams();
    const navigate   = useNavigate();
    const toast      = useToast();
    const [data,     setData]     = useState(null);
    const [loading,  setLoading]  = useState(true);
    const [messages,     setMessages]     = useState([]);
    const [loadMsgs,     setLoadMsgs]     = useState(false);
    const [showChat,     setShowChat]     = useState(false);
    const [sendText,     setSendText]     = useState('');
    const [sending,      setSending]      = useState(false);
    const [changingStatus, setChangingStatus] = useState(false);
    const [loadingFollowup, setLoadingFollowup] = useState(false);

    useEffect(() => {
        api.get(`/customers/${id}`)
            .then(r => setData(r.data))
            .catch(() => toast.error('Customer tidak ditemukan'))
            .finally(() => setLoading(false));
    }, [id]);

    const loadChat = async () => {
        if (loadMsgs) return;
        setLoadMsgs(true);
        try {
            const r = await api.get(`/customers/${id}/messages`);
            setMessages(r.data);
            setShowChat(true);
        } finally {
            setLoadMsgs(false);
        }
    };

    const changeStatus = async (newStatus) => {
        setChangingStatus(true);
        try {
            await api.patch(`/customers/${id}/status`, { status: newStatus });
            setData(d => ({ ...d, status: newStatus }));
            toast.success('Status diperbarui');
        } catch {
            toast.error('Gagal ubah status');
        } finally {
            setChangingStatus(false);
        }
    };

    const loadFollowup = async () => {
        setLoadingFollowup(true);
        try {
            const r = await api.get(`/customers/${id}/followup-message`);
            setSendText(r.data.message);
            if (!showChat) {
                await loadChat();
            }
            toast.success(r.data.discounts?.length ? `Follow-up dengan ${r.data.discounts.length} promo aktif siap dikirim!` : 'Pesan follow-up siap dikirim');
        } catch {
            toast.error('Gagal muat pesan follow-up');
        } finally {
            setLoadingFollowup(false);
        }
    };

    const handleSend = async () => {
        if (!sendText.trim() || sending) return;
        setSending(true);
        try {
            const r = await api.post(`/customers/${id}/send`, { message: sendText.trim() });
            setMessages(prev => [...prev, r.data]);
            setSendText('');
            toast.success('Pesan terkirim');
        } catch {
            toast.error('Gagal mengirim pesan');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <BackendLayout>
                <div className="p-6 max-w-4xl mx-auto space-y-4">
                    <Skeleton className="h-8 w-48 rounded-xl" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                                <Skeleton className="h-4 w-24 rounded-full" />
                                <Skeleton className="h-6 w-32 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </BackendLayout>
        );
    }

    if (!data) return (
        <BackendLayout>
            <div className="p-6 text-center text-gray-400">Customer tidak ditemukan.</div>
        </BackendLayout>
    );

    return (
        <BackendLayout>
            <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 transition text-gray-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{data.nama}</h1>
                        <p className="text-sm text-gray-400">Customer sejak {data.created_at}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        {data.status === 'no_reply_yet' && (
                            <button
                                onClick={loadFollowup}
                                disabled={loadingFollowup}
                                className="flex items-center gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                                {loadingFollowup ? '...' : '📨 Kirim Follow-up'}
                            </button>
                        )}
                        <select
                            value={data.status}
                            onChange={e => changeStatus(e.target.value)}
                            disabled={changingStatus}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 ${(CUST_STATUS[data.status] ?? CUST_STATUS.new).cls}`}>
                            {Object.entries(CUST_STATUS).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                        <p className="text-xs text-gray-400">Total Booking</p>
                        <p className="text-2xl font-bold text-gray-900 mt-0.5">{data.total_booking}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                        <p className="text-xs text-gray-400">Total Pengeluaran</p>
                        <p className="text-xl font-bold text-indigo-700 mt-0.5">{formatRp(data.total_spent)}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                        <p className="text-xs text-gray-400">WhatsApp</p>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5">{data.no_whatsapp || '—'}</p>
                        {data.no_whatsapp && (
                            <a href={`https://wa.me/${data.no_whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                                className="text-xs text-green-600 font-medium hover:underline">Hubungi ↗</a>
                        )}
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                        <p className="text-xs text-gray-400">Email</p>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">{data.email || '—'}</p>
                    </div>
                </div>

                {/* Booking History */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-bold text-gray-900">Riwayat Booking</h2>
                        <span className="text-xs text-gray-400">{data.total_booking} booking</span>
                    </div>
                    {data.bookings.length === 0 ? (
                        <div className="py-10 text-center text-gray-400 text-sm">Belum ada booking</div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {data.bookings.map(b => {
                                const st = STATUS_CFG[b.status] ?? { label: b.status, cls: 'bg-gray-100 text-gray-600' };
                                const totalPaid = (b.dp_amount || 0) + (b.jumlah_pelunasan || 0);
                                return (
                                    <div key={b.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-gray-800 truncate text-sm">{b.nama_acara || '-'}</p>
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${st.cls}`}>{st.label}</span>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {new Date(b.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                                {b.jam_mulai ? ` · ${b.jam_mulai}` : ''}
                                            </p>
                                            {b.lokasi && <p className="text-xs text-gray-400 truncate">📍 {b.lokasi}</p>}
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            {b.package && <p className="text-xs text-indigo-600 font-medium">{b.package.nama}</p>}
                                            {totalPaid > 0 && <p className="text-sm font-semibold text-gray-700">{formatRp(totalPaid)}</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Chat History */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-bold text-gray-900">Riwayat Chat</h2>
                        {!showChat && (
                            <button onClick={loadChat} disabled={loadMsgs}
                                className="text-xs text-indigo-600 font-semibold hover:underline disabled:opacity-50">
                                {loadMsgs ? 'Memuat...' : 'Lihat Chat'}
                            </button>
                        )}
                    </div>
                    {showChat && (
                        <>
                            <div className="max-h-80 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                                {messages.length === 0 ? (
                                    <p className="text-center text-sm text-gray-400 py-4">Belum ada percakapan</p>
                                ) : messages.map((msg, i) => {
                                    const isUser = msg.role === 'user';
                                    return (
                                        <div key={i} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                                            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                                                isUser
                                                    ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-md'
                                                    : 'bg-indigo-600 text-white rounded-tr-md'
                                            }`}>
                                                {msg.content}
                                                <p className={`text-[10px] mt-1 ${isUser ? 'text-gray-400' : 'text-indigo-200'}`}>
                                                    {msg.created_at}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Quick send */}
                            <div className="p-4 border-t border-gray-100 flex gap-2">
                                <input
                                    value={sendText}
                                    onChange={e => setSendText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                    placeholder="Kirim pesan ke customer..."
                                    className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400"
                                />
                                <button onClick={handleSend} disabled={sending || !sendText.trim()}
                                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition">
                                    {sending ? '...' : 'Kirim'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </BackendLayout>
    );
}
