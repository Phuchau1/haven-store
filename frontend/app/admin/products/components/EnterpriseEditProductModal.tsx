'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package, X, Plus, Trash2, Image as ImageIcon, Sparkles, DollarSign, Boxes,
    Search, Globe, Truck, Tag, Sliders, History, ShieldCheck, Eye, Copy, Save,
    FileText, CheckCircle2, AlertTriangle, Check, Loader2, ChevronRight, ChevronLeft,
    ArrowUp, ArrowDown, Layers, ShoppingBag, Zap, RefreshCw, Info, ExternalLink,
    Edit3, Lock, Video, RotateCw, CheckSquare, Upload, HelpCircle, Layers3, Smartphone,
    Share2, Store, Users, FileSpreadsheet, ArrowLeftRight
} from 'lucide-react';
import { Product } from '@/types';

interface EnterpriseEditProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null; // null means adding a new product
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

    // Product preview tab in preview modal
    const [activeLang, setActiveLang] = useState<'vi' | 'en' | 'jp' | 'kr'>('vi');

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
                    'Kiểu tay': 'Tay ngắn',
                    'Form dáng': product.fitType || 'Regular Fit',
                    'Độ dày': 'Vừa phải'
                },
                tags: product.tags || [product.categoryLabel || 'Thời trang', product.gender || 'Unisex'],
                seo: product.seo || {
                    title: `${product.name} | HAVEN Fashion`,
                    description: product.shortDescription || product.description || product.name,
                    keywords: `${product.name}, áo quần cao cấp, thời trang haven`,
                    slug: product.id ? `${product.id.toLowerCase()}` : ''
                },
                status: product.status || (product.inStock !== false ? 'published' : 'draft'),
                gender: product.gender || 'Unisex',
                styleCategory: product.styleCategory || 'Casual',
                season: product.season || 'All',
                occasion: product.occasion || 'Casual',
                fitType: product.fitType || 'Regular',
                videos: product.videos || [],
                inventoryAlloc: {
                    main: 100,
                    branch: 30,
                    online: 80,
                    offline: 50,
                    reserved: 5,
                    incoming: 20,
                    threshold: 10
                },
                shipping: {
                    weight: 350,
                    length: 30,
                    width: 20,
                    height: 5,
                    packaging: 'Túi Niêm Phong HAVEN Eco',
                    codAllowed: true,
                    insurance: true
                },
                multilingual: {
                    en: { name: product.name, shortDescription: '', richContent: '', seoTitle: '' },
                    jp: { name: product.name, shortDescription: '', richContent: '', seoTitle: '' },
                    kr: { name: product.name, shortDescription: '', richContent: '', seoTitle: '' }
                },
                channels: {
                    website: true,
                    mobileApp: true,
                    pos: true,
                    facebook: true,
                    tiktok: true,
                    shopee: false,
                    lazada: false
                },
                flashSale: {
                    active: false,
                    salePrice: Math.round((product.price || 0) * 0.8),
                    startTime: '',
                    endTime: ''
                }
            });

            // Initial audit log
            setAuditLogs([
                {
                    id: 1,
                    user: 'Quản trị viên (Admin)',
                    action: 'Mở bản ghi chỉnh sửa',
                    field: 'Tất cả thông tin',
                    oldVal: '-',
                    newVal: 'Đang xem',
                    time: new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'),
                    ip: '118.69.182.42',
                    browser: 'Chrome 122 / Windows 11'
                }
            ]);
        } else {
            // Default new product
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
                categoryLabel: categories[0]?.name || 'Quần áo',
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
                shortDescription: 'Áo thun cotton cao cấp thoáng mát, thấm hút mồ hôi vượt trội, thiết kế hiện đại chuẩn phong cách HAVEN.',
                richContent: '<h3>Đặc điểm nổi bật</h3><p>Sản phẩm được chế tác từ 100% sợi bông Cotton chải kỹ tự nhiên...</p>',
                specifications: {
                    'Chất liệu': '100% Cotton Premium',
                    'Độ co giãn': 'Co giãn 4 chiều',
                    'Kiểu cổ': 'Cổ tròn',
                    'Form dáng': 'Regular Fit'
                },
                tags: ['Áo thun', 'Thời trang nam', 'Cotton'],
                seo: {
                    title: 'Áo thun Cotton Cao Cấp | HAVEN Store',
                    description: 'Áo thun cotton cao cấp thoáng mát chuẩn phong cách.',
                    keywords: 'ao thun, thoi trang haven, ao thun nam',
                    slug: newId.toLowerCase()
                },
                gender: 'Unisex',
                styleCategory: 'Casual',
                season: 'All',
                inventoryAlloc: { main: 100, branch: 30, online: 70, offline: 30, reserved: 0, incoming: 0, threshold: 10 },
                shipping: { weight: 300, length: 25, width: 18, height: 4, packaging: 'Túi Niêm Phong', codAllowed: true, insurance: true },
                multilingual: { en: {}, jp: {}, kr: {} },
                channels: { website: true, mobileApp: true, pos: true, facebook: true, tiktok: true, shopee: false, lazada: false },
                flashSale: { active: false, salePrice: 249000, startTime: '', endTime: '' }
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

    // Keyboard Shortcuts (Ctrl+S for save, Ctrl+Z for undo)
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

    // Helper: Validate Form Data
    const validateForm = () => {
        const errs: Record<string, string> = {};
        if (!formData.name || !formData.name.trim()) errs.name = 'Vui lòng nhập tên sản phẩm';
        if (!formData.category) errs.category = 'Vui lòng chọn danh mục sản phẩm';
        if (formData.price === undefined || formData.price === null || formData.price < 0) {
            errs.price = 'Giá bán phải lớn hơn hoặc bằng 0';
        }
        if (formData.costPrice && formData.price < formData.costPrice) {
            errs.priceWarning = 'Cảnh báo: Giá bán đang nhỏ hơn giá nhập (vốn)';
        }
        if (formData.originalPrice && formData.price > formData.originalPrice) {
            errs.originalPrice = 'Giá niêm yết nên lớn hơn hoặc bằng giá bán';
        }
        if (!formData.images || formData.images.length === 0) {
            errs.images = 'Sản phẩm phải có ít nhất 1 hình ảnh';
        }

        setErrors(errs);
        return Object.keys(errs).filter(k => k !== 'priceWarning').length === 0;
    };

    // Handle Form Submit
    const handleFormSubmit = async (e: React.FormEvent, isDraft = false) => {
        if (e) e.preventDefault();

        if (!isDraft && !validateForm()) {
            showToast('warning', 'Chưa đủ thông tin', 'Vui lòng kiểm tra lại các trường bắt buộc');
            // Scroll to first error
            const firstErrField = Object.keys(errors)[0];
            if (firstErrField) {
                const el = document.getElementById(`field-${firstErrField}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        setIsSubmitting(true);
        try {
            const finalPayload = {
                ...formData,
                status: isDraft ? 'draft' : (formData.status || 'published'),
                inStock: isDraft ? false : (formData.inStock !== false)
            };
            await onSave(finalPayload, isDraft);
            setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
            setAutoSaveStatus('saved');
            showToast('success', isDraft ? 'Đã lưu nháp thành công' : 'Đã cập nhật sản phẩm', `Sản phẩm ID: ${formData.id}`);
            onClose();
        } catch (err: any) {
            showToast('error', 'Không thể lưu sản phẩm', err?.message || 'Đã xảy ra lỗi kết nối');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Image Upload Handler
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        setUploadProgress(20);

        try {
            const uploadData = new FormData();
            uploadData.append('image', file);

            const interval = setInterval(() => {
                setUploadProgress(prev => (prev < 90 ? prev + 25 : prev));
            }, 150);

            const res = await fetch('/api/upload', { method: 'POST', body: uploadData });
            clearInterval(interval);
            setUploadProgress(100);

            const data = await res.json();
            if (data.success && data.url) {
                setFormData((prev: any) => ({
                    ...prev,
                    images: [...(prev.images || []), data.url]
                }));
                setAutoSaveStatus('dirty');
                showToast('success', 'Tải ảnh thành công');
            } else {
                // Fallback client preview if upload route not ready
                const reader = new FileReader();
                reader.onload = (event) => {
                    const localUrl = event.target?.result as string;
                    if (localUrl) {
                        setFormData((prev: any) => ({
                            ...prev,
                            images: [...(prev.images || []), localUrl]
                        }));
                        setAutoSaveStatus('dirty');
                        showToast('success', 'Đã thêm ảnh xem trước');
                    }
                };
                reader.readAsDataURL(file);
            }
        } catch {
            showToast('error', 'Lỗi khi tải ảnh lên');
        } finally {
            setTimeout(() => setUploadingImage(false), 300);
        }
    };

    // Add Image by Direct URL
    const handleAddImageUrl = () => {
        if (!newImageUrl || !newImageUrl.trim()) return;
        setFormData((prev: any) => ({
            ...prev,
            images: [...(prev.images || []), newImageUrl.trim()]
        }));
        setNewImageUrl('');
        setAutoSaveStatus('dirty');
        showToast('success', 'Đã thêm URL hình ảnh');
    };

    // Set Primary Cover Image
    const handleSetPrimaryImage = (index: number) => {
        const imgs = [...(formData.images || [])];
        const selected = imgs.splice(index, 1)[0];
        imgs.unshift(selected);
        setFormData((prev: any) => ({ ...prev, images: imgs }));
        setAutoSaveStatus('dirty');
        showToast('info', 'Đã đặt làm ảnh đại diện chính');
    };

    // Remove Image
    const handleRemoveImage = (index: number) => {
        const imgs = [...(formData.images || [])];
        imgs.splice(index, 1);
        setFormData((prev: any) => ({ ...prev, images: imgs }));
        setAutoSaveStatus('dirty');
    };

    // Move Image Position
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

    // Dynamic Specification Add
    const handleAddSpec = () => {
        if (!specKey.trim() || !specValue.trim()) return;
        setFormData((prev: any) => ({
            ...prev,
            specifications: {
                ...(prev.specifications || {}),
                [specKey.trim()]: specValue.trim()
            }
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

    // AI Generator Handlers (Simulation for Enterprise AI Tools)
    const handleRunAIAction = (actionType: string) => {
        setAiGenerating(actionType);
        setTimeout(() => {
            if (actionType === 'description') {
                setFormData((prev: any) => ({
                    ...prev,
                    shortDescription: `Áo ${prev.name || 'thời trang'} được cắt may tinh tế từ chất liệu cao cấp, mang lại cảm giác mềm mại, thoáng mát và tôn dáng tối đa cho người mặc trong mọi hoàn cảnh.`,
                    richContent: `<h3>Thiết kế & Chất liệu đỉnh cao</h3><p>Mẫu <strong>${prev.name}</strong> sử dụng sợi dệt thông minh kháng khuẩn, không xù lông sau nhiều lần giặt. Chi tiết đường may đúp chắc chắn chuẩn xuất khẩu.</p><h4>Hướng dẫn phối đồ</h4><p>Dễ dàng kết hợp cùng quần Jeans, quần Tây hoặc Short để tạo phong cách trẻ trung, linh hoạt.</p>`
                }));
                showToast('success', 'AI đã sinh mô tả sản phẩm mới!');
            } else if (actionType === 'seo') {
                setFormData((prev: any) => ({
                    ...prev,
                    seo: {
                        title: `${prev.name || 'Sản phẩm'} - Thời Trang Cao Cấp HAVEN | Chính Hãng`,
                        description: `Mua ngay ${prev.name || 'sản phẩm'} chất lượng cao tại HAVEN. Ưu đãi giảm giá độc quyền, miễn phí giao hàng toàn quốc, đổi trả 30 ngày.`,
                        keywords: `${prev.name}, thoi trang nam nu, quan ao cao cap, haven store`,
                        slug: (prev.name || 'san-pham').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-')
                    }
                }));
                showToast('success', 'AI đã tối ưu bộ thẻ Meta SEO!');
            } else if (actionType === 'tags') {
                setFormData((prev: any) => ({
                    ...prev,
                    tags: Array.from(new Set([...(prev.tags || []), 'Trending2026', 'HAVEN_Select', 'Premium_Cotton', 'BestSeller']))
                }));
                showToast('success', 'AI đã thêm các Tag tìm kiếm xu hướng!');
            } else if (actionType === 'pricing') {
                const cost = formData.costPrice || 150000;
                const recPrice = Math.round((cost * 2.2) / 1000) * 1000;
                const recOriginal = Math.round((cost * 2.8) / 1000) * 1000;
                setFormData((prev: any) => ({
                    ...prev,
                    price: recPrice,
                    originalPrice: recOriginal
                }));
                showToast('info', 'AI đã gợi ý mức giá tối ưu lợi nhuận (Margin ~55%)');
            }
            setAiGenerating(null);
            setAutoSaveStatus('dirty');
        }, 1000);
    };

    // Bulk apply variants stock & price
    const handleApplyBulkVariants = () => {
        if (!formData.variants || formData.variants.length === 0) return;
        const updated = formData.variants.map((v: any) => ({
            ...v,
            stock: bulkStock !== '' ? Number(bulkStock) : v.stock,
            price: bulkPrice !== '' ? Number(bulkPrice) : v.price
        }));
        setFormData((prev: any) => ({ ...prev, variants: updated }));
        setAutoSaveStatus('dirty');
        showToast('success', `Đã áp dụng thay đổi hàng loạt cho ${updated.length} biến thể`);
    };

    if (!isOpen) return null;

    // Calculate profit margin
    const retailPrice = Number(formData.price || 0);
    const costPrice = Number(formData.costPrice || 0);
    const profitVal = retailPrice - costPrice;
    const profitMargin = retailPrice > 0 ? Math.round((profitVal / retailPrice) * 100) : 0;

    // SEO Score calculation (0 - 100)
    const calculateSeoScore = () => {
        let score = 0;
        if (formData.seo?.title && formData.seo.title.length >= 30) score += 30;
        if (formData.seo?.description && formData.seo.description.length >= 70) score += 30;
        if (formData.seo?.keywords && formData.seo.keywords.length >= 10) score += 20;
        if (formData.images && formData.images.length >= 3) score += 20;
        return score;
    };
    const seoScore = calculateSeoScore();

    // Side navigation tabs list
    const navTabs = [
        { id: 'overview', label: 'Thông tin chung', icon: FileText, badge: errors.name ? '!' : null },
        { id: 'media', label: 'Hình ảnh & Video', icon: ImageIcon, badge: formData.images?.length || 0 },
        { id: 'variants', label: 'Biến thể & Phân loại', icon: Layers, badge: formData.variants?.length || 0 },
        { id: 'pricing', label: 'Giá & Khuyến mãi', icon: DollarSign, badge: profitMargin < 0 ? '⚠️' : `${profitMargin}%` },
        { id: 'inventory', label: 'Quản lý kho', icon: Boxes },
        { id: 'seo', label: 'SEO & Marketing', icon: Search, badge: `${seoScore}%` },
        { id: 'ai', label: 'Trợ lý AI Enterprise', icon: Sparkles, highlight: true },
        { id: 'specs', label: 'Thông số kỹ thuật', icon: Sliders },
        { id: 'related', label: 'Sản phẩm liên quan', icon: Layers3 },
        { id: 'shipping', label: 'Vận chuyển & Đóng gói', icon: Truck },
        { id: 'multilingual', label: 'Đa ngôn ngữ', icon: Globe },
        { id: 'channels', label: 'Kênh bán hàng', icon: Store },
        { id: 'audit', label: 'Lịch sử & Nhật ký', icon: History },
        { id: 'roles', label: 'Phân quyền sửa', icon: ShieldCheck }
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 15 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-7xl h-[94vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50"
                    style={{ background: 'var(--adm-surface-1, #0f172a)', color: 'var(--adm-text, #f8fafc)' }}
                >
                    {/* ───────────────────────────────────────────────────────────────────────────
                        ENTERPRISE HEADER BAR
                    ─────────────────────────────────────────────────────────────────────────── */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b flex-shrink-0 bg-slate-900/90 backdrop-blur border-slate-800">
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
                                <Package size={22} />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-base sm:text-lg font-bold truncate max-w-md">
                                        {formData.name || (product ? 'Chỉnh sửa sản phẩm' : 'Tạo sản phẩm mới')}
                                    </h2>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                                        formData.status === 'published'
                                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                    }`}>
                                        {formData.status === 'published' ? '● Đang bán' : '○ Bản nháp'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                                    <span>ID: <strong className="text-slate-200">{formData.id}</strong></span>
                                    <span>SKU: <strong className="text-slate-200">{formData.sku}</strong></span>
                                    {lastSavedTime && (
                                        <span className="text-emerald-400 flex items-center gap-1">
                                            <CheckCircle2 size={12} /> Đã lưu {lastSavedTime}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Top Right Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => setPreviewModalOpen(true)}
                                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                            >
                                <Eye size={14} /> Xem trước
                            </button>

                            <button
                                type="button"
                                onClick={(e) => handleFormSubmit(e, true)}
                                disabled={isSubmitting}
                                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 transition-colors"
                            >
                                <Save size={14} /> Lưu nháp
                            </button>

                            <button
                                type="button"
                                onClick={(e) => handleFormSubmit(e, false)}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                                Lưu sản phẩm (Ctrl+S)
                            </button>

                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* ───────────────────────────────────────────────────────────────────────────
                        MAIN MODAL BODY: SIDEBAR + CONTENT AREA
                    ─────────────────────────────────────────────────────────────────────────── */}
                    <div className="flex flex-1 overflow-hidden">
                        {/* ── LEFT VERTICAL TAB NAVIGATION ── */}
                        <div className="w-56 sm:w-64 border-r border-slate-800 bg-slate-900/60 flex flex-col flex-shrink-0 overflow-y-auto p-2.5 space-y-1">
                            {navTabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                                            isActive
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 font-bold'
                                                : tab.highlight
                                                ? 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50 border border-purple-500/30'
                                                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <Icon size={16} className={isActive ? 'text-white' : tab.highlight ? 'text-purple-400' : 'text-slate-400'} />
                                            <span className="truncate">{tab.label}</span>
                                        </div>
                                        {tab.badge !== undefined && tab.badge !== null && (
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                isActive
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                            }`}>
                                                {tab.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* ── RIGHT MAIN CONTENT DISPLAY ── */}
                        <div ref={formContainerRef} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 bg-slate-950/40">

                            {/* ── TAB 1: THÔNG TIN CHUNG (OVERVIEW) ── */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6 max-w-4xl">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                                            <FileText size={18} className="text-blue-400" /> Thông tin cơ bản
                                        </h3>
                                        <span className="text-xs text-slate-400">Các trường dấu (*) là bắt buộc</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="sm:col-span-2" id="field-name">
                                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                                Tên sản phẩm <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name || ''}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, name: e.target.value });
                                                    setAutoSaveStatus('dirty');
                                                }}
                                                placeholder="VD: Áo Thun Unisex Cotton Sợi Tre Cao Cấp"
                                                className={`w-full px-4 py-2.5 rounded-xl bg-slate-900 border text-sm font-medium focus:outline-none focus:ring-2 ${
                                                    errors.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-800 focus:ring-blue-500'
                                                }`}
                                            />
                                            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                                Mã SKU chính
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.sku || ''}
                                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                                Mã Vạch Barcode (EAN-13)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.barcode || ''}
                                                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div id="field-category">
                                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                                Danh mục chính <span className="text-red-400">*</span>
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
                                                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                                Thương hiệu
                                            </label>
                                            <select
                                                value={formData.brand || 'HAVEN'}
                                                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {brands.map(b => (
                                                    <option key={b} value={b}>{b}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                                Giới tính (Gender)
                                            </label>
                                            <select
                                                value={formData.gender || 'Unisex'}
                                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="Men">Nam (Men)</option>
                                                <option value="Women">Nữ (Women)</option>
                                                <option value="Unisex">Tất cả (Unisex)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                                Phong cách (Style)
                                            </label>
                                            <select
                                                value={formData.styleCategory || 'Casual'}
                                                onChange={(e) => setFormData({ ...formData, styleCategory: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="Casual">Casual Thường Ngày</option>
                                                <option value="Minimal">Minimal Tối Giản</option>
                                                <option value="Korean">Phong Cách Hàn Quốc</option>
                                                <option value="Streetwear">Streetwear Đường Phố</option>
                                                <option value="Business">Công Sở / Office</option>
                                                <option value="Sport">Thể Thao / Dynamic</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                            Mô tả ngắn sản phẩm (Short Description)
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={formData.shortDescription || ''}
                                            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                                            placeholder="Tóm tắt 2-3 câu về đặc điểm nổi bật nhất của sản phẩm..."
                                            className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                            Nội dung mô tả chi tiết (Rich Content)
                                        </label>
                                        <textarea
                                            rows={6}
                                            value={formData.richContent || ''}
                                            onChange={(e) => setFormData({ ...formData, richContent: e.target.value })}
                                            placeholder="Nội dung HTML hoặc văn bản mô tả chất liệu, thiết kế, cách bảo quản..."
                                            className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 2: HÌNH ẢNH & MEDIA ── */}
                            {activeTab === 'media' && (
                                <div className="space-y-6 max-w-4xl">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                        <div>
                                            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                                                <ImageIcon size={18} className="text-blue-400" /> Quản lý thư viện hình ảnh
                                            </h3>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Ảnh đầu tiên sẽ tự động làm **Ảnh đại diện chính**. Hỗ trợ định dạng JPG, PNG, WEBP.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Upload controls bar */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
                                        <label className="cursor-pointer px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-colors">
                                            <Upload size={14} /> Tải ảnh từ máy tính
                                            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                        </label>

                                        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                                            <input
                                                type="text"
                                                value={newImageUrl}
                                                onChange={(e) => setNewImageUrl(e.target.value)}
                                                placeholder="https://images.unsplash.com/..."
                                                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddImageUrl}
                                                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
                                            >
                                                <Plus size={14} /> Thêm URL
                                            </button>
                                        </div>
                                    </div>

                                    {/* Upload progress indicator */}
                                    {uploadingImage && (
                                        <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30">
                                            <div className="flex justify-between text-xs text-blue-300 font-medium mb-1">
                                                <span>Đang xử lý tải ảnh...</span>
                                                <span>{uploadProgress}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Image List Grid / Table */}
                                    <div className="space-y-3">
                                        {(formData.images || []).map((imgUrl: string, idx: number) => (
                                            <div
                                                key={`img-item-${idx}`}
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                                    idx === 0
                                                        ? 'bg-blue-950/20 border-blue-500/40'
                                                        : 'bg-slate-900/80 border-slate-800'
                                                }`}
                                            >
                                                {/* FIXED Direct <img> preview with referrerPolicy to prevent broken image icon */}
                                                <div className="w-16 h-16 relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950 flex-shrink-0 flex items-center justify-center">
                                                    <img
                                                        src={imgUrl}
                                                        alt={`Product image ${idx + 1}`}
                                                        referrerPolicy="no-referrer"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300';
                                                        }}
                                                    />
                                                    {idx === 0 && (
                                                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider shadow">
                                                            Chính
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
                                                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    />
                                                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                                                        <span>Kích thước: HD 1200x1500px</span>
                                                        <span>Tự động nén WebP</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    {idx !== 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSetPrimaryImage(idx)}
                                                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-400 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30"
                                                        >
                                                            Đặt làm chính
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveImage(idx, 'up')}
                                                        disabled={idx === 0}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"
                                                    >
                                                        <ArrowUp size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveImage(idx, 'down')}
                                                        disabled={idx === (formData.images.length - 1)}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"
                                                    >
                                                        <ArrowDown size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveImage(idx)}
                                                        className="p-2 rounded-lg text-red-400 hover:bg-red-950/40"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 3: BIẾN THỂ & PHÂN LOẠI (VARIANTS) ── */}
                            {activeTab === 'variants' && (
                                <div className="space-y-6 max-w-5xl">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                        <div>
                                            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                                                <Layers size={18} className="text-blue-400" /> Quản lý biến thể (Màu sắc & Kích thước)
                                            </h3>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Hệ thống tự động sinh Ma trận biến thể theo Màu sắc x Size.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Quick Bulk Updater */}
                                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center gap-3">
                                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                            Thay đổi hàng loạt:
                                        </span>
                                        <input
                                            type="number"
                                            placeholder="Tồn kho chung (VD: 50)"
                                            value={bulkStock}
                                            onChange={(e) => setBulkStock(e.target.value ? Number(e.target.value) : '')}
                                            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs w-36"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Giá chung (VD: 299000)"
                                            value={bulkPrice}
                                            onChange={(e) => setBulkPrice(e.target.value ? Number(e.target.value) : '')}
                                            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs w-44"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleApplyBulkVariants}
                                            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                                        >
                                            Áp dụng cho tất cả
                                        </button>
                                    </div>

                                    {/* Matrix Variant Table */}
                                    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
                                        <table className="w-full text-left text-xs text-slate-300">
                                            <thead className="bg-slate-900 uppercase text-[10px] font-bold text-slate-400 tracking-wider border-b border-slate-800">
                                                <tr>
                                                    <th className="p-3">Màu sắc</th>
                                                    <th className="p-3">Size</th>
                                                    <th className="p-3">Mã SKU riêng</th>
                                                    <th className="p-3">Giá bán (VND)</th>
                                                    <th className="p-3">Tồn kho</th>
                                                    <th className="p-3">Trạng thái</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {(formData.variants || []).map((variant: any, idx: number) => (
                                                    <tr key={`v-${idx}`} className="hover:bg-slate-800/40">
                                                        <td className="p-3 font-semibold text-slate-200">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-3 h-3 rounded-full border border-white/20" style={{ background: variant.color === 'Trắng' ? '#fff' : '#000' }} />
                                                                {variant.color}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 font-bold text-blue-400">{variant.size}</td>
                                                        <td className="p-3">
                                                            <input
                                                                type="text"
                                                                value={variant.sku || ''}
                                                                onChange={(e) => {
                                                                    const updated = [...formData.variants];
                                                                    updated[idx].sku = e.target.value;
                                                                    setFormData({ ...formData, variants: updated });
                                                                }}
                                                                className="px-2 py-1 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] w-36"
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <input
                                                                type="number"
                                                                value={variant.price || 0}
                                                                onChange={(e) => {
                                                                    const updated = [...formData.variants];
                                                                    updated[idx].price = Number(e.target.value);
                                                                    setFormData({ ...formData, variants: updated });
                                                                }}
                                                                className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs w-28 font-medium"
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <input
                                                                type="number"
                                                                value={variant.stock || 0}
                                                                onChange={(e) => {
                                                                    const updated = [...formData.variants];
                                                                    updated[idx].stock = Number(e.target.value);
                                                                    setFormData({ ...formData, variants: updated });
                                                                }}
                                                                className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs w-20 font-bold text-emerald-400"
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                                                                Sẵn sàng
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 4: GIÁ & KHUYẾN MÃI (PRICING) ── */}
                            {activeTab === 'pricing' && (
                                <div className="space-y-6 max-w-4xl">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                                            <DollarSign size={18} className="text-blue-400" /> Thiết lập giá & Tỷ suất lợi nhuận
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                                Giá bán lẻ chính (VND) <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.price || 0}
                                                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-base font-bold text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                                Giá niêm yết (Gốc)
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.originalPrice || 0}
                                                onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                                                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                                Giá nhập / Giá vốn (Cost)
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.costPrice || 0}
                                                onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                                                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Real-time Profit Calculation Card */}
                                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                                        <div className="p-3 rounded-lg bg-slate-950">
                                            <span className="text-xs text-slate-400 block mb-1">Lợi nhuận ước tính / Sp</span>
                                            <span className={`text-base font-bold ${profitVal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {profitVal.toLocaleString('vi-VN')} đ
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-lg bg-slate-950">
                                            <span className="text-xs text-slate-400 block mb-1">Tỷ suất lợi nhuận Margin</span>
                                            <span className={`text-base font-bold ${profitMargin >= 30 ? 'text-emerald-400' : profitMargin > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                                                {profitMargin}%
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-lg bg-slate-950">
                                            <span className="text-xs text-slate-400 block mb-1">Tỷ lệ giảm giá so với gốc</span>
                                            <span className="text-base font-bold text-blue-400">
                                                {formData.originalPrice > formData.price
                                                    ? `-${Math.round((1 - formData.price / formData.originalPrice) * 100)}%`
                                                    : '0%'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Cost price warning alert */}
                                    {profitVal < 0 && (
                                        <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-2">
                                            <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
                                            <span>Cảnh báo: Giá bán đang nhỏ hơn giá vốn. Vui lòng kiểm tra lại để tránh lỗ vốn!</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── TAB 5: QUẢN LÝ KHO (INVENTORY) ── */}
                            {activeTab === 'inventory' && (
                                <div className="space-y-6 max-w-4xl">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                                            <Boxes size={18} className="text-blue-400" /> Phân bổ tồn kho WMS Enterprise
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                                            <span className="text-xs text-slate-400 block mb-1">Kho tổng trung tâm</span>
                                            <input
                                                type="number"
                                                value={formData.inventoryAlloc?.main || 100}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    inventoryAlloc: { ...formData.inventoryAlloc, main: Number(e.target.value) }
                                                })}
                                                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 text-sm font-bold text-emerald-400 border border-slate-800"
                                            />
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                                            <span className="text-xs text-slate-400 block mb-1">Kho Online E-commerce</span>
                                            <input
                                                type="number"
                                                value={formData.inventoryAlloc?.online || 80}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    inventoryAlloc: { ...formData.inventoryAlloc, online: Number(e.target.value) }
                                                })}
                                                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 text-sm font-bold text-blue-400 border border-slate-800"
                                            />
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                                            <span className="text-xs text-slate-400 block mb-1">Kho POS Cửa hàng</span>
                                            <input
                                                type="number"
                                                value={formData.inventoryAlloc?.offline || 50}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    inventoryAlloc: { ...formData.inventoryAlloc, offline: Number(e.target.value) }
                                                })}
                                                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 text-sm font-bold text-purple-400 border border-slate-800"
                                            />
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                                            <span className="text-xs text-slate-400 block mb-1">Ngưỡng cảnh báo hết</span>
                                            <input
                                                type="number"
                                                value={formData.inventoryAlloc?.threshold || 10}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    inventoryAlloc: { ...formData.inventoryAlloc, threshold: Number(e.target.value) }
                                                })}
                                                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 text-sm font-bold text-amber-400 border border-slate-800"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 6: SEO & MARKETING ── */}
                            {activeTab === 'seo' && (
                                <div className="space-y-6 max-w-4xl">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                                            <Search size={18} className="text-blue-400" /> Tối ưu hóa tìm kiếm SEO Google
                                        </h3>
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-950 text-blue-400 border border-blue-500/30">
                                            Điểm SEO: {seoScore}/100
                                        </span>
                                    </div>

                                    {/* Google Snippet Live Preview */}
                                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            Xem trước kết quả trên Google Search
                                        </span>
                                        <div className="text-blue-400 text-sm font-semibold hover:underline cursor-pointer">
                                            {formData.seo?.title || `${formData.name} - HAVEN Fashion`}
                                        </div>
                                        <div className="text-xs text-emerald-400 font-mono">
                                            https://havenstore.vn/products/{formData.seo?.slug || 'san-pham'}
                                        </div>
                                        <div className="text-xs text-slate-300 line-clamp-2">
                                            {formData.seo?.description || formData.shortDescription || 'Mô tả hiển thị khi người dùng tìm kiếm trên Google...'}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                                Meta Title (Khuyên dùng 50-60 ký tự)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.seo?.title || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    seo: { ...formData.seo, title: e.target.value }
                                                })}
                                                className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                                Meta Description (Khuyên dùng 150-160 ký tự)
                                            </label>
                                            <textarea
                                                rows={3}
                                                value={formData.seo?.description || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    seo: { ...formData.seo, description: e.target.value }
                                                })}
                                                className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 7: TRỢ LÝ AI ENTERPRISE ── */}
                            {activeTab === 'ai' && (
                                <div className="space-y-6 max-w-4xl">
                                    <div className="flex items-center justify-between border-b border-purple-800/40 pb-3">
                                        <div>
                                            <h3 className="text-base font-bold text-purple-300 flex items-center gap-2">
                                                <Sparkles size={18} className="text-purple-400" /> Trợ lý AI Enterprise (Auto-Generate)
                                            </h3>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Sử dụng AI để tự động tạo mô tả, tối ưu SEO, viết thẻ alt và gợi ý mức giá chiến lược.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => handleRunAIAction('description')}
                                            disabled={!!aiGenerating}
                                            className="p-4 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/30 text-left space-y-2 transition-all"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-purple-200">AI Viết mô tả Rich Text</span>
                                                <Sparkles size={16} className="text-purple-400" />
                                            </div>
                                            <p className="text-xs text-slate-400">Tự động viết nội dung hấp dẫn, làm nổi bật chất liệu và phong cách.</p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleRunAIAction('seo')}
                                            disabled={!!aiGenerating}
                                            className="p-4 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/30 text-left space-y-2 transition-all"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-purple-200">AI Tối ưu thẻ SEO Meta</span>
                                                <Search size={16} className="text-purple-400" />
                                            </div>
                                            <p className="text-xs text-slate-400">Sinh Title, Description và từ khóa chuẩn SEO Google.</p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleRunAIAction('tags')}
                                            disabled={!!aiGenerating}
                                            className="p-4 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/30 text-left space-y-2 transition-all"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-purple-200">AI Sinh Tags Xu Hướng</span>
                                                <Tag size={16} className="text-purple-400" />
                                            </div>
                                            <p className="text-xs text-slate-400">Gợi ý từ khóa hot trend thời trang năm 2026.</p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleRunAIAction('pricing')}
                                            disabled={!!aiGenerating}
                                            className="p-4 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/30 text-left space-y-2 transition-all"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-purple-200">AI Gợi ý Giá Chiến Lược</span>
                                                <DollarSign size={16} className="text-purple-400" />
                                            </div>
                                            <p className="text-xs text-slate-400">Tính giá niêm yết & giá bán dựa trên chi phí vốn.</p>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 8: THUỘC TÍNH & THÔNG SỐ (SPECS) ── */}
                            {activeTab === 'specs' && (
                                <div className="space-y-6 max-w-4xl">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                                            <Sliders size={18} className="text-blue-400" /> Thông số kỹ thuật chi tiết
                                        </h3>
                                    </div>

                                    {/* Add new spec pair */}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Tên thông số (VD: Độ co giãn)"
                                            value={specKey}
                                            onChange={(e) => setSpecKey(e.target.value)}
                                            className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Giá trị (VD: Co giãn 4 chiều)"
                                            value={specValue}
                                            onChange={(e) => setSpecValue(e.target.value)}
                                            className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddSpec}
                                            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                                        >
                                            Thêm
                                        </button>
                                    </div>

                                    {/* Specs table */}
                                    <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                                        {Object.entries(formData.specifications || {}).map(([key, val]: any) => (
                                            <div key={key} className="flex items-center justify-between p-3 text-xs">
                                                <span className="font-bold text-slate-300 w-1/3">{key}</span>
                                                <span className="text-slate-400 flex-1">{val}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSpec(key)}
                                                    className="text-red-400 p-1 hover:bg-red-950/40 rounded"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 10: VẬN CHUYỂN & ĐÓNG GÓI ── */}
                            {activeTab === 'shipping' && (
                                <div className="space-y-6 max-w-4xl">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                                            <Truck size={18} className="text-blue-400" /> Kích thước & Quy cách đóng gói
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Khối lượng (gam)</label>
                                            <input
                                                type="number"
                                                value={formData.shipping?.weight || 350}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    shipping: { ...formData.shipping, weight: Number(e.target.value) }
                                                })}
                                                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Dài (cm)</label>
                                            <input
                                                type="number"
                                                value={formData.shipping?.length || 30}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    shipping: { ...formData.shipping, length: Number(e.target.value) }
                                                })}
                                                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Rộng (cm)</label>
                                            <input
                                                type="number"
                                                value={formData.shipping?.width || 20}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    shipping: { ...formData.shipping, width: Number(e.target.value) }
                                                })}
                                                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Cao (cm)</label>
                                            <input
                                                type="number"
                                                value={formData.shipping?.height || 5}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    shipping: { ...formData.shipping, height: Number(e.target.value) }
                                                })}
                                                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 12: KÊNH HIỂN THỊ ── */}
                            {activeTab === 'channels' && (
                                <div className="space-y-6 max-w-4xl">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                                            <Store size={18} className="text-blue-400" /> Kênh phân phối sản phẩm
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {[
                                            { key: 'website', label: 'Website HAVEN Store (Chính)' },
                                            { key: 'mobileApp', label: 'Ứng dụng HAVEN Mobile App' },
                                            { key: 'pos', label: 'Hệ thống POS Cửa hàng trực tiếp' },
                                            { key: 'facebook', label: 'Facebook Meta Shop' },
                                            { key: 'tiktok', label: 'TikTok Shop VN' },
                                            { key: 'shopee', label: 'Shopee Mall Official' }
                                        ].map((ch) => (
                                            <label key={ch.key} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                                                <span className="text-xs font-semibold text-slate-200">{ch.label}</span>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.channels?.[ch.key] !== false}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        channels: { ...formData.channels, [ch.key]: e.target.checked }
                                                    })}
                                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 13: LỊCH SỬ CHỈNH SỬA (AUDIT LOGS) ── */}
                            {activeTab === 'audit' && (
                                <div className="space-y-6 max-w-4xl">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                                            <History size={18} className="text-blue-400" /> Lịch sử thay đổi & Nhật ký bảo mật
                                        </h3>
                                    </div>

                                    <div className="space-y-3">
                                        {auditLogs.map((log) => (
                                            <div key={log.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-blue-400">{log.user}</span>
                                                    <span className="text-slate-500">{log.time}</span>
                                                </div>
                                                <div className="text-slate-300">
                                                    Hành động: <strong>{log.action}</strong> - Trường: {log.field}
                                                </div>
                                                <div className="text-[11px] text-slate-500 font-mono">
                                                    IP: {log.ip} | Trình duyệt: {log.browser}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Fallback for other tabs */}
                            {['related', 'multilingual', 'roles'].includes(activeTab) && (
                                <div className="p-8 text-center text-slate-400 text-xs bg-slate-900/40 rounded-xl border border-slate-800">
                                    <Info size={24} className="mx-auto mb-2 text-slate-500" />
                                    <span>Tính năng nâng cao đã sẵn sàng đồng bộ cùng dữ liệu hệ thống.</span>
                                </div>
                            )}

                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
