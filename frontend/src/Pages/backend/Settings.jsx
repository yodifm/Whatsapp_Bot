import BackendLayout from '@/layouts/BackendLayout';
import { useState, useEffect } from 'react';
import api from '@/api/axios';

const SECTIONS = [
    {
        title: 'Claude AI (Anthropic)',
        description: 'API Key untuk mengaktifkan balasan otomatis berbasis AI.',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
        color: 'bg-violet-50 text-violet-600',
        fields: [
            { key: 'anthropic_api_key', label: 'API Key', placeholder: 'sk-ant-api03-...', hint: 'Dapatkan di console.anthropic.com' },
        ],
    },
    {
        title: 'WhatsApp Cloud API (Meta)',
        description: 'Kredensial untuk mengirim dan menerima pesan WhatsApp.',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
        ),
        color: 'bg-emerald-50 text-emerald-600',
        fields: [
            { key: 'wa_access_token',    label: 'Access Token',     placeholder: 'EAAxxxxxxxxxxxxxxxx...', hint: 'Dari Meta Developer → WhatsApp → API Setup' },
            { key: 'wa_phone_number_id', label: 'Phone Number ID',  placeholder: '12345678901234',        hint: 'Phone Number ID (bukan nomor telepon)', type: 'text' },
            { key: 'wa_verify_token',    label: 'Verify Token',     placeholder: 'token-rahasia-kamu',    hint: 'Token yang kamu daftarkan di Meta Webhook' },
        ],
    },
];

function SettingField({ field, value, onChange, error }) {
    const [show, setShow] = useState(false);
    const isSet = value && value.length > 0;
    const isText = field.type === 'text';

    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">{field.label}</label>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    isSet ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}>
                    {isSet ? '✓ Tersimpan' : 'Belum diisi'}
                </span>
            </div>
            <div className="relative">
                <input
                    type={isText ? 'text' : show ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    autoComplete="new-password"
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-white shadow-sm
                        focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition
                        ${error ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                        ${!isText ? 'pr-10' : ''}`}
                />
                {!isText && (
                    <button
                        type="button"
                        onClick={() => setShow(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    >
                        {show ? (
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
                )}
            </div>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            <p className="mt-1.5 text-xs text-gray-400">{field.hint}</p>
        </div>
    );
}

const DEFAULT_FOLLOWUP_MSG = 'Halo Kak 👋 Masih ada yang bisa kami bantu? Kami siap membantu Kakak menemukan paket photobooth yang pas 😊';

export default function Settings() {
    const [data, setData]             = useState({
        anthropic_api_key:    '',
        wa_access_token:      '',
        wa_phone_number_id:   '',
        wa_verify_token:      '',
        followup_enabled:     false,
        followup_delay_hours: 3,
        followup_message:     DEFAULT_FOLLOWUP_MSG,
        ai_name:              'Nadia',
        studio_name:          'Photobooth Studio',
        ai_tone:              'sales',
    });
    const [errors, setErrors]         = useState({});
    const [processing, setProcessing] = useState(false);
    const [flash, setFlash]           = useState('');

    useEffect(() => {
        api.get('/settings').then(r => {
            setData({
                anthropic_api_key:    r.data.anthropic_api_key    ?? '',
                wa_access_token:      r.data.wa_access_token      ?? '',
                wa_phone_number_id:   r.data.wa_phone_number_id   ?? '',
                wa_verify_token:      r.data.wa_verify_token      ?? '',
                followup_enabled:     r.data.followup_enabled     ?? false,
                followup_delay_hours: r.data.followup_delay_hours ?? 3,
                followup_message:     r.data.followup_message      || DEFAULT_FOLLOWUP_MSG,
                ai_name:              r.data.ai_name               || 'Nadia',
                studio_name:          r.data.studio_name           || 'Photobooth Studio',
                ai_tone:              r.data.ai_tone               || 'sales',
            });
        });
    }, []);

    const handleChange = (key, value) => setData(prev => ({ ...prev, [key]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        setFlash('');
        try {
            await api.post('/settings', {
                ...data,
                followup_enabled: data.followup_enabled ? 1 : 0,
            });
            setFlash('Pengaturan berhasil disimpan.');
            setTimeout(() => setFlash(''), 4000);
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors ?? {});
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <BackendLayout>
            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">

                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900">Settings</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Kelola API key dan konfigurasi integrasi.</p>
                </div>

                {flash && (
                    <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {flash}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {SECTIONS.map((section) => (
                        <div key={section.title} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${section.color}`}>
                                    {section.icon}
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">{section.description}</p>
                                </div>
                            </div>
                            <div className="px-5 py-5 space-y-5">
                                {section.fields.map((field) => (
                                    <SettingField
                                        key={field.key}
                                        field={field}
                                        value={data[field.key]}
                                        onChange={handleChange}
                                        error={errors[field.key]}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Persona AI Section */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">Persona AI</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Kustomisasi identitas dan gaya bicara AI.</p>
                            </div>
                        </div>
                        <div className="px-5 py-5 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama AI</label>
                                    <input
                                        value={data.ai_name}
                                        onChange={e => handleChange('ai_name', e.target.value)}
                                        placeholder="Nadia"
                                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                                    />
                                    <p className="mt-1 text-xs text-gray-400">Nama yang dipakai AI saat memperkenalkan diri</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Studio</label>
                                    <input
                                        value={data.studio_name}
                                        onChange={e => handleChange('studio_name', e.target.value)}
                                        placeholder="Photobooth Studio"
                                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                                    />
                                    <p className="mt-1 text-xs text-gray-400">Nama bisnis yang disebut AI ke customer</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Gaya Bicara (Tone)</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: 'sales',    label: 'Sales',    desc: 'Fokus closing, persuasif', emoji: '🎯' },
                                        { value: 'friendly', label: 'Friendly', desc: 'Santai, seperti teman',    emoji: '😊' },
                                        { value: 'formal',   label: 'Formal',   desc: 'Profesional, baku',       emoji: '💼' },
                                    ].map(t => (
                                        <button key={t.value} type="button"
                                            onClick={() => handleChange('ai_tone', t.value)}
                                            className={`flex flex-col items-center p-3 rounded-xl border-2 transition text-center ${
                                                data.ai_tone === t.value
                                                    ? 'border-indigo-500 bg-indigo-50'
                                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                            }`}>
                                            <span className="text-lg mb-1">{t.emoji}</span>
                                            <span className={`text-xs font-semibold ${data.ai_tone === t.value ? 'text-indigo-700' : 'text-gray-700'}`}>{t.label}</span>
                                            <span className="text-[10px] text-gray-400 mt-0.5">{t.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Follow-up Section */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">Auto Follow-up</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Kirim pesan otomatis ke customer yang tidak membalas.</p>
                                </div>
                            </div>
                            {/* Toggle */}
                            <button
                                type="button"
                                onClick={() => handleChange('followup_enabled', !data.followup_enabled)}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                                    data.followup_enabled ? 'bg-indigo-600' : 'bg-gray-200'
                                }`}
                            >
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                                    data.followup_enabled ? 'translate-x-5' : 'translate-x-0'
                                }`} />
                            </button>
                        </div>

                        <div className={`px-5 py-5 space-y-5 transition-opacity ${data.followup_enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                            {/* Delay hours */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Kirim follow-up setelah tidak ada balasan selama
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        min={1}
                                        max={168}
                                        value={data.followup_delay_hours}
                                        onChange={e => handleChange('followup_delay_hours', parseInt(e.target.value) || 1)}
                                        className="w-24 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-center shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                                    />
                                    <span className="text-sm text-gray-500">jam</span>
                                    <div className="flex gap-1.5 ml-auto">
                                        {[1, 3, 6, 12, 24].map(h => (
                                            <button
                                                key={h}
                                                type="button"
                                                onClick={() => handleChange('followup_delay_hours', h)}
                                                className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                                                    data.followup_delay_hours === h
                                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                                        : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-400 hover:text-indigo-600'
                                                }`}
                                            >
                                                {h}j
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {errors.followup_delay_hours && (
                                    <p className="mt-1 text-xs text-red-600">{errors.followup_delay_hours}</p>
                                )}
                                <p className="mt-1.5 text-xs text-gray-400">
                                    Scheduler berjalan setiap 15 menit. Pastikan <code className="bg-gray-100 px-1 rounded">php artisan schedule:work</code> aktif di server.
                                </p>
                            </div>

                            {/* Message template */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-sm font-medium text-gray-700">Pesan Follow-up</label>
                                    <button
                                        type="button"
                                        onClick={() => handleChange('followup_message', DEFAULT_FOLLOWUP_MSG)}
                                        className="text-xs text-indigo-500 hover:text-indigo-700 transition"
                                    >
                                        Reset ke default
                                    </button>
                                </div>
                                <textarea
                                    rows={3}
                                    value={data.followup_message}
                                    onChange={e => handleChange('followup_message', e.target.value)}
                                    placeholder="Halo Kak 👋 Masih ada yang bisa kami bantu?"
                                    className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-white shadow-sm resize-none
                                        focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition
                                        ${errors.followup_message ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                />
                                {errors.followup_message && (
                                    <p className="mt-1 text-xs text-red-600">{errors.followup_message}</p>
                                )}
                                <p className="mt-1.5 text-xs text-gray-400">
                                    Pesan ini dikirim otomatis ke WhatsApp customer. Emoji diperbolehkan ✅
                                </p>
                            </div>

                            {/* Preview */}
                            {data.followup_message && (
                                <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                                    <p className="text-[11px] text-gray-400 mb-2 font-medium uppercase tracking-wide">Preview pesan</p>
                                    <div className="flex justify-start">
                                        <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-3.5 py-2.5 text-sm text-gray-800 shadow-sm max-w-xs">
                                            {data.followup_message}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <p className="text-xs text-gray-400">Kolom kosong tidak akan menghapus nilai tersimpan.</p>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200
                                hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                        >
                            {processing ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Simpan
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </BackendLayout>
    );
}
