import { useEffect, useState } from 'react';
import BackendLayout from '@/layouts/BackendLayout';
import api from '@/api/axios';

export default function UploadFrame() {
    const [bookings,  setBookings]  = useState([]);
    const [selected,  setSelected]  = useState(null);
    const [file,      setFile]      = useState(null);
    const [preview,   setPreview]   = useState(null);
    const [uploading, setUploading] = useState(false);
    const [done,      setDone]      = useState(null);
    const [loading,   setLoading]   = useState(true);

    useEffect(() => {
        api.get('/bookings/form-submissions', { params: { status: 'dp_paid' } })
            .then(r => setBookings(r.data))
            .catch(() => setBookings([]))
            .finally(() => setLoading(false));
    }, []);

    const handleSelect = (id) => {
        const b = bookings.find(b => b.id === Number(id));
        setSelected(b ?? null);
        setFile(null);
        setPreview(null);
        setDone(null);
    };

    const handleFile = (f) => {
        if (!f) return;
        setFile(f);
        setPreview(URL.createObjectURL(f));
        setDone(null);
    };

    const handleUpload = async () => {
        if (!selected || !file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('image', file);
            await api.post(`/bookings/${selected.id}/frame-design`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setDone(selected.customer.nama);
            setFile(null);
            setPreview(null);
            setSelected(null);
            // refresh list
            const r = await api.get('/bookings/form-submissions', { params: { status: 'dp_paid' } });
            setBookings(r.data);
        } catch {
            alert('Gagal upload, coba lagi ya.');
        } finally {
            setUploading(false);
        }
    };

    const acara = selected
        ? new Date(selected.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;

    return (
        <BackendLayout>
            <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-12 pb-16 px-4">
                <div className="w-full max-w-lg space-y-5">

                    {/* Header */}
                    <div className="text-center">
                        <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center text-2xl mx-auto mb-3">🎨</div>
                        <h1 className="text-xl font-bold text-gray-900">Upload Design Frame</h1>
                        <p className="text-sm text-gray-500 mt-1">Pilih customer, upload desain, langsung dikirim ke WA mereka.</p>
                    </div>

                    {/* Success banner */}
                    {done && (
                        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-2xl text-sm">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Desain untuk <strong>{done}</strong> berhasil dikirim via WhatsApp! 🎉</span>
                        </div>
                    )}

                    {/* Main card */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

                        {/* Step 1 — Pilih Customer */}
                        <div className="px-6 pt-6 pb-5">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</div>
                                <p className="text-sm font-semibold text-gray-800">Pilih Customer</p>
                            </div>

                            {loading ? (
                                <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                    </svg>
                                    Memuat daftar customer...
                                </div>
                            ) : bookings.length === 0 ? (
                                <div className="bg-gray-50 rounded-2xl px-4 py-5 text-center">
                                    <p className="text-3xl mb-2">📭</p>
                                    <p className="text-sm text-gray-500 font-medium">Belum ada customer yang sudah DP</p>
                                    <p className="text-xs text-gray-400 mt-1">Customer akan muncul di sini setelah membayar DP</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {bookings.map(b => {
                                        const isActive   = selected?.id === b.id;
                                        const hasDesign  = !!b.frame_design_url;
                                        const tgl = new Date(b.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                                        return (
                                            <button key={b.id} type="button" onClick={() => handleSelect(b.id)}
                                                className={`w-full text-left px-4 py-3.5 rounded-2xl border-2 transition-all ${
                                                    isActive
                                                        ? 'border-violet-500 bg-violet-50'
                                                        : 'border-gray-100 bg-gray-50 hover:border-violet-200'
                                                }`}>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className={`text-sm font-semibold ${isActive ? 'text-violet-800' : 'text-gray-800'}`}>
                                                            {b.customer.nama}
                                                        </p>
                                                        <p className={`text-xs mt-0.5 ${isActive ? 'text-violet-500' : 'text-gray-400'}`}>
                                                            {b.nama_acara} · {tgl}
                                                        </p>
                                                        <p className={`text-xs ${isActive ? 'text-violet-400' : 'text-gray-400'}`}>
                                                            {b.no_whatsapp} · Frame {b.frame?.toUpperCase()}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-3">
                                                        {isActive && (
                                                            <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                                                                </svg>
                                                            </div>
                                                        )}
                                                        {hasDesign && (
                                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                                                ✓ Ada desain
                                                            </span>
                                                        )}
                                                        {b.frame_design_reference && (
                                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                                                Ada referensi
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-gray-100" />

                        {/* Step 2 — Upload */}
                        <div className={`px-6 pt-5 pb-6 transition-opacity ${!selected ? 'opacity-40 pointer-events-none' : ''}`}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${selected ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-400'}`}>2</div>
                                <p className="text-sm font-semibold text-gray-800">Upload Desain</p>
                            </div>

                            {/* Customer info pill */}
                            {selected && (
                                <div className="flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-xl px-3 py-2 mb-4">
                                    <div className="w-7 h-7 rounded-full bg-violet-200 flex items-center justify-center text-xs font-bold text-violet-700 flex-shrink-0">
                                        {selected.customer.nama?.[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-violet-800 truncate">{selected.customer.nama}</p>
                                        <p className="text-[11px] text-violet-500">{selected.nama_acara} · {acara}</p>
                                    </div>
                                    {selected.frame_design_reference && (
                                        <div className="flex-shrink-0 max-w-[140px]">
                                            <p className="text-[10px] text-amber-600 font-semibold">Referensi:</p>
                                            <p className="text-[10px] text-amber-700 truncate">{selected.frame_design_reference}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Drop zone */}
                            <label className={`block relative rounded-2xl border-2 border-dashed overflow-hidden cursor-pointer transition-all ${
                                preview
                                    ? 'border-violet-400 bg-violet-50'
                                    : 'border-gray-200 hover:border-violet-300 hover:bg-gray-50'
                            }`}>
                                {preview ? (
                                    <div className="relative">
                                        <img src={preview} alt="preview" className="w-full max-h-64 object-contain bg-gray-100" />
                                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition flex items-center justify-center">
                                            <span className="opacity-0 hover:opacity-100 bg-white text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow transition">
                                                Ganti gambar
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-xl">🖼️</div>
                                        <div className="text-center">
                                            <p className="text-sm font-semibold text-gray-700">Klik untuk pilih gambar</p>
                                            <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WEBP · Maks. 5MB</p>
                                        </div>
                                    </div>
                                )}
                                <input type="file" accept="image/*" className="hidden"
                                    onChange={e => handleFile(e.target.files[0])} />
                            </label>

                            {/* Upload button */}
                            <button onClick={handleUpload}
                                disabled={!selected || !file || uploading}
                                className="mt-4 w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 8px 24px rgba(124,58,237,0.3)' }}>
                                {uploading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                        </svg>
                                        Mengupload & mengirim ke WA...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.524 5.847L.057 23.882l6.178-1.625A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.651-.5-5.178-1.372l-.372-.22-3.668.964.981-3.582-.242-.381A9.97 9.97 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                                        </svg>
                                        Kirim ke WhatsApp Customer
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    <p className="text-center text-xs text-gray-400">
                        Desain langsung dikirim ke WhatsApp customer setelah upload ✓
                    </p>
                </div>
            </div>
        </BackendLayout>
    );
}
