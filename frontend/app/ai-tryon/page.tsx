'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera, Upload, X, Download, ChevronRight, Sparkles,
    Loader2, CheckCircle2, AlertCircle, ZoomIn, RotateCcw,
    ArrowLeftRight, Info, Shirt
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface Product {
    id: string;
    name: string;
    images: string[];
    price: number;
    category?: string;
    subCategory?: string;
}

type ProcessingStep = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

// ─────────────────────────────────────────────────────────────
// Compare Slider Component
// ─────────────────────────────────────────────────────────────
function CompareSlider({ before, after }: { before: string; after: string }) {
    const [pos, setPos] = useState(50);
    const ref = useRef<HTMLDivElement>(null);
    const dragging = useRef(false);

    const move = useCallback((clientX: number) => {
        if (!ref.current) return;
        const { left, width } = ref.current.getBoundingClientRect();
        const pct = Math.max(5, Math.min(95, ((clientX - left) / width) * 100));
        setPos(pct);
    }, []);

    return (
        <div
            ref={ref}
            className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden select-none cursor-col-resize"
            onMouseMove={e => { if (dragging.current) move(e.clientX); }}
            onMouseUp={() => { dragging.current = false; }}
            onMouseLeave={() => { dragging.current = false; }}
            onTouchMove={e => move(e.touches[0].clientX)}
        >
            {/* After (result) — full width underneath */}
            <img src={after} alt="AI Result" className="absolute inset-0 w-full h-full object-cover" />

            {/* Before (original) — clipped left side */}
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
                <img src={before} alt="Original" className="absolute inset-0 w-full h-full object-cover"
                    style={{ width: `${10000 / pos}%`, maxWidth: 'none' }} />
            </div>

            {/* Divider */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" style={{ left: `${pos}%` }}>
                <div
                    onMouseDown={e => { e.preventDefault(); dragging.current = true; }}
                    onTouchStart={() => { dragging.current = true; }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center cursor-grab"
                >
                    <ArrowLeftRight size={18} className="text-slate-700" />
                </div>
            </div>

            {/* Labels */}
            <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm">Ảnh gốc</div>
            <div className="absolute bottom-3 right-3 bg-amber-500/90 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm">✨ AI Kết quả</div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Upload Zone Component
// ─────────────────────────────────────────────────────────────
function UploadZone({
    photo, onUpload, onClear
}: {
    photo: string | null;
    onUpload: (f: File) => void;
    onClear: () => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file?.type.startsWith('image/')) onUpload(file);
    };

    return (
        <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`relative w-full aspect-[3/4] rounded-2xl border-2 border-dashed transition-all overflow-hidden
                ${dragging ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-slate-50'}
                ${photo ? 'border-0' : 'cursor-pointer hover:border-amber-300'}`}
            onClick={() => !photo && inputRef.current?.click()}
        >
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])}
            />

            {photo ? (
                <>
                    <img src={photo} alt="Your photo" className="w-full h-full object-cover" />
                    <button
                        onClick={e => { e.stopPropagation(); onClear(); }}
                        className="absolute top-3 right-3 bg-black/60 hover:bg-black text-white rounded-full p-1.5 backdrop-blur-sm transition-colors"
                    >
                        <X size={16} />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <p className="text-white text-xs font-medium text-center">✓ Ảnh đã tải lên</p>
                    </div>
                </>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
                        <Camera size={28} className="text-amber-400" />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-700">Tải ảnh của bạn lên</p>
                        <p className="text-xs text-slate-400 mt-1">Kéo & thả hoặc click để chọn</p>
                    </div>
                    <div className="text-xs text-slate-400 bg-white rounded-xl p-3 border border-slate-100 space-y-1 w-full">
                        <p className="font-medium text-slate-600 mb-1">💡 Hướng dẫn chụp ảnh</p>
                        <p>• Đứng thẳng, chụp toàn thân</p>
                        <p>• Nền đơn giản (trắng/xám)</p>
                        <p>• Đủ ánh sáng, không ngược sáng</p>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Processing Progress Overlay
// ─────────────────────────────────────────────────────────────
function ProcessingOverlay({ step }: { step: ProcessingStep }) {
    const steps = [
        { key: 'uploading', label: 'Đang upload ảnh lên cloud...' },
        { key: 'processing', label: 'AI đang phân tích & ghép trang phục...' },
    ];

    return (
        <AnimatePresence>
            {(step === 'uploading' || step === 'processing') && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-4 z-10"
                >
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full border-4 border-amber-500/30 border-t-amber-400 animate-spin" />
                        <Sparkles size={24} className="text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <div className="text-center">
                        <p className="text-white font-bold text-sm">
                            {step === 'uploading' ? 'Đang chuẩn bị...' : 'AI đang xử lý...'}
                        </p>
                        <p className="text-white/60 text-xs mt-1">
                            {step === 'processing' ? '30-60 giây, vui lòng chờ' : ''}
                        </p>
                    </div>
                    <div className="flex gap-1.5">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce"
                                style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ─────────────────────────────────────────────────────────────
// Product Card (small, for selection list)
// ─────────────────────────────────────────────────────────────
function ProductSelectCard({
    product, selected, onClick
}: {
    product: Product;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`relative w-full text-left rounded-xl overflow-hidden border-2 transition-all ${selected
                ? 'border-amber-400 shadow-lg shadow-amber-100'
                : 'border-slate-100 hover:border-slate-200'}`}
        >
            <div className="aspect-square relative bg-slate-50">
                {product.images?.[0] && (
                    <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                )}
                {selected && (
                    <div className="absolute inset-0 bg-amber-400/20 flex items-center justify-center">
                        <div className="bg-amber-400 rounded-full p-1">
                            <CheckCircle2 size={16} className="text-white" />
                        </div>
                    </div>
                )}
            </div>
            <div className="p-2">
                <p className="text-xs font-medium text-slate-700 line-clamp-2 leading-tight">{product.name}</p>
                <p className="text-xs text-amber-600 font-semibold mt-0.5">
                    {new Intl.NumberFormat('vi-VN').format(product.price)}đ
                </p>
            </div>
        </motion.button>
    );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function AITryOnPage() {
    const [userPhoto, setUserPhoto] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [step, setStep] = useState<ProcessingStep>('idle');
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [loadingProducts, setLoadingProducts] = useState(true);

    // Fetch products
    useEffect(() => {
        fetch('/api/products?limit=50')
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    const withImages = (d.products || d.data || []).filter((p: any) => p.images?.length > 0);
                    setProducts(withImages);
                }
            })
            .catch(() => { })
            .finally(() => setLoadingProducts(false));
    }, []);

    const handlePhotoUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = e => {
            setUserPhoto(e.target?.result as string);
            setResultImage(null);
            setStep('idle');
        };
        reader.readAsDataURL(file);
    };

    const handleStartTryOn = async () => {
        if (!userPhoto) { toast.error('Vui lòng tải ảnh của bạn lên!'); return; }
        if (!selectedProduct) { toast.error('Vui lòng chọn một sản phẩm!'); return; }
        if (!selectedProduct.images?.[0]) { toast.error('Sản phẩm chưa có ảnh.'); return; }

        setStep('uploading');
        setResultImage(null);

        try {
            // Bước 1: Khởi tạo Job (phản hồi tức thì < 0.2s)
            const res = await fetch('/api/tryon/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userImageBase64: userPhoto,
                    garmentImageUrl: selectedProduct.images[0],
                    category: selectedProduct.category || selectedProduct.subCategory || 'tops'
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Lỗi server (${res.status})`);
            }

            const data = await res.json();
            if (!data.success || !data.jobId) {
                throw new Error(data.message || 'Không thể tạo tiến trình thử đồ.');
            }

            setStep('processing');
            const jobId = data.jobId;

            // Bước 2: Polling trạng thái ngầm mỗi 2.5 giây
            const pollInterval = setInterval(async () => {
                try {
                    const statusRes = await fetch(`/api/tryon/job-status/${jobId}`);
                    if (!statusRes.ok) return;

                    const statusData = await statusRes.json();
                    if (statusData.success && statusData.job) {
                        const job = statusData.job;
                        if (job.status === 'completed') {
                            clearInterval(pollInterval);
                            setResultImage(job.resultImage || userPhoto);
                            setStep('done');
                            toast.success('✨ Thử đồ AI thành công!');
                        } else if (job.status === 'failed') {
                            clearInterval(pollInterval);
                            setStep('error');
                            toast.error(job.error || 'Xử lý AI gặp sự cố.');
                        }
                    }
                } catch (pollErr) {
                    console.warn('Polling error:', pollErr);
                }
            }, 2500);

        } catch (err: any) {
            setStep('error');
            toast.error(err.message || 'Lỗi không xác định.');
        }
    };

    const handleDownload = () => {
        if (!resultImage) return;
        const a = document.createElement('a');
        a.href = resultImage;
        a.download = `haven-tryon-${Date.now()}.jpg`;
        a.click();
        toast.success('Đã tải ảnh về!');
    };

    const handleReset = () => {
        setResultImage(null);
        setStep('idle');
    };

    // Filter products
    const filteredProducts = products.filter(p => {
        const matchQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCat = categoryFilter === 'all' || (p.category || '').toLowerCase().includes(categoryFilter) ||
            (p.subCategory || '').toLowerCase().includes(categoryFilter);
        return matchQuery && matchCat;
    });

    const isProcessing = step === 'uploading' || step === 'processing';
    const canStart = !!userPhoto && !!selectedProduct && !isProcessing;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <div className="border-b border-slate-800/60 backdrop-blur-xl bg-slate-950/80 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-slate-400 hover:text-white transition-colors text-sm">← Về trang chủ</Link>
                        <span className="text-slate-700">|</span>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                <Sparkles size={14} className="text-white" />
                            </div>
                            <span className="font-bold text-white text-sm">Haven AI Try-On Studio</span>
                        </div>
                    </div>
                    <span className="text-xs text-amber-400/80 font-medium hidden sm:block">
                        Powered by IDM-VTON Technology
                    </span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <span className="inline-block text-xs font-bold tracking-widest text-amber-400 uppercase mb-3 px-3 py-1 rounded-full border border-amber-400/30 bg-amber-400/5">
                        AI Virtual Try-On Studio
                    </span>
                    <h1 className="text-4xl lg:text-5xl font-black text-white mb-3">
                        Thử Đồ với{' '}
                        <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                            Trí Tuệ Nhân Tạo
                        </span>
                    </h1>
                    <p className="text-slate-400 text-base max-w-xl mx-auto">
                        Upload ảnh cá nhân của bạn, chọn trang phục và xem AI ghép đồ lên người trong vài giây
                    </p>
                </motion.div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* ═══ LEFT: Upload Photo ═══ */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800/60 backdrop-blur-xl">
                            <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                                <Camera size={18} className="text-amber-400" />
                                Ảnh Của Bạn
                            </h2>
                            <UploadZone
                                photo={userPhoto}
                                onUpload={handlePhotoUpload}
                                onClear={() => { setUserPhoto(null); setResultImage(null); setStep('idle'); }}
                            />

                            {/* Tips */}
                            <div className="mt-4 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                <p className="text-blue-300 text-xs font-semibold mb-1.5 flex items-center gap-1">
                                    <Info size={12} /> Mẹo chụp ảnh đẹp
                                </p>
                                <ul className="text-xs text-slate-400 space-y-1">
                                    <li>• Đứng thẳng, tư thế tự nhiên</li>
                                    <li>• Nền tường trắng hoặc đơn giản</li>
                                    <li>• Ánh sáng tốt, không ngược sáng</li>
                                    <li>• Chụp toàn thân hoặc nửa người trên</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* ═══ MIDDLE: Result ═══ */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800/60 backdrop-blur-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-white font-bold flex items-center gap-2">
                                    <Sparkles size={18} className="text-amber-400" />
                                    Kết Quả Thử Đồ
                                </h2>
                                {step === 'done' && (
                                    <div className="flex gap-2">
                                        <button onClick={handleReset}
                                            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
                                            <RotateCcw size={13} /> Thử lại
                                        </button>
                                        <button onClick={handleDownload}
                                            className="text-xs bg-amber-500 hover:bg-amber-400 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                                            <Download size={13} /> Tải về
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Result Display */}
                            <div className="relative">
                                {step === 'done' && resultImage && userPhoto ? (
                                    <CompareSlider before={userPhoto} after={resultImage} />
                                ) : userPhoto && selectedProduct ? (
                                    // Ready to try — show side by side preview
                                    <div className="aspect-[3/4] rounded-2xl bg-slate-950 flex flex-col items-center justify-center gap-4 border border-slate-800 relative overflow-hidden">
                                        <div className="grid grid-cols-2 gap-3 w-full h-full p-4">
                                            <div className="relative rounded-xl overflow-hidden">
                                                <img src={userPhoto} alt="You" className="w-full h-full object-cover" />
                                                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">Bạn</div>
                                            </div>
                                            <div className="relative rounded-xl overflow-hidden bg-white">
                                                <Image src={selectedProduct.images[0]} alt={selectedProduct.name} fill className="object-contain p-2" />
                                                <div className="absolute bottom-1 left-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">Trang phục</div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-4 inset-x-4 text-center">
                                            <p className="text-amber-300 text-xs font-bold animate-pulse">
                                                ✨ Bấm "BẮT ĐẦU THỬ ĐỒ AI" để xem kết quả
                                            </p>
                                        </div>
                                        <ProcessingOverlay step={step} />
                                    </div>
                                ) : (
                                    <div className="aspect-[3/4] rounded-2xl bg-slate-950 border-2 border-dashed border-slate-800 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
                                        <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center">
                                            <Shirt size={32} className="text-slate-600" />
                                        </div>
                                        <div className="text-center px-6">
                                            <p className="text-slate-300 font-bold">Chưa có kết quả</p>
                                            <p className="text-slate-500 text-xs mt-1">
                                                Tải ảnh của bạn và chọn trang phục muốn thử
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-2 text-xs text-slate-500 bg-slate-900 rounded-xl p-4 mx-4 border border-slate-800">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${userPhoto ? 'border-green-400 bg-green-400/20' : 'border-slate-600'}`}>
                                                    {userPhoto && <CheckCircle2 size={12} className="text-green-400" />}
                                                </div>
                                                <span className={userPhoto ? 'text-green-400' : ''}>Bước 1: Tải ảnh cá nhân</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedProduct ? 'border-green-400 bg-green-400/20' : 'border-slate-600'}`}>
                                                    {selectedProduct && <CheckCircle2 size={12} className="text-green-400" />}
                                                </div>
                                                <span className={selectedProduct ? 'text-green-400' : ''}>Bước 2: Chọn trang phục</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full border-2 border-slate-600 flex items-center justify-center">
                                                    <Sparkles size={10} className="text-slate-600" />
                                                </div>
                                                <span>Bước 3: Bấm Bắt Đầu Thử Đồ AI</span>
                                            </div>
                                        </div>
                                        <ProcessingOverlay step={step} />
                                    </div>
                                )}
                            </div>

                            {/* Error message */}
                            {step === 'error' && (
                                <div className="mt-4 p-3 bg-red-500/10 rounded-xl border border-red-500/20 flex items-center gap-2">
                                    <AlertCircle size={16} className="text-red-400 shrink-0" />
                                    <p className="text-red-300 text-xs">Xử lý thất bại. Kiểm tra kết nối và thử lại nhé!</p>
                                </div>
                            )}

                            {/* CTA Button */}
                            <motion.button
                                onClick={handleStartTryOn}
                                disabled={!canStart}
                                whileTap={canStart ? { scale: 0.97 } : {}}
                                className={`w-full mt-4 h-12 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
                                    ${canStart
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40'
                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        {step === 'uploading' ? 'Đang upload...' : 'AI đang xử lý... (~30-60s)'}
                                    </>
                                ) : step === 'done' ? (
                                    <>
                                        <RotateCcw size={18} />
                                        Thử Lại với Trang Phục Khác
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        Bắt Đầu Thử Đồ AI
                                    </>
                                )}
                            </motion.button>
                        </div>

                        {/* Selected Product info */}
                        {selectedProduct && (
                            <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-800/40 flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-white">
                                    <Image src={selectedProduct.images[0]} alt={selectedProduct.name} width={48} height={48} className="object-cover w-full h-full" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-semibold line-clamp-1">{selectedProduct.name}</p>
                                    <p className="text-amber-400 text-xs font-bold">
                                        {new Intl.NumberFormat('vi-VN').format(selectedProduct.price)}đ
                                    </p>
                                </div>
                                <Link href={`/product/${selectedProduct.id}`}
                                    className="text-slate-400 hover:text-white text-xs transition-colors shrink-0 flex items-center gap-1">
                                    Xem <ChevronRight size={12} />
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* ═══ RIGHT: Product Selection ═══ */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800/60 backdrop-blur-xl">
                            <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                                <Shirt size={18} className="text-amber-400" />
                                Chọn Trang Phục
                            </h2>

                            {/* Search */}
                            <input
                                type="text"
                                placeholder="Tìm trang phục..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-800/60 text-white placeholder-slate-500 text-sm px-3 py-2.5 rounded-xl border border-slate-700/50 focus:outline-none focus:border-amber-500/50 mb-3"
                            />

                            {/* Category filter */}
                            <div className="flex gap-2 mb-4 flex-wrap">
                                {[
                                    { key: 'all', label: 'Tất cả' },
                                    { key: 'ao', label: '👕 Áo' },
                                    { key: 'quan', label: '👖 Quần' },
                                    { key: 'vay', label: '👗 Váy' },
                                ].map(cat => (
                                    <button
                                        key={cat.key}
                                        onClick={() => setCategoryFilter(cat.key)}
                                        className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${categoryFilter === cat.key
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>

                            {/* Product Grid */}
                            <div className="h-[500px] overflow-y-auto pr-1 space-y-0">
                                {loadingProducts ? (
                                    <div className="flex items-center justify-center h-32">
                                        <Loader2 size={24} className="animate-spin text-amber-400" />
                                    </div>
                                ) : filteredProducts.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500 text-sm">
                                        Không tìm thấy sản phẩm phù hợp
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        {filteredProducts.map(product => (
                                            <ProductSelectCard
                                                key={product.id}
                                                product={product}
                                                selected={selectedProduct?.id === product.id}
                                                onClick={() => {
                                                    setSelectedProduct(product);
                                                    setResultImage(null);
                                                    if (step === 'done' || step === 'error') setStep('idle');
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* How it works */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-12 bg-slate-900/40 rounded-3xl border border-slate-800/40 p-8"
                >
                    <h3 className="text-white font-black text-xl text-center mb-8">Công Nghệ IDM-VTON Hoạt Động Như Thế Nào?</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { step: '01', icon: '📸', title: 'Upload ảnh', desc: 'Tải ảnh cá nhân chụp toàn thân hoặc nửa người trên lên hệ thống' },
                            { step: '02', icon: '👗', title: 'Chọn trang phục', desc: 'Chọn bất kỳ sản phẩm nào từ kho hàng Haven Store' },
                            { step: '03', icon: '🤖', title: 'AI xử lý', desc: 'Mô hình IDM-VTON phân tích body shape, pose và ghép vải tự nhiên' },
                            { step: '04', icon: '✨', title: 'Xem kết quả', desc: 'Nhận ảnh thử đồ chân thực, tải về hoặc tiếp tục thử với đồ khác' },
                        ].map((item) => (
                            <div key={item.step} className="text-center space-y-3">
                                <div className="text-4xl">{item.icon}</div>
                                <div className="inline-block text-xs font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                                    BƯỚC {item.step}
                                </div>
                                <p className="text-white font-bold text-sm">{item.title}</p>
                                <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
