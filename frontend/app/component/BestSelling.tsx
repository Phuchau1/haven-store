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
        <section className="py-16 md:py-20 bg-white">
            <div className="container-torano">
                {/* Section Header */}
                <div className="flex flex-col items-center justify-center mb-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1e40af] text-white border border-blue-900 mb-3.5 shadow-sm shadow-blue-900/20">
                            <Flame size={13} className="text-[#dc2626] fill-[#dc2626]" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">
                                XU HƯỚNG MUA SẮM
                            </span>
                        </div>

                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase text-slate-950 tracking-tight">
                            Sản Phẩm Bán Chạy
                        </h2>

                        <p className="mt-3 text-sm sm:text-base text-slate-500 max-w-xl font-normal leading-relaxed">
                            Top những thiết kế được yêu thích và săn đón nhiều nhất trong tuần
                        </p>
                    </motion.div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                    {products.map((product: Product, index: number) => (
                        <ProductCard key={product.id} product={product} index={index} showSold={true} />
                    ))}
                </div>

                {/* View All Button */}
                <div className="mt-12 text-center">
                    <Link
                        href="/products?sort=best-selling"
                        className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-white hover:bg-[#09090b] text-[#09090b] hover:text-white font-bold text-xs uppercase tracking-widest transition-all duration-300 border-2 border-[#09090b] shadow-sm hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
                    >
                        <span>Khám Phá Toàn Bộ Bán Chạy</span>
                        <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </section>
    );
}
