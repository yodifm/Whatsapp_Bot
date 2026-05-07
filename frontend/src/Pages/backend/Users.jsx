import { useState, useEffect } from 'react';
import BackendLayout from '@/Layouts/BackendLayout';
import api from '@/api/axios';

const ROLES = [
    { value: 'admin',          label: 'Admin',           color: 'bg-indigo-100 text-indigo-700' },
    { value: 'staff_logistic', label: 'Staff Logistik',  color: 'bg-amber-100 text-amber-700'   },
    { value: 'staff_design',   label: 'Staff Design',    color: 'bg-pink-100 text-pink-700'     },
];

const EMPTY = { name: '', email: '', role: 'admin', password: '' };

function RoleBadge({ role }) {
    const r = ROLES.find(r => r.value === role);
    return (
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${r?.color ?? 'bg-gray-100 text-gray-600'}`}>
            {r?.label ?? role}
        </span>
    );
}

function Modal({ user, onClose, onSave }) {
    const isEdit = !!user?.id;
    const [form, setForm]     = useState(user ?? EMPTY);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [showPw, setShowPw] = useState(false);

    const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })); };

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true); setErrors({});
        try {
            const payload = { ...form };
            if (isEdit && !payload.password) delete payload.password;
            if (isEdit) {
                const r = await api.put(`/users/${user.id}`, payload);
                onSave(r.data, 'update');
            } else {
                const r = await api.post('/users', payload);
                onSave(r.data, 'create');
            }
        } catch (err) {
            if (err.response?.status === 422) setErrors(err.response.data.errors ?? {});
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{isEdit ? 'Edit User' : 'Tambah User'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={submit} className="px-6 py-5 space-y-4">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                        <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="John Doe"
                            className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
                        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name[0]}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@example.com"
                            className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
                        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email[0]}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select value={form.role} onChange={e => set('role', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition">
                            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password {isEdit && <span className="text-gray-400 font-normal">(kosongkan jika tidak diubah)</span>}
                        </label>
                        <div className="relative">
                            <input type={showPw ? 'text' : 'password'} value={form.password}
                                onChange={e => set('password', e.target.value)}
                                placeholder={isEdit ? '••••••••' : 'Min. 6 karakter'}
                                autoComplete="new-password"
                                className={`w-full rounded-xl border px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
                            <button type="button" onClick={() => setShowPw(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {showPw ? (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password[0]}</p>}
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose}
                            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                            Batal
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition">
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Users() {
    const [users,   setUsers]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal,   setModal]   = useState(null);
    const [deleting, setDeleting] = useState(null);

    useEffect(() => {
        api.get('/users')
            .then(r => setUsers(r.data))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = (user, mode) => {
        setUsers(prev => mode === 'create'
            ? [...prev, user]
            : prev.map(u => u.id === user.id ? user : u)
        );
        setModal(null);
    };

    const handleDelete = async (u) => {
        if (!confirm(`Hapus user "${u.name}"?`)) return;
        setDeleting(u.id);
        try {
            await api.delete(`/users/${u.id}`);
            setUsers(prev => prev.filter(x => x.id !== u.id));
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menghapus user.');
        } finally {
            setDeleting(null);
        }
    };

    return (
        <BackendLayout>
            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Manajemen User</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Kelola akses admin dan staff</p>
                    </div>
                    <button onClick={() => setModal({})}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah User
                    </button>
                </div>

                {/* Role legend */}
                <div className="flex flex-wrap gap-2 mb-5">
                    {ROLES.map(r => (
                        <div key={r.value} className="flex items-center gap-1.5">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${r.color}`}>{r.label}</span>
                            <span className="text-xs text-gray-400">
                                {r.value === 'admin'          && '— Akses penuh ke semua halaman'}
                                {r.value === 'staff_logistic' && '— Akses halaman logistik'}
                                {r.value === 'staff_design'   && '— Akses form booking & upload frame'}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 text-sm">Belum ada user.</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Bergabung</th>
                                    <th className="px-5 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                                                    {u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                                                </div>
                                                <span className="font-medium text-gray-900">{u.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-gray-500">{u.email}</td>
                                        <td className="px-5 py-3.5"><RoleBadge role={u.role} /></td>
                                        <td className="px-5 py-3.5 text-gray-400 text-xs">{u.created_at}</td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => setModal({ ...u, password: '' })}
                                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition">
                                                    Edit
                                                </button>
                                                <button onClick={() => handleDelete(u)} disabled={deleting === u.id}
                                                    className="text-xs font-medium text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                                                    {deleting === u.id ? '...' : 'Hapus'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {modal !== null && (
                <Modal user={modal?.id ? modal : null} onClose={() => setModal(null)} onSave={handleSave} />
            )}
        </BackendLayout>
    );
}
