'use client';
// ===== CATEGORY SECTION =====
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowUpRight, Loader2 } from 'lucide-react';

export default function CategorySection() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/categories');
                const data = await res.json();
                if (data.success && data.categories) {
                    setCategories(data.categories);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    if (loading) {
        return (
            <section className="py-12 lg:py-24 px-4 flex justify-center items-center">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </section>
        );
    }
    return (
        <section className="py-12 lg:py-24 px-4 container-torano">
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
                        Danh mục nổi bật
                    </h2>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xs tracking-[0.18em] uppercase text-black font-bold">
                            Khám phá phong cách
                        </span>
                        <span className="block w-full h-[2px] bg-black rounded-full" />
                    </div>
                </motion.div>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                {categories.map((cat, index) => (
                    <motion.div
                        key={cat.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: index * 0.15 }}
                    >
                        <Link href={`/products?category=${cat.id}`} className="group block relative overflow-hidden rounded-[16px] aspect-[4/5] premium-shadow-hover hover:shadow-2xl transition-all duration-400 hover:-translate-y-2">
                            {/* Image */}
                            <Image
                                src={cat.image}
                                alt={cat.name}
                                fill
                                className="object-cover transition-transform duration-400 group-hover:scale-[1.08]"
                                sizes="(max-width: 768px) 100vw, 33vw"
                            />
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent transition-colors duration-400 group-hover:bg-black/15" />

                            {/* Content */}
                            <div className="absolute bottom-0 left-0 right-0 p-8">
                                <div className="flex items-end justify-between translate-y-4 group-hover:translate-y-0 transition-transform duration-400">
                                    <div>
                                        <p className="text-white/80 text-xs tracking-[0.1em] uppercase font-bold mb-2">
                                            {cat.count} sản phẩm
                                        </p>
                                        <h3 className="text-white text-3xl font-bold tracking-tight">
                                            {cat.name}
                                        </h3>
                                    </div>
                                    <motion.div
                                        className="flex items-center justify-center w-14 h-14 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 transition-all duration-400 group-hover:bg-white group-hover:text-[#C9A227] shadow-lg"
                                    >
                                        <ArrowUpRight size={24} />
                                    </motion.div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
