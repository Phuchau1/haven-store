'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Camera, User, CheckCircle2, AlertCircle, Shirt,
    ArrowRight, RefreshCw, Zap, ShieldCheck, Heart, Sliders,
    ChevronRight, Info, Check, Eye
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import TryOnModal from '@/app/component/TryOnModal';
import AIChatStylistModal from '@/app/component/AIChatStylistModal';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface BodyScan {
    gender: string;
    estimatedAge: number;
    heightCm: number;
    weightKg: number;
    bmi: number;
    bodyShape: string;
    shoulderWidthCm: number;
    chestCm: number;
    waistCm: number;
    hipCm: number;
}

interface PersonalColor {
    skinTone: string;
    skinSubtone: string;
    recommendedColors: string[];
    avoidColors: string[];
    highlightColor: string;
}

interface OutfitItem {
    role: string;
    product: {
        id: string;
        name: string;
        price: number;
        images?: string[];
        category?: string;
    };
}

interface Outfit {
    id: string;
    name: string;
    styleCategory: string;
    tag: string;
    matchScore: number;
    totalPrice: number;
    items: OutfitItem[];
    explanations: string[];
}

export default function AIStylePage() {
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);

    // Form data
    const [height, setHeight] = useState('172');
    const [weight, setWeight] = useState('65');
    const [gender, setGender] = useState('Men');
    const [userPhoto, setUserPhoto] = useState<string | null>(null);

    // AI Results
    const [bodyScan, setBodyScan] = useState<BodyScan | null>(null);
    const [personalColor, setPersonalColor] = useState<PersonalColor | null>(null);
    const [brandSizes, setBrandSizes] = useState<Record<string, string>>({});
    const [outfits, setOutfits] = useState<Outfit[]>([]);
    const [stylePercentages, setStylePercentages] = useState({
        Minimal: 40,
        Korean: 35,
        Streetwear: 15,
        SmartCasual: 10
    });

    // Modal Try-On State
    const [tryOnProduct, setTryOnProduct] = useState<{ name: string; image: string; category?: string } | null>(null);
    const [isTryOnOpen, setIsTryOnOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial Fetch Recommendations
    const fetchRecommendations = async (inputData?: any) => {
        try {
            const res = await fetch('/api/ai-stylist/recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'guest_user' })
            });

            const data = await res.json();
            if (data.success) {
                setBodyScan(data.userProfile.bodyScan);
                setPersonalColor(data.userProfile.personalColor);
                setBrandSizes(data.userProfile.brandSizes || {});
                setOutfits(data.outfits || []);
                if (data.userProfile.stylePreferences) {
                    setStylePercentages(data.userProfile.stylePreferences);
                }
            }
        } catch (err) {
            console.error('Failed to load AI recommendations:', err);
        } finally {
            setLoading(false);
            setAnalyzing(false);
        }
    };

    useEffect(() => {
        fetchRecommendations();
    }, []);

    const handleRunAnalysis = async () => {
        setAnalyzing(true);
        try {
            const res = await fetch('/api/ai-stylist/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'guest_user',
                    base64Image: userPhoto,
                    inputForm: { heightCm: height, weightKg: weight, gender }
                })
            });

            const data = await res.json();
            if (data.success) {
                setBodyScan(data.data.bodyScan);
                setPersonalColor(data.data.personalColor);
                setBrandSizes(data.data.brandSizes);
                toast.success('✨ AI đã cập nhật phân tích vóc dáng mới!');
                await fetchRecommendations();
            }
        } catch (err) {
            toast.error('Lỗi phân tích AI. Vui lòng thử lại!');
        } finally {
            setAnalyzing(false);
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = ev => {
                setUserPhoto(ev.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const openTryOnModalForProduct = (p: any) => {
        if (!p?.images?.[0]) return;
        setTryOnProduct({
            name: p.name,
            image: p.images[0],
            category: p.category
        });
        setIsTryOnOpen(true);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
            {/* Navigation Bar */}
            <div className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-slate-400 hover:text-white transition-colors text-xs">
                            ← Trang chủ
                        </Link>
                        <span className="text-slate-700">|</span>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 flex items-center justify-center">
                                <Sparkles size={14} className="text-white" />
                            </div>
                            <span className="font-bold text-white text-sm">Personal AI Stylist Studio</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/ai-tryon" className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-1.5 rounded-full font-medium transition-colors border border-slate-700 flex items-center gap-1.5">
                            <Shirt size={13} className="text-amber-400" /> AI Virtual Try-On
                        </Link>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 pt-10 pb-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
                    <span className="inline-block text-[11px] font-bold tracking-widest text-amber-400 uppercase px-3 py-1 rounded-full border border-amber-400/30 bg-amber-400/10">
                        Recommendation Engine & Personal Color Matrix
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                        AI Gợi Ý Trang Phục &{' '}
                        <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 bg-clip-text text-transparent">
                            Personal Stylist
                        </span>
                    </h1>
                    <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
                        Phân tích vóc dáng 7 chỉ số, sắc tố da (Personal Color), đề xuất 10+ Outfit phối hoàn chỉnh và tư vấn trực tiếp bởi AI Stylist
                    </p>
                </motion.div>
            </div>

            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ═══ LEFT PANEL: Body & Vision Scanner (4 Cols) ═══ */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Scanner Input Card */}
                    <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-5">
                        <h2 className="text-white font-bold text-base flex items-center gap-2">
                            <User size={18} className="text-amber-400" />
                            Quét AI & Chỉ Số Cơ Thể
                        </h2>

                        {/* Photo Input */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="relative aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-700 hover:border-amber-400 bg-slate-950/60 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group"
                        >
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

                            {userPhoto ? (
                                <>
                                    <img src={userPhoto} alt="User photo" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-white text-xs font-semibold">Đổi ảnh khác</p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-4 space-y-2">
                                    <Camera size={32} className="text-amber-400 mx-auto" />
                                    <p className="text-slate-300 text-xs font-medium">Tải ảnh chụp cá nhân lên</p>
                                    <p className="text-slate-500 text-[11px]">AI tự động quét tông da & tỷ lệ vai</p>
                                </div>
                            )}
                        </div>

                        {/* Manual inputs */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                                <label className="text-slate-400 mb-1 block">Chiều cao (cm)</label>
                                <input
                                    type="number"
                                    value={height}
                                    onChange={e => setHeight(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-amber-500"
                                />
                            </div>
                            <div>
                                <label className="text-slate-400 mb-1 block">Cân nặng (kg)</label>
                                <input
                                    type="number"
                                    value={weight}
                                    onChange={e => setWeight(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-amber-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-slate-400 text-xs mb-1 block">Giới tính</label>
                            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                                {['Men', 'Women'].map(g => (
                                    <button
                                        key={g}
                                        onClick={() => setGender(g)}
                                        className={`py-2 rounded-xl border transition-all ${gender === g ? 'bg-amber-500 border-amber-400 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                                    >
                                        {g === 'Men' ? 'Nam' : 'Nữ'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleRunAnalysis}
                            disabled={analyzing}
                            className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                        >
                            {analyzing ? (
                                <><RefreshCw size={16} className="animate-spin" /> AI Đang Quét Vóc Dáng...</>
                            ) : (
                                <><Sparkles size={16} /> Chạy Quét AI Stylist</>
                            )}
                        </button>
                    </div>

                    {/* AI Body Analysis Dashboard */}
                    {bodyScan && (
                        <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-4">
                            <h3 className="text-white font-bold text-sm flex items-center gap-2">
                                <Zap size={16} className="text-amber-400" />
                                Chỉ Số AI Vóc Dáng & Thể Trạng
                            </h3>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                                    <p className="text-slate-500 text-[10px]">Dáng người</p>
                                    <p className="text-amber-400 font-bold text-sm mt-0.5">{bodyScan.bodyShape}</p>
                                </div>
                                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                                    <p className="text-slate-500 text-[10px]">Chỉ số BMI</p>
                                    <p className="text-emerald-400 font-bold text-sm mt-0.5">{bodyScan.bmi} (Chuẩn)</p>
                                </div>
                                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                                    <p className="text-slate-500 text-[10px]">Rộng vai</p>
                                    <p className="text-white font-semibold text-xs mt-0.5">{bodyScan.shoulderWidthCm} cm</p>
                                </div>
                                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                                    <p className="text-slate-500 text-[10px]">Vòng ngực / eo</p>
                                    <p className="text-white font-semibold text-xs mt-0.5">{bodyScan.chestCm} / {bodyScan.waistCm} cm</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Personal Color Analysis Matrix */}
                    {personalColor && (
                        <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-4">
                            <h3 className="text-white font-bold text-sm flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Sparkles size={16} className="text-amber-400" />
                                    Personal Color Palette
                                </span>
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                                    Tông {personalColor.skinTone}
                                </span>
                            </h3>

                            <div className="space-y-3 text-xs">
                                <div>
                                    <p className="text-emerald-400 font-semibold mb-2 flex items-center gap-1">
                                        <CheckCircle2 size={13} /> Màu Tôn Da Nên Mặc:
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {personalColor.recommendedColors.map((col, idx) => (
                                            <span key={idx} className="bg-slate-950 text-slate-200 border border-slate-800 px-2.5 py-1 rounded-lg text-[11px] font-medium">
                                                {col}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-800/80">
                                    <p className="text-rose-400 font-semibold mb-2 flex items-center gap-1">
                                        <AlertCircle size={13} /> Màu Nên Hạn Chế:
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {personalColor.avoidColors.map((col, idx) => (
                                            <span key={idx} className="bg-rose-950/40 text-rose-300 border border-rose-900/50 px-2.5 py-1 rounded-lg text-[11px]">
                                                {col}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Brand Dynamic Size Matrix */}
                    <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-4">
                        <h3 className="text-white font-bold text-sm flex items-center gap-2">
                            <ShieldCheck size={16} className="text-amber-400" />
                            Đề Xuất Size Theo Hãng AI
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(brandSizes).map(([brand, size]) => (
                                <div key={brand} className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                                    <span className="text-slate-300 font-medium">{brand}</span>
                                    <span className="bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-lg border border-amber-500/30">
                                        Size {size}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ═══ RIGHT PANEL: 10+ Complete Outfit Collections (8 Cols) ═══ */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Header bar */}
                    <div className="flex items-center justify-between bg-slate-900/80 rounded-2xl p-4 border border-slate-800 backdrop-blur-xl">
                        <div>
                            <h2 className="text-white font-bold text-base flex items-center gap-2">
                                <Sparkles size={18} className="text-amber-400" />
                                10+ Outfits Phối Sẵn Bởi AI
                            </h2>
                            <p className="text-slate-400 text-xs">Được kết hợp hài hòa theo tông da, dáng người & sở thích</p>
                        </div>
                        <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold px-3 py-1 rounded-full">
                            Match 90% - 99%
                        </span>
                    </div>

                    {/* Outfits List */}
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-64 bg-slate-900/60 rounded-3xl animate-pulse border border-slate-800" />
                            ))}
                        </div>
                    ) : outfits.length === 0 ? (
                        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400 text-sm">
                            Chưa tìm thấy outfit phù hợp. Hãy bấm Quét AI ở bên trái nhé!
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {outfits.map((outfit, index) => (
                                <motion.div
                                    key={outfit.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.08 }}
                                    className="bg-slate-900/70 rounded-3xl p-6 border border-slate-800/80 hover:border-amber-500/40 transition-all backdrop-blur-xl space-y-4 relative overflow-hidden group shadow-xl"
                                >
                                    {/* Top banner */}
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                                        <div className="flex items-center gap-2.5">
                                            <span className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center border border-amber-500/30">
                                                #{index + 1}
                                            </span>
                                            <div>
                                                <h3 className="text-white font-bold text-sm sm:text-base">{outfit.name}</h3>
                                                <span className="text-[11px] text-slate-400">{outfit.tag} • Style {outfit.styleCategory}</span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-xs text-slate-400 block">Độ phù hợp AI</span>
                                            <span className="text-emerald-400 font-black text-base sm:text-lg">
                                                {outfit.matchScore}% Match
                                            </span>
                                        </div>
                                    </div>

                                    {/* Items Showcase Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {outfit.items.map((item, idx) => (
                                            <div key={idx} className="bg-slate-950/70 rounded-2xl p-3 border border-slate-800/80 flex flex-col justify-between space-y-2 group/item">
                                                <div className="aspect-square relative rounded-xl overflow-hidden bg-slate-900">
                                                    {item.product.images?.[0] ? (
                                                        <Image
                                                            src={item.product.images[0]}
                                                            alt={item.product.name}
                                                            fill
                                                            className="object-cover group-hover/item:scale-105 transition-transform"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-700">
                                                            <Shirt size={24} />
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <span className="text-[10px] text-amber-400 font-semibold block">{item.role}</span>
                                                    <p className="text-white text-xs font-medium line-clamp-1">{item.product.name}</p>
                                                    <p className="text-slate-400 text-xs font-bold mt-0.5">
                                                        {new Intl.NumberFormat('vi-VN').format(item.product.price)}đ
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() => openTryOnModalForProduct(item.product)}
                                                    className="w-full py-1.5 bg-slate-800 hover:bg-amber-500 text-slate-300 hover:text-white rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                                                >
                                                    <Shirt size={12} /> Thử Đồ AI
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* AI Explanation List */}
                                    <div className="bg-slate-950/40 rounded-2xl p-3.5 border border-slate-800/60 space-y-1.5 text-xs">
                                        <p className="text-amber-400 font-bold text-[11px] flex items-center gap-1">
                                            <Info size={12} /> Tại sao AI chọn Outfit này cho bạn?
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-300">
                                            {outfit.explanations.map((exp, eIdx) => (
                                                <div key={eIdx} className="flex items-center gap-1.5">
                                                    <span className="text-emerald-400">•</span>
                                                    <span>{exp}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="flex items-center justify-between pt-2">
                                        <div>
                                            <span className="text-xs text-slate-400">Tổng chi phí bộ đồ:</span>
                                            <span className="text-white font-bold text-sm ml-2">
                                                {new Intl.NumberFormat('vi-VN').format(outfit.totalPrice)}đ
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => openTryOnModalForProduct(outfit.items[0]?.product)}
                                            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
                                        >
                                            <Sparkles size={14} /> AI Virtual Try-On Bộ Này
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* AI Try-On Modal */}
            {tryOnProduct && (
                <TryOnModal
                    isOpen={isTryOnOpen}
                    onClose={() => setIsTryOnOpen(false)}
                    product={tryOnProduct}
                />
            )}

            {/* Floating Interactive Chat Stylist */}
            <AIChatStylistModal />
        </div>
    );
}
