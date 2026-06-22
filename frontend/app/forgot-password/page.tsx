'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, Loader2, CheckCircle, Lock, RefreshCw, ShieldCheck } from 'lucide-react';

type Step = 1 | 2 | 3;

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [countdown, setCountdown] = useState(600); // 10 phút

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown timer cho bước 2
    useEffect(() => {
        if (step !== 2) return;
        setCountdown(600);
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) { clearInterval(timer); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [step]);

    const formatCountdown = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    // Xử lý nhập OTP
    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        setError('');
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newOtp = Array(6).fill('');
        text.split('').forEach((char, i) => { newOtp[i] = char; });
        setOtp(newOtp);
        const nextIndex = Math.min(text.length, 5);
        setTimeout(() => inputRefs.current[nextIndex]?.focus(), 0);
    };

    // Bước 1: Gửi email
    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setError('Email không đúng định dạng');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setStep(2);
                setTimeout(() => inputRefs.current[0]?.focus(), 300);
            } else {
                setError(data.message || 'Lỗi gửi OTP');
            }
        } catch {
            setError('Lỗi kết nối server');
        } finally {
            setLoading(false);
        }
    };

    // Bước 2: Xác thực OTP
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const otpCode = otp.join('');
        if (otpCode.length < 6) {
            setError('Vui lòng nhập đủ 6 số');
            return;
        }
        if (countdown === 0) {
            setError('Mã OTP đã hết hạn. Vui lòng yêu cầu lại.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), otp: otpCode })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setStep(3);
            } else {
                setError(data.message || 'Mã OTP không hợp lệ');
            }
        } catch {
            setError('Lỗi kết nối server');
        } finally {
            setLoading(false);
        }
    };

    // Bước 3: Đặt mật khẩu mới
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) {
            setError('Mật khẩu phải từ 6 ký tự trở lên');
            return;
        }
        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), otp: otp.join(''), password })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setSuccess(true);
                setTimeout(() => router.push('/login'), 2500);
            } else {
                setError(data.message || 'Lỗi đặt lại mật khẩu');
            }
        } catch {
            setError('Lỗi kết nối server');
        } finally {
            setLoading(false);
        }
    };

    // Gửi lại OTP
    const handleResend = useCallback(async () => {
        setError('');
        setOtp(['', '', '', '', '', '']);
        setLoading(true);
        try {
            await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() })
            });
            setCountdown(600);
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        } catch {
            setError('Lỗi kết nối server');
        } finally {
            setLoading(false);
        }
    }, [email]);

    const stepVariants = {
        initial: { opacity: 0, x: 30 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -30 }
    };

    return (
        <div className="min-h-screen pt-20 pb-12 flex flex-col justify-center bg-slate-50">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3].map((s) => (
                        <React.Fragment key={s}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                                step === s ? 'bg-slate-900 text-white scale-110' :
                                step > s ? 'bg-emerald-500 text-white' :
                                'bg-slate-200 text-slate-400'
                            }`}>
                                {step > s ? <CheckCircle size={14} /> : s}
                            </div>
                            {s < 3 && (
                                <div className={`h-0.5 w-12 transition-all duration-500 ${step > s ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white py-10 px-6 shadow-xl rounded-3xl sm:px-12 border border-slate-100"
                >
                    <AnimatePresence mode="wait">
                        {/* ===== Bước 1: Nhập email ===== */}
                        {step === 1 && (
                            <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                                <div className="text-center mb-8">
                                    <div className="mx-auto w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                        <Mail size={24} className="text-slate-600" />
                                    </div>
                                    <h2 className="text-2xl font-extrabold text-slate-900">Quên mật khẩu?</h2>
                                    <p className="mt-2 text-sm text-slate-500">Nhập email để nhận mã OTP xác nhận</p>
                                </div>

                                {error && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                        className="mb-4 p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100">
                                        {error}
                                    </motion.div>
                                )}

                                <form onSubmit={handleSendEmail} className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                                            <input
                                                type="email" required value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/30 transition-all font-medium"
                                                placeholder="yourname@gmail.com"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" disabled={loading || !email}
                                        className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-2xl shadow-lg text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-60">
                                        {loading ? <Loader2 className="animate-spin" size={17} /> : <><span>Gửi mã OTP</span><ArrowRight size={15} /></>}
                                    </button>
                                </form>

                                <div className="mt-6 text-center text-sm text-slate-500">
                                    Trở lại <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-500 ml-1">Đăng nhập</Link>
                                </div>
                            </motion.div>
                        )}

                        {/* ===== Bước 2: Nhập OTP ===== */}
                        {step === 2 && (
                            <motion.div key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                                <div className="text-center mb-8">
                                    <div className="mx-auto w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                                        <ShieldCheck size={24} className="text-indigo-600" />
                                    </div>
                                    <h2 className="text-2xl font-extrabold text-slate-900">Nhập mã OTP</h2>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Mã 6 số đã gửi đến <span className="font-semibold text-slate-700">{email}</span>
                                    </p>
                                    {/* Countdown */}
                                    <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                                        countdown > 60 ? 'bg-emerald-50 text-emerald-600' :
                                        countdown > 0 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                    }`}>
                                        <span>⏱</span>
                                        <span>{countdown > 0 ? `Hết hạn sau ${formatCountdown(countdown)}` : 'Mã đã hết hạn'}</span>
                                    </div>
                                </div>

                                {error && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                        className="mb-4 p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100">
                                        {error}
                                    </motion.div>
                                )}

                                <form onSubmit={handleVerifyOtp}>
                                    {/* 6 OTP boxes */}
                                    <div className="flex gap-3 justify-center mb-6" onPaste={handleOtpPaste}>
                                        {otp.map((digit, i) => (
                                            <input
                                                key={i}
                                                ref={(el) => { inputRefs.current[i] = el; }}
                                                type="text" inputMode="numeric" maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleOtpChange(i, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                                className={`w-11 h-13 text-center text-xl font-bold rounded-xl border-2 transition-all outline-none py-3 ${
                                                    digit ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-slate-50 text-slate-900'
                                                } focus:border-indigo-500 focus:bg-indigo-50`}
                                                disabled={loading}
                                                id={`otp-input-${i}`}
                                            />
                                        ))}
                                    </div>

                                    <button type="submit" disabled={loading || otp.join('').length < 6 || countdown === 0}
                                        className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-2xl shadow-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-60">
                                        {loading ? <Loader2 className="animate-spin" size={17} /> : <><span>Xác nhận OTP</span><ArrowRight size={15} /></>}
                                    </button>
                                </form>

                                <div className="mt-5 text-center">
                                    <button onClick={handleResend} disabled={loading}
                                        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors font-medium disabled:opacity-50">
                                        <RefreshCw size={14} /> Gửi lại mã
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ===== Bước 3: Đặt mật khẩu mới ===== */}
                        {step === 3 && !success && (
                            <motion.div key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                                <div className="text-center mb-8">
                                    <div className="mx-auto w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                                        <Lock size={24} className="text-emerald-600" />
                                    </div>
                                    <h2 className="text-2xl font-extrabold text-slate-900">Đặt mật khẩu mới</h2>
                                    <p className="mt-2 text-sm text-slate-500">Nhập mật khẩu mới cho tài khoản của bạn</p>
                                </div>

                                {error && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                        className="mb-4 p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100">
                                        {error}
                                    </motion.div>
                                )}

                                <form onSubmit={handleResetPassword} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Mật khẩu mới</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                                            <input type="password" required value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/30 transition-all font-medium"
                                                placeholder="Tối thiểu 6 ký tự" disabled={loading} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Xác nhận mật khẩu</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                                            <input type="password" required value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/30 transition-all font-medium"
                                                placeholder="Nhập lại mật khẩu" disabled={loading} />
                                        </div>
                                    </div>
                                    <button type="submit" disabled={loading || !password || !confirmPassword}
                                        className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-2xl shadow-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-60 mt-2">
                                        {loading ? <Loader2 className="animate-spin" size={17} /> : <><span>Lưu mật khẩu mới</span><ArrowRight size={15} /></>}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {/* ===== Thành công ===== */}
                        {success && (
                            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                                <motion.div
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                                    className="mx-auto w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                                    <CheckCircle size={40} className="text-emerald-500" />
                                </motion.div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Thành công!</h2>
                                <p className="text-sm text-slate-500 mb-1">Mật khẩu của bạn đã được cập nhật.</p>
                                <p className="text-xs text-slate-400">Đang chuyển hướng về trang đăng nhập...</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
