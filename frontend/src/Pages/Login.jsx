import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
    const { login } = useAuth();
    const navigate   = useNavigate();
    const [form, setForm]       = useState({ email: '', password: '' });
    const [error, setError]     = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(form.email, form.password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Email atau password salah.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left panel */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 flex-col justify-between p-12">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-lg">📸</div>
                    <span className="text-white font-bold text-lg tracking-tight">Poonya Bot</span>
                </div>
                <div>
                    <h2 className="text-4xl font-bold text-white leading-tight mb-4">
                        Kelola percakapan<br />pelanggan dengan mudah
                    </h2>
                    <p className="text-indigo-200 text-base leading-relaxed">
                        Monitor chat WhatsApp, balas otomatis dengan AI, dan atur semua konfigurasi dari satu dashboard.
                    </p>
                    <div className="mt-10 flex gap-4">
                        <div className="bg-white/10 rounded-2xl px-5 py-4 backdrop-blur-sm">
                            <p className="text-2xl font-bold text-white">AI</p>
                            <p className="text-indigo-200 text-xs mt-1">Auto Reply</p>
                        </div>
                        <div className="bg-white/10 rounded-2xl px-5 py-4 backdrop-blur-sm">
                            <p className="text-2xl font-bold text-white">WA</p>
                            <p className="text-indigo-200 text-xs mt-1">Cloud API</p>
                        </div>
                        <div className="bg-white/10 rounded-2xl px-5 py-4 backdrop-blur-sm">
                            <p className="text-2xl font-bold text-white">24/7</p>
                            <p className="text-indigo-200 text-xs mt-1">Online</p>
                        </div>
                    </div>
                </div>
                <p className="text-indigo-300 text-sm">© 2025 Poonya Bot</p>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
                <div className="w-full max-w-md">
                    <div className="lg:hidden flex items-center gap-2 mb-10">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-base">📸</div>
                        <span className="font-bold text-gray-800">Poonya Bot</span>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Selamat datang</h1>
                    <p className="text-gray-500 text-sm mb-8">Masuk ke dashboard admin</p>

                    {error && (
                        <div className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                placeholder="admin@example.com"
                                required
                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                placeholder="••••••••"
                                required
                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60 transition-all shadow-sm shadow-indigo-200 mt-2"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    Masuk...
                                </span>
                            ) : 'Masuk'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
