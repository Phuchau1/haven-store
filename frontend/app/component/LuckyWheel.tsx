/* eslint-disable */
'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, RotateCcw, Copy, Check, Sparkles, Clock, Loader2 } from 'lucide-react';
import { useLuckyWheelStore, WheelPrize, WheelConfig } from '@/app/store/useLuckyWheelStore';
import { useAuth } from '@/app/component/AuthContext';
import { useToast } from '@/app/component/ToastProvider';

const DEFAULT_COLORS = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

const mapPrize = (p: any, index: number): WheelPrize => {
    let shortLabel = p.reward;
    let emoji = '🎁';
    let type: any = p.type;
    
    if (p.type === 'fixed') {
        shortLabel = `Giảm ${p.discount_value/1000}k`;
        emoji = '💸';
        type = 'voucher';
    } else if (p.type === 'percent') {
        shortLabel = `Giảm ${p.discount_value}%`;
        emoji = '🏷️';
        type = 'voucher';
    } else if (p.type === 'shipping') {
        shortLabel = 'Freeship';
        emoji = '🚚';
        type = 'voucher';
    } else if (p.type === 'none') {
        shortLabel = 'May mắn lần sau';
        emoji = '☘️';
        type = 'retry';
    }

    return {
        id: p._id || p.id,
        label: p.reward,
        shortLabel,
        type,
        value: Number(p.discount_value) || 0,
        code: type !== 'retry' ? p.coupon_code : '',
        color: p.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
        textColor: '#FFFFFF',
        emoji,
        probability: p.probability || 1
    };
};

// Draw high-res clear wheel on canvas
function drawWheel(canvas: HTMLCanvasElement, prizes: WheelPrize[]) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const radius = cx - 12;
    const numSegments = prizes.length;
    const segmentAngle = 360 / numSegments;

    ctx.clearRect(0, 0, size, size);

    // Modern color palette fallback array with rich contrast
    const RICH_PALETTE = [
        '#E11D48', '#0EA5E9', '#D97706', '#059669', 
        '#7C3AED', '#DB2777', '#2563EB', '#D97706'
    ];

    prizes.forEach((prize, i) => {
        const startAngle = (i * segmentAngle - 90) * (Math.PI / 180);
        const endAngle = ((i + 1) * segmentAngle - 90) * (Math.PI / 180);

        // Segment Background
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.closePath();

        const color = prize.color && prize.color !== '#FFB300' ? prize.color : RICH_PALETTE[i % RICH_PALETTE.length];
        ctx.fillStyle = color;
        ctx.fill();

        // White border dividers between segments
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Render Text & Icon
        ctx.save();
        ctx.translate(cx, cy);
        const midAngle = startAngle + (endAngle - startAngle) / 2;
        ctx.rotate(midAngle);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FFFFFF';

        // Clear prominent font sizing
        ctx.font = `bold 13px 'Plus Jakarta Sans', Inter, system-ui, sans-serif`;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 1;

        // Label text
        ctx.fillText(prize.shortLabel, radius - 16, 4);
        
        // Emoji / Icon
        ctx.font = `14px Arial, sans-serif`;
        const textMetrics = ctx.measureText(prize.shortLabel);
        ctx.fillText(prize.emoji, radius - 22 - textMetrics.width, 4);

        ctx.restore();
    });

    // Outer ring border
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Center Golden Knob
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    const grad = ctx.createLinearGradient(cx - 20, cy - 20, cx + 20, cy + 20);
    grad.addColorStop(0, '#FDF0CD');
    grad.addColorStop(0.5, '#F59E0B');
    grad.addColorStop(1, '#B45309');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center Crown/Star Icon
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 2;
    ctx.fillText('✦', cx, cy + 1);
}

// Confetti particle
const Particle = ({ x, y, color }: { x: number; y: number; color: string }) => (
    <motion.div
        className="absolute w-2 h-2 rounded-full"
        style={{ left: x, top: y, backgroundColor: color }}
        initial={{ opacity: 1, scale: 1 }}
        animate={{
            y: y + Math.random() * 300 + 100,
            x: x + (Math.random() - 0.5) * 200,
            opacity: 0,
            scale: 0,
            rotate: Math.random() * 360,
        }}
        transition={{ duration: 1.5 + Math.random(), ease: 'easeOut' }}
    />
);

// Prize Result Modal
function PrizeModal({ prize, prizes, onClose }: { prize: WheelPrize, prizes: WheelPrize[], onClose: () => void }) {
    const [copied, setCopied] = useState(false);
    const particles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 320,
        y: Math.random() * 100,
        color: prizes[i % prizes.length].color,
    }));

    const handleCopy = () => {
        if (prize.code) {
            navigator.clipboard.writeText(prize.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
            <motion.div
                className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', bounce: 0.4 }}
            >
                {/* Confetti */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {particles.map(p => <Particle key={p.id} x={p.x} y={p.y} color={p.color} />)}
                </div>

                {/* Header gradient */}
                <div className="relative pt-10 pb-6 px-6 text-center" style={{ background: `linear-gradient(135deg, ${prize.color}15 0%, ${prize.color}35 100%)` }}>
                    <motion.div
                        className="text-6xl mb-3 inline-block"
                        animate={{ scale: [1, 1.25, 1], rotate: [0, 12, -12, 0] }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        {prize.type === 'retry' ? '☘️' : '🎉'}
                    </motion.div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        {prize.type === 'retry' ? 'Chúc may mắn lần sau!' : 'Chúc mừng bạn!'}
                    </h2>
                    <p className="text-slate-500 mt-1 text-xs font-medium">
                        {prize.type === 'retry' ? 'Hãy quay lại vào ngày mai để thử lại nhé!' : 'Đã nhận thành công phần thưởng'}
                    </p>
                </div>

                {prize.type !== 'retry' && (
                    <div className="px-6 py-5">
                        {/* Prize display */}
                        <div className="text-center mb-5">
                            <div
                                className="inline-block px-6 py-3 rounded-2xl text-white font-black text-xl shadow-lg"
                                style={{ backgroundColor: prize.color }}
                            >
                                {prize.label}
                            </div>
                        </div>

                        {prize.code && (
                            <>
                                <p className="text-[10px] text-center font-bold text-slate-400 mb-2 uppercase tracking-widest">Mã phần thưởng cá nhân</p>
                                <button
                                    onClick={handleCopy}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-amber-50/60 border-2 border-dashed border-amber-300 hover:bg-amber-100/60 transition-colors group"
                                >
                                    <span className="font-mono text-xl font-bold text-amber-900 tracking-wider">
                                        {prize.code}
                                    </span>
                                    {copied
                                        ? <Check size={20} className="text-emerald-600" />
                                        : <Copy size={20} className="text-amber-600 group-hover:scale-110 transition-transform" />
                                    }
                                </button>
                                <p className="text-[11px] text-center text-slate-400 mt-2 font-medium">✨ Mã đã được lưu tự động vào <strong>Ví Voucher</strong> của bạn</p>
                            </>
                        )}
                    </div>
                )}

                <div className="px-6 pb-6">
                    <button
                        onClick={onClose}
                        className="w-full py-3.5 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
                    >
                        {prize.type === 'retry' ? 'Đóng' : 'Đến Ví Voucher của tôi'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// Main Wheel Modal
function WheelModal({ onClose }: { onClose: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { token } = useAuth();
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [prize, setPrize] = useState<WheelPrize | null>(null);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [prizes, setPrizes] = useState<WheelPrize[]>([]);
    
    const { config, setConfig, canSpin, checkCanSpin, recordSpin, getTimeUntilNextSpin } = useLuckyWheelStore();
    const { user } = useAuth();
    const { showToast } = useToast();
    const timeLeft = !canSpin ? getTimeUntilNextSpin() : '';

    // Check spin availability from DB on mount
    useEffect(() => {
        if (user?.id) checkCanSpin(user.id);
    }, [user?.id, checkCanSpin]);

    // Fetch config on open if not fetched
    useEffect(() => {
        let isMounted = true;
        const fetchConfig = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lucky-wheel/config`);
                const data = await res.json();
                if (data.success && data.prizes && isMounted) {
                    const mapped = data.prizes.map((p: any, i: number) => mapPrize(p, i));
                    const mockConfig = { isActive: true, spinsPerDay: 1, prizes: mapped };
                    setConfig(mockConfig as any);
                    setPrizes(mapped);
                    if (canvasRef.current) drawWheel(canvasRef.current, mapped);
                }
            } catch (err) {
                console.error('Fetch wheel config error:', err);
            } finally {
                if (isMounted) setLoadingConfig(false);
            }
        };

        if (!config || !config.prizes || config.prizes.length === 0 || !(config.prizes[0] as any).shortLabel) {
            fetchConfig();
        } else {
            setPrizes(config.prizes);
            setLoadingConfig(false);
            if (canvasRef.current) drawWheel(canvasRef.current, config.prizes);
        }
        
        return () => { isMounted = false; };
    }, [config, setConfig]);

    useEffect(() => {
        if (!loadingConfig && canvasRef.current && prizes.length > 0) {
            drawWheel(canvasRef.current, prizes);
        }
    }, [loadingConfig, prizes]);

    const spin = useCallback(async () => {
        if (spinning || !canSpin || loadingConfig || prizes.length === 0) return;
        if (!token) {
            showToast('Vui lòng đăng nhập để quay Vòng Quay May Mắn!', 'warning', 'Chưa đăng nhập');
            return;
        }

        setSpinning(true);
        setPrize(null);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lucky-wheel/spin`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                }
            });
            const data = await res.json();

            if (!data.success) {
                showToast(data.message || 'Không thể quay', 'error', 'Lỗi');
                setSpinning(false);
                return;
            }

            const winPrizeBackend = data.prize;
            const winIndex = prizes.findIndex(p => p.id === (winPrizeBackend._id || winPrizeBackend.id));
            if (winIndex === -1) {
                setSpinning(false);
                return;
            }

            const segmentAngle = 360 / prizes.length;
            const targetAngle = winIndex * segmentAngle + segmentAngle / 2;

            const extraSpins = 6 + Math.floor(Math.random() * 3);
            const finalAngle = rotation + extraSpins * 360 + (360 - targetAngle) - (rotation % 360);

            setRotation(finalAngle);

            setTimeout(() => {
                const won = { ...prizes[winIndex] };
                if (data.coupon) {
                    won.code = data.coupon.coupon_code;
                }
                setPrize(won);
                recordSpin(won);
                setSpinning(false);
            }, 5200);

        } catch (err) {
            showToast('Lỗi kết nối! Vui lòng thử lại.', 'error', 'Lỗi kết nối');
            setSpinning(false);
        }

    }, [spinning, canSpin, rotation, recordSpin, token, loadingConfig, prizes]);

    if (loadingConfig) {
        return (
            <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                <Loader2 className="animate-spin text-amber-400 w-12 h-12" />
            </div>
        );
    }

    return (
        <motion.div
            className="fixed inset-0 z-[150] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={!spinning ? onClose : undefined} />

            <motion.div
                className="relative w-full max-w-[420px] bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl border border-amber-500/20"
                initial={{ scale: 0.85, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 30 }}
                transition={{ type: 'spring', bounce: 0.25 }}
            >
                {/* Header Premium Dark & Gold Gradient */}
                <div className="relative bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-900 px-6 pt-6 pb-4 text-center border-b border-amber-500/10">
                    <button
                        onClick={!spinning ? onClose : undefined}
                        className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                    
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                        <Sparkles size={13} /> Tri ân khách hàng
                    </div>
                    
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-200 tracking-tight">
                        VÒNG QUAY MAY MẮN
                    </h2>
                    <p className="text-slate-400 text-xs font-medium mt-0.5">Quay mỗi ngày — Nhận mã giảm giá độc quyền</p>
                </div>

                {/* Wheel Area */}
                <div className="relative px-6 py-6 flex flex-col items-center">
                    
                    {/* Glowing outer bezel ring */}
                    <div className="relative w-[290px] h-[290px] rounded-full p-2.5 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 shadow-[0_0_40px_rgba(245,158,11,0.35)] flex items-center justify-center">
                        
                        {/* Outer bulbs / dots */}
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div
                                key={i}
                                className={`absolute w-2.5 h-2.5 rounded-full ${i % 2 === 0 ? 'bg-amber-100 shadow-[0_0_8px_#FDE68A]' : 'bg-amber-400 shadow-[0_0_6px_#F59E0B]'}`}
                                style={{
                                    top: '50%', left: '50%',
                                    transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-138px)`,
                                }}
                            />
                        ))}

                        {/* Rotating Wheel Canvas */}
                        <motion.div
                            className="relative w-full h-full rounded-full overflow-hidden shadow-2xl bg-slate-900"
                            animate={{ rotate: rotation }}
                            transition={{ duration: spinning ? 5.2 : 0, ease: [0.15, 0.85, 0.15, 1] }}
                        >
                            <canvas ref={canvasRef} width={270} height={270} className="w-full h-full block" />
                        </motion.div>

                        {/* Top Gold Pointer Arrow */}
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-8 h-10 drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)] z-20 flex flex-col items-center pointer-events-none">
                            <div className="w-4 h-4 bg-gradient-to-tr from-amber-600 to-yellow-300 rounded-full border-2 border-white shadow-sm z-10" />
                            <div className="w-0 h-0 border-l-[11px] border-l-transparent border-r-[11px] border-r-transparent border-t-[22px] border-t-amber-400 -mt-2 filter drop-shadow" />
                        </div>
                    </div>

                    {/* Action Button & Timer */}
                    <div className="mt-6 w-full">
                        {canSpin ? (
                            <button
                                onClick={spin}
                                disabled={spinning}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-lg shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {spinning ? (
                                    <>
                                        <Loader2 className="animate-spin text-slate-950" size={20} />
                                        <span>ĐANG QUAY...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={20} className="text-slate-950" />
                                        <span>QUAY NGAY HÔM NAY</span>
                                    </>
                                )}
                            </button>
                        ) : (
                            <div className="w-full py-3.5 px-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                                <span className="font-semibold text-xs text-slate-300 flex items-center gap-2">
                                    <Clock size={15} className="text-amber-400" /> Đã dùng lượt quay hôm nay
                                </span>
                                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                                    {timeLeft}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {prize && <PrizeModal prize={prize} prizes={prizes} onClose={() => setPrize(null)} />}
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
                        className="fixed bottom-[100px] right-6 z-40 flex flex-col items-center gap-1 group w-14"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ type: 'spring', bounce: 0.5, delay: 1 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Vòng quay may mắn"
                    >
                        <motion.div
                            className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #C9A227 0%, #F59E0B 50%, #C9A227 100%)' }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                        >
                            <Gift size={24} className="text-white" style={{ transform: 'rotate(-90deg)' }} />
                            {/* Glow */}
                            <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: '#C9A227' }} />
                        </motion.div>
                        <span className="text-[10px] font-bold text-gray-600 bg-white/90 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                            May mắn
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
