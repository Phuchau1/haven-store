'use client';
// ===== DISCOUNTED PRODUCTS SECTION =====
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Product } from '@/types';
import ProductCard from './ProductCard';

export default function DiscountedProducts() {
    const [products, setProducts] = React.useState<Product[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch('/api/products?discounted=true&limit=4');
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
            <section className="py-[30px] lg:py-[50px] bg-gray-50/50">
                <div className="container-torano">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[10px] lg:gap-[15px]">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="aspect-[3/4] rounded-2xl shimmer" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (products.length === 0) return null;

    return (
        <section className="py-16 bg-gray-50/50">
            <div className="container-torano">
                {/* Section Header */}
                <div className="flex flex-col items-center justify-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold uppercase text-center w-full text-black tracking-tight mb-5">
                            Sản phẩm khuyến mại
                        </h2>
                        <div className="flex flex-col items-center gap-1">
                            <Link
                                href="/products"
                                className="text-xs tracking-[0.18em] uppercase text-black font-bold hover:text-gray-600 transition-colors"
                            >
                                Sản phẩm giá tốt
                            </Link>
                            <span className="block w-full h-[2px] bg-black rounded-full" />
                        </div>
                    </motion.div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                    {products.map((product: Product, index: number) => (
                        <ProductCard key={product.id} product={product} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}
