import { useEffect, useState, useMemo } from 'react';
import BackendLayout from '@/layouts/BackendLayout';
import api from '@/api/axios';
import { useToast } from '@/context/ToastContext';
import ConfirmModal from '@/components/ConfirmModal';

const STATUS_COLORS = {
    pending:   'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    dp_paid:   'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
};

const STATUS_LABELS = {
    pending: 'Pending', confirmed: 'Confirmed', dp_paid: 'DP Paid',
    completed: 'Completed', cancelled: 'Cancelled',
};

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth()    === b.getMonth()    &&
           a.getDate()     === b.getDate();
}

export default function Bookings() {
    const today   = new Date();
    const toast = useToast();
    const [confirmCfg, setConfirmCfg] = useState(null);
    const [year,  setYear]  = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth()); // 0-indexed

    const [bookings,     setBookings]     = useState([]);
    const [packages,     setPackages]     = useState([]);
    const [customers,    setCustomers]    = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [selectedDay,  setSelectedDay]  = useState(null);
    const [showModal,    setShowModal]    = useState(false);
    const [editBooking,  setEditBooking]  = useState(null);
    const [saving,       setSaving]       = useState(false);
    const [error,        setError]        = useState('');
    const [sendingWa,    setSendingWa]    = useState(null); // booking id being sent

    const [form, setForm] = useState({
        customer_id: '', package_id: '', tanggal: '', jam_mulai: '',
        durasi_jam: '', nama_acara: '', catatan: '', status: 'pending', dp_amount: '',
    });

    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

    useEffect(() => {
        Promise.all([
            api.get(`/bookings?bulan=${monthStr}`),
            api.get('/packages'),
            api.get('/customers'),
        ]).then(([b, p, c]) => {
            setBookings(b.data);
            setPackages(p.data);
            setCustomers(c.data);
        }).finally(() => setLoading(false));
    }, [monthStr]);

    // Calendar grid
    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < firstDay; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
        return cells;
    }, [year, month]);

    const bookingsForDay = (date) => {
        if (!date) return [];
        const str = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
        return bookings.filter(b => b.tanggal === str);
    };

    const dayBookings = selectedDay ? bookingsForDay(selectedDay) : [];

    const prevMonth = () => {
        if (month === 0) { setYear(y => y - 1); setMonth(11); }
        else setMonth(m => m - 1);
        setSelectedDay(null);
    };
    const nextMonth = () => {
        if (month === 11) { setYear(y => y + 1); setMonth(0); }
        else setMonth(m => m + 1);
        setSelectedDay(null);
    };

    const openCreate = () => {
        const dateStr = selectedDay
            ? `${selectedDay.getFullYear()}-${String(selectedDay.getMonth()+1).padStart(2,'0')}-${String(selectedDay.getDate()).padStart(2,'0')}`
            : '';
        setForm({ customer_id:'', package_id:'', tanggal: dateStr, jam_mulai:'', durasi_jam:'', nama_acara:'', catatan:'', status:'pending', dp_amount:'' });
        setEditBooking(null);
        setError('');
        setShowModal(true);
    };

    const openEdit = (b) => {
        setForm({
            customer_id: b.customer.id, package_id: b.package?.id ?? '',
            tanggal: b.tanggal, jam_mulai: b.jam_mulai ?? '', durasi_jam: b.durasi_jam ?? '',
            nama_acara: b.nama_acara ?? '', catatan: b.catatan ?? '',
            status: b.status, dp_amount: b.dp_amount ?? '',
        });
        setEditBooking(b);
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true); setError('');
        try {
            const payload = { ...form };
            if (!payload.package_id) delete payload.package_id;
            if (!payload.dp_amount)  delete payload.dp_amount;
            if (!payload.jam_mulai)  delete payload.jam_mulai;
            if (!payload.durasi_jam) delete payload.durasi_jam;

            if (editBooking) {
                const { data } = await api.put(`/bookings/${editBooking.id}`, payload);
                setBookings(bs => bs.map(b => b.id === data.id ? data : b));
            } else {
                const { data } = await api.post('/bookings', payload);
                setBookings(bs => [...bs, data]);
            }
            setShowModal(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan booking');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id) => {
        setConfirmCfg({
            title: 'Hapus Booking',
            message: 'Booking ini akan dihapus permanen dari kalender.',
            confirmText: 'Ya, Hapus',
            onConfirm: async () => {
                await api.delete(`/bookings/${id}`);
                setBookings(bs => bs.filter(b => b.id !== id));
                toast.success('Booking berhasil dihapus');
            },
        });
    };

    const downloadInvoice = (id) => {
        window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/bookings/${id}/invoice`, '_blank');
    };

    const sendInvoiceWa = async (id) => {
        setSendingWa(id);
        try {
            await api.post(`/bookings/${id}/send-invoice`);
            toast.success('Invoice berhasil dikirim ke WhatsApp customer!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal mengirim invoice.');
        } finally {
            setSendingWa(null);
        }
    };

    if (loading) return (
        <BackendLayout>
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        </BackendLayout>
    );

    return (
        <BackendLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Kalender Booking</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Lihat dan kelola jadwal sesi photobooth</p>
                    </div>
                    <button onClick={openCreate}
                        className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Booking
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Calendar */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Month nav */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition">
                                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <span className="font-semibold text-gray-900">{MONTHS[month]} {year}</span>
                            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition">
                                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* Day headers */}
                        <div className="grid grid-cols-7 border-b border-gray-100">
                            {DAYS.map(d => (
                                <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Cells */}
                        <div className="grid grid-cols-7">
                            {calendarDays.map((date, idx) => {
                                if (!date) return <div key={`empty-${idx}`} className="h-20 border-b border-r border-gray-50" />;
                                const dayBks   = bookingsForDay(date);
                                const isToday  = isSameDay(date, today);
                                const isSel    = selectedDay && isSameDay(date, selectedDay);
                                const hasBooks = dayBks.length > 0;
                                return (
                                    <button key={date.toISOString()} onClick={() => setSelectedDay(isSel ? null : date)}
                                        className={`h-20 border-b border-r border-gray-50 p-1.5 text-left transition hover:bg-indigo-50 ${isSel ? 'bg-indigo-50 ring-2 ring-inset ring-indigo-400' : ''}`}>
                                        <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-semibold
                                            ${isToday ? 'bg-indigo-600 text-white' : 'text-gray-700'}`}>
                                            {date.getDate()}
                                        </span>
                                        <div className="mt-1 space-y-0.5 overflow-hidden">
                                            {dayBks.slice(0, 2).map(b => (
                                                <div key={b.id} className="text-[10px] leading-tight px-1 py-0.5 rounded bg-indigo-100 text-indigo-700 truncate">
                                                    {b.nama_acara || b.customer.nama}
                                                </div>
                                            ))}
                                            {dayBks.length > 2 && (
                                                <div className="text-[10px] text-gray-400 px-1">+{dayBks.length - 2} lagi</div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Side panel */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        {selectedDay ? (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-semibold text-gray-900 text-sm">
                                        {selectedDay.getDate()} {MONTHS[selectedDay.getMonth()]} {selectedDay.getFullYear()}
                                    </h2>
                                    <button onClick={openCreate}
                                        className="text-xs text-indigo-600 font-medium hover:underline">
                                        + Tambah
                                    </button>
                                </div>
                                {dayBookings.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-8">Tidak ada booking di hari ini</p>
                                ) : (
                                    <div className="space-y-3">
                                        {dayBookings.map(b => (
                                            <div key={b.id} className="bg-gray-50 rounded-xl p-3 space-y-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">{b.customer.nama}</p>
                                                        {b.nama_acara && <p className="text-xs text-gray-500">{b.nama_acara}</p>}
                                                    </div>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status]}`}>
                                                        {STATUS_LABELS[b.status]}
                                                    </span>
                                                </div>
                                                {b.package && (
                                                    <p className="text-xs text-indigo-600 font-medium">{b.package.nama}</p>
                                                )}
                                                {b.jam_mulai && (
                                                    <p className="text-xs text-gray-500">
                                                        {b.jam_mulai} {b.durasi_jam ? `· ${b.durasi_jam} jam` : ''}
                                                    </p>
                                                )}
                                                {b.lokasi && (
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                            {b.lokasi}
                                                        </span>
                                                        {b.total_jarak != null && (
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                                                                b.total_jarak < 60
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : 'bg-orange-100 text-orange-700'
                                                            }`}>
                                                                ~{b.total_jarak} km · {b.total_jarak < 60 ? 'Transport gratis' : 'Transport berbayar'}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex flex-wrap gap-2 pt-1">
                                                    <button onClick={() => openEdit(b)}
                                                        className="text-xs text-indigo-600 hover:underline">Edit</button>
                                                    <button onClick={() => downloadInvoice(b.id)}
                                                        className="text-xs text-gray-500 hover:text-gray-700">Invoice</button>
                                                    <button onClick={() => sendInvoiceWa(b.id)}
                                                        disabled={sendingWa === b.id}
                                                        className="text-xs text-emerald-600 hover:underline disabled:opacity-50">
                                                        {sendingWa === b.id ? 'Mengirim...' : 'Kirim WA'}
                                                    </button>
                                                    <button onClick={() => {
                                                        const link = `${window.location.origin}/feedback?booking=${b.id}`;
                                                        navigator.clipboard.writeText(link);
                                                        toast.success('Link feedback disalin! Kirim ke customer via WA');
                                                    }} className="text-xs text-violet-600 hover:underline">
                                                        ⭐ Feedback
                                                    </button>
                                                    <button onClick={() => {
                                                        const link = `${window.location.origin}/reimbursement?booking=${b.id}`;
                                                        navigator.clipboard.writeText(link);
                                                        toast.success('Link reimbursement disalin! Kirim ke staff via WA');
                                                    }} className="text-xs text-emerald-600 hover:underline">
                                                        💸 Reimburse
                                                    </button>
                                                    <button onClick={() => handleDelete(b.id)}
                                                        className="text-xs text-red-500 hover:underline ml-auto">Hapus</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-gray-700">Pilih tanggal</p>
                                <p className="text-xs text-gray-400 mt-1">Klik tanggal di kalender untuk melihat detail booking</p>
                            </div>
                        )}

                        {/* Summary */}
                        <div className="mt-6 pt-4 border-t border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Bulan Ini</p>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(STATUS_LABELS).map(([k, v]) => {
                                    const count = bookings.filter(b => b.status === k).length;
                                    if (!count) return null;
                                    return (
                                        <div key={k} className="bg-gray-50 rounded-lg p-2.5">
                                            <p className="text-lg font-bold text-gray-900">{count}</p>
                                            <p className="text-xs text-gray-500">{v}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="font-semibold text-gray-900">{editBooking ? 'Edit Booking' : 'Tambah Booking'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Customer *</label>
                                    <select value={form.customer_id} onChange={e => setForm(f => ({...f, customer_id: e.target.value}))} required
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                                        <option value="">Pilih customer...</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.nama} ({c.whatsapp_id})</option>)}
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Paket</label>
                                    <select value={form.package_id} onChange={e => setForm(f => ({...f, package_id: e.target.value}))}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                                        <option value="">Pilih paket...</option>
                                        {packages.map(p => <option key={p.id} value={p.id}>{p.nama} — Rp {Number(p.harga).toLocaleString('id')}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tanggal *</label>
                                    <input type="date" value={form.tanggal} onChange={e => setForm(f => ({...f, tanggal: e.target.value}))} required
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Jam Mulai</label>
                                    <input type="time" value={form.jam_mulai} onChange={e => setForm(f => ({...f, jam_mulai: e.target.value}))}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Durasi (jam)</label>
                                    <input type="number" min="1" max="24" value={form.durasi_jam} onChange={e => setForm(f => ({...f, durasi_jam: e.target.value}))}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                                    <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                                        {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Acara</label>
                                    <input type="text" value={form.nama_acara} onChange={e => setForm(f => ({...f, nama_acara: e.target.value}))}
                                        placeholder="Wedding, Birthday, dll"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">DP Amount (Rp)</label>
                                    <input type="number" min="0" value={form.dp_amount} onChange={e => setForm(f => ({...f, dp_amount: e.target.value}))}
                                        placeholder="0"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Catatan</label>
                                    <textarea value={form.catatan} onChange={e => setForm(f => ({...f, catatan: e.target.value}))}
                                        rows={3} placeholder="Catatan tambahan..."
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition">
                                    Batal
                                </button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 bg-indigo-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-60">
                                    {saving ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <ConfirmModal config={confirmCfg} onClose={() => setConfirmCfg(null)} />
        </BackendLayout>
    );
}
