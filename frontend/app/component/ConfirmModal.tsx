'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'danger' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal({
    isOpen,
    title = 'Bạn có chắc chắn?',
    message,
    confirmText = 'Đồng ý',
    cancelText = 'Hủy bỏ',
    type = 'warning',
    onConfirm,
    onCancel
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const iconContainerStyles = {
        warning: 'border-amber-400 bg-amber-50 text-amber-500',
        danger: 'border-red-400 bg-red-50 text-red-500',
        info: 'border-blue-400 bg-blue-50 text-blue-500'
    };

    const confirmBtnStyles = {
        warning: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200',
        danger: 'bg-red-600 hover:bg-red-700 text-white shadow-red-200',
        info: 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-200'
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 15 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl text-center border border-slate-100 relative overflow-hidden"
                >
                    {/* Close button */}
                    <button
                        type="button"
                        onClick={onCancel}
                        className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        <X size={18} />
                    </button>

                    {/* Big Circular Warning Icon (SweetAlert Style) */}
                    <div className={`w-20 h-20 rounded-full border-4 ${iconContainerStyles[type]} flex items-center justify-center mx-auto mb-5 shadow-inner`}>
                        {type === 'danger' ? (
                            <Trash2 size={36} className="stroke-[2]" />
                        ) : (
                            <AlertTriangle size={36} className="stroke-[2.5]" />
                        )}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
                        {title}
                    </h3>

                    {/* Subtitle / Message Description */}
                    <p className="text-sm font-medium text-slate-600 mb-7 leading-relaxed px-2">
                        {message}
                    </p>

                    {/* Action Buttons Side-by-Side */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onConfirm}
                            className={`flex-1 py-3 px-5 rounded-xl font-extrabold text-sm shadow-lg transition-all ${confirmBtnStyles[type]}`}
                        >
                            {confirmText}
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-3 px-5 rounded-xl font-extrabold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all"
                        >
                            {cancelText}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
