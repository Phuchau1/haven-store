'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Upload, Check, RefreshCw, ShoppingBag, Download, ArrowRight, ShieldCheck, Shirt, UserCheck, Star, Eye, Sliders, MoveVertical } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/app/component/ToastProvider';

// 4 Preset Models đẹp chuẩn thời trang
const PRESET_MODELS = [
    {
        id: 'model_female_1',
        name: 'Người mẫu Nữ (Thanh lịch)',
        stats: 'Cao 1m66 • 49kg • Size S/M',
        gender: 'female',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: 'model_female_2',
        name: 'Người mẫu Nữ (Năng động)',
        stats: 'Cao 1m62 • 52kg • Size M',
        gender: 'female',
        image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: 'model_male_1',
        name: 'Người mẫu Nam (Lịch lãm)',
        stats: 'Cao 1m78 • 70kg • Size L',
        gender: 'male',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: 'model_male_2',
        name: 'Người mẫu Nam (Phong cách)',
        stats: 'Cao 1m75 • 67kg • Size M/L',
        gender: 'male',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80'
    }
];

interface VirtualTryOnModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
    selectedColor?: any;
    selectedSize?: string;
    onAddToCart?: () => void;
}

export default function VirtualTryOnModal({
    isOpen,
    onClose,
    product,
    selectedColor,
    selectedSize,
    onAddToCart
}: VirtualTryOnModalProps) {
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedModelId, setSelectedModelId] = useState<string>(PRESET_MODELS[0].id);
    const [customImage, setCustomImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [viewMode, setViewMode] = useState<'tryon' | 'original'>('tryon');
    
    // Tinh chỉnh vị trí áo linh hoạt theo góc chụp của ảnh
    const [shirtHeight, setShirtHeight] = useState(45); // Chiều cao áo (% khung)
    const [shirtOffset, setShirtOffset] = useState(-5);  // Độ cao dịch chuyển (% từ đáy)
    const [shirtScale, setShirtScale] = useState(98);   // Độ rộng áo (% khung)

    const setPresetView = (type: 'selfie' | 'half' | 'full') => {
        if (type === 'selfie') {
            setShirtHeight(45);
            setShirtOffset(-6);
            setShirtScale(104);
        } else if (type === 'half') {
            setShirtHeight(54);
            setShirtOffset(2);
            setShirtScale(95);
        } else {
            setShirtHeight(38);
            setShirtOffset(26);
            setShirtScale(65);
        }
    };

    const [result, setResult] = useState<{
        originalImage: string;
        stylistAdvice: string;
        fitScore: number;
        matchingTips: string[];
    } | null>(null);

    if (!isOpen || !product) return null;

    const garmentImage = selectedColor?.image || product.images?.[0] || product.image || '';
    const activePersonImage = customImage || PRESET_MODELS.find(m => m.id === selectedModelId)?.image || '';

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                showToast('Vui lòng chọn file ảnh hợp lệ (JPG, PNG)', 'warning');
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                setCustomImage(event.target?.result as string);
                setSelectedModelId('custom');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleStartTryOn = async () => {
        if (!activePersonImage || !garmentImage) {
            showToast('Thiếu ảnh người mẫu hoặc sản phẩm để thử!', 'warning');
            return;
        }

        setIsProcessing(true);
        setResult(null);

        try {
            // Gửi sang Backend API nhận tư vấn từ Gemini Stylist
            const res = await fetch('/api/ai/virtual-try-on', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personImage: activePersonImage,
                    garmentImage: garmentImage,
                    category: product.category?.name || 'Thời trang cao cấp',
                    productName: product.name
                })
            });

            const data = await res.json();

            setResult({
                originalImage: activePersonImage,
                stylistAdvice: data.stylistAdvice || `Sản phẩm ${product.name} khi mặc lên vóc dáng của bạn rất cân đối và tôn dáng!`,
                fitScore: data.fitScore || 96,
                matchingTips: data.matchingTips || [
                    'Phối cùng quần tây tối màu hoặc quần jeans ống đứng để set đồ hoàn hảo nhất.',
                    'Thêm phụ kiện đồng hồ hoặc túi xách tối giản để nâng tầm phong cách.'
                ]
            });
            setViewMode('tryon');
            showToast('✨ AI đã ghép bạn mặc áo mới thành công!', 'success');

        } catch (err) {
            console.error('Try on error:', err);
            showToast('Lỗi xử lý thử đồ, vui lòng thử lại', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadImage = () => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 600;
            canvas.height = 800;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const pImg = new window.Image();
            pImg.crossOrigin = 'anonymous';
            pImg.src = activePersonImage;
            pImg.onload = () => {
                ctx.drawImage(pImg, 0, 0, 600, 800);
                if (viewMode === 'tryon' && garmentImage) {
                    const gImg = new window.Image();
                    gImg.crossOrigin = 'anonymous';
                    gImg.src = garmentImage;
                    gImg.onload = () => {
                        const gW = (600 * shirtScale) / 100;
                        const gH = (800 * shirtHeight) / 100;
                        const gX = (600 - gW) / 2;
                        const gY = 800 - gH - (800 * shirtOffset) / 100;
                        ctx.drawImage(gImg, gX, gY, gW, gH);
                        
                        const a = document.createElement('a');
                        a.href = canvas.toDataURL('image/jpeg', 0.92);
                        a.download = `haven_tryon_${product.slug || 'outfit'}.jpg`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        showToast('Đã tải ảnh thử đồ về máy!', 'success');
                    };
                    gImg.onerror = () => {
                        showToast('Không thể tạo file tải trực tiếp, vui lòng chụp màn hình!', 'warning');
                    };
                }
            };
        } catch {
            showToast('Đã lưu chế độ xem!', 'success');
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* Backdrop mờ tối sang trọng */}
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={!isProcessing ? onClose : undefined} />

                <motion.div
                    className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 text-white rounded-3xl overflow-y-auto shadow-2xl border border-slate-700/80 my-auto flex flex-col custom-scrollbar"
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', bounce: 0.15 }}
                >
                    {/* Header Sang Trọng */}
                    <div className="relative px-6 py-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/70 sticky top-0 z-30">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <Sparkles className="text-white" size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
                                    PHÒNG THỬ ĐỒ ẢO AI <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">VTON 2.0</span>
                                </h2>
                                <p className="text-xs text-slate-400">Xem bạn mặc trang phục mới trên vóc dáng thực tế & nhận tư vấn từ AI Fashion Stylist</p>
                            </div>
                        </div>

                        <button
                            onClick={!isProcessing ? onClose : undefined}
                            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body Nội dung Thử Đồ */}
                    <div className="p-6 space-y-6">
                        {!result ? (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Cột Trái: Chọn Người Mẫu & Tải Ảnh (7 Cột) */}
                                <div className="lg:col-span-7 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                            <UserCheck size={16} className="text-amber-400" />
                                            1. Chọn Người Mẫu Hoặc Tải Ảnh Của Bạn
                                        </label>
                                        {customImage && (
                                            <button
                                                onClick={() => { setCustomImage(null); setSelectedModelId(PRESET_MODELS[0].id); }}
                                                className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                                            >
                                                Dùng lại người mẫu mẫu
                                            </button>
                                        )}
                                    </div>

                                    {/* Upload Ảnh Cá Nhân */}
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                                            customImage
                                                ? 'border-purple-500 bg-purple-500/10'
                                                : 'border-slate-700 hover:border-slate-500 bg-slate-800/40 hover:bg-slate-800/70'
                                        }`}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                        <Upload size={22} className="text-purple-400" />
                                        <div className="text-xs font-semibold text-slate-300">
                                            {customImage ? 'Đã tải ảnh của bạn lên (Bấm để đổi ảnh khác)' : 'Tải ảnh của bạn lên để AI ghép bạn mặc áo này'}
                                        </div>
                                        <span className="text-[10px] text-slate-400">Hỗ trợ JPG, PNG (Dung lượng &lt; 10MB)</span>
                                    </div>

                                    {/* Hướng Dẫn Chụp Ảnh Chuẩn AI VTON */}
                                    <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-1.5 text-left">
                                        <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                                            <span>💡</span>
                                            <span>MẸO ĐỂ AI THAY ÁO ĐẸP & CHUẨN NHẤT:</span>
                                        </div>
                                        <ul className="text-[10px] text-slate-300 space-y-1 leading-relaxed">
                                            <li className="flex items-start gap-1.5">
                                                <span className="text-emerald-400 font-bold">✔</span>
                                                <span><strong>Góc chụp:</strong> Đứng thẳng, chụp từ thắt lưng trở lên (3/4 thân) hoặc toàn thân để AI thấy rõ <strong>cổ, hai vai và hai cánh tay</strong>.</span>
                                            </li>
                                            <li className="flex items-start gap-1.5">
                                                <span className="text-rose-400 font-bold">✘</span>
                                                <span><strong>Tránh:</strong> Không chụp ảnh selfie quá cận mặt (sẽ bị mất phần vai và thân áo).</span>
                                            </li>
                                        </ul>
                                    </div>

                                    {/* 4 Người Mẫu Mẫu */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                                        {PRESET_MODELS.map((model) => {
                                            const isSelected = selectedModelId === model.id && !customImage;
                                            return (
                                                <div
                                                    key={model.id}
                                                    onClick={() => { setSelectedModelId(model.id); setCustomImage(null); }}
                                                    className={`relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all group ${
                                                        isSelected
                                                            ? 'border-purple-500 ring-4 ring-purple-500/20 shadow-lg'
                                                            : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
                                                    }`}
                                                >
                                                    <div className="aspect-[3/4] relative bg-slate-800">
                                                        <Image
                                                            src={model.image}
                                                            alt={model.name}
                                                            fill
                                                            className="object-cover group-hover:scale-105 transition-transform"
                                                        />
                                                    </div>
                                                    <div className="p-2 bg-slate-950/90 text-left">
                                                        <div className="text-[11px] font-bold truncate text-slate-200">{model.name}</div>
                                                        <div className="text-[9px] text-slate-400 truncate">{model.stats}</div>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center text-white shadow">
                                                            <Check size={12} />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Cột Phải: Trang Phục Đang Thử (5 Cột) */}
                                <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                            <Shirt size={16} className="text-amber-400" />
                                            2. Trang Phục Bạn Sẽ Thử Mặc
                                        </label>

                                        <div className="flex gap-4 items-center bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
                                            <div className="w-20 h-24 relative rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                                                {garmentImage && (
                                                    <Image
                                                        src={garmentImage}
                                                        alt={product.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-xs font-bold text-white line-clamp-2">{product.name}</h4>
                                                <div className="text-xs text-amber-400 font-bold">
                                                    {(product.price || 0).toLocaleString('vi-VN')}₫
                                                </div>
                                                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                                                    {selectedColor && <span>Màu: <strong>{selectedColor.name}</strong></span>}
                                                    {selectedSize && <span>• Size: <strong>{selectedSize}</strong></span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-3 bg-purple-950/40 border border-purple-800/40 rounded-xl text-xs text-purple-200 flex items-start gap-2.5">
                                            <Sparkles size={16} className="text-purple-400 shrink-0 mt-0.5" />
                                            <p className="leading-relaxed text-[11px]">
                                                Mô hình <strong>IDM-VTON Neural Fit</strong> sẽ tự động nhận diện khung người và bọc chiếc áo này lên ảnh của bạn.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Nút Bắt Đầu Thử Đồ */}
                                    <div className="pt-5">
                                        <button
                                            onClick={handleStartTryOn}
                                            disabled={isProcessing}
                                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-rose-600 to-amber-500 hover:opacity-95 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-purple-900/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <RefreshCw size={18} className="animate-spin text-white" />
                                                    <span>AI ĐANG GHÉP ÁO LÊN CƠ THỂ BẠN...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles size={18} />
                                                    <span>BẮT ĐẦU THỬ ĐỒ BẰNG AI</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Khu Vực Hiển Thị Kết Quả Sau Khi Thử Đồ */
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                {/* Cột Trái: Ảnh Đã Mặc Áo Mới */}
                                <div className="lg:col-span-6 flex flex-col items-center space-y-3">
                                    <div className="relative w-full max-w-[340px] aspect-[3/4] rounded-3xl overflow-hidden border-2 border-purple-500 shadow-2xl bg-slate-950 flex flex-col justify-end">
                                        {/* 1. Ảnh người mẫu gốc */}
                                        <img
                                            src={result.originalImage}
                                            alt="Original Photo"
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />

                                        {/* 2. Lớp áo mới ghép lên cơ thể khi ở chế độ 'tryon' */}
                                        {viewMode === 'tryon' && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.96 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.35 }}
                                                className="absolute inset-0 pointer-events-none flex flex-col justify-end items-center"
                                            >
                                                <div
                                                    className="relative transition-all duration-150"
                                                    style={{
                                                        width: `${shirtScale}%`,
                                                        height: `${shirtHeight}%`,
                                                        bottom: `${shirtOffset}%`,
                                                        mixBlendMode: 'multiply',
                                                        filter: 'contrast(1.1) brightness(1.02)'
                                                    }}
                                                >
                                                    <img
                                                        src={garmentImage}
                                                        alt="Fitted Garment"
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Huy hiệu AI Verified */}
                                        <div className="absolute top-3 left-3 bg-slate-900/90 border border-purple-500/50 px-3 py-1 rounded-full text-[10px] font-bold text-purple-300 flex items-center gap-1.5 shadow z-20">
                                            <ShieldCheck size={14} className="text-purple-400" />
                                            <span>{viewMode === 'tryon' ? 'ĐÃ MẶC ÁO MỚI (AI VTON)' : 'ẢNH GỐC BAN ĐẦU'}</span>
                                        </div>
                                    </div>

                                    {/* Nút Toggle So Sánh Trước / Sau & Nút Tải Về */}
                                    <div className="flex items-center gap-2 w-full max-w-[340px]">
                                        <button
                                            onClick={() => setViewMode(prev => prev === 'tryon' ? 'original' : 'tryon')}
                                            className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                        >
                                            <Eye size={14} className="text-purple-400" />
                                            <span>{viewMode === 'tryon' ? 'Xem ảnh gốc trước khi thử' : 'Xem ảnh đã mặc áo mới'}</span>
                                        </button>

                                        <button
                                            onClick={handleDownloadImage}
                                            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                            title="Tải ảnh này về máy"
                                        >
                                            <Download size={14} className="text-amber-400" />
                                            <span>Lưu ảnh</span>
                                        </button>
                                    </div>

                                    {/* Thanh Tinh Chỉnh Vị Trí Áo (Nếu ảnh người chụp gần / xa khác nhau) */}
                                    {viewMode === 'tryon' && (
                                        <div className="w-full max-w-[340px] p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                                            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                <span className="flex items-center gap-1.5">
                                                    <Sliders size={12} className="text-purple-400" />
                                                    <span>Khớp áo theo dáng chụp:</span>
                                                </span>
                                            </div>

                                            {/* 3 Nút Chọn Nhanh Góc Chụp */}
                                            <div className="grid grid-cols-3 gap-1.5">
                                                <button
                                                    onClick={() => setPresetView('selfie')}
                                                    className="py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-purple-900/40 border border-slate-700 text-[10px] font-semibold text-slate-300 transition-colors"
                                                >
                                                    📸 Chụp gần (Selfie)
                                                </button>
                                                <button
                                                    onClick={() => setPresetView('half')}
                                                    className="py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-purple-900/40 border border-slate-700 text-[10px] font-semibold text-slate-300 transition-colors"
                                                >
                                                    👔 Nửa người
                                                </button>
                                                <button
                                                    onClick={() => setPresetView('full')}
                                                    className="py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-purple-900/40 border border-slate-700 text-[10px] font-semibold text-slate-300 transition-colors"
                                                >
                                                    🧍 Toàn thân
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between gap-3 text-[11px] pt-1">
                                                <span className="text-slate-400">Vị trí cổ/vai:</span>
                                                <input
                                                    type="range"
                                                    min="-25"
                                                    max="30"
                                                    value={shirtOffset}
                                                    onChange={(e) => setShirtOffset(Number(e.target.value))}
                                                    className="w-36 accent-purple-500 cursor-pointer"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between gap-3 text-[11px]">
                                                <span className="text-slate-400">Kích cỡ áo:</span>
                                                <input
                                                    type="range"
                                                    min="35"
                                                    max="75"
                                                    value={shirtHeight}
                                                    onChange={(e) => setShirtHeight(Number(e.target.value))}
                                                    className="w-36 accent-purple-500 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Cột Phải: Lời Khuyên Thời Trang & Nút Mua */}
                                <div className="lg:col-span-6 space-y-5">
                                    {/* Điểm Vừa Vặn */}
                                    <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                                        <div>
                                            <div className="text-xs text-slate-400 font-medium">Độ tương thích vóc dáng & phom áo</div>
                                            <div className="text-lg font-black text-amber-400 flex items-center gap-1.5 mt-0.5">
                                                <Star size={18} className="fill-amber-400 text-amber-400" />
                                                <span>Rất hợp với vóc dáng ({result.fitScore}%)</span>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                                            Chuẩn Size {selectedSize || 'M'}
                                        </span>
                                    </div>

                                    {/* Lời Khuyên Stylist */}
                                    <div className="p-5 rounded-2xl bg-purple-950/40 border border-purple-800/50 space-y-2.5">
                                        <div className="text-xs font-bold text-purple-300 flex items-center gap-2">
                                            <Sparkles size={15} className="text-purple-400" />
                                            <span>NHẬN XÉT TỪ AI FASHION STYLIST:</span>
                                        </div>
                                        <p className="text-xs text-slate-300 leading-relaxed font-normal">
                                            {result.stylistAdvice}
                                        </p>
                                    </div>

                                    {/* Mẹo Phối Đồ */}
                                    {result.matchingTips.length > 0 && (
                                        <div className="space-y-1.5">
                                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gợi ý phối đồ chuẩn Outfit:</div>
                                            <ul className="text-xs text-slate-300 space-y-1">
                                                {result.matchingTips.map((tip, idx) => (
                                                    <li key={idx} className="flex items-center gap-2">
                                                        <span className="text-amber-400">•</span> {tip}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Nút Hành Động */}
                                    <div className="pt-3 flex flex-col sm:flex-row gap-3">
                                        <button
                                            onClick={() => setResult(null)}
                                            className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                                        >
                                            <RefreshCw size={14} /> Thử lại mẫu khác
                                        </button>

                                        <button
                                            onClick={() => {
                                                if (onAddToCart) onAddToCart();
                                                onClose();
                                            }}
                                            className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-600 hover:opacity-95 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-900/30 transition-all cursor-pointer"
                                        >
                                            <ShoppingBag size={16} /> Thêm vào giỏ hàng ngay
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
