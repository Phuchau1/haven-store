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
    paymentMethod?: string;
    amount?: number;
    onClose: () => void;
}

export default function OrderSuccessModal({ isOpen, orderId, email, paymentMethod, amount = 0, onClose }: OrderSuccessModalProps) {
    const [copied, setCopied] = useState(false);
    const [copiedStk, setCopiedStk] = useState(false);
    const [copiedContent, setCopiedContent] = useState(false);
    const [countdown, setCountdown] = useState(15);
    const [isPaid, setIsPaid] = useState(false);
    const isBankTransfer = paymentMethod === 'bank-transfer' || paymentMethod?.toLowerCase().includes('bank');

    // Polling kiểm tra trạng thái thanh toán realtime cho đơn QR / Chuyển khoản
    useEffect(() => {
        if (!isOpen || !orderId || isPaid) return;

        const checkStatus = async () => {
            try {
                const res = await fetch(`/api/orders/status/${orderId}`);
                const data = await res.json();
                if (data.success && data.paymentStatus === 'paid') {
                    setIsPaid(true);
                }
            } catch (e) {
                console.error('Error polling order payment status:', e);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 2500);
        return () => clearInterval(interval);
    }, [isOpen, orderId, isPaid]);

    // Countdown tự động chuyển về trang chủ khi đã hoàn tất
    useEffect(() => {
        if (!isOpen) return;
        // Nếu là chuyển khoản chưa thanh toán thì không đếm ngược đóng modal để khách kịp quét QR
        if (isBankTransfer && !isPaid) return;

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
    }, [isOpen, isBankTransfer, isPaid, onClose]);

    const handleCopy = (text: string, type: 'order' | 'stk' | 'content') => {
        navigator.clipboard.writeText(text);
        if (type === 'order') {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } else if (type === 'stk') {
            setCopiedStk(true);
            setTimeout(() => setCopiedStk(false), 2000);
        } else {
            setCopiedContent(true);
            setTimeout(() => setCopiedContent(false), 2000);
        }
    };

    // Link tạo mã VietQR động
    const qrUrl = `https://img.vietqr.io/image/MB-0987654321-compact2.png?amount=${Math.round(amount)}&addInfo=${orderId}&accountName=HAVEN%20STORE`;

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
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
                    >
                        <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 relative overflow-hidden my-8 shadow-2xl">
                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
                                aria-label="Đóng thông báo"
                            >
                                <X size={18} />
                            </button>

                            {/* Top Accent Line */}
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600" />

                            {/* Content */}
                            <div className="text-center">
                                {/* Success Icon */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: 0.2 }}
                                    className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                                        isPaid || !isBankTransfer ? 'bg-emerald-50 text-emerald-500' : 'bg-indigo-50 text-indigo-600'
                                    }`}
                                >
                                    <CheckCircle size={36} />
                                </motion.div>

                                <h2 className="text-2xl font-bold text-slate-900">
                                    {isPaid 
                                        ? '🎉 Thanh toán thành công!' 
                                        : isBankTransfer 
                                            ? 'Quét mã VietQR để thanh toán' 
                                            : 'Đặt hàng thành công! 🎉'}
                                </h2>
                                <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-normal">
                                    {isPaid 
                                        ? 'Hệ thống đã nhận được tiền của bạn. Đơn hàng đang được chuẩn bị đóng gói!' 
                                        : isBankTransfer 
                                            ? 'Mở app ngân hàng quét mã bên dưới. Hệ thống tự động xác nhận đơn khi nhận tiền.' 
                                            : 'Cảm ơn bạn đã mua sắm tại HAVEN STORE. Đơn hàng của bạn đang được xử lý.'}
                                </p>

                                {/* PHẦN HIỂN THỊ VIETQR NẾU LÀ CHUYỂN KHOẢN VÀ CHƯA PAID */}
                                {isBankTransfer && !isPaid && (
                                    <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left">
                                        <div className="flex flex-col sm:flex-row items-center gap-4">
                                            {/* Ảnh QR VietQR */}
                                            <div className="w-36 h-36 bg-white p-2 rounded-xl border border-slate-200 shrink-0 flex items-center justify-center shadow-xs">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img 
                                                    src={qrUrl} 
                                                    alt="VietQR Transfer" 
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>

                                            {/* Thông tin chuyển khoản */}
                                            <div className="flex-1 min-w-0 space-y-1.5 text-xs text-slate-700">
                                                <p className="font-bold text-slate-900 text-sm">MB BANK (Quân Đội)</p>
                                                <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                                                    <span>STK: <strong className="font-mono text-slate-900">0987654321</strong></span>
                                                    <button onClick={() => handleCopy('0987654321', 'stk')} className="text-indigo-600 font-bold hover:underline">
                                                        {copiedStk ? '✓ Đã chép' : 'Chép'}
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                                                    <span>Nội dung: <strong className="font-mono text-rose-600">{orderId}</strong></span>
                                                    <button onClick={() => handleCopy(orderId, 'content')} className="text-indigo-600 font-bold hover:underline">
                                                        {copiedContent ? '✓ Đã chép' : 'Chép'}
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                                                    <span>Số tiền: <strong className="text-slate-900 font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}</strong></span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Realtime Status Indicator */}
                                        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-center gap-2 text-xs font-semibold text-amber-700">
                                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                                            <span>Đang tự động lắng nghe giao dịch chuyển khoản...</span>
                                        </div>
                                    </div>
                                )}

                                {/* Order ID */}
                                <div className="mt-4 p-3 bg-slate-50 rounded-xl flex items-center justify-between px-4 border border-slate-100">
                                    <span className="text-xs text-slate-500 uppercase tracking-wide">Mã đơn hàng</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-mono font-bold text-slate-900">#{orderId}</span>
                                        <button
                                            onClick={() => handleCopy(orderId, 'order')}
                                            className="p-1 hover:bg-slate-200 rounded-md transition-colors"
                                            title="Sao chép"
                                        >
                                            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-slate-400" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Email notification */}
                                <div className="mt-3 flex items-center gap-2.5 p-3 bg-indigo-50/60 rounded-xl text-left border border-indigo-100">
                                    <Mail size={16} className="text-indigo-600 shrink-0" />
                                    <p className="text-xs text-indigo-950 truncate">
                                        Email xác nhận gửi đến <strong>{email}</strong>
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="mt-5 space-y-2.5">
                                    <Link href="/nguoidung" onClick={onClose}>
                                        <button className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md">
                                            Xem đơn hàng của tôi
                                        </button>
                                    </Link>
                                    <Link href="/products" onClick={onClose}>
                                        <button className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors">
                                            {isBankTransfer && !isPaid ? 'Tiếp tục mua sắm' : `Về trang chủ (${countdown}s)`}
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
