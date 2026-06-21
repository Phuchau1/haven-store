/* eslint-disable */
'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, RotateCcw, Copy, Check, Sparkles, Clock, Loader2 } from 'lucide-react';
import { useLuckyWheelStore, WheelPrize, WheelConfig } from '@/app/store/useLuckyWheelStore';
import { useAuth } from '@/app/component/AuthContext';

const DEFAULT_COLORS = ['#FFB300', '#FF8F00', '#E65100', '#BF360C', '#FFB300', '#FF8F00', '#E65100', '#BF360C'];

const mapPrize = (p: any, index: number): WheelPrize => {
    let shortLabel = p.reward;
    let emoji = '🎁';
    let type: any = p.type;
    
    if (p.type === 'fixed') {
        shortLabel = `Giảm ${p.discount_value/1000}K`;
        emoji = '💸';
        type = 'voucher';
    } else if (p.type === 'percent') {
        shortLabel = `Giảm ${p.discount_value}%`;
        emoji = '💸';
        type = 'voucher';
    } else if (p.type === 'shipping') {
        shortLabel = 'Freeship';
        emoji = '🚚';
        type = 'voucher';
    } else if (p.type === 'none') {
        shortLabel = 'Chúc may mắn lần sau';
        emoji = '😔';
        type = 'retry';
    }

    return {
        id: p._id || p.id,
        label: p.reward,
        shortLabel,
        type,
        value: Number(p.discount_value) || 0,
        code: type !== 'retry' ? p.coupon_code : '',
        color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
        textColor: '#fff',
        emoji,
        probability: p.probability || 1
    };
};

// Draw wheel on canvas
function drawWheel(canvas: HTMLCanvasElement, prizes: WheelPrize[]) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const radius = cx - 8;
    const numSegments = prizes.length;
    const segmentAngle = 360 / numSegments;

    ctx.clearRect(0, 0, size, size);

    prizes.forEach((prize, i) => {
        const startAngle = (i * segmentAngle - 90) * (Math.PI / 180);
        const endAngle = ((i + 1) * segmentAngle - 90) * (Math.PI / 180);

        // Segment
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = prize.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Text
        ctx.save();
        ctx.translate(cx, cy);
        const midAngle = startAngle + (endAngle - startAngle) / 2;
        ctx.rotate(midAngle);
        ctx.textAlign = 'right';
        ctx.fillStyle = prize.textColor;
        ctx.font = `bold ${size > 300 ? 12 : 10}px 'Be Vietnam Pro', Inter, sans-serif`;
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 4;
        ctx.fillText(prize.shortLabel, radius - 15, 4);
        
        // Emoji
        ctx.font = `${size > 300 ? 15 : 12}px serif`;
        const textMetrics = ctx.measureText(prize.shortLabel);
        ctx.fillText(prize.emoji, radius - 20 - textMetrics.width, 4);
        ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#C9A227';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center star
    ctx.fillStyle = '#C9A227';
    ctx.font = 'bold 18px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', cx, cy);
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
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
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
                <div className="relative pt-10 pb-6 px-6 text-center" style={{ background: `linear-gradient(135deg, ${prize.color}22 0%, ${prize.color}44 100%)` }}>
                    <motion.div
                        className="text-6xl mb-3"
                        animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        {prize.type === 'retry' ? '😔' : '🎉'}
                    </motion.div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {prize.type === 'retry' ? 'Chúc may mắn lần sau!' : 'Chúc mừng!'}
                    </h2>
                    <p className="text-gray-500 mt-1 text-sm">
                        {prize.type === 'retry' ? 'Hãy thử lại vào ngày mai nhé 💪' : 'Bạn đã trúng thưởng'}
                    </p>
                </div>

                {prize.type !== 'retry' && (
                    <div className="px-6 py-6">
                        {/* Prize display */}
                        <div className="text-center mb-5">
                            <div
                                className="inline-block px-6 py-3 rounded-2xl text-white font-black text-2xl shadow-lg"
                                style={{ backgroundColor: prize.color }}
                            >
                                {prize.label}
                            </div>
                        </div>

                        {prize.code && (
                            <>
                                <p className="text-xs text-center text-gray-400 mb-2 uppercase tracking-wider">Mã phần thưởng</p>
                                <button
                                    onClick={handleCopy}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-dashed hover:bg-gray-50 transition-colors group"
                                    style={{ borderColor: prize.color }}
                                >
                                    <span className="font-mono text-xl font-bold" style={{ color: prize.color }}>
                                        {prize.code}
                                    </span>
                                    {copied
                                        ? <Check size={20} className="text-green-500" />
                                        : <Copy size={20} className="text-gray-400 group-hover:text-gray-600" />
                                    }
                                </button>
                                <p className="text-xs text-center text-gray-400 mt-2">Nhấn để sao chép</p>
                            </>
                        )}
                    </div>
                )}

                <div className="px-6 pb-6">
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors"
                    >
                        {prize.type === 'retry' ? 'Đóng' : 'Dùng ngay!'}
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
    
    const { config, setConfig, canSpinToday, recordSpin, getTimeUntilNextSpin } = useLuckyWheelStore();
    const canSpin = canSpinToday();
    const timeLeft = !canSpin ? getTimeUntilNextSpin() : '';

    // Fetch config on open if not fetched
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lucky-wheel/config`);
                const data = await res.json();
                if (data.success && data.prizes) {
                    const mockConfig = { isActive: true, spinsPerDay: 1, prizes: data.prizes };
                    setConfig(mockConfig as any);
                    const mapped = data.prizes.map((p: any, i: number) => mapPrize(p, i));
                    setPrizes(mapped);
                    if (canvasRef.current) drawWheel(canvasRef.current, mapped);
                }
            } catch (err) {
                console.error('Fetch wheel config error:', err);
            } finally {
                setLoadingConfig(false);
            }
        };

        if (!config || !config.prizes || config.prizes.length === 0 || !config.prizes[0].reward) {
            // Need refetch because store might have old schema
            fetchConfig();
        } else {
            const mapped = config.prizes.map((p: any, i: number) => mapPrize(p, i));
            setPrizes(mapped);
            setLoadingConfig(false);
            if (canvasRef.current) drawWheel(canvasRef.current, mapped);
        }
    }, [config, setConfig]);

    useEffect(() => {
        if (!loadingConfig && canvasRef.current && prizes.length > 0) {
            drawWheel(canvasRef.current, prizes);
        }
    }, [loadingConfig, prizes]);

    const spin = useCallback(async () => {
        if (spinning || !canSpin || loadingConfig || prizes.length === 0) return;
        if (!token) {
            alert('Vui lòng đăng nhập để quay Vòng Quay May Mắn!');
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
                alert(data.message);
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

            const extraSpins = 5 + Math.floor(Math.random() * 3); // 5-8 vòng
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
            }, 5000);

        } catch (err) {
            alert('Lỗi kết nối! Vui lòng thử lại.');
            setSpinning(false);
        }

    }, [spinning, canSpin, rotation, recordSpin, token, loadingConfig, prizes]);

    if (loadingConfig) {
        return (
            <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <Loader2 className="animate-spin text-white w-12 h-12" />
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
                className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl"
                initial={{ scale: 0.8, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 40 }}
                transition={{ type: 'spring', bounce: 0.3 }}
            >
                {/* Header */}
                <div className="relative bg-gradient-to-r from-amber-500 to-yellow-400 px-6 pt-6 pb-16 text-center">
                    <button onClick={!spinning ? onClose : undefined} className="absolute right-4 top-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                        <X size={20} className="text-white" />
                    </button>
                    <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2 drop-shadow-md">
                        <Sparkles size={24} className="text-yellow-100" />
                        VÒNG QUAY MAY MẮN
                        <Sparkles size={24} className="text-yellow-100" />
                    </h2>
                    <p className="text-yellow-50 font-medium mt-1 drop-shadow">Quay mỗi ngày - Nhận quà liền tay!</p>
                </div>

                {/* Wheel Area */}
                <div className="relative px-6 pb-8 -mt-12 flex flex-col items-center">
                    {/* Wheel container */}
                    <div className="relative w-72 h-72 rounded-full p-2 bg-gradient-to-br from-yellow-300 to-amber-600 shadow-xl">
                        {/* Outer dots */}
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div
                                key={i}
                                className={`absolute w-2 h-2 rounded-full ${i % 2 === 0 ? 'bg-yellow-100' : 'bg-red-400'} shadow-sm`}
                                style={{
                                    top: '50%', left: '50%',
                                    transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-138px)`,
                                }}
                            />
                        ))}

                        {/* The Canvas Wheel */}
                        <motion.div
                            className="relative w-full h-full rounded-full overflow-hidden shadow-inner bg-white"
                            animate={{ rotate: rotation }}
                            transition={{ duration: spinning ? 5 : 0, ease: [0.15, 0.85, 0.15, 1] }}
                        >
                            <canvas ref={canvasRef} width={272} height={272} className="w-full h-full block" />
                        </motion.div>

                        {/* Pointer */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-10 drop-shadow-md z-10 flex flex-col items-center">
                            <div className="w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-sm z-10" />
                            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-red-600 -mt-2" />
                        </div>
                    </div>

                    {/* Spin Button or Timer */}
                    <div className="mt-8 w-full">
                        {canSpin ? (
                            <button
                                onClick={spin}
                                disabled={spinning}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-xl shadow-lg shadow-red-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {spinning ? 'ĐANG QUAY...' : 'QUAY NGAY!'}
                            </button>
                        ) : (
                            <div className="w-full py-4 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1">
                                <span className="font-bold text-slate-600 flex items-center gap-2">
                                    <Clock size={18} /> Bạn đã hết lượt quay
                                </span>
                                <span className="text-sm font-medium text-slate-500">
                                    Lượt quay tiếp theo sau: <span className="text-indigo-600">{timeLeft}</span>
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
