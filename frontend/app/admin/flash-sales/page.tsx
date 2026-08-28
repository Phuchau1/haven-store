'use client';
/**
 * ============================================================
 * TRANG ADMIN: QUẢN LÝ FLASH SALE DOANH NGHIỆP — /admin/flash-sales
 *
 * Hỗ trợ chọn nhanh sản phẩm sale 3 ngày tiếp theo (Hôm nay, Ngày mai, Ngày kia, Ngày kìa)
 * Cấu hình giá ưu đãi, tồn kho, giảm giá hàng loạt & giao diện chuẩn Doanh Nghiệp.
 * ============================================================
 */
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Edit2, Trash2, Save, Zap, Tag, Activity, ArrowLeft,
    Search, Calendar, Clock, Percent, Sparkles, Check, RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface FlashSaleVariant {
    color: string;
    size: string;
    flashSalePrice: number;
    stockQuantity: number;
    soldQuantity: number;
}

interface FlashSaleProduct {
    productId: string | { id: string };
    flashSalePrice: number;
    stockQuantity: number;
    soldQuantity: number;
    variants?: FlashSaleVariant[];
    useVariants?: boolean;
}

interface FlashSale {
    _id: string;
    name: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
    products: FlashSaleProduct[];
}

interface ProductBase {
    id: string;
    name: string;
    price?: number;
    category?: string;
    variants?: Array<{ color: string; size: string }>;
    images?: string[];
}

export default function AdminFlashSalesPage() {
    const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<FlashSale | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [saving, setSaving] = useState(false);
    
    // Product Selection State
    const [allProducts, setAllProducts] = useState<ProductBase[]>([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [batchDiscountPercent, setBatchDiscountPercent] = useState<number>(30);

    const [formData, setFormData] = useState({
        name: '', startTime: '', endTime: '', isActive: true, products: [] as FlashSaleProduct[]
    });

    // ─── 3-Day Schedule Presets Data ───────────────────────────
    const threeDayPresets = useMemo(() => {
        const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        const now = new Date();
        const days = [];
        
        for (let i = 0; i <= 3; i++) {
            const d = new Date();
            d.setDate(now.getDate() + i);
            const dayStr = String(d.getDate()).padStart(2, '0');
            const monthStr = months[d.getMonth()];
            
            const dayNum = d.getDay();
            const dayOfWeek = dayNum === 0 ? 'Chủ Nhật' : `Thứ ${dayNum + 1}`;
            
            // Format datetime local format: YYYY-MM-DDTHH:mm
            const startD = new Date(d);
            startD.setHours(0, 0, 0, 0);
            const endD = new Date(d);
            endD.setHours(23, 59, 0, 0);

            const startLocal = new Date(startD.getTime() - startD.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            const endLocal = new Date(endD.getTime() - endD.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

            days.push({
                index: i,
                tag: i === 0 ? 'HÔM NAY' : i === 1 ? 'NGÀY MAI' : `NGÀY ${i + 1}`,
                dateStr: `${dayStr}/${monthStr}`,
                dayOfWeek: i === 0 ? 'Đang diễn ra' : dayOfWeek,
                startISO: startLocal,
                endISO: endLocal,
                fullLabel: `${i === 0 ? 'Hôm nay' : dayOfWeek} (${dayStr}/${monthStr})`
            });
        }
        return days;
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const [fsRes, prodRes] = await Promise.all([
                fetch('/api/flash-sales/admin'),
                fetch('/api/products?limit=1000')
            ]);
            const fsData = await fsRes.json();
            const prodData = await prodRes.json();
            
            if (fsData.success) setFlashSales(fsData.data);
            if (prodData.success) setAllProducts(prodData.products);
            
        } catch (error) {
            console.error('Lỗi tải dữ liệu Flash Sale:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchItems(); }, []);

    // ─── Danh mục sản phẩm duy nhất ──────────────────────────
    const categoriesList = useMemo(() => {
        const set = new Set<string>();
        allProducts.forEach(p => { if (p.category) set.add(p.category); });
        return Array.from(set);
    }, [allProducts]);

    const openModal = (item?: FlashSale) => {
        setErrorMsg('');
        setSearchKeyword('');
        setSelectedCategory('all');
        if (item) {
            setEditingItem(item);
            
            const normalizedProducts = (item.products || []).map(p => {
                const pid = typeof p.productId === 'object' ? (p.productId as { id: string }).id : p.productId;
                let variants = p.variants || [];
                
                if (variants.length === 0) {
                    const productInfo = allProducts.find(ap => ap.id === pid);
                    if (productInfo && productInfo.variants) {
                        variants = productInfo.variants.map((v) => ({
                            color: v.color,
                            size: v.size,
                            flashSalePrice: p.flashSalePrice || 0,
                            stockQuantity: p.stockQuantity || 0,
                            soldQuantity: 0
                        }));
                    }
                }

                return {
                    productId: pid,
                    flashSalePrice: p.flashSalePrice,
                    stockQuantity: p.stockQuantity,
                    soldQuantity: p.soldQuantity || 0,
                    variants: variants,
                    useVariants: p.variants && p.variants.length > 0
                };
            });

            setFormData({ 
                name: item.name, 
                startTime: new Date(item.startTime).toISOString().slice(0, 16), 
                endTime: new Date(item.endTime).toISOString().slice(0, 16), 
                isActive: item.isActive,
                products: normalizedProducts
            });
        } else {
            setEditingItem(null);
            // Default to Today preset
            const todayPreset = threeDayPresets[0];
            setFormData({ 
                name: `Flash Sale Đặc Biệt — ${todayPreset.fullLabel}`, 
                startTime: todayPreset.startISO, 
                endTime: todayPreset.endISO, 
                isActive: true, 
                products: []
            });
        }
        setIsModalOpen(true);
    };

    // ─── Áp dụng khung giờ sale nhanh 3 ngày ──────────────────
    const applyDatePreset = (presetIndex: number | 'all-3-days') => {
        if (presetIndex === 'all-3-days') {
            const day0 = threeDayPresets[0];
            const day3 = threeDayPresets[3];
            setFormData(f => ({
                ...f,
                name: `Flash Sale 3 Ngày Liên Tiếp (${day0.dateStr} - ${day3.dateStr})`,
                startTime: day0.startISO,
                endTime: day3.endISO
            }));
        } else {
            const p = threeDayPresets[presetIndex];
            if (p) {
                setFormData(f => ({
                    ...f,
                    name: `Flash Sale Sốc ${p.tag} (${p.dateStr})`,
                    startTime: p.startISO,
                    endTime: p.endISO
                }));
            }
        }
    };

    // ─── Áp dụng giảm % hàng loạt cho các sản phẩm đã chọn ───
    const applyMassDiscount = (percent: number) => {
        setFormData(f => ({
            ...f,
            products: f.products.map(p => {
                const pid = typeof p.productId === 'object' ? p.productId.id : p.productId;
                const pInfo = allProducts.find(ap => ap.id === pid);
                const origPrice = pInfo?.price || 0;
                const discountedPrice = Math.round(origPrice * (1 - percent / 100));

                const updatedVariants = (p.variants || []).map(v => ({
                    ...v,
                    flashSalePrice: discountedPrice
                }));

                return {
                    ...p,
                    flashSalePrice: discountedPrice,
                    variants: updatedVariants
                };
            })
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg('');
        
        if (formData.products.length === 0) {
            setErrorMsg('Vui lòng chọn ít nhất 1 sản phẩm cho chiến dịch Flash Sale.');
            setSaving(false);
            return;
        }

        try {
            const payload = {
                name: formData.name,
                startTime: formData.startTime,
                endTime: formData.endTime,
                isActive: formData.isActive,
                products: formData.products.map(p => ({
                    productId: typeof p.productId === 'object' ? p.productId.id : p.productId,
                    flashSalePrice: p.flashSalePrice,
                    stockQuantity: p.stockQuantity,
                    soldQuantity: p.soldQuantity,
                    variants: p.useVariants ? p.variants : []
                }))
            };

            const url = editingItem ? `/api/flash-sales/admin/${editingItem._id}` : '/api/flash-sales/admin';
            const method = editingItem ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                fetchItems();
                setIsModalOpen(false);
            } else {
                setErrorMsg(data.message || 'Có lỗi xảy ra khi lưu chiến dịch.');
            }
        } catch {
            setErrorMsg('Không thể kết nối đến máy chủ.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa chiến dịch Flash Sale này?')) return;
        try {
            const res = await fetch(`/api/flash-sales/admin/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) setFlashSales(flashSales.filter(c => c._id !== id));
            else alert(data.message);
        } catch (error) {
            console.error('Lỗi khi xóa:', error);
        }
    };

    // Product Selection Handlers
    const handleAddProduct = (product: ProductBase) => {
        if (formData.products.find(p => (typeof p.productId === 'object' ? p.productId.id : p.productId) === product.id)) return;
        
        const defaultPrice = product.price ? Math.round(product.price * 0.7) : 0; // Default -30%
        const variants = (product.variants || []).map((v) => ({
            color: v.color,
            size: v.size,
            flashSalePrice: defaultPrice,
            stockQuantity: 15,
            soldQuantity: 0
        }));

        setFormData({
            ...formData,
            products: [...formData.products, {
                productId: product.id,
                flashSalePrice: defaultPrice,
                stockQuantity: 50,
                soldQuantity: 0,
                variants: variants,
                useVariants: false
            }]
        });
    };

    // Thêm hàng loạt tất cả sản phẩm đang hiển thị trong tìm kiếm
    const handleAddAllFiltered = () => {
        const unselected = filteredProducts.filter(p => !formData.products.some(fp => (typeof fp.productId === 'object' ? fp.productId.id : fp.productId) === p.id));
        unselected.forEach(p => handleAddProduct(p));
    };

    const handleRemoveProduct = (productId: string) => {
        setFormData({
            ...formData,
            products: formData.products.filter(p => (typeof p.productId === 'object' ? p.productId.id : p.productId) !== productId)
        });
    };

    const handleUpdateProduct = (productId: string, field: string, value: string | number | boolean) => {
        setFormData({
            ...formData,
            products: formData.products.map(p => {
                const pid = typeof p.productId === 'object' ? p.productId.id : p.productId;
                return pid === productId ? { ...p, [field]: value } : p;
            })
        });
    };

    const handleUpdateVariant = (productId: string, variantIndex: number, field: string, value: string | number | boolean) => {
        setFormData({
            ...formData,
            products: formData.products.map(p => {
                const pid = typeof p.productId === 'object' ? p.productId.id : p.productId;
                if (pid !== productId) return p;
                const newVariants = [...(p.variants || [])];
                newVariants[variantIndex] = { ...newVariants[variantIndex], [field]: value };
                return { ...p, variants: newVariants };
            })
        });
    };

    const filteredProducts = allProducts.filter(p => {
        const matchKw = !searchKeyword || p.name.toLowerCase().includes(searchKeyword.toLowerCase()) || p.id.toLowerCase().includes(searchKeyword.toLowerCase());
        const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
        return matchKw && matchCat;
    });

    const formatDate = (d: string) => {
        try { return new Date(d).toLocaleString('vi-VN'); } catch { return d; }
    };

    // ════════════════════════════════════════════════════════════
    // ENTERPRISE EDITOR WORKSPACE MODE (FULL PAGE VIEW)
    // ════════════════════════════════════════════════════════════
    if (isModalOpen) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                className="space-y-6 max-w-7xl mx-auto pb-20"
            >
                {/* Enterprise Sticky Top Bar */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-4 z-30">
                    <div className="flex items-center gap-3.5 min-w-0">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-200 flex items-center gap-2 font-bold text-xs shrink-0 cursor-pointer"
                        >
                            <ArrowLeft size={16} /> Quay lại danh sách
                        </button>
                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                        <div className="min-w-0">
                            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate">
                                {editingItem ? `Sửa Chiến Dịch: ${editingItem.name}` : 'Tạo Chiến Dịch Flash Sale Mới'}
                            </h1>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                                Cấu hình khung sale 3 ngày, cài đặt phần trăm giảm giá & tồn kho biến thể
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={saving}
                            className="adm-btn-primary flex items-center gap-2 px-6 py-2.5 text-xs font-bold shadow-md cursor-pointer"
                        >
                            <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu Chiến Dịch Flash Sale'}
                        </button>
                    </div>
                </div>

                {errorMsg && (
                    <div className="p-4 rounded-2xl text-sm font-bold bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 shadow-xs">
                        ⚠️ {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ─── 1. BỘ CHỌN NHANH LỊCH SALE 3 NGÀY TIẾP THEO & THÔNG TIN ─── */}
                    <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                                <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                                    <Zap size={18} className="text-amber-500 fill-amber-400 animate-bounce" />
                                    1. Lịch Trình Sale & Khung Giờ (Sale 3 Ngày Tiếp Theo)
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Chọn nhanh 1 trong các khung ngày tiếp theo để hệ thống tự động lên lịch Flash Sale
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => applyDatePreset('all-3-days')}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-xs shadow-md hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <Sparkles size={14} /> 🔥 TỰ ĐỘNG LÊN LỊCH TOÀN BỘ 3 NGÀY
                            </button>
                        </div>

                        {/* 📅 3-DAY QUICK PRESETS SELECTOR BUTTONS */}
                        <div>
                            <label className="block text-xs font-extrabold uppercase tracking-wider text-indigo-600 mb-3 flex items-center gap-1.5">
                                <Calendar size={14} /> Chọn nhanh Ngày Sale chuẩn hệ thống:
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {threeDayPresets.map((preset, pIdx) => {
                                    const isSelected = formData.startTime.startsWith(preset.startISO.slice(0, 10));
                                    return (
                                        <button
                                            key={preset.index}
                                            type="button"
                                            onClick={() => applyDatePreset(pIdx)}
                                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative overflow-hidden ${
                                                isSelected
                                                    ? 'bg-indigo-900 text-white border-indigo-600 shadow-md ring-2 ring-indigo-400'
                                                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                                    isSelected ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                }`}>
                                                    {preset.tag}
                                                </span>
                                                <span className="text-xs font-mono font-bold opacity-80">{preset.dateStr}</span>
                                            </div>
                                            <div>
                                                <p className="font-extrabold text-sm leading-tight">{preset.dayOfWeek}</p>
                                                <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>00:00 — 23:59</p>
                                            </div>
                                            {isSelected && (
                                                <span className="absolute right-2 bottom-2 text-emerald-400 text-xs font-black">✓ Đã chọn</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Form Inputs for Name & Time */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                            <div className="md:col-span-3">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Tên chiến dịch Flash Sale</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    placeholder="VD: Flash Sale Sốc Ngày Mai 29/08 - Giảm đến 50%"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                                    <Clock size={12} /> Thời gian Bắt đầu
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={formData.startTime}
                                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                                    <Clock size={12} /> Thời gian Kết thúc
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={formData.endTime}
                                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>

                            <div className="flex items-center">
                                <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 w-full hover:border-indigo-400 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">Bật hiển thị chiến dịch ngay</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* ─── 2. SẢN PHẨM ĐÃ CHỌN TRONG CHIẾN DỊCH & CÔNG CỤ TÍNH GIÁ HÀNG LOẠT ─── */}
                    <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                                <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                                    <Tag size={18} className="text-indigo-600" />
                                    2. Danh Sách Sản Phẩm Sale Đã Chọn ({formData.products.length} Sản phẩm)
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Cài đặt giá Flash Sale, số lượng giới hạn và ma trận giá từng biến thể
                                </p>
                            </div>

                            {/* Batch Discount Helper Bar */}
                            {formData.products.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
                                    <span className="text-[11px] font-bold text-slate-500 pl-2">Áp dụng giảm nhanh:</span>
                                    {[20, 30, 40, 50].map(pct => (
                                        <button
                                            key={pct}
                                            type="button"
                                            onClick={() => applyMassDiscount(pct)}
                                            className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition-all cursor-pointer shadow-2xs"
                                        >
                                            -{pct}%
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {formData.products.length === 0 ? (
                            <div className="p-10 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                                <Tag size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Chưa có sản phẩm nào trong chiến dịch này</p>
                                <p className="text-xs text-slate-400">Vui lòng chọn sản phẩm bên dưới ở Mục 3 để thêm vào chiến dịch!</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {formData.products.map((p, idx) => {
                                    const pIdStr = typeof p.productId === 'object' ? p.productId.id : p.productId;
                                    const productInfo = allProducts.find(ap => ap.id === pIdStr);
                                    const hasVariants = productInfo?.variants && productInfo.variants.length > 0;

                                    return (
                                        <div key={idx} className="bg-slate-50/70 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-2xs">
                                            {/* Product Card Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700/80 pb-4">
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    <div className="w-14 h-14 bg-white rounded-xl overflow-hidden border border-slate-200 shrink-0">
                                                        {productInfo?.images?.[0] ? (
                                                            /* eslint-disable-next-line @next/next/no-img-element */
                                                            <img src={productInfo.images[0]} alt={productInfo.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Tag className="w-6 h-6 text-slate-300 m-4" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-1">{productInfo?.name || pIdStr}</h4>
                                                        <p className="text-xs text-slate-500 mt-0.5">
                                                            Mã SP: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{pIdStr}</span> | Giá gốc: <strong className="text-slate-900 dark:text-white">{productInfo?.price?.toLocaleString() || 0}đ</strong>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 shrink-0">
                                                    {hasVariants && (
                                                        <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 text-xs font-bold">
                                                            <input
                                                                type="checkbox"
                                                                checked={p.useVariants || false}
                                                                onChange={(e) => handleUpdateProduct(pIdStr, 'useVariants', e.target.checked)}
                                                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            <span>Cấu hình theo biến thể ({productInfo.variants?.length} loại)</span>
                                                        </label>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveProduct(pIdStr)}
                                                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-rose-200 dark:border-rose-900/50 cursor-pointer"
                                                        title="Bỏ sản phẩm này khỏi chiến dịch"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* General Pricing (When NOT using variants) */}
                                            {!p.useVariants && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                                    <div>
                                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Giá Flash Sale (VNĐ)</label>
                                                        <input
                                                            type="number"
                                                            value={p.flashSalePrice}
                                                            onChange={(e) => handleUpdateProduct(pIdStr, 'flashSalePrice', e.target.value === '' ? '' : Number(e.target.value))}
                                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-indigo-600 dark:text-indigo-400 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Tồn kho Flash Sale</label>
                                                        <input
                                                            type="number"
                                                            value={p.stockQuantity}
                                                            onChange={(e) => handleUpdateProduct(pIdStr, 'stockQuantity', e.target.value === '' ? '' : Number(e.target.value))}
                                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Full-width Variant Pricing Grid */}
                                            {p.useVariants && p.variants && p.variants.length > 0 && (
                                                <div className="space-y-3 pt-1">
                                                    <p className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Ma Trận Giá & Tồn Kho Chi Tiết Theo Biến Thể</p>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                        {p.variants.map((v, vIdx) => {
                                                            const discountPct = productInfo?.price && v.flashSalePrice ? Math.round(((productInfo.price - v.flashSalePrice) / productInfo.price) * 100) : 0;
                                                            return (
                                                                <div key={vIdx} className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xs space-y-3">
                                                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                                                        <span className="text-xs font-black text-slate-900 dark:text-white">
                                                                            {v.color} <span className="text-slate-400 font-normal">|</span> {v.size}
                                                                        </span>
                                                                        {discountPct > 0 && (
                                                                            <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                                                                -{discountPct}%
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        <div>
                                                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                                                                Giá Sale (VNĐ)
                                                                            </label>
                                                                            <input
                                                                                type="number"
                                                                                placeholder="Nhập giá FS"
                                                                                value={v.flashSalePrice !== undefined ? v.flashSalePrice : ''}
                                                                                onChange={(e) => handleUpdateVariant(pIdStr, vIdx, 'flashSalePrice', e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                                                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-black text-indigo-600 dark:text-indigo-400 outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-800"
                                                                            />
                                                                        </div>

                                                                        <div>
                                                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                                                                Tồn Kho FS
                                                                            </label>
                                                                            <input
                                                                                type="number"
                                                                                placeholder="Số lượng"
                                                                                value={v.stockQuantity !== undefined ? v.stockQuantity : ''}
                                                                                onChange={(e) => handleUpdateVariant(pIdStr, vIdx, 'stockQuantity', e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                                                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-800"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ─── 3. KHU VỰC THÊM SẢN PHẨM MỚI VÀO CHIẾN DỊCH (HÌNH 1 USER UPLOAD) ─── */}
                    <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                                <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                                    <Plus size={18} className="text-emerald-600" />
                                    3. Thêm Sản Phẩm Mới Vào Chiến Dịch
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Tìm kiếm sản phẩm theo tên, danh mục và chọn nhanh vào danh sách Flash Sale
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleAddAllFiltered}
                                disabled={filteredProducts.length === 0}
                                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                            >
                                <Plus size={14} /> Thêm tất cả ({filteredProducts.length} SP tìm thấy)
                            </button>
                        </div>

                        {/* Search & Category Filter Bar */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2 relative">
                                <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm sản phẩm theo tên hoặc mã..."
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>

                            <div>
                                <select
                                    value={selectedCategory}
                                    onChange={e => setSelectedCategory(e.target.value)}
                                    className="adm-select w-full"
                                >
                                    <option value="all">Tất cả danh mục sản phẩm</option>
                                    {categoriesList.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Responsive Product Cards Grid (Matching User Screenshot Image 1) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto p-1">
                            {filteredProducts.slice(0, 60).map(product => {
                                const isSelected = formData.products.some(p => (typeof p.productId === 'object' ? p.productId.id : p.productId) === product.id);
                                return (
                                    <div key={product.id} className="flex items-center justify-between p-3.5 bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl hover:border-indigo-400 transition-colors shadow-2xs">
                                        <div className="flex items-center gap-3 min-w-0 pr-2">
                                            <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-slate-200 shrink-0">
                                                {product.images?.[0] ? (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Tag className="w-5 h-5 text-slate-300 m-3.5" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-xs text-slate-900 dark:text-white truncate leading-snug">{product.name}</p>
                                                <p className="text-[11px] text-slate-500 mt-0.5">Giá gốc: <strong className="text-slate-900 dark:text-white">{product.price?.toLocaleString()}đ</strong></p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            disabled={isSelected}
                                            onClick={() => handleAddProduct(product)}
                                            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer ${
                                                isSelected
                                                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs'
                                            }`}
                                        >
                                            {isSelected ? 'Đã thêm' : '+ Thêm'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom Sticky Action Bar */}
                    <div className="flex items-center justify-end gap-3 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-3 rounded-2xl border border-slate-300 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="adm-btn-primary px-8 py-3 rounded-2xl text-sm font-bold shadow-lg flex items-center gap-2 cursor-pointer"
                        >
                            <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu Chiến Dịch Flash Sale'}
                        </button>
                    </div>
                </form>
            </motion.div>
        );
    }

    // ════════════════════════════════════════════════════════════
    // ENTERPRISE FLASH SALES LIST VIEW
    // ════════════════════════════════════════════════════════════
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black" style={{ color: 'var(--adm-text)' }}>
                        Quản lý Chiến Dịch Flash Sale
                    </h1>
                    <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                        {flashSales.length} chiến dịch &bull; Lên lịch Sale 3 ngày tiếp theo
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/admin/flash-sales/dashboard" className="adm-btn-secondary">
                        <Activity size={18} /> Xem Dashboard
                    </Link>
                    <button
                        onClick={() => openModal()}
                        className="adm-btn-primary flex items-center gap-2"
                        style={{ minHeight: 44 }}
                    >
                        <Plus size={18} /> Tạo mới chiến dịch
                    </button>
                </div>
            </div>

            {/* Quick 3-Day Campaign Status Overview Card */}
            <div className="adm-card p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-sm border border-indigo-900/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 text-lg">
                            <Zap size={20} className="text-amber-400" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-sm text-white">Lộ Trình Sale 3 Ngày Tiếp Theo (Hôm nay, Ngày mai & các ngày tới)</h3>
                            <p className="text-xs text-slate-300 mt-0.5">Bấm Tạo mới để đặt giá giảm sâu và lịch đếm ngược cho từng ngày</p>
                        </div>
                    </div>

                    <button
                        onClick={() => openModal()}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                        <Plus size={14} /> Lên lịch Sale 3 ngày
                    </button>
                </div>
            </div>

            <div className="adm-card overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-12 text-center text-slate-500 font-medium flex items-center justify-center gap-2">
                        <RefreshCw className="animate-spin" size={20} /> Đang tải danh sách chiến dịch...
                    </div>
                ) : flashSales.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center space-y-3">
                        <Zap size={48} className="text-slate-300 dark:text-slate-600" />
                        <p className="font-bold text-slate-700 dark:text-slate-300">Chưa có chiến dịch Flash Sale nào.</p>
                        <button onClick={() => openModal()} className="adm-btn-primary">
                            Tạo chiến dịch đầu tiên ngay
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>Tên chiến dịch</th>
                                    <th>Thời gian diễn ra</th>
                                    <th>Trạng thái</th>
                                    <th>Sản phẩm tham gia</th>
                                    <th className="text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {flashSales.map((item) => {
                                    const now = new Date();
                                    const start = new Date(item.startTime);
                                    const end = new Date(item.endTime);
                                    let statusText = 'Đang chạy';
                                    let statusColor = 'bg-emerald-100 text-emerald-700 border border-emerald-300';
                                    
                                    if (!item.isActive) {
                                        statusText = 'Đã tắt';
                                        statusColor = 'bg-slate-100 text-slate-600 border border-slate-200';
                                    } else if (now < start) {
                                        statusText = 'Sắp diễn ra';
                                        statusColor = 'bg-blue-100 text-blue-700 border border-blue-300';
                                    } else if (now > end) {
                                        statusText = 'Đã kết thúc';
                                        statusColor = 'bg-rose-100 text-rose-700 border border-rose-300';
                                    }

                                    return (
                                        <tr key={item._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="font-bold text-sm" style={{ color: 'var(--adm-text)' }}>
                                                {item.name}
                                            </td>
                                            <td style={{ color: 'var(--adm-text-muted)' }}>
                                                <div className="text-xs font-mono">{formatDate(item.startTime)}</div>
                                                <div className="text-xs font-mono mt-0.5 text-slate-400">đến {formatDate(item.endTime)}</div>
                                            </td>
                                            <td>
                                                <span className={`px-2.5 py-1 text-xs font-extrabold rounded-lg ${statusColor}`}>
                                                    {statusText}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--adm-text-muted)' }}>
                                                <span className="font-bold text-slate-900 dark:text-white">{item.products?.length || 0}</span> sản phẩm
                                            </td>
                                            <td className="text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button onClick={() => openModal(item)} className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors" title="Chỉnh sửa"><Edit2 size={16} /></button>
                                                    <button onClick={() => handleDelete(item._id)} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors" title="Xóa"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
