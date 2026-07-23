'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Camera, Download, Share2, ZoomIn, X, RotateCcw,
    CheckCircle2, AlertTriangle, Layers, Shirt, Sliders, ChevronRight, RefreshCw, Cpu
} from 'lucide-react';
import Image from 'next/image';
import CompareSlider from '@/app/component/CompareSlider';
import { toast } from 'react-hot-toast';

interface Product {
    id: string;
    name: string;
    price: number;
    images: string[];
    description?: string;
    category?: string;
    colors?: { name: string; hex: string }[];
    sizes?: string[];
}

function formatPrice(p: number) {
    return p.toLocaleString('vi-VN') + 'đ';
}

const AI_MODELS = [
    { id: 'fashn', name: 'FASHN AI Engine', badge: 'Ultra HD', desc: 'Độ chân thực 4K, khớp nếp vải & ánh sáng chuẩn Zara' },
    { id: 'idm_vton', name: 'IDM-VTON Engine', badge: 'Fast', desc: 'Tốc độ cao, bảo toàn tuyệt đối phom dáng cơ thể' },
    { id: 'catvton', name: 'CatVTON AI', badge: 'Smooth', desc: 'Xử lý mượt mà trang phục váy dệt & áo khoác' },
    { id: 'gemini', name: 'Gemini Pro Fitting', badge: 'Smart', desc: 'Phân tích phối màu, chỉ số Fit & tư vấn Stylist' }
];

export default function ProfessionalAITryOnPage() {
    // User Photo States
    const [userPhoto, setUserPhoto] = useState<File | null>(null);
    const [userPhotoUrl, setUserPhotoUrl] = useState<string>('');
    const [imageWarnings, setImageWarnings] = useState<string[]>([]);
    
    // Product Selection States
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedColor, setSelectedColor] = useState<string>('');
    const [selectedSize, setSelectedSize] = useState<string>('M');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    
    // AI Processing States
    const [selectedModel, setSelectedModel] = useState<string>('fashn');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [jobId, setJobId] = useState<string | null>(null);
    const [progress, setProgress] = useState<number>(0);
    const [stepMessage, setStepMessage] = useState<string>('');
    const [resultImage, setResultImage] = useState<string>('');
    const [aiFeedback, setAiFeedback] = useState<string>('');
    const [quickPreview, setQuickPreview] = useState<string>(''); // Preview tực thì khi chọn sản phẩm
    
    // UI States
    const [fullscreen, setFullscreen] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'tryon' | 'history'>('tryon');
    const [history, setHistory] = useState<any[]>([]);

    // Fetch Products
    useEffect(() => {
        async function fetchProducts() {
            try {
                const res = await fetch('/api/products?limit=20');
                const data = await res.json();
                if (data.products && data.products.length > 0) {
                    setProducts(data.products);
                    setSelectedProduct(data.products[0]);
                    if (data.products[0].colors?.[0]) setSelectedColor(data.products[0].colors[0].name);
                    if (data.products[0].sizes?.[0]) setSelectedSize(data.products[0].sizes[0]);
                }
            } catch (err) {
                console.error('Lỗi nạp sản phẩm:', err);
            }
        }
        fetchProducts();
    }, []);

    // Remove Quick Preview Canvas Effect to avoid distorted fake overlay

    // Handle Upload & Quality Check
    const handlePhotoUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn định dạng ảnh JPG, PNG hoặc WEBP.');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64 = e.target?.result as string;
            setUserPhoto(file);
            setUserPhotoUrl(base64);
            setResultImage('');
            setAiFeedback('');

            // Call Backend Validation
            try {
                const res = await fetch('/api/tryon/validate-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageBase64: base64 })
                });
                const data = await res.json();
                if (data.warnings) setImageWarnings(data.warnings);
            } catch {
                setImageWarnings([]);
            }
        };
        reader.readAsDataURL(file);
    };

    // Polling Job Status
    useEffect(() => {
        if (!jobId || !isProcessing) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/tryon/job-status/${jobId}`);
                const data = await res.json();
                if (data.success && data.job) {
                    setProgress(data.job.progress || 0);
                    setStepMessage(data.job.currentStepMessage || '');

                    if (data.job.status === 'completed') {
                        setIsProcessing(false);
                        setResultImage(data.job.resultImage);
                        setAiFeedback(data.job.aiAnalysisText || '');
                        toast.success('AI Thử đồ thành công! ✨');
                        clearInterval(interval);
                    } else if (data.job.status === 'failed') {
                        setIsProcessing(false);
                        toast.error(data.job.errorMessage || 'Xử lý AI thất bại.');
                        clearInterval(interval);
                    }
                }
            } catch (err) {
                console.error('Job polling error:', err);
            }
        }, 1200);

        return () => clearInterval(interval);
    }, [jobId, isProcessing]);

    // Trigger AI Try-On Execution
    const startTryOn = async () => {
        if (!userPhotoUrl) {
            toast.error('Vui lòng tải ảnh cá nhân của bạn lên trước!');
            return;
        }
        if (!selectedProduct) {
            toast.error('Vui lòng chọn một sản phẩm để thử!');
            return;
        }

        setIsProcessing(true);
        setProgress(10);
        setStepMessage('Đang khởi tạo job thử đồ...');
        setResultImage('');

        try {
            const userId = localStorage.getItem('userId') || 'guest';
            const res = await fetch('/api/tryon/generate-job', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userImageBase64: userPhotoUrl,
                    productId: selectedProduct.id,
                    productName: selectedProduct.name,
                    productImage: selectedProduct.images[0],
                    category: selectedProduct.category || 'clothing',
                    selectedColor,
                    selectedSize,
                    userId
                })
            });

            const data = await res.json();
            if (data.success && data.jobId) {
                setJobId(data.jobId);
            } else {
                setIsProcessing(false);
                toast.error(data.message || 'Không thể tạo job thử đồ.');
            }
        } catch (err) {
            setIsProcessing(false);
            toast.error('Lỗi kết nối máy chủ AI.');
        }
    };

    // Load History
    const loadHistory = useCallback(async () => {
        const userId = localStorage.getItem('userId');
        if (!userId) return;
        try {
            const res = await fetch('/api/tryon/history', {
                headers: { 'x-user-id': userId }
            });
            const data = await res.json();
            if (data.history) setHistory(data.history);
        } catch (err) {
            console.error('Lỗi tải lịch sử:', err);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'history') loadHistory();
    }, [activeTab, loadHistory]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
            {/* Header Hero Banner */}
            <div className="relative overflow-hidden bg-gradient-to-b from-amber-950/40 via-slate-950 to-slate-950 border-b border-amber-500/10 py-12 px-4">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">
                            <Sparkles size={14} /> AI Virtual Try-On Studio Pro 2.0
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                            Phòng Thử Đồ <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">Trí Tuệ Nhân Tạo</span>
                        </h1>
                        <p className="text-slate-400 mt-2 max-w-xl text-sm md:text-base">
                            Trải nghiệm công nghệ AI Virtual Fitting chuẩn Zara & H&M. Giữ nguyên khuôn mặt, tự động thay đổi trang phục với nếp gấp vải và ánh sáng tự nhiên.
                        </p>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md">
                        <button
                            onClick={() => setActiveTab('tryon')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'tryon' ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Shirt size={16} /> Thử Đồ Ngay
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'history' ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20' : 'text-slate-400 hover:text-white'}`}
                        >
                            <RotateCcw size={16} /> Lịch Sử Thử Đồ
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 mt-8">
                {activeTab === 'tryon' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* LEFT COLUMN: Upload Photo & AI Model Selector (4 Cols) */}
                        <div className="lg:col-span-4 space-y-6">

                            {/* 1. Upload User Image */}
                            <div className="bg-slate-900/60 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Camera size={20} className="text-amber-400" /> 1. Tải Ảnh Của Bạn
                                </h3>

                                {!userPhotoUrl ? (
                                    <label className="flex flex-col items-center justify-center h-64 rounded-2xl border-2 border-dashed border-slate-700 hover:border-amber-400/60 bg-slate-950/50 hover:bg-slate-900/50 cursor-pointer transition-all p-6 group text-center">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                                        />
                                        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform mb-3 border border-amber-500/20">
                                            <Camera size={28} />
                                        </div>
                                        <p className="font-bold text-slate-200 text-sm">Tải ảnh chụp cá nhân</p>
                                        <p className="text-xs text-slate-500 mt-1">Kéo thả hoặc bấm chọn ảnh (JPG, PNG, WEBP)</p>
                                        <span className="mt-3 px-3 py-1 bg-slate-800 text-amber-400 text-[10px] font-semibold rounded-full border border-slate-700">
                                            Khuyên dùng: Ảnh đứng chụp toàn thân
                                        </span>
                                    </label>
                                ) : (
                                    <div className="relative rounded-2xl overflow-hidden group border border-slate-700">
                                        <img src={userPhotoUrl} alt="User Upload" className="w-full h-72 object-cover" />
                                        <button
                                            onClick={() => { setUserPhotoUrl(''); setUserPhoto(null); setResultImage(''); }}
                                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}

                                {/* Image Quality Warnings */}
                                {imageWarnings.length > 0 && (
                                    <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                                        {imageWarnings.map((w, idx) => (
                                            <p key={idx} className="flex items-center gap-1.5">
                                                <AlertTriangle size={14} className="flex-shrink-0" /> {w}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 2. Select AI Model Engine */}
                            <div className="bg-slate-900/60 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Cpu size={20} className="text-amber-400" /> 2. Chọn AI Model Engine
                                </h3>
                                <div className="space-y-3">
                                    {AI_MODELS.map((model) => (
                                        <div
                                            key={model.id}
                                            onClick={() => setSelectedModel(model.id)}
                                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${selectedModel === model.id ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'}`}
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-white text-sm">{model.name}</p>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                                        {model.badge}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1">{model.desc}</p>
                                            </div>
                                            <input
                                                type="radio"
                                                name="aiModel"
                                                checked={selectedModel === model.id}
                                                onChange={() => setSelectedModel(model.id)}
                                                className="accent-amber-400"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Product Selector & Interactive Fitting Workspace (8 Cols) */}
                        <div className="lg:col-span-8 space-y-6">

                            {/* 3. Choose Product & Options */}
                            <div className="bg-slate-900/60 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Shirt size={20} className="text-amber-400" /> 3. Chọn Trang Phục Thử
                                    </h3>

                                    {/* Category Filter */}
                                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                                        {['all', 'ao', 'quan', 'vay', 'khoac'].map((cat) => (
                                            <button
                                                key={cat}
                                                onClick={() => setCategoryFilter(cat)}
                                                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all ${categoryFilter === cat ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                                            >
                                                {cat === 'all' ? 'Tất cả' : cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Product Cards Horizontal Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-1">
                                    {products.map((p) => {
                                        const isSelected = selectedProduct?.id === p.id;
                                        return (
                                            <div
                                                key={p.id}
                                                onClick={() => {
                                                    setSelectedProduct(p);
                                                    if (p.colors?.[0]) setSelectedColor(p.colors[0].name);
                                                    if (p.sizes?.[0]) setSelectedSize(p.sizes[0]);
                                                }}
                                                className={`relative rounded-xl p-2 border cursor-pointer transition-all bg-slate-950 ${isSelected ? 'border-amber-400 shadow-md shadow-amber-400/20' : 'border-slate-800 hover:border-slate-700'}`}
                                            >
                                                <div className="relative h-28 rounded-lg overflow-hidden bg-slate-900 mb-2">
                                                    <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
                                                </div>
                                                <p className="text-xs font-semibold text-white line-clamp-1">{p.name}</p>
                                                <p className="text-xs text-amber-400 font-bold mt-0.5">{formatPrice(p.price)}</p>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Selected Product Variant Customizer */}
                                {selectedProduct && (
                                    <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                                        {/* Color Selector */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400 font-semibold">Màu sắc:</span>
                                            {selectedProduct.colors && selectedProduct.colors.length > 0 ? (
                                                selectedProduct.colors.map((c) => (
                                                    <button
                                                        key={c.name}
                                                        onClick={() => setSelectedColor(c.name)}
                                                        className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${selectedColor === c.name ? 'border-amber-400 bg-amber-400/20 text-amber-300' : 'border-slate-700 text-slate-400'}`}
                                                    >
                                                        {c.name}
                                                    </button>
                                                ))
                                            ) : (
                                                <span className="text-xs text-slate-500">Mặc định</span>
                                            )}
                                        </div>

                                        {/* Size Selector */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400 font-semibold">Size:</span>
                                            {['S', 'M', 'L', 'XL'].map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => setSelectedSize(s)}
                                                    className={`w-7 h-7 rounded-md text-xs font-bold border flex items-center justify-center transition-all ${selectedSize === s ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-700 text-slate-400'}`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Generate Button */}
                                        <button
                                            onClick={startTryOn}
                                            disabled={isProcessing}
                                            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm tracking-wide hover:shadow-lg hover:shadow-amber-400/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                                            {isProcessing ? 'Đang Xử Lý AI...' : 'BẮT ĐẦU THỬ ĐỒ AI'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* 4. Display Result & Compare Slider Workspace */}
                            <div className="bg-slate-900/60 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Layers size={20} className="text-amber-400" /> Kết Quả Thử Đồ Thực Tế
                                    </h3>
                                    {resultImage && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    const link = document.createElement('a');
                                                    link.href = resultImage;
                                                    link.download = 'ai-tryon-result.jpg';
                                                    link.click();
                                                }}
                                                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                                            >
                                                <Download size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Progress Bar Overlay */}
                                {isProcessing && (
                                    <div className="my-8 p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-4">
                                        <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                                            <span>{stepMessage}</span>
                                            <span>{progress}%</span>
                                        </div>
                                        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-amber-500 to-yellow-300"
                                                animate={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 animate-pulse">
                                            AI đang tách nền, căn chỉnh phom dáng & khớp ánh sáng tự nhiên...
                                        </p>
                                    </div>
                                )}

                                {/* Compare Slider View — Kết quả AI hoàn chỉnh */}
                                {userPhotoUrl && resultImage ? (
                                    <div className="space-y-4">
                                        <CompareSlider beforeImage={userPhotoUrl} afterImage={resultImage} />

                                        {/* AI Fashion Stylist Feedback */}
                                        {aiFeedback && (
                                            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-200 text-xs leading-relaxed space-y-2">
                                                <p className="font-bold text-amber-400 flex items-center gap-1.5 text-sm">
                                                    <Sparkles size={16} /> AI Stylist Phân Tích & Tư Vấn:
                                                </p>
                                                <div dangerouslySetInnerHTML={{ __html: aiFeedback.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                            </div>
                                        )}
                                    </div>

                                ) : userPhotoUrl && selectedProduct && !isProcessing ? (
                                    /* Ready State — Cho người dùng xem ảnh sản phẩm & ảnh cá nhân trước khi thử */
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                            <div className="text-center space-y-2">
                                                <span className="text-xs font-semibold text-slate-400">Ảnh dáng người của bạn</span>
                                                <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-slate-800">
                                                    <Image src={userPhotoUrl} alt="User" fill className="object-cover" />
                                                </div>
                                            </div>
                                            <div className="text-center space-y-2">
                                                <span className="text-xs font-semibold text-slate-400">Trang phục đã chọn</span>
                                                <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-slate-800 bg-white">
                                                    <Image src={selectedProduct.images[0]} alt="Product" fill className="object-contain p-2" />
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-center text-xs text-amber-400 font-medium">
                                            ✨ Hãy bấm nút <span className="underline font-bold">"BẮT ĐẦU THỬ ĐỒ AI"</span> để AI tiến hành bóc tách & ghép trang phục chân thực!
                                        </p>
                                    </div>

                                ) : (
                                    !isProcessing && (
                                        <div className="h-80 rounded-2xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 text-center p-6">
                                            <Shirt size={48} className="text-slate-700 mb-3" />
                                            <p className="font-bold text-slate-400">Chưa có kết quả thử đồ</p>
                                            <p className="text-xs mt-1 max-w-sm">
                                                Hãy chọn ảnh của bạn ở cột bên trái và bấm nút "BẮT ĐẦU THỬ ĐỒ AI" để xem phép thuật của AI.
                                            </p>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>

                    </div>
                ) : (
                    /* History Tab */
                    <div className="bg-slate-900/60 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <RotateCcw size={22} className="text-amber-400" /> Lịch Sử Thử Đồ Của Bạn
                        </h3>
                        {history.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {history.map((item) => (
                                    <div key={item.id} className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
                                        <img src={item.resultImage} alt={item.productName} className="w-full h-64 object-cover" />
                                        <div className="p-4 space-y-2">
                                            <p className="font-bold text-white text-sm line-clamp-1">{item.productName}</p>
                                            <p className="text-xs text-amber-400 font-semibold">
                                                Size: {item.selectedSize} | Màu: {item.selectedColor || 'Mặc định'}
                                            </p>
                                            <p className="text-[10px] text-slate-500">
                                                {new Date(item.createdAt).toLocaleString('vi-VN')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-16 text-center text-slate-500">
                                <RotateCcw size={40} className="mx-auto mb-3 text-slate-700" />
                                <p>Bạn chưa có lịch sử thử đồ nào.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
