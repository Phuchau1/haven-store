'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Check, Copy, Sparkles, X, Gift } from 'lucide-react';
import { useToast } from '@/app/component/ToastProvider';

export default function Newsletter() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [couponModal, setCouponModal] = useState<{ code: string; percent: number; message: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes('@')) {
            showToast('Vui lòng nhập đúng địa chỉ email!', 'warning', 'Email không hợp lệ');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();

            if (data.success) {
                setCouponModal({
                    code: data.coupon?.code || 'WELCOME10',
                    percent: data.coupon?.discount_percent || 10,
                    message: data.message || 'Cảm ơn bạn đã đăng ký nhận tin!'
                });
                setEmail('');
            } else {
                showToast(data.message || 'Không thể đăng ký, vui lòng thử lại', 'error', 'Lỗi');
            }
        } catch (err) {
            showToast('Lỗi kết nối mạng, vui lòng thử lại!', 'error', 'Lỗi kết nối');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCoupon = () => {
        if (couponModal?.code) {
            navigator.clipboard.writeText(couponModal.code);
            setCopied(true);
            showToast(`Đã sao chép mã ${couponModal.code}`, 'success', 'Đã lưu mã');
            setTimeout(() => setCopied(false), 2500);
        }
    };

    return (
        <section className="py-14 lg:py-18 bg-white border-t border-neutral-200/80">
            <div className="container-torano">
                <div className="relative rounded-2xl bg-[#09090b] text-white p-8 sm:p-12 lg:p-14 overflow-hidden shadow-2xl border border-neutral-800">
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        {/* Left Column */}
                        <div className="lg:col-span-6 text-left">
                            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-2">
                                HAVEN PRIVILEGE CLUB
                            </p>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white uppercase">
                                Đăng Ký Nhận Bản Tin
                            </h2>
                            <p className="mt-2.5 text-sm sm:text-base text-neutral-300 font-light leading-relaxed max-w-lg">
                                Nhận ngay mã giảm <span className="font-bold text-white">10%</span> cho đơn hàng đầu tiên và cập nhật sớm nhất các bộ sưu tập giới hạn.
                            </p>
                        </div>

                        {/* Right Column: Form */}
                        <div className="lg:col-span-6">
                            <form
                                onSubmit={handleSubmit}
                                className="flex flex-col sm:flex-row items-center gap-2 bg-neutral-900/90 p-2 rounded-xl border border-neutral-700 shadow-lg focus-within:border-white transition-all"
                            >
                                <div className="flex items-center gap-2.5 flex-1 px-4 py-2.5 w-full">
                                    <Send size={15} className="text-neutral-400 shrink-0" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Nhập địa chỉ email của bạn..."
                                        className="w-full bg-transparent text-sm text-white placeholder:text-neutral-500 focus:outline-none font-normal"
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full sm:w-auto px-7 py-3.5 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    <span>{loading ? 'Đang gửi...' : 'Đăng ký ngay'}</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal hiển thị Mã Ưu Đãi sau khi đăng ký thành công */}
            <AnimatePresence>
                {couponModal && (
                    <motion.div
                        className="fixed inset-0 z-[100000] flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={() => setCouponModal(null)} />

                        <motion.div
                            className="relative w-full max-w-sm bg-white rounded-3xl p-7 text-center shadow-2xl border border-slate-100 z-10"
                            initial={{ scale: 0.85, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.85, y: 20 }}
                        >
                            <button
                                onClick={() => setCouponModal(null)}
                                className="absolute right-4 top-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                            >
                                <X size={18} />
                            </button>

                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-3xl shadow-inner">
                                🎁
                            </div>

                            <h3 className="text-xl font-bold text-slate-900">
                                Cảm ơn bạn đã đăng ký!
                            </h3>

                            <p className="text-xs text-slate-500 mt-1 font-medium">
                                {couponModal.message}
                            </p>

                            <div className="mt-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                                    Mã voucher giảm {couponModal.percent}% cho bạn:
                                </span>
                                <button
                                    onClick={handleCopyCoupon}
                                    className="w-full mt-1 flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white border border-amber-300 hover:bg-amber-100/50 transition-colors group cursor-pointer"
                                >
                                    <span className="font-mono text-2xl font-black text-amber-600 tracking-wider">
                                        {couponModal.code}
                                    </span>
                                    {copied ? (
                                        <Check size={18} className="text-emerald-600" />
                                    ) : (
                                        <Copy size={18} className="text-amber-500 group-hover:scale-110 transition-transform" />
                                    )}
                                </button>
                            </div>

                            <button
                                onClick={() => setCouponModal(null)}
                                className="w-full mt-5 py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
                            >
                                Mua sắm ngay
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
