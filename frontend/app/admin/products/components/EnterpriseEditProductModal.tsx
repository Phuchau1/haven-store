'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package, X, Plus, Trash2, Image as ImageIcon, Sparkles, DollarSign, Boxes,
    Search, Globe, Truck, Tag, Sliders, History, ShieldCheck, Eye, Save,
    FileText, CheckCircle2, AlertTriangle, Check, Loader2,
    ArrowUp, ArrowDown, Layers, Store, Upload, Info
} from 'lucide-react';
import { Product } from '@/types';

interface EnterpriseEditProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    onSave: (productData: any, isDraft?: boolean) => Promise<void>;
    categories: Array<{ id: string; name: string; subCategories?: Array<{ id: string; name: string }> }>;
    brands?: string[];
    showToast: (type: 'success' | 'error' | 'info' | 'warning', message: string, desc?: string) => void;
}

export default function EnterpriseEditProductModal({
    isOpen,
    onClose,
    product,
    onSave,
    categories,
    brands = ['HAVEN', 'Routine', 'Uniqlo', 'Zara', 'H&M', 'Nike', 'Adidas'],
    showToast
}: EnterpriseEditProductModalProps) {
    // ── Active Tab State ──
    const [activeTab, setActiveTab] = useState<
        'overview' | 'media' | 'variants' | 'pricing' | 'inventory' | 'seo' |
        'ai' | 'specs' | 'related' | 'shipping' | 'multilingual' | 'channels' |
        'audit' | 'roles'
    >('overview');

    // ── Form State ──
    const [formData, setFormData] = useState<any>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
    const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [newImageUrl, setNewImageUrl] = useState('');
    const [aiGenerating, setAiGenerating] = useState<string | null>(null);

    // Dynamic specification key-value inputs
    const [specKey, setSpecKey] = useState('');
    const [specValue, setSpecValue] = useState('');

    // Bulk variant modifier values
    const [bulkStock, setBulkStock] = useState<number | ''>('');
    const [bulkPrice, setBulkPrice] = useState<number | ''>('');

    // Audit logs simulation
    const [auditLogs, setAuditLogs] = useState<any[]>([]);

    // Form container ref for error scrolling
    const formContainerRef = useRef<HTMLDivElement>(null);

    // Initialize Form Data when modal opens or product changes
    useEffect(() => {
        if (!isOpen) return;

        if (product) {
            setFormData({
                ...product,
                sku: product.sku || `SKU-${product.id || 'HVN'}`,
                barcode: product.barcode || `893850${Math.floor(100000 + Math.random() * 900000)}`,
                productCode: product.productCode || `PROD-${product.id}`,
                brand: product.brand || 'HAVEN',
                costPrice: product.costPrice || Math.round((product.price || 0) * 0.5),
                wholesalePrice: product.wholesalePrice || Math.round((product.price || 0) * 0.8),
                shortDescription: product.shortDescription || product.description || '',
                richContent: product.richContent || product.content || '',
                specifications: product.specifications || {
                    'Chất liệu': product.material || '100% Cotton Premium',
                    'Độ co giãn': 'Co giãn 4 chiều',
                    'Kiểu cổ': 'Cổ tròn',
                    'Form dáng': product.fitType || 'Regular Fit',
                    'Độ dày': 'Vừa phải'
                },
                tags: product.tags || [product.categoryLabel || 'Thời trang', product.gender || 'Unisex'],
                seo: product.seo || {
                    title: `${product.name} | HAVEN Store`,
                    description: product.shortDescription || product.description || product.name,
                    keywords: `${product.name}, áo quần cao cấp, thời trang haven`,
                    slug: product.id ? `${product.id.toLowerCase()}` : ''
                },
                status: product.status || (product.inStock !== false ? 'published' : 'draft'),
                gender: product.gender || 'Unisex',
                styleCategory: product.styleCategory || 'Casual',
                season: product.season || 'All',
                inventoryAlloc: { main: 100, branch: 30, online: 80, offline: 50, reserved: 5, incoming: 20, threshold: 10 },
                shipping: { weight: 350, length: 30, width: 20, height: 5, packaging: 'Túi Niêm Phong HAVEN', codAllowed: true, insurance: true },
                multilingual: { en: {}, jp: {}, kr: {} },
                channels: { website: true, mobileApp: true, pos: true, facebook: true, tiktok: true, shopee: false, lazada: false }
            });

            setAuditLogs([
                {
                    id: 1,
                    user: 'Quản trị viên (Admin)',
                    action: 'Mở bản ghi chỉnh sửa',
                    field: 'Tất cả thông tin',
                    time: new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'),
                    ip: '118.69.182.42',
                    browser: 'Chrome 122 / Windows 11'
                }
            ]);
        } else {
            // New product default
            const newId = `LF-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
            setFormData({
                id: newId,
                name: '',
                sku: `SKU-${newId}`,
                barcode: `893850${Math.floor(100000 + Math.random() * 900000)}`,
                productCode: `PROD-${newId}`,
                brand: 'HAVEN',
                price: 299000,
                originalPrice: 399000,
                costPrice: 150000,
                wholesalePrice: 220000,
                category: categories[0]?.id || 'cat-clothing',
                categoryLabel: categories[0]?.name || 'Thời Trang Nam',
                subCategory: '',
                subCategoryLabel: '',
                images: [
                    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop'
                ],
                colors: [
                    { name: 'Đen', hex: '#000000', image: '' },
                    { name: 'Trắng', hex: '#FFFFFF', image: '' }
                ],
                sizes: ['S', 'M', 'L', 'XL'],
                variants: [
                    { color: 'Đen', size: 'S', stock: 50, price: 299000, originalPrice: 399000, costPrice: 150000, sku: `SKU-${newId}-BLK-S` },
                    { color: 'Đen', size: 'M', stock: 50, price: 299000, originalPrice: 399000, costPrice: 150000, sku: `SKU-${newId}-BLK-M` },
                    { color: 'Trắng', size: 'S', stock: 50, price: 299000, originalPrice: 399000, costPrice: 150000, sku: `SKU-${newId}-WHT-S` },
                    { color: 'Trắng', size: 'M', stock: 50, price: 299000, originalPrice: 399000, costPrice: 150000, sku: `SKU-${newId}-WHT-M` }
                ],
                inStock: true,
                status: 'published',
                shortDescription: 'Áo thun cotton cao cấp thoáng mát, thiết kế thanh lịch sang trọng chuẩn phong cách HAVEN.',
                richContent: '<h3>Đặc điểm nổi bật</h3><p>Sản phẩm chế tác từ 100% sợi dệt Cotton chải kỹ tự nhiên...</p>',
                specifications: {
                    'Chất liệu': '100% Cotton Premium',
                    'Độ co giãn': 'Co giãn 4 chiều',
                    'Kiểu cổ': 'Cổ tròn',
                    'Form dáng': 'Regular Fit'
                },
                tags: ['Áo thun', 'Thời trang', 'Cotton'],
                seo: {
                    title: 'Áo thun Cotton Cao Cấp | HAVEN Store',
                    description: 'Áo thun cotton cao cấp thoáng mát chuẩn phong cách.',
                    keywords: 'ao thun, thoi trang haven',
                    slug: newId.toLowerCase()
                },
                gender: 'Unisex',
                styleCategory: 'Casual',
                season: 'All',
                inventoryAlloc: { main: 100, branch: 30, online: 70, offline: 30, reserved: 0, incoming: 0, threshold: 10 },
                shipping: { weight: 300, length: 25, width: 18, height: 4, packaging: 'Túi Niêm Phong', codAllowed: true, insurance: true },
                multilingual: { en: {}, jp: {}, kr: {} },
                channels: { website: true, mobileApp: true, pos: true, facebook: true, tiktok: true, shopee: false, lazada: false }
            });
        }
        setErrors({});
        setActiveTab('overview');
    }, [isOpen, product, categories]);

    // Auto-Save draft timer (every 30 seconds)
    useEffect(() => {
        if (!isOpen) return;
        const timer = setInterval(() => {
            if (autoSaveStatus === 'dirty') {
                setAutoSaveStatus('saving');
                setTimeout(() => {
                    setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
                    setAutoSaveStatus('saved');
                }, 600);
            }
        }, 30000);
        return () => clearInterval(timer);
    }, [isOpen, autoSaveStatus]);

    // Keyboard Shortcuts (Ctrl+S for save)
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                handleFormSubmit(e as any, false);
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
                        stock: existing ? existing.stock : 50,
                        price: existing?.price !== undefined ? existing.price : (formData.price || 0),
                        originalPrice: existing?.originalPrice !== undefined ? existing.originalPrice : (formData.originalPrice || 0),
                        costPrice: existing?.costPrice !== undefined ? existing.costPrice : (formData.costPrice || 0),
                        sku: existing?.sku || `${formData.sku || 'SKU'}-${col.name.substring(0, 3).toUpperCase()}-${sz}`,
                        barcode: existing?.barcode || `${formData.barcode || '893'}${Math.floor(10 + Math.random() * 90)}`
                    });
                }
            });
        });

        const sig = (vars: any[]) => vars.map(v => `${v.color}-${v.size}-${v.stock}-${v.price}`).join('|');
        if (sig(newVariants) !== sig(currentVariants)) {
            setFormData((prev: any) => ({ ...prev, variants: newVariants }));
            setAutoSaveStatus('dirty');
        }
    }, [formData.colors, formData.sizes, formData.price, formData.originalPrice, formData.costPrice]);

    const validateForm = () => {
        const errs: Record<string, string> = {};
        if (!formData.name || !formData.name.trim()) errs.name = 'Vui lòng nhập tên sản phẩm';
        if (!formData.category) errs.category = 'Vui lòng chọn danh mục sản phẩm';
        if (formData.price === undefined || formData.price === null || formData.price < 0) {
            errs.price = 'Giá bán phải lớn hơn hoặc bằng 0';
        }
        if (!formData.images || formData.images.length === 0) {
            errs.images = 'Sản phẩm phải có ít nhất 1 hình ảnh';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleFormSubmit = async (e: React.FormEvent, isDraft = false) => {
        if (e) e.preventDefault();

        if (!isDraft && !validateForm()) {
            showToast('warning', 'Chưa đủ thông tin', 'Vui lòng kiểm tra các trường bắt buộc');
            return;
        }

        setIsSubmitting(true);
        try {
            const finalPayload = {
                ...formData,
                description: formData.description || formData.shortDescription || '',
                shortDescription: formData.shortDescription || formData.description || '',
                categoryLabel: formData.categoryLabel || formData.category || 'Quần Áo',
                status: isDraft ? 'draft' : (formData.status || 'published'),
                inStock: isDraft ? false : (formData.inStock !== false)
            };
            await onSave(finalPayload, isDraft);
            setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
            setAutoSaveStatus('saved');
            showToast('success', isDraft ? 'Đã lưu nháp' : 'Cập nhật thành công', `Sản phẩm ID: ${formData.id}`);
            onClose();
        } catch (err: any) {
            showToast('error', 'Không thể lưu sản phẩm', err?.message || 'Lỗi hệ thống');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        setUploadProgress(30);

        try {
            const uploadData = new FormData();
            uploadData.append('image', file);

            const res = await fetch('/api/upload', { method: 'POST', body: uploadData });
            setUploadProgress(100);

            const data = await res.json();
            if (data.success && data.url) {
                setFormData((prev: any) => ({ ...prev, images: [...(prev.images || []), data.url] }));
                setAutoSaveStatus('dirty');
                showToast('success', 'Tải ảnh lên thành công');
            } else {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const localUrl = event.target?.result as string;
                    if (localUrl) {
                        setFormData((prev: any) => ({ ...prev, images: [...(prev.images || []), localUrl] }));
                        setAutoSaveStatus('dirty');
                        showToast('success', 'Đã thêm ảnh xem trước');
                    }
                };
                reader.readAsDataURL(file);
            }
        } catch {
            showToast('error', 'Lỗi tải ảnh');
        } finally {
            setTimeout(() => setUploadingImage(false), 300);
        }
    };

    const handleAddImageUrl = () => {
        if (!newImageUrl || !newImageUrl.trim()) return;
        setFormData((prev: any) => ({ ...prev, images: [...(prev.images || []), newImageUrl.trim()] }));
        setNewImageUrl('');
        setAutoSaveStatus('dirty');
        showToast('success', 'Đã thêm URL hình ảnh');
    };

    const handleSetPrimaryImage = (index: number) => {
        const imgs = [...(formData.images || [])];
        const selected = imgs.splice(index, 1)[0];
        imgs.unshift(selected);
        setFormData((prev: any) => ({ ...prev, images: imgs }));
        setAutoSaveStatus('dirty');
        showToast('info', 'Đã đặt làm ảnh đại diện chính');
    };

    const handleRemoveImage = (index: number) => {
        const imgs = [...(formData.images || [])];
        imgs.splice(index, 1);
        setFormData((prev: any) => ({ ...prev, images: imgs }));
        setAutoSaveStatus('dirty');
    };

    const handleMoveImage = (index: number, direction: 'up' | 'down') => {
        const imgs = [...(formData.images || [])];
        const targetIdx = direction === 'up' ? index - 1 : index + 1;
        if (targetIdx < 0 || targetIdx >= imgs.length) return;
        const temp = imgs[index];
        imgs[index] = imgs[targetIdx];
        imgs[targetIdx] = temp;
        setFormData((prev: any) => ({ ...prev, images: imgs }));
        setAutoSaveStatus('dirty');
    };

    // ── Color Management ──
    const handleAddColor = () => {
        setFormData((prev: any) => ({
            ...prev,
            colors: [...(prev.colors || []), { name: 'Màu mới', hex: '#000000', image: '' }]
        }));
        setAutoSaveStatus('dirty');
    };

    const handleRemoveColor = (index: number) => {
        const colors = [...(formData.colors || [])];
        colors.splice(index, 1);
        setFormData((prev: any) => ({ ...prev, colors }));
        setAutoSaveStatus('dirty');
    };

    const handleColorChange = (index: number, field: 'name' | 'hex' | 'image', value: string) => {
        const colors = [...(formData.colors || [])];
        const oldColorName = colors[index]?.name;
        colors[index] = { ...colors[index], [field]: value };

        let updatedImages = [...(formData.images || [])];
        let updatedVariants = [...(formData.variants || [])];

        if (field === 'image' && value && !updatedImages.includes(value)) {
            updatedImages.push(value);
        }

        const colorName = colors[index].name;
        if (field === 'image' || field === 'name') {
            updatedVariants = updatedVariants.map((v: any) => {
                if (v.color === oldColorName || v.color === colorName) {
                    return {
                        ...v,
                        color: colorName,
                        image: field === 'image' ? value : (v.image || value)
                    };
                }
                return v;
            });
        }

        setFormData((prev: any) => ({
            ...prev,
            colors,
            images: updatedImages,
            variants: updatedVariants
        }));
        setAutoSaveStatus('dirty');
    };

    // ── Size Management ──
    const handleAddSize = () => {
        setFormData((prev: any) => ({
            ...prev,
            sizes: [...(prev.sizes || []), '']
        }));
        setAutoSaveStatus('dirty');
    };

    const handleRemoveSize = (index: number) => {
        const sizes = [...(formData.sizes || [])];
        sizes.splice(index, 1);
        setFormData((prev: any) => ({ ...prev, sizes }));
        setAutoSaveStatus('dirty');
    };

    const handleSizeChange = (index: number, value: string) => {
        const sizes = [...(formData.sizes || [])];
        sizes[index] = value;
        setFormData((prev: any) => ({ ...prev, sizes }));
        setAutoSaveStatus('dirty');
    };

    const handleQuickAddSizes = (presetSizes: string[]) => {
        setFormData((prev: any) => ({
            ...prev,
            sizes: Array.from(new Set([...(prev.sizes || []), ...presetSizes]))
        }));
        setAutoSaveStatus('dirty');
        showToast('success', `Đã thêm nhanh kích thước: ${presetSizes.join(', ')}`);
    };

    const handleAddSpec = () => {
        if (!specKey.trim() || !specValue.trim()) return;
        setFormData((prev: any) => ({
            ...prev,
            specifications: { ...(prev.specifications || {}), [specKey.trim()]: specValue.trim() }
        }));
        setSpecKey('');
        setSpecValue('');
        setAutoSaveStatus('dirty');
    };

    const handleRemoveSpec = (keyToRemove: string) => {
        const specs = { ...(formData.specifications || {}) };
        delete specs[keyToRemove];
        setFormData((prev: any) => ({ ...prev, specifications: specs }));
        setAutoSaveStatus('dirty');
    };

    const handleRunAIAction = (actionType: string) => {
        setAiGenerating(actionType);
        setTimeout(() => {
            if (actionType === 'description') {
                setFormData((prev: any) => ({
                    ...prev,
                    shortDescription: `Sản phẩm ${prev.name || 'thời trang'} cao cấp với chất liệu tự nhiên mềm mại, thiết kế tinh tế giúp mang lại cảm giác thoải mái tự tin tuyệt đối.`,
                    richContent: `<h3>Thiết kế & Chất liệu đỉnh cao</h3><p>Mẫu <strong>${prev.name}</strong> ứng dụng công nghệ dệt hiện đại kháng khuẩn, thoáng khí và bền màu qua nhiều lần giặt.</p>`
                }));
                showToast('success', 'AI đã hoàn tất viết mô tả sản phẩm!');
            } else if (actionType === 'seo') {
                setFormData((prev: any) => ({
                    ...prev,
                    seo: {
                        title: `${prev.name || 'Sản phẩm'} - Thời Trang Cao Cấp HAVEN`,
                        description: `Mua ngay ${prev.name || 'sản phẩm'} chính hãng chất lượng cao tại HAVEN. Giao hàng toàn quốc, miễn phí đổi trả 30 ngày.`,
                        keywords: `${prev.name}, thoi trang haven, quan ao cao cap`,
                        slug: (prev.name || 'san-pham').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-')
                    }
                }));
                showToast('success', 'AI đã tạo bộ thẻ Meta SEO!');
            }
            setAiGenerating(null);
            setAutoSaveStatus('dirty');
        }, 800);
    };

    const handleApplyBulkVariants = () => {
        if (!formData.variants || formData.variants.length === 0) return;
        const updated = formData.variants.map((v: any) => ({
            ...v,
            stock: bulkStock !== '' ? Number(bulkStock) : v.stock,
            price: bulkPrice !== '' ? Number(bulkPrice) : v.price
        }));
        setFormData((prev: any) => ({ ...prev, variants: updated }));
        setAutoSaveStatus('dirty');
        showToast('success', `Áp dụng thay đổi cho ${updated.length} biến thể`);
    };

    if (!isOpen) return null;

    const retailPrice = Number(formData.price || 0);
    const costPrice = Number(formData.costPrice || 0);
    const profitVal = retailPrice - costPrice;
    const profitMargin = retailPrice > 0 ? Math.round((profitVal / retailPrice) * 100) : 0;

    const calculateSeoScore = () => {
        let score = 0;
        if (formData.seo?.title && formData.seo.title.length >= 25) score += 35;
        if (formData.seo?.description && formData.seo.description.length >= 60) score += 35;
        if (formData.images && formData.images.length >= 2) score += 30;
        return score;
    };
    const seoScore = calculateSeoScore();

    const navTabs = [
        { id: 'overview', label: 'Thông tin chung', icon: FileText, badge: errors.name ? '!' : null },
        { id: 'media', label: 'Hình ảnh & Video', icon: ImageIcon, badge: formData.images?.length || 0 },
        { id: 'variants', label: 'Biến thể & Phân loại', icon: Layers, badge: formData.variants?.length || 0 },
        { id: 'pricing', label: 'Giá & Khuyến mãi', icon: DollarSign, badge: `${profitMargin}%` },
        { id: 'inventory', label: 'Quản lý kho', icon: Boxes },
        { id: 'seo', label: 'SEO & Marketing', icon: Search, badge: `${seoScore}%` },
        { id: 'ai', label: 'Trợ lý AI Enterprise', icon: Sparkles, highlight: true },
        { id: 'specs', label: 'Thông số kỹ thuật', icon: Sliders },
        { id: 'shipping', label: 'Vận chuyển & Quy cách', icon: Truck },
        { id: 'channels', label: 'Kênh bán hàng', icon: Store },
        { id: 'audit', label: 'Lịch sử thay đổi', icon: History }
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-hidden font-sans">
                {/* LARGER AND MORE SPACIOUS CONTAINER (98vw & 96vh) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: 8 }}
                    transition={{ duration: 0.16 }}
                    className="w-[98vw] max-w-[1800px] h-[95vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-slate-900"
                >
                    {/* ───────────────────────────────────────────────────────────────────────────
                        HEADER BAR - EXTRA CLEAR & PROMINENT
                    ─────────────────────────────────────────────────────────────────────────── */}
                    <div className="flex items-center justify-between px-6 py-4 border-b-2 border-slate-200 bg-slate-100 flex-shrink-0">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
                                <Package size={24} />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 truncate tracking-tight">
                                        {formData.name || (product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới')}
                                    </h2>
                                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase ${
                                        formData.status === 'published'
                                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                                    }`}>
                                        {formData.status === 'published' ? '● ĐANG BÁN' : '○ BẢN NHÁP'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 mt-1">
                                    <span>Mã ID: <strong className="text-slate-900 font-mono text-sm">{formData.id}</strong></span>
                                    <span>SKU: <strong className="text-slate-900 font-mono text-sm">{formData.sku}</strong></span>
                                    {lastSavedTime && (
                                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                                            <CheckCircle2 size={14} /> Đã lưu lúc {lastSavedTime}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions buttons */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <button
                                type="button"
                                onClick={(e) => handleFormSubmit(e, true)}
                                disabled={isSubmitting}
                                className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white hover:bg-slate-200 text-slate-800 border-2 border-slate-300 transition-colors shadow-sm"
                            >
                                <Save size={16} /> Lưu nháp
                            </button>

                            <button
                                type="button"
                                onClick={(e) => handleFormSubmit(e, false)}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-slate-900 hover:bg-slate-800 text-white shadow-lg transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                Lưu sản phẩm (Ctrl+S)
                            </button>

                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-colors ml-1"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* ───────────────────────────────────────────────────────────────────────────
                        MAIN BODY LAYOUT
                    ─────────────────────────────────────────────────────────────────────────── */}
                    <div className="flex flex-1 overflow-hidden">

                        {/* ── LEFT SIDEBAR NAVIGATION (WIDER & LARGER FONTS) ── */}
                        <div className="w-64 sm:w-72 border-r-2 border-slate-200 bg-slate-50 flex flex-col flex-shrink-0 overflow-y-auto p-4 space-y-1.5">
                            {navTabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${
                                            isActive
                                                ? 'bg-slate-900 text-white shadow-md'
                                                : tab.highlight
                                                ? 'bg-purple-100 text-purple-900 hover:bg-purple-200 border-2 border-purple-300 font-bold'
                                                : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Icon size={19} className={isActive ? 'text-white' : tab.highlight ? 'text-purple-700' : 'text-slate-500'} />
                                            <span className="truncate">{tab.label}</span>
                                        </div>
                                        {tab.badge !== undefined && tab.badge !== null && (
                                            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold ${
                                                isActive
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-slate-200 text-slate-800'
                                            }`}>
                                                {tab.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* ── RIGHT MAIN CONTENT AREA (MORE SPACIOUS PADDING & CLEAR BORDERS) ── */}
                        <div ref={formContainerRef} className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 bg-white text-slate-900">

                            {/* ── TAB 1: THÔNG TIN CHUNG ── */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6 max-w-5xl">
                                    <div className="border-b-2 border-slate-200 pb-4 flex items-center justify-between">
                                        <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                                            <FileText size={22} className="text-blue-600" /> Thông tin sản phẩm cơ bản
                                        </h3>
                                        <span className="text-xs font-semibold text-slate-500">Trường có dấu (*) là bắt buộc</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                                                Tên sản phẩm <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name || ''}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, name: e.target.value });
                                                    setAutoSaveStatus('dirty');
                                                }}
                                                placeholder="VD: Áo Khoác Nữ Regular Fit Cao Cấp"
                                                className={`w-full px-4 py-3 rounded-xl bg-white border-2 text-sm sm:text-base font-semibold focus:outline-none focus:ring-2 ${
                                                    errors.name ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-slate-900 focus:ring-slate-100'
                                                }`}
                                            />
                                            {errors.name && <p className="text-xs font-bold text-red-500 mt-1">{errors.name}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                                                Mã SKU chính
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.sku || ''}
                                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-300 text-sm sm:text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                                                Mã Vạch Barcode
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.barcode || ''}
                                                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-300 text-sm sm:text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                                                Danh mục chính <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={formData.category || ''}
                                                onChange={(e) => {
                                                    const selectedCat = categories.find(c => c.id === e.target.value);
                                                    setFormData({
                                                        ...formData,
                                                        category: e.target.value,
                                                        categoryLabel: selectedCat?.name || ''
                                                    });
                                                }}
                                                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                                            >
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                                                Thương hiệu
                                            </label>
                                            <select
                                                value={formData.brand || 'HAVEN'}
                                                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                                            >
                                                {brands.map(b => (
                                                    <option key={b} value={b}>{b}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                                                Đối tượng (Gender)
                                            </label>
                                            <select
                                                value={formData.gender || 'Unisex'}
                                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                                            >
                                                <option value="Men">Nam</option>
                                                <option value="Women">Nữ</option>
                                                <option value="Unisex">Tất cả (Unisex)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                                                Phong cách (Style)
                                            </label>
                                            <select
                                                value={formData.styleCategory || 'Casual'}
                                                onChange={(e) => setFormData({ ...formData, styleCategory: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                                            >
                                                <option value="Casual">Casual Thường Ngày</option>
                                                <option value="Minimal">Minimal Tối Giản</option>
                                                <option value="Korean">Phong Cách Hàn Quốc</option>
                                                <option value="Streetwear">Streetwear Đường Phố</option>
                                                <option value="Business">Công Sở / Office</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                                            Mô tả ngắn sản phẩm
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={formData.shortDescription || ''}
                                            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                                            placeholder="Tóm tắt ngắn gọn 2-3 câu về sản phẩm..."
                                            className="w-full p-4 rounded-xl bg-white border-2 border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-slate-900 font-medium"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                                            Bài viết chi tiết (Rich Content)
                                        </label>
                                        <textarea
                                            rows={6}
                                            value={formData.richContent || ''}
                                            onChange={(e) => setFormData({ ...formData, richContent: e.target.value })}
                                            placeholder="Mô tả kỹ lưỡng chất liệu, thiết kế, hướng dẫn giặt sấy..."
                                            className="w-full p-4 rounded-xl bg-white border-2 border-slate-300 text-sm font-mono text-slate-900 focus:outline-none focus:border-slate-900"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 2: HÌNH ẢNH ── */}
                            {activeTab === 'media' && (
                                <div className="space-y-6 max-w-5xl">
                                    <div className="border-b-2 border-slate-200 pb-4 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                                                <ImageIcon size={22} className="text-blue-600" /> Thư viện hình ảnh sản phẩm
                                            </h3>
                                            <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                                Ảnh đầu tiên sẽ làm **Ảnh đại diện chính**. Hỗ trợ định dạng JPG, PNG, WEBP.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Upload controls */}
                                    <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 border-2 border-slate-200">
                                        <label className="cursor-pointer px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-colors shadow-md">
                                            <Upload size={18} /> Tải ảnh từ máy
                                            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                        </label>

                                        <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                                            <input
                                                type="text"
                                                value={newImageUrl}
                                                onChange={(e) => setNewImageUrl(e.target.value)}
                                                placeholder="Dán URL hình ảnh mới..."
                                                className="flex-1 px-4 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-slate-900"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddImageUrl}
                                                className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-extrabold border-2 border-slate-300 shadow-sm"
                                            >
                                                <Plus size={16} /> Thêm URL
                                            </button>
                                        </div>
                                    </div>

                                    {/* Image List (LARGER THUMBNAILS) */}
                                    <div className="space-y-4">
                                        {(formData.images || []).map((imgUrl: string, idx: number) => (
                                            <div
                                                key={`img-${idx}`}
                                                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                                                    idx === 0
                                                        ? 'bg-blue-50/70 border-blue-300 shadow-sm'
                                                        : 'bg-white border-slate-200'
                                                }`}
                                            >
                                                {/* FIXED Direct image with referrerPolicy & LARGER SIZE (24x24) */}
                                                <div className="w-20 h-20 sm:w-24 sm:h-24 relative rounded-xl overflow-hidden border-2 border-slate-300 bg-slate-100 flex-shrink-0 flex items-center justify-center shadow">
                                                    <img
                                                        src={imgUrl}
                                                        alt={`Product ${idx + 1}`}
                                                        referrerPolicy="no-referrer"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300';
                                                        }}
                                                    />
                                                    {idx === 0 && (
                                                        <span className="absolute top-1 left-1 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow">
                                                            Ảnh chính
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <input
                                                        type="text"
                                                        value={imgUrl}
                                                        onChange={(e) => {
                                                            const newImgs = [...formData.images];
                                                            newImgs[idx] = e.target.value;
                                                            setFormData({ ...formData, images: newImgs });
                                                            setAutoSaveStatus('dirty');
                                                        }}
                                                        className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900"
                                                    />
                                                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 mt-2">
                                                        <span>Kích thước: 1200x1500px</span>
                                                        <span>Chuẩn WebP</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    {idx !== 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSetPrimaryImage(idx)}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-300"
                                                        >
                                                            Đặt làm ảnh chính
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveImage(idx, 'up')}
                                                        disabled={idx === 0}
                                                        className="p-2 text-slate-600 hover:text-slate-900 disabled:opacity-30"
                                                    >
                                                        <ArrowUp size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveImage(idx, 'down')}
                                                        disabled={idx === (formData.images.length - 1)}
                                                        className="p-2 text-slate-600 hover:text-slate-900 disabled:opacity-30"
                                                    >
                                                        <ArrowDown size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveImage(idx)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 3: BIẾN THỂ (VARIANTS & COLORS/SIZES) ── */}
                            {activeTab === 'variants' && (
                                <div className="space-y-8 max-w-6xl">
                                    <div className="border-b-2 border-slate-200 pb-4 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                                                <Layers size={22} className="text-blue-600" /> Quản lý Màu sắc, Kích thước & Biến thể
                                            </h3>
                                            <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                                Thêm bớt màu sắc (gán ảnh mẫu theo màu), kích thước và điều chỉnh giá/kho riêng biệt.
                                            </p>
                                        </div>
                                    </div>

                                    {/* ── SECTION 1: COLORS & SIZES MANAGEMENT SIDE-BY-SIDE ── */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        
                                        {/* 1. COLOR MANAGEMENT CARD */}
                                        <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-4 shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                                                    Danh sách Màu sắc ({formData.colors?.length || 0})
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={handleAddColor}
                                                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md"
                                                >
                                                    <Plus size={15} /> Thêm màu
                                                </button>
                                            </div>

                                            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                                                {(formData.colors || []).map((color: any, idx: number) => (
                                                    <div key={`col-${idx}`} className="p-3.5 rounded-xl bg-white border-2 border-slate-200 space-y-2.5 shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                            {/* Color Picker Dot */}
                                                            <input
                                                                type="color"
                                                                value={color.hex || '#000000'}
                                                                onChange={(e) => handleColorChange(idx, 'hex', e.target.value)}
                                                                className="w-10 h-10 rounded-xl border-2 border-slate-300 cursor-pointer p-0.5 bg-white flex-shrink-0 shadow-sm"
                                                                title="Chọn mã màu HEX"
                                                            />

                                                            {/* Color Name */}
                                                            <input
                                                                type="text"
                                                                value={color.name || ''}
                                                                onChange={(e) => handleColorChange(idx, 'name', e.target.value)}
                                                                placeholder="Tên màu (Đen, Trắng, Tím...)"
                                                                className="flex-1 px-3 py-2 rounded-lg bg-slate-50 border-2 border-slate-300 text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
                                                            />

                                                            {/* Delete Color */}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveColor(idx)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-xl flex-shrink-0"
                                                                title="Xóa màu này"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>

                                                        {/* Color Specific Image Selection - Clean Stacked Layout */}
                                                        <div className="space-y-1.5 pt-2.5 border-t border-slate-100">
                                                            <label className="text-xs text-slate-600 font-bold block">Ảnh theo màu:</label>
                                                            <div className="flex items-center gap-2.5">
                                                                {color.image ? (
                                                                    <img
                                                                        src={color.image}
                                                                        alt={color.name}
                                                                        referrerPolicy="no-referrer"
                                                                        className="w-9 h-9 rounded-lg border-2 border-slate-300 object-cover flex-shrink-0 shadow-sm"
                                                                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=100'; }}
                                                                    />
                                                                ) : (
                                                                    <div className="w-9 h-9 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-bold flex-shrink-0">
                                                                        Chưa chọn
                                                                    </div>
                                                                )}

                                                                <select
                                                                    value={color.image || ''}
                                                                    onChange={(e) => handleColorChange(idx, 'image', e.target.value)}
                                                                    className="flex-1 w-full truncate px-3 py-2 rounded-lg bg-slate-50 border-2 border-slate-300 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-900"
                                                                >
                                                                    <option value="">-- Chọn ảnh đại diện cho màu --</option>
                                                                    {(formData.images || []).map((imgUrl: string, imgIdx: number) => (
                                                                        <option key={`opt-img-${imgIdx}`} value={imgUrl}>
                                                                            Ảnh {imgIdx + 1}: {imgUrl.substring(0, 45)}...
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 2. SIZE MANAGEMENT CARD */}
                                        <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-4 shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                                                    Danh sách Kích thước ({formData.sizes?.length || 0})
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={handleAddSize}
                                                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md"
                                                >
                                                    <Plus size={15} /> Thêm size
                                                </button>
                                            </div>

                                            {/* Quick Add Presets */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs font-bold text-slate-600">Thêm nhanh:</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuickAddSizes(['S', 'M', 'L', 'XL', 'XXL'])}
                                                    className="px-3 py-1 rounded-lg bg-white hover:bg-slate-100 border-2 border-slate-300 text-xs font-bold text-slate-800 shadow-sm"
                                                >
                                                    + S, M, L, XL, XXL
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuickAddSizes(['28', '29', '30', '31', '32', '34'])}
                                                    className="px-3 py-1 rounded-lg bg-white hover:bg-slate-100 border-2 border-slate-300 text-xs font-bold text-slate-800 shadow-sm"
                                                >
                                                    + Quần (28-34)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuickAddSizes(['Freesize'])}
                                                    className="px-3 py-1 rounded-lg bg-white hover:bg-slate-100 border-2 border-slate-300 text-xs font-bold text-slate-800 shadow-sm"
                                                >
                                                    + Freesize
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                                                {(formData.sizes || []).map((size: string, idx: number) => (
                                                    <div key={`sz-${idx}`} className="flex items-center gap-2 p-2 rounded-xl bg-white border-2 border-slate-200 shadow-sm">
                                                        <input
                                                            type="text"
                                                            value={size}
                                                            onChange={(e) => handleSizeChange(idx, e.target.value)}
                                                            placeholder="S, M, L..."
                                                            className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-slate-50 border-2 border-slate-300 text-sm font-extrabold uppercase text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveSize(idx)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0"
                                                            title="Xóa size này"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                    </div>

                                    {/* ── SECTION 2: BULK UPDATER & MATRIX VARIANT TABLE ── */}
                                    <div className="space-y-4 pt-3 border-t-2 border-slate-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                                                Ma trận Biến thể chi tiết ({formData.variants?.length || 0} biến thể)
                                            </span>
                                            <span className="text-xs text-slate-600 font-bold">
                                                Tự động tạo từ {formData.colors?.length || 0} màu × {formData.sizes?.length || 0} size
                                            </span>
                                        </div>

                                        {/* Bulk update bar */}
                                        <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 flex flex-wrap items-center gap-4 shadow-sm">
                                            <span className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                                                Cập nhật hàng loạt:
                                            </span>
                                            <input
                                                type="number"
                                                placeholder="Tồn kho chung (VD: 50)"
                                                value={bulkStock}
                                                onChange={(e) => setBulkStock(e.target.value ? Number(e.target.value) : '')}
                                                className="px-4 py-2 rounded-xl bg-white border-2 border-slate-300 text-xs sm:text-sm font-bold w-44 focus:outline-none focus:border-slate-900"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Giá bán chung (VD: 299000)"
                                                value={bulkPrice}
                                                onChange={(e) => setBulkPrice(e.target.value ? Number(e.target.value) : '')}
                                                className="px-4 py-2 rounded-xl bg-white border-2 border-slate-300 text-xs sm:text-sm font-bold w-48 focus:outline-none focus:border-slate-900"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleApplyBulkVariants}
                                                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-extrabold transition-all shadow-md"
                                            >
                                                Áp dụng tất cả
                                            </button>
                                        </div>

                                        {/* Matrix Variant Table (LARGE, CLEAR & HIGH CONTRAST) */}
                                        <div className="overflow-x-auto rounded-2xl border-2 border-slate-200 bg-white shadow-md">
                                            <table className="w-full text-left text-xs sm:text-sm">
                                                <thead className="bg-slate-100 uppercase text-xs font-extrabold text-slate-800 border-b-2 border-slate-200">
                                                    <tr>
                                                        <th className="p-4">Màu sắc & Ảnh mẫu</th>
                                                        <th className="p-4">Kích thước</th>
                                                        <th className="p-4">Mã SKU riêng</th>
                                                        <th className="p-4">Giá bán riêng (VND)</th>
                                                        <th className="p-4">Tồn kho (Cái)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {(formData.variants || []).map((variant: any, idx: number) => {
                                                        const colorObj = (formData.colors || []).find((c: any) => c.name === variant.color);
                                                        const displayImg = colorObj?.image || formData.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=100';

                                                        return (
                                                            <tr key={`v-${idx}`} className="hover:bg-slate-50 transition-colors">
                                                                <td className="p-4 font-bold text-slate-900">
                                                                    <div className="flex items-center gap-3">
                                                                        <span
                                                                            className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0 shadow-sm"
                                                                            style={{ background: colorObj?.hex || '#000000' }}
                                                                        />
                                                                        <img
                                                                            src={displayImg}
                                                                            alt={variant.color}
                                                                            referrerPolicy="no-referrer"
                                                                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border-2 border-slate-300 object-cover flex-shrink-0 shadow-sm"
                                                                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=100'; }}
                                                                        />
                                                                        <span className="text-sm font-extrabold">{variant.color}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 font-extrabold text-blue-700 text-base">{variant.size}</td>
                                                                <td className="p-4">
                                                                    <input
                                                                        type="text"
                                                                        value={variant.sku || ''}
                                                                        onChange={(e) => {
                                                                            const updated = [...formData.variants];
                                                                            updated[idx].sku = e.target.value;
                                                                            setFormData({ ...formData, variants: updated });
                                                                        }}
                                                                        className="px-3 py-1.5 rounded-lg bg-slate-50 border-2 border-slate-300 font-mono text-xs sm:text-sm font-bold w-40 focus:bg-white focus:border-slate-900"
                                                                    />
                                                                </td>
                                                                <td className="p-4">
                                                                    <input
                                                                        type="number"
                                                                        value={variant.price || 0}
                                                                        onChange={(e) => {
                                                                            const updated = [...formData.variants];
                                                                            updated[idx].price = Number(e.target.value);
                                                                            setFormData({ ...formData, variants: updated });
                                                                        }}
                                                                        className="px-3 py-1.5 rounded-lg bg-slate-50 border-2 border-slate-300 text-sm sm:text-base font-extrabold text-blue-700 w-32 focus:bg-white focus:border-slate-900"
                                                                    />
                                                                </td>
                                                                <td className="p-4">
                                                                    <input
                                                                        type="number"
                                                                        value={variant.stock || 0}
                                                                        onChange={(e) => {
                                                                            const updated = [...formData.variants];
                                                                            updated[idx].stock = Number(e.target.value);
                                                                            setFormData({ ...formData, variants: updated });
                                                                        }}
                                                                        className="px-3 py-1.5 rounded-lg bg-slate-50 border-2 border-slate-300 text-sm sm:text-base font-extrabold text-emerald-700 w-24 focus:bg-white focus:border-slate-900"
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 4: GIÁ & LỢI NHUẬN (PRICING) ── */}
                            {activeTab === 'pricing' && (
                                <div className="space-y-6 max-w-5xl">
                                    <div className="border-b-2 border-slate-200 pb-4 flex items-center justify-between">
                                        <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                                            <DollarSign size={22} className="text-blue-600" /> Thiết lập giá & Tỷ suất lợi nhuận
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                                                Giá bán lẻ (VND) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.price || 0}
                                                onChange={(e) => {
                                                    const newPrice = Number(e.target.value);
                                                    const updatedVariants = (formData.variants || []).map((v: any) => ({
                                                        ...v,
                                                        price: newPrice
                                                    }));
                                                    setFormData({ ...formData, price: newPrice, variants: updatedVariants });
                                                    setAutoSaveStatus('dirty');
                                                }}
                                                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-300 text-lg font-extrabold text-blue-700 focus:outline-none focus:border-slate-900"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                                                Giá gốc niêm yết
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.originalPrice || 0}
                                                onChange={(e) => {
                                                    const newOrig = Number(e.target.value);
                                                    const updatedVariants = (formData.variants || []).map((v: any) => ({
                                                        ...v,
                                                        originalPrice: newOrig
                                                    }));
                                                    setFormData({ ...formData, originalPrice: newOrig, variants: updatedVariants });
                                                    setAutoSaveStatus('dirty');
                                                }}
                                                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-300 text-base font-bold focus:outline-none focus:border-slate-900"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                                                Giá nhập / Giá vốn
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.costPrice || 0}
                                                onChange={(e) => {
                                                    const newCost = Number(e.target.value);
                                                    const updatedVariants = (formData.variants || []).map((v: any) => ({
                                                        ...v,
                                                        costPrice: newCost
                                                    }));
                                                    setFormData({ ...formData, costPrice: newCost, variants: updatedVariants });
                                                    setAutoSaveStatus('dirty');
                                                }}
                                                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-300 text-base font-bold focus:outline-none focus:border-slate-900"
                                            />
                                        </div>
                                    </div>

                                    {/* Profit Card */}
                                    <div className="p-6 rounded-2xl bg-slate-50 border-2 border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center shadow-sm">
                                        <div className="p-4 bg-white rounded-xl border-2 border-slate-200 shadow-sm">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Lợi nhuận / sản phẩm</span>
                                            <span className={`text-xl font-extrabold ${profitVal >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                                {profitVal.toLocaleString('vi-VN')} đ
                                            </span>
                                        </div>
                                        <div className="p-4 bg-white rounded-xl border-2 border-slate-200 shadow-sm">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Tỷ suất lợi nhuận Margin</span>
                                            <span className={`text-xl font-extrabold ${profitMargin >= 30 ? 'text-emerald-700' : 'text-amber-600'}`}>
                                                {profitMargin}%
                                            </span>
                                        </div>
                                        <div className="p-4 bg-white rounded-xl border-2 border-slate-200 shadow-sm">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Mức giảm so với niêm yết</span>
                                            <span className="text-xl font-extrabold text-blue-700">
                                                {formData.originalPrice > formData.price
                                                    ? `-${Math.round((1 - formData.price / formData.originalPrice) * 100)}%`
                                                    : '0%'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 5: QUẢN LÝ KHO (INVENTORY) ── */}
                            {activeTab === 'inventory' && (
                                <div className="space-y-6 max-w-5xl">
                                    <div className="border-b-2 border-slate-200 pb-4 flex items-center justify-between">
                                        <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                                            <Boxes size={22} className="text-blue-600" /> Quản lý phân bổ kho
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                        <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200">
                                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Kho tổng trung tâm</span>
                                            <input
                                                type="number"
                                                value={formData.inventoryAlloc?.main || 100}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    inventoryAlloc: { ...formData.inventoryAlloc, main: Number(e.target.value) }
                                                })}
                                                className="w-full px-4 py-2.5 rounded-xl bg-white text-base font-extrabold text-slate-900 border-2 border-slate-300"
                                            />
                                        </div>
                                        <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200">
                                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Kho Online E-commerce</span>
                                            <input
                                                type="number"
                                                value={formData.inventoryAlloc?.online || 80}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    inventoryAlloc: { ...formData.inventoryAlloc, online: Number(e.target.value) }
                                                })}
                                                className="w-full px-4 py-2.5 rounded-xl bg-white text-base font-extrabold text-blue-700 border-2 border-slate-300"
                                            />
                                        </div>
                                        <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200">
                                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Kho POS Cửa hàng</span>
                                            <input
                                                type="number"
                                                value={formData.inventoryAlloc?.offline || 50}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    inventoryAlloc: { ...formData.inventoryAlloc, offline: Number(e.target.value) }
                                                })}
                                                className="w-full px-4 py-2.5 rounded-xl bg-white text-base font-extrabold text-purple-700 border-2 border-slate-300"
                                            />
                                        </div>
                                        <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200">
                                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Ngưỡng cảnh báo hết</span>
                                            <input
                                                type="number"
                                                value={formData.inventoryAlloc?.threshold || 10}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    inventoryAlloc: { ...formData.inventoryAlloc, threshold: Number(e.target.value) }
                                                })}
                                                className="w-full px-4 py-2.5 rounded-xl bg-white text-base font-extrabold text-amber-700 border-2 border-slate-300"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 6: SEO ── */}
                            {activeTab === 'seo' && (
                                <div className="space-y-6 max-w-5xl">
                                    <div className="border-b-2 border-slate-200 pb-4 flex items-center justify-between">
                                        <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                                            <Search size={22} className="text-blue-600" /> Tối ưu hóa SEO Google
                                        </h3>
                                        <span className="px-4 py-1.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-300">
                                            Điểm SEO: {seoScore}/100
                                        </span>
                                    </div>

                                    {/* Google Live Snippet Preview */}
                                    <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-2">
                                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                            Xem trước kết quả trên Google
                                        </span>
                                        <div className="text-blue-700 text-base font-bold hover:underline cursor-pointer">
                                            {formData.seo?.title || `${formData.name} - HAVEN Store`}
                                        </div>
                                        <div className="text-xs text-emerald-700 font-mono font-bold">
                                            https://havenstore.vn/products/{formData.seo?.slug || 'san-pham'}
                                        </div>
                                        <div className="text-xs sm:text-sm text-slate-700 line-clamp-2">
                                            {formData.seo?.description || formData.shortDescription || 'Mô tả hiển thị khi người dùng tìm kiếm trên Google...'}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                                                Meta Title
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.seo?.title || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    seo: { ...formData.seo, title: e.target.value }
                                                })}
                                                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-slate-900"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                                                Meta Description
                                            </label>
                                            <textarea
                                                rows={3}
                                                value={formData.seo?.description || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    seo: { ...formData.seo, description: e.target.value }
                                                })}
                                                className="w-full p-4 rounded-xl bg-white border-2 border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-900"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 7: AI ENTERPRISE ── */}
                            {activeTab === 'ai' && (
                                <div className="space-y-6 max-w-5xl">
                                    <div className="border-b-2 border-purple-200 pb-4">
                                        <h3 className="text-lg font-extrabold text-purple-900 flex items-center gap-2">
                                            <Sparkles size={22} className="text-purple-600" /> Trợ lý AI Enterprise
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <button
                                            type="button"
                                            onClick={() => handleRunAIAction('description')}
                                            disabled={!!aiGenerating}
                                            className="p-5 rounded-2xl bg-purple-50 hover:bg-purple-100 border-2 border-purple-300 text-left space-y-2 transition-all shadow-sm"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-base font-extrabold text-purple-950">AI Viết mô tả Rich Text</span>
                                                <Sparkles size={20} className="text-purple-600" />
                                            </div>
                                            <p className="text-xs sm:text-sm font-medium text-slate-700">Tự động viết bài giới thiệu thu hút và chuyên nghiệp.</p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleRunAIAction('seo')}
                                            disabled={!!aiGenerating}
                                            className="p-5 rounded-2xl bg-purple-50 hover:bg-purple-100 border-2 border-purple-300 text-left space-y-2 transition-all shadow-sm"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-base font-extrabold text-purple-950">AI Tối ưu thẻ SEO</span>
                                                <Search size={20} className="text-purple-600" />
                                            </div>
                                            <p className="text-xs sm:text-sm font-medium text-slate-700">Tự động tạo Title & Description chuẩn SEO.</p>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 8: THUỘC TÍNH (SPECS) ── */}
                            {activeTab === 'specs' && (
                                <div className="space-y-6 max-w-5xl">
                                    <div className="border-b-2 border-slate-200 pb-4 flex items-center justify-between">
                                        <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                                            <Sliders size={22} className="text-blue-600" /> Thông số kỹ thuật
                                        </h3>
                                    </div>

                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            placeholder="Tên thông số (VD: Độ co giãn)"
                                            value={specKey}
                                            onChange={(e) => setSpecKey(e.target.value)}
                                            className="flex-1 px-4 py-3 rounded-xl bg-white border-2 border-slate-300 text-sm font-semibold"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Giá trị (VD: Co giãn 4 chiều)"
                                            value={specValue}
                                            onChange={(e) => setSpecValue(e.target.value)}
                                            className="flex-1 px-4 py-3 rounded-xl bg-white border-2 border-slate-300 text-sm font-semibold"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddSpec}
                                            className="px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-extrabold shadow-md"
                                        >
                                            Thêm
                                        </button>
                                    </div>

                                    <div className="divide-y-2 divide-slate-100 rounded-2xl border-2 border-slate-200 bg-white overflow-hidden shadow-sm">
                                        {Object.entries(formData.specifications || {}).map(([key, val]: any) => (
                                            <div key={key} className="flex items-center justify-between p-4 text-sm font-medium">
                                                <span className="font-extrabold text-slate-900 w-1/3">{key}</span>
                                                <span className="text-slate-700 flex-1">{val}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSpec(key)}
                                                    className="text-red-600 p-2 hover:bg-red-50 rounded-xl"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 10: VẬN CHUYỂN ── */}
                            {activeTab === 'shipping' && (
                                <div className="space-y-6 max-w-5xl">
                                    <div className="border-b-2 border-slate-200 pb-4 flex items-center justify-between">
                                        <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                                            <Truck size={22} className="text-blue-600" /> Kích thước & Đóng gói
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-bold text-slate-800 uppercase mb-2">Khối lượng (gam)</label>
                                            <input
                                                type="number"
                                                value={formData.shipping?.weight || 350}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    shipping: { ...formData.shipping, weight: Number(e.target.value) }
                                                })}
                                                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-300 text-base font-extrabold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-bold text-slate-800 uppercase mb-2">Dài (cm)</label>
                                            <input
                                                type="number"
                                                value={formData.shipping?.length || 30}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    shipping: { ...formData.shipping, length: Number(e.target.value) }
                                                })}
                                                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-300 text-base font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-bold text-slate-800 uppercase mb-2">Rộng (cm)</label>
                                            <input
                                                type="number"
                                                value={formData.shipping?.width || 20}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    shipping: { ...formData.shipping, width: Number(e.target.value) }
                                                })}
                                                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-300 text-base font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-bold text-slate-800 uppercase mb-2">Cao (cm)</label>
                                            <input
                                                type="number"
                                                value={formData.shipping?.height || 5}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    shipping: { ...formData.shipping, height: Number(e.target.value) }
                                                })}
                                                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-300 text-base font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 12: KÊNH BÁN HÀNG ── */}
                            {activeTab === 'channels' && (
                                <div className="space-y-6 max-w-5xl">
                                    <div className="border-b-2 border-slate-200 pb-4 flex items-center justify-between">
                                        <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                                            <Store size={22} className="text-blue-600" /> Kênh phân phối
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            { key: 'website', label: 'Website HAVEN Store (Chính)' },
                                            { key: 'mobileApp', label: 'Ứng dụng HAVEN Mobile' },
                                            { key: 'pos', label: 'POS Cửa hàng trực tiếp' },
                                            { key: 'facebook', label: 'Facebook Meta Shop' },
                                            { key: 'tiktok', label: 'TikTok Shop' },
                                            { key: 'shopee', label: 'Shopee Mall' }
                                        ].map((ch) => (
                                            <label key={ch.key} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 cursor-pointer">
                                                <span className="text-sm font-extrabold text-slate-900">{ch.label}</span>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.channels?.[ch.key] !== false}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        channels: { ...formData.channels, [ch.key]: e.target.checked }
                                                    })}
                                                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 13: LỊCH SỬ CHỈNH SỬA ── */}
                            {activeTab === 'audit' && (
                                <div className="space-y-6 max-w-5xl">
                                    <div className="border-b-2 border-slate-200 pb-4 flex items-center justify-between">
                                        <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                                            <History size={22} className="text-blue-600" /> Lịch sử chỉnh sửa
                                        </h3>
                                    </div>

                                    <div className="space-y-4">
                                        {auditLogs.map((log) => (
                                            <div key={log.id} className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-sm space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-extrabold text-blue-700">{log.user}</span>
                                                    <span className="text-xs font-semibold text-slate-500">{log.time}</span>
                                                </div>
                                                <div className="text-slate-800 font-medium">
                                                    Hành động: <strong>{log.action}</strong>
                                                </div>
                                                <div className="text-xs text-slate-500 font-mono">
                                                    IP: {log.ip} | Trình duyệt: {log.browser}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
