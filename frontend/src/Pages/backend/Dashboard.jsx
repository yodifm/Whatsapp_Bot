import BackendLayout from '@/layouts/BackendLayout';
import { useState, useEffect, useRef } from 'react';
import api from '@/api/axios';

const STATUS_CONFIG = {
    new:        { label: 'Baru',      color: 'bg-gray-100 text-gray-600',     dot: 'bg-gray-400' },
    interested: { label: 'Tertarik',  color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
    followup:   { label: 'Follow-up', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
    booked:     { label: 'Booking',   color: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
    done:       { label: 'Selesai',   color: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
};

function CustomerItem({ customer, isActive, onClick }) {
    const initials = (customer.nama ?? '?').charAt(0).toUpperCase();
    const colors   = ['bg-violet-100 text-violet-700', 'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700'];
    const color    = colors[customer.id % colors.length];
    const status   = STATUS_CONFIG[customer.status] ?? STATUS_CONFIG.new;

    return (
        <button
            onClick={onClick}
            className={`w-full text-left px-4 py-3.5 border-b border-gray-50 transition-all hover:bg-gray-50 ${
                isActive ? 'bg-indigo-50 border-l-[3px] border-l-indigo-500' : 'border-l-[3px] border-l-transparent'
            }`}
        >
            <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                    <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center font-bold text-sm`}>
                        {initials}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${status.dot}`} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-baseline gap-2">
                        <p className={`font-semibold text-sm truncate ${isActive ? 'text-indigo-700' : 'text-gray-800'}`}>
                            {customer.nama ?? 'Tanpa Nama'}
                        </p>
                        <span className="text-[11px] text-gray-400 flex-shrink-0">{customer.waktu_terakhir}</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">+{customer.whatsapp_id}</p>
                    {customer.pesan_terakhir && (
                        <p className="text-xs text-gray-400 truncate mt-0.5 italic">{customer.pesan_terakhir}</p>
                    )}
                </div>
                {customer.total_pesan > 0 && (
                    <span className="flex-shrink-0 text-[10px] font-semibold bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5">
                        {customer.total_pesan}
                    </span>
                )}
            </div>
        </button>
    );
}

function ChatBubble({ message }) {
    const isUser     = message.role === 'user';
    const isFollowup = message.content?.startsWith('[Follow-up otomatis]');
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
            {!isUser && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold mr-2 flex-shrink-0 self-end mb-1 shadow-sm">
                    {isFollowup ? '⏰' : 'AI'}
                </div>
            )}
            <div className={`max-w-[68%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                    isUser
                        ? 'bg-indigo-600 text-white rounded-2xl rounded-br-md'
                        : isFollowup
                            ? 'bg-orange-50 text-orange-800 border border-orange-200 rounded-2xl rounded-bl-md'
                            : 'bg-white text-gray-800 rounded-2xl rounded-bl-md border border-gray-100'
                }`}>
                    {isFollowup ? message.content.replace('[Follow-up otomatis] ', '') : message.content}
                    {isFollowup && <span className="block text-[10px] text-orange-400 mt-1">⏰ Follow-up otomatis</span>}
                </div>
                <span className="text-[11px] text-gray-400 mt-1 px-1">{message.created_at}</span>
            </div>
        </div>
    );
}

function StatusDropdown({ status, onChange }) {
    const [open, setOpen] = useState(false);
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.new;

    return (
        <div className="relative">
            <button onClick={() => setOpen(o => !o)}
                className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition ${cfg.color} border-transparent hover:opacity-80`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden min-w-[130px]">
                    {Object.entries(STATUS_CONFIG).map(([key, c]) => (
                        <button key={key} onClick={() => { onChange(key); setOpen(false); }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition ${key === status ? 'font-semibold' : ''}`}>
                            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                            {c.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Dashboard() {
    const [customers, setCustomers]               = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [messages, setMessages]                 = useState([]);
    const [loadingMsgs, setLoadingMsgs]           = useState(false);
    const [search, setSearch]                     = useState('');
    const [filterStatus, setFilterStatus]         = useState('all');
    const bottomRef = useRef(null);

    useEffect(() => {
        api.get('/customers').then(r => setCustomers(r.data));
    }, []);

    const selectCustomer = async (customer) => {
        setSelectedCustomer(customer);
        setLoadingMsgs(true);
        try {
            const r = await api.get(`/customers/${customer.id}/messages`);
            setMessages(r.data);
        } finally {
            setLoadingMsgs(false);
        }
    };

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const updateCustomer = (id, patch) => {
        setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
        setSelectedCustomer(prev => prev?.id === id ? { ...prev, ...patch } : prev);
    };

    const handleStatusChange = async (status) => {
        await api.patch(`/customers/${selectedCustomer.id}/status`, { status });
        updateCustomer(selectedCustomer.id, { status });
    };

    const handleToggleAI = async () => {
        const r = await api.patch(`/customers/${selectedCustomer.id}/toggle-ai`);
        updateCustomer(selectedCustomer.id, { ai_paused: r.data.ai_paused });
    };

    const filtered = customers.filter(c => {
        const matchSearch = (c.nama ?? '').toLowerCase().includes(search.toLowerCase()) || c.whatsapp_id.includes(search);
        const matchStatus = filterStatus === 'all' || c.status === filterStatus;
        return matchSearch && matchStatus;
    });

    return (
        <BackendLayout>
            <div className="h-[calc(100vh-56px)] flex flex-col">
                <div className="flex-1 overflow-hidden mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex h-full rounded-2xl overflow-hidden shadow-sm border border-gray-200 bg-white">

                        {/* Sidebar */}
                        <div className="w-72 xl:w-80 flex-shrink-0 flex flex-col border-r border-gray-100">
                            <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-gray-900 text-sm">Customers</h3>
                                    <span className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-2 py-0.5 rounded-full">
                                        {customers.length}
                                    </span>
                                </div>
                                <div className="relative mb-2">
                                    <svg className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
                                    </svg>
                                    <input type="text" placeholder="Cari customer..." value={search} onChange={e => setSearch(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition" />
                                </div>
                                {/* Status filter */}
                                <div className="flex gap-1 flex-wrap">
                                    {[['all', 'Semua'], ...Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.label])].map(([key, label]) => (
                                        <button key={key} onClick={() => setFilterStatus(key)}
                                            className={`text-[11px] px-2 py-1 rounded-lg border transition ${
                                                filterStatus === key
                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                            }`}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {filtered.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 px-6 text-center py-12">
                                        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                                            <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-sm font-medium text-gray-500">Belum ada customer</p>
                                        <p className="text-xs mt-1 text-gray-400 leading-relaxed">Customer muncul saat ada pesan masuk via WhatsApp</p>
                                    </div>
                                ) : (
                                    filtered.map(customer => (
                                        <CustomerItem key={customer.id} customer={customer}
                                            isActive={selectedCustomer?.id === customer.id}
                                            onClick={() => selectCustomer(customer)} />
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Chat area */}
                        <div className="flex-1 flex flex-col min-w-0 bg-gray-50/50">
                            {selectedCustomer ? (
                                <>
                                    {/* Chat header */}
                                    <div className="px-5 py-3 bg-white border-b border-gray-100 flex items-center gap-3 shadow-sm">
                                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                                            {(selectedCustomer.nama ?? '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900 text-sm truncate">{selectedCustomer.nama ?? 'Tanpa Nama'}</p>
                                            <p className="text-xs text-gray-400">+{selectedCustomer.whatsapp_id}</p>
                                        </div>

                                        {/* Status dropdown */}
                                        <StatusDropdown status={selectedCustomer.status ?? 'new'} onChange={handleStatusChange} />

                                        {/* AI Toggle */}
                                        <button onClick={handleToggleAI}
                                            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
                                                selectedCustomer.ai_paused
                                                    ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                                    : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                            }`}>
                                            {selectedCustomer.ai_paused ? (
                                                <>
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    AI Paused
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    AI Aktif
                                                </>
                                            )}
                                        </button>

                                        <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            {messages.length} pesan
                                        </div>
                                    </div>

                                    {/* AI paused banner */}
                                    {selectedCustomer.ai_paused && (
                                        <div className="px-5 py-2.5 bg-red-50 border-b border-red-100 flex items-center gap-2 text-xs text-red-700">
                                            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>AI di-pause — customer ini dibalas manual oleh admin. Klik <strong>AI Paused</strong> di atas untuk aktifkan kembali.</span>
                                        </div>
                                    )}

                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto px-5 py-5">
                                        {loadingMsgs ? (
                                            <div className="flex flex-col items-center justify-center h-full gap-3">
                                                <div className="animate-spin h-7 w-7 rounded-full border-[3px] border-indigo-500 border-t-transparent" />
                                                <p className="text-xs text-gray-400">Memuat percakapan...</p>
                                            </div>
                                        ) : messages.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                                <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mb-3 shadow-sm">
                                                    <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                    </svg>
                                                </div>
                                                <p className="text-sm font-medium text-gray-500">Belum ada percakapan</p>
                                            </div>
                                        ) : (
                                            messages.map(msg => <ChatBubble key={msg.id} message={msg} />)
                                        )}
                                        <div ref={bottomRef} />
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                    <div className="w-20 h-20 rounded-3xl bg-white border border-gray-200 flex items-center justify-center mb-4 shadow-sm">
                                        <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <p className="text-base font-semibold text-gray-500">Pilih customer</p>
                                    <p className="text-sm mt-1 text-gray-400">untuk melihat percakapan</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </BackendLayout>
    );
}
