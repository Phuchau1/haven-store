'use client';
// ===== PRODUCT DETAIL PAGE =====
import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Heart, Star, Truck, RefreshCw, Shield, ChevronLeft, Check, Loader2, Sparkles, Zap, Clock, Tag, Bell } from 'lucide-react';
import ImageZoom from '@/app/component/ImageZoom';
import { formatPrice, slugify, getProductSlug, cleanProductTitle } from '@/lib/format';
import { useCart } from '@/app/component/CartContext';
import { Product, Color } from '@/types';
import ProductCard from '@/app/component/ProductCard';
import ProductTabs from '@/app/component/ProductTabs';
import { useRecentlyViewed } from '@/app/hooks/useRecentlyViewed';
import RecentlyViewed from '@/app/component/RecentlyViewed';
import { useAuth } from '@/app/component/AuthContext';
import { useCartStore } from '@/app/store/useCartStore';
import { useFavoritesStore } from '@/app/store/useFavoritesStore';
import { useToast } from '@/app/component/ToastProvider';
const COLOR_CLASS_MAP: Record<string, string> = {
    'Đen': 'bg-black',
    'Trắng': 'bg-white',
    'Xanh': 'bg-blue-500',
    'Xanh dương': 'bg-blue-500',
    'Xanh navy': 'bg-slate-900',
    'Đỏ': 'bg-red-600',
    'Hồng': 'bg-pink-400',
    'Vàng': 'bg-yellow-400',
    'Nâu': 'bg-amber-700',
    'Be': 'bg-amber-100',
    'Ghi': 'bg-slate-400',
    'Xám': 'bg-slate-400',
    'Kem': 'bg-amber-100',
    'Tím': 'bg-violet-500',
};

const getColorSwatchClass = (colorName: string) => COLOR_CLASS_MAP[colorName] ?? 'bg-slate-200';

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isUpcomingSlot = searchParams?.get('slot') === 'upcoming';

    const { addItem, closeCart } = useCart();
    const { showToast } = useToast();

    const [product, setProduct] = useState<Product | any>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFlashSale, setActiveFlashSale] = useState<any>(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState<Color | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [showAddedNotification, setShowAddedNotification] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 22, seconds: 10 });
    const [isReminded, setIsReminded] = useState(false);

    const { user } = useAuth();
    const { isFavorite, toggleFavorite } = useFavoritesStore();
    const isFav = product?.id ? isFavorite(product.id) : false;

    const handleToggleWishlist = async () => {
        if (!product) return;
        if (!user) {
            showToast('Vui lòng đăng nhập để lưu sản phẩm vào danh sách yêu thích!', 'warning', 'Cần đăng nhập');
            router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
            return;
        }
        await toggleFavorite(product, user.id);
        if (isFav) {
            showToast('Đã xóa sản phẩm khỏi danh sách yêu thích', 'info', 'Đã xóa yêu thích');
        } else {
            showToast('Đã thêm sản phẩm vào danh sách yêu thích', 'success', 'Đã lưu yêu thích');
        }
    };

    const handleToggleReminder = async () => {
        if (!product) return;
        const nextState = !isReminded;
        setIsReminded(nextState);

        if (nextState) {
            if (typeof window !== 'undefined') {
                localStorage.setItem(`haven_flash_sale_reminder_${product.id}`, 'true');
                // Xin quyền Browser Native Notification
                if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                    try {
                        await Notification.requestPermission();
                    } catch (e) {
                        console.log('Notification permission request skipped', e);
                    }
                }
            }

            // Gọi API lưu đăng ký lên server
            try {
                await fetch('/api/flash-sales/remind', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        productId: product.id,
                        productName: product.name,
                        userId: user?.id,
                        email: user?.email
                    })
                });
            } catch (e) {
                console.log('Server reminder sync error', e);
            }

            showToast(
                'Đã đặt nhắc nhở mở bán lúc 00:00 ngày mai! Hệ thống sẽ thông báo ngay khi đợt sale kích hoạt.',
                'success',
                '🔔 Đã Đặt Nhắc Nhở'
            );

            // Native notification nếu có quyền
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                try {
                    new Notification('HAVEN STORE — Đã Đặt Nhắc Nhở!', {
                        body: `Bạn sẽ nhận được thông báo khi sản phẩm "${product.name}" mở bán giá sốc vào ngày mai!`,
                        icon: '/favicon.svg'
                    });
                } catch (e) {
                    console.log('Native notification error', e);
                }
            }
        } else {
            if (typeof window !== 'undefined') {
                localStorage.removeItem(`haven_flash_sale_reminder_${product.id}`);
            }
            showToast('Đã hủy nhắc nhở mở bán cho sản phẩm này.', 'info', 'Đã Hủy Nhắc Nhở');
        }
    };

    const { addProduct } = useRecentlyViewed(user?.id);

    useEffect(() => {
        if (typeof window !== 'undefined' && product?.id) {
            const saved = localStorage.getItem(`haven_flash_sale_reminder_${product.id}`);
            if (saved) setIsReminded(true);
        }
    }, [product?.id]);

    useEffect(() => {
        const fetchProductData = async () => {
            try {
                let data: any = { success: false };
                let fsData: any = { success: false };
                
                try {
                    const [res, fsRes] = await Promise.all([
                        fetch('/api/products'),
                        fetch('/api/flash-sales/active')
                    ]);
                    
                    if (res.ok) data = await res.json();
                    if (fsRes.ok) fsData = await fsRes.json();
                } catch (err) {
                    console.error("Failed to fetch product or flash sale data", err);
                }
                
                let currentFlashSale = null;
                if (fsData.success && fsData.data) {
                    currentFlashSale = fsData.data;
                    setActiveFlashSale(currentFlashSale);
                }

                if (data.success) {
                    const target = decodeURIComponent(String(params.id || '')).toLowerCase();
                    let foundProduct = data.products.find((p: any) => {
                        const pId = (p.id || '').toLowerCase();
                        const pSlug = (p.slug || slugify(p.name || '')).toLowerCase();
                        const pNameSlug = slugify(p.name || '').toLowerCase();
                        return pId === target || pSlug === target || pNameSlug === target || target.endsWith(pId) || pId.endsWith(target);
                    });

                    if (foundProduct) {
                        const canonicalSlug = getProductSlug(foundProduct);
                        if (canonicalSlug && params.id !== canonicalSlug && typeof window !== 'undefined') {
                            window.history.replaceState(null, '', `/product/${canonicalSlug}`);
                        }

                        // Merge Flash Sale data if applicable
                        if (currentFlashSale) {
                            const fsProduct = currentFlashSale.products?.find((p: any) => p.productId === foundProduct.id || p.id === foundProduct.id);
                            if (fsProduct) {
                                foundProduct.originalPrice = foundProduct.price;
                                // fsProduct already mapped 'price' to flashSalePrice in the backend
                                const fpPrice = fsProduct.price !== undefined && fsProduct.price !== null ? fsProduct.price : foundProduct.price;
                                foundProduct.price = fpPrice;
                                foundProduct.isFlashSale = true;
                                foundProduct.flashSaleVariants = fsProduct.flashSaleVariants && fsProduct.flashSaleVariants.length > 0 ? fsProduct.flashSaleVariants : (fsProduct.variants || []);
                                foundProduct.flashSaleStock = fsProduct.flashSaleStock !== undefined ? fsProduct.flashSaleStock : (fsProduct.stockQuantity || 0);
                            }
                        }

                        setProduct(foundProduct);
                        addProduct(foundProduct); // Lưu vào lịch sử xem
                        
                        // Tự động chọn nếu chỉ có 1 màu hoặc 1 size
                        if (foundProduct.colors && foundProduct.colors.length === 1) {
                            setSelectedColor(foundProduct.colors[0]);
                        }
                        if (foundProduct.sizes && foundProduct.sizes.length === 1) {
                            setSelectedSize(foundProduct.sizes[0]);
                        }

                        const related = data.products
                            .filter((p: Product) => p.category === foundProduct.category && p.id !== foundProduct.id)
                            .slice(0, 4);
                        setRelatedProducts(related);
                    }
                }
            } catch (error) {
                console.error('Error fetching product:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProductData();
    }, [params.id]);

    // Live ticking countdown timer for Flash Sale (ticks every second in real-time)
    useEffect(() => {
        const updateTimer = () => {
            let targetTime: number;
            if (activeFlashSale?.endTime) {
                targetTime = new Date(activeFlashSale.endTime).getTime();
            } else {
                const now = new Date();
                const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                targetTime = endOfDay.getTime();
            }

            const diff = targetTime - Date.now();
            if (diff > 0) {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft({ hours, minutes, seconds });
            } else {
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [activeFlashSale?.endTime]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-slate-400" size={40} />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-medium text-gray-800">Không tìm thấy sản phẩm</h2>
                    <Link href="/products" className="mt-4 inline-block text-sm text-gray-500 hover:text-black">
                        ← Quay lại danh sách sản phẩm
                    </Link>
                </div>
            </div>
        );
    }

    const getVariantStock = () => {
        if (!product || !selectedColor || !selectedSize) return null;
        const variants = product.variants || [];
        const match = variants.find((v: any) => v.color === selectedColor.name && v.size === selectedSize);
        
        let stock = 0;
        if (match) {
            stock = Number(match.stock) || 0;
        } else if (variants.length === 0) {
            // Fallback cho sản phẩm cũ chưa cấu hình biến thể
            stock = product.inStock ? 50 : 0;
        }
        
        // Nếu sản phẩm thuộc Flash Sale, chỉ giới hạn số lượng nếu Admin có cài đặt tồn kho riêng cho biến thể Flash Sale đó
        if (product.isFlashSale) {
            const hasFsVariants = Array.isArray(product.flashSaleVariants) && product.flashSaleVariants.length > 0;
            if (hasFsVariants) {
                const fsVariant = product.flashSaleVariants.find((v: any) => v.color === selectedColor.name && v.size === selectedSize);
                if (fsVariant && fsVariant.stockQuantity !== undefined && fsVariant.stockQuantity !== null) {
                    const fsStock = Number(fsVariant.stockQuantity) || 0;
                    const fsSold = Number(fsVariant.soldQuantity) || 0;
                    const fsAvailable = Math.max(0, fsStock - fsSold);
                    if (fsStock > 0) {
                        stock = Math.min(stock, fsAvailable);
                    }
                }
            }
        }
        
        return Math.max(0, stock);
    };

    const isSizeOutOfStock = (size: string) => {
        if (!product || !selectedColor) return false;
        const variants = product.variants || [];
        const match = variants.find((v: any) => v.color === selectedColor.name && v.size === size);
        if (match) return Number(match.stock) === 0;
        if (variants.length === 0) return !product.inStock;
        return true;
    };

    const isColorOutOfStock = (colorName: string) => {
        if (!product || !selectedSize) return false;
        const variants = product.variants || [];
        const match = variants.find((v: any) => v.color === colorName && v.size === selectedSize);
        if (match) return Number(match.stock) === 0;
        if (variants.length === 0) return !product.inStock;
        return true;
    };

    const handleAddToCart = () => {
        if (!selectedSize) {
            showToast('Vui lòng chọn kích cỡ', 'warning', 'Chưa chọn size');
            return;
        }
        if (!selectedColor) {
            showToast('Vui lòng chọn màu sắc', 'warning', 'Chưa chọn màu');
            return;
        }

        const stock = getVariantStock();
        if (stock === 0) {
            showToast('Sản phẩm đã hết hàng!', 'error', 'Hết hàng');
            return;
        }
        if (stock !== null && quantity > stock) {
            showToast(`Chỉ còn ${stock} sản phẩm trong kho!`, 'warning', 'Vượt tồn kho');
            return;
        }

        const productToCart = { ...product, price: currentPrice, originalPrice: currentOriginalPrice };
        addItem(productToCart, selectedSize, selectedColor, quantity);
        setShowAddedNotification(true);
        setTimeout(() => setShowAddedNotification(false), 3000);
    };

    const handleBuyNow = () => {
        if (!selectedSize) {
            showToast('Vui lòng chọn kích cỡ', 'warning', 'Chưa chọn size');
            return;
        }
        if (!selectedColor) {
            showToast('Vui lòng chọn màu sắc', 'warning', 'Chưa chọn màu');
            return;
        }

        const stock = getVariantStock();
        if (stock === 0) {
            showToast('Sản phẩm đã hết hàng!', 'error', 'Hết hàng');
            return;
        }
        if (stock !== null && quantity > stock) {
            showToast(`Chỉ còn ${stock} sản phẩm trong kho!`, 'warning', 'Vượt tồn kho');
            return;
        }

        const productToCart = { ...product, price: currentPrice, originalPrice: currentOriginalPrice };
        
        // Thay vì add vào giỏ hàng chung, lưu vào state Buy Now
        const { setBuyNowItem } = useCartStore.getState();
        setBuyNowItem({ product: productToCart, selectedSize, selectedColor, quantity });
        
        closeCart();
        router.push('/checkout'); // Chuyển đến trang thanh toán
    };

    // Calculate Current Price considering Flash Sale and Normal Variants
    let currentPrice = Number(product.price) || 0;
    let currentOriginalPrice = Number(product.originalPrice) || 0;
    
    if (product.isFlashSale && selectedColor && selectedSize) {
        const fsVariant = product.flashSaleVariants?.find((v: any) => v.color === selectedColor.name && v.size === selectedSize);
        if (fsVariant && fsVariant.flashSalePrice !== undefined && fsVariant.flashSalePrice !== null && fsVariant.flashSalePrice !== '') {
            currentPrice = Number(fsVariant.flashSalePrice);
        }
    } else if (selectedColor && selectedSize) {
        // Normal variant pricing
        const match = product.variants?.find((v: any) => v.color === selectedColor.name && v.size === selectedSize);
        if (match) {
            if (match.price !== undefined && match.price !== null && match.price !== '') {
                currentPrice = Number(match.price);
            }
            if (match.originalPrice !== undefined && match.originalPrice !== null && match.originalPrice !== '') {
                currentOriginalPrice = Number(match.originalPrice);
            }
        }
    }

    const discount = currentOriginalPrice > currentPrice
        ? Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-white pb-[60px] lg:pb-0">
            {/* Breadcrumb */}
            <div className="border-b border-gray-100">
                <div className="container-torano py-4">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors">
                        <ChevronLeft size={16} />
                        Quay lại
                    </button>
                </div>
            </div>

            {/* Product Detail */}
            <div className="container-torano py-8 lg:py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Images + Side-panel Zoom */}
                    <div className="lg:col-span-5 max-w-lg mx-auto md:max-w-none w-full">
                        <ImageZoom
                            images={product.images}
                            alt={product.name}
                            badge={product.badge}
                            discount={discount}
                            zoomLevel={3}
                            selectedIndex={selectedImage}
                            onSelectIndex={(i) => {
                                setSelectedImage(i);
                                // Đồng bộ màu theo ảnh
                                const img = product.images[i];
                                const matchingColor = product.colors.find((col: any) => col.image === img);
                                if (matchingColor) setSelectedColor(matchingColor);
                            }}
                        />
                    </div>

                    {/* Product Info */}
                    <div className="lg:col-span-7 space-y-6 lg:pl-6">
                        {/* Title & Rating */}
                        <div>
                            <p className="text-xs tracking-[3px] uppercase text-gray-400 font-light">{product.categoryLabel}</p>
                            <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 leading-snug tracking-tight">
                                {cleanProductTitle(product.name)}
                            </h1>
                            <div className="flex items-center gap-3 mt-3">
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} className={(product.reviews > 0) && i < Math.floor(product.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                                    ))}
                                </div>
                                <span className="text-sm text-gray-500">{product.reviews > 0 ? (product.rating || 0) : 0}</span>
                                <span className="text-sm text-gray-300">({product.reviews || 0} đánh giá)</span>
                            </div>
                        </div>

                        {/* Price & Flash Sale Shopee Banner */}
                        {(product.isFlashSale || product.flashSale || isUpcomingSlot) ? (
                            <div className="rounded-xl overflow-hidden border border-orange-400/40 shadow-md">
                                {/* Shopee Flash Sale Top Bar */}
                                <div className="bg-gradient-to-r from-[#ee4d2d] via-[#f25833] to-[#ff5722] px-3.5 py-2 flex items-center justify-between text-white shadow-sm">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center">
                                            {isUpcomingSlot ? (
                                                <Clock size={13} className="text-white" />
                                            ) : (
                                                <Zap size={13} className="fill-white text-white" />
                                            )}
                                        </div>
                                        <span className="text-xs sm:text-sm font-black tracking-wider uppercase drop-shadow-sm">
                                            {isUpcomingSlot ? 'FLASH SALE · SẮP MỞ BÁN' : 'FLASH SALE'}
                                        </span>
                                    </div>

                                    {/* Countdown Box */}
                                    <div className="flex items-center gap-1 text-xs font-bold">
                                        <div className="flex items-center gap-1 text-orange-100 text-[11px] font-bold uppercase tracking-wider">
                                            <Clock size={12} className="text-orange-200" />
                                            <span className="hidden sm:inline">
                                                {isUpcomingSlot ? 'MỞ BÁN TRONG' : 'KẾT THÚC TRONG'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-0.5 ml-1">
                                            <span className="px-1.5 py-0.5 bg-black text-white font-mono font-black text-[11px] rounded">
                                                {String(timeLeft.hours).padStart(2, '0')}
                                            </span>
                                            <span className="text-[10px] text-orange-200">:</span>
                                            <span className="px-1.5 py-0.5 bg-black text-white font-mono font-black text-[11px] rounded">
                                                {String(timeLeft.minutes).padStart(2, '0')}
                                            </span>
                                            <span className="text-[10px] text-orange-200">:</span>
                                            <span className="px-1.5 py-0.5 bg-black text-white font-mono font-black text-[11px] rounded">
                                                {String(timeLeft.seconds).padStart(2, '0')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Shopee Price Box */}
                                <div className="bg-[#fff7f4] p-3.5 sm:p-4 flex flex-col gap-2">
                                    <div className="flex items-baseline gap-3 flex-wrap">
                                        <span className="text-2xl sm:text-3xl font-black text-[#ee4d2d] tracking-tight">
                                            {isUpcomingSlot ? (
                                                (() => {
                                                    const str = Math.round(currentPrice).toString();
                                                    const firstDigit = str[0] || '2';
                                                    return `₫${firstDigit}??.000`;
                                                })()
                                            ) : (
                                                formatPrice(currentPrice)
                                            )}
                                        </span>
                                        {currentOriginalPrice > currentPrice && (
                                            <>
                                                <span className="text-sm sm:text-base text-gray-400 line-through font-normal">
                                                    {formatPrice(currentOriginalPrice)}
                                                </span>
                                                <span className="px-1.5 py-0.5 bg-red-100 text-[#ee4d2d] text-[11px] font-extrabold rounded uppercase border border-red-200">
                                                    -{discount}%
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {/* Voucher / Exclusive Flash Sale Tag */}
                                    <div className="flex items-center gap-2 text-xs font-medium text-[#ee4d2d] flex-wrap">
                                        <span className="px-2 py-0.5 bg-red-500/10 border border-[#ee4d2d]/30 rounded text-[11px] font-bold flex items-center gap-1">
                                            <Tag size={11} className="text-[#ee4d2d]" />
                                            {isUpcomingSlot ? 'Giá Độc Quyền Sắp Mở Bán Vào Ngày Mai' : 'Giá Sau Voucher & Flash Sale'}
                                        </span>
                                        <span className="text-gray-500 text-[11px]">
                                            {isUpcomingSlot 
                                                ? 'Sản phẩm sẽ chính thức mở bán giá sốc vào lúc 00:00 ngày mai'
                                                : 'Ưu đãi có hạn theo khung giờ hôm nay'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Standard Price for Normal Products */
                            <div className="flex items-baseline gap-3">
                                <span className="text-3xl font-semibold text-black">{formatPrice(currentPrice)}</span>
                                {currentOriginalPrice > 0 && (
                                    <>
                                        <span className="text-lg text-gray-400 line-through">{formatPrice(currentOriginalPrice)}</span>
                                        <span className="px-2 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded">-{discount}%</span>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Description */}
                        <p className="text-sm text-gray-600 leading-relaxed font-light">{product.shortDescription || product.description}</p>

                        {/* Color Selection */}
                        {product.colors && product.colors.length > 1 && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-medium text-gray-800">Màu sắc</label>
                                    {selectedColor && <span className="text-xs text-gray-500">{selectedColor.name}</span>}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {product.colors.map((color: any) => {
                                        const outOfStock = isColorOutOfStock(color.name);
                                        return (
                                            <button
                                                key={color.name}
                                                onClick={() => {
                                                    setSelectedColor(color);
                                                    if (color.image) {
                                                        let imgIndex = (product.images || []).findIndex((img: any) => img === color.image);
                                                        if (imgIndex === -1 && color.image) {
                                                            product.images = [color.image, ...(product.images || [])];
                                                            imgIndex = 0;
                                                        }
                                                        if (imgIndex !== -1) {
                                                            setSelectedImage(imgIndex);
                                                        }
                                                    }
                                                    // Clamp quantity if selected variant stock is smaller
                                                    const variants = product.variants || [];
                                                    const match = variants.find((v: any) => v.color === color.name && v.size === selectedSize);
                                                    if (match) {
                                                        const st = Math.max(0, Number(match.stock) || 0);
                                                        if (st > 0 && quantity > st) {
                                                            setQuantity(st);
                                                            showToast(`Chỉ còn ${st} sản phẩm cho màu ${color.name}`, 'warning');
                                                        }
                                                    }
                                                }}
                                                className={`relative flex items-center gap-2 px-4 py-2 rounded-none border transition-all ${
                                                    selectedColor?.name === color.name 
                                                        ? 'border-black bg-gray-50' 
                                                        : outOfStock 
                                                            ? 'border-gray-200 bg-gray-50/50 text-gray-300 opacity-50 cursor-not-allowed line-through' 
                                                            : 'border-gray-300 hover:border-gray-400'
                                                }`}
                                                title={outOfStock ? `${color.name} (Hết hàng cho size ${selectedSize})` : color.name}
                                            >
                                                <span className={`w-5 h-5 rounded-none border border-gray-300 ${getColorSwatchClass(color.name)}`} />
                                                <span className="text-sm">{color.name}</span>
                                                {selectedColor?.name === color.name && (
                                                    <Check size={14} className="absolute top-1 right-1 text-black" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Size Selection */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-gray-800">Kích cỡ</label>
                                {selectedSize && <span className="text-xs text-gray-500">{selectedSize}</span>}
                            </div>
                            <div className="flex flex-wrap gap-[8px]">
                                {product.sizes.map((size: any) => {
                                    const outOfStock = isSizeOutOfStock(size);
                                    return (
                                        <button
                                            key={size}
                                            onClick={() => {
                                                if (!outOfStock) {
                                                    setSelectedSize(size);
                                                    const variants = product.variants || [];
                                                    const match = variants.find((v: any) => v.color === selectedColor?.name && v.size === size);
                                                    if (match) {
                                                        const st = Math.max(0, Number(match.stock) || 0);
                                                        if (st > 0 && quantity > st) {
                                                            setQuantity(st);
                                                            showToast(`Chỉ còn ${st} sản phẩm cho size ${size}`, 'warning');
                                                        }
                                                    }
                                                }
                                            }}
                                            className={`w-[36px] h-[36px] lg:w-[40px] lg:h-[40px] flex items-center justify-center rounded-none border text-sm font-medium transition-all ${
                                                selectedSize === size 
                                                    ? 'border-black bg-black text-white' 
                                                    : outOfStock 
                                                        ? 'border-gray-200 bg-gray-50/50 text-gray-300 opacity-50 cursor-not-allowed line-through' 
                                                        : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                            title={outOfStock ? `Size ${size} (Hết hàng cho màu ${selectedColor?.name})` : `Size ${size}`}
                                        >
                                            {size}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quantity + Add to Cart (same row) */}
                        {/* Inventory stock indicator */}
                        {selectedColor && selectedSize && (
                            <div className="text-sm font-medium mt-1">
                                {getVariantStock() !== null && getVariantStock()! > 0 ? (
                                    <span className="text-emerald-600">✔ Còn {getVariantStock()} sản phẩm trong kho</span>
                                ) : (
                                    <span className="text-rose-600">✘ Hết hàng (Liên hệ để đặt trước)</span>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col gap-2 pt-3 pb-3 lg:pb-0">
                            {isUpcomingSlot ? (
                                <div className="space-y-3 pt-1">
                                    <div className="p-3.5 bg-orange-50 border border-orange-200/80 rounded-2xl flex items-start gap-3">
                                        <div className="p-2 bg-orange-100 rounded-xl text-orange-600 shrink-0">
                                            <Bell size={18} />
                                        </div>
                                        <div className="text-xs text-gray-700">
                                            <p className="font-bold text-orange-950 text-[13px]">
                                                Sản phẩm mở bán giá sốc vào ngày mai!
                                            </p>
                                            <p className="mt-0.5 text-gray-600 leading-relaxed">
                                                Đăng ký để nhận thông báo ngay khi đợt sale chính thức kích hoạt lúc 00:00.
                                            </p>
                                        </div>
                                    </div>

                                    <motion.button
                                        onClick={handleToggleReminder}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`w-full py-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-lg cursor-pointer ${
                                            isReminded 
                                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20' 
                                                : 'bg-gradient-to-r from-[#ee4d2d] to-[#ff5722] hover:brightness-110 text-white shadow-orange-500/25'
                                        }`}
                                    >
                                        <Bell size={18} className={isReminded ? '' : 'animate-bounce'} />
                                        <span>{isReminded ? '✅ ĐÃ ĐẶT NHẮC NHỞ MỞ BÁN' : '🔔 NHẮC TÔI KHI MỞ BÁN (NGÀY MAI)'}</span>
                                    </motion.button>
                                </div>
                            ) : (
                                <>
                                    {/* Hàng số lượng */}
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center border border-gray-300 h-[42px] overflow-hidden shrink-0">
                                            <button aria-label="Giảm số lượng" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3.5 h-full hover:bg-gray-50 transition-colors text-sm font-medium">−</button>
                                            <input 
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                value={quantity === 0 ? '' : quantity} 
                                                onChange={(e) => {
                                                    const rawVal = e.target.value.replace(/[^0-9]/g, '');
                                                    if (rawVal === '') {
                                                        setQuantity(0);
                                                        return;
                                                    }
                                                    let val = parseInt(rawVal, 10);
                                                    if (isNaN(val) || val < 1) val = 1;
                                                    
                                                    const maxStock = getVariantStock();
                                                    if (maxStock !== null && val > maxStock) {
                                                        setQuantity(maxStock <= 0 ? 1 : maxStock);
                                                        showToast(`Chỉ còn ${maxStock} sản phẩm trong kho!`, 'warning', 'Vượt tồn kho');
                                                    } else {
                                                        setQuantity(val);
                                                    }
                                                }}
                                                onBlur={() => {
                                                    const maxStock = getVariantStock();
                                                    if (!quantity || quantity < 1) {
                                                        setQuantity(1);
                                                    } else if (maxStock !== null && quantity > maxStock) {
                                                        setQuantity(maxStock <= 0 ? 1 : maxStock);
                                                    }
                                                }}
                                                className="w-12 h-full text-center text-sm font-semibold border-x border-gray-300 focus:outline-none appearance-none"
                                            />
                                            <button aria-label="Tăng số lượng" onClick={() => {
                                                const maxStock = getVariantStock();
                                                if (maxStock !== null && quantity >= maxStock) { showToast(`Chỉ còn ${maxStock} sản phẩm trong kho!`, 'warning'); return; }
                                                setQuantity(quantity + 1);
                                            }} className="px-3.5 h-full hover:bg-gray-50 transition-colors text-sm font-medium">+</button>
                                        </div>
                                    </div>
                                    {/* Hàng nút: Thêm vào giỏ + Mua Ngay + Nút Yêu Thích */}
                                    <div className="flex items-center gap-2">
                                        <motion.button
                                            onClick={handleAddToCart}
                                            disabled={getVariantStock() === 0}
                                            whileTap={getVariantStock() !== 0 ? { scale: 0.98 } : {}}
                                            className={`flex-1 h-[42px] rounded-none text-[14px] font-semibold tracking-wide uppercase flex items-center justify-center gap-2 transition-all border ${
                                                getVariantStock() === 0 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-black border-black hover:bg-black hover:text-white'
                                            }`}
                                        >
                                            Thêm vào giỏ
                                        </motion.button>
                                        <motion.button
                                            onClick={handleBuyNow}
                                            disabled={getVariantStock() === 0}
                                            whileTap={getVariantStock() !== 0 ? { scale: 0.98 } : {}}
                                            className={`flex-1 h-[42px] rounded-none text-[14px] font-semibold tracking-wide uppercase flex items-center justify-center transition-all ${
                                                getVariantStock() === 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-black text-white hover:bg-[#222]'
                                            }`}
                                        >
                                            {getVariantStock() === 0 ? 'Hết hàng' : 'Mua Ngay'}
                                        </motion.button>
                                        <motion.button
                                            onClick={handleToggleWishlist}
                                            whileTap={{ scale: 0.9 }}
                                            title={isFav ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
                                            aria-label={isFav ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
                                            className={`w-[42px] h-[42px] shrink-0 border flex items-center justify-center transition-all cursor-pointer ${
                                                isFav 
                                                    ? 'bg-rose-50 border-rose-400 text-rose-600 shadow-xs' 
                                                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-500 hover:text-rose-600'
                                            }`}
                                        >
                                            <Heart size={18} fill={isFav ? 'currentColor' : 'none'} />
                                        </motion.button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Added Notification */}
                        <AnimatePresence>
                            {showAddedNotification && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm"
                                >
                                    <Check size={16} />
                                    Đã thêm vào giỏ hàng!
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Features */}
                        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
                            <div className="text-center">
                                <Truck size={20} className="mx-auto text-gray-400 mb-2" />
                                <p className="text-xs text-gray-600 font-light">Miễn phí vận chuyển</p>
                            </div>
                            <div className="text-center">
                                <RefreshCw size={20} className="mx-auto text-gray-400 mb-2" />
                                <p className="text-xs text-gray-600 font-light">Đổi trả 30 ngày</p>
                            </div>
                            <div className="text-center">
                                <Shield size={20} className="mx-auto text-gray-400 mb-2" />
                                <p className="text-xs text-gray-600 font-light">Hàng chính hãng</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Service Banners */}
                <div className="mt-12 pt-12 border-t border-gray-100 grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="flex flex-col items-center text-center p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <Truck size={32} className="text-blue-500 mb-4" />
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Miễn phí giao hàng</h4>
                        <p className="text-xs text-gray-500">Cho đơn hàng từ 500.000đ</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <RefreshCw size={32} className="text-green-500 mb-4" />
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Đổi trả dễ dàng</h4>
                        <p className="text-xs text-gray-500">Trong vòng 30 ngày</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <Shield size={32} className="text-purple-500 mb-4" />
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Thanh toán an toàn</h4>
                        <p className="text-xs text-gray-500">100% bảo mật thông tin</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <Star size={32} className="text-amber-500 mb-4" />
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Hỗ trợ 24/7</h4>
                        <p className="text-xs text-gray-500">Hotline: 1900 xxxx</p>
                    </div>
                </div>

                {/* Detailed Content Tabs */}
                <ProductTabs product={product} />

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="mt-20 lg:mt-28">
                        <h2 className="text-2xl lg:text-3xl font-light text-black tracking-tight mb-8">Sản phẩm tương tự</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                            {relatedProducts.map((p, index) => (
                                <ProductCard key={p.id} product={p} index={index} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Recently Viewed Products */}
                <RecentlyViewed currentProductId={product.id} />
            </div>
        </div>
    );
}
