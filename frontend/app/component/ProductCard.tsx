'use client';
// ===== PRODUCT CARD COMPONENT =====
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag } from 'lucide-react';
import { Product } from '@/types';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/app/component/CartContext';

interface ProductCardProps {
    product: Product;
    index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const { addItem } = useCart();


    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(product, product.sizes[0], product.colors[0]);
    };

    const discount = product.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.08 }}
        >
            <Link href={`/product/${product.id}`} className="group block h-full flex flex-col transition-all duration-400 hover:-translate-y-[6px] hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] bg-white border border-[#EAEAEA] rounded-[16px] overflow-hidden">
                <div
                    className="relative aspect-[3/4] sm:aspect-[4/5] overflow-hidden bg-white transition-all duration-400"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {/* Image 1 (Default) */}
                    <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className={`object-cover transition-all duration-700 ${isHovered ? 'opacity-0 scale-[1.08]' : 'opacity-100 scale-100'}`}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    {/* Image 2 (Hover) */}
                    <Image
                        src={product.images[1] || product.images[0]}
                        alt={product.name}
                        fill
                        className={`object-cover transition-all duration-700 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.04]'}`}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />

                    {/* Badges */}
                    <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                        {product.badge && (
                            <span
                                className={`inline-block px-2 py-1 text-[10px] uppercase font-bold rounded-md tracking-wider ${
                                    product.badge === 'Sale'
                                    ? 'bg-[#D32F2F] text-white'
                                    : product.badge === 'Mới' || product.badge === 'NEW'
                                        ? 'bg-[#2E7D32] text-white'
                                        : product.badge === 'Hot' || product.badge === 'HOT'
                                            ? 'bg-[#FF6B35] text-white'
                                            : 'bg-[#111111] text-white'
                                }`}
                            >
                                {product.badge}
                            </span>
                        )}
                        {discount > 0 && (
                            <span className="inline-block px-2 py-1 text-[10px] font-bold rounded-md bg-[#D32F2F] text-white">
                                -{discount}%
                            </span>
                        )}
                    </div>

                    {/* Like Button */}
                    <motion.button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsLiked(!isLiked);
                        }}
                        className={`absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${isLiked
                            ? 'bg-[#D32F2F] text-white shadow-md'
                            : 'bg-white/90 text-gray-500 opacity-0 group-hover:opacity-100 shadow-sm hover:text-[#C9A227]'
                            }`}
                        whileTap={{ scale: 0.85 }}
                        aria-label={isLiked ? 'Bỏ thích sản phẩm' : 'Thích sản phẩm'}
                    >
                        <Heart size={13} fill={isLiked ? 'currentColor' : 'none'} />
                    </motion.button>

                    {/* Quick Add to Cart */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={isHovered ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="absolute bottom-0 left-0 right-0 z-10 px-3 pb-3"
                    >
                        <button
                            onClick={handleQuickAdd}
                            className="w-full flex items-center justify-center gap-2 h-10 bg-[#111111] text-white text-[12px] font-semibold hover:bg-[#C9A227] transition-colors duration-300 rounded-lg shadow-md"
                            style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif", letterSpacing: '0.03em' }}
                        >
                            <ShoppingBag size={13} />
                            Thêm vào giỏ
                        </button>
                    </motion.div>
                </div>

                {/* Product Info */}
                <div className="p-4 space-y-1 flex-1 flex flex-col bg-white">
                    {/* Category */}
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.12em]">{product.categoryLabel}</p>

                    {/* Name */}
                    <h3 className="text-[14px] leading-[1.5] font-semibold text-gray-900 line-clamp-2 min-h-[42px]" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
                        {product.name}
                    </h3>

                    {/* Price */}
                    <div className="flex items-center gap-2 pt-1 mt-auto">
                        <span className="text-[16px] font-bold text-[#111111]">
                            {formatPrice(product.price)}
                        </span>
                        {(product.originalPrice || 0) > 0 && (
                            <span className="text-[13px] font-normal text-[#999999] line-through">
                                {formatPrice(product.originalPrice || 0)}
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
