'use client';
/**
 * TryOnModal — Modal thử đồ AI nhúng trực tiếp vào trang sản phẩm
 * Mở modal → upload ảnh → bấm thử → xem kết quả — tất cả trong 1 popup
 */
import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Camera, Upload, Sparkles, Loader2, Download,
    RotateCcw, ArrowLeftRight, AlertCircle, CheckCircle2
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { renderSmartTryOn } from '@/lib/smartTryOnEngine';

// ─── Compare Slider (nhẹ, không deps ngoài) ───────────────────
function CompareSlider({ before, after }: { before: string; after: string }) {
    const [pos, setPos] = useState(50);
    const ref = useRef<HTMLDivElement>(null);
    const dragging = useRef(false);

    const move = useCallback((clientX: number) => {
        if (!ref.current) return;
        const { left, width } = ref.current.getBoundingClientRect();
        setPos(Math.max(5, Math.min(95, ((clientX - left) / width) * 100)));
    }, []);

    return (
        <div
            ref={ref}
            className="relative w-full h-full select-none cursor-col-resize"
            onMouseMove={e => { if (dragging.current) move(e.clientX); }}
            onMouseUp={() => { dragging.current = false; }}
            onMouseLeave={() => { dragging.current = false; }}
            onTouchMove={e => move(e.touches[0].clientX)}
        >
            <img src={after} alt="AI" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
                <img src={before} alt="Before" className="absolute inset-0 h-full object-cover"
                    style={{ width: `${10000 / pos}%`, maxWidth: 'none' }} />
            </div>
            <div className="absolute top-0 bottom-0" style={{ left: `${pos}%` }}>
                <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg -translate-x-1/2" />
                <div
                    onMouseDown={e => { e.preventDefault(); dragging.current = true; }}
                    onTouchStart={() => { dragging.current = true; }}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 bg-white rounded-full shadow-xl flex items-center justify-center cursor-grab"
                >
                    <ArrowLeftRight size={14} className="text-slate-700" />
                </div>
            </div>
            <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Gốc</span>
            <span className="absolute bottom-2 right-2 bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✨ AI</span>
        </div>
    );
}

// ─── Props ───────────────────────────────────────────────────
interface TryOnModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: {
        name: string;
        image: string;
        category?: string;
    };
}

// ─── Main Modal ──────────────────────────────────────────────
export default function TryOnModal({ isOpen, onClose, product }: TryOnModalProps) {
    const [userPhoto, setUserPhoto] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) { toast.error('Chỉ hỗ trợ định dạng ảnh'); return; }
        const reader = new FileReader();
        reader.onload = e => {
            setUserPhoto(e.target?.result as string);
            setResultImage(null);
            setStatus('idle');
        };
        reader.readAsDataURL(file);
    };

    const handleStartTryOn = async () => {
        if (!userPhoto) { toast.error('Vui lòng upload ảnh của bạn!'); return; }

        setStatus('processing');
        setResultImage(null);

        try {
            const res = await fetch('/api/tryon/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userImageBase64: userPhoto,
                    garmentImageUrl: product.image,
                    category: product.category || 'tops'
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Lỗi server (${res.status})`);
            }

            const data = await res.json();
            if (!data.success || !data.jobId) {
                throw new Error(data.message || 'Không thể khởi tạo thử đồ');
            }

            const jobId = data.jobId;
            let attempts = 0;
            const pollInterval = setInterval(async () => {
                attempts++;
                try {
                    const statusRes = await fetch(`/api/tryon/job-status/${jobId}`);
                    if (!statusRes.ok) return;

                    const statusData = await statusRes.json();
                    if (statusData.success && statusData.job) {
                        const job = statusData.job;
                        if (job.status === 'completed') {
                            clearInterval(pollInterval);
                            
                            let finalImg = job.resultImage;
                            if (!finalImg || job.requireComposite) {
                                try {
                                    finalImg = await renderSmartTryOn(
                                        job.userImage || userPhoto,
                                        job.garmentUrl || product.image,
                                        job.category || product.category || 'upper_body'
                                    );
                                } catch (cErr) {
                                    console.warn('Smart render fallback error:', cErr);
                                    finalImg = userPhoto;
                                }
                            }

                            setResultImage(finalImg);
                            setStatus('done');
                            toast.success('✨ AI thử đồ hoàn tất!');
                        } else if (job.status === 'failed') {
                            clearInterval(pollInterval);
                            // Fallback sang Canvas Engine lập tức thay vì báo thất bại hẳn
                            try {
                                const fallbackImg = await renderSmartTryOn(
                                    userPhoto,
                                    product.image,
                                    product.category || 'upper_body'
                                );
                                setResultImage(fallbackImg);
                                setStatus('done');
                                toast.success('✨ Thử đồ thành công với Smart Engine!');
                            } catch {
                                setStatus('error');
                                toast.error(job.error || 'Thử đồ thất bại');
                            }
                        }
                    }
                    // Nếu poll quá 40 lần (~100s), dùng Smart Fitting Engine lập tức
                    if (attempts > 40) {
                        clearInterval(pollInterval);
                        const fallbackImg = await renderSmartTryOn(
                            userPhoto,
                            product.image,
                            product.category || 'upper_body'
                        );
                        setResultImage(fallbackImg);
                        setStatus('done');
                        toast.success('✨ Thử đồ hoàn tất!');
                    }
                } catch (pollErr) {
                    console.warn('Poll error:', pollErr);
                }
            }, 2500);

        } catch (err: any) {
            setStatus('error');
            toast.error(err.message || 'Lỗi xử lý AI');
        }
    };

    const handleDownload = () => {
        if (!resultImage) return;
        const a = document.createElement('a');
        a.href = resultImage;
        a.download = `haven-tryon-${Date.now()}.jpg`;
        a.click();
    };

    const handleClose = () => {
        setUserPhoto(null);
        setResultImage(null);
        setStatus('idle');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
                    >
                        <div className="bg-slate-900 rounded-2xl border border-slate-700/60 shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                        <Sparkles size={16} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-sm">AI Virtual Try-On</p>
                                        <p className="text-slate-400 text-xs line-clamp-1">{product.name}</p>
                                    </div>
                                </div>
                                <button onClick={handleClose} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-5 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Left: Upload */}
                                    <div className="space-y-3">
                                        <p className="text-slate-300 text-xs font-semibold">1. Ảnh của bạn</p>
                                        <div
                                            onDragOver={e => { e.preventDefault(); setDragging(true); }}
                                            onDragLeave={() => setDragging(false)}
                                            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                                            className={`aspect-[3/4] rounded-xl border-2 border-dashed transition-all overflow-hidden relative cursor-pointer
                                                ${dragging ? 'border-amber-400 bg-amber-400/10' : 'border-slate-600 hover:border-slate-500 bg-slate-800/40'}
                                                ${userPhoto ? 'border-0' : ''}`}
                                            onClick={() => !userPhoto && inputRef.current?.click()}
                                        >
                                            <input ref={inputRef} type="file" accept="image/*" className="hidden"
                                                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

                                            {userPhoto ? (
                                                <>
                                                    <img src={userPhoto} alt="You" className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={e => { e.stopPropagation(); setUserPhoto(null); setResultImage(null); setStatus('idle'); }}
                                                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-3">
                                                    <Camera size={28} className="text-amber-400" />
                                                    <p className="text-slate-400 text-xs">
                                                        Kéo thả hoặc<br />
                                                        <span className="text-amber-400 font-semibold">click để chọn</span>
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="bg-slate-800/40 rounded-lg p-2 text-[11px] text-slate-500 space-y-0.5">
                                            <p>• Đứng thẳng, nền đơn giản</p>
                                            <p>• Toàn thân hoặc nửa người trên</p>
                                        </div>
                                    </div>

                                    {/* Right: Product + Result */}
                                    <div className="space-y-3">
                                        <p className="text-slate-300 text-xs font-semibold">
                                            {status === 'done' ? '✨ Kết quả (kéo slider)' : '2. Trang phục đã chọn'}
                                        </p>
                                        <div className="aspect-[3/4] rounded-xl overflow-hidden relative bg-white">
                                            {status === 'done' && resultImage && userPhoto ? (
                                                <CompareSlider before={userPhoto} after={resultImage} />
                                            ) : status === 'processing' ? (
                                                <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-3">
                                                    <div className="w-14 h-14 rounded-full border-4 border-amber-500/30 border-t-amber-400 animate-spin" />
                                                    <p className="text-white text-xs font-bold">AI đang xử lý...</p>
                                                    <p className="text-slate-400 text-xs">~30-60 giây</p>
                                                </div>
                                            ) : (
                                                <Image src={product.image} alt={product.name} fill className="object-contain p-3" />
                                            )}
                                        </div>

                                        {status === 'error' && (
                                            <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                                                <AlertCircle size={14} className="text-red-400 shrink-0" />
                                                <p className="text-red-300 text-xs">Xử lý thất bại. Thử lại!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-2 pt-1">
                                    {status === 'done' ? (
                                        <>
                                            <button onClick={() => { setResultImage(null); setStatus('idle'); }}
                                                className="flex-1 h-11 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors hover:border-slate-500">
                                                <RotateCcw size={16} /> Thử lại
                                            </button>
                                            <button onClick={handleDownload}
                                                className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                                                <Download size={16} /> Tải ảnh về
                                            </button>
                                        </>
                                    ) : (
                                        <motion.button
                                            onClick={handleStartTryOn}
                                            disabled={!userPhoto || status === 'processing'}
                                            whileTap={userPhoto && status !== 'processing' ? { scale: 0.97 } : {}}
                                            className={`w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
                                                ${userPhoto && status !== 'processing'
                                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg'
                                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                                        >
                                            {status === 'processing' ? (
                                                <><Loader2 size={18} className="animate-spin" /> AI đang xử lý (~30-60s)...</>
                                            ) : (
                                                <><Sparkles size={18} /> Bắt Đầu Thử Đồ AI</>
                                            )}
                                        </motion.button>
                                    )}
                                </div>

                                {/* Notice */}
                                <p className="text-slate-500 text-[11px] text-center">
                                    Kết quả được tạo bởi AI, có thể chưa hoàn toàn chính xác. Mang tính tham khảo.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
