'use client';
// ===== NEW ARRIVALS SECTION =====
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Product } from '@/types';
import ProductCard from './ProductCard';

export default function NewArrivals() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch('/api/products?sort=newest&limit=30');
                const data = await res.json();
                if (data.success && Array.isArray(data.products)) {
                    // Lọc sản phẩm mới nguyên giá, không phải sản phẩm giảm giá
                    const nonDiscounted = data.products.filter((p: Product) => {
                        const orig = Number(p.originalPrice) || 0;
                        const curr = Number(p.price) || 0;
                        const disc = (p as any).discount || 0;
                        const hasDiscountBadge = p.badge && (p.badge.includes('%') || p.badge.toUpperCase().includes('SALE'));
                        return disc === 0 && (orig <= curr || orig === 0) && !hasDiscountBadge;
                    });
                    
                    // Nếu có đủ sản phẩm nguyên giá thì lấy sản phẩm nguyên giá, ngược lại lấy các sản phẩm mới nhất
                    const selectedProducts = nonDiscounted.length >= 4 ? nonDiscounted : data.products;
                    setProducts(selectedProducts.slice(0, 8));
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
            <section className="py-16 bg-[#fafafa]">
                <div className="container-torano">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="aspect-square rounded-2xl shimmer bg-gray-200" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (products.length === 0) return null;

    return (
        <section id="new-arrivals" className="py-16 md:py-20 bg-white">
            <div className="container-torano">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-slate-200/80 gap-4">
                    <div>
                        <span className="text-xs font-bold text-[#1e40af] uppercase tracking-[0.25em] block mb-1.5">
                            New Arrivals · 2026
                        </span>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase text-slate-950 tracking-tight">
                            Sản Phẩm Mới Về
                        </h2>
                    </div>

                    <Link 
                        href="/products?sort=newest" 
                        className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 hover:text-[#1e40af] transition-colors group"
                    >
                        <span>Xem tất cả bộ sưu tập</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Products Grid with Exclusive "MỚI" Badge & No Discount Tags */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                    {products.map((product: Product, index: number) => (
                        <ProductCard 
                            key={product.id} 
                            product={product} 
                            index={index} 
                            showDiscount={false} 
                            forceBadge="MỚI"
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
