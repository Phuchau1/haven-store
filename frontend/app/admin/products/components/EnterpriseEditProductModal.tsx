'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package, X, Plus, Trash2, Image as ImageIcon, DollarSign, Boxes,
    Search, Globe, Truck, Tag, Sliders, History, ShieldCheck, Eye, Save,
    FileText, CheckCircle2, AlertTriangle, Check, Loader2,
    ArrowUp, ArrowDown, Layers, Store, Upload, Info, ChevronRight, ArrowLeft
} from 'lucide-react';
import { Product } from '@/types';
import Image from 'next/image';

interface EnterpriseEditProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    onSave: (productData: any, isDraft?: boolean) => Promise<void>;
    categories: Array<{ id: string; name: string; subCategories?: Array<{ id: string; name: string }> }>;
    brands?: string[];
    showToast: (type: 'success' | 'error' | 'info' | 'warning', message: string, desc?: string) => void;
}

const DEFAULT_CATEGORIES = [
    {
        id: 'cat-clothing',
        name: 'Thời Trang Nam',
        subCategories: [
            { id: 'ao-so-mi-nam', name: 'Áo sơ mi nam' },
            { id: 'ao-polo-nam', name: 'Áo polo nam' },
            { id: 'ao-thun-nam', name: 'Áo T-shirt nam' },
            { id: 'ao-khoac-nam', name: 'Áo khoác nam' },
            { id: 'quan-au-nam', name: 'Quần âu nam' },
            { id: 'quan-jean-nam', name: 'Quần jean nam' },
            { id: 'quan-short-nam', name: 'Quần short nam' },
            { id: 'quan-kaki-nam', name: 'Quần kaki nam' },
            { id: 'bo-vest-nam', name: 'Bộ vest nam' },
            { id: 'giay-da-nam', name: 'Giày da nam' },
            { id: 'vi-da-nam', name: 'Ví da nam' },
            { id: 'day-lung-nam', name: 'Dây lưng nam' },
            { id: 'dep-nam', name: 'Dép nam' }
        ]
    },
    {
        id: 'cat-womens',
        name: 'Thời Trang Nữ',
        subCategories: [
            { id: 'ao-so-mi-nu', name: 'Áo sơ mi nữ' },
            { id: 'ao-polo-nu', name: 'Áo polo nữ' },
            { id: 'ao-thun-nu', name: 'Áo T-shirt nữ' },
            { id: 'ao-khoac-nu', name: 'Áo khoác nữ' },
            { id: 'quan-au-nu', name: 'Quần âu nữ' },
            { id: 'quan-jean-nu', name: 'Quần jean nữ' },
            { id: 'quan-short-nu', name: 'Quần short nữ' },
            { id: 'vay-lien-dam', name: 'Váy liền đầm' },
            { id: 'chan-vay', name: 'Chân váy' },
            { id: 'giay-dep-nu', name: 'Giày dép nữ' },
            { id: 'tui-xach', name: 'Túi xách' }
        ]
    }
];

const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '28', '29', '30', '31', '32', '34', 'Freesize'];
const PRESET_COLORS = [
    { name: 'Đen', hex: '#000000' },
    { name: 'Trắng', hex: '#FFFFFF' },
    { name: 'Xanh Navy', hex: '#1E3A8A' },
    { name: 'Xám Ghi', hex: '#64748B' },
    { name: 'Be (Kem)', hex: '#E2D9C8' },
    { name: 'Nâu Đất', hex: '#78350F' },
    { name: 'Xanh Rêu', hex: '#3F6212' },
    { name: 'Đỏ Đô', hex: '#881337' }
];

export default function EnterpriseEditProductModal({
    isOpen,
    onClose,
    product,
    onSave,
    categories,
    brands = ['HAVEN', 'Routine', 'Uniqlo', 'Zara', 'H&M', 'Nike', 'Adidas'],
    showToast
}: EnterpriseEditProductModalProps) {
    const activeCategories = (categories && categories.length > 0) ? categories : DEFAULT_CATEGORIES;

    // ── Form State ──
    const [formData, setFormData] = useState<any>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [uploadingImage, setUploadingImage] = useState(false);
    const [newImageUrl, setNewImageUrl] = useState('');
    const [customSizeInput, setCustomSizeInput] = useState('');
    const [customColorName, setCustomColorName] = useState('');
    const [customColorHex, setCustomColorHex] = useState('#000000');
    const [bulkPrice, setBulkPrice] = useState<number | ''>('');
    const [bulkStock, setBulkStock] = useState<number | ''>('');
    const [specKey, setSpecKey] = useState('');
    const [specValue, setSpecValue] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize Form Data
    useEffect(() => {
        if (!isOpen) return;

        if (product) {
            const rawImages = Array.isArray(product.images) && product.images.length > 0
                ? product.images
                : ((product as any).image ? [(product as any).image] : []);

            setFormData({
                ...product,
                _id: (product as any)._id,
                subCategory: product.subCategory || '',
                price: Number(product.price) || 0,
                originalPrice: Number(product.originalPrice) || Number(product.price) || 0,
                costPrice: Number((product as any).costPrice) || Math.round((Number(product.price) || 0) * 0.5),
                status: (product as any).status || ((product.inStock !== false) ? 'published' : 'draft'),
                brand: (product as any).brand || 'HAVEN',
                sku: (product as any).sku || `SKU-${product.id}`,
                barcode: (product as any).barcode || `893${Math.floor(100000000 + Math.random() * 900000000)}`,
                stock: (product as any).stock !== undefined ? Number((product as any).stock) : 100,
                images: rawImages,
                image: rawImages[0] || (product as any).image || '',
                shortDescription: (product as any).shortDescription || product.description || '',
                highlights: (product as any).highlights || ['Chất liệu cao cấp, co giãn thoải mái', 'Thấm hút mồ hôi, thoáng mát cả ngày', 'Đường may tinh tế, form dáng chuẩn'],
                specs: (product as any).specs || {
                    'Chất liệu': '100% Cotton Compact cao cấp',
                    'Kiểu dáng': 'Regular Fit tôn dáng',
                    'Xuất xứ': 'Sản xuất tại Việt Nam',
                    'Bảo quản': 'Giặt máy chế độ nhẹ, không sấy nhiệt cao'
                },
                seo: (product as any).seo || {
                    title: `${product.name} | HAVEN Store`,
                    description: product.description || `Mua sắm ${product.name} chính hãng giá tốt tại HAVEN Store.`,
                    slug: product.id ? product.id.toLowerCase() : ''
                },
                gender: (product as any).gender || 'Nam',
                styleCategory: (product as any).styleCategory || 'Tối giản (Minimalism)',
                shipping: (product as any).shipping || { weight: 300, length: 25, width: 18, height: 4 }
            });
        } else {
            const newId = `PRD-${Date.now().toString().slice(-6)}`;
            setFormData({
                id: newId,
                name: '',
                price: 0,
                originalPrice: 0,
                costPrice: 0,
                description: '',
                shortDescription: '',
                category: 'Thời Trang Nam',
                subCategory: 'ao-so-mi-nam',
                brand: 'HAVEN',
                images: [],
                image: '',
                sizes: ['S', 'M', 'L', 'XL'],
                colors: [{ name: 'Đen', hex: '#000000' }, { name: 'Trắng', hex: '#FFFFFF' }],
                variants: [],
                stock: 100,
                inStock: true,
                status: 'published',
                sku: `SKU-${newId}`,
                barcode: `893${Math.floor(100000000 + Math.random() * 900000000)}`,
                highlights: ['Chất liệu thoáng mát cao cấp', 'Form dáng chuẩn thời trang', 'Độ bền màu cao sau nhiều lần giặt'],
                specs: {
                    'Chất liệu': '100% Cotton cao cấp',
                    'Kiểu dáng': 'Regular Fit',
                    'Xuất xứ': 'Việt Nam'
                },
                seo: {
                    title: '',
                    description: '',
                    slug: newId.toLowerCase()
                },
                gender: 'Nam',
                styleCategory: 'Tối giản (Minimalism)',
                shipping: { weight: 300, length: 25, width: 18, height: 4 }
            });
        }
        setErrors({});
    }, [isOpen, product]);

    // Keyboard shortcut Ctrl + S
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                handleSubmit(e as any, false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, formData]);

    // Auto-update variants matrix when colors or sizes change
    useEffect(() => {
        if (!formData.colors || !formData.sizes) return;
        const colors = formData.colors || [];
        const sizes = formData.sizes || [];
        const currentVariants = formData.variants || [];
        const newVariants: any[] = [];

        colors.forEach((col: any) => {
            sizes.forEach((sz: string) => {
                if (col.name && sz) {
                    const existing = currentVariants.find((v: any) => v.color === col.name && v.size === sz);
                    newVariants.push({
                        color: col.name,
                        size: sz,
                        stock: existing ? existing.stock : 25,
                        price: existing?.price !== undefined ? existing.price : (formData.price || 0),
                        originalPrice: existing?.originalPrice !== undefined ? existing.originalPrice : (formData.originalPrice || 0),
                        costPrice: existing?.costPrice !== undefined ? existing.costPrice : (formData.costPrice || 0),
                        sku: existing?.sku || `${formData.sku || 'SKU'}-${col.name.substring(0, 3).toUpperCase()}-${sz}`,
                        barcode: existing?.barcode || `${formData.barcode || '893'}`
                    });
                }
            });
        });

        const sig = (vars: any[]) => vars.map(v => `${v.color}-${v.size}-${v.stock}-${v.price}`).join('|');
        if (sig(newVariants) !== sig(currentVariants)) {
            setFormData((prev: any) => ({ ...prev, variants: newVariants }));
        }
    }, [formData.colors, formData.sizes, formData.price, formData.originalPrice, formData.costPrice]);

    // Update total stock based on variants
    useEffect(() => {
        if (formData.variants && formData.variants.length > 0) {
            const sum = formData.variants.reduce((acc: number, v: any) => acc + (Number(v.stock) || 0), 0);
            if (sum !== formData.stock) {
                setFormData((prev: any) => ({ ...prev, stock: sum }));
            }
        }
    }, [formData.variants]);

    // Auto generate SEO title & slug when name changes (if empty)
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const currentSeo = formData.seo || {};
        setFormData({
            ...formData,
            name: val,
            seo: {
                ...currentSeo,
                title: currentSeo.title ? currentSeo.title : `${val} | HAVEN Store`,
                slug: currentSeo.slug ? currentSeo.slug : val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            }
        });
    };

    const validateForm = () => {
        const errs: Record<string, string> = {};
        if (!formData.name || !formData.name.trim()) errs.name = 'Vui lòng nhập tên sản phẩm';
        if (!formData.category) errs.category = 'Vui lòng chọn danh mục sản phẩm';
        if (formData.price === undefined || formData.price === null || Number(formData.price) < 0) {
            errs.price = 'Giá bán phải lớn hơn hoặc bằng 0';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
        if (e) e.preventDefault();

        if (!isDraft && !validateForm()) {
            showToast('warning', 'Chưa đủ thông tin bắt buộc', 'Vui lòng kiểm tra lại tên và giá bán sản phẩm');
            return;
        }

        setIsSubmitting(true);
        try {
            const finalImages = (formData.images && formData.images.length > 0)
                ? formData.images
                : (formData.image ? [formData.image] : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800']);

            const finalPayload = {
                ...formData,
                price: Number(formData.price) || 0,
                originalPrice: Number(formData.originalPrice) || Number(formData.price) || 0,
                costPrice: Number(formData.costPrice) || 0,
                stock: Number(formData.stock) || 0,
                images: finalImages,
                image: finalImages[0],
                status: isDraft ? 'draft' : (formData.status || 'published'),
                inStock: isDraft ? false : (formData.inStock !== false && Number(formData.stock) > 0)
            };

            await onSave(finalPayload, isDraft);
            showToast('success', isDraft ? 'Đã lưu bản nháp' : 'Lưu sản phẩm thành công', `Sản phẩm: ${formData.name}`);
            onClose();
        } catch (err: any) {
            showToast('error', 'Không thể lưu sản phẩm', err?.message || 'Vui lòng thử lại');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Media Handlers
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const uploadData = new FormData();
            uploadData.append('image', file);

            const res = await fetch('/api/upload', { method: 'POST', body: uploadData });
            const data = await res.json();
            if (data.success && data.url) {
                setFormData((prev: any) => ({ ...prev, images: [...(prev.images || []), data.url] }));
                showToast('success', 'Tải ảnh lên thành công');
            } else {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const localUrl = event.target?.result as string;
                    if (localUrl) {
                        setFormData((prev: any) => ({ ...prev, images: [...(prev.images || []), localUrl] }));
                        showToast('success', 'Đã thêm ảnh xem trước');
                    }
                };
                reader.readAsDataURL(file);
            }
        } catch (err) {
            showToast('error', 'Lỗi khi tải ảnh');
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleAddImageUrl = () => {
        if (!newImageUrl.trim()) return;
        setFormData((prev: any) => ({ ...prev, images: [...(prev.images || []), newImageUrl.trim()] }));
        setNewImageUrl('');
        showToast('success', 'Đã thêm liên kết ảnh');
    };

    const handleRemoveImage = (index: number) => {
        setFormData((prev: any) => ({
            ...prev,
            images: prev.images.filter((_: any, i: number) => i !== index)
        }));
    };

    const handleSetFeaturedImage = (index: number) => {
        if (index === 0) return;
        setFormData((prev: any) => {
            const imgs = [...prev.images];
            const [selected] = imgs.splice(index, 1);
            imgs.unshift(selected);
            return { ...prev, images: imgs };
        });
    };

    // Size Handlers
    const handleToggleSize = (size: string) => {
        const currentSizes = formData.sizes || [];
        if (currentSizes.includes(size)) {
            setFormData({ ...formData, sizes: currentSizes.filter((s: string) => s !== size) });
        } else {
            setFormData({ ...formData, sizes: [...currentSizes, size] });
        }
    };

    const handleAddCustomSize = () => {
        if (!customSizeInput.trim()) return;
        const s = customSizeInput.trim().toUpperCase();
        if (!formData.sizes?.includes(s)) {
            setFormData({ ...formData, sizes: [...(formData.sizes || []), s] });
        }
        setCustomSizeInput('');
    };

    // Color Handlers
    const handleTogglePresetColor = (preset: { name: string; hex: string }) => {
        const current = formData.colors || [];
        const exists = current.some((c: any) => c.name === preset.name);
        if (exists) {
            setFormData({ ...formData, colors: current.filter((c: any) => c.name !== preset.name) });
        } else {
            setFormData({ ...formData, colors: [...current, preset] });
        }
    };

    const handleAddCustomColor = () => {
        if (!customColorName.trim()) return;
        const newCol = { name: customColorName.trim(), hex: customColorHex };
        setFormData({ ...formData, colors: [...(formData.colors || []), newCol] });
        setCustomColorName('');
    };

    const handleRemoveColor = (index: number) => {
        setFormData({
            ...formData,
            colors: formData.colors.filter((_: any, i: number) => i !== index)
        });
    };

    // Bulk update variants
    const handleApplyBulkPrice = () => {
        if (bulkPrice === '' || bulkPrice < 0) return;
        setFormData({
            ...formData,
            variants: formData.variants.map((v: any) => ({ ...v, price: Number(bulkPrice) }))
        });
        setBulkPrice('');
        showToast('success', 'Đã cập nhật giá cho toàn bộ biến thể');
    };

    const handleApplyBulkStock = () => {
        if (bulkStock === '' || bulkStock < 0) return;
        setFormData({
            ...formData,
            variants: formData.variants.map((v: any) => ({ ...v, stock: Number(bulkStock) }))
        });
        setBulkStock('');
        showToast('success', 'Đã cập nhật tồn kho cho toàn bộ biến thể');
    };

    // Specifications Key-Value
    const handleAddSpec = () => {
        if (!specKey.trim() || !specValue.trim()) return;
        setFormData({
            ...formData,
            specs: {
                ...(formData.specs || {}),
                [specKey.trim()]: specValue.trim()
            }
        });
        setSpecKey('');
        setSpecValue('');
    };

    const handleRemoveSpec = (key: string) => {
        const next = { ...(formData.specs || {}) };
        delete next[key];
        setFormData({ ...formData, specs: next });
    };

    // Calculated Profit Margin
    const price = Number(formData.price) || 0;
    const costPrice = Number(formData.costPrice) || 0;
    const profit = price - costPrice;
    const profitMargin = price > 0 ? ((profit / price) * 100).toFixed(1) : '0';

    if (!isOpen) return null;

    return (
        <div 
            className="w-full min-h-screen bg-[#f8fafc] text-slate-900 pb-16"
            style={{ fontFamily: "var(--font-be-vietnam), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
        >
            {/* ════════════ HEADER BAR CỐ ĐỊNH PHÍA TRÊN ════════════ */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs px-4 sm:px-8 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3.5 min-w-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors font-bold text-sm cursor-pointer"
                        title="Quay lại danh sách"
                    >
                        <ArrowLeft size={18} />
                        <span className="hidden sm:inline">Quay lại danh sách</span>
                    </button>

                    <div className="h-6 w-px bg-slate-200 hidden sm:block" />

                    <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-base sm:text-lg font-black text-slate-950 truncate tracking-tight">
                                {product ? `Chỉnh sửa: ${formData.name || 'Sản phẩm'}` : 'Thêm sản phẩm mới'}
                            </h1>
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                                formData.status === 'published' 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : formData.status === 'draft'
                                    ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                                {formData.status === 'published' ? 'Đang kinh doanh' : formData.status === 'draft' ? 'Bản nháp' : 'Ngừng bán'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                            Mã sản phẩm: <span className="font-mono text-slate-900 font-bold">{formData.id}</span> · SKU: <span className="font-mono text-slate-900 font-bold">{formData.sku || 'Chưa đặt'}</span>
                        </p>
                    </div>
                </div>

                {/* Top Action Buttons */}
                <div className="flex items-center gap-2.5 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="hidden sm:inline-flex px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={(e) => handleSubmit(e, true)}
                        disabled={isSubmitting}
                        className="px-4 py-2 border border-slate-300 text-slate-800 text-xs sm:text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        Lưu nháp
                    </button>
                    <button
                        type="button"
                        onClick={(e) => handleSubmit(e, false)}
                        disabled={isSubmitting}
                        className="px-5 sm:px-6 py-2 bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Đang lưu...</span>
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                <span>Lưu sản phẩm (Ctrl+S)</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* ════════════ MAIN CONTAINER RỘNG TOÀN DIỆN ════════════ */}
            <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <form onSubmit={(e) => handleSubmit(e, false)} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* ── CỘT TRÁI (8 / 12 CỘT): THÔNG TIN CHÍNH ── */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* 1. THÔNG TIN CƠ BẢN */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-7">
                            <h2 className="text-sm sm:text-base font-bold text-slate-950 uppercase tracking-wider pb-3.5 mb-5 border-b border-slate-100 flex items-center gap-2">
                                <FileText size={18} className="text-slate-800" />
                                1. Thông tin sản phẩm cơ bản
                            </h2>

                            <div className="space-y-4">
                                {/* Tên sản phẩm */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
                                        Tên sản phẩm <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name || ''}
                                        onChange={handleNameChange}
                                        placeholder="Ví dụ: Áo Sơ Mi Nữ Crop Tay Dài Thêu Trái Tim Form Loose"
                                        required
                                        className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm sm:text-base font-bold text-slate-950 focus:border-slate-950 focus:ring-1 focus:ring-slate-950 outline-none transition-all placeholder:font-normal placeholder:text-slate-400 ${
                                            errors.name ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                                        }`}
                                    />
                                    {errors.name && <p className="text-xs text-rose-600 font-semibold mt-1">{errors.name}</p>}
                                </div>

                                {/* Mô tả tóm tắt */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
                                        Mô tả ngắn (Hiển thị đầu trang & thẻ sản phẩm)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={formData.shortDescription || ''}
                                        onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                                        placeholder="Tóm tắt điểm đặc biệt nhất của sản phẩm trong 1 - 2 câu..."
                                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:border-slate-950 outline-none resize-none placeholder:text-slate-400"
                                    />
                                </div>

                                {/* Mô tả chi tiết */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
                                        Mô tả chi tiết sản phẩm
                                    </label>
                                    <textarea
                                        rows={5}
                                        value={formData.description || ''}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Mô tả chất liệu, cảm giác mặc, tính năng, gợi ý phối đồ..."
                                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:border-slate-950 outline-none leading-relaxed placeholder:text-slate-400"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. HÌNH ẢNH SẢN PHẨM */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-7">
                            <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-slate-100">
                                <h2 className="text-sm sm:text-base font-bold text-slate-950 uppercase tracking-wider flex items-center gap-2">
                                    <ImageIcon size={18} className="text-slate-800" />
                                    2. Hình ảnh sản phẩm ({formData.images?.length || 0})
                                </h2>
                                <span className="text-xs text-slate-500 font-medium">Ảnh đầu tiên là ảnh đại diện</span>
                            </div>

                            {/* Khu vực Upload & Nhập URL */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    {/* Upload Button */}
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-slate-300 hover:border-slate-900 rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-50/60 hover:bg-slate-50 flex flex-col items-center justify-center gap-2"
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                        {uploadingImage ? (
                                            <>
                                                <Loader2 size={24} className="animate-spin text-slate-800" />
                                                <span className="text-xs font-bold text-slate-700">Đang tải ảnh lên...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={22} className="text-slate-700" />
                                                <span className="text-xs sm:text-sm font-bold text-slate-900">Tải ảnh từ máy tính</span>
                                                <span className="text-[11px] text-slate-500">JPG, PNG, WEBP</span>
                                            </>
                                        )}
                                    </div>

                                    {/* Add via URL */}
                                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 flex flex-col justify-center gap-2">
                                        <label className="text-xs font-bold text-slate-800">Hoặc dán liên kết URL hình ảnh:</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="url"
                                                value={newImageUrl}
                                                onChange={(e) => setNewImageUrl(e.target.value)}
                                                placeholder="https://..."
                                                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddImageUrl}
                                                className="px-3 py-2 bg-[#0f172a] text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                                            >
                                                Thêm
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Gallery Grid */}
                                {formData.images && formData.images.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
                                        {formData.images.map((imgUrl: string, idx: number) => (
                                            <div 
                                                key={idx} 
                                                className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square shadow-2xs"
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={imgUrl}
                                                    alt={`Ảnh sản phẩm ${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                />

                                                {/* Featured Badge */}
                                                {idx === 0 && (
                                                    <span className="absolute top-2 left-2 text-[10px] font-extrabold bg-[#0f172a] text-white px-2 py-0.5 rounded-md shadow-sm">
                                                        Ảnh bìa
                                                    </span>
                                                )}

                                                {/* Overlay Actions */}
                                                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    {idx !== 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSetFeaturedImage(idx)}
                                                            className="p-1.5 bg-white text-slate-900 text-[11px] font-bold rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                                            title="Đặt làm ảnh bìa"
                                                        >
                                                            Đặt bìa
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveImage(idx)}
                                                        className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors cursor-pointer"
                                                        title="Xóa ảnh này"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. GIÁ BÁN & BIÊN LỢI NHUẬN */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-7">
                            <h2 className="text-sm sm:text-base font-bold text-slate-950 uppercase tracking-wider pb-3.5 mb-5 border-b border-slate-100 flex items-center gap-2">
                                <DollarSign size={18} className="text-slate-800" />
                                3. Giá bán & Chi phí
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Giá bán */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
                                        Giá bán lẻ (VNĐ) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={formData.price || 0}
                                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                        required
                                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm sm:text-base font-bold text-slate-950 focus:border-slate-950 outline-none"
                                    />
                                </div>

                                {/* Giá so sánh / Giá gốc */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
                                        Giá gốc / So sánh (VNĐ)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={formData.originalPrice || 0}
                                        onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm sm:text-base font-medium text-slate-900 focus:border-slate-950 outline-none"
                                    />
                                </div>

                                {/* Giá vốn */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
                                        Giá vốn nhập hàng (VNĐ)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={formData.costPrice || 0}
                                        onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm sm:text-base font-medium text-slate-900 focus:border-slate-950 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Profit Margin indicator */}
                            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs sm:text-sm">
                                <div className="text-slate-600 font-medium">
                                    Lợi nhuận ước tính: <span className="font-bold text-slate-900">{profit.toLocaleString('vi-VN')} đ</span> / sản phẩm
                                </div>
                                <div className="text-slate-600 font-medium">
                                    Biên lợi nhuận: <span className={`font-bold ${Number(profitMargin) > 30 ? 'text-emerald-700' : 'text-slate-900'}`}>{profitMargin}%</span>
                                </div>
                            </div>
                        </div>

                        {/* 4. BIẾN THỂ: KÍCH CỠ & MÀU SẮC */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-7">
                            <h2 className="text-sm sm:text-base font-bold text-slate-950 uppercase tracking-wider pb-3.5 mb-5 border-b border-slate-100 flex items-center gap-2">
                                <Boxes size={18} className="text-slate-800" />
                                4. Phiên bản phân loại (Size & Màu sắc)
                            </h2>

                            {/* Kích thước */}
                            <div className="mb-5">
                                <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-2">
                                    Kích thước (Size):
                                </label>
                                <div className="flex flex-wrap gap-2 mb-2.5">
                                    {PRESET_SIZES.map(sz => {
                                        const isSelected = formData.sizes?.includes(sz);
                                        return (
                                            <button
                                                key={sz}
                                                type="button"
                                                onClick={() => handleToggleSize(sz)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                                    isSelected
                                                        ? 'bg-[#0f172a] text-white border-slate-950 shadow-xs'
                                                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                                                }`}
                                            >
                                                {sz}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="flex gap-2 max-w-xs">
                                    <input
                                        type="text"
                                        value={customSizeInput}
                                        onChange={(e) => setCustomSizeInput(e.target.value)}
                                        placeholder="Thêm size khác..."
                                        className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddCustomSize}
                                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer"
                                    >
                                        + Thêm
                                    </button>
                                </div>
                            </div>

                            {/* Màu sắc */}
                            <div className="mb-5">
                                <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-2">
                                    Màu sắc:
                                </label>
                                <div className="flex flex-wrap gap-2 mb-2.5">
                                    {PRESET_COLORS.map(col => {
                                        const isSelected = formData.colors?.some((c: any) => c.name === col.name);
                                        return (
                                            <button
                                                key={col.name}
                                                type="button"
                                                onClick={() => handleTogglePresetColor(col)}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-slate-900 text-white border-slate-950 shadow-xs'
                                                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                                                }`}
                                            >
                                                <span className="w-3.5 h-3.5 rounded-full border border-slate-300" style={{ backgroundColor: col.hex }} />
                                                <span>{col.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="flex items-center gap-2 max-w-sm">
                                    <input
                                        type="color"
                                        value={customColorHex}
                                        onChange={(e) => setCustomColorHex(e.target.value)}
                                        className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0"
                                    />
                                    <input
                                        type="text"
                                        value={customColorName}
                                        onChange={(e) => setCustomColorName(e.target.value)}
                                        placeholder="Tên màu mới (VD: Xanh Mint)..."
                                        className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddCustomColor}
                                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer"
                                    >
                                        + Thêm
                                    </button>
                                </div>
                            </div>

                            {/* Bảng ma trận biến thể */}
                            {formData.variants && formData.variants.length > 0 && (
                                <div className="pt-4 border-t border-slate-100">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                                        <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                                            Danh sách biến thể ({formData.variants.length} phân loại)
                                        </h3>

                                        {/* Bulk edit buttons */}
                                        <div className="flex items-center gap-2 text-xs">
                                            <input
                                                type="number"
                                                placeholder="Giá chung..."
                                                value={bulkPrice}
                                                onChange={(e) => setBulkPrice(e.target.value ? Number(e.target.value) : '')}
                                                className="w-24 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleApplyBulkPrice}
                                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg border border-slate-300 cursor-pointer"
                                            >
                                                Áp giá
                                            </button>

                                            <input
                                                type="number"
                                                placeholder="Kho chung..."
                                                value={bulkStock}
                                                onChange={(e) => setBulkStock(e.target.value ? Number(e.target.value) : '')}
                                                className="w-24 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleApplyBulkStock}
                                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg border border-slate-300 cursor-pointer"
                                            >
                                                Áp kho
                                            </button>
                                        </div>
                                    </div>

                                    <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                                                <tr>
                                                    <th className="px-3.5 py-2.5">Phân loại</th>
                                                    <th className="px-3.5 py-2.5">Mã SKU</th>
                                                    <th className="px-3.5 py-2.5">Giá bán (VNĐ)</th>
                                                    <th className="px-3.5 py-2.5">Tồn kho</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {formData.variants.map((v: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-slate-50/60">
                                                        <td className="px-3.5 py-2.5 font-bold text-slate-900 whitespace-nowrap">
                                                            {v.color} · {v.size}
                                                        </td>
                                                        <td className="px-3.5 py-2.5">
                                                            <input
                                                                type="text"
                                                                value={v.sku}
                                                                onChange={(e) => {
                                                                    const copy = [...formData.variants];
                                                                    copy[idx].sku = e.target.value;
                                                                    setFormData({ ...formData, variants: copy });
                                                                }}
                                                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium"
                                                            />
                                                        </td>
                                                        <td className="px-3.5 py-2.5">
                                                            <input
                                                                type="number"
                                                                value={v.price}
                                                                onChange={(e) => {
                                                                    const copy = [...formData.variants];
                                                                    copy[idx].price = Number(e.target.value);
                                                                    setFormData({ ...formData, variants: copy });
                                                                }}
                                                                className="w-28 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                                                            />
                                                        </td>
                                                        <td className="px-3.5 py-2.5">
                                                            <input
                                                                type="number"
                                                                value={v.stock}
                                                                onChange={(e) => {
                                                                    const copy = [...formData.variants];
                                                                    copy[idx].stock = Number(e.target.value);
                                                                    setFormData({ ...formData, variants: copy });
                                                                }}
                                                                className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 5. TỐI ƯU SEO & GOOGLE PREVIEW */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-7">
                            <h2 className="text-sm sm:text-base font-bold text-slate-950 uppercase tracking-wider pb-3.5 mb-5 border-b border-slate-100 flex items-center gap-2">
                                <Globe size={18} className="text-slate-800" />
                                5. Tối ưu SEO (Google Search Engine)
                            </h2>

                            {/* Google Search Snippet Preview */}
                            <div className="mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <p className="text-xs text-slate-500 font-bold mb-2 uppercase">Xem trước kết quả tìm kiếm Google:</p>
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-blue-800 hover:underline cursor-pointer truncate">
                                        {formData.seo?.title || `${formData.name || 'Tên sản phẩm'} | HAVEN Store`}
                                    </p>
                                    <p className="text-xs text-emerald-700 font-mono truncate">
                                        https://havenstore.io.vn/product/{formData.seo?.slug || formData.id?.toLowerCase()}
                                    </p>
                                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                        {formData.seo?.description || formData.shortDescription || formData.description || 'Mua sắm các sản phẩm thời trang chính hãng, cao cấp tại HAVEN Store.'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3.5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-1">Tiêu đề trang SEO</label>
                                    <input
                                        type="text"
                                        value={formData.seo?.title || ''}
                                        onChange={(e) => setFormData({ ...formData, seo: { ...(formData.seo || {}), title: e.target.value } })}
                                        placeholder="Tiêu đề hiển thị trên thanh tiêu đề trình duyệt và Google..."
                                        className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-1">Mô tả Meta (Meta Description)</label>
                                    <textarea
                                        rows={2}
                                        value={formData.seo?.description || ''}
                                        onChange={(e) => setFormData({ ...formData, seo: { ...(formData.seo || {}), description: e.target.value } })}
                                        placeholder="Mô tả tóm tắt sản phẩm để Google hiển thị khi người dùng tìm kiếm..."
                                        className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 outline-none resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-1">Đường dẫn URL Slug</label>
                                    <input
                                        type="text"
                                        value={formData.seo?.slug || ''}
                                        onChange={(e) => setFormData({ ...formData, seo: { ...(formData.seo || {}), slug: e.target.value } })}
                                        placeholder="duong-dan-url-san-pham"
                                        className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-medium text-slate-900 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* ── CỘT PHẢI (4 / 12 CỘT): PHÂN LOẠI & THUỘC TÍNH ── */}
                    <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
                        
                        {/* 1. TRẠNG THÁI & KÊNH BÁN HÀNG */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-950 uppercase tracking-wider pb-3 mb-4 border-b border-slate-100 flex items-center gap-2">
                                <ShieldCheck size={16} className="text-slate-800" />
                                Trạng thái & Kênh bán
                            </h3>

                            <div className="space-y-3.5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-1.5">Trạng thái sản phẩm</label>
                                    <select
                                        value={formData.status || 'published'}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:border-slate-950 outline-none"
                                    >
                                        <option value="published">Đang kinh doanh (Active)</option>
                                        <option value="draft">Bản nháp (Draft)</option>
                                        <option value="archived">Ngừng bán (Archived)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-1.5">Tổng số lượng tồn kho</label>
                                    <input
                                        type="number"
                                        value={formData.stock || 0}
                                        onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none"
                                    />
                                    <p className="text-[11px] text-slate-500 mt-1">Tự động đồng bộ từ các biến thể nếu có.</p>
                                </div>
                            </div>
                        </div>

                        {/* 2. PHÂN LOẠI DANH MỤC */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-950 uppercase tracking-wider pb-3 mb-4 border-b border-slate-100 flex items-center gap-2">
                                <Tag size={16} className="text-slate-800" />
                                Phân loại & Tổ chức
                            </h3>

                            <div className="space-y-3.5">
                                {/* Danh mục chính */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                                        Danh mục chính <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={formData.category || 'Thời Trang Nam'}
                                        onChange={(e) => {
                                            const catName = e.target.value;
                                            const catObj = activeCategories.find(c => c.name === catName);
                                            const firstSub = catObj?.subCategories?.[0]?.id || '';
                                            setFormData({ ...formData, category: catName, subCategory: firstSub });
                                        }}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none"
                                    >
                                        {activeCategories.map(c => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Danh mục con */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                                        Danh mục con (Chi tiết) <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={formData.subCategory || ''}
                                        onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 outline-none"
                                    >
                                        {activeCategories.find(c => c.name === formData.category)?.subCategories?.map(sub => (
                                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                                        )) || (
                                            <option value="">Không có danh mục con</option>
                                        )}
                                    </select>
                                </div>

                                {/* Thương hiệu */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-1.5">Thương hiệu</label>
                                    <select
                                        value={formData.brand || 'HAVEN'}
                                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 outline-none"
                                    >
                                        {brands.map(b => (
                                            <option key={b} value={b}>{b}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Đối tượng (Gender) */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-1.5">Đối tượng (Gender)</label>
                                    <select
                                        value={formData.gender || 'Nam'}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 outline-none"
                                    >
                                        <option value="Nam">Nam giới</option>
                                        <option value="Nữ">Nữ giới</option>
                                        <option value="Unisex">Unisex (Cả nam & nữ)</option>
                                    </select>
                                </div>

                                {/* Phong cách */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-1.5">Phong cách</label>
                                    <select
                                        value={formData.styleCategory || 'Tối giản (Minimalism)'}
                                        onChange={(e) => setFormData({ ...formData, styleCategory: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 outline-none"
                                    >
                                        <option value="Tối giản (Minimalism)">Tối giản (Minimalism)</option>
                                        <option value="Công sở (Smart Casual)">Công sở (Smart Casual)</option>
                                        <option value="Đường phố (Streetwear)">Đường phố (Streetwear)</option>
                                        <option value="Thể thao (Sportswear)">Thể thao (Sportswear)</option>
                                        <option value="Cổ điển (Classic)">Cổ điển (Classic)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 3. THÔNG SỐ KỸ THUẬT */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-950 uppercase tracking-wider pb-3 mb-4 border-b border-slate-100 flex items-center gap-2">
                                <Sliders size={16} className="text-slate-800" />
                                Thông số kỹ thuật
                            </h3>

                            <div className="space-y-3">
                                {Object.entries(formData.specs || {}).map(([k, v]: [string, any]) => (
                                    <div key={k} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                                        <div>
                                            <span className="font-bold text-slate-900 block">{k}:</span>
                                            <span className="text-slate-600 font-medium">{String(v)}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSpec(k)}
                                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}

                                {/* Add Custom Spec */}
                                <div className="pt-1.5 flex flex-col gap-2">
                                    <input
                                        type="text"
                                        placeholder="Tên thuộc tính (VD: Chất liệu)..."
                                        value={specKey}
                                        onChange={(e) => setSpecKey(e.target.value)}
                                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium outline-none"
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Giá trị (VD: 100% Cotton)..."
                                            value={specValue}
                                            onChange={(e) => setSpecValue(e.target.value)}
                                            className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddSpec}
                                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 cursor-pointer"
                                        >
                                            Thêm
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </form>
            </div>
        </div>
    );
}
