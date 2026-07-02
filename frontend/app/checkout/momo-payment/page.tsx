/**
 * ============================================================
 * PAGE: MoMo Payment - Nhập SĐT + OTP
 * Mô tả: Trang thanh toán MoMo nội bộ với luồng:
 *   Bước 1: Nhập số điện thoại MoMo
 *   Bước 2: Nhập OTP (6 số)
 *   Bước 3: Xác nhận thành công / thất bại
 * Sandbox test: SĐT = 0909888999 | OTP = 000000
 * ============================================================
 */
'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Phone, Loader2, CheckCircle2, XCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import Link from 'next/link';

// ── OTP Input ──────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

    const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!value[i] && i > 0) refs[i - 1].current?.focus();
        }
    };

    const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const digit = e.target.value.replace(/\D/g, '').slice(-1);
        const arr = value.split('');
        arr[i] = digit;
        const next = arr.join('').slice(0, 6);
        onChange(next);
        if (digit && i < 5) refs[i + 1].current?.focus();
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        onChange(text);
        refs[Math.min(text.length, 5)].current?.focus();
    };

    return (
        <div className="flex gap-3 justify-center">
            {Array.from({ length: 6 }).map((_, i) => (
                <input
                    key={i}
                    ref={refs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[i] || ''}
                    onChange={e => handleChange(i, e)}
                    onKeyDown={e => handleKey(i, e)}
                    onPaste={handlePaste}
                    className={`w-12 h-14 text-center text-2xl font-bold rounded-2xl border-2 outline-none transition-all
                        ${value[i]
                            ? 'border-[#ae2070] bg-pink-50 text-[#ae2070]'
                            : 'border-gray-200 bg-gray-50 text-gray-900'
                        } focus:border-[#ae2070] focus:bg-pink-50 focus:scale-105`}
                />
            ))}
        </div>
    );
}

// ── Step indicator ──────────────────────────────────────────
function Steps({ step }: { step: number }) {
    return (
        <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2].map(s => (
                <React.Fragment key={s}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                        ${step >= s ? 'bg-[#ae2070] text-white scale-110' : 'bg-gray-100 text-gray-400'}`}>
                        {step > s ? '✓' : s}
                    </div>
                    {s < 2 && (
                        <div className={`h-0.5 w-16 rounded transition-all ${step > s ? 'bg-[#ae2070]' : 'bg-gray-200'}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

// ── Main Component ──────────────────────────────────────────
function MoMoPaymentContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const orderId  = searchParams.get('orderId')  || '';
    const amount   = searchParams.get('amount')   || '0';
    const amountFmt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));

    const [step, setStep]         = useState<1 | 2 | 'success' | 'failed'>(1);
    const [phone, setPhone]       = useState('');
    const [otp, setOtp]           = useState('');
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');
    const [countdown, setCountdown] = useState(0);

    // Đếm ngược cho nút "Gửi lại OTP"
    useEffect(() => {
        if (countdown <= 0) return;
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);

    // ── Validate + gửi OTP (Bước 1) ────────────────────────
    const handleSendOtp = async () => {
        setError('');
        const cleaned = phone.replace(/\s/g, '');
        if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(cleaned)) {
            setError('Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng.');
            return;
        }
        setLoading(true);
        try {
            const res  = await fetch('/api/payment/momo-send-otp', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ orderId, phone: cleaned, amount })
            });
            const data = await res.json();
            if (data.success) {
                setStep(2);
                setCountdown(60);
            } else {
                setError(data.message || 'Không thể gửi OTP. Vui lòng thử lại.');
            }
        } catch {
            setError('Lỗi kết nối. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    // ── Xác nhận OTP + thanh toán (Bước 2) ──────────────────
    const handleConfirmOtp = async () => {
        setError('');
        if (otp.length < 6) {
            setError('Vui lòng nhập đủ 6 chữ số OTP.');
            return;
        }
        setLoading(true);
        try {
            const res  = await fetch('/api/payment/momo-confirm', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ orderId, phone: phone.replace(/\s/g, ''), otp, amount })
            });
            const data = await res.json();
            if (data.success) {
                setStep('success');
                // Xóa giỏ hàng sau khi thanh toán thành công
                localStorage.removeItem('phstore-cart');
            } else {
                setError(data.message || 'OTP không hợp lệ hoặc đã hết hạn.');
                setOtp('');
            }
        } catch {
            setError('Lỗi kết nối. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    // ── Format phone display ─────────────────────────────────
    const maskedPhone = phone
        ? phone.replace(/\s/g, '').replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')
        : '';

    // ── Render ──────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#fce4ec] via-white to-[#f8f9fa] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Card */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

                    {/* Header MoMo */}
                    <div className="bg-gradient-to-r from-[#ae2070] to-[#d4357a] px-6 pt-8 pb-10">
                        <div className="flex items-center gap-3 mb-6">
                            <Link href="/checkout" className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                                <ArrowLeft size={18} className="text-white" />
                            </Link>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                    <span className="text-[#ae2070] text-xs font-black">M</span>
                                </div>
                                <span className="text-white font-bold text-lg">Ví MoMo</span>
                            </div>
                        </div>
                        {/* Order info */}
                        <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-4">
                            <p className="text-white/70 text-xs mb-1">Thanh toán đơn hàng</p>
                            <p className="text-white font-mono font-bold text-sm">#{orderId}</p>
                            <p className="text-white text-2xl font-black mt-1">{amountFmt}</p>
                        </div>
                    </div>

                    {/* Nội dung theo step */}
                    <div className="px-6 py-8 -mt-4 bg-white rounded-t-3xl relative">

                        <AnimatePresence mode="wait">

                            {/* ── STEP 1: Nhập SĐT ── */}
                            {step === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                                    <Steps step={1} />
                                    <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Xác thực tài khoản</h2>
                                    <p className="text-gray-400 text-sm text-center mb-6">Nhập số điện thoại đăng ký MoMo của bạn</p>

                                    {/* Phone input */}
                                    <div className="relative mb-4">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                            <Phone size={16} className="text-[#ae2070]" />
                                            <span className="text-gray-400 text-sm font-medium">+84</span>
                                            <span className="text-gray-200">|</span>
                                        </div>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={e => { setPhone(e.target.value.replace(/[^0-9\s]/g, '')); setError(''); }}
                                            onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                                            placeholder="0909 888 999"
                                            maxLength={11}
                                            className="w-full pl-24 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-base font-medium focus:outline-none focus:border-[#ae2070] focus:bg-pink-50/30 transition-all"
                                        />
                                    </div>

                                    {/* Sandbox hint */}
                                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                                        <ShieldCheck size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-700">
                                            <strong>Sandbox test:</strong> Nhập <code className="bg-amber-100 px-1 rounded">0909888999</code> → OTP: <code className="bg-amber-100 px-1 rounded">000000</code>
                                        </p>
                                    </div>

                                    {error && (
                                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 text-center mb-4 flex items-center justify-center gap-1">
                                            <XCircle size={14} /> {error}
                                        </motion.p>
                                    )}

                                    <motion.button
                                        onClick={handleSendOtp}
                                        disabled={loading || !phone}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full py-4 bg-gradient-to-r from-[#ae2070] to-[#d4357a] text-white font-bold rounded-2xl text-base shadow-lg shadow-pink-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                                    >
                                        {loading ? <><Loader2 size={18} className="animate-spin" /> Đang gửi OTP...</> : 'Tiếp tục →'}
                                    </motion.button>
                                </motion.div>
                            )}

                            {/* ── STEP 2: Nhập OTP ── */}
                            {step === 2 && (
                                <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                                    <Steps step={2} />
                                    <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Nhập mã OTP</h2>
                                    <p className="text-gray-400 text-sm text-center mb-1">Mã OTP đã được gửi đến</p>
                                    <p className="text-[#ae2070] font-bold text-center text-sm mb-6">
                                        {maskedPhone}
                                        <button onClick={() => { setStep(1); setOtp(''); setError(''); }} className="ml-2 text-gray-400 hover:text-gray-600 text-xs font-normal underline">Thay đổi</button>
                                    </p>

                                    <div className="mb-6">
                                        <OtpInput value={otp} onChange={setOtp} />
                                    </div>

                                    {error && (
                                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 text-center mb-4 flex items-center justify-center gap-1">
                                            <XCircle size={14} /> {error}
                                        </motion.p>
                                    )}

                                    <motion.button
                                        onClick={handleConfirmOtp}
                                        disabled={loading || otp.length < 6}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full py-4 bg-gradient-to-r from-[#ae2070] to-[#d4357a] text-white font-bold rounded-2xl text-base shadow-lg shadow-pink-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4 transition-all"
                                    >
                                        {loading ? <><Loader2 size={18} className="animate-spin" /> Đang xác nhận...</> : 'Xác nhận thanh toán'}
                                    </motion.button>

                                    {/* Gửi lại OTP */}
                                    <div className="text-center">
                                        {countdown > 0 ? (
                                            <p className="text-xs text-gray-400">Gửi lại OTP sau <span className="font-bold text-[#ae2070]">{countdown}s</span></p>
                                        ) : (
                                            <button
                                                onClick={() => { setOtp(''); setError(''); handleSendOtp(); }}
                                                disabled={loading}
                                                className="text-xs text-[#ae2070] font-medium hover:underline flex items-center gap-1 mx-auto"
                                            >
                                                <RefreshCw size={12} /> Gửi lại OTP
                                            </button>
                                        )}
                                    </div>

                                    <p className="text-[10px] text-gray-300 text-center mt-4">
                                        Mã OTP có hiệu lực trong 5 phút. Không chia sẻ OTP với bất kỳ ai.
                                    </p>
                                </motion.div>
                            )}

                            {/* ── THÀNH CÔNG ── */}
                            {step === 'success' && (
                                <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="py-6 text-center">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.15, type: 'spring', damping: 10 }}
                                        className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5"
                                    >
                                        <CheckCircle2 size={48} className="text-emerald-500" />
                                    </motion.div>
                                    <h2 className="text-2xl font-black text-gray-900 mb-2">Thanh toán thành công!</h2>
                                    <p className="text-gray-500 text-sm mb-1">
                                        Đơn hàng <span className="font-bold text-gray-900 font-mono">#{orderId}</span> đã được xác nhận.
                                    </p>
                                    <p className="text-[#ae2070] font-bold text-xl mb-6">{amountFmt}</p>
                                    <p className="text-gray-400 text-xs mb-8">
                                        Cảm ơn bạn đã sử dụng Ví MoMo. Chúng tôi sẽ giao hàng sớm nhất có thể! 🎉
                                    </p>
                                    <div className="space-y-3">
                                        <Link href="/nguoidung" className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#ae2070] to-[#d4357a] text-white font-bold rounded-2xl shadow-lg shadow-pink-200 hover:opacity-90 transition-all">
                                            Xem đơn hàng của tôi
                                        </Link>
                                        <Link href="/collections/all" className="w-full flex items-center justify-center gap-2 py-3 text-gray-500 text-sm hover:text-gray-700 transition-colors">
                                            Tiếp tục mua sắm
                                        </Link>
                                    </div>
                                </motion.div>
                            )}

                            {/* ── THẤT BẠI ── */}
                            {step === 'failed' && (
                                <motion.div key="failed" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="py-6 text-center">
                                    <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-5">
                                        <XCircle size={48} className="text-rose-500" />
                                    </div>
                                    <h2 className="text-2xl font-black text-rose-600 mb-2">Thanh toán thất bại</h2>
                                    <p className="text-gray-400 text-sm mb-8">Vui lòng thử lại hoặc chọn phương thức thanh toán khác.</p>
                                    <div className="space-y-3">
                                        <button onClick={() => { setStep(1); setOtp(''); setPhone(''); setError(''); }} className="w-full py-4 bg-gradient-to-r from-[#ae2070] to-[#d4357a] text-white font-bold rounded-2xl">
                                            Thử lại
                                        </button>
                                        <Link href="/checkout" className="w-full flex items-center justify-center py-3 text-gray-500 text-sm hover:text-gray-700">
                                            Quay lại thanh toán
                                        </Link>
                                    </div>
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-6 text-center">
                        <div className="flex items-center justify-center gap-2 text-gray-300">
                            <ShieldCheck size={13} />
                            <span className="text-[11px]">Bảo mật SSL 256-bit • Powered by MoMo</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function MoMoPaymentPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-[#fce4ec] via-white to-[#f8f9fa] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-[#ae2070] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <span className="text-white text-2xl font-black">M</span>
                    </div>
                    <p className="text-gray-500">Đang khởi tạo thanh toán MoMo...</p>
                </div>
            </div>
        }>
            <MoMoPaymentContent />
        </Suspense>
    );
}
