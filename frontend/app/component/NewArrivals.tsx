'use client';
// ===== NEW ARRIVALS SECTION — với icon MỚI + giá sale =====
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Sparkles, Tag } from 'lucide-react';
import { Product } from '@/types';
import { formatPrice, getProductSlug } from '@/lib/format';
import { useCart } from '@/app/component/CartContext';
import { useFavoritesStore } from '@/app/store/useFavoritesStore';
import { useAuth } from '@/app/component/AuthContext';
import toast from 'react-hot-toast';

// ─── Card riêng cho Sản Phẩm Mới Về ───────────────────────────────────────────
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

    // Tính % giảm giá
    const discount = (product.originalPrice && product.originalPrice > product.price)
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    const hasSale = discount > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.07 }}
        >
            <Link
                href={`/product/${getProductSlug(product)}`}
                className="group block h-full flex flex-col transition-all duration-400 hover:-translate-y-[6px] hover:shadow-[0_16px_36px_rgba(0,0,0,0.10)] bg-white border border-[#EAEAEA] rounded-[18px] overflow-hidden"
            >
                {/* Image area */}
                <div
                    className="relative aspect-[3/4] sm:aspect-[4/5] overflow-hidden bg-white"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {/* Ảnh 1 */}
                    <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className={`object-cover transition-all duration-700 ${isHovered ? 'opacity-0 scale-[1.08]' : 'opacity-100 scale-100'}`}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    {/* Ảnh 2 hover */}
                    <Image
                        src={product.images[1] || product.images[0]}
                        alt={product.name}
                        fill
                        className={`object-cover transition-all duration-700 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.04]'}`}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />

                    {/* ── BADGE: MỚI (luôn hiện) + SALE % (nếu có giảm giá) ─── */}
                    <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                        {/* Icon MỚI — gradient nổi bật */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wider text-white shadow-md"
                            style={{ background: 'linear-gradient(135deg, #1a8917 0%, #34c924 100%)' }}
                        >
                            <Sparkles size={9} strokeWidth={2.5} />
                            MỚI
                        </span>

                        {/* Badge SALE % nếu sản phẩm có giảm giá */}
                        {hasSale && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wider text-white shadow-md"
                                style={{ background: 'linear-gradient(135deg, #D32F2F 0%, #FF5252 100%)' }}
                            >
                                <Tag size={9} strokeWidth={2.5} />
                                -{discount}%
                            </span>
                        )}
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

                    {/* Quick Add to Cart */}
                    <AnimatePresence>
                        {isHovered && (
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 12 }}
                                transition={{ duration: 0.22, ease: 'easeOut' }}
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
                        )}
                    </AnimatePresence>
                </div>

                {/* Info */}
                <div className="p-4 space-y-1 flex-1 flex flex-col bg-white">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.12em]">
                        {product.categoryLabel}
                    </p>

                    <h3 className="text-[14px] leading-[1.5] font-semibold text-gray-900 line-clamp-2 min-h-[42px]"
                        style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
                        {product.name}
                    </h3>

                    {/* Giá — luôn hiện giá gốc gạch ngang nếu có sale */}
                    <div className="flex items-center gap-2 flex-wrap mt-auto pt-2">
                        <span className={`text-[16px] font-bold ${hasSale ? 'text-[#D32F2F]' : 'text-[#111111]'}`}>
                            {formatPrice(product.price)}
                        </span>
                        {hasSale && (
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

// ─── Section: Sản Phẩm Mới Về ────────────────────────────────────────────────
export default function NewArrivals() {
    const [products, setProducts] = React.useState<Product[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch('/api/products?limit=8');
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
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="aspect-[3/4] rounded-2xl shimmer" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

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
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-widest text-white shadow"
                                style={{ background: 'linear-gradient(135deg, #1a8917 0%, #34c924 100%)' }}
                            >
                                <Sparkles size={11} strokeWidth={2.5} />
                                MỚI NHẤT
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

                {/* Products Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                    {products.map((product: Product, index: number) => (
                        <NewArrivalCard key={product.id} product={product} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}
