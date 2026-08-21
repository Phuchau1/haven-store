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
        <section id="new-arrivals" className="py-16 md:py-20 bg-[#fafafa]">
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
                        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#1e40af] text-white border border-blue-900 mb-3.5 shadow-sm shadow-blue-900/20">
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">
                                BỘ SƯU TẬP MỚI NHẤT
                            </span>
                        </div>

                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase text-slate-950 tracking-tight">
                            Sản Phẩm Mới Về
                        </h2>

                        <p className="mt-3 text-sm sm:text-base text-slate-500 max-w-xl font-normal leading-relaxed">
                            Cập nhật những thiết kế mới nhất với phong cách hiện đại và chất liệu cao cấp
                        </p>
                    </motion.div>
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
