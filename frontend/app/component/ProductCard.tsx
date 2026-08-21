'use client';
// ===== UNIFIED PREMIUM PRODUCT CARD COMPONENT =====
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Sparkles, Flame, Truck } from 'lucide-react';
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
    forceBadge?: string;
}

export default function ProductCard({ 
    product, 
    index = 0, 
    showSold = false, 
    showDiscount = true,
    isFlashSaleCard = false,
    isUpcomingFlashSale = false,
    forceBadge
}: ProductCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [selectedColor, setSelectedColor] = useState<any>(null);
    const router = useRouter();
    const { addItem } = useCart();
    const { isFavorite, toggleFavorite } = useFavoritesStore();
    const { user } = useAuth();
    
    const isLiked = isFavorite(product.id);

    const origPrice = Number(product.originalPrice) || 0;
    const currPrice = Number(product.price) || 0;
    const discount = (product as any).discount || (
        origPrice > currPrice
            ? Math.round(((origPrice - currPrice) / origPrice) * 100) 
            : 0
    );

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const firstSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'M';
        const firstColor = product.colors && product.colors.length > 0 ? product.colors[0] : { name: 'Mặc định', hex: '#000000' };

        addItem(product, firstSize, selectedColor || firstColor);
        toast.success(`Đã thêm ${cleanProductTitle(product.name)} vào giỏ hàng`);
    };

    const displayedImage = selectedColor?.image || product.images?.[0] || '/haven-logo.png';
    const hoverImage = selectedColor?.image ? selectedColor.image : (product.images?.[1] || product.images?.[0] || '/haven-logo.png');
    const badgeText = forceBadge || product.badge;

    return (
        <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="h-full"
        >
            <Link 
                href={isUpcomingFlashSale ? `/product/${getProductSlug(product)}?slot=upcoming` : `/product/${getProductSlug(product)}`} 
                className={`group block h-full flex flex-col transition-all duration-300 hover:-translate-y-1 bg-white border rounded-2xl overflow-hidden shadow-xs hover:shadow-md ${
                    isFlashSaleCard || (showDiscount && discount > 0)
                        ? 'border-slate-200 hover:border-[#dc2626]'
                        : 'border-slate-200 hover:border-[#1e40af]'
                }`}
                onMouseLeave={() => setSelectedColor(null)}
            >
                {/* ── PRODUCT IMAGE CONTAINER (WIDER & SHORTER 1:1 RATIO) ── */}
                <div
                    className="relative aspect-square overflow-hidden bg-[#f8fafc] transition-all duration-300"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {/* Default Image */}
                    <Image
                        src={displayedImage}
                        alt={product.name}
                        fill
                        className={`object-cover transition-all duration-500 ${isHovered ? 'opacity-0 scale-[1.04]' : 'opacity-100 scale-100'}`}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    {/* Hover Image */}
                    <Image
                        src={hoverImage}
                        alt={product.name}
                        fill
                        className={`object-cover transition-all duration-500 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]'}`}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />

                    {/* Badges Overlay (Strict 4-Color Brand Palette) */}
                    <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5 pointer-events-none">
                        {badgeText && !(showDiscount && discount > 0 && badgeText.toUpperCase().includes('SALE')) && (
                            <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10.5px] uppercase font-black rounded-md tracking-wider shadow-2xs ${
                                    badgeText.toUpperCase() === 'MỚI' || badgeText.toUpperCase() === 'NEW'
                                        ? 'bg-[#1e40af] text-white'
                                        : badgeText.toUpperCase().includes('FREESHIP')
                                            ? 'bg-[#1e40af] text-white'
                                            : badgeText.toUpperCase() === 'HOT' || badgeText.toUpperCase().includes('CHẠY')
                                                ? 'bg-[#d97706] text-white'
                                                : 'bg-[#1e40af] text-white'
                                }`}
                            >
                                {badgeText.toUpperCase().includes('FREESHIP') && (
                                    <Truck size={11} className="shrink-0" />
                                )}
                                {(badgeText.toUpperCase() === 'HOT' || badgeText.toUpperCase().includes('CHẠY')) && (
                                    <Flame size={11} className="shrink-0 fill-white" />
                                )}
                                <span>{badgeText}</span>
                            </span>
                        )}
                        {showDiscount && discount > 0 && (
                            <span className="inline-block px-2.5 py-0.5 text-[10.5px] font-black rounded-md bg-[#dc2626] text-white">
                                -{discount}%
                            </span>
                        )}
                    </div>

                    {/* Wishlist Like Button */}
                    <motion.button
                        onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!user) {
                                toast.error('Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích!');
                                router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
                                return;
                            }
                            await toggleFavorite(product, user.id);
                            if (isLiked) {
                                toast.success(`Đã xóa khỏi yêu thích`);
                            } else {
                                toast.success(`Đã thêm vào yêu thích`);
                            }
                        }}
                        className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${
                            isLiked
                                ? 'bg-[#dc2626] text-white shadow-md'
                                : 'bg-white/90 text-gray-600 opacity-0 group-hover:opacity-100 shadow-sm hover:text-[#dc2626] hover:bg-white'
                        }`}
                        whileTap={{ scale: 0.85 }}
                        aria-label={isLiked ? 'Bỏ thích' : 'Thích sản phẩm'}
                    >
                        <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
                    </motion.button>

                    {/* Quick Add Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={isHovered ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-0 left-0 right-0 z-10 px-2.5 pb-2.5"
                    >
                        <button
                            onClick={handleQuickAdd}
                            className="w-full flex items-center justify-center gap-1.5 h-9 bg-slate-950 hover:bg-[#0f172a] text-white text-[12.5px] font-bold transition-all duration-300 rounded-xl shadow-lg cursor-pointer"
                        >
                            <ShoppingBag size={13} />
                            Thêm vào giỏ
                        </button>
                    </motion.div>
                </div>

                {/* ── PRODUCT DETAILS (COMPACT & BALANCED) ── */}
                <div className="p-3 sm:p-3.5 flex-1 flex flex-col bg-white">
                    {/* Category & Swatches Row */}
                    <div className="flex items-center justify-between gap-2 min-h-[22px]">
                        <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider truncate">
                            {product.categoryLabel || product.category || 'THỜI TRANG'}
                        </p>

                        {/* Colors Swatches (Kích thước vừa phải, thanh lịch) */}
                        {product.colors && product.colors.length > 1 && (
                            <div className="flex items-center gap-1.5 shrink-0 py-0.5">
                                {product.colors.slice(0, 5).map((color, idx) => {
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
                                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-gray-300 transition-all duration-200 cursor-pointer ${
                                                isActive
                                                    ? 'ring-1.5 ring-offset-1 ring-slate-800 scale-105 shadow-xs'
                                                    : 'hover:scale-110 hover:border-slate-500 opacity-90 hover:opacity-100'
                                            }`}
                                            style={{ backgroundColor: color.hex }}
                                            title={color.name}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Product Name (Bold & Easy to Read) */}
                    <h3 className={`text-[14px] sm:text-[14.5px] font-bold text-slate-900 leading-snug line-clamp-2 min-h-[38px] mt-1 transition-colors ${
                        isFlashSaleCard || (showDiscount && discount > 0)
                            ? 'group-hover:text-[#dc2626]'
                            : 'group-hover:text-[#1e40af]'
                    }`}>
                        {cleanProductTitle(product.name)}
                    </h3>

                    {/* Price Section */}
                    <div className="flex flex-col mt-auto pt-1.5 w-full">
                        <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                                <span className={`text-[16.5px] sm:text-[17.5px] font-black tracking-tight ${isFlashSaleCard || (showDiscount && discount > 0) ? 'text-[#dc2626]' : 'text-[#0f172a]'}`}>
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
                                {showDiscount && (product.originalPrice || 0) > product.price && (
                                    <span className="text-[13px] sm:text-[13.5px] font-normal text-gray-400 line-through">
                                        {formatPrice(product.originalPrice || 0)}
                                    </span>
                                )}
                            </div>
                            {!isFlashSaleCard && showSold && product.soldQuantity !== undefined && (
                                <span className="text-[11px] text-gray-600 font-semibold bg-gray-100 px-2 py-0.5 rounded-md">
                                    Đã bán {product.soldQuantity}
                                </span>
                            )}
                        </div>

                        {/* Flash Sale Progress Pill */}
                        {isFlashSaleCard && (
                            (() => {
                                if (isUpcomingFlashSale) {
                                    return (
                                        <div className="mt-3 w-full">
                                            <div className="relative w-full h-[23px] bg-[#fff2ec] border border-[#ff8b66]/60 rounded-full overflow-hidden flex items-center justify-center shadow-sm">
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
                                    <div className="mt-3.5 w-full">
                                        <div className="relative w-full h-[18px] sm:h-[19px]">
                                            {/* Background pill track */}
                                            <div className="w-full h-full bg-[#ffc5b2] rounded-full overflow-hidden flex items-center justify-center shadow-inner relative">
                                                {/* Red / Orange active sold progress gradient */}
                                                <div 
                                                    className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#e01424] via-[#f7431e] to-[#ff6b35] rounded-full transition-all duration-700 shadow-xs" 
                                                    style={{ width: `${displayPercent}%` }}
                                                />

                                                {/* Centered Bold Text */}
                                                <span className="relative z-10 text-[10.5px] sm:text-[11px] font-black uppercase text-white tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] pl-3.5">
                                                    {label}
                                                </span>
                                            </div>

                                            {/* Prominent Large Fire Emoji protruding outside the top-left */}
                                            <span className="absolute -left-1 -top-1.5 z-20 text-[17px] sm:text-[18px] leading-none select-none drop-shadow-[0_2px_4px_rgba(238,77,45,0.4)] pointer-events-none filter saturate-150">
                                                🔥
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
