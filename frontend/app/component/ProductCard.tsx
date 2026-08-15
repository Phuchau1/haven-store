'use client';
// ===== PRODUCT CARD COMPONENT =====
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag } from 'lucide-react';
import { Product } from '@/types';
import { formatPrice, getProductSlug, cleanProductTitle } from '@/lib/format';
import { useCart } from '@/app/component/CartContext';
import { useFavoritesStore } from '@/app/store/useFavoritesStore';
import { useAuth } from '@/app/component/AuthContext';
import toast from 'react-hot-toast';

interface ProductCardProps {
    product: Product;
    index?: number;
    showSold?: boolean;
    showDiscount?: boolean;
    isFlashSaleCard?: boolean;
    isUpcomingFlashSale?: boolean;
}

export default function ProductCard({ 
    product, 
    index = 0, 
    showSold = false, 
    showDiscount = true,
    isFlashSaleCard = false,
    isUpcomingFlashSale = false 
}: ProductCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [selectedColor, setSelectedColor] = useState<typeof product.colors[0] | null>(null);
    const { addItem } = useCart();
    const { isFavorite, toggleFavorite } = useFavoritesStore();
    const { user } = useAuth();
    
    const isLiked = isFavorite(product.id);

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(product, product.sizes[0] || 'M', selectedColor || product.colors[0]);
        toast.success(`Đã thêm ${cleanProductTitle(product.name)} vào giỏ hàng`);
    };

    const origPrice = Number(product.originalPrice) || 0;
    const currPrice = Number(product.price) || 0;
    const discount = origPrice > currPrice
        ? Math.round(((origPrice - currPrice) / origPrice) * 100)
        : 0;

    const displayedImage = selectedColor?.image || product.images[0];
    const hoverImage = selectedColor?.image ? selectedColor.image : (product.images[1] || product.images[0]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.08 }}
        >
            <Link 
                href={`/product/${getProductSlug(product)}`} 
                className="group block h-full flex flex-col transition-all duration-400 hover:-translate-y-[6px] hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] bg-white border border-[#EAEAEA] rounded-[16px] overflow-hidden"
                onMouseLeave={() => setSelectedColor(null)}
            >
                <div
                    className="relative aspect-[3/4] sm:aspect-[4/5] overflow-hidden bg-white transition-all duration-400"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {/* Image 1 (Default) */}
                    <Image
                        src={displayedImage}
                        alt={product.name}
                        fill
                        className={`object-cover transition-all duration-700 ${isHovered ? 'opacity-0 scale-[1.08]' : 'opacity-100 scale-100'}`}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    {/* Image 2 (Hover) */}
                    <Image
                        src={hoverImage}
                        alt={product.name}
                        fill
                        className={`object-cover transition-all duration-700 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.04]'}`}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />

                    {/* Badges */}
                    <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                        {product.badge && !(showDiscount && discount > 0 && product.badge.toUpperCase().includes('SALE')) && (
                            <span
                                className={`inline-block px-2 py-1 text-[10px] uppercase font-bold rounded-md tracking-wider ${
                                    product.badge.toUpperCase() === 'MỚI' || product.badge.toUpperCase() === 'NEW'
                                        ? 'bg-[#2E7D32] text-white'
                                        : product.badge.toUpperCase() === 'HOT'
                                            ? 'bg-[#FF6B35] text-white'
                                            : 'bg-[#111111] text-white'
                                }`}
                            >
                                {product.badge}
                            </span>
                        )}
                        {showDiscount && discount > 0 && (
                            <span className="inline-block px-2 py-1 text-[10px] font-bold rounded-md bg-[#D32F2F] text-white shadow-sm">
                                -{discount}%
                            </span>
                        )}
                    </div>

                    {/* Like Button */}
                    <motion.button
                        onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            await toggleFavorite(product, user?.id);
                            if (isLiked) {
                                toast.success(`Đã xóa khỏi danh sách yêu thích`);
                            } else {
                                toast.success(`Đã thêm vào danh sách yêu thích`);
                            }
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
                <div className="p-4 space-y-1.5 flex-1 flex flex-col bg-white">
                    {/* Category */}
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.12em]">{product.categoryLabel}</p>

                    {/* Colors Swatches */}
                    {product.colors && product.colors.length > 1 ? (
                        <div className="flex items-center gap-1.5 py-0.5 z-20 min-h-[22px]">
                            {product.colors.map((color, idx) => {
                                const isActive = selectedColor ? selectedColor.name === color.name : idx === 0;
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setSelectedColor(color);
                                        }}
                                        onMouseEnter={() => setSelectedColor(color)}
                                        className={`w-3.5 h-3.5 rounded-full border border-gray-200 transition-all duration-200 ${
                                            isActive
                                                ? 'ring-1 ring-offset-1 ring-slate-800 scale-110 shadow-sm'
                                                : 'hover:scale-110'
                                        }`}
                                        style={{ backgroundColor: color.hex }}
                                        title={color.name}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-[22px]" />
                    )}

                    {/* Name */}
                    <h3 className="text-[14px] leading-[1.5] font-semibold text-gray-900 line-clamp-2 min-h-[42px]" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
                        {cleanProductTitle(product.name)}
                    </h3>

                    {/* Price & Sold section */}
                    <div className="flex flex-col mt-auto pt-1 w-full">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[16px] font-bold ${isFlashSaleCard ? 'text-[#D32F2F]' : 'text-[#111111]'}`}>
                                    {isUpcomingFlashSale ? (
                                        (() => {
                                            const str = Math.round(product.price).toString();
                                            const firstDigit = str[0] || '2';
                                            return `₫${firstDigit}??.000`;
                                        })()
                                    ) : (
                                        formatPrice(product.price)
                                    )}
                                </span>
                                {(product.originalPrice || 0) > product.price && (
                                    <span className="text-[13px] font-normal text-[#999999] line-through">
                                        {formatPrice(product.originalPrice || 0)}
                                    </span>
                                )}
                            </div>
                            {!isFlashSaleCard && showSold && product.soldQuantity !== undefined && (
                                <span className="text-[11px] text-gray-500 font-medium bg-gray-50 px-2 py-0.5 rounded">
                                    Đã bán: {product.soldQuantity}
                                </span>
                            )}
                        </div>

                        {/* Shopee-style Flash Sale Progress Pill */}
                        {isFlashSaleCard && (
                            (() => {
                                if (isUpcomingFlashSale) {
                                    return (
                                        <div className="mt-3 w-full">
                                            <div className="relative w-full h-[22px] bg-[#fff2ec] border border-[#ff8b66]/60 rounded-full overflow-hidden flex items-center justify-center shadow-sm">
                                                <span className="relative z-10 text-[11px] font-black uppercase text-[#ee4d2d] tracking-wider flex items-center gap-1">
                                                    ⏰ SẮP MỞ BÁN
                                                </span>
                                            </div>
                                        </div>
                                    );
                                }

                                const soldCount = product.flashSaleSold !== undefined ? product.flashSaleSold : (product.soldQuantity || 0);
                                const totalCount = product.flashSaleStock !== undefined && product.flashSaleStock > 0 ? product.flashSaleStock : (soldCount + 20);
                                const percentSold = totalCount > 0 ? Math.min(Math.round((soldCount / totalCount) * 100), 100) : 15;
                                const displayPercent = Math.max(percentSold, 14);

                                const label = soldCount > 0 
                                    ? (percentSold >= 90 ? `🔥 SẮP CHÁY HÀNG (${soldCount})` : `ĐÃ BÁN ${soldCount}`)
                                    : 'ĐANG BÁN CHẠY';

                                return (
                                    <div className="mt-3 w-full">
                                        <div className="relative w-full h-[22px] bg-[#ffc5b2] rounded-full overflow-hidden flex items-center justify-center shadow-inner">
                                            {/* Orange / Red gradient fill */}
                                            <div 
                                                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#ff424e] via-[#ff5b36] to-[#ff7832] rounded-full transition-all duration-700" 
                                                style={{ width: `${displayPercent}%` }}
                                            />
                                            
                                            {/* Fire icon on left edge */}
                                            <span className="absolute left-1.5 z-10 text-[11px] select-none">
                                                🔥
                                            </span>

                                            {/* Centered Bold Text */}
                                            <span className="relative z-10 text-[11px] font-black uppercase text-white tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                                                {label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
