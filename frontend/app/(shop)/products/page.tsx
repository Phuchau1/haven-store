'use client';
// ===== PRODUCTS PAGE - Trang danh sách sản phẩm =====
import React, { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import { Product, FilterState } from '@/types';
import ProductCard from '@/app/component/ProductCard';
import ProductFilter from '@/app/component/ProductFilter';

export const dynamic = 'force-dynamic';

// ── Helper: đọc category/subCategory từ URL hoặc pathname ───────────────────
function parseCategoryFromUrl(searchParams: URLSearchParams, pathname: string) {
    let category = searchParams.get('category') || '';
    let subCategory = searchParams.get('subCategory') || '';

    const isCollection = pathname?.startsWith('/collections/');
    const isPromo = pathname?.startsWith('/khuyen-mai/');
    if (isCollection || isPromo) {
        const slug = isCollection ? pathname.replace('/collections/', '') : pathname.replace('/khuyen-mai/', '');
        if (slug === 'sale' || slug === 'giam-gia' || slug.startsWith('giam-gia-')) {
            category = '';
            subCategory = '';
        } else {
            subCategory = (slug === 'nam' || slug === 'do-nu') ? '' : slug;

            if (slug === 'nam' || slug.endsWith('-nam')) category = 'cat-clothing';
            else if (
                slug === 'do-nu' || slug.endsWith('-nu') ||
                ['vay-dam', 'vay-lien-dam', 'chan-vay', 'tui-xach'].includes(slug)
            ) category = 'cat-womens';
            else if (['giay-the-thao', 'giay-da', 'dep'].includes(slug)) category = 'cat-shoes';
            else if (['that-lung', 'vi-da', 'mu', 'tat'].includes(slug)) category = 'cat-accessories';
        }
    }
    return { category, subCategory };
}

// ── Tiêu đề trang dựa trên bộ lọc ───────────────────────────────────────────
function getCategoryTitle(filters: FilterState, pathname: string) {
    const isCollection = pathname?.startsWith('/collections/');
    const isPromo = pathname?.startsWith('/khuyen-mai/');
    if (isCollection || isPromo) {
        const slug = isCollection ? pathname.replace('/collections/', '') : pathname.replace('/khuyen-mai/', '');
        if (slug === 'sale' || slug === 'giam-gia') {
            return 'Danh Mục Sale';
        }
        if (slug.startsWith('giam-gia-')) {
            const pct = slug.split('-').pop();
            return `Ưu đãi giảm ${pct}%+`;
        }
        const slugMap: Record<string, string> = {
            'nam': 'Thời trang Nam', 'ao-nam': 'Áo Nam', 'ao-so-mi-nam': 'Áo Sơ Mi Nam',
            'ao-polo-nam': 'Áo Polo Nam', 'ao-thun-nam': 'Áo Thun / T-Shirt Nam',
            'ao-khoac-nam': 'Áo Khoác Nam', 'quan-nam': 'Quần Nam', 'quan-au-nam': 'Quần Âu Nam',
            'quan-jean-nam': 'Quần Jean Nam', 'quan-kaki-nam': 'Quần Kaki Nam',
            'quan-short-nam': 'Quần Short Nam', 'bo-do-nam': 'Bộ Đồ Nam',
            'bo-vest-nam': 'Bộ Vest Nam', 'phu-kien-nam': 'Phụ Kiện Nam',
            'giay-da-nam': 'Giày Da Nam', 'vi-da-nam': 'Ví Da Nam',
            'day-lung-nam': 'Dây Lưng Nam', 'dep-nam': 'Dép Nam',
            'do-nu': 'Thời trang Nữ', 'ao-nu': 'Áo Nữ', 'ao-so-mi-nu': 'Áo Sơ Mi Nữ',
            'ao-polo-nu': 'Áo Polo Nữ', 'ao-thun-nu': 'Áo Thun / T-Shirt Nữ',
            'ao-khoac-nu': 'Áo Khoác Nữ', 'quan-nu': 'Quần Nữ', 'quan-au-nu': 'Quần Âu Nữ',
            'quan-jean-nu': 'Quần Jean Nữ', 'quan-short-nu': 'Quần Short Nữ',
            'vay-dam': 'Váy / Đầm', 'vay-lien-dam': 'Váy Liền Đầm', 'chan-vay': 'Chân Váy',
            'phu-kien-nu': 'Phụ Kiện Nữ', 'giay-dep-nu': 'Giày Dép Nữ', 'tui-xach': 'Túi Xách'
        };
        if (slugMap[slug]) return slugMap[slug];
    }
    if (filters.discount) return `Sale ${filters.discount}%`;
    if (filters.search) return `"${filters.search}"`;
    const catMap: Record<string, string> = {
        'cat-clothing': 'Đồ Nam', 'cat-womens': 'Đồ Nữ',
        'cat-shoes': 'Giày Dép', 'cat-accessories': 'Phụ Kiện',
        'quan-ao': 'Quần Áo', 'giay': 'Giày Dép', 'phu-kien': 'Phụ Kiện',
    };
    if (filters.category) return catMap[filters.category] || 'Sản phẩm';
    return 'Tất cả sản phẩm';
}

// ── DEFAULT filter ───────────────────────────────────────────────────────────
const DEFAULT_FILTER: FilterState = {
    category: '',
    subCategory: '',
    search: '',
    sizes: [],
    colors: [],
    priceRange: [0, 10000000],
    sortBy: 'newest',
    discount: '',
};

function ProductsContent() {
    const searchParams = useSearchParams();
    const pathname = usePathname() || '';

    // ── Tạo filter ban đầu từ URL ─────────────────────────────────────────
    const getInitialFilters = useCallback((): FilterState => {
        const { category, subCategory } = parseCategoryFromUrl(searchParams, pathname);
        return {
            ...DEFAULT_FILTER,
            category,
            subCategory,
            search: searchParams.get('search') || '',
            discount: (pathname === '/collections/sale' || pathname === '/khuyen-mai/giam-gia' || pathname.startsWith('/khuyen-mai/giam-gia-'))
                ? (pathname.includes('giam-gia-') ? pathname.split('giam-gia-')[1] : 'true')
                : (searchParams.get('discount') || ''),
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // chỉ chạy 1 lần khi mount

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<FilterState>(getInitialFilters);
    const [currentPage, setCurrentPage] = useState(1);
    const [allProducts, setAllProducts] = useState<Product[]>([]);

    const itemsPerPage = 12;
    const isSearchPage = !!filters.search && !pathname?.startsWith('/collections/');

    // ── Đồng bộ filter khi URL thay đổi (click menu nav) ─────────────────
    useEffect(() => {
        const { category, subCategory } = parseCategoryFromUrl(searchParams, pathname);
        setFilters(prev => ({
            ...prev,
            category,
            subCategory,
            search: searchParams.get('search') || '',
            discount: (pathname === '/collections/sale' || pathname === '/khuyen-mai/giam-gia' || pathname.startsWith('/khuyen-mai/giam-gia-'))
                ? (pathname.includes('giam-gia-') ? pathname.split('giam-gia-')[1] : 'true')
                : (searchParams.get('discount') || ''),
            // Reset client-side filters khi đổi danh mục từ URL
            sizes: [],
            colors: [],
                    priceRange: [0, 10000000],
        }));
        setCurrentPage(1);
    }, [searchParams, pathname]);

    // ── Fetch sản phẩm khi server-filter thay đổi ─────────────────────────
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (filters.category) params.set('category', filters.category);
                if (filters.subCategory) params.set('subCategory', filters.subCategory);
                if (filters.search) params.set('search', filters.search);
                if (filters.discount) params.set('discount', filters.discount);
                params.set('sort', filters.sortBy);

                const res = await fetch(`/api/products?${params.toString()}`);
                const data = await res.json();
                if (data.success) setAllProducts(data.products);
            } catch (err) {
                console.error('Lỗi khi tải sản phẩm:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [filters.category, filters.subCategory, filters.search, filters.discount, filters.sortBy]);

    // ── Reset trang khi client-filter thay đổi ────────────────────────────
    useEffect(() => {
        setCurrentPage(1);
    }, [filters.sizes, filters.colors, filters.priceRange]);

    // ── Lọc phía client (size, màu, giá) ─────────────────────────────────
    const filteredProducts = useMemo(() => {
        let result = allProducts;
        if (filters.sizes.length > 0) {
            result = result.filter(p => p.sizes.some(s => filters.sizes.includes(s)));
        }
        if (filters.colors.length > 0) {
            result = result.filter(p =>
                p.colors.some(c =>
                    filters.colors.some(fc =>
                        c.name.toLowerCase().includes(fc.toLowerCase()) ||
                        fc.toLowerCase().includes(c.name.toLowerCase())
                    )
                )
            );
        }
        result = result.filter(p => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]);
        return result;
    }, [allProducts, filters.sizes, filters.colors, filters.priceRange]);

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
    const currentProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const title = getCategoryTitle(filters, pathname);

    return (
        <div className="min-h-screen bg-gray-50/30">
            {/* Page Header (Compact & Bold) */}
            <div className="bg-white border-b border-slate-150">
                <div className="container-torano py-4 lg:py-5">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="text-center"
                    >
                        <span className="text-[11px] tracking-[3px] uppercase text-slate-400 font-bold">
                            {isSearchPage ? 'Kết quả tìm kiếm' : 'Khám phá'}
                        </span>
                        <h1 className="mt-1.5 text-2xl lg:text-3xl font-black uppercase text-center w-full text-slate-950 tracking-tight">
                            {title}
                        </h1>
                        <p className="mt-1 text-slate-500 text-xs font-medium max-w-2xl mx-auto">
                            {loading ? 'Đang tải...' : `${filteredProducts.length} sản phẩm ${isSearchPage ? 'phù hợp' : 'được tìm thấy'}`}
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container-torano py-5 lg:py-7">
                <div className="flex gap-6 lg:gap-8">

                    {/* Sidebar Filter — Desktop */}
                    <aside className="hidden lg:block w-60 lg:w-64 flex-shrink-0">
                        <ProductFilter
                            filters={filters}
                            setFilters={setFilters}
                            isOpen={false}
                            onClose={() => {}}
                        />
                    </aside>

                    {/* Products Grid */}
                    <div className="flex-1 min-w-0">
                        {/* Mobile Filter Button */}
                        <div className="lg:hidden mb-4">
                            <button
                                onClick={() => setIsFilterOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors shadow-2xs"
                            >
                                <SlidersHorizontal size={15} />
                                Bộ lọc
                                {(filters.sizes.length + filters.colors.length + (filters.category ? 1 : 0)) > 0 && (
                                    <span className="px-2 py-0.5 bg-black text-white text-[10px] rounded-full font-black">
                                        {filters.sizes.length + filters.colors.length + (filters.category ? 1 : 0)}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Loading Skeleton */}
                        {loading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-4.5">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-150 animate-pulse">
                                        <div className="aspect-square bg-slate-100" />
                                        <div className="p-3 space-y-2">
                                            <div className="h-3 bg-slate-100 rounded w-3/4" />
                                            <div className="h-3 bg-slate-100 rounded w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-16"
                            >
                                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                                    <SlidersHorizontal size={24} className="text-slate-400" />
                                </div>
                                <h3 className="text-base font-bold text-slate-800">Không tìm thấy sản phẩm</h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Thử điều chỉnh bộ lọc hoặc tìm kiếm từ khóa khác
                                </p>
                                <button
                                    onClick={() => setFilters(prev => ({
                                        ...prev,
                                        sizes: [],
                                        colors: [],
                                        priceRange: [0, 10000000],
                                    }))}
                                    className="mt-4 px-5 py-2 bg-black text-white rounded-full text-xs font-bold hover:bg-slate-900 transition-colors cursor-pointer"
                                >
                                    Xóa bộ lọc
                                </button>
                            </motion.div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-4.5">
                                    {currentProducts.map((product, index) => (
                                        <ProductCard key={product.id} product={product} index={index} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="mt-12 flex justify-center items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                                        </button>
                                        {Array.from({ length: totalPages }).map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentPage(i + 1)}
                                                className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                                                    currentPage === i + 1
                                                        ? 'bg-black text-white'
                                                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filter Drawer */}
            <div className="lg:hidden">
                <ProductFilter
                    filters={filters}
                    setFilters={setFilters}
                    isOpen={isFilterOpen}
                    onClose={() => setIsFilterOpen(false)}
                />
            </div>
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ProductsContent />
        </Suspense>
    );
}
