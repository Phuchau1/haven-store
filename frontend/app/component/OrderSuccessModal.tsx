'use client';
// ===== ORDER SUCCESS MODAL =====
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Mail, Copy, Check, X } from 'lucide-react';
import Link from 'next/link';

interface OrderSuccessModalProps {
    isOpen: boolean;
    orderId: string;
    email: string;
    onClose: () => void;
}

export default function OrderSuccessModal({ isOpen, orderId, email, onClose }: OrderSuccessModalProps) {
    const [copied, setCopied] = useState(false);
    const [countdown, setCountdown] = useState(15);

    // Countdown tự động chuyển về trang chủ
    useEffect(() => {
        if (!isOpen) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCountdown(15);
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onClose();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isOpen, onClose]);

    const handleCopyOrderId = () => {
        navigator.clipboard.writeText(orderId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-white rounded-3xl max-w-md w-full p-8 relative overflow-hidden">
                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                                aria-label="Đóng thông báo"
                            >
                                <X size={18} />
                            </button>

                            {/* Confetti effect */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500" />

                            {/* Content */}
                            <div className="text-center">
                                {/* Success Icon */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: 0.2 }}
                                    className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 mb-6"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', delay: 0.4 }}
                                    >
                                        <CheckCircle size={40} className="text-emerald-500" />
                                    </motion.div>
                                </motion.div>

                                <h2 className="text-2xl font-semibold text-black">
                                    Đặt hàng thành công! 🎉
                                </h2>
                                <p className="mt-2 text-sm text-gray-500 font-light leading-relaxed">
                                    Cảm ơn bạn đã tin tưởng PH Store. Đơn hàng của bạn đang được xử lý.
                                </p>

                                {/* Order ID */}
                                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Mã đơn hàng</p>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-lg font-mono font-bold text-black tracking-wider">
                                            #{orderId}
                                        </span>
                                        <button
                                            onClick={handleCopyOrderId}
                                            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                                            title="Sao chép"
                                            aria-label="Sao chép mã đơn hàng"
                                        >
                                            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-gray-400" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Email notification */}
                                <div className="mt-4 flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                                    <Mail size={18} className="text-blue-500 flex-shrink-0" />
                                    <p className="text-sm text-blue-700 text-left font-light">
                                        Email xác nhận đã được gửi đến <br />
                                        <strong className="font-semibold">{email}</strong>
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="mt-6 space-y-3">
                                    <Link href="/products" onClick={onClose}>
                                        <motion.button
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            className="w-full py-3.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-900 transition-colors"
                                        >
                                            Tiếp tục mua sắm
                                        </motion.button>
                                    </Link>
                                    <Link href="/" onClick={onClose}>
                                        <button className="w-full py-3 text-sm text-gray-500 hover:text-black transition-colors">
                                            Về trang chủ ({countdown}s)
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
