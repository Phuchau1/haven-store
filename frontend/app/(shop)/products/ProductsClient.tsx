'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import { Product, FilterState } from '@/types';
import ProductCard from '@/app/component/ProductCard';
import ProductFilter from '@/app/component/ProductFilter';

export default function ProductsClient() {
    const searchParams = useSearchParams();
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<FilterState>({
        category: categoryParam || '',
        search: searchParam || '',
        sizes: [],
        colors: [],
        priceRange: [0, 3000000],
        sortBy: 'newest',
    });

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    category: filters.category,
                    sort: filters.sortBy,
                    search: filters.search || '',
                });
                const res = await fetch(`/api/products?${params.toString()}`);
                const data = await res.json();
                if (data.success) {
                    let result = data.products;

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

                    setProducts(result);
                }
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [filters.category, filters.sortBy, filters.sizes, filters.colors, filters.priceRange, filters.search]);

    useEffect(() => {
        setFilters((prev) => ({
            ...prev,
            category: categoryParam || '',
            search: searchParam || ''
        }));
    }, [categoryParam, searchParam]);

    const filteredProducts = products;

    const getCategoryTitle = () => {
        if (!filters.category) return 'Tất cả sản phẩm';
        const categoryMap: Record<string, string> = {
            'quan-ao': 'Quần áo',
            'giay': 'Giày dép',
            'phu-kien': 'Phụ kiện',
            'cat-clothing': 'Quần áo',
            'cat-shoes': 'Giày dép',
            'cat-accessories': 'Phụ kiện',
        };
        return categoryMap[filters.category] || 'Sản phẩm';
    };

    return (
        <div className="min-h-screen bg-gray-50/30">
            <div className="bg-white border-b border-gray-100">
                <div className="container-torano py-3 lg:py-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <span className="text-xs tracking-[4px] uppercase text-gray-400 font-light">
                            {filters.search ? 'Kết quả tìm kiếm' : 'Khám phá'}
                        </span>
                        <h1 className="mt-1.5 text-[20px] lg:text-[28px] font-bold uppercase text-center w-full text-black tracking-tight">
                            {filters.search ? `"${filters.search}"` : getCategoryTitle()}
                        </h1>
                        <p className="mt-1.5 text-gray-500 text-sm font-light max-w-2xl mx-auto">
                            {filteredProducts.length} sản phẩm {filters.search ? 'phù hợp' : 'được tìm thấy'}
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="container-torano pt-2 pb-8 lg:pt-4 lg:pb-12">
                <div className="flex gap-8">
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <ProductFilter
                            filters={filters}
                            setFilters={setFilters}
                            isOpen={isFilterOpen}
                            onClose={() => setIsFilterOpen(false)}
                        />
                    </aside>

                    <div className="flex-1">
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
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-[10px] lg:gap-[15px]">
                                {filteredProducts.map((product, index) => (
                                    <ProductCard key={product.id} product={product} index={index} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

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
