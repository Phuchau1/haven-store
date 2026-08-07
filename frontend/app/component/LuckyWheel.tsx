/* eslint-disable */
'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, RotateCcw, Copy, Check, Sparkles, Clock, Loader2, Info, AlertCircle } from 'lucide-react';
import { useLuckyWheelStore, WheelPrize, WheelConfig } from '@/app/store/useLuckyWheelStore';
import { useAuth } from '@/app/component/AuthContext';
import { useToast } from '@/app/component/ToastProvider';

const DEFAULT_COLORS = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

const mapPrize = (p: any, index: number): WheelPrize => {
    let rawLabel = p.reward || p.label || 'Quà tặng';
    let shortLabel = rawLabel;
    let emoji = '🎁';
    let type: any = p.type;
    
    if (p.type === 'fixed') {
        const val = Number(p.discount_value) || 0;
        shortLabel = val > 0 ? `Giảm ${val / 1000}k` : rawLabel;
        emoji = '💸';
        type = 'voucher';
    } else if (p.type === 'percent') {
        const val = Number(p.discount_value) || 0;
        shortLabel = val > 0 ? `Giảm ${val}%` : rawLabel;
        emoji = '🏷️';
        type = 'voucher';
    } else if (p.type === 'shipping') {
        shortLabel = rawLabel.includes('Freeship') ? rawLabel : 'Freeship';
        emoji = '🚚';
        type = 'voucher';
    } else if (p.type === 'none') {
        shortLabel = rawLabel.includes('May mắn') ? rawLabel : 'May mắn lần sau';
        emoji = '☘️';
        type = 'retry';
    }

    return {
        id: p._id || p.id,
        label: rawLabel,
        shortLabel,
        type,
        value: Number(p.discount_value) || 0,
        code: type !== 'retry' ? p.coupon_code : '',
        color: p.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
        textColor: '#FFFFFF',
        emoji,
        probability: p.probability !== undefined ? Number(p.probability) : 1
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

        // Thick Crisp White dividers
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // Render Text & Icon
        ctx.save();
        ctx.translate(cx, cy);
        const midAngle = startAngle + (endAngle - startAngle) / 2;
        ctx.rotate(midAngle);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FFFFFF';

        ctx.font = `bold 15px Arial, Helvetica, sans-serif`;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 1;

        const textToRender = `${prize.emoji} ${prize.shortLabel}`;
        ctx.fillText(textToRender, radius - 24, 5);
        ctx.restore();
    });

    // Center Gold Knob
    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, Math.PI * 2);
    ctx.fillStyle = '#F59E0B';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎁', cx, cy);
}

// Modal kết quả trúng thưởng
function PrizeModal({ prize, prizes, onClose }: { prize: WheelPrize; prizes: WheelPrize[]; onClose: () => void }) {
    const [copied, setCopied] = useState(false);
    const { showToast } = useToast();

    const handleCopy = () => {
        if (prize.code) {
            navigator.clipboard.writeText(prize.code);
            setCopied(true);
            showToast(`Đã sao chép mã ${prize.code}`, 'success', 'Đã lưu');
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
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <motion.div
                className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 text-center"
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
            >
                <div className="p-6 pt-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-4xl shadow-inner animate-bounce">
                        {prize.emoji}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        {prize.type === 'retry' ? 'Chúc may mắn lần sau!' : 'Chúc mừng bạn!'}
                    </h2>
                    <p className="text-slate-500 mt-1 text-xs font-medium">
                        {prize.type === 'retry' ? 'Hãy quay lại vào chu kỳ tiếp theo nhé!' : 'Bạn đã nhận được phần thưởng'}
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
    const { token, user } = useAuth();
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [prize, setPrize] = useState<WheelPrize | null>(null);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [prizes, setPrizes] = useState<WheelPrize[]>([]);
    
    const { config, setConfig, canSpin, statusMessage, checkCanSpin, recordSpin, getTimeUntilNextSpin } = useLuckyWheelStore();
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
                const apiEndpoint = process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL !== 'undefined'
                    ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/api/lucky-wheel/config`
                    : '/api/lucky-wheel/config';
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
        if (config?.requireLogin !== false && !token) {
            showToast('Vui lòng đăng nhập để quay Vòng Quay May Mắn!', 'warning', 'Chưa đăng nhập');
            return;
        }

        setSpinning(true);
        setPrize(null);

        try {
            const apiEndpoint = process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL !== 'undefined'
                ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/api/lucky-wheel/spin`
                : '/api/lucky-wheel/spin';

            const deviceId = typeof window !== 'undefined' ? (localStorage.getItem('device_id') || 'web-client') : 'web-client';
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'x-device-id': deviceId
            };

            if (token) {
                headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
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
                showToast(data.message || 'Không thể quay', 'error', 'Lỗi quay thưởng');
                setSpinning(false);
                return;
            }

            const winPrizeBackend = data.prize;
            const winIndex = prizes.findIndex(p => String(p.id) === String(winPrizeBackend._id || winPrizeBackend.id));
            if (winIndex === -1) {
                setSpinning(false);
                showToast('Lỗi xác định phần thưởng.', 'error', 'Lỗi');
                return;
            }

            // Tính toán góc quay
            const numSegments = prizes.length;
            const segmentAngle = 360 / numSegments;
            const targetSegmentCenterAngle = (winIndex + 0.5) * segmentAngle;
            const currentRotationMod = rotation % 360;
            const targetRotationOffset = (360 - targetSegmentCenterAngle) % 360;
            let diff = targetRotationOffset - currentRotationMod;
            if (diff < 0) diff += 360;

            const extraRounds = 360 * (5 + Math.floor(Math.random() * 2));
            const finalAngle = rotation + extraRounds + diff;
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

        } catch (err: any) {
            console.error('Spin execution error:', err);
            showToast(err?.message || 'Lỗi kết nối! Vui lòng thử lại.', 'error', 'Lỗi kết nối');
            setSpinning(false);
        }

    }, [spinning, canSpin, rotation, recordSpin, token, user?.id, loadingConfig, prizes, config]);

    if (loadingConfig) {
        return (
            <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <Loader2 className="animate-spin text-red-500 w-12 h-12" />
            </div>
        );
    }

    return (
        <motion.div
            className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={!spinning ? onClose : undefined} />

            <motion.div
                className="relative w-full max-w-[500px] max-h-[90vh] bg-white rounded-3xl overflow-y-auto shadow-2xl border border-slate-100 my-auto flex flex-col"
                initial={{ scale: 0.85, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 20 }}
                transition={{ type: 'spring', bounce: 0.2 }}
            >
                {/* Header Clean Red Theme (Sticky Top) */}
                <div className="relative bg-red-600 px-6 pt-5 pb-5 text-center text-white shrink-0 sticky top-0 z-30 shadow-sm">
                    <button
                        onClick={!spinning ? onClose : undefined}
                        className="absolute right-4 top-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                    
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center justify-center gap-2">
                        <span>🎁</span> VÒNG QUAY MAY MẮN
                    </h2>
                    <p className="text-red-100 text-xs sm:text-sm font-medium mt-0.5">Quay mỗi ngày — Nhận voucher quà tặng siêu hấp dẫn</p>

                    {/* Banner ngày sự kiện nếu có */}
                    {(config?.startDate || config?.endDate) && (
                        <div className="mt-1.5 text-[11px] bg-white/15 px-3 py-0.5 rounded-full inline-flex items-center gap-1.5 font-medium text-white/90">
                            <Clock size={12} />
                            <span>
                                {config.startDate ? `Từ ${new Date(config.startDate).toLocaleDateString('vi-VN')}` : ''}
                                {config.endDate ? ` đến ${new Date(config.endDate).toLocaleDateString('vi-VN')}` : ''}
                            </span>
                        </div>
                    )}
                </div>

                {/* Wheel Area */}
                <div className="relative px-5 py-5 flex flex-col items-center bg-slate-50/60 shrink-0">

                    {/* Vòng quay đang bảo trì */}
                    {config?.isActive === false ? (
                        <div className="w-full p-6 text-center bg-rose-50 border border-rose-200 rounded-2xl space-y-2 mb-4">
                            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                            <h3 className="text-base font-bold text-rose-800">Vòng quay đang tạm ngưng bảo trì</h3>
                            <p className="text-xs text-rose-600">Vui lòng quay lại sau khi ban quản trị hoàn tất nâng cấp.</p>
                        </div>
                    ) : (
                        <>
                            {/* Outer Frame (Size 320px ~ 360px responsive) */}
                            <div className="relative w-[300px] h-[300px] sm:w-[350px] sm:h-[350px] rounded-full p-3 bg-white shadow-xl border-[4px] border-amber-400 flex items-center justify-center shrink-0 my-1">
                                
                                {/* Bulbs / Dots */}
                                {Array.from({ length: 16 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`absolute w-3 h-3 rounded-full ${i % 2 === 0 ? 'bg-red-500' : 'bg-amber-400'} shadow-sm`}
                                        style={{
                                            top: '50%', left: '50%',
                                            transform: `translate(-50%, -50%) rotate(${i * 22.5}deg) translateY(-144px)`,
                                        }}
                                    />
                                ))}

                                {/* Rotating Wheel Canvas */}
                                <motion.div
                                    className="relative w-full h-full rounded-full overflow-hidden shadow-inner bg-white"
                                    animate={{ rotate: rotation }}
                                    transition={{ duration: spinning ? 5.2 : 0, ease: [0.15, 0.85, 0.15, 1] }}
                                >
                                    <canvas ref={canvasRef} width={360} height={360} className="w-full h-full block" />
                                </motion.div>

                                {/* Red Pin Pointer Arrow */}
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-9 h-11 drop-shadow-md z-20 flex flex-col items-center pointer-events-none">
                                    <div className="w-5 h-5 bg-red-600 rounded-full border-2 border-white shadow-sm z-10" />
                                    <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[24px] border-t-red-600 -mt-2.5 filter drop-shadow" />
                                </div>
                            </div>

                            {/* Hiển thị xác suất trúng thưởng công khai (%) */}
                            {config?.showProbability && prizes.length > 0 && (
                                <div className="mt-3 w-full p-2.5 bg-amber-50/90 border border-amber-200/80 rounded-2xl text-[11px] text-amber-950 font-medium">
                                    <div className="flex items-center gap-1.5 font-bold mb-1 text-amber-900">
                                        <Sparkles size={13} className="text-amber-600" />
                                        <span>Tỷ lệ trúng thưởng công khai (%):</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {prizes.map((p, idx) => (
                                            <span key={idx} className="px-2 py-0.5 rounded-lg bg-white border border-amber-200/80 text-[10px] font-semibold text-slate-700 shadow-2xs">
                                                {p.shortLabel || p.label}: <strong className="text-amber-700">{p.probability}%</strong>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Button & Status */}
                            <div className="mt-4 w-full">
                                {canSpin ? (
                                    <button
                                        onClick={spin}
                                        disabled={spinning}
                                        className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-lg shadow-xl shadow-red-500/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        {spinning ? (
                                            <>
                                                <Loader2 className="animate-spin text-white" size={22} />
                                                <span>ĐANG QUAY...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>✨</span>
                                                <span>QUAY NGAY!</span>
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <div className="w-full py-3 px-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-xs sm:text-sm text-slate-700 flex items-center gap-2">
                                                <Clock size={16} className="text-orange-500" />
                                                {statusMessage || 'Đã hết lượt quay trong lượt này'}
                                            </span>
                                            {timeLeft && (
                                                <span className="text-[11px] font-mono font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-xl border border-orange-200">
                                                    {timeLeft}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
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
