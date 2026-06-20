'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, RotateCcw, Copy, Check, Sparkles, Clock } from 'lucide-react';
import { useLuckyWheelStore, WHEEL_PRIZES, WheelPrize } from '@/app/store/useLuckyWheelStore';

const NUM_SEGMENTS = WHEEL_PRIZES.length;
const SEGMENT_ANGLE = 360 / NUM_SEGMENTS;

// Draw wheel on canvas
function drawWheel(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const radius = cx - 8;

    ctx.clearRect(0, 0, size, size);

    WHEEL_PRIZES.forEach((prize, i) => {
        const startAngle = (i * SEGMENT_ANGLE - 90) * (Math.PI / 180);
        const endAngle = ((i + 1) * SEGMENT_ANGLE - 90) * (Math.PI / 180);

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
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${size > 300 ? 13 : 11}px 'Be Vietnam Pro', Inter, sans-serif`;
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 4;
        ctx.fillText(prize.shortLabel, radius - 12, 5);
        // Emoji
        ctx.font = `${size > 300 ? 16 : 13}px serif`;
        ctx.fillText(prize.emoji, radius - 12 - (size > 300 ? 50 : 40), 5);
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
function PrizeModal({ prize, onClose }: { prize: WheelPrize; onClose: () => void }) {
    const [copied, setCopied] = useState(false);
    const particles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 320,
        y: Math.random() * 100,
        color: WHEEL_PRIZES[i % WHEEL_PRIZES.length].color,
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
                                className="inline-block px-6 py-3 rounded-2xl text-white font-black text-2xl"
                                style={{ backgroundColor: prize.color }}
                            >
                                {prize.label}
                            </div>
                        </div>

                        {prize.code && (
                            <>
                                <p className="text-xs text-center text-gray-400 mb-2 uppercase tracking-wider">Mã giảm giá của bạn</p>
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
                                <p className="text-xs text-center text-gray-400 mt-2">Nhấn để sao chép • Có thể dùng ngay khi thanh toán</p>
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
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [prize, setPrize] = useState<WheelPrize | null>(null);
    const { canSpinToday, recordSpin, getTimeUntilNextSpin } = useLuckyWheelStore();
    const canSpin = canSpinToday();
    const timeLeft = !canSpin ? getTimeUntilNextSpin() : '';

    useEffect(() => {
        if (canvasRef.current) drawWheel(canvasRef.current);
    }, []);

    const spin = useCallback(() => {
        if (spinning || !canSpin) return;
        setSpinning(true);
        setPrize(null);

        // Weighted random: less chance on 20% and 50K
        const weights = [20, 12, 30, 5, 18, 30, 8, 15];
        const total = weights.reduce((a, b) => a + b, 0);
        let rand = Math.random() * total;
        let winIndex = 0;
        for (let i = 0; i < weights.length; i++) {
            rand -= weights[i];
            if (rand <= 0) { winIndex = i; break; }
        }

        const targetAngle = winIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
        const extraSpins = 5 + Math.floor(Math.random() * 5); // 5-10 full rotations
        const finalAngle = rotation + extraSpins * 360 + (360 - targetAngle) - (rotation % 360);

        setRotation(finalAngle);

        setTimeout(() => {
            const won = WHEEL_PRIZES[winIndex];
            setPrize(won);
            recordSpin(won);
            setSpinning(false);
        }, 5000);
    }, [spinning, canSpin, rotation, recordSpin]);

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
                        <X size={18} className="text-white" />
                    </button>
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <Sparkles size={20} className="text-white" />
                        <h2 className="text-xl font-black text-white tracking-tight">VÒNG QUAY MAY MẮN</h2>
                        <Sparkles size={20} className="text-white" />
                    </div>
                    <p className="text-white/80 text-sm">Quay ngay để nhận ưu đãi độc quyền!</p>
                </div>

                {/* Wheel area */}
                <div className="relative px-6 -mt-10">
                    <div className="relative flex flex-col items-center">
                        {/* Pointer arrow */}
                        <div className="relative z-10 mb-[-12px]">
                            <div className="w-0 h-0" style={{
                                borderLeft: '12px solid transparent',
                                borderRight: '12px solid transparent',
                                borderTop: '24px solid #C9A227',
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                            }} />
                        </div>

                        {/* Canvas wheel */}
                        <div className="relative w-72 h-72">
                            <canvas
                                ref={canvasRef}
                                width={288}
                                height={288}
                                className="w-full h-full rounded-full"
                                style={{
                                    transition: spinning ? 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                                    transform: `rotate(${rotation}deg)`,
                                    boxShadow: '0 0 30px rgba(201,162,39,0.3), 0 8px 32px rgba(0,0,0,0.15)',
                                }}
                            />
                        </div>
                    </div>

                    {/* Spin button */}
                    <div className="mt-6 mb-6">
                        {canSpin ? (
                            <button
                                onClick={spin}
                                disabled={spinning}
                                className="w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                style={{
                                    background: spinning ? '#9CA3AF' : 'linear-gradient(135deg, #C9A227 0%, #F59E0B 100%)',
                                    color: '#fff',
                                    boxShadow: spinning ? 'none' : '0 4px 20px rgba(201,162,39,0.4)',
                                }}
                            >
                                {spinning ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <RotateCcw size={18} className="animate-spin" /> Đang quay...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <Gift size={18} /> QUAY NGAY!
                                    </span>
                                )}
                            </button>
                        ) : (
                            <div className="text-center py-4 rounded-2xl bg-gray-100">
                                <p className="text-gray-500 text-sm font-medium flex items-center justify-center gap-2">
                                    <Clock size={16} />
                                    Quay lại sau: <span className="font-bold text-gray-700">{timeLeft}</span>
                                </p>
                                <p className="text-xs text-gray-400 mt-1">Mỗi ngày chỉ được quay 1 lần</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Prize modal */}
            <AnimatePresence>
                {prize && <PrizeModal prize={prize} onClose={() => { setPrize(null); onClose(); }} />}
            </AnimatePresence>
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
                        className="fixed bottom-24 right-4 z-40 flex flex-col items-center gap-1 group"
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
