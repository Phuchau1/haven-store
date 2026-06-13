'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, Mail, Lock, ArrowRight, Github, Chrome, Phone, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/component/AuthContext';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password
                })
            });
            const data = await res.json();

            if (data.success) {
                login(data.user);
                router.push('/');
            } else {
                setError(data.message || 'Đăng ký thất bại');
            }
        } catch (err) {
            setError('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 flex flex-col justify-center bg-slate-50">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white py-12 px-6 shadow-xl rounded-3xl sm:px-12 border border-slate-100"
                >
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Tạo tài khoản</h2>
                        <p className="mt-2 text-sm text-slate-500">Trở thành thành viên của gia đình PH Store</p>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-4 p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100"
                            >
                                {error}
                            </motion.div>
                        )}
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Họ tên</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    required
                                    disabled={loading}
                                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium disabled:opacity-50"
                                    placeholder="Nguyễn Văn A"
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    disabled={loading}
                                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium disabled:opacity-50"
                                    placeholder="your-email@example.com"
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Số điện thoại</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="tel"
                                    required
                                    disabled={loading}
                                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium disabled:opacity-50"
                                    placeholder="09xx xxx xxx"
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Mật khẩu</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="password"
                                        required
                                        disabled={loading}
                                        className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium disabled:opacity-50"
                                        placeholder="••••••••"
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Xác nhận</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="password"
                                        required
                                        disabled={loading}
                                        className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium disabled:opacity-50"
                                        placeholder="••••••••"
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-70"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : (
                                <>
                                    Tạo tài khoản
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-slate-500">
                        Đã có tài khoản?{' '}
                        <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-500 ml-1">
                            Đăng nhập ngay
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
