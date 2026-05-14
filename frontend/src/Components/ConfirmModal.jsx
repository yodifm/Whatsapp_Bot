import { createPortal } from 'react-dom';
import { useEffect, useRef } from 'react';

/**
 * Usage:
 *   const [confirm, setConfirm] = useState(null);
 *   // trigger:
 *   setConfirm({ title: 'Hapus?', message: 'Data tidak bisa dikembalikan.', onConfirm: () => { ... } });
 *   // in JSX:
 *   <ConfirmModal config={confirm} onClose={() => setConfirm(null)} />
 */
export default function ConfirmModal({ config, onClose }) {
    const btnRef = useRef(null);

    useEffect(() => {
        if (config) btnRef.current?.focus();
    }, [config]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        if (config) window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [config, onClose]);

    if (!config) return null;

    const {
        title      = 'Konfirmasi',
        message    = 'Yakin ingin melanjutkan?',
        confirmText = 'Ya, lanjutkan',
        cancelText  = 'Batal',
        variant     = 'danger',
        onConfirm,
    } = config;

    const confirmStyles = variant === 'danger'
        ? 'bg-red-600 hover:bg-red-700 text-white'
        : 'bg-sky-600 hover:bg-sky-700 text-white';

    const handleConfirm = () => {
        onClose();
        onConfirm?.();
    };

    return createPortal(
        <div className="fixed inset-0 z-[9998] flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fadeIn"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-scaleIn">
                <div className="flex items-start gap-4">
                    {variant === 'danger' ? (
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round"
                                    d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                        </div>
                    ) : (
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round"
                                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                        <p className="mt-1 text-sm text-gray-500">{message}</p>
                    </div>
                </div>
                <div className="mt-5 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        ref={btnRef}
                        onClick={handleConfirm}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${confirmStyles}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
