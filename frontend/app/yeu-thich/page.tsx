'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ArrowLeft, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFavoritesStore } from '@/app/store/useFavoritesStore';
import ProductCard from '@/app/component/ProductCard';

export default function FavoritesPage() {
    const { favorites } = useFavoritesStore();

    return (
        <div className="min-h-screen bg-white pt-28 pb-20">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb / Header */}
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-black transition-colors mb-4">
                        <ArrowLeft size={16} className="mr-2" />
                        Tiếp tục mua sắm
                    </Link>
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl sm:text-4xl font-bold uppercase flex items-center gap-3">
                            <Heart className="text-[#D32F2F]" size={36} fill="currentColor" />
                            Yêu thích
                        </h1>
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                            {favorites.length} sản phẩm
                        </span>
                    </div>
                </div>

                {favorites.length === 0 ? (
                    /* Empty State */
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 rounded-3xl border border-gray-100"
                    >
                        <div className="w-24 h-24 bg-red-50 text-red-200 rounded-full flex items-center justify-center mb-6">
                            <Heart size={48} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Chưa có sản phẩm yêu thích</h2>
                        <p className="text-gray-500 mb-8 max-w-md">
                            Bạn chưa lưu sản phẩm nào vào danh sách yêu thích. Hãy dạo quanh cửa hàng và "thả tim" những món đồ bạn thích nhé!
                        </p>
                        <Link 
                            href="/"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white rounded-full font-bold hover:bg-[#C9A227] transition-all hover:shadow-lg hover:-translate-y-1"
                        >
                            <ShoppingBag size={20} />
                            Khám phá ngay
                        </Link>
                    </motion.div>
                ) : (
                    /* Product Grid */
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
                        {favorites.map((product, index) => (
                            <ProductCard 
                                key={product.id} 
                                product={product} 
                                index={index} 
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
