'use client';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within AdminToastProvider');
  return ctx;
}

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: {
    bar: 'bg-emerald-500',
    icon: 'text-emerald-500',
    bg: 'bg-white dark:bg-[#161b22]',
  },
  error: {
    bar: 'bg-rose-500',
    icon: 'text-rose-500',
    bg: 'bg-white dark:bg-[#161b22]',
  },
  warning: {
    bar: 'bg-amber-500',
    icon: 'text-amber-500',
    bg: 'bg-white dark:bg-[#161b22]',
  },
  info: {
    bar: 'bg-blue-500',
    icon: 'text-blue-500',
    bg: 'bg-white dark:bg-[#161b22]',
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const Icon = ICONS[toast.type];
  const style = STYLES[toast.type];
  const [exiting, setExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 250);
  }, [onDismiss, toast.id]);

  useEffect(() => {
    const duration = toast.duration ?? 4000;
    const timer = setTimeout(handleDismiss, duration);
    return () => clearTimeout(timer);
  }, [handleDismiss, toast.duration]);

  return (
    <div
      className={`
        relative flex items-start gap-3 min-w-[300px] max-w-[380px] w-full
        rounded-2xl shadow-2xl overflow-hidden
        border border-slate-200 dark:border-[#30363d]
        ${style.bg}
        ${exiting ? 'toast-exit' : 'toast-enter'}
        p-4
      `}
      style={{ pointerEvents: 'all' }}
    >
      {/* Color bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.bar} rounded-l-2xl`} />

      {/* Icon */}
      <div className={`flex-shrink-0 mt-0.5 ${style.icon}`}>
        <Icon size={18} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pl-1">
        <p className="text-sm font-bold text-[var(--adm-text)] leading-snug">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-[var(--adm-text-muted)] mt-0.5 leading-relaxed">{toast.message}</p>
        )}
      </div>

      {/* Close */}
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded-lg text-[var(--adm-text-subtle)] hover:text-[var(--adm-text)] hover:bg-[var(--adm-surface-2)] transition-colors mt-0.5"
        aria-label="Đóng thông báo"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, title: string, message?: string, duration?: number) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-4), { id, type, title, message, duration }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
        style={{ maxWidth: 'calc(100vw - 2rem)' }}
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
