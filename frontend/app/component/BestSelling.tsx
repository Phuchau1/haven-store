'use client';
// ===== BEST SELLING SECTION =====
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Product } from '@/types';
import ProductCard from './ProductCard';

export default function BestSelling() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch('/api/products?sort=best-selling&limit=8');
                const data = await res.json();
                if (data.success) {
                    setProducts(data.products);
                }
            } catch (error) {
                console.error('Fetch error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    if (loading) {
        return (
            <section className="py-16 bg-white">
                <div className="container-torano">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="aspect-[3/4] rounded-2xl shimmer bg-gray-100" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (products.length === 0) return null;

    return (
        <section className="py-16 md:py-20 bg-[#f8fafc] border-y border-slate-200/80">
            <div className="container-torano">
                {/* Section Header */}
                <div className="flex items-center gap-3 mb-8 pb-3.5 border-b border-slate-200/80">
                    <div className="w-1.5 h-6 sm:h-7 bg-[#dc2626] rounded-full shrink-0" />
                    <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-bold uppercase text-slate-900 tracking-tight">
                        <span className="text-xl">🔥</span>
                        <span>SẢN PHẨM BÁN CHẠY</span>
                    </h2>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                    {products.map((product: Product, index: number) => (
                        <ProductCard key={product.id} product={product} index={index} showSold={true} />
                    ))}
                </div>
            </div>
        </section>
    );
}
