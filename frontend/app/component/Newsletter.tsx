'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Check, Copy, X, ArrowRight, Tag } from 'lucide-react';
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
                    message: data.message || 'Cảm ơn bạn đã trở thành thành viên HAVEN Club!'
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
        <section className="py-14 lg:py-20 bg-white">
            <div className="container-torano">
                <div className="relative rounded-3xl bg-[#090d16] text-white p-8 sm:p-12 lg:p-16 overflow-hidden shadow-2xl border border-slate-800/80">
                    {/* Soft ambient background accents */}
                    <div className="absolute -right-24 -top-24 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -left-24 -bottom-24 w-96 h-96 bg-slate-700/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                        {/* Left Column: Heading & Description */}
                        <div className="lg:col-span-6 text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-800/40 mb-3">
                                <Tag size={12} className="text-amber-400" />
                                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide">
                                    HAVEN Club
                                </span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white uppercase leading-tight">
                                Thành Viên Đặc Quyền
                            </h2>
                            <p className="mt-3 text-sm sm:text-[15px] text-slate-300 font-normal leading-relaxed max-w-lg">
                                Đăng ký để nhận ưu đãi 10% cho đơn hàng đầu tiên, cùng đặc quyền trải nghiệm sớm các bộ sưu tập mới và sự kiện giới hạn từ HAVEN.
                            </p>
                        </div>

                        {/* Right Column: Clean Dark Luxury Form Bar */}
                        <div className="lg:col-span-6">
                            <form
                                onSubmit={handleSubmit}
                                className="flex flex-col sm:flex-row items-center gap-2 bg-slate-900/90 border border-slate-700/80 p-2 sm:p-2.5 rounded-2xl sm:rounded-full shadow-2xl backdrop-blur-md transition-all focus-within:border-amber-500/60"
                            >
                                <div className="flex items-center gap-3 flex-1 px-4 py-2 w-full">
                                    <Mail size={18} className="text-amber-500/80 shrink-0" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Nhập địa chỉ email của bạn..."
                                        className="w-full bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none font-medium"
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <motion.button
                                    type="submit"
                                    disabled={loading}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full sm:w-auto px-7 py-3.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-xl sm:rounded-full text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    <span>{loading ? 'ĐANG XỬ LÝ...' : 'NHẬN ƯU ĐÃI 10%'}</span>
                                    <ArrowRight size={14} className="text-slate-950" />
                                </motion.button>
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
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setCouponModal(null)} />

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

                            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl shadow-xs">
                                🎁
                            </div>

                            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                                Chào Mừng Đến Với HAVEN!
                            </h3>

                            <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
                                {couponModal.message}
                            </p>

                            <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                    Mã ưu đãi đặc quyền giảm {couponModal.percent}%:
                                </span>
                                <button
                                    onClick={handleCopyCoupon}
                                    className="w-full mt-1 flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white border border-amber-300 hover:bg-amber-50 transition-colors group cursor-pointer shadow-xs"
                                >
                                    <span className="font-mono text-2xl font-black text-amber-800 tracking-widest">
                                        {couponModal.code}
                                    </span>
                                    {copied ? (
                                        <Check size={18} className="text-emerald-600" />
                                    ) : (
                                        <Copy size={18} className="text-amber-600 group-hover:scale-110 transition-transform" />
                                    )}
                                </button>
                            </div>

                            <button
                                onClick={() => setCouponModal(null)}
                                className="w-full mt-5 py-3.5 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm cursor-pointer uppercase tracking-wider"
                            >
                                Mua Sắm Ngay
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
