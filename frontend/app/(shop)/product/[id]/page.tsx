'use client';
// ===== PRODUCT DETAIL PAGE =====
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Heart, Star, Truck, RefreshCw, Shield, ChevronLeft, Check, Loader2 } from 'lucide-react';
import ImageZoom from '@/app/component/ImageZoom';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/app/component/CartContext';
import { Product, Color } from '@/types';
import ProductCard from '@/app/component/ProductCard';
import ProductTabs from '@/app/component/ProductTabs';
import { useRecentlyViewed } from '@/app/hooks/useRecentlyViewed';
import RecentlyViewed from '@/app/component/RecentlyViewed';

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
    const { addItem } = useCart();

    const [product, setProduct] = useState<Product | any>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFlashSale, setActiveFlashSale] = useState<any>(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState<Color | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isLiked, setIsLiked] = useState(false);
    const [showAddedNotification, setShowAddedNotification] = useState(false);

    const { addProduct } = useRecentlyViewed();

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
                    let foundProduct = data.products.find((p: Product) => p.id === params.id);
                    if (foundProduct) {
                        
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
        
        // If product is in flash sale, check flash sale stock limits
        if (product.isFlashSale) {
            const fsVariant = product.flashSaleVariants?.find((v: any) => v.color === selectedColor.name && v.size === selectedSize);
            if (fsVariant) {
                const fsStock = fsVariant.stockQuantity !== undefined ? Number(fsVariant.stockQuantity) : (Number(fsVariant.stock) || 0);
                const fsSold = Number(fsVariant.soldQuantity) || 0;
                stock = Math.min(stock, fsStock - fsSold);
            } else if (product.flashSaleStock !== undefined && product.flashSaleStock !== null) {
                // If no specific variant flash sale stock, limit by total flash sale stock left
                const totalFsStock = Number(product.flashSaleStock) || 0;
                stock = Math.min(stock, totalFsStock);
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
            alert('Vui lòng chọn kích cỡ');
            return;
        }
        if (!selectedColor) {
            alert('Vui lòng chọn màu sắc');
            return;
        }

        const stock = getVariantStock();
        if (stock === 0) {
            alert('Sản phẩm đã hết hàng!');
            return;
        }
        if (stock !== null && quantity > stock) {
            alert(`Chỉ còn ${stock} sản phẩm trong kho!`);
            return;
        }

        const productToCart = { ...product, price: currentPrice, originalPrice: currentOriginalPrice };
        addItem(productToCart, selectedSize, selectedColor, quantity);
        setShowAddedNotification(true);
        setTimeout(() => setShowAddedNotification(false), 3000);
    };

    const handleBuyNow = () => {
        if (!selectedSize) {
            alert('Vui lòng chọn kích cỡ');
            return;
        }
        if (!selectedColor) {
            alert('Vui lòng chọn màu sắc');
            return;
        }

        const stock = getVariantStock();
        if (stock === 0) {
            alert('Sản phẩm đã hết hàng!');
            return;
        }
        if (stock !== null && quantity > stock) {
            alert(`Chỉ còn ${stock} sản phẩm trong kho!`);
            return;
        }

        const productToCart = { ...product, price: currentPrice, originalPrice: currentOriginalPrice };
        addItem(productToCart, selectedSize, selectedColor, quantity);
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

    const discount = currentOriginalPrice > 0
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
                            <h1 className="mt-2 text-3xl lg:text-4xl font-light text-black tracking-tight">{product.name}</h1>
                            <div className="flex items-center gap-3 mt-3">
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} className={i < Math.floor(product.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                                    ))}
                                </div>
                                <span className="text-sm text-gray-500">{product.rating || 5}</span>
                                <span className="text-sm text-gray-300">({product.reviews || 0} đánh giá)</span>
                            </div>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-semibold text-black">{formatPrice(currentPrice)}</span>
                            {currentOriginalPrice > 0 && (
                                <>
                                    <span className="text-lg text-gray-400 line-through">{formatPrice(currentOriginalPrice)}</span>
                                    <span className="px-2 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded">-{discount}%</span>
                                </>
                            )}
                            {product.isFlashSale && (
                                <span className="px-2 py-1 bg-black text-white text-xs font-bold uppercase rounded animate-pulse ml-2">Flash Sale</span>
                            )}
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 leading-relaxed font-light">{product.description}</p>

                        {/* Color Selection */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-gray-800">Màu sắc</label>
                                {selectedColor && <span className="text-xs text-gray-500">{selectedColor.name}</span>}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {product.colors.map((color) => {
                                    const outOfStock = isColorOutOfStock(color.name);
                                    return (
                                        <button
                                            key={color.name}
                                            onClick={() => {
                                                setSelectedColor(color);
                                                if (color.image) {
                                                    const imgIndex = product.images.findIndex(img => img === color.image);
                                                    if (imgIndex !== -1) {
                                                        setSelectedImage(imgIndex);
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

                        {/* Size Selection */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-gray-800">Kích cỡ</label>
                                {selectedSize && <span className="text-xs text-gray-500">{selectedSize}</span>}
                            </div>
                            <div className="flex flex-wrap gap-[8px]">
                                {product.sizes.map((size) => {
                                    const outOfStock = isSizeOutOfStock(size);
                                    return (
                                        <button
                                            key={size}
                                            onClick={() => !outOfStock && setSelectedSize(size)}
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
                            <div className="flex items-center gap-2">
                                <div className="flex items-center border border-gray-300 h-[42px] overflow-hidden shrink-0">
                                    <button aria-label="Giảm số lượng" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3.5 h-full hover:bg-gray-50 transition-colors text-sm font-medium">−</button>
                                    <span className="px-4 h-full flex items-center text-sm font-semibold min-w-[36px] justify-center border-x border-gray-300">{quantity}</span>
                                    <button aria-label="Tăng số lượng" onClick={() => {
                                        const maxStock = getVariantStock();
                                        if (maxStock !== null && quantity >= maxStock) { alert(`Chỉ còn ${maxStock} sản phẩm trong kho!`); return; }
                                        setQuantity(quantity + 1);
                                    }} className="px-3.5 h-full hover:bg-gray-50 transition-colors text-sm font-medium">+</button>
                                </div>
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
                            </div>
                            <motion.button
                                onClick={handleBuyNow}
                                disabled={getVariantStock() === 0}
                                whileTap={getVariantStock() !== 0 ? { scale: 0.98 } : {}}
                                className={`w-full h-[42px] rounded-none text-[14px] font-semibold tracking-wide uppercase flex items-center justify-center transition-all ${
                                    getVariantStock() === 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-black text-white hover:bg-[#222]'
                                }`}
                            >
                                {getVariantStock() === 0 ? 'Hết hàng' : 'Mua Ngay'}
                            </motion.button>
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
                        <p className="text-xs text-gray-500">Cho đơn hàng từ 500K</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <RefreshCw size={32} className="text-indigo-500 mb-4" />
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Đổi sản phẩm dễ dàng</h4>
                        <p className="text-xs text-gray-500">Trong vòng 7 ngày</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <Shield size={32} className="text-emerald-500 mb-4" />
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Hàng chính hãng 100%</h4>
                        <p className="text-xs text-gray-500">Cam kết chất lượng</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-4 text-orange-500">
                            <span className="font-bold text-xl">COD</span>
                        </div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Kiểm tra khi nhận hàng</h4>
                        <p className="text-xs text-gray-500">Thanh toán an toàn</p>
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
