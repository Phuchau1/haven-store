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
        <section className="py-20 lg:py-28 bg-black text-white relative overflow-hidden">
            {/* Background luxury glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 rounded-full blur-[140px]" />
                <div className="absolute -bottom-20 left-1/4 w-80 h-80 bg-white/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <span className="text-[11px] sm:text-xs tracking-[6px] uppercase text-amber-400/90 font-medium block">
                        Đ Ă N G  K Ý  N H Ậ N  T I N
                    </span>
                    
                    <h2 className="mt-4 text-3xl sm:text-4xl lg:text-6xl font-black tracking-tight text-white">
                        Không bỏ lỡ ưu đãi
                    </h2>

                    <p className="mt-5 text-gray-300 font-normal text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
                        Đăng ký để nhận thông tin về sản phẩm mới, khuyến mãi độc quyền và <br className="hidden sm:inline" />
                        giảm ngay <strong>10%</strong> cho đơn hàng đầu tiên.
                    </p>
                </motion.div>

                {/* Form Pill Design */}
                <motion.form
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-xl mx-auto"
                >
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Nhập email của bạn..."
                        className="w-full sm:w-[360px] px-7 py-4 bg-white rounded-full text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all font-medium shadow-lg"
                        required
                        disabled={loading}
                    />

                    <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-100 text-black rounded-full text-xs font-bold tracking-[2px] uppercase whitespace-nowrap transition-all shadow-lg flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                    >
                        <Send size={15} className="rotate-[-15deg] text-black" />
                        <span>{loading ? 'ĐANG GỬI...' : 'ĐĂNG KÝ NGAY'}</span>
                    </motion.button>
                </motion.form>
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
