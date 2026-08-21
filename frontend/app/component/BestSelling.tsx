'use client';
// ===== BEST SELLING SECTION =====
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Flame, ArrowRight } from 'lucide-react';
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
        <section className="py-16 md:py-22 bg-[#fafafa]">
            <div className="container-torano">
                {/* Section Header - Editorial Fashion */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-neutral-200/80 gap-4">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-400">
                            MOST POPULAR DESIGNS
                        </p>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase text-neutral-950 tracking-tight mt-1">
                            Sản Phẩm Bán Chạy
                        </h2>
                    </div>

                    <Link 
                        href="/products?sort=best-selling" 
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-900 hover:text-neutral-600 transition-colors group"
                    >
                        <span>Xem tất cả sản phẩm bán chạy</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-7">
                    {products.map((product: Product, index: number) => (
                        <ProductCard key={product.id} product={product} index={index} showSold={true} />
                    ))}
                </div>
            </div>
        </section>
    );
}
