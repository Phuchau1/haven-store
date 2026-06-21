'use client';
import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Loader2, CheckCircle } from 'lucide-react';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    const otp = searchParams.get('otp') || token; // hỗ trợ cả otp và token cũ
    const email = searchParams.get('email');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');

        if (password !== confirmPassword) {
            setMessage('Mật khẩu xác nhận không khớp');
            return;
        }

        if (password.length < 6) {
            setMessage('Mật khẩu phải từ 6 ký tự trở lên');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, password })
            });

            const data = await res.json();

            if (data.success) {
                setSuccess(true);
                setTimeout(() => router.push('/login'), 2000);
            } else {
                setMessage(data.message || 'Lỗi đặt lại mật khẩu');
            }
        } catch (error) {
            console.error('Reset error:', error);
            setMessage('Lỗi kết nối server');
        } finally {
            setLoading(false);
        }
    };

    if (!otp || !email) {
        return (
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900">Liên kết không hợp lệ</h2>
                <p className="mt-2 text-sm text-slate-500">Vui lòng kiểm tra lại email của bạn.</p>
                <Link href="/login" className="mt-4 inline-block px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold">
                    Về đăng nhập
                </Link>
            </div>
        );
    }

    if (success) {
        return (
            <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                    <CheckCircle size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Thành công!</h2>
                <p className="text-sm text-slate-500">Mật khẩu của bạn đã được cập nhật.</p>
                <p className="text-xs text-slate-400">Đang chuyển hướng về trang đăng nhập...</p>
            </div>
        );
    }

    return (
        <>
            <div className="text-center mb-10">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Đặt lại mật khẩu</h2>
                <p className="mt-2 text-sm text-slate-500">Nhập mật khẩu mới cho tài khoản {email}</p>

                {message && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100"
                    >
                        {message}
                    </motion.div>
                )}
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">
                        Mật khẩu mới
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                            placeholder="••••••••"
                            disabled={loading}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">
                        Xác nhận mật khẩu
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                            placeholder="••••••••"
                            disabled={loading}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading || !password}
                    className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : (
                        <>
                            Đổi mật khẩu
                            <ArrowRight size={16} />
                        </>
                    )}
                </button>
            </form>
        </>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen pt-20 pb-12 flex flex-col justify-center bg-slate-50">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white py-12 px-6 shadow-xl rounded-3xl sm:px-12 border border-slate-100"
                >
                    <Suspense fallback={<div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400" /></div>}>
                        <ResetPasswordForm />
                    </Suspense>
                </motion.div>
            </div>
        </div>
    );
}
