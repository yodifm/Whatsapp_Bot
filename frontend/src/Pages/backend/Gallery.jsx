import { useEffect, useState } from 'react';
import BackendLayout from '@/layouts/BackendLayout';
import api from '@/api/axios';

const KATEGORI_LABELS = {
    wedding:   'Wedding',
    birthday:  'Birthday',
    corporate: 'Corporate',
    other:     'Lainnya',
};

const KATEGORI_COLORS = {
    wedding:   'bg-pink-100 text-pink-700',
    birthday:  'bg-yellow-100 text-yellow-700',
    corporate: 'bg-blue-100 text-blue-700',
    other:     'bg-gray-100 text-gray-700',
};

export default function Gallery() {
    const [photos,      setPhotos]      = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [uploading,   setUploading]   = useState(false);
    const [filterKat,   setFilterKat]   = useState('');
    const [lightbox,    setLightbox]    = useState(null);
    const [editPhoto,   setEditPhoto]   = useState(null);
    const [showEdit,    setShowEdit]    = useState(false);
    const [editForm,    setEditForm]    = useState({ judul: '', kategori: '', deskripsi: '', aktif: true });
    const [error,       setError]       = useState('');

    const [uploadForm, setUploadForm] = useState({
        judul: '', kategori: 'other', deskripsi: '',
    });
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        api.get('/gallery').then(r => setPhotos(r.data)).finally(() => setLoading(false));
    }, []);

    const filtered = filterKat ? photos.filter(p => p.kategori === filterKat) : photos;

    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        setFile(f);
        const url = URL.createObjectURL(f);
        setPreview(url);
        if (!uploadForm.judul) {
            setUploadForm(u => ({ ...u, judul: f.name.replace(/\.[^/.]+$/, '') }));
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;
        setUploading(true); setError('');
        try {
            const fd = new FormData();
            fd.append('foto', file);
            fd.append('judul', uploadForm.judul);
            fd.append('kategori', uploadForm.kategori);
            if (uploadForm.deskripsi) fd.append('deskripsi', uploadForm.deskripsi);

            const { data } = await api.post('/gallery', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setPhotos(ps => [data, ...ps]);
            setFile(null); setPreview(null);
            setUploadForm({ judul: '', kategori: 'other', deskripsi: '' });
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal upload foto');
        } finally {
            setUploading(false);
        }
    };

    const openEdit = (photo) => {
        setEditPhoto(photo);
        setEditForm({ judul: photo.judul, kategori: photo.kategori, deskripsi: photo.deskripsi ?? '', aktif: photo.aktif });
        setShowEdit(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.put(`/gallery/${editPhoto.id}`, editForm);
            setPhotos(ps => ps.map(p => p.id === data.id ? data : p));
            setShowEdit(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus foto ini?')) return;
        await api.delete(`/gallery/${id}`);
        setPhotos(ps => ps.filter(p => p.id !== id));
        if (lightbox?.id === id) setLightbox(null);
    };

    const toggleAktif = async (photo) => {
        const { data } = await api.put(`/gallery/${photo.id}`, { aktif: !photo.aktif });
        setPhotos(ps => ps.map(p => p.id === data.id ? data : p));
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
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-gray-900">Galeri Foto</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Kelola portofolio foto studio untuk referensi customer</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Upload Panel */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20">
                            <h2 className="font-semibold text-gray-900 mb-4 text-sm">Upload Foto Baru</h2>

                            {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>}

                            <form onSubmit={handleUpload} className="space-y-3">
                                {/* Drop zone */}
                                <label className={`block border-2 border-dashed rounded-xl cursor-pointer transition overflow-hidden
                                    ${preview ? 'border-indigo-300' : 'border-gray-200 hover:border-indigo-300'}`}>
                                    {preview ? (
                                        <div className="relative">
                                            <img src={preview} alt="preview" className="w-full h-40 object-cover" />
                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                                                <span className="text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-lg">Ganti foto</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-40 flex flex-col items-center justify-center gap-2 text-gray-400">
                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-xs">Klik untuk pilih foto</p>
                                            <p className="text-[11px] text-gray-300">JPG, PNG, max 5MB</p>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                                </label>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Judul *</label>
                                    <input value={uploadForm.judul} onChange={e => setUploadForm(u => ({...u, judul: e.target.value}))} required
                                        placeholder="Judul foto"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Kategori</label>
                                    <select value={uploadForm.kategori} onChange={e => setUploadForm(u => ({...u, kategori: e.target.value}))}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                                        {Object.entries(KATEGORI_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Deskripsi</label>
                                    <textarea value={uploadForm.deskripsi} onChange={e => setUploadForm(u => ({...u, deskripsi: e.target.value}))}
                                        rows={2} placeholder="Opsional..."
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
                                </div>

                                <button type="submit" disabled={uploading || !file}
                                    className="w-full bg-indigo-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    {uploading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                            Upload Foto
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Stats */}
                            <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-2 gap-2">
                                {Object.entries(KATEGORI_LABELS).map(([k, v]) => {
                                    const count = photos.filter(p => p.kategori === k).length;
                                    if (!count) return null;
                                    return (
                                        <button key={k} onClick={() => setFilterKat(filterKat === k ? '' : k)}
                                            className={`rounded-lg p-2.5 text-left transition ${filterKat === k ? 'ring-2 ring-indigo-400' : 'hover:bg-gray-50'}`}>
                                            <p className="text-lg font-bold text-gray-900">{count}</p>
                                            <p className="text-xs text-gray-500">{v}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Gallery Grid */}
                    <div className="lg:col-span-2">
                        {/* Filter chips */}
                        <div className="flex gap-2 mb-4 flex-wrap">
                            <button onClick={() => setFilterKat('')}
                                className={`text-xs font-medium px-3 py-1.5 rounded-full transition ${!filterKat ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                Semua ({photos.length})
                            </button>
                            {Object.entries(KATEGORI_LABELS).map(([k, v]) => {
                                const count = photos.filter(p => p.kategori === k).length;
                                if (!count) return null;
                                return (
                                    <button key={k} onClick={() => setFilterKat(filterKat === k ? '' : k)}
                                        className={`text-xs font-medium px-3 py-1.5 rounded-full transition ${filterKat === k ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                        {v} ({count})
                                    </button>
                                );
                            })}
                        </div>

                        {filtered.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                                <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-gray-400">Belum ada foto. Upload foto pertama kamu!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {filtered.map(photo => (
                                    <div key={photo.id}
                                        className={`group relative bg-gray-100 rounded-xl overflow-hidden aspect-square cursor-pointer transition ${!photo.aktif ? 'opacity-50' : ''}`}>
                                        <img src={photo.thumbnail_url || photo.url}
                                            alt={photo.judul}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onClick={() => setLightbox(photo)} />

                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                        {/* Category badge */}
                                        <div className="absolute top-2 left-2">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${KATEGORI_COLORS[photo.kategori]}`}>
                                                {KATEGORI_LABELS[photo.kategori]}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5 justify-end">
                                            <button onClick={(e) => { e.stopPropagation(); toggleAktif(photo); }}
                                                title={photo.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                                                className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center hover:bg-white transition">
                                                <svg className={`w-3.5 h-3.5 ${photo.aktif ? 'text-green-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); openEdit(photo); }}
                                                className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center hover:bg-white transition">
                                                <svg className="w-3.5 h-3.5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                                                className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center hover:bg-white transition">
                                                <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Title */}
                                        <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <p className="text-white text-xs font-medium truncate drop-shadow">{photo.judul}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            {lightbox && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
                    onClick={() => setLightbox(null)}>
                    <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <img src={lightbox.url} alt={lightbox.judul}
                        className="max-w-full max-h-[85vh] object-contain rounded-lg"
                        onClick={e => e.stopPropagation()} />
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
                        <p className="text-white font-medium text-sm">{lightbox.judul}</p>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full mt-1 inline-block ${KATEGORI_COLORS[lightbox.kategori]}`}>
                            {KATEGORI_LABELS[lightbox.kategori]}
                        </span>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEdit && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="font-semibold text-gray-900">Edit Foto</h2>
                            <button onClick={() => setShowEdit(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Judul</label>
                                <input value={editForm.judul} onChange={e => setEditForm(f => ({...f, judul: e.target.value}))}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Kategori</label>
                                <select value={editForm.kategori} onChange={e => setEditForm(f => ({...f, kategori: e.target.value}))}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                                    {Object.entries(KATEGORI_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Deskripsi</label>
                                <textarea value={editForm.deskripsi} onChange={e => setEditForm(f => ({...f, deskripsi: e.target.value}))}
                                    rows={3}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={editForm.aktif} onChange={e => setEditForm(f => ({...f, aktif: e.target.checked}))}
                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                                <span className="text-sm text-gray-700">Tampilkan di galeri (aktif)</span>
                            </label>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowEdit(false)}
                                    className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50">
                                    Batal
                                </button>
                                <button type="submit"
                                    className="flex-1 bg-indigo-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-indigo-700">
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </BackendLayout>
    );
}
