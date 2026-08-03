'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
    Search,
    Plus,
    Edit2,
    Trash2,
    Eye,
    EyeOff,
    X,
    Loader2,
    Save,
    Package,
    ChevronDown,
    ChevronUp,
    SlidersHorizontal,
} from 'lucide-react';
import { Product } from '@/types';
import { formatPrice } from '@/lib/format';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonTable, SkeletonList } from '../components/SkeletonLoaders';
import { EmptyState } from '../components/EmptyState';
import { AdminPagination } from '../components/AdminPagination';
import { useToast } from '../components/AdminToast';
import EnterpriseEditProductModal from './components/EnterpriseEditProductModal';
import ConfirmModal from '@/app/component/ConfirmModal';

const CATEGORIES_LIST = [
    { id: 'cat-clothing', name: 'Thời Trang Nam' },
    { id: 'cat-womens', name: 'Thời Trang Nữ' },
    { id: 'cat-accessories', name: 'Phụ Kiện Thời Trang' },
    { id: 'cat-shoes', name: 'Giày Dép' },
    { id: 'cat-sport', name: 'Đồ Thể Thao' }
];

// ─── Helpers ────────────────────────────────────────────────────────────────
const isValidImageSrc = (src?: string | null): src is string => {
    if (!src || src.trim() === '') return false;
    if (src.startsWith('/')) return true;
    try {
        const url = new URL(src);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

const ITEMS_PER_PAGE = 10;

// ─── Component ───────────────────────────────────────────────────────────────
export default function AdminProducts() {
    const { showToast } = useToast();

    // ── Data State ──
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // ── Modal State ──
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'media' | 'specs' | 'seo' | 'variants'>('overview');

    // ── Search & Filter State ──
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Pagination State ──
    const [currentPage, setCurrentPage] = useState(1);

    const [formData, setFormData] = useState<Partial<Product>>({
        name: '',
        price: 0,
        originalPrice: 0,
        category: 'cat-clothing',
        categoryLabel: 'Quần Áo',
        subCategory: '',
        subCategoryLabel: '',
        images: ['/products/placeholder.jpg'],
        colors: [{ name: 'Đen', hex: '#000000' }],
        sizes: ['S', 'M', 'L', 'XL'],
        inStock: true,
        badge: '',
        description: '',
        shortDescription: '',
        richContent: '',
        specifications: {},
        sizeGuide: [],
        careInstructions: [],
        features: [],
        tags: [],
        seo: { title: '', description: '', keywords: '', slug: '' },
        faqs: [],
        certificates: [],
        fabric: [],
        status: 'published',
        videos: [],
        rating: 5,
        reviews: 0,
        soldQuantity: 0,
    });

    // ── Search debounce ──
    const handleSearchChange = (val: string) => {
        setSearchQuery(val);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            setDebouncedSearch(val);
            setCurrentPage(1);
        }, 300);
    };

    // ── Filtered & Paginated products ──
    const filteredProducts = products.filter((p) => {
        const q = debouncedSearch.toLowerCase();
        const matchSearch =
            !q ||
            p.name.toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q) ||
            (p.categoryLabel || '').toLowerCase().includes(q);
        const matchCategory = !filterCategory || p.category === filterCategory;
        const matchStatus =
            filterStatus === ''
                ? true
                : filterStatus === 'instock'
                ? p.inStock
                : !p.inStock;
        return matchSearch && matchCategory && matchStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterCategory, filterStatus]);

    // ── Image handlers ──
    const handleAddImage = () =>
        setFormData({ ...formData, images: [...(formData.images || []), ''] });
    const handleRemoveImage = (index: number) => {
        const imgs = [...(formData.images || [])];
        imgs.splice(index, 1);
        setFormData({ ...formData, images: imgs });
    };
    const handleImageChange = (index: number, value: string) => {
        const imgs = [...(formData.images || [])];
        imgs[index] = value;
        setFormData({ ...formData, images: imgs });
    };
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const uploadData = new FormData();
        uploadData.append('image', file);
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: uploadData });
            const data = await res.json();
            if (data.success) {
                setFormData(prev => ({ ...prev, images: [...(prev.images || []), data.url] }));
            } else {
                showToast('error', 'Lỗi upload', data.message);
            }
        } catch {
            showToast('error', 'Lỗi khi tải ảnh lên');
        }
    };

    // ── Size handlers ──
    const handleAddSize = () =>
        setFormData({ ...formData, sizes: [...(formData.sizes || []), ''] });
    const handleRemoveSize = (index: number) => {
        const sizes = [...(formData.sizes || [])];
        sizes.splice(index, 1);
        setFormData({ ...formData, sizes });
    };
    const handleSizeChange = (index: number, value: string) => {
        const sizes = [...(formData.sizes || [])];
        sizes[index] = value;
        setFormData({ ...formData, sizes });
    };

    // ── Color handlers ──
    const handleAddColor = () =>
        setFormData({ ...formData, colors: [...(formData.colors || []), { name: 'Màu mới', hex: '#000000' }] });
    const handleRemoveColor = (index: number) => {
        const colors = [...(formData.colors || [])];
        colors.splice(index, 1);
        setFormData({ ...formData, colors });
    };
    const handleColorChange = (index: number, field: 'name' | 'hex' | 'image', value: string) => {
        const colors = [...(formData.colors || [])];
        colors[index] = { ...colors[index], [field]: value };
        setFormData({ ...formData, colors });
    };

    // ── Variant handlers ──
    const handleVariantFieldChange = (index: number, field: 'stock' | 'price' | 'originalPrice', value: number | '') => {
        const variants = [...(formData.variants || [])];
        if (value === '') {
            const newVar = { ...variants[index] };
            delete newVar[field];
            variants[index] = newVar;
        } else {
            variants[index] = { ...variants[index], [field]: value };
        }
        setFormData({ ...formData, variants });
    };

    // ── Instructions handlers ──
    const handleAddInstruction = () =>
        setFormData({ ...formData, instructions: [...(formData.instructions || []), ''] });
    const handleRemoveInstruction = (index: number) => {
        const arr = [...(formData.instructions || [])];
        arr.splice(index, 1);
        setFormData({ ...formData, instructions: arr });
    };
    const handleInstructionChange = (index: number, value: string) => {
        const arr = [...(formData.instructions || [])];
        arr[index] = value;
        setFormData({ ...formData, instructions: arr });
    };

    // ── Notes handlers ──
    const handleAddNote = () =>
        setFormData({ ...formData, notes: [...(formData.notes || []), ''] });
    const handleRemoveNote = (index: number) => {
        const arr = [...(formData.notes || [])];
        arr.splice(index, 1);
        setFormData({ ...formData, notes: arr });
    };
    const handleNoteChange = (index: number, value: string) => {
        const arr = [...(formData.notes || [])];
        arr[index] = value;
        setFormData({ ...formData, notes: arr });
    };

    // ── Fetch initial data ──
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const productsRes = await fetch('/api/products');
                if (productsRes.ok) {
                    const d = await productsRes.json();
                    if (d.success) setProducts(d.products);
                }
            } catch {
                showToast('error', 'Lỗi tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [showToast]);

    // ── Auto-generate variants when colors/sizes change ──
    useEffect(() => {
        const colors = formData.colors || [];
        const sizes = formData.sizes || [];
        const currentVariants = formData.variants || [];
        const newVariants: Array<{ color: string; size: string; stock: number; price: number; originalPrice: number }> = [];
        colors.forEach(col => {
            sizes.forEach(sz => {
                if (col.name && sz) {
                    const existing = currentVariants.find(v => v.color === col.name && v.size === sz);
                    newVariants.push({ 
                        color: col.name, 
                        size: sz, 
                        stock: existing ? existing.stock : 50,
                        price: existing?.price !== undefined ? existing.price : (formData.price || 0),
                        originalPrice: existing?.originalPrice !== undefined ? existing.originalPrice : (formData.originalPrice || 0)
                    });
                }
            });
        });
        const sig = (vars: Array<{ color: string; size: string }>) => vars.map(v => `${v.color}-${v.size}`).join('|');
        if (sig(newVariants) !== sig(currentVariants)) {
            setFormData(prev => ({ ...prev, variants: newVariants }));
        }
    }, [formData.colors, formData.sizes, formData.price, formData.originalPrice, formData.variants]);

    // ── Confirm Modal State ──
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title?: string;
        message: string;
        confirmText?: string;
        type?: 'warning' | 'danger' | 'info';
        onConfirm: () => void;
    }>({
        isOpen: false,
        message: '',
        onConfirm: () => {}
    });

    // ── SOFT HIDE / UNHIDE TOGGLE ──
    const handleToggleHide = (product: Product) => {
        const isHiding = product.inStock;
        const title = isHiding ? 'Ẩn sản phẩm khỏi cửa hàng?' : 'Hiện lại sản phẩm?';
        const confirmMsg = isHiding
            ? `Bạn có chắc chắn muốn ẨN sản phẩm "${product.name}" khỏi cửa hàng? Khách hàng sẽ tạm thời không tìm thấy sản phẩm này.`
            : `Bạn có muốn HIỆN LẠI sản phẩm "${product.name}" trên cửa hàng?`;
        
        setConfirmModal({
            isOpen: true,
            title,
            message: confirmMsg,
            confirmText: isHiding ? 'Ẩn sản phẩm' : 'Hiện sản phẩm',
            type: isHiding ? 'warning' : 'info',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    const { _id, __v, ...cleanProduct } = product as any;
                    const updatedProduct = {
                        ...cleanProduct,
                        inStock: !isHiding,
                        status: isHiding ? 'draft' : 'published'
                    };

                    const res = await fetch('/api/products', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedProduct),
                    });
                    const data = await res.json();
                    if (data.success) {
                        setProducts(products.map(p => p.id === product.id ? updatedProduct as Product : p));
                        showToast('success', isHiding ? 'Đã ẨN sản phẩm khỏi cửa hàng' : 'Đã HIỆN sản phẩm lên cửa hàng');
                    } else {
                        showToast('error', 'Không thể cập nhật trạng thái sản phẩm');
                    }
                } catch {
                    showToast('error', 'Lỗi khi cập nhật sản phẩm');
                }
            }
        });
    };

    const handleOpenModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData(product);
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                price: 0,
                originalPrice: 0,
                category: 'cat-clothing',
                categoryLabel: 'Quần Áo',
                subCategory: '',
                subCategoryLabel: '',
                images: ['/products/placeholder.jpg'],
                colors: [{ name: 'Đen', hex: '#000000' }],
                sizes: ['S', 'M', 'L', 'XL'],
                inStock: true,
                description: '',
                shortDescription: '',
                richContent: '',
                specifications: {},
                sizeGuide: [],
                careInstructions: [],
                features: [],
                tags: [],
                seo: { title: '', description: '', keywords: '', slug: '' },
                faqs: [],
                certificates: [],
                fabric: [],
                status: 'published',
                videos: [],
                content: '',
                instructions: [],
                notes: [],
                sizeChartImage: '',
                badge: '',
                rating: 5,
                reviews: 0,
                soldQuantity: 0,
            });
        }
        setActiveTab('overview');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const method = editingProduct ? 'PUT' : 'POST';
        const payload = editingProduct
            ? { ...formData, id: editingProduct.id }
            : { ...formData, id: `LF-${Math.random().toString(36).substr(2, 6).toUpperCase()}` };
        try {
            const res = await fetch('/api/products', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                setIsModalOpen(false);
                showToast('success', editingProduct ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm mới');
                const productsRes = await fetch('/api/products');
                if (productsRes.ok) {
                    const d = await productsRes.json();
                    if (d.success) setProducts(d.products);
                }
            } else {
                showToast('error', data.message || 'Không thể lưu sản phẩm');
            }
        } catch (err) {
            showToast('error', err instanceof Error ? err.message : 'Lỗi khi lưu sản phẩm');
        } finally {
            setIsSubmitting(false);
        }
    };

    const activeFiltersCount = [filterCategory, filterStatus].filter(Boolean).length;

    // ── Shared label style ──
    const labelCls =
        'block text-xs font-bold uppercase tracking-wider mb-2.5' +
        ' text-[var(--adm-text-muted)] select-none';
    const inputCls =
        'adm-input w-full min-h-[50px] text-sm px-4 rounded-xl block';
    const selectCls =
        'adm-select w-full min-h-[50px] text-sm px-4 rounded-xl';

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5">
            {/* ── Page Header ───────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--adm-text)' }}>
                        Quản lý sản phẩm
                    </h3>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                        {loading ? '...' : `${filteredProducts.length} / ${products.length} sản phẩm`}
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="adm-btn-primary flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto"
                >
                    <Plus size={18} />
                    Thêm sản phẩm
                </button>
            </div>

            {/* ── Search + Filter Toggle ──────────────────────────────────── */}
            <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                            size={16}
                            style={{ color: 'var(--adm-text-subtle)' }}
                        />
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={e => handleSearchChange(e.target.value)}
                            placeholder="Tìm tên sản phẩm, mã ID..."
                            className="adm-input w-full min-h-[44px] pl-10 pr-4"
                        />
                    </div>
                    {/* Filter toggle */}
                    <button
                        onClick={() => setIsFilterOpen(v => !v)}
                        className={`adm-btn-secondary flex items-center gap-1.5 min-h-[44px] px-4 relative flex-shrink-0 ${isFilterOpen ? 'ring-2 ring-[var(--adm-primary)]/30' : ''}`}
                    >
                        <SlidersHorizontal size={16} />
                        <span className="hidden sm:inline">Bộ lọc</span>
                        {activeFiltersCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center bg-[var(--adm-primary)] text-white">
                                {activeFiltersCount}
                            </span>
                        )}
                        {isFilterOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                </div>

                {/* ── Collapsible Advanced Filter Panel ──────────────────── */}
                <AnimatePresence initial={false}>
                    {isFilterOpen && (
                        <motion.div
                            key="filter-panel"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            style={{ overflow: 'hidden' }}
                        >
                            <div
                                className="adm-card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                            >
                                {/* Category filter */}
                                <div>
                                    <label className={labelCls}>Danh mục</label>
                                    <select
                                        value={filterCategory}
                                        onChange={e => setFilterCategory(e.target.value)}
                                        className={selectCls}
                                    >
                                        <option value="">Tất cả danh mục</option>
                                        <option value="cat-clothing">Nam</option>
                                        <option value="cat-womens">Nữ</option>
                                        <option value="cat-kids">Trẻ em</option>
                                        <option value="cat-accessories">Phụ kiện</option>
                                        <option value="cat-shoes">Giày dép</option>
                                    </select>
                                </div>
                                {/* Status filter */}
                                <div>
                                    <label className={labelCls}>Trạng thái</label>
                                    <select
                                        value={filterStatus}
                                        onChange={e => setFilterStatus(e.target.value)}
                                        className={selectCls}
                                    >
                                        <option value="">Tất cả trạng thái</option>
                                        <option value="instock">Còn hàng</option>
                                        <option value="outofstock">Hết hàng</option>
                                    </select>
                                </div>
                                {/* Reset */}
                                <div className="flex items-end">
                                    <button
                                        onClick={() => {
                                            setFilterCategory('');
                                            setFilterStatus('');
                                            setSearchQuery('');
                                            setDebouncedSearch('');
                                        }}
                                        className="adm-btn-secondary w-full min-h-[44px]"
                                    >
                                        Xóa bộ lọc
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Desktop Table (hidden on mobile) ──────────────────────── */}
            <div className="adm-card hidden md:block overflow-hidden">
                <div className="adm-table-scroll">
                    <table className="adm-table">
                        <thead>
                            <tr style={{ background: 'var(--adm-surface-2)' }}>
                                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest"
                                    style={{ color: 'var(--adm-text-muted)' }}>
                                    Hình ảnh &amp; Tên
                                </th>
                                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest"
                                    style={{ color: 'var(--adm-text-muted)' }}>
                                    Danh mục
                                </th>
                                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest"
                                    style={{ color: 'var(--adm-text-muted)' }}>
                                    Giá bán
                                </th>
                                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest"
                                    style={{ color: 'var(--adm-text-muted)' }}>
                                    Đã bán
                                </th>
                                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest"
                                    style={{ color: 'var(--adm-text-muted)' }}>
                                    Trạng thái
                                </th>
                                <th className="px-5 py-3.5 text-center text-[10px] font-bold uppercase tracking-widest"
                                    style={{ color: 'var(--adm-text-muted)' }}>
                                    Hành động
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <SkeletonTable rows={6} cols={6} />
                            ) : paginatedProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <EmptyState
                                            icon={Package}
                                            title="Không có sản phẩm"
                                            description={debouncedSearch || filterCategory || filterStatus
                                                ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.'
                                                : 'Nhấn "Thêm sản phẩm" để bắt đầu.'}
                                            actionLabel={!(debouncedSearch || filterCategory || filterStatus) ? 'Thêm sản phẩm' : undefined}
                                            onAction={!(debouncedSearch || filterCategory || filterStatus) ? () => handleOpenModal() : undefined}
                                        />
                                    </td>
                                </tr>
                            ) : (
                                paginatedProducts.map(product => (
                                    <tr
                                        key={product.id}
                                        className="border-t group transition-colors"
                                        style={{ borderColor: 'var(--adm-border)' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--adm-surface-2)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = '')}
                                    >
                                        {/* Image + Name */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
                                                    style={{ background: 'var(--adm-surface-2)' }}
                                                >
                                                    <img
                                                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300'}
                                                        alt={product.name}
                                                        referrerPolicy="no-referrer"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300';
                                                        }}
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <p
                                                        className="text-sm font-bold line-clamp-1"
                                                        style={{ color: 'var(--adm-text)' }}
                                                    >
                                                        {product.name}
                                                    </p>
                                                    <p
                                                        className="text-[10px] font-medium mt-0.5 uppercase tracking-wider"
                                                        style={{ color: 'var(--adm-text-subtle)' }}
                                                    >
                                                        {product.id}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Category */}
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col items-start gap-1">
                                                <span className="adm-badge adm-badge-neutral">
                                                    {product.categoryLabel}
                                                </span>
                                                {product.subCategoryLabel && product.subCategoryLabel !== 'Không có phân loại' && (
                                                    <span className="adm-badge bg-[var(--adm-primary-light)] text-[var(--adm-primary)] border-transparent">
                                                        {product.subCategoryLabel}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        {/* Price */}
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-bold" style={{ color: 'var(--adm-text)' }}>
                                                {formatPrice(product.price)}
                                            </p>
                                        </td>
                                        {/* Sold */}
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-semibold" style={{ color: 'var(--adm-text-muted)' }}>
                                                {product.soldQuantity || 0}
                                            </p>
                                        </td>
                                        {/* Status */}
                                        <td className="px-5 py-4">
                                            <span className={product.inStock ? 'adm-badge adm-badge-success' : 'adm-badge adm-badge-danger'}>
                                                <span className={`w-1.5 h-1.5 rounded-full inline-block mr-1 ${product.inStock ? 'bg-[var(--adm-success)]' : 'bg-[var(--adm-danger)]'}`} />
                                                {product.inStock ? 'Còn hàng' : 'Hết hàng'}
                                            </span>
                                        </td>
                                        {/* Actions */}
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => handleOpenModal(product)}
                                                    aria-label="Chỉnh sửa sản phẩm"
                                                    className="p-2 rounded-lg transition-all min-h-[36px] min-w-[36px] flex items-center justify-center"
                                                    style={{ color: 'var(--adm-text-muted)' }}
                                                    onMouseEnter={e => {
                                                        (e.currentTarget as HTMLElement).style.color = 'var(--adm-primary)';
                                                        (e.currentTarget as HTMLElement).style.background = 'var(--adm-primary-light)';
                                                    }}
                                                    onMouseLeave={e => {
                                                        (e.currentTarget as HTMLElement).style.color = 'var(--adm-text-muted)';
                                                        (e.currentTarget as HTMLElement).style.background = '';
                                                    }}
                                                >
                                                    <Edit2 size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleHide(product)}
                                                    aria-label={product.inStock ? 'Ẩn sản phẩm' : 'Hiện sản phẩm'}
                                                    title={product.inStock ? 'Ẩn sản phẩm khỏi cửa hàng' : 'Hiện sản phẩm lên cửa hàng'}
                                                    className="p-2 rounded-lg transition-all min-h-[36px] min-w-[36px] flex items-center justify-center"
                                                    style={{ color: product.inStock ? 'var(--adm-text-muted)' : 'var(--adm-warning, #f59e0b)' }}
                                                    onMouseEnter={e => {
                                                        (e.currentTarget as HTMLElement).style.color = product.inStock ? 'var(--adm-warning, #f59e0b)' : 'var(--adm-success)';
                                                        (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.1)';
                                                    }}
                                                    onMouseLeave={e => {
                                                        (e.currentTarget as HTMLElement).style.color = product.inStock ? 'var(--adm-text-muted)' : 'var(--adm-warning, #f59e0b)';
                                                        (e.currentTarget as HTMLElement).style.background = '';
                                                    }}
                                                >
                                                    {product.inStock ? <EyeOff size={15} /> : <Eye size={15} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Desktop Pagination */}
                {!loading && filteredProducts.length > ITEMS_PER_PAGE && (
                    <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--adm-border)' }}>
                        <AdminPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredProducts.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            {/* ── Mobile Card List (visible only on mobile) ─────────────── */}
            <div className="md:hidden space-y-3">
                {loading ? (
                    <SkeletonList rows={5} />
                ) : paginatedProducts.length === 0 ? (
                    <div className="adm-card">
                        <EmptyState
                            icon={Package}
                            title="Không có sản phẩm"
                            description={
                                debouncedSearch || filterCategory || filterStatus
                                    ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.'
                                    : 'Nhấn "Thêm sản phẩm" để bắt đầu.'
                            }
                            actionLabel={
                                !(debouncedSearch || filterCategory || filterStatus)
                                    ? 'Thêm sản phẩm'
                                    : undefined
                            }
                            onAction={
                                !(debouncedSearch || filterCategory || filterStatus)
                                    ? () => handleOpenModal()
                                    : undefined
                            }
                        />
                    </div>
                ) : (
                    paginatedProducts.map(product => (
                        <motion.div
                            key={product.id}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="adm-card overflow-hidden"
                        >
                            {/* Card body */}
                            <div className="flex gap-3 p-4">
                                {/* Thumbnail */}
                                <div
                                    className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"
                                    style={{ background: 'var(--adm-surface-2)' }}
                                >
                                    <img
                                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300'}
                                        alt={product.name}
                                        referrerPolicy="no-referrer"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300';
                                        }}
                                    />
                                </div>
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p
                                        className="text-sm font-bold line-clamp-2 leading-snug"
                                        style={{ color: 'var(--adm-text)' }}
                                    >
                                        {product.name}
                                    </p>
                                    <p
                                        className="text-[10px] font-medium mt-0.5 uppercase tracking-wider"
                                        style={{ color: 'var(--adm-text-subtle)' }}
                                    >
                                        {product.id}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <span className="adm-badge adm-badge-neutral text-[10px]">
                                            {product.categoryLabel}
                                        </span>
                                        {product.subCategoryLabel && product.subCategoryLabel !== 'Không có phân loại' && (
                                            <span className="adm-badge bg-[var(--adm-primary-light)] text-[var(--adm-primary)] border-transparent text-[10px]">
                                                {product.subCategoryLabel}
                                            </span>
                                        )}
                                        <span className={product.inStock ? 'adm-badge adm-badge-success text-[10px]' : 'adm-badge adm-badge-danger text-[10px]'}>
                                            {product.inStock ? 'Còn hàng' : 'Hết hàng'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2">
                                        <p className="text-sm font-bold" style={{ color: 'var(--adm-text)' }}>
                                            {formatPrice(product.price)}
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--adm-text-muted)' }}>
                                            Đã bán: <span className="font-semibold">{product.soldQuantity || 0}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {/* Card footer actions */}
                            <div
                                className="flex border-t"
                                style={{ borderColor: 'var(--adm-border)' }}
                            >
                                <button
                                    onClick={() => handleOpenModal(product)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-colors min-h-[44px]"
                                    style={{ color: 'var(--adm-primary)' }}
                                >
                                    <Edit2 size={14} />
                                    Chỉnh sửa
                                </button>
                                <div className="w-px" style={{ background: 'var(--adm-border)' }} />
                                <button
                                    onClick={() => handleToggleHide(product)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-colors min-h-[44px]"
                                    style={{ color: product.inStock ? 'var(--adm-warning, #f59e0b)' : 'var(--adm-success)' }}
                                >
                                    {product.inStock ? <EyeOff size={14} /> : <Eye size={14} />}
                                    {product.inStock ? 'Ẩn' : 'Hiện'}
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}

                {/* Mobile Pagination */}
                {!loading && filteredProducts.length > ITEMS_PER_PAGE && (
                    <AdminPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredProducts.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>

            {/* ── Enterprise Edit Product Modal ─────────────────────────────── */}
            <EnterpriseEditProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={editingProduct}
                onSave={async (productPayload) => {
                    const method = editingProduct ? 'PUT' : 'POST';
                    const { _id, __v, ...cleanPayload } = productPayload;
                    const res = await fetch('/api/products', {
                        method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(cleanPayload),
                    });
                    const data = await res.json();
                    if (data.success) {
                        const productsRes = await fetch(`/api/products?_t=${Date.now()}`, { cache: 'no-store' });
                        if (productsRes.ok) {
                            const d = await productsRes.json();
                            if (d.success) setProducts(d.products);
                        }
                    } else {
                        throw new Error(data.message || 'Không thể lưu sản phẩm');
                    }
                }}
                categories={CATEGORIES_LIST}
                showToast={showToast}
            />

            {/* ── SweetAlert Style Confirm Modal ── */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                type={confirmModal.type}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
