/* eslint-disable */
'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Gift, RotateCcw, Copy, Check, Sparkles, Clock, 
    Loader2, Info, AlertCircle, History, Award, ChevronRight, LogIn, ShoppingBag
} from 'lucide-react';
import Link from 'next/link';
import { useLuckyWheelStore, WheelPrize, WheelConfig } from '@/app/store/useLuckyWheelStore';
import { useAuth } from '@/app/component/AuthContext';
import { useToast } from '@/app/component/ToastProvider';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fashion-backend-93lh.onrender.com';

// Enterprise Luxury Alternating Palette for Wheel Slices
const ENTERPRISE_PALETTE = [
    { bg: '#0A192F', text: '#FFFFFF', border: '#D4AF37' }, // Deep Navy
    { bg: '#C59B27', text: '#0A192F', border: '#0A192F' }, // Luxury Gold
    { bg: '#0F172A', text: '#FFFFFF', border: '#D4AF37' }, // Slate Navy
    { bg: '#D4AF37', text: '#0A192F', border: '#0A192F' }, // Bright Gold
];

const mapPrize = (p: any, index: number): WheelPrize => {
    let rawLabel = p.reward || p.label || 'Quà tặng';
    let shortLabel = rawLabel;
    let emoji = '';
    let type: any = p.type;
    
    if (p.type === 'fixed') {
        const val = Number(p.discount_value) || 0;
        shortLabel = val > 0 ? `Giảm ${val >= 1000 ? val / 1000 + 'k' : val + 'đ'}` : rawLabel;
        type = 'voucher';
    } else if (p.type === 'percent') {
        const val = Number(p.discount_value) || 0;
        shortLabel = val > 0 ? `Giảm ${val}%` : rawLabel;
        type = 'voucher';
    } else if (p.type === 'shipping') {
        shortLabel = rawLabel.toLowerCase().includes('freeship') ? 'Freeship' : rawLabel;
        type = 'voucher';
    } else if (p.type === 'none') {
        shortLabel = 'May mắn lần sau';
        type = 'retry';
    }

    const theme = ENTERPRISE_PALETTE[index % ENTERPRISE_PALETTE.length];

    return {
        id: p._id || p.id,
        label: rawLabel,
        shortLabel,
        type,
        value: Number(p.discount_value) || 0,
        code: type !== 'retry' ? p.coupon_code : '',
        color: theme.bg,
        textColor: theme.text,
        emoji: '',
        probability: p.probability !== undefined ? Number(p.probability) : 1
    };
};

// Draw Ultra High-Res Wheel on Canvas with Haven Monogram Center
function drawWheel(canvas: HTMLCanvasElement, prizes: WheelPrize[]) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const radius = cx - 20;
    const numSegments = prizes.length || 8;
    const segmentAngle = 360 / numSegments;

    ctx.clearRect(0, 0, size, size);

    // 1. Draw each wheel segment
    prizes.forEach((prize, i) => {
        const startAngle = (i * segmentAngle - 90) * (Math.PI / 180);
        const endAngle = ((i + 1) * segmentAngle - 90) * (Math.PI / 180);
        const theme = ENTERPRISE_PALETTE[i % ENTERPRISE_PALETTE.length];

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.closePath();

        ctx.fillStyle = theme.bg;
        ctx.fill();

        // Metallic Divider line
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Render Clean Radial Typography
        ctx.save();
        ctx.translate(cx, cy);
        const midAngle = startAngle + (endAngle - startAngle) / 2;
        ctx.rotate(midAngle);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = theme.text;

        ctx.font = `bold 24px "Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", sans-serif`;
        const labelText = (prize.shortLabel || prize.label || 'Quà tặng').toUpperCase();
        ctx.fillText(labelText, radius - 30, 0);
        ctx.restore();
    });

    // 2. Outer Luxury Gold Rim
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#C59B27';
    ctx.lineWidth = 10;
    ctx.stroke();

    // 3. Center Luxury Bezel
    ctx.beginPath();
    ctx.arc(cx, cy, 48, 0, Math.PI * 2);
    const grad = ctx.createLinearGradient(cx - 48, cy - 48, cx + 48, cy + 48);
    grad.addColorStop(0, '#FEF08A');
    grad.addColorStop(0.5, '#C59B27');
    grad.addColorStop(1, '#92400E');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // 4. Center Inner Core (Navy with Golden "H" Monogram)
    ctx.beginPath();
    ctx.arc(cx, cy, 36, 0, Math.PI * 2);
    ctx.fillStyle = '#0A192F';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FDE68A';
    ctx.stroke();

    // Center Golden 'H' Monogram
    ctx.fillStyle = '#FDE68A';
    ctx.font = '900 30px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('H', cx, cy + 1);
}

// Modal Kết Quả Trúng Thưởng
function PrizeModal({ prize, onClose, onGoHistory }: { prize: WheelPrize; onClose: () => void; onGoHistory: () => void }) {
    const [copied, setCopied] = useState(false);
    const { showToast } = useToast();

    const handleCopy = () => {
        if (prize.code) {
            navigator.clipboard.writeText(prize.code);
            setCopied(true);
            showToast(`Đã sao chép mã ${prize.code}`, 'success', 'Đã lưu mã');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <motion.div
            className="fixed inset-0 z-[100005] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />

            <motion.div
                className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 text-center"
                initial={{ scale: 0.85, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.85, y: 20 }}
            >
                <div className="bg-gradient-to-b from-[#0F172A] to-[#1E293B] p-5 pt-6 text-white relative">
                    <div className="w-16 h-16 mx-auto mb-2.5 rounded-full bg-amber-500/20 border-2 border-amber-400 text-amber-300 flex items-center justify-center text-3xl shadow-inner animate-bounce">
                        {prize.emoji}
                    </div>
                    <h2 className="text-xl font-black text-amber-300 tracking-tight">
                        {prize.type === 'retry' ? 'Chúc may mắn lần sau!' : '🎉 CHÚC MỪNG BẠN!'}
                    </h2>
                    <p className="text-slate-300 mt-0.5 text-xs font-medium">
                        {prize.type === 'retry' ? 'Hãy quay lại vào ngày mai để thử vận may nhé!' : 'Bạn đã quay trúng phần thưởng độc quyền'}
                    </p>
                </div>

                {prize.type !== 'retry' && (
                    <div className="p-5">
                        <div className="text-center mb-3">
                            <div
                                className="inline-block px-5 py-2.5 rounded-2xl text-white font-black text-xl shadow-md border border-white/30"
                                style={{ backgroundColor: prize.color || '#C9A227' }}
                            >
                                {prize.label}
                            </div>
                        </div>

                        {prize.code && (
                            <>
                                <p className="text-[11px] text-center font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                                    Mã voucher ưu đãi:
                                </p>
                                <button
                                    onClick={handleCopy}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-amber-50 border-2 border-dashed border-amber-300 hover:bg-amber-100/70 transition-colors group cursor-pointer"
                                >
                                    <span className="font-mono text-xl font-bold text-amber-900 tracking-wider">
                                        {prize.code}
                                    </span>
                                    {copied
                                        ? <Check size={20} className="text-emerald-600" />
                                        : <Copy size={20} className="text-amber-600 group-hover:scale-110 transition-transform" />
                                    }
                                </button>
                                <p className="text-[11px] text-center text-slate-500 mt-1.5 font-medium">
                                    ✨ Đã lưu vào danh sách voucher của bạn
                                </p>
                            </>
                        )}
                    </div>
                )}

                <div className="px-5 pb-5 pt-1 flex flex-col gap-2">
                    {prize.type !== 'retry' ? (
                        <>
                            <Link
                                href="/products"
                                onClick={onClose}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-sm hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2"
                            >
                                <ShoppingBag size={17} />
                                <span>Mua sắm & Áp dụng ngay</span>
                            </Link>
                            <button
                                onClick={onGoHistory}
                                className="w-full py-2 rounded-lg text-slate-600 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                Xem lịch sử trúng thưởng
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className="w-full py-3 rounded-xl bg-[#0F172A] text-white font-bold text-sm hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
                        >
                            Đóng & Quay lại sau
                        </button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

// Main Wheel Modal
function WheelModal({ onClose }: { onClose: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { token, user } = useAuth();
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [prize, setPrize] = useState<WheelPrize | null>(null);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [prizes, setPrizes] = useState<WheelPrize[]>([]);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    
    const { 
        config, setConfig, canSpin, remainingSpins, maxSpins, usedSpins,
        isLoggedIn, activeTab, setActiveTab, recentRewards, isLoadingCheck,
        checkCanSpin, recordSpin, getTimeUntilNextSpin 
    } = useLuckyWheelStore();
    
    const { showToast } = useToast();
    const timeLeft = getTimeUntilNextSpin();

    // Check spin availability from DB on mount and when user changes
    useEffect(() => {
        checkCanSpin(user?.id, token);
    }, [user?.id, token, checkCanSpin]);

    // Fetch config on open if not fetched
    useEffect(() => {
        let isMounted = true;
        const fetchConfig = async () => {
            try {
                const apiEndpoint = `${BACKEND_URL.replace(/\/$/, '')}/api/lucky-wheel/config`;
                const res = await fetch(apiEndpoint);
                const data = await res.json();
                if (data.success && isMounted) {
                    const fullConfig = data.config || {};
                    const rawPrizes = data.prizes || fullConfig.prizes || [];
                    const mapped = rawPrizes.map((p: any, i: number) => mapPrize(p, i));
                    const fullWheelConfig = {
                        ...fullConfig,
                        prizes: mapped
                    };
                    setConfig(fullWheelConfig as any);
                    setPrizes(mapped);
                    if (canvasRef.current) drawWheel(canvasRef.current, mapped);
                }
            } catch (err) {
                console.error('Fetch wheel config error:', err);
            } finally {
                if (isMounted) setLoadingConfig(false);
            }
        };
        fetchConfig();
        
        return () => { isMounted = false; };
    }, [setConfig]);

    useEffect(() => {
        if (!loadingConfig && canvasRef.current && prizes.length > 0) {
            drawWheel(canvasRef.current, prizes);
        }
    }, [loadingConfig, prizes, activeTab]);

    const handleCopyHistoryCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        showToast(`Đã sao chép mã ${code}`, 'success', 'Đã lưu mã');
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const spin = useCallback(async () => {
        if (spinning || !canSpin || loadingConfig || prizes.length === 0) return;
        if (!token && config?.requireLogin !== false) {
            showToast('Vui lòng đăng nhập để quay Vòng Quay May Mắn!', 'warning', 'Chưa đăng nhập');
            return;
        }

        setSpinning(true);
        setPrize(null);

        try {
            const apiEndpoint = `${BACKEND_URL.replace(/\/$/, '')}/api/lucky-wheel/spin`;
            const deviceId = typeof window !== 'undefined' ? (localStorage.getItem('device_id') || 'web-client') : 'web-client';
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'x-device-id': deviceId
            };

            if (token) {
                headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
            }
            if (user?.id) {
                headers['x-user-id'] = user.id;
            }

            const res = await fetch(apiEndpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({ 
                    user_id: user?.id,
                    device_id: deviceId
                })
            });

            const data = await res.json();

            if (!data.success) {
                showToast(data.message || 'Không thể quay', 'error', 'Hết lượt quay');
                setSpinning(false);
                await checkCanSpin(user?.id, token);
                return;
            }

            const winPrizeBackend = data.prize;
            const winIndex = prizes.findIndex(p => String(p.id) === String(winPrizeBackend._id || winPrizeBackend.id));
            if (winIndex === -1) {
                setSpinning(false);
                showToast('Lỗi xác định phần thưởng.', 'error', 'Lỗi');
                return;
            }

            // Tính toán góc quay chính xác vào phần thưởng trúng
            const numSegments = prizes.length;
            const segmentAngle = 360 / numSegments;
            const targetSegmentCenterAngle = (winIndex + 0.5) * segmentAngle;
            const currentRotationMod = rotation % 360;
            const targetRotationOffset = (360 - targetSegmentCenterAngle) % 360;
            let diff = targetRotationOffset - currentRotationMod;
            if (diff < 0) diff += 360;

            const extraRounds = 360 * (6 + Math.floor(Math.random() * 2));
            const finalAngle = rotation + extraRounds + diff;
            setRotation(finalAngle);

            setTimeout(async () => {
                const won = { ...prizes[winIndex] };
                if (data.coupon) {
                    won.code = data.coupon.coupon_code;
                }
                setPrize(won);
                recordSpin(won, Math.max(0, remainingSpins - 1));
                setSpinning(false);
                
                // Đồng bộ lại lịch sử từ server
                await checkCanSpin(user?.id, token);

                if (won.type !== 'none' && won.type !== 'retry') {
                    showToast(`Chúc mừng! Bạn đã trúng ${won.label}`, 'success', 'Trúng thưởng');
                }
            }, 5500);

        } catch (err: any) {
            console.error('Spin execution error:', err);
            showToast('Lỗi quay thưởng, vui lòng thử lại!', 'error', 'Lỗi kết nối');
            setSpinning(false);
        }
    }, [spinning, canSpin, loadingConfig, prizes, config, token, user?.id, rotation, remainingSpins, checkCanSpin, recordSpin, showToast]);

    if (loadingConfig) {
        return (
            <motion.div
                className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div className="bg-white rounded-3xl p-6 flex flex-col items-center gap-3 shadow-2xl">
                    <Loader2 size={32} className="text-[#C9A227] animate-spin" />
                    <p className="text-xs font-bold text-slate-700">Đang tải Vòng Quay HAVEN...</p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="fixed inset-0 z-[100000] flex items-center justify-center p-3 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={!spinning ? onClose : undefined} />

            <motion.div
                className="relative w-full max-w-[440px] bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-slate-100 my-auto flex flex-col overflow-hidden"
                initial={{ scale: 0.92, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 15 }}
                transition={{ type: 'spring', bounce: 0.2 }}
            >
                {/* ── COMPACT LUXURY HEADER ── */}
                <div className="relative bg-gradient-to-r from-[#0B1120] via-[#1E293B] to-[#0B1120] px-4 pt-4 pb-3 text-center text-white shrink-0 border-b border-amber-500/20">
                    <button
                        onClick={!spinning ? onClose : undefined}
                        className="absolute right-3 top-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        aria-label="Đóng"
                    >
                        <X size={18} />
                    </button>
                    
                    <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
                        <Sparkles size={16} className="text-amber-400" />
                        <span>VÒNG QUAY MAY MẮN</span>
                    </h2>

                    {/* ── TABS: VÒNG QUAY / LỊCH SỬ (COMPACT) ── */}
                    <div className="flex items-center justify-center gap-1 mt-2.5 bg-black/40 p-1 rounded-xl border border-white/10 max-w-[280px] mx-auto">
                        <button
                            onClick={() => setActiveTab('wheel')}
                            disabled={spinning}
                            className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                activeTab === 'wheel'
                                    ? 'bg-[#C9A227] text-slate-950 shadow-xs font-extrabold'
                                    : 'text-slate-300 hover:text-white'
                            }`}
                        >
                            <Gift size={13} />
                            <span>Vòng quay</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            disabled={spinning}
                            className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                activeTab === 'history'
                                    ? 'bg-[#C9A227] text-slate-950 shadow-xs font-extrabold'
                                    : 'text-slate-300 hover:text-white'
                            }`}
                        >
                            <History size={13} />
                            <span>Lịch sử ({recentRewards.length})</span>
                        </button>
                    </div>
                </div>

                {/* ── TAB 1: VÒNG QUAY CHÍNH ── */}
                {activeTab === 'wheel' && (
                    <div className="relative px-4 py-3.5 pb-4 flex flex-col items-center bg-[#F8FAFC] shrink-0">

                        {/* ── HUD THỐNG KÊ LƯỢT QUAY COMPACT (GỌN GÀNG) ── */}
                        <div className="w-full mb-2">
                            {!user && config?.requireLogin !== false ? (
                                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-2 shadow-2xs">
                                    <span className="text-[11.5px] font-semibold truncate">
                                        🔒 Đăng nhập để nhận <strong>{maxSpins} lượt quay</strong> hôm nay!
                                    </span>
                                    <Link
                                        href="/login?redirect=/&openWheel=true"
                                        onClick={onClose}
                                        className="px-3 py-1 bg-[#0F172A] hover:bg-black text-amber-300 text-[11px] font-bold rounded-lg shrink-0 transition-all"
                                    >
                                        Đăng nhập
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-2xs text-xs">
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-500 font-medium">
                                            Hôm nay: <strong className="text-slate-900">{maxSpins}</strong>
                                        </span>
                                        <span className="text-slate-300">|</span>
                                        <span className="text-slate-500 font-medium">
                                            Đã quay: <strong className="text-slate-700">{usedSpins}</strong>
                                        </span>
                                        <span className="text-slate-300">|</span>
                                        <span className={remainingSpins > 0 ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                                            Còn: <strong>{remainingSpins}</strong> lượt
                                        </span>
                                    </div>
                                    {!canSpin && timeLeft && (
                                        <span className="text-[10.5px] font-mono font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md">
                                            Hồi: {timeLeft}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ── WHEEL CANVAS CONTAINER (LUXURY GOLD & NAVY BEZEL) ── */}
                        <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] rounded-full p-2.5 bg-gradient-to-tr from-[#0a192f] via-[#1e293b] to-[#0a192f] shadow-[0_16px_40px_rgba(0,0,0,0.3)] border-4 border-[#d4af37] flex items-center justify-center shrink-0 my-2">
                            
                            {/* Rotating Wheel Canvas */}
                            <motion.div
                                className="relative w-full h-full rounded-full overflow-hidden shadow-inner bg-slate-900"
                                animate={{ rotate: rotation }}
                                transition={{ duration: spinning ? 5.5 : 0, ease: [0.15, 0.85, 0.15, 1] }}
                            >
                                <canvas ref={canvasRef} width={800} height={800} className="w-full h-full block" />
                            </motion.div>

                            {/* Luxury Gold Needle Pointer */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-9 drop-shadow-xl z-20 flex flex-col items-center pointer-events-none">
                                <div className="w-4 h-4 bg-gradient-to-br from-[#d4af37] to-[#92400e] rounded-full border-2 border-white shadow-md z-10" />
                                <div className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[20px] border-t-[#dc2626] -mt-1.5 filter drop-shadow" />
                            </div>
                        </div>

                        {/* ── ACTION BUTTON (ENTERPRISE LUXURY NAVY) ── */}
                        <div className="mt-3 w-full">
                            {!user && config?.requireLogin !== false ? (
                                <Link
                                    href="/login?redirect=/&openWheel=true"
                                    onClick={onClose}
                                    className="w-full py-3.5 rounded-2xl bg-[#0a192f] hover:bg-[#1e40af] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer tracking-wide uppercase"
                                >
                                    <LogIn size={18} />
                                    <span>ĐĂNG NHẬP ĐỂ QUAY THƯỞNG</span>
                                </Link>
                            ) : canSpin ? (
                                <button
                                    onClick={spin}
                                    disabled={spinning}
                                    className="w-full py-3.5 rounded-2xl bg-[#0a192f] hover:bg-[#1e40af] active:scale-[0.98] text-white font-bold text-sm tracking-wider uppercase shadow-lg shadow-slate-950/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
                                >
                                    {spinning ? (
                                        <>
                                            <Loader2 className="animate-spin text-amber-300" size={18} />
                                            <span>ĐANG QUAY THƯỞNG...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={16} className="text-amber-300" />
                                            <span>QUAY THƯỞNG (CÒN {remainingSpins} LƯỢT)</span>
                                        </>
                                    )}
                                </button>
                            ) : (
                                <div className="flex flex-col gap-1.5">
                                    <button
                                        disabled
                                        className="w-full py-3 rounded-2xl bg-slate-100 text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-200 uppercase tracking-wider"
                                    >
                                        <Clock size={14} />
                                        <span>ĐÃ HẾT LƯỢT QUAY HÔM NAY</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('history')}
                                        className="w-full py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                        <Award size={14} className="text-[#c9a227]" />
                                        <span>Xem các phần thưởng đã trúng</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── TAB 2: LỊCH SỬ TRÚNG THƯỞNG ── */}
                {activeTab === 'history' && (
                    <div className="p-4 bg-[#F8FAFC] min-h-[340px] max-h-[400px] overflow-y-auto flex flex-col">
                        <div className="flex items-center justify-between mb-2.5">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                <Award size={16} className="text-[#C9A227]" />
                                <span>Phần thưởng đã trúng:</span>
                            </h3>
                            <span className="text-xs text-slate-500 font-medium">
                                Tổng: {recentRewards.length} quà
                            </span>
                        </div>

                        {recentRewards.length === 0 ? (
                            <div className="my-auto py-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                                <Gift size={36} className="text-slate-300" />
                                <p className="text-xs font-medium">Bạn chưa có phần thưởng nào.</p>
                                <button
                                    onClick={() => setActiveTab('wheel')}
                                    className="mt-1 px-4 py-1.5 bg-[#0F172A] text-white text-xs font-bold rounded-lg hover:bg-black transition-all cursor-pointer"
                                >
                                    Tham gia quay ngay
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {recentRewards.map((rec, idx) => {
                                    const voucherCode = typeof rec.voucher_id === 'object' && rec.voucher_id?.coupon_code
                                        ? rec.voucher_id.coupon_code
                                        : null;

                                    return (
                                        <div
                                            key={rec._id || idx}
                                            className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2.5"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-900 truncate">
                                                    {rec.reward_text}
                                                </p>
                                                <p className="text-[10.5px] text-slate-400 mt-0.5">
                                                    {new Date(rec.spin_date).toLocaleString('vi-VN')}
                                                </p>
                                            </div>

                                            {voucherCode ? (
                                                <button
                                                    onClick={() => handleCopyHistoryCode(voucherCode)}
                                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-mono font-bold transition-all cursor-pointer"
                                                    title="Bấm để sao chép mã"
                                                >
                                                    <span>{voucherCode}</span>
                                                    {copiedCode === voucherCode ? (
                                                        <Check size={14} className="text-emerald-600" />
                                                    ) : (
                                                        <Copy size={14} className="text-amber-600" />
                                                    )}
                                                </button>
                                            ) : (
                                                <span className="text-[10.5px] text-slate-400 font-medium px-2 py-0.5 bg-slate-50 rounded-md">
                                                    Đã ghi nhận
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-auto pt-3">
                            <button
                                onClick={() => setActiveTab('wheel')}
                                className="w-full py-2.5 rounded-xl bg-[#0F172A] hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <ChevronRight size={16} className="rotate-180" />
                                <span>Quay lại Vòng Quay</span>
                            </button>
                        </div>
                    </div>
                )}

                <AnimatePresence>
                    {prize && (
                        <PrizeModal 
                            prize={prize} 
                            onClose={() => setPrize(null)} 
                            onGoHistory={() => {
                                setPrize(null);
                                setActiveTab('history');
                            }}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}

// Floating trigger button + full wheel
export default function LuckyWheel() {
    const { isOpen, openWheel, closeWheel } = useLuckyWheelStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;

    return (
        <>
            {/* Floating button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        onClick={openWheel}
                        className="fixed bottom-[88px] sm:bottom-[96px] right-4 sm:right-6 z-40 flex flex-col items-center gap-1 group cursor-pointer"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ type: 'spring', bounce: 0.5, delay: 1 }}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        title="Vòng quay may mắn HAVEN"
                    >
                        <motion.div
                            className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center shadow-xl border-2 border-amber-300"
                            style={{ background: 'linear-gradient(135deg, #0F172A 0%, #C9A227 50%, #0F172A 100%)' }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                        >
                            <Gift size={22} className="text-amber-300" style={{ transform: 'rotate(-90deg)' }} />
                            {/* Glow pulse */}
                            <div className="absolute inset-0 rounded-full animate-ping opacity-25 bg-[#C9A227]" />
                        </motion.div>
                        <span className="text-[9.5px] font-bold text-slate-800 bg-white px-2 py-0.5 rounded-full shadow-xs border border-slate-200/90 whitespace-nowrap">
                            Vòng quay
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Wheel modal */}
            <AnimatePresence>
                {isOpen && <WheelModal onClose={closeWheel} />}
            </AnimatePresence>
        </>
    );
}
