import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon | React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ icon, title, description, actionLabel, onAction, className = '' }: EmptyStateProps) {
  const isElement = React.isValidElement(icon);
  const IconComponent = !isElement ? (icon as LucideIcon) : null;

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 mx-auto text-[var(--adm-text-subtle)]"
        style={{ backgroundColor: 'var(--adm-surface-2)' }}
      >
        {isElement ? icon : (IconComponent && <IconComponent size={28} style={{ color: 'var(--adm-text-subtle)' }} />)}
      </div>
      <h3
        className="text-base font-bold mb-1.5"
        style={{ color: 'var(--adm-text)' }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="text-sm max-w-xs leading-relaxed"
          style={{ color: 'var(--adm-text-muted)' }}
        >
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="adm-btn-primary mt-5"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Đã xảy ra lỗi', message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 bg-rose-50 dark:bg-rose-900/20">
        <span className="text-3xl">⚠️</span>
      </div>
      <h3 className="text-base font-bold text-[var(--adm-text)] mb-1.5">{title}</h3>
      {message && (
        <p className="text-sm text-[var(--adm-text-muted)] max-w-xs leading-relaxed">{message}</p>
      )}
      {onRetry && (
        <button onClick={onRetry} className="adm-btn-secondary mt-5">
          Thử lại
        </button>
      )}
    </div>
  );
}
