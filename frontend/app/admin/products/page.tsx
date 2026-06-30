'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
    Search,
    Plus,
    Edit2,
    Trash2,
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

    // ── CRUD handlers ──
    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
        try {
            const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setProducts(products.filter(p => p.id !== id));
                showToast('success', 'Đã xóa sản phẩm');
            } else {
                showToast('error', 'Không thể xóa sản phẩm');
            }
        } catch {
            showToast('error', 'Lỗi khi xóa sản phẩm');
        }
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
        'block text-[10px] font-bold uppercase tracking-widest mb-1.5' +
        ' text-[var(--adm-text-muted)]';
    const inputCls =
        'adm-input w-full min-h-[44px]';
    const selectCls =
        'adm-select w-full min-h-[44px]';

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
                                                    {isValidImageSrc(product.images?.[0]) && (
                                                        <Image
                                                            src={product.images[0]}
                                                            alt={product.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    )}
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
                                                    onClick={() => handleDelete(product.id)}
                                                    aria-label="Xóa sản phẩm"
                                                    className="p-2 rounded-lg transition-all min-h-[36px] min-w-[36px] flex items-center justify-center"
                                                    style={{ color: 'var(--adm-text-muted)' }}
                                                    onMouseEnter={e => {
                                                        (e.currentTarget as HTMLElement).style.color = 'var(--adm-danger)';
                                                        (e.currentTarget as HTMLElement).style.background = 'var(--adm-danger-light)';
                                                    }}
                                                    onMouseLeave={e => {
                                                        (e.currentTarget as HTMLElement).style.color = 'var(--adm-text-muted)';
                                                        (e.currentTarget as HTMLElement).style.background = '';
                                                    }}
                                                >
                                                    <Trash2 size={15} />
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
                                    {isValidImageSrc(product.images?.[0]) && (
                                        <Image
                                            src={product.images[0]}
                                            alt={product.name}
                                            fill
                                            className="object-cover"
                                        />
                                    )}
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
                                    onClick={() => handleDelete(product.id)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-colors min-h-[44px]"
                                    style={{ color: 'var(--adm-danger)' }}
                                >
                                    <Trash2 size={14} />
                                    Xóa
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

            {/* ── Add / Edit Modal ───────────────────────────────────────── */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                        />

                        {/* Modal panel */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 40 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
                            className="relative w-full max-w-2xl flex flex-col
                                       h-full sm:h-auto sm:max-h-[90vh]
                                       rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
                            style={{ background: 'var(--adm-surface)' }}
                        >
                            {/* Modal header */}
                            <div
                                className="flex items-center justify-between px-5 sm:px-6 py-4 border-b flex-shrink-0"
                                style={{ borderColor: 'var(--adm-border)', background: 'var(--adm-surface-2)' }}
                            >
                                <div>
                                    <h3 className="text-base font-bold" style={{ color: 'var(--adm-text)' }}>
                                        {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                                    </h3>
                                    {editingProduct && (
                                        <p className="text-[10px] font-medium mt-0.5 uppercase tracking-wider" style={{ color: 'var(--adm-text-subtle)' }}>
                                            ID: {editingProduct.id}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    aria-label="Đóng modal"
                                    className="p-2 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                    style={{ color: 'var(--adm-text-muted)' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--adm-surface-2)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Tabs Header */}
                            <div className="flex overflow-x-auto border-b hide-scrollbar" style={{ borderColor: 'var(--adm-border)' }}>
                                {[
                                    { id: 'overview', label: 'Tổng quan' },
                                    { id: 'content', label: 'Nội dung' },
                                    { id: 'media', label: 'Media' },
                                    { id: 'specs', label: 'Thông số' },
                                    { id: 'seo', label: 'SEO & Tag' },
                                    { id: 'variants', label: 'Biến thể' },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                                            activeTab === tab.id
                                                ? 'border-[var(--adm-primary)] text-[var(--adm-primary)]'
                                                : 'border-transparent text-[var(--adm-text-muted)] hover:text-[var(--adm-text)]'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Modal scrollable body */}
                            <form
                                id="product-form"
                                onSubmit={handleSubmit}
                                className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-6"
                            >
                                {/* ── TAB: OVERVIEW ── */}
                                <div className={activeTab === 'overview' ? 'block space-y-6' : 'hidden'}>
                                {/* ── Basic Info ── */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Name – full width */}
                                    <div className="sm:col-span-2">
                                        <label htmlFor="product-name" className={labelCls}>Tên sản phẩm</label>
                                        <input
                                            id="product-name"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className={inputCls}
                                        />
                                    </div>
                                    {/* Price */}
                                    <div>
                                        <label htmlFor="product-price" className={labelCls}>Giá bán (VND)</label>
                                        <input
                                            id="product-price"
                                            type="number"
                                            required
                                            min={0}
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                            className={inputCls}
                                        />
                                    </div>
                                    {/* Original Price */}
                                    <div>
                                        <label htmlFor="product-original-price" className={labelCls}>Giá gốc (VND - Nếu có Sale)</label>
                                        <input
                                            id="product-original-price"
                                            type="number"
                                            min={0}
                                            value={formData.originalPrice || ''}
                                            onChange={e => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                                            className={inputCls}
                                            placeholder="Bỏ trống nếu không sale"
                                        />
                                    </div>
                                    {/* Sold */}
                                    <div>
                                        <label htmlFor="product-sold" className={labelCls}>Đã bán (Xếp hạng Bán Chạy)</label>
                                        <input
                                            id="product-sold"
                                            type="number"
                                            min={0}
                                            value={formData.soldQuantity}
                                            onChange={e => setFormData({ ...formData, soldQuantity: Number(e.target.value) })}
                                            className={inputCls}
                                        />
                                    </div>
                                    {/* Created At */}
                                    <div>
                                        <label htmlFor="product-created" className={labelCls}>Ngày nhập (Xếp hạng SP Mới)</label>
                                        <input
                                            id="product-created"
                                            type="datetime-local"
                                            value={formData.createdAt ? new Date(new Date(formData.createdAt).getTime() - new Date(formData.createdAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                                            onChange={e => setFormData({ ...formData, createdAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                                            className={inputCls}
                                        />
                                    </div>
                                    {/* Category */}
                                    <div>
                                        <label htmlFor="product-category" className={labelCls}>Danh mục chính</label>
                                        <select
                                            id="product-category"
                                            value={formData.category}
                                            onChange={e =>
                                                setFormData({
                                                    ...formData,
                                                    category: e.target.value,
                                                    categoryLabel: e.target.options[e.target.selectedIndex].text,
                                                    subCategory: '',
                                                    subCategoryLabel: ''
                                                })
                                            }
                                            className={selectCls}
                                        >
                                            <option value="">Chọn danh mục chính</option>
                                            <option value="cat-clothing">Nam</option>
                                            <option value="cat-womens">Nữ</option>
                                            <option value="cat-kids">Trẻ em</option>
                                            <option value="cat-accessories">Phụ kiện</option>
                                            <option value="cat-shoes">Giày dép</option>
                                        </select>
                                    </div>
                                    {/* Subcategory */}
                                    <div>
                                        <label htmlFor="product-subcategory" className={labelCls}>Phân loại phụ (Mega Menu)</label>
                                        <select
                                            id="product-subcategory"
                                            value={formData.subCategory || ''}
                                            onChange={e =>
                                                setFormData({
                                                    ...formData,
                                                    subCategory: e.target.value,
                                                    subCategoryLabel: e.target.options[e.target.selectedIndex].text,
                                                })
                                            }
                                            className={selectCls}
                                        >
                                            <option value="">Không có phân loại</option>
                                            {formData.category === 'cat-clothing' ? (
                                                <>
                                                    <optgroup label="Áo Nam">
                                                        <option value="ao-so-mi-nam">Áo sơ mi nam</option>
                                                        <option value="ao-polo-nam">Áo polo nam</option>
                                                        <option value="ao-thun-nam">Áo T-shirt nam</option>
                                                        <option value="ao-khoac-nam">Áo khoác nam</option>
                                                    </optgroup>
                                                    <optgroup label="Quần Nam">
                                                        <option value="quan-au-nam">Quần âu nam</option>
                                                        <option value="quan-jean-nam">Quần jean nam</option>
                                                        <option value="quan-kaki-nam">Quần kaki nam</option>
                                                        <option value="quan-short-nam">Quần short nam</option>
                                                    </optgroup>
                                                    <optgroup label="Bộ đồ nam">
                                                        <option value="bo-vest-nam">Bộ vest nam</option>
                                                    </optgroup>
                                                    <optgroup label="Phụ kiện & Giày Nam">
                                                        <option value="giay-da-nam">Giày da nam</option>
                                                        <option value="vi-da-nam">Ví da nam</option>
                                                        <option value="day-lung-nam">Dây lưng nam</option>
                                                        <option value="dep-nam">Dép nam</option>
                                                    </optgroup>
                                                </>
                                            ) : formData.category === 'cat-womens' ? (
                                                <>
                                                    <optgroup label="Áo Nữ">
                                                        <option value="ao-so-mi-nu">Áo sơ mi nữ</option>
                                                        <option value="ao-polo-nu">Áo polo nữ</option>
                                                        <option value="ao-thun-nu">Áo T-shirt nữ</option>
                                                        <option value="ao-khoac-nu">Áo khoác nữ</option>
                                                    </optgroup>
                                                    <optgroup label="Quần Nữ">
                                                        <option value="quan-au-nu">Quần âu nữ</option>
                                                        <option value="quan-jean-nu">Quần jean nữ</option>
                                                        <option value="quan-short-nu">Quần short nữ</option>
                                                    </optgroup>
                                                    <optgroup label="Váy / Đầm">
                                                        <option value="vay-lien-dam">Váy liền đầm</option>
                                                        <option value="chan-vay">Chân váy</option>
                                                    </optgroup>
                                                    <optgroup label="Phụ kiện Nữ">
                                                        <option value="giay-dep-nu">Giày dép nữ</option>
                                                        <option value="tui-xach">Túi xách</option>
                                                    </optgroup>
                                                </>
                                            ) : formData.category === 'cat-accessories' ? (
                                                <>
                                                    <option value="that-lung">Thắt lưng</option>
                                                    <option value="vi-da">Ví da</option>
                                                    <option value="mu">Mũ</option>
                                                    <option value="tat">Tất</option>
                                                </>
                                            ) : formData.category === 'cat-shoes' ? (
                                                <>
                                                    <option value="giay-the-thao">Giày thể thao</option>
                                                    <option value="giay-da">Giày da</option>
                                                    <option value="dep">Dép</option>
                                                </>
                                            ) : null}
                                        </select>
                                    </div>
                                    {/* In Stock */}
                                    <div>
                                        <label className={labelCls}>Trạng thái</label>
                                        <select
                                            value={formData.inStock ? 'true' : 'false'}
                                            onChange={e => setFormData({ ...formData, inStock: e.target.value === 'true' })}
                                            className={selectCls}
                                        >
                                            <option value="true">Còn hàng</option>
                                            <option value="false">Hết hàng</option>
                                        </select>
                                    </div>
                                    {/* Badge */}
                                    <div>
                                        <label className={labelCls}>Nhãn (Badge)</label>
                                        <select
                                            value={formData.badge || ''}
                                            onChange={e => setFormData({ ...formData, badge: e.target.value })}
                                            className={selectCls}
                                        >
                                            <option value="">Không có</option>
                                            <option value="Mới">Mới</option>
                                            <option value="Hot">Hot</option>
                                            <option value="Sale">Sale</option>
                                            <option value="Bán chạy">Bán chạy</option>
                                        </select>
                                    </div>
                                    {/* Description */}
                                    <div className="sm:col-span-2">
                                        <label htmlFor="product-description" className={labelCls}>Mô tả ngắn</label>
                                        <textarea
                                            id="product-description"
                                            rows={2}
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="adm-input w-full resize-none"
                                        />
                                    </div>
                                    {/* Detailed content */}
                                    <div className="sm:col-span-2">
                                        <label htmlFor="product-content" className={labelCls}>Nội dung chi tiết (HTML)</label>
                                        <textarea
                                            id="product-content"
                                            rows={5}
                                            value={formData.content || ''}
                                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                                            placeholder="<p>Mô tả chi tiết sản phẩm...</p>"
                                            className="adm-input w-full resize-y font-mono text-xs"
                                        />
                                    </div>
                                </div>

                                </div>

                                {/* ── TAB: CONTENT ── */}
                                <div className={activeTab === 'content' ? 'block space-y-6' : 'hidden'}>
                                    <div>
                                        <label className={labelCls}>Mô tả ngắn</label>
                                        <textarea
                                            value={formData.shortDescription || ''}
                                            onChange={e => setFormData({ ...formData, shortDescription: e.target.value })}
                                            className={inputCls}
                                            rows={3}
                                            placeholder="Mô tả ngắn hiển thị dưới tên sản phẩm..."
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className={labelCls + ' mb-0'}>Nội dung chi tiết (Rich Text)</label>
                                            <button type="button" className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-medium flex items-center gap-1">
                                                ✨ Tạo bằng AI
                                            </button>
                                        </div>
                                        {/* Simple Rich Text Editor fallback for now */}
                                        <textarea
                                            value={formData.richContent || ''}
                                            onChange={e => setFormData({ ...formData, richContent: e.target.value })}
                                            className={inputCls}
                                            rows={10}
                                            placeholder="Nhập nội dung chi tiết dạng HTML hoặc text thường..."
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Câu hỏi thường gặp (FAQ)</label>
                                        {/* Simplified FAQ input for brevity */}
                                        <p className="text-xs text-gray-500 mb-2">Tính năng đang được phát triển.</p>
                                    </div>
                                </div>

                                {/* ── TAB: MEDIA ── */}
                                <div className={activeTab === 'media' ? 'block space-y-6' : 'hidden'}>
                                {/* ── Images ── */}
                                <div className="pt-4 border-t" style={{ borderColor: 'var(--adm-border)' }}>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className={labelCls}>Hình ảnh</label>
                                        <div className="flex items-center gap-3">
                                            <label className="cursor-pointer text-xs font-bold flex items-center gap-1"
                                                style={{ color: 'var(--adm-success)' }}>
                                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                                <Plus size={13} /> Tải ảnh lên
                                            </label>
                                            <button
                                                type="button"
                                                onClick={handleAddImage}
                                                className="text-xs font-bold flex items-center gap-1"
                                                style={{ color: 'var(--adm-primary)' }}
                                            >
                                                <Plus size={13} /> Thêm URL
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2.5">
                                        {(formData.images || []).map((img, idx) => (
                                            <div key={`img-${idx}`} className="flex items-center gap-2">
                                                <div
                                                    className="w-10 h-10 relative rounded-lg overflow-hidden flex-shrink-0 border"
                                                    style={{ background: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}
                                                >
                                                    {isValidImageSrc(img) && <Image src={img} alt="preview" fill className="object-cover" />}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={img}
                                                    onChange={e => handleImageChange(idx, e.target.value)}
                                                    placeholder="https://..."
                                                    className="adm-input flex-1 min-h-[40px] text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveImage(idx)}
                                                    aria-label="Xóa ảnh"
                                                    className="p-2 rounded-xl transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                                                    style={{ color: 'var(--adm-danger)' }}
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                </div>

                                {/* ── TAB: VARIANTS ── */}
                                <div className={activeTab === 'variants' ? 'block space-y-6' : 'hidden'}>
                                {/* ── Sizes & Instructions side by side on sm+ ── */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t" style={{ borderColor: 'var(--adm-border)' }}>
                                    {/* Sizes */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className={labelCls}>Kích thước</label>
                                            <button type="button" onClick={handleAddSize}
                                                className="text-xs font-bold flex items-center gap-1"
                                                style={{ color: 'var(--adm-primary)' }}>
                                                <Plus size={13} /> Thêm
                                            </button>
                                        </div>
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                            {(formData.sizes || []).map((size, idx) => (
                                                <div key={`size-${idx}`} className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={size}
                                                        onChange={e => handleSizeChange(idx, e.target.value)}
                                                        placeholder="S, M, L..."
                                                        className="adm-input flex-1 min-h-[40px] text-sm uppercase"
                                                    />
                                                    <button type="button" onClick={() => handleRemoveSize(idx)}
                                                        aria-label="Xóa kích thước"
                                                        className="p-2 rounded-xl transition-colors flex-shrink-0"
                                                        style={{ color: 'var(--adm-danger)' }}>
                                                        <X size={15} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Instructions */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className={labelCls}>Hướng dẫn sử dụng</label>
                                            <button type="button" onClick={handleAddInstruction}
                                                className="text-xs font-bold flex items-center gap-1"
                                                style={{ color: 'var(--adm-primary)' }}>
                                                <Plus size={13} /> Thêm
                                            </button>
                                        </div>
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                            {(formData.instructions || []).map((inst, idx) => (
                                                <div key={`inst-${idx}`} className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={inst}
                                                        onChange={e => handleInstructionChange(idx, e.target.value)}
                                                        placeholder="Nội dung..."
                                                        className="adm-input flex-1 min-h-[40px] text-sm"
                                                    />
                                                    <button type="button" onClick={() => handleRemoveInstruction(idx)}
                                                        aria-label="Xóa hướng dẫn"
                                                        className="p-2 rounded-xl transition-colors flex-shrink-0"
                                                        style={{ color: 'var(--adm-danger)' }}>
                                                        <X size={15} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* ── Notes & Size Chart side by side on sm+ ── */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t" style={{ borderColor: 'var(--adm-border)' }}>
                                    {/* Notes */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className={labelCls}>Lưu ý nhỏ</label>
                                            <button type="button" onClick={handleAddNote}
                                                className="text-xs font-bold flex items-center gap-1"
                                                style={{ color: 'var(--adm-primary)' }}>
                                                <Plus size={13} /> Thêm
                                            </button>
                                        </div>
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                            {(formData.notes || []).map((note, idx) => (
                                                <div key={`note-${idx}`} className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={note}
                                                        onChange={e => handleNoteChange(idx, e.target.value)}
                                                        placeholder="Nội dung..."
                                                        className="adm-input flex-1 min-h-[40px] text-sm"
                                                    />
                                                    <button type="button" onClick={() => handleRemoveNote(idx)}
                                                        aria-label="Xóa lưu ý"
                                                        className="p-2 rounded-xl transition-colors flex-shrink-0"
                                                        style={{ color: 'var(--adm-danger)' }}>
                                                        <X size={15} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Size chart image */}
                                    <div>
                                        <label className={labelCls}>Ảnh Bảng Size</label>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-12 h-12 relative rounded-lg overflow-hidden flex-shrink-0 border"
                                                style={{ background: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}
                                            >
                                                {isValidImageSrc(formData.sizeChartImage) && (
                                                    <Image src={formData.sizeChartImage!} alt="Size Chart" fill className="object-cover" />
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.sizeChartImage || ''}
                                                onChange={e => setFormData({ ...formData, sizeChartImage: e.target.value })}
                                                placeholder="https://... URL ảnh bảng size"
                                                className="adm-input flex-1 min-h-[40px] text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ── Colors ── */}
                                <div className="pt-4 border-t" style={{ borderColor: 'var(--adm-border)' }}>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className={labelCls}>Màu sắc &amp; Ảnh liên kết</label>
                                        <button type="button" onClick={handleAddColor}
                                            className="text-xs font-bold flex items-center gap-1"
                                            style={{ color: 'var(--adm-primary)' }}>
                                            <Plus size={13} /> Thêm màu
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                                        {(formData.colors || []).map((color, idx) => (
                                            <div
                                                key={`col-${idx}`}
                                                className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-2xl border"
                                                style={{ background: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}
                                            >
                                                <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                                                    {/* Color swatch */}
                                                    <div className="w-9 h-9 rounded-xl overflow-hidden border flex-shrink-0 cursor-pointer relative shadow-sm"
                                                        style={{ borderColor: 'var(--adm-border)' }}>
                                                        <input
                                                            type="color"
                                                            value={color.hex}
                                                            aria-label="Chọn màu"
                                                            onChange={e => handleColorChange(idx, 'hex', e.target.value)}
                                                            className="absolute -inset-2 w-14 h-14 cursor-pointer"
                                                        />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={color.name}
                                                        onChange={e => handleColorChange(idx, 'name', e.target.value)}
                                                        placeholder="Tên màu..."
                                                        className="adm-input flex-1 min-h-[40px] text-sm font-medium"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                                    {color.image && isValidImageSrc(color.image) && (
                                                        <div className="w-9 h-9 relative rounded-lg overflow-hidden border flex-shrink-0"
                                                            style={{ borderColor: 'var(--adm-border)' }}>
                                                            <Image src={color.image} alt="Color preview" fill className="object-cover" />
                                                        </div>
                                                    )}
                                                    <select
                                                        value={color.image || ''}
                                                        onChange={e => handleColorChange(idx, 'image', e.target.value)}
                                                        className="adm-select flex-1 sm:w-40 min-h-[40px] text-sm"
                                                    >
                                                        <option value="">Không có ảnh</option>
                                                        {(formData.images || []).map((img, imgIdx) =>
                                                            isValidImageSrc(img) && (
                                                                <option key={imgIdx} value={img}>Ảnh {imgIdx + 1}</option>
                                                            )
                                                        )}
                                                    </select>
                                                    <button type="button" onClick={() => handleRemoveColor(idx)}
                                                        aria-label="Xóa màu"
                                                        className="p-2 rounded-xl transition-colors flex-shrink-0"
                                                        style={{ color: 'var(--adm-danger)' }}>
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ── Variant Inventory ── */}
                                <div className="pt-4 border-t" style={{ borderColor: 'var(--adm-border)' }}>
                                    <div className="mb-3">
                                        <label className={labelCls}>Quản lý kho biến thể (Màu × Size)</label>
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--adm-text-subtle)' }}>
                                            Số lượng tồn kho cho từng kết hợp màu sắc và kích thước.
                                        </p>
                                    </div>
                                    {(!formData.colors?.length || !formData.sizes?.length) ? (
                                        <div
                                            className="p-4 rounded-2xl text-xs font-medium border"
                                            style={{ background: 'var(--adm-warning-light)', borderColor: 'var(--adm-warning)', color: 'var(--adm-warning)' }}
                                        >
                                            Vui lòng thêm ít nhất một Màu sắc và một Kích cỡ.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                                            {(formData.variants || []).map((variant, idx) => {
                                                const colorObj = formData.colors?.find(c => c.name === variant.color);
                                                const colorHex = colorObj?.hex || '#ccc';
                                                return (
                                                    <div
                                                        key={`var-${idx}`}
                                                        className={`flex flex-col gap-2 p-3 rounded-xl border transition-all relative overflow-hidden`}
                                                        style={variant.stock === 0
                                                            ? { background: 'var(--adm-danger-light)', borderColor: 'var(--adm-danger)' }
                                                            : { background: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                                                    >
                                                        {variant.stock === 0 && (
                                                            <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-bl-lg z-10">
                                                                HẾT HÀNG
                                                            </div>
                                                        )}
                                                        {/* Header: Color & Size */}
                                                        <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--adm-border)' }}>
                                                            <div
                                                                className="w-4 h-4 rounded-full flex-shrink-0 border shadow-sm"
                                                                style={{ backgroundColor: colorHex, borderColor: 'var(--adm-border)' }}
                                                            />
                                                            <span className="text-xs font-bold truncate" style={{ color: 'var(--adm-text)' }}>
                                                                {variant.color} <span className="text-gray-400 font-normal">|</span> {variant.size}
                                                            </span>
                                                        </div>
                                                        {/* Inputs */}
                                                        <div className="flex flex-col gap-2 pt-1">
                                                            <div className="flex items-center justify-between">
                                                                <label className="text-[10px] text-gray-500 font-medium">Giá bán</label>
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    value={variant.price !== undefined ? variant.price : ''}
                                                                    onChange={e => handleVariantFieldChange(idx, 'price', e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                                                                    placeholder="Theo SP"
                                                                    className="w-20 px-2 py-1.5 rounded-md border text-right text-xs outline-none focus:ring-1 focus:ring-[var(--adm-primary)] transition-all"
                                                                    style={{ background: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                                                                />
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <label className="text-[10px] text-gray-500 font-medium">Giá gốc</label>
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    value={variant.originalPrice !== undefined ? variant.originalPrice : ''}
                                                                    onChange={e => handleVariantFieldChange(idx, 'originalPrice', e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                                                                    placeholder="Tùy chọn"
                                                                    className="w-20 px-2 py-1.5 rounded-md border text-right text-xs outline-none focus:ring-1 focus:ring-[var(--adm-primary)] transition-all"
                                                                    style={{ background: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                                                                />
                                                            </div>
                                                            <div className="flex items-center justify-between mt-1">
                                                                <label className="text-[10px] text-gray-700 font-bold uppercase tracking-wider">Tồn kho</label>
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    value={variant.stock}
                                                                    onChange={e => handleVariantFieldChange(idx, 'stock', Math.max(0, Number(e.target.value)))}
                                                                    className="w-16 px-2 py-1.5 rounded-md border text-right text-xs font-bold outline-none focus:ring-2 focus:ring-[var(--adm-primary)] transition-all"
                                                                    style={variant.stock === 0
                                                                        ? { background: 'white', borderColor: 'var(--adm-danger)', color: 'var(--adm-danger)' }
                                                                        : { background: 'white', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                </div>

                                {/* ── TAB: SPECS ── */}
                                <div className={activeTab === 'specs' ? 'block space-y-6' : 'hidden'}>
                                    <div>
                                        <label className={labelCls}>Thành phần vải</label>
                                        <input
                                            value={formData.fabric?.join(', ') || ''}
                                            onChange={e => setFormData({ ...formData, fabric: e.target.value.split(',').map(s => s.trim()) })}
                                            className={inputCls}
                                            placeholder="VD: 70% Cotton, 30% Polyester"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Đặc điểm nổi bật</label>
                                        <input
                                            value={formData.features?.join(', ') || ''}
                                            onChange={e => setFormData({ ...formData, features: e.target.value.split(',').map(s => s.trim()) })}
                                            className={inputCls}
                                            placeholder="VD: Kháng khuẩn, Chống nhăn"
                                        />
                                    </div>
                                </div>

                                {/* ── TAB: SEO & TAG ── */}
                                <div className={activeTab === 'seo' ? 'block space-y-6' : 'hidden'}>
                                    <div>
                                        <label className={labelCls}>Meta Title</label>
                                        <input
                                            value={formData.seo?.title || ''}
                                            onChange={e => setFormData({ ...formData, seo: { ...formData.seo, title: e.target.value } })}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Meta Description</label>
                                        <textarea
                                            value={formData.seo?.description || ''}
                                            onChange={e => setFormData({ ...formData, seo: { ...formData.seo, description: e.target.value } })}
                                            className={inputCls}
                                            rows={3}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Từ khóa (Tags)</label>
                                        <input
                                            value={formData.tags?.join(', ') || ''}
                                            onChange={e => setFormData({ ...formData, tags: e.target.value.split(',').map(s => s.trim()) })}
                                            className={inputCls}
                                            placeholder="VD: Áo thun, Mùa hè, Basic"
                                        />
                                    </div>
                                </div>
                            </form>

                            {/* ── Sticky modal footer ── */}
                            <div
                                className="flex items-center gap-3 px-5 sm:px-6 py-4 border-t flex-shrink-0"
                                style={{ borderColor: 'var(--adm-border)', background: 'var(--adm-surface-2)' }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="adm-btn-secondary flex-1 min-h-[44px]"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    form="product-form"
                                    disabled={isSubmitting}
                                    className="adm-btn-primary flex-[2] min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <Loader2 size={17} className="animate-spin" />
                                    ) : (
                                        <Save size={17} />
                                    )}
                                    {editingProduct ? 'Cập nhật sản phẩm' : 'Lưu sản phẩm'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
