'use client';
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Mail, Check, Copy, X, ArrowRight, Sparkles, ShieldCheck, Crown, Gift } from 'lucide-react';
import { useToast } from '@/app/component/ToastProvider';

export default function Newsletter() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [couponModal, setCouponModal] = useState<{ code: string; percent: number; message: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const { showToast } = useToast();

    // ── 3D TILT EFFECT LOGIC (PARALLAX ON HOVER) ──
    const cardRef = useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 25, stiffness: 150 };
    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [7, -7]), springConfig);
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-7, 7]), springConfig);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const xPct = (e.clientX - rect.left) / rect.width - 0.5;
        const yPct = (e.clientY - rect.top) / rect.height - 0.5;
        mouseX.set(xPct);
        mouseY.set(yPct);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

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
        <section className="py-12 lg:py-16 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* ── 3D WRAPPER CONTAINER ── */}
                <div style={{ perspective: 1200 }}>
                    <motion.div
                        ref={cardRef}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        style={{
                            rotateX,
                            rotateY,
                            transformStyle: 'preserve-3d'
                        }}
                        className="relative rounded-3xl bg-slate-950 text-white p-7 sm:p-10 lg:p-14 overflow-hidden border border-slate-800/90 shadow-2xl transition-shadow hover:shadow-amber-500/10"
                    >
                        {/* ── 3D BACKGROUND AMBIENT GLOW & TEXT MARQUEE ── */}
                        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-slate-700/20 rounded-full blur-3xl pointer-events-none" />

                        {/* Hàng chữ chìm 3D chạy phía sau */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none overflow-hidden">
                            <motion.div 
                                animate={{ x: [0, -1000] }}
                                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                                className="whitespace-nowrap text-8xl sm:text-9xl font-black uppercase tracking-widest text-white"
                            >
                                HAVEN CLUB · EXCLUSIVE PRIVILEGES · SS 2026 COLLECTION · WELCOME 10% OFF ·
                            </motion.div>
                        </div>

                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                            
                            {/* ── CỘT TRÁI: TIÊU ĐỀ & ĐẶC QUYỀN ── */}
                            <div className="lg:col-span-7 text-left space-y-4" style={{ transform: 'translateZ(30px)' }}>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25">
                                    <Crown size={13} className="text-amber-400" />
                                    <span className="text-xs font-semibold text-amber-300 tracking-wide">
                                        HAVEN VIP PRIVILEGE
                                    </span>
                                </div>

                                <div>
                                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white uppercase leading-tight">
                                        Thành Viên Đặc Quyền
                                    </h2>
                                    <p className="mt-2 text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-xl">
                                        Đăng ký ngay để nhận <strong className="text-amber-300 font-bold">Voucher 10%</strong> cho đơn hàng đầu tiên, cùng đặc quyền trải nghiệm sớm các bộ sưu tập giới hạn.
                                    </p>
                                </div>

                                {/* Feature Badges */}
                                <div className="pt-2 flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-300 font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <Sparkles size={15} className="text-amber-400" />
                                        <span>Ưu đãi chào mừng 10%</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Gift size={15} className="text-amber-400" />
                                        <span>Quà tặng sinh nhật</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <ShieldCheck size={15} className="text-emerald-400" />
                                        <span>Bảo mật tuyệt đối</span>
                                    </div>
                                </div>

                                {/* Form đăng ký */}
                                <div className="pt-2">
                                    <form
                                        onSubmit={handleSubmit}
                                        className="flex flex-col sm:flex-row items-center gap-2 bg-slate-900/90 border border-slate-700/80 p-2 rounded-2xl shadow-xl backdrop-blur-md transition-all focus-within:border-amber-400/80 max-w-xl"
                                    >
                                        <div className="flex items-center gap-3 flex-1 px-3 py-2 w-full">
                                            <Mail size={18} className="text-amber-400 shrink-0" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Nhập địa chỉ email của bạn..."
                                                className="w-full bg-transparent text-sm sm:text-base text-white placeholder:text-slate-400 focus:outline-none font-medium"
                                                required
                                                disabled={loading}
                                            />
                                        </div>

                                        <motion.button
                                            type="submit"
                                            disabled={loading}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="w-full sm:w-auto px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs sm:text-sm font-bold tracking-wide uppercase whitespace-nowrap transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                        >
                                            <span>{loading ? 'Đang gửi...' : 'Nhận ưu đãi 10%'}</span>
                                            <ArrowRight size={15} className="text-slate-950" />
                                        </motion.button>
                                    </form>
                                </div>
                            </div>

                            {/* ── CỘT PHẢI: 3D FLOATING VIP MEMBER CARD MOCKUP ── */}
                            <div className="lg:col-span-5 hidden lg:flex justify-center items-center" style={{ transform: 'translateZ(50px)' }}>
                                <motion.div
                                    animate={{ 
                                        y: [-6, 6, -6],
                                        rotateZ: [-1, 1.5, -1]
                                    }}
                                    transition={{ 
                                        duration: 6, 
                                        repeat: Infinity, 
                                        ease: 'easeInOut' 
                                    }}
                                    className="relative w-80 h-48 rounded-2xl p-5 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700/80 shadow-2xl shadow-black/80 flex flex-col justify-between overflow-hidden"
                                >
                                    {/* Holographic light beam effect */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-400/5 to-transparent pointer-events-none" />

                                    {/* Card Header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black tracking-widest text-white">HAVEN</span>
                                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                                BLACK VIP
                                            </span>
                                        </div>
                                        <div className="w-7 h-5 rounded bg-amber-400/80 flex items-center justify-center shadow-inner">
                                            <div className="w-5 h-3 border border-amber-900/60 rounded-xs" />
                                        </div>
                                    </div>

                                    {/* Card Center: Voucher info */}
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Special Member Privilege</p>
                                        <p className="text-xl font-extrabold text-amber-300 tracking-tight mt-0.5">10% OFF FIRST ORDER</p>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
                                        <span>MEMBER · 2026</span>
                                        <span className="text-amber-400 font-bold font-sans text-xs">#HV-WELCOME10</span>
                                    </div>
                                </motion.div>
                            </div>

                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── MODAL HIỂN THỊ MÃ ƯU ĐÃI THÀNH VIÊN ── */}
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
                                className="absolute right-4 top-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>

                            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl shadow-xs">
                                🎁
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                                Chào Mừng Đến Với HAVEN!
                            </h3>

                            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium leading-relaxed">
                                {couponModal.message}
                            </p>

                            <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
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
                                className="w-full mt-5 py-3.5 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors shadow-sm cursor-pointer uppercase tracking-wider"
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
