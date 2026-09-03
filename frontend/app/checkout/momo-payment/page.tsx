'use client';
/**
 * ============================================================
 * CỔNG THANH TOÁN MOMO - GIAO DIỆN CHUẨN DOANH NGHIỆP (VNPay Style)
 * Mô tả: Cổng thanh toán MoMo mô phỏng chuẩn giao thức VNPay / MoMo
 *        - Cột trái: Thông tin đơn hàng, số tiền, mã đơn, nhà cung cấp
 *        - Cột phải: Form nhập số điện thoại MoMo, Tên chủ ví, Mã OTP
 *        - Đồng hồ đếm ngược 15 phút, chứng chỉ bảo mật PCI-DSS, SSL
 * ============================================================
 */

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ShieldCheck, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/app/store/useCartStore';

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const ref0 = useRef<HTMLInputElement>(null);
    const ref1 = useRef<HTMLInputElement>(null);
    const ref2 = useRef<HTMLInputElement>(null);
    const ref3 = useRef<HTMLInputElement>(null);
    const ref4 = useRef<HTMLInputElement>(null);
    const ref5 = useRef<HTMLInputElement>(null);
    const refs = [ref0, ref1, ref2, ref3, ref4, ref5];

    const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const digit = e.target.value.replace(/\D/g, '').slice(-1);
        const arr = (value || '').split('');
        arr[i] = digit;
        const next = arr.join('').slice(0, 6);
        onChange(next);
        if (digit && i < 5) refs[i + 1].current?.focus();
    };

    const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !value[i] && i > 0) {
            refs[i - 1].current?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        onChange(text);
        refs[Math.min(text.length, 5)].current?.focus();
    };

    return (
        <div className="flex gap-2.5 sm:gap-3 justify-center">
            {refs.map((ref, i) => (
                <input
                    key={i}
                    ref={ref}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[i] || ''}
                    onChange={e => handleChange(i, e)}
                    onKeyDown={e => handleKey(i, e)}
                    onPaste={handlePaste}
                    autoComplete="one-time-code"
                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 outline-none transition-all
                        ${value[i]
                            ? 'border-[#ae2070] bg-pink-50 text-[#ae2070]'
                            : 'border-slate-200 bg-slate-50 text-slate-900'
                        } focus:border-[#ae2070] focus:bg-pink-50/50`}
                />
            ))}
        </div>
    );
}

function MoMoPaymentContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const clearCart = useCartStore(s => s.clearCart);

    const orderId = searchParams.get('orderId') || '';
    const amount = Number(searchParams.get('amount')) || 0;
    const amountFmt = new Intl.NumberFormat('vi-VN').format(amount) + ' VND';

    const [step, setStep] = useState<1 | 2 | 'success' | 'failed'>(1);
    const [phone, setPhone] = useState('0909888999');
    const [accountName, setAccountName] = useState('NGUYEN VAN A');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(0);

    // 15 phút đếm ngược hạn thanh toán (giống VNPay)
    const [sessionTimer, setSessionTimer] = useState(15 * 60);

    useEffect(() => {
        if (sessionTimer <= 0) return;
        const t = setInterval(() => setSessionTimer(s => s - 1), 1000);
        return () => clearInterval(t);
    }, [sessionTimer]);

    const minutes = Math.floor(sessionTimer / 60);
    const seconds = sessionTimer % 60;
    const formatTime = (n: number) => (n < 10 ? `0${n}` : `${n}`);

    // Đếm ngược nút Gửi lại OTP
    useEffect(() => {
        if (countdown <= 0) return;
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);

    // Bước 1: Xác thực tài khoản & Gửi OTP
    const handleNextStep = async () => {
        setError('');
        const cleaned = phone.replace(/\s/g, '');
        if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(cleaned)) {
            setError('Số điện thoại MoMo không hợp lệ (Vui lòng nhập đúng 10 số bắt đầu bằng 0).');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/payment/momo-send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, phone: cleaned, amount }),
            });
            const data = await res.json();
            if (data.success) {
                setStep(2);
                setCountdown(60);
            } else {
                setError(data.message || 'Không thể tạo phiên giao dịch. Vui lòng thử lại.');
            }
        } catch {
            setError('Lỗi kết nối máy chủ thanh toán.');
        } finally {
            setLoading(false);
        }
    };

    // Bước 2: Xác nhận OTP
    const handleConfirmOtp = async () => {
        setError('');
        if (otp.length < 6) {
            setError('Vui lòng nhập đủ 6 chữ số OTP.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/payment/momo-confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, phone: phone.replace(/\s/g, ''), otp, amount }),
            });
            const data = await res.json();
            if (data.success) {
                clearCart();
                try {
                    localStorage.removeItem('phstore-cart');
                    localStorage.removeItem('phstore-checkout-temp');
                    window.dispatchEvent(new Event('storage'));
                } catch (e) {
                    console.error(e);
                }
                setStep('success');
            } else {
                setError(data.message || 'OTP không hợp lệ hoặc đã hết hạn.');
                setOtp('');
            }
        } catch {
            setError('Lỗi kết nối máy chủ.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f3f4f6] text-slate-800 flex flex-col justify-between py-6 px-4 sm:px-6">
            
            {/* ── TOP NAV: QUAY LẠI & NGÔN NGỮ ── */}
            <div className="max-w-5xl w-full mx-auto flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-600 mb-4">
                <button
                    onClick={() => router.push('/checkout')}
                    className="flex items-center gap-1.5 hover:text-slate-900 transition-colors py-1 px-2 rounded-lg hover:bg-white/60 cursor-pointer"
                >
                    <ChevronLeft size={18} />
                    <span>Quay lại</span>
                </button>
                <div className="flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-2xs">
                    <span>🇻🇳</span>
                    <span className="font-bold text-slate-800">Vi</span>
                </div>
            </div>

            {/* ── MAIN CARD: CHUẨN FORM VNPAY / MOMO ── */}
            <div className="max-w-5xl w-full mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                
                {/* Header cổng thanh toán */}
                <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#ae2070] flex items-center justify-center text-white font-black text-sm shadow-xs">
                            M
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CỔNG THANH TOÁN</span>
                            <span className="text-sm font-black text-[#ae2070]">Ví điện tử MoMo</span>
                        </div>
                    </div>

                    {/* Countdown Timer */}
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-600">
                        <span>Giao dịch hết hạn sau</span>
                        <div className="flex items-center gap-1 font-mono font-bold text-white text-xs">
                            <span className="bg-slate-900 px-2 py-1 rounded-md">{formatTime(minutes)}</span>
                            <span className="text-slate-900">:</span>
                            <span className="bg-slate-900 px-2 py-1 rounded-md">{formatTime(seconds)}</span>
                        </div>
                    </div>
                </div>

                {/* Body 2 Cột */}
                <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                    
                    {/* CỘT TRÁI: THÔNG TIN ĐƠN HÀNG (GIỐNG VNPAY) */}
                    <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-50/50 space-y-6">
                        <div className="border-b border-slate-200 pb-4">
                            <h3 className="text-base font-bold text-slate-900">
                                Thông tin đơn hàng (Test)
                            </h3>
                        </div>

                        <div>
                            <p className="text-xs text-slate-500 font-medium">Số tiền thanh toán</p>
                            <p className="text-2xl sm:text-3xl font-black text-[#ae2070] tracking-tight mt-1">
                                {amountFmt}
                            </p>
                        </div>

                        <div className="space-y-3.5 text-xs sm:text-sm border-t border-slate-200 pt-4">
                            <div className="flex justify-between items-center text-slate-600">
                                <span>Giá trị đơn hàng</span>
                                <span className="font-bold text-slate-900">{amountFmt}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-600">
                                <span>Phí giao dịch</span>
                                <span className="font-bold text-emerald-600">0 VND</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-600">
                                <span>Mã đơn hàng</span>
                                <span className="font-mono font-bold text-slate-900">#{orderId}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-600">
                                <span>Nhà cung cấp</span>
                                <span className="font-medium text-slate-900">HAVEN STORE (https://havenstore.io.vn)</span>
                            </div>
                        </div>

                        <div className="p-3.5 bg-pink-50 border border-pink-200 rounded-xl text-xs text-pink-900 leading-relaxed">
                            💡 <strong>Sandbox Test:</strong> SĐT: <code className="bg-white px-1.5 py-0.5 rounded font-bold font-mono">0909888999</code> · OTP: <code className="bg-white px-1.5 py-0.5 rounded font-bold font-mono">000000</code>
                        </div>
                    </div>

                    {/* CỘT PHẢI: FORM NHẬP THÔNG TIN VÍ & OTP */}
                    <div className="lg:col-span-7 p-6 sm:p-8">
                        <AnimatePresence mode="wait">
                            
                            {/* BƯỚC 1: NHẬP SỐ ĐIỆN THOẠI & TÊN VÍ */}
                            {step === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                                    <div className="text-center pb-2">
                                        <h2 className="text-xl font-bold text-slate-900">
                                            Thanh toán qua Ví MoMo
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-1">Tài khoản ví điện tử</p>
                                    </div>

                                    {/* Số điện thoại */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Số điện thoại đăng ký MoMo <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={e => { setPhone(e.target.value); setError(''); }}
                                                placeholder="Nhập số điện thoại MoMo"
                                                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm sm:text-base font-medium text-slate-900 focus:border-[#ae2070] focus:ring-1 focus:ring-[#ae2070] outline-none transition-all pr-14"
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-[#ae2070] flex items-center justify-center text-white text-xs font-black">
                                                MoMo
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tên chủ thẻ / chủ ví */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Tên chủ tài khoản (không dấu)
                                        </label>
                                        <input
                                            type="text"
                                            value={accountName}
                                            onChange={e => setAccountName(e.target.value.toUpperCase())}
                                            placeholder="Nhập tên chủ ví (không dấu)"
                                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm sm:text-base font-medium text-slate-900 focus:border-[#ae2070] focus:ring-1 focus:ring-[#ae2070] outline-none transition-all uppercase"
                                        />
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl flex items-center gap-2">
                                            <XCircle size={14} className="shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    {/* Nút hành động */}
                                    <div className="grid grid-cols-2 gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => router.push('/checkout')}
                                            className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all cursor-pointer text-center"
                                        >
                                            Hủy thanh toán
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleNextStep}
                                            disabled={loading || !phone.trim()}
                                            className="py-3 px-4 bg-[#ae2070] hover:bg-[#911b5e] text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                        >
                                            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Tiếp tục'}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* BƯỚC 2: NHẬP OTP XÁC THỰC */}
                            {step === 2 && (
                                <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                                    <div className="text-center pb-2">
                                        <h2 className="text-xl font-bold text-slate-900">
                                            Xác thực giao dịch OTP
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Mã OTP đã được gửi đến số <strong className="text-slate-900">{phone}</strong>
                                        </p>
                                    </div>

                                    <div className="py-2">
                                        <OtpInput value={otp} onChange={setOtp} />
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl flex items-center gap-2">
                                            <XCircle size={14} className="shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <div className="text-center">
                                        {countdown > 0 ? (
                                            <p className="text-xs text-slate-400 font-medium">
                                                Gửi lại OTP sau <span className="font-bold text-slate-900">{countdown}s</span>
                                            </p>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleNextStep}
                                                className="text-xs text-[#ae2070] font-bold hover:underline flex items-center gap-1 mx-auto cursor-pointer"
                                            >
                                                <RefreshCw size={12} /> Gửi lại mã OTP
                                            </button>
                                        )}
                                    </div>

                                    {/* Nút xác nhận */}
                                    <div className="grid grid-cols-2 gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all cursor-pointer text-center"
                                        >
                                            Quay lại
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleConfirmOtp}
                                            disabled={loading || otp.length < 6}
                                            className="py-3 px-4 bg-[#ae2070] hover:bg-[#911b5e] text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                        >
                                            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Xác nhận thanh toán'}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* BƯỚC 3: THÀNH CÔNG */}
                            {step === 'success' && (
                                <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6 space-y-4">
                                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                                        <CheckCircle2 size={36} />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900">Thanh toán thành công!</h2>
                                    <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                                        Đơn hàng <span className="font-mono font-bold text-slate-900">#{orderId}</span> trị giá <strong className="text-emerald-700 font-bold">{amountFmt}</strong> đã được ghi nhận.
                                    </p>

                                    <div className="pt-4 space-y-2.5 max-w-xs mx-auto">
                                        <Link href="/nguoidung" className="block w-full">
                                            <button className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer">
                                                Xem đơn hàng của tôi
                                            </button>
                                        </Link>
                                        <Link href="/products" className="block w-full">
                                            <button className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors cursor-pointer">
                                                Tiếp tục mua sắm
                                            </button>
                                        </Link>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer Bar: Hotline & Security Badge */}
                <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                        <span>✉️ hotro@havenstore.io.vn</span>
                        <span>•</span>
                        <span>📞 1900 6868</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-emerald-600" />
                        <span className="font-bold text-slate-700">PCI-DSS Compliant • 256-bit SSL</span>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className="text-center text-[11px] text-slate-400 mt-4">
                Phát triển bởi HAVEN Store & MoMo / VNPay Gateway Protocol © 2026
            </div>
        </div>
    );
}

export default function MoMoPaymentPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f3f4f6]">Đang tải cổng thanh toán...</div>}>
            <MoMoPaymentContent />
        </Suspense>
    );
}
