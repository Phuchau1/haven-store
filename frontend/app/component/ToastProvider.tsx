'use client';
/**
 * ============================================================
 * GLOBAL TOAST & CONFIRM SYSTEM
 * Thay thế hoàn toàn window.alert() và window.confirm()
 * với thiết kế đẹp, mượt mà và premium.
 * ============================================================
 */
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, XCircle, AlertTriangle, Info,
    X, AlertCircle
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title?: string;
    message: string;
    duration?: number;
}

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
    showConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

// ─── Context ─────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Toast Icon Map ───────────────────────────────────────────────────────────
const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error:   <XCircle     className="w-5 h-5 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info:    <Info        className="w-5 h-5 text-blue-500 shrink-0" />,
};

const TOAST_STYLES: Record<ToastType, string> = {
    success: 'border-emerald-200 bg-white',
    error:   'border-rose-200 bg-white',
    warning: 'border-amber-200 bg-white',
    info:    'border-blue-200 bg-white',
};

const TOAST_BAR: Record<ToastType, string> = {
    success: 'bg-emerald-500',
    error:   'bg-rose-500',
    warning: 'bg-amber-500',
    info:    'bg-blue-500',
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [confirm, setConfirm] = useState<{
        options: ConfirmOptions;
        resolve: (val: boolean) => void;
    } | null>(null);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((
        message: string,
        type: ToastType = 'info',
        title?: string,
        duration = 4000
    ) => {
        const id = Math.random().toString(36).slice(2);
        setToasts(prev => [...prev, { id, type, message, title, duration }]);
        if (duration > 0) {
            setTimeout(() => removeToast(id), duration);
        }
    }, [removeToast]);

    const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise(resolve => {
            setConfirm({ options, resolve });
        });
    }, []);

    const handleConfirm = (result: boolean) => {
        confirm?.resolve(result);
        setConfirm(null);
    };

    return (
        <ToastContext.Provider value={{ showToast, showConfirm }}>
            {children}

            {/* ── Toast Stack ── */}
            <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-3 w-80 max-w-[calc(100vw-2.5rem)]">
                <AnimatePresence initial={false}>
                    {toasts.map(toast => (
                        <ToastItem
                            key={toast.id}
                            toast={toast}
                            onClose={() => removeToast(toast.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* ── Confirm Dialog ── */}
            <AnimatePresence>
                {confirm && (
                    <ConfirmDialog
                        options={confirm.options}
                        onConfirm={() => handleConfirm(true)}
                        onCancel={() => handleConfirm(false)}
                    />
                )}
            </AnimatePresence>
        </ToastContext.Provider>
    );
}

// ─── Toast Item Component ─────────────────────────────────────────────────────
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const barRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!barRef.current || !toast.duration) return;
        const el = barRef.current;
        el.style.transition = `width ${toast.duration}ms linear`;
        requestAnimationFrame(() => { el.style.width = '0%'; });
    }, [toast.duration]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`relative rounded-2xl border shadow-xl overflow-hidden ${TOAST_STYLES[toast.type]}`}
        >
            {/* Progress bar */}
            {toast.duration && toast.duration > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100">
                    <div
                        ref={barRef}
                        style={{ width: '100%' }}
                        className={`h-full ${TOAST_BAR[toast.type]}`}
                    />
                </div>
            )}

            <div className="flex items-start gap-3 p-4 pb-5">
                {TOAST_ICONS[toast.type]}
                <div className="flex-1 min-w-0">
                    {toast.title && (
                        <p className="font-bold text-slate-900 text-sm mb-0.5">{toast.title}</p>
                    )}
                    <p className="text-slate-600 text-xs leading-relaxed">{toast.message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        </motion.div>
    );
}

// ─── Confirm Dialog Component ─────────────────────────────────────────────────
const CONFIRM_ICONS: Record<string, React.ReactNode> = {
    danger:  <XCircle className="w-8 h-8 text-rose-500" />,
    warning: <AlertTriangle className="w-8 h-8 text-amber-500" />,
    info:    <AlertCircle className="w-8 h-8 text-blue-500" />,
};

const CONFIRM_BUTTON: Record<string, string> = {
    danger:  'bg-rose-600 hover:bg-rose-700',
    warning: 'bg-amber-600 hover:bg-amber-700',
    info:    'bg-blue-600 hover:bg-blue-700',
};

function ConfirmDialog({
    options,
    onConfirm,
    onCancel
}: {
    options: ConfirmOptions;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const type = options.type || 'info';
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full space-y-5 border border-slate-100"
            >
                {/* Icon */}
                <div className="flex justify-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        type === 'danger' ? 'bg-rose-50' : type === 'warning' ? 'bg-amber-50' : 'bg-blue-50'
                    }`}>
                        {CONFIRM_ICONS[type]}
                    </div>
                </div>

                {/* Text */}
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-bold text-slate-900">{options.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{options.message}</p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors"
                    >
                        {options.cancelText || 'Hủy'}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-2.5 rounded-xl text-white font-semibold text-sm transition-colors ${CONFIRM_BUTTON[type]}`}
                    >
                        {options.confirmText || 'Xác nhận'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
    return ctx;
}
