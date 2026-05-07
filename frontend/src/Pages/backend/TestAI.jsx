import BackendLayout from '@/layouts/BackendLayout';
import { useState, useRef, useEffect } from 'react';
import api from '@/api/axios';

function Message({ msg }) {
    const isUser  = msg.role === 'user';
    const isError = msg.role === 'error';

    if (isError) {
        return (
            <div className="flex justify-center my-2">
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-2 rounded-full">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {msg.content}
                </div>
            </div>
        );
    }

    const AiAvatar = ({ label = 'AI' }) => (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[9px] font-bold mr-2 flex-shrink-0 self-end mb-1 shadow-sm">
            {label}
        </div>
    );

    if (msg.role === 'pricelist') {
        return (
            <div className="flex justify-start mb-4">
                <AiAvatar label={msg.aiLabel} />
                <div className="max-w-[72%] flex flex-col items-start">
                    <div className="bg-white rounded-2xl rounded-bl-md border border-gray-100 shadow-sm overflow-hidden">
                        <img src={msg.imageUrl} alt="Pricelist"
                            className="w-full max-w-xs object-contain cursor-pointer hover:opacity-95 transition"
                            onClick={() => window.open(msg.imageUrl, '_blank')} />
                        <div className="px-3 py-2 text-sm text-gray-700 border-t border-gray-100">
                            {msg.content}
                        </div>
                    </div>
                    <span className="text-[11px] text-gray-400 mt-1 px-1">{msg.time}</span>
                </div>
            </div>
        );
    }

    if (msg.role === 'system-info') {
        return (
            <div className="flex justify-center my-3">
                <span className="text-[11px] text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{msg.content}</span>
            </div>
        );
    }

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
            {!isUser && <AiAvatar label={msg.aiLabel ?? 'AI'} />}
            <div className={`max-w-[72%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                    isUser
                        ? 'bg-indigo-600 text-white rounded-2xl rounded-br-md'
                        : 'bg-white text-gray-800 rounded-2xl rounded-bl-md border border-gray-100'
                }`}>
                    {msg.content}
                </div>
                <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-[11px] text-gray-400">{msg.time}</span>
                    {msg.model && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            msg.model.includes('haiku')
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-indigo-50 text-indigo-600'
                        }`}>
                            {msg.model.includes('haiku') ? 'Haiku' : 'Sonnet'}
                        </span>
                    )}
                    {msg.usage && (
                        <span className="text-[10px] text-gray-300">
                            {msg.usage.input_tokens}↑ {msg.usage.output_tokens}↓ tok
                        </span>
                    )}
                </div>
            </div>
            {isUser && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold ml-2 flex-shrink-0 self-end mb-1">
                    You
                </div>
            )}
        </div>
    );
}

function TypingIndicator({ aiLabel = 'AI' }) {
    return (
        <div className="flex justify-start mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[9px] font-bold mr-2 flex-shrink-0 self-end mb-1 shadow-sm">
                {aiLabel}
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
}

const QUICK_PROMPTS = [
    'Halo, ada paket apa aja?',
    'Berapa harga paket termurah?',
    'Gimana cara booking?',
    'Apa aja yang termasuk dalam paket?',
];

function nowTime() {
    return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function TestAI() {
    const [messages, setMessages]     = useState([]);
    const [input, setInput]           = useState('');
    const [loading, setLoading]       = useState(false);
    const [kiosks, setKiosks]         = useState([]);
    const [selectedKiosk, setSelected] = useState(null); // null = global
    const bottomRef                   = useRef(null);
    const inputRef                    = useRef(null);

    useEffect(() => {
        api.get('/kiosks').then(r => setKiosks(r.data)).catch(() => {});
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const activeKiosk  = kiosks.find(k => k.id === selectedKiosk) ?? null;
    const aiLabel      = activeKiosk?.ai_name?.slice(0, 3) ?? 'AI';
    const contextLabel = activeKiosk ? activeKiosk.nama : 'Global (default)';

    const history = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }));

    const switchKiosk = (kioskId) => {
        if (kioskId === selectedKiosk) return;
        setSelected(kioskId);
        if (messages.length > 0) {
            const label = kioskId
                ? kiosks.find(k => k.id === kioskId)?.nama ?? 'Kiosk'
                : 'Global (default)';
            setMessages(prev => [
                ...prev,
                { role: 'system-info', content: `Konteks diganti ke: ${label} — percakapan baru dimulai`, time: nowTime() },
            ]);
            // Reset history so new context starts fresh
            setMessages(prev => [prev[prev.length - 1]]);
        }
    };

    const send = async (text) => {
        const msg = text.trim();
        if (!msg || loading) return;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: msg, time: nowTime() }]);
        setLoading(true);

        try {
            const r = await api.post('/test-ai', {
                message:  msg,
                history,
                kiosk_id: selectedKiosk ?? null,
            });
            const newMsgs = [];

            if (r.data.pricelist_url) {
                newMsgs.push({
                    role:     'pricelist',
                    content:  'Berikut pricelist kami, apabila ada pertanyaan silakan yaa kak☺️',
                    imageUrl: r.data.pricelist_url,
                    aiLabel,
                    time:     nowTime(),
                });
            }

            newMsgs.push({
                role:    'assistant',
                content: r.data.reply,
                model:   r.data.model,
                usage:   r.data.usage,
                aiLabel,
                time:    nowTime(),
            });
            setMessages(prev => [...prev, ...newMsgs]);
        } catch (err) {
            const errMsg = err.response?.data?.error || 'Gagal menghubungi AI. Pastikan API Key sudah diset di Settings.';
            setMessages(prev => [...prev, { role: 'error', content: errMsg }]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send(input);
        }
    };

    const reset = () => {
        setMessages([]);
        setInput('');
        inputRef.current?.focus();
    };

    return (
        <BackendLayout>
            <div className="h-[calc(100vh-56px)] flex flex-col">
                <div className="flex-1 overflow-hidden mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex h-full flex-col rounded-2xl overflow-hidden shadow-sm border border-gray-200 bg-white">

                        {/* Header */}
                        <div className="px-5 py-3 border-b border-gray-100 bg-white">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm flex-shrink-0">
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm">Test AI Bot</p>
                                        <p className="text-xs text-gray-400">
                                            Konteks aktif: <span className="font-medium text-indigo-600">{contextLabel}</span>
                                            {activeKiosk?.ai_name && (
                                                <span className="text-gray-400"> · AI: {activeKiosk.ai_name}</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {messages.length > 0 && (
                                        <button onClick={reset}
                                            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Reset
                                        </button>
                                    )}
                                    <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
                                        Sandbox
                                    </span>
                                </div>
                            </div>

                            {/* Kiosk selector */}
                            <div className="flex gap-2 overflow-x-auto pb-0.5">
                                <button
                                    onClick={() => switchKiosk(null)}
                                    className={`flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition font-medium ${
                                        selectedKiosk === null
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                    }`}>
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                                    </svg>
                                    Global
                                </button>

                                {kiosks.map(k => (
                                    <button
                                        key={k.id}
                                        onClick={() => switchKiosk(k.id)}
                                        className={`flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition font-medium ${
                                            selectedKiosk === k.id
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${k.aktif ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                                        {k.nama}
                                        {k.ai_name && (
                                            <span className={`${selectedKiosk === k.id ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                · {k.ai_name}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-5 py-5 bg-gray-50/50">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <p className="font-semibold text-gray-700 text-sm mb-1">Mulai percakapan</p>
                                    <p className="text-xs text-gray-400 mb-1">
                                        Testing sebagai: <span className="font-medium text-indigo-600">{contextLabel}</span>
                                    </p>
                                    <p className="text-xs text-gray-400 mb-6">Coba kirim pesan seperti customer WhatsApp kamu</p>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {QUICK_PROMPTS.map(p => (
                                            <button key={p} onClick={() => send(p)}
                                                className="text-xs bg-white border border-gray-200 hover:border-indigo-400 hover:text-indigo-600 text-gray-600 px-3 py-2 rounded-xl transition shadow-sm">
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
                            {loading && <TypingIndicator aiLabel={aiLabel} />}
                            <div ref={bottomRef} />
                        </div>

                        {/* Quick prompts row (after first message) */}
                        {messages.length > 0 && !loading && (
                            <div className="px-4 py-2 border-t border-gray-100 bg-white flex gap-2 overflow-x-auto">
                                {QUICK_PROMPTS.map(p => (
                                    <button key={p} onClick={() => send(p)}
                                        className="flex-shrink-0 text-xs bg-gray-50 border border-gray-200 hover:border-indigo-400 hover:text-indigo-600 text-gray-500 px-3 py-1.5 rounded-lg transition">
                                        {p}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        <div className="px-4 py-3 border-t border-gray-100 bg-white">
                            <div className="flex items-end gap-2">
                                <textarea
                                    ref={inputRef}
                                    rows={1}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={`Ketik pesan sebagai customer... (Enter untuk kirim)`}
                                    className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white focus:border-transparent transition max-h-32"
                                    style={{ height: 'auto' }}
                                    onInput={e => {
                                        e.target.style.height = 'auto';
                                        e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                                    }}
                                />
                                <button
                                    onClick={() => send(input)}
                                    disabled={!input.trim() || loading}
                                    className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition active:scale-95">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                    </svg>
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1.5 text-center">
                                Shift+Enter untuk baris baru · Pakai selector di atas untuk ganti konteks kiosk
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </BackendLayout>
    );
}
