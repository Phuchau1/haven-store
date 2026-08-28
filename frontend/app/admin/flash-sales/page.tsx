'use client';
/**
 * ============================================================
 * TRANG ADMIN: QUẢN LÝ FLASH SALE DOANH NGHIỆP — /admin/flash-sales
 *
 * Giao diện chuẩn Doanh Nghiệp (Human Enterprise UI):
 * - Tông màu Slate & Monochromatic chuyên nghiệp (Shopify / Linear style)
 * - Tối ưu công cụ lên lịch Flash Sale 3 ngày tiếp theo
 * - Bộ công cụ điều chỉnh phần trăm giảm giá & tồn kho chuẩn xác
 * ============================================================
 */
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Edit2, Trash2, Save, Tag, Activity, ArrowLeft,
    Search, Calendar, Clock, Percent, Check, RefreshCw, Filter
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
    const [customDiscountInput, setCustomDiscountInput] = useState<number>(20);

    const [formData, setFormData] = useState({
        name: '', startTime: '', endTime: '', isActive: true, products: [] as FlashSaleProduct[]
    });

    // ─── Lịch 4 ngày chuẩn Doanh nghiệp (Hôm nay + 3 ngày tiếp theo) ───
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

    // Danh mục sản phẩm
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
            const todayPreset = threeDayPresets[0];
            setFormData({ 
                name: `Chiến dịch Flash Sale — ${todayPreset.fullLabel}`, 
                startTime: todayPreset.startISO, 
                endTime: todayPreset.endISO, 
                isActive: true, 
                products: []
            });
        }
        setIsModalOpen(true);
    };

    // Áp dụng khung giờ sale 3 ngày chuẩn
    const applyDatePreset = (presetIndex: number | 'all-3-days') => {
        if (presetIndex === 'all-3-days') {
            const day0 = threeDayPresets[0];
            const day3 = threeDayPresets[3];
            setFormData(f => ({
                ...f,
                name: `Chiến dịch Flash Sale 3 Ngày (${day0.dateStr} - ${day3.dateStr})`,
                startTime: day0.startISO,
                endTime: day3.endISO
            }));
        } else {
            const p = threeDayPresets[presetIndex];
            if (p) {
                setFormData(f => ({
                    ...f,
                    name: `Chiến dịch Flash Sale — ${p.fullLabel}`,
                    startTime: p.startISO,
                    endTime: p.endISO
                }));
            }
        }
    };

    // Áp dụng giảm % hàng loạt (loại bỏ mức giảm 50% exaggerated)
    const applyMassDiscount = (percent: number) => {
        const safePercent = Math.min(Math.max(percent, 5), 40); // Giới hạn mức giảm hợp lý 5% - 40%
        setFormData(f => ({
            ...f,
            products: f.products.map(p => {
                const pid = typeof p.productId === 'object' ? p.productId.id : p.productId;
                const pInfo = allProducts.find(ap => ap.id === pid);
                const origPrice = pInfo?.price || 0;
                const discountedPrice = Math.round(origPrice * (1 - safePercent / 100));

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
            setErrorMsg('Vui lòng chọn ít nhất 1 sản phẩm cho chiến dịch.');
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
                setErrorMsg(data.message || 'Có lỗi xảy ra khi lưu.');
            }
        } catch {
            setErrorMsg('Không thể kết nối đến máy chủ.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa chiến dịch này?')) return;
        try {
            const res = await fetch(`/api/flash-sales/admin/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) setFlashSales(flashSales.filter(c => c._id !== id));
            else alert(data.message);
        } catch (error) {
            console.error('Lỗi khi xóa:', error);
        }
    };

    const handleAddProduct = (product: ProductBase) => {
        if (formData.products.find(p => (typeof p.productId === 'object' ? p.productId.id : p.productId) === product.id)) return;
        
        const defaultPrice = product.price ? Math.round(product.price * 0.85) : 0; // -15% mặc định chuẩn doanh nghiệp
        const variants = (product.variants || []).map((v) => ({
            color: v.color,
            size: v.size,
            flashSalePrice: defaultPrice,
            stockQuantity: 20,
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
    // WORKSPACE CHỈNH SỬA TOÀN MÀN HÌNH CHUẨN DOANH NGHIỆP
    // ════════════════════════════════════════════════════════════
    if (isModalOpen) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-6 max-w-7xl mx-auto pb-20"
            >
                {/* Header Bar */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-4 z-30">
                    <div className="flex items-center gap-3.5 min-w-0">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 transition-colors text-slate-700 dark:text-slate-200 flex items-center gap-2 font-semibold text-xs shrink-0 cursor-pointer"
                        >
                            <ArrowLeft size={16} /> Quay lại danh sách
                        </button>
                        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                        <div className="min-w-0">
                            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                                {editingItem ? `Chỉnh sửa: ${editingItem.name}` : 'Tạo Chiến Dịch Flash Sale Mới'}
                            </h1>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                                Cấu hình thời gian khuyến mãi, danh sách sản phẩm và giá ưu đãi
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={saving}
                            className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                        >
                            <Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu Chiến Dịch'}
                        </button>
                    </div>
                </div>

                {errorMsg && (
                    <div className="p-4 rounded-xl text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                        ⚠️ {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ─── 1. THỜI GIAN & KHUNG GIỜ SALE 3 NGÀY ─── */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Calendar size={16} className="text-slate-700 dark:text-slate-300" />
                                    1. Cấu hình Thời gian & Khung giờ Khuyến mãi
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Chọn khung ngày sale áp dụng trong 3 ngày tiếp theo hoặc tự tùy chỉnh
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => applyDatePreset('all-3-days')}
                                className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
                            >
                                Lên lịch liền mạch 3 ngày
                            </button>
                        </div>

                        {/* Presets Segmented Selector */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-2.5">
                                Chọn nhanh khung ngày theo lịch:
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {threeDayPresets.map((preset, pIdx) => {
                                    const isSelected = formData.startTime.startsWith(preset.startISO.slice(0, 10));
                                    return (
                                        <button
                                            key={preset.index}
                                            type="button"
                                            onClick={() => applyDatePreset(pIdx)}
                                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                                                isSelected
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                }`}>
                                                    {preset.tag}
                                                </span>
                                                <span className="text-xs font-mono opacity-80">{preset.dateStr}</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-xs">{preset.dayOfWeek}</p>
                                                <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>00:00 — 23:59</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Name & Date Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                            <div className="md:col-span-3">
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tên chương trình khuyến mãi</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="adm-input w-full font-medium"
                                    placeholder="VD: Chương trình Flash Sale Tuần Mới"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                                    <Clock size={13} /> Thời gian Bắt đầu
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={formData.startTime}
                                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                    className="adm-input w-full font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                                    <Clock size={13} /> Thời gian Kết thúc
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={formData.endTime}
                                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                    className="adm-input w-full font-medium"
                                />
                            </div>

                            <div className="flex items-center">
                                <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 w-full hover:bg-slate-100 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                                    />
                                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Kích hoạt chương trình ngay</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* ─── 2. DANH SÁCH SẢN PHẨM ĐÃ CHỌN & ĐIỀU CHỈNH GIÁ HÀNG LOẠT ─── */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3.5">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Tag size={16} className="text-slate-700 dark:text-slate-300" />
                                    2. Danh sách Sản phẩm áp dụng ({formData.products.length} sản phẩm)
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Thiết lập giá bán khuyến mãi và hạn mức tồn kho
                                </p>
                            </div>

                            {/* Clean Enterprise Mass Discount Tool */}
                            {formData.products.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 pl-2">Giảm nhanh:</span>
                                    {[10, 15, 20, 30].map(pct => (
                                        <button
                                            key={pct}
                                            type="button"
                                            onClick={() => applyMassDiscount(pct)}
                                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs hover:border-slate-400 transition-all cursor-pointer shadow-2xs"
                                        >
                                            -{pct}%
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {formData.products.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 space-y-1.5">
                                <Tag size={28} className="mx-auto text-slate-300 dark:text-slate-600" />
                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Chưa có sản phẩm nào được chọn.</p>
                                <p className="text-[11px] text-slate-400">Vui lòng chọn sản phẩm ở Mục 3 bên dưới để thêm vào danh sách.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {formData.products.map((p, idx) => {
                                    const pIdStr = typeof p.productId === 'object' ? p.productId.id : p.productId;
                                    const productInfo = allProducts.find(ap => ap.id === pIdStr);
                                    const hasVariants = productInfo?.variants && productInfo.variants.length > 0;

                                    return (
                                        <div key={idx} className="bg-slate-50/60 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                                            {/* Product Item Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-700/80 pb-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-12 h-12 bg-white rounded-lg overflow-hidden border border-slate-200 shrink-0">
                                                        {productInfo?.images?.[0] ? (
                                                            /* eslint-disable-next-line @next/next/no-img-element */
                                                            <img src={productInfo.images[0]} alt={productInfo.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Tag className="w-5 h-5 text-slate-300 m-3.5" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{productInfo?.name || pIdStr}</h4>
                                                        <p className="text-xs text-slate-500 mt-0.5">
                                                            Mã: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{pIdStr}</span> | Giá niêm yết: <strong className="text-slate-900 dark:text-white">{productInfo?.price?.toLocaleString() || 0}đ</strong>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 shrink-0">
                                                    {hasVariants && (
                                                        <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium">
                                                            <input
                                                                type="checkbox"
                                                                checked={p.useVariants || false}
                                                                onChange={(e) => handleUpdateProduct(pIdStr, 'useVariants', e.target.checked)}
                                                                className="w-3.5 h-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                                                            />
                                                            <span>Cấu hình theo biến thể ({productInfo.variants?.length})</span>
                                                        </label>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveProduct(pIdStr)}
                                                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all border border-rose-200 dark:border-rose-900/50 cursor-pointer"
                                                        title="Gỡ sản phẩm"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* General Pricing (When NOT using variants) */}
                                            {!p.useVariants && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                                    <div>
                                                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Giá khuyến mãi (VNĐ)</label>
                                                        <input
                                                            type="number"
                                                            value={p.flashSalePrice}
                                                            onChange={(e) => handleUpdateProduct(pIdStr, 'flashSalePrice', e.target.value === '' ? '' : Number(e.target.value))}
                                                            className="adm-input w-full font-bold text-indigo-600 dark:text-indigo-400"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Số lượng dành cho KM</label>
                                                        <input
                                                            type="number"
                                                            value={p.stockQuantity}
                                                            onChange={(e) => handleUpdateProduct(pIdStr, 'stockQuantity', e.target.value === '' ? '' : Number(e.target.value))}
                                                            className="adm-input w-full font-medium"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Variant Pricing Grid */}
                                            {p.useVariants && p.variants && p.variants.length > 0 && (
                                                <div className="space-y-2 pt-1">
                                                    <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Chi tiết theo màu & size:</p>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                        {p.variants.map((v, vIdx) => {
                                                            const discountPct = productInfo?.price && v.flashSalePrice ? Math.round(((productInfo.price - v.flashSalePrice) / productInfo.price) * 100) : 0;
                                                            return (
                                                                <div key={vIdx} className="bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-700 rounded-lg space-y-2">
                                                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                                                                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                                            {v.color} | {v.size}
                                                                        </span>
                                                                        {discountPct > 0 && (
                                                                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                                                                -{discountPct}%
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <div className="space-y-1.5">
                                                                        <div>
                                                                            <label className="text-[10px] font-semibold text-slate-500 block">Giá KM (VNĐ)</label>
                                                                            <input
                                                                                type="number"
                                                                                value={v.flashSalePrice !== undefined ? v.flashSalePrice : ''}
                                                                                onChange={(e) => handleUpdateVariant(pIdStr, vIdx, 'flashSalePrice', e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                                                                                className="adm-input w-full text-xs font-bold text-indigo-600 dark:text-indigo-400 py-1.5 px-2"
                                                                            />
                                                                        </div>

                                                                        <div>
                                                                            <label className="text-[10px] font-semibold text-slate-500 block">Số lượng KM</label>
                                                                            <input
                                                                                type="number"
                                                                                value={v.stockQuantity !== undefined ? v.stockQuantity : ''}
                                                                                onChange={(e) => handleUpdateVariant(pIdStr, vIdx, 'stockQuantity', e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                                                                                className="adm-input w-full text-xs font-medium py-1.5 px-2"
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

                    {/* ─── 3. THÊM SẢN PHẨM MỚI VÀO CHIẾN DỊCH ─── */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Plus size={16} className="text-slate-700 dark:text-slate-300" />
                                    3. Thêm Sản phẩm vào Chương trình
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Tra cứu sản phẩm theo tên hoặc danh mục để chọn thêm
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleAddAllFiltered}
                                disabled={filteredProducts.length === 0}
                                className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer shrink-0"
                            >
                                Thêm tất cả ({filteredProducts.length} kết quả)
                            </button>
                        </div>

                        {/* Search & Category Filter Bar */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2 relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm sản phẩm theo tên hoặc mã..."
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    className="adm-input pl-9 w-full"
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

                        {/* Product Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[450px] overflow-y-auto p-1">
                            {filteredProducts.slice(0, 60).map(product => {
                                const isSelected = formData.products.some(p => (typeof p.productId === 'object' ? p.productId.id : p.productId) === product.id);
                                return (
                                    <div key={product.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-slate-400 transition-colors shadow-2xs">
                                        <div className="flex items-center gap-3 min-w-0 pr-2">
                                            <div className="w-11 h-11 bg-white rounded-lg overflow-hidden border border-slate-200 shrink-0">
                                                {product.images?.[0] ? (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Tag className="w-4 h-4 text-slate-300 m-3.5" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-xs text-slate-900 dark:text-white truncate leading-snug">{product.name}</p>
                                                <p className="text-[11px] text-slate-500 mt-0.5">Giá gốc: <strong className="text-slate-900 dark:text-white">{product.price?.toLocaleString()}đ</strong></p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            disabled={isSelected}
                                            onClick={() => handleAddProduct(product)}
                                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer ${
                                                isSelected
                                                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-2xs'
                                            }`}
                                        >
                                            {isSelected ? 'Đã chọn' : '+ Thêm'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="flex items-center justify-end gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                        >
                            <Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu Chiến Dịch'}
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
                    <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--adm-text)' }}>
                        Quản lý Flash Sale
                    </h1>
                    <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                        Tổng số {flashSales.length} chương trình khuyến mãi
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/admin/flash-sales/dashboard" className="adm-btn-secondary">
                        <Activity size={16} /> Dashboard Phân Tích
                    </Link>
                    <button
                        onClick={() => openModal()}
                        className="adm-btn-primary flex items-center gap-2"
                        style={{ minHeight: 44 }}
                    >
                        <Plus size={16} /> Tạo mới chương trình
                    </button>
                </div>
            </div>

            {/* Enterprise Overview Card */}
            <div className="adm-card p-5 bg-slate-900 text-white rounded-2xl shadow-xs border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white text-base">
                            <Calendar size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-white">Quản lý Khung giờ & Lên lịch Flash Sale</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Lên lịch chương trình sale 3 ngày tiếp theo và thiết lập giá khuyến mãi</p>
                        </div>
                    </div>

                    <button
                        onClick={() => openModal()}
                        className="px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                        <Plus size={14} /> Lên lịch chương trình sale
                    </button>
                </div>
            </div>

            <div className="adm-card overflow-hidden shadow-2xs">
                {loading ? (
                    <div className="p-12 text-center text-slate-500 font-medium flex items-center justify-center gap-2">
                        <RefreshCw className="animate-spin" size={18} /> Đang tải danh sách...
                    </div>
                ) : flashSales.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center space-y-3">
                        <Tag size={40} className="text-slate-300 dark:text-slate-600" />
                        <p className="font-semibold text-slate-700 dark:text-slate-300">Chưa có chương trình Flash Sale nào.</p>
                        <button onClick={() => openModal()} className="adm-btn-primary">
                            Tạo chương trình đầu tiên
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>Tên chương trình</th>
                                    <th>Thời gian diễn ra</th>
                                    <th>Trạng thái</th>
                                    <th>Sản phẩm áp dụng</th>
                                    <th className="text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {flashSales.map((item) => {
                                    const now = new Date();
                                    const start = new Date(item.startTime);
                                    const end = new Date(item.endTime);
                                    let statusText = 'Đang diễn ra';
                                    let statusColor = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                                    
                                    if (!item.isActive) {
                                        statusText = 'Tắt';
                                        statusColor = 'bg-slate-100 text-slate-600 border border-slate-200';
                                    } else if (now < start) {
                                        statusText = 'Sắp diễn ra';
                                        statusColor = 'bg-blue-50 text-blue-700 border border-blue-200';
                                    } else if (now > end) {
                                        statusText = 'Đã kết thúc';
                                        statusColor = 'bg-slate-100 text-slate-500 border border-slate-200';
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
                                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${statusColor}`}>
                                                    {statusText}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--adm-text-muted)' }}>
                                                <span className="font-bold text-slate-900 dark:text-white">{item.products?.length || 0}</span> sản phẩm
                                            </td>
                                            <td className="text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button onClick={() => openModal(item)} className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors" title="Chỉnh sửa"><Edit2 size={15} /></button>
                                                    <button onClick={() => handleDelete(item._id)} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors" title="Xóa"><Trash2 size={15} /></button>
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
