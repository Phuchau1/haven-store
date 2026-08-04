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
    const radius = cx - 14;
    const numSegments = prizes.length;
    const segmentAngle = 360 / numSegments;

    ctx.clearRect(0, 0, size, size);

    // Warm, organic human fashion color palette (soft cream, amber, rose, emerald, navy)
    const PALETTE = [
        '#E53E3E', '#ED8936', '#38A169', '#3182CE', 
        '#D69E2E', '#805AD5', '#DD6B20', '#319795'
    ];

    prizes.forEach((prize, i) => {
        const startAngle = (i * segmentAngle - 90) * (Math.PI / 180);
        const endAngle = ((i + 1) * segmentAngle - 90) * (Math.PI / 180);

        // Segment Background
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.closePath();

        const color = (prize.color && prize.color !== '#FFB300') ? prize.color : PALETTE[i % PALETTE.length];
        ctx.fillStyle = color;
        ctx.fill();

        // Thick Crisp White dividers between segments
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // Render Text & Icon (TO RÕ NÉT)
        ctx.save();
        ctx.translate(cx, cy);
        const midAngle = startAngle + (endAngle - startAngle) / 2;
        ctx.rotate(midAngle);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FFFFFF';

        // High contrast bold font (16px)
        ctx.font = `bold 16px Arial, Helvetica, sans-serif`;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 1;

        // Text label
        ctx.fillText(prize.shortLabel, radius - 24, 6);
        
        // Emoji icon
        ctx.font = `18px Arial, sans-serif`;
        const textMetrics = ctx.measureText(prize.shortLabel);
        ctx.fillText(prize.emoji, radius - 32 - textMetrics.width, 6);

        ctx.restore();
    });

    // Outer ring border
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Center Knob Pin
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#E53E3E';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Center Gift Icon
    ctx.fillStyle = '#E53E3E';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎁', cx, cy + 1);
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
        x: Math.random() * 360,
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
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', bounce: 0.4 }}
            >
                {/* Confetti */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {particles.map(p => <Particle key={p.id} x={p.x} y={p.y} color={p.color} />)}
                </div>

                {/* Header */}
                <div className="relative pt-10 pb-6 px-6 text-center bg-slate-50 border-b border-slate-100">
                    <motion.div
                        className="text-6xl mb-3 inline-block"
                        animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.6 }}
                    >
                        {prize.type === 'retry' ? '☘️' : '🎉'}
                    </motion.div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        {prize.type === 'retry' ? 'Chúc may mắn lần sau!' : 'Chúc mừng bạn!'}
                    </h2>
                    <p className="text-slate-500 mt-1 text-xs font-medium">
                        {prize.type === 'retry' ? 'Hãy quay lại vào ngày mai nhé!' : 'Bạn đã nhận được phần thưởng'}
                    </p>
                </div>

                {prize.type !== 'retry' && (
                    <div className="px-6 py-6">
                        <div className="text-center mb-5">
                            <div
                                className="inline-block px-6 py-3 rounded-2xl text-white font-black text-2xl shadow-md"
                                style={{ backgroundColor: prize.color }}
                            >
                                {prize.label}
                            </div>
                        </div>

                        {prize.code && (
                            <>
                                <p className="text-[11px] text-center font-bold text-slate-400 mb-2 uppercase tracking-wider">Mã voucher cá nhân</p>
                                <button
                                    onClick={handleCopy}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-orange-50 border-2 border-dashed border-orange-200 hover:bg-orange-100/60 transition-colors group"
                                >
                                    <span className="font-mono text-2xl font-bold text-orange-600 tracking-wider">
                                        {prize.code}
                                    </span>
                                    {copied
                                        ? <Check size={20} className="text-emerald-600" />
                                        : <Copy size={20} className="text-orange-500 group-hover:scale-110 transition-transform" />
                                    }
                                </button>
                                <p className="text-[11px] text-center text-slate-400 mt-2 font-medium">Mã đã tự động lưu vào <strong>Ví Voucher</strong></p>
                            </>
                        )}
                    </div>
                )}

                <div className="px-6 pb-6">
                    <button
                        onClick={onClose}
                        className="w-full py-3.5 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors shadow-sm"
                    >
                        {prize.type === 'retry' ? 'Đóng' : 'Xem Ví Voucher của tôi'}
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
                    'Authorization': `Bearer ${token || user?.id}` 
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
            <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <Loader2 className="animate-spin text-red-500 w-12 h-12" />
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
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={!spinning ? onClose : undefined} />

            <motion.div
                className="relative w-full max-w-[560px] bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100"
                initial={{ scale: 0.85, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 20 }}
                transition={{ type: 'spring', bounce: 0.2 }}
            >
                {/* Header Clean Red Theme */}
                <div className="relative bg-red-600 px-8 pt-7 pb-7 text-center text-white">
                    <button
                        onClick={!spinning ? onClose : undefined}
                        className="absolute right-5 top-5 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                    >
                        <X size={22} />
                    </button>
                    
                    <h2 className="text-3xl font-black tracking-tight flex items-center justify-center gap-2">
                        <span>🎁</span> VÒNG QUAY MAY MẮN
                    </h2>
                    <p className="text-red-100 text-sm font-medium mt-1">Quay mỗi ngày — Nhận voucher quà tặng siêu hấp dẫn</p>
                </div>

                {/* Wheel Area (SIÊU TO & RÕ NÉT) */}
                <div className="relative px-8 py-8 flex flex-col items-center bg-slate-50/60">
                    
                    {/* Outer Frame (Size 420px) */}
                    <div className="relative w-[420px] h-[420px] rounded-full p-3.5 bg-white shadow-xl border-[5px] border-amber-400 flex items-center justify-center">
                        
                        {/* Bulbs / Dots */}
                        {Array.from({ length: 16 }).map((_, i) => (
                            <div
                                key={i}
                                className={`absolute w-3.5 h-3.5 rounded-full ${i % 2 === 0 ? 'bg-red-500' : 'bg-amber-400'} shadow-sm`}
                                style={{
                                    top: '50%', left: '50%',
                                    transform: `translate(-50%, -50%) rotate(${i * 22.5}deg) translateY(-204px)`,
                                }}
                            />
                        ))}

                        {/* Rotating Wheel Canvas (390px x 390px) */}
                        <motion.div
                            className="relative w-full h-full rounded-full overflow-hidden shadow-inner bg-white"
                            animate={{ rotate: rotation }}
                            transition={{ duration: spinning ? 5.2 : 0, ease: [0.15, 0.85, 0.15, 1] }}
                        >
                            <canvas ref={canvasRef} width={390} height={390} className="w-full h-full block" />
                        </motion.div>

                        {/* Red Pin Pointer Arrow */}
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-12 drop-shadow-md z-20 flex flex-col items-center pointer-events-none">
                            <div className="w-6 h-6 bg-red-600 rounded-full border-2 border-white shadow-sm z-10" />
                            <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[28px] border-t-red-600 -mt-3 filter drop-shadow" />
                        </div>
                    </div>

                    {/* Action Button & Status */}
                    <div className="mt-8 w-full">
                        {canSpin ? (
                            <button
                                onClick={spin}
                                disabled={spinning}
                                className="w-full py-4.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xl shadow-xl shadow-red-500/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {spinning ? (
                                    <>
                                        <Loader2 className="animate-spin text-white" size={24} />
                                        <span>ĐANG QUAY...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>✨</span>
                                        <span>QUAY NGAY HÔM NAY!</span>
                                    </>
                                )}
                            </button>
                        ) : (
                            <div className="w-full py-4 px-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                                <span className="font-bold text-sm text-slate-700 flex items-center gap-2">
                                    <Clock size={18} className="text-orange-500" /> Đã hết lượt quay hôm nay
                                </span>
                                <span className="text-sm font-mono font-bold text-orange-600 bg-orange-50 px-3.5 py-1.5 rounded-xl border border-orange-200">
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
