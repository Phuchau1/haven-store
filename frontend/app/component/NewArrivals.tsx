'use client';
// ===== NEW ARRIVALS SECTION =====
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
                <div className="flex items-center gap-3 mb-8 pb-3.5 border-b border-slate-200/80">
                    <div className="w-1.5 h-6 sm:h-7 bg-[#1e40af] rounded-full shrink-0" />
                    <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-bold uppercase text-slate-900 tracking-tight">
                        <span className="text-xl">✨</span>
                        <span>SẢN PHẨM MỚI VỀ</span>
                    </h2>
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
