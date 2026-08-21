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
                <div className="text-center mb-10 md:mb-12">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase text-slate-950 tracking-tight">
                        Sản Phẩm Bán Chạy
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
