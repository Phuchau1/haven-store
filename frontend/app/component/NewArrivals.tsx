'use client';
// ===== NEW ARRIVALS SECTION — badge MỚI, không có sale =====
import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag } from 'lucide-react';
import { Product } from '@/types';
import { formatPrice, getProductSlug } from '@/lib/format';
import { useCart } from '@/app/component/CartContext';
import { useFavoritesStore } from '@/app/store/useFavoritesStore';
import { useAuth } from '@/app/component/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

// ─── Card riêng cho Sản Phẩm Mới Về ───────────────────────────────────────────
// - Luôn hiện badge "MỚI" (cùng style với ProductCard)
// - KHÔNG hiện badge sale, KHÔNG gạch giá, KHÔNG hiện giá gốc
function NewArrivalCard({ product, index = 0 }: { product: Product; index?: number }) {
    const [isHovered, setIsHovered] = useState(false);
    const { addItem } = useCart();
    const { isFavorite, toggleFavorite } = useFavoritesStore();
    const { user } = useAuth();
    const isLiked = isFavorite(product.id);

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(product, product.sizes?.[0], product.colors?.[0]);
        toast.success('Đã thêm vào giỏ hàng!');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.07 }}
        >
            <Link
                href={`/product/${getProductSlug(product)}`}
                className="group block h-full flex flex-col transition-all duration-400 hover:-translate-y-[6px] hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] bg-white border border-[#EAEAEA] rounded-[16px] overflow-hidden"
            >
                {/* Image */}
                <div
                    className="relative aspect-[3/4] sm:aspect-[4/5] overflow-hidden bg-white transition-all duration-400"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className={`object-cover transition-all duration-700 ${isHovered ? 'opacity-0 scale-[1.08]' : 'opacity-100 scale-100'}`}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    <Image
                        src={product.images[1] || product.images[0]}
                        alt={product.name}
                        fill
                        className={`object-cover transition-all duration-700 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.04]'}`}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />

                    {/* Badge MỚI — dùng chung style với ProductCard */}
                    <div className="absolute top-3 left-3 z-10">
                        <span className="inline-block px-2 py-1 text-[10px] uppercase font-bold rounded-md tracking-wider bg-[#2E7D32] text-white">
                            Mới
                        </span>
                    </div>

                    {/* Nút yêu thích */}
                    <motion.button
                        onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            await toggleFavorite(product, user?.id);
                            toast.success(isLiked ? 'Đã xóa khỏi yêu thích' : 'Đã thêm vào yêu thích');
                        }}
                        className={`absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${isLiked
                            ? 'bg-[#D32F2F] text-white shadow-md'
                            : 'bg-white/90 text-gray-500 opacity-0 group-hover:opacity-100 shadow-sm hover:text-[#C9A227]'
                        }`}
                        whileTap={{ scale: 0.85 }}
                        aria-label={isLiked ? 'Bỏ thích' : 'Thích sản phẩm'}
                    >
                        <Heart size={13} fill={isLiked ? 'currentColor' : 'none'} />
                    </motion.button>

                    {/* Quick Add */}
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

                {/* Info — chỉ hiện giá bán, không có giá gốc/sale */}
                <div className="p-4 space-y-1 flex-1 flex flex-col bg-white">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.12em]">
                        {product.categoryLabel}
                    </p>
                    <h3
                        className="text-[14px] leading-[1.5] font-semibold text-gray-900 line-clamp-2 min-h-[42px]"
                        style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}
                    >
                        {product.name}
                    </h3>
                    {/* Giá — chỉ hiện 1 mức giá bán, không có giá gốc */}
                    <div className="mt-auto pt-2">
                        <span className="text-[16px] font-bold text-[#111111]">
                            {formatPrice(product.price)}
                        </span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

// ─── Section chính ──────────────────────────────────────────────────────────
export default function NewArrivals() {
    const [products, setProducts] = React.useState<Product[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch('/api/products?limit=8');
                const data = await res.json();
                if (data.success) setProducts(data.products);
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
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="aspect-[3/4] rounded-2xl shimmer" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="new-arrivals" className="py-16 bg-gray-50/50">
            <div className="container-torano">
                {/* Header */}
                <div className="flex flex-col items-center justify-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <div className="flex flex-col items-center gap-1 mb-2">
                            <span className="text-sm tracking-[0.18em] uppercase text-gray-500 font-bold">
                                Mới nhất
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold uppercase text-center w-full text-black tracking-tight mb-4">
                            Sản phẩm mới về
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
                            Cập nhật những item hot nhất, trending nhất mùa này. Đặt hàng ngay trước khi hết!
                        </p>
                    </motion.div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                    {products.map((product: Product, index: number) => (
                        <NewArrivalCard key={product.id} product={product} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}
