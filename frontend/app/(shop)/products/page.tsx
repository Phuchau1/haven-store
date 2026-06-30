'use client';
// ===== PRODUCTS PAGE - Trang danh sách sản phẩm =====
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import { Product, FilterState } from '@/types';
import ProductCard from '@/app/component/ProductCard';
import ProductFilter from '@/app/component/ProductFilter';

export const dynamic = 'force-dynamic';

function ProductsContent() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    
    let parsedCategory = searchParams.get('category') || '';
    let parsedSubCategory = searchParams.get('subCategory') || '';
    let parsedDiscount = searchParams.get('discount') || '';
    
    if (pathname && pathname.startsWith('/collections/')) {
        const slug = pathname.replace('/collections/', '');
        parsedSubCategory = slug;
        
        // Map slug to top-level category
        if (slug.endsWith('-nam') || slug === 'nam') {
            parsedCategory = 'cat-clothing';
        } else if (slug.endsWith('-nu') || slug === 'do-nu' || slug === 'vay-dam' || slug === 'vay-lien-dam' || slug === 'chan-vay' || slug === 'tui-xach') {
            parsedCategory = 'cat-womens';
        } else if (slug === 'giay-the-thao' || slug === 'giay-da' || slug === 'dep') {
            parsedCategory = 'cat-shoes';
        } else if (slug === 'that-lung' || slug === 'vi-da' || slug === 'mu' || slug === 'tat') {
            parsedCategory = 'cat-accessories';
        }
    }

    const searchParam = searchParams.get('search');

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<FilterState>({
        category: parsedCategory,
        subCategory: parsedSubCategory,
        search: searchParam || '',
        sizes: [],
        colors: [],
        priceRange: [0, 3000000],
        sortBy: 'newest',
        discount: parsedDiscount,
    });
    
    // ✅ Đồng bộ filters với URL mỗi khi searchParams thay đổi (khi click Nam/Nữ/...)
    useEffect(() => {
        let newCategory = searchParams.get('category') || '';
        let newSubCategory = searchParams.get('subCategory') || '';
        const newDiscount = searchParams.get('discount') || '';
        const newSearch = searchParams.get('search') || '';

        if (pathname && pathname.startsWith('/collections/')) {
            const slug = pathname.replace('/collections/', '');
            newSubCategory = slug;
            if (slug.endsWith('-nam') || slug === 'nam') {
                newCategory = 'cat-clothing';
            } else if (slug.endsWith('-nu') || slug === 'do-nu' || slug === 'vay-dam' || slug === 'vay-lien-dam' || slug === 'chan-vay' || slug === 'tui-xach') {
                newCategory = 'cat-womens';
            } else if (slug === 'giay-the-thao' || slug === 'giay-da' || slug === 'dep') {
                newCategory = 'cat-shoes';
            } else if (slug === 'that-lung' || slug === 'vi-da' || slug === 'mu' || slug === 'tat') {
                newCategory = 'cat-accessories';
            }
        }

        setFilters(prev => ({
            ...prev,
            category: newCategory,
            subCategory: newSubCategory,
            discount: newDiscount,
            search: newSearch,
            // Reset client-side filters khi đổi danh mục
            sizes: [],
            colors: [],
        }));
        setCurrentPage(1);
    }, [searchParams, pathname]);
    
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const [allProducts, setAllProducts] = useState<Product[]>([]);

    // Fetch products from API (Only when server-side filters change)
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    category: filters.category,
                    sort: filters.sortBy,
                    search: filters.search || '',
                });
                if (filters.subCategory) {
                    params.append('subCategory', filters.subCategory);
                }
                if (filters.discount) {
                    params.append('discount', filters.discount);
                }
                const res = await fetch(`/api/products?${params.toString()}`);
                const data = await res.json();
                if (data.success) {
                    setAllProducts(data.products);
                }
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [filters.category, filters.subCategory, filters.sortBy, filters.search, filters.discount]);

    // Client-side filtering
    const filteredProducts = React.useMemo(() => {
        let result = allProducts;
        if (filters.sizes.length > 0) {
            result = result.filter((p: Product) => p.sizes.some((size) => filters.sizes.includes(size)));
        }
        if (filters.colors.length > 0) {
            result = result.filter((p: Product) => 
                p.colors.some((color) => 
                    filters.colors.some(fc => 
                        color.name.toLowerCase().includes(fc.toLowerCase()) || 
                        fc.toLowerCase().includes(color.name.toLowerCase())
                    )
                )
            );
        }
        result = result.filter(
            (p: Product) => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
        );
        return result;
    }, [allProducts, filters.sizes, filters.colors, filters.priceRange]);

    // Update filters when URL changes
    useEffect(() => {
        setFilters((prev) => ({
            ...prev,
            category: parsedCategory,
            subCategory: parsedSubCategory,
            search: searchParam || '',
            discount: parsedDiscount
        }));
        setCurrentPage(1); // Reset page on category/search change
    }, [parsedCategory, parsedSubCategory, searchParam, parsedDiscount]);

    // Reset page to 1 when filters change (except search/category handled above)
    useEffect(() => {
        setCurrentPage(1);
    }, [filters.sizes, filters.colors, filters.priceRange, filters.sortBy]);
    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
    const currentProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);


    const getCategoryTitle = () => {
        // Map collection slugs to beautiful titles
        if (pathname && pathname.startsWith('/collections/')) {
            const slug = pathname.replace('/collections/', '');
            const slugMap: Record<string, string> = {
                'nam': 'Thời trang Nam',
                'ao-nam': 'Áo Nam',
                'ao-so-mi-nam': 'Áo Sơ Mi Nam',
                'ao-polo-nam': 'Áo Polo Nam',
                'ao-thun-nam': 'Áo Thun / T-Shirt Nam',
                'ao-khoac-nam': 'Áo Khoác Nam',
                'quan-nam': 'Quần Nam',
                'quan-au-nam': 'Quần Âu Nam',
                'quan-jean-nam': 'Quần Jean Nam',
                'quan-kaki-nam': 'Quần Kaki Nam',
                'quan-short-nam': 'Quần Short Nam',
                'bo-do-nam': 'Bộ Đồ Nam',
                'bo-vest-nam': 'Bộ Vest Nam',
                'phu-kien-nam': 'Phụ Kiện Nam',
                'giay-da-nam': 'Giày Da Nam',
                'vi-da-nam': 'Ví Da Nam',
                'day-lung-nam': 'Dây Lưng Nam',
                'dep-nam': 'Dép Nam',
                
                'do-nu': 'Thời trang Nữ',
                'ao-nu': 'Áo Nữ',
                'ao-so-mi-nu': 'Áo Sơ Mi Nữ',
                'ao-polo-nu': 'Áo Polo Nữ',
                'ao-thun-nu': 'Áo Thun / T-Shirt Nữ',
                'ao-khoac-nu': 'Áo Khoác Nữ',
                'quan-nu': 'Quần Nữ',
                'quan-au-nu': 'Quần Âu Nữ',
                'quan-jean-nu': 'Quần Jean Nữ',
                'quan-short-nu': 'Quần Short Nữ',
                'vay-dam': 'Váy / Đầm',
                'vay-lien-dam': 'Váy Liền Đầm',
                'chan-vay': 'Chân Váy',
                'phu-kien-nu': 'Phụ Kiện Nữ',
                'giay-dep-nu': 'Giày Dép Nữ',
                'tui-xach': 'Túi Xách'
            };
            if (slugMap[slug]) return slugMap[slug];
        }

        if (filters.discount) return `Sale ${filters.discount}%`;
        if (!filters.category && !filters.search) return 'Tất cả sản phẩm';
        if (filters.search && (!pathname || !pathname.startsWith('/collections/'))) {
             return `"${filters.search}"`;
        }

        const categoryMap: Record<string, string> = {
            'quan-ao': 'Quần áo',
            'giay': 'Giày dép',
            'phu-kien': 'Phụ kiện',
            'cat-clothing': 'Quần áo',
            'cat-shoes': 'Giày dép',
            'cat-accessories': 'Phụ kiện',
            'cat-womens': 'Đồ Nữ',
        };
        return categoryMap[filters.category] || 'Sản phẩm';
    };

    const isSearchPage = filters.search && (!pathname || !pathname.startsWith('/collections/'));

    return (
        <div className="min-h-screen bg-gray-50/30">
            {/* Page Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="container-torano py-6 lg:py-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <span className="text-xs tracking-[4px] uppercase text-gray-400 font-light">
                            {isSearchPage ? 'Kết quả tìm kiếm' : 'Khám phá'}
                        </span>
                        <h1 className="mt-3 text-[20px] lg:text-[28px] font-bold uppercase text-center w-full text-black tracking-tight">
                            {getCategoryTitle()}
                        </h1>
                        <p className="mt-3 text-gray-500 text-sm font-light max-w-2xl mx-auto">
                            {filteredProducts.length} sản phẩm {isSearchPage ? 'phù hợp' : 'được tìm thấy'}
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container-torano py-8 lg:py-12">
                <div className="flex gap-8 lg:gap-14">
                    {/* Sidebar Filter - Desktop */}
                    <aside className="hidden lg:block w-64 lg:w-72 flex-shrink-0">
                        <ProductFilter
                            filters={filters}
                            setFilters={setFilters}
                            isOpen={isFilterOpen}
                            onClose={() => setIsFilterOpen(false)}
                        />
                    </aside>

                    {/* Products Grid */}
                    <div className="flex-1">
                        {/* Mobile Filter Button */}
                        <div className="lg:hidden mb-6">
                            <button
                                onClick={() => setIsFilterOpen(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                <SlidersHorizontal size={16} />
                                Bộ lọc
                                {(filters.sizes.length + filters.colors.length + (filters.category ? 1 : 0)) > 0 && (
                                    <span className="px-2 py-0.5 bg-black text-white text-xs rounded-full">
                                        {filters.sizes.length + filters.colors.length + (filters.category ? 1 : 0)}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Products */}
                        {filteredProducts.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-20"
                            >
                                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                                    <SlidersHorizontal size={28} className="text-gray-300" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-800">Không tìm thấy sản phẩm</h3>
                                <p className="text-sm text-gray-400 mt-2">
                                    Thử điều chỉnh bộ lọc hoặc tìm kiếm từ khóa khác
                                </p>
                                <button
                                    onClick={() =>
                                        setFilters({
                                            category: '',
                                            search: '',
                                            sizes: [],
                                            colors: [],
                                            priceRange: [0, 3000000],
                                            sortBy: 'newest',
                                        })
                                    }
                                    className="mt-6 px-6 py-2.5 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-900 transition-colors"
                                >
                                    Xóa bộ lọc
                                </button>
                            </motion.div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                                    {currentProducts.map((product, index) => (
                                        <ProductCard key={product.id} product={product} index={index} />
                                    ))}
                                </div>
                                
                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="mt-12 flex justify-center items-center gap-2">
                                        <button 
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
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
                                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
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
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
            <ProductsContent />
        </Suspense>
    );
}
