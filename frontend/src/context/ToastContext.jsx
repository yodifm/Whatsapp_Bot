import { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

const ToastContext = createContext(null);

let nextId = 0;

function ToastItem({ toast, onRemove }) {
    const icons = {
        success: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
        ),
        error: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        ),
        warning: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
        ),
        info: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    };

    const styles = {
        success: 'bg-emerald-600 text-white',
        error:   'bg-red-600 text-white',
        warning: 'bg-amber-500 text-white',
        info:    'bg-sky-600 text-white',
    };

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium max-w-sm w-full
                animate-[slideIn_0.2s_ease] ${styles[toast.type] ?? styles.info}`}
        >
            {icons[toast.type]}
            <span className="flex-1">{toast.message}</span>
            <button onClick={() => onRemove(toast.id)} className="opacity-70 hover:opacity-100 transition-opacity ml-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const remove = useCallback((id) => {
        setToasts(ts => ts.filter(t => t.id !== id));
    }, []);

    const add = useCallback((message, type = 'info', duration = 3500) => {
        const id = ++nextId;
        setToasts(ts => [...ts, { id, message, type }]);
        if (duration > 0) {
            setTimeout(() => remove(id), duration);
        }
        return id;
    }, [remove]);

    const toast = {
        success: (msg, dur) => add(msg, 'success', dur),
        error:   (msg, dur) => add(msg, 'error',   dur),
        warning: (msg, dur) => add(msg, 'warning', dur),
        info:    (msg, dur) => add(msg, 'info',    dur),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            {createPortal(
                <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
                    {toasts.map(t => (
                        <div key={t.id} className="pointer-events-auto">
                            <ToastItem toast={t} onRemove={remove} />
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}
