'use client';
// ===== CART DRAWER - Ngăn kéo giỏ hàng bên phải =====
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/app/component/CartContext';
import { formatPrice } from '@/lib/format';
import { toast } from 'react-hot-toast';

const QuantityControl = ({ item, updateQuantity }: { item: any, updateQuantity: any }) => {
    const [localQuantity, setLocalQuantity] = useState<number | string>(item.quantity);

    useEffect(() => {
        setLocalQuantity(item.quantity);
    }, [item.quantity]);

    const getMaxStock = () => {
        const { product, selectedColor, selectedSize } = item;
        if (!product || !selectedColor || !selectedSize) return 999;
        const variants = product.variants || [];
        const match = variants.find((v: any) => 
            (v.color === selectedColor.name || v.color === 'Mặc định' || (!v.color && selectedColor.name === 'Mặc định')) 
            && 
            (v.size === selectedSize || v.size === 'One Size' || (!v.size && selectedSize === 'One Size'))
        );
        
        let stock = 999;
        if (match && match.stock !== undefined) {
            stock = Number(match.stock) || 0;
        } else if (variants.length === 0) {
            stock = product.inStock ? 50 : 0;
        }

        if (product.isFlashSale) {
            const fsVariant = product.flashSaleVariants?.find((v: any) => 
                (v.color === selectedColor.name || v.color === 'Mặc định' || (!v.color && selectedColor.name === 'Mặc định')) 
                && 
                (v.size === selectedSize || v.size === 'One Size' || (!v.size && selectedSize === 'One Size'))
            );
            if (fsVariant) {
                const fsStock = fsVariant.stockQuantity !== undefined ? Number(fsVariant.stockQuantity) : (Number(fsVariant.stock) || 0);
                const fsSold = Number(fsVariant.soldQuantity) || 0;
                stock = Math.min(stock, fsStock - fsSold);
            } else if (product.flashSaleStock !== undefined && product.flashSaleStock !== null) {
                const totalFsStock = Number(product.flashSaleStock) || 0;
                stock = Math.min(stock, totalFsStock);
            }
        }
        return Math.max(0, stock);
    };

    return (
        <input 
            type="number"
            min="1"
            value={localQuantity}
            onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                    setLocalQuantity('');
                } else {
                    let num = parseInt(val);
                    if (!isNaN(num)) {
                        const maxStock = getMaxStock();
                        if (num > maxStock) {
                            toast.error(`Sản phẩm này chỉ còn ${maxStock} sản phẩm trong kho`);
                            num = maxStock;
                        }
                        setLocalQuantity(num);
                        if (num > 0) {
                            updateQuantity(item.product.id, item.selectedSize, item.selectedColor.name, num);
                        }
                    }
                }
            }}
            onBlur={() => {
                if (localQuantity === '' || Number(localQuantity) < 1) {
                    setLocalQuantity(1);
                    updateQuantity(item.product.id, item.selectedSize, item.selectedColor.name, 1);
                }
            }}
            className="w-10 text-center text-sm font-medium focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-transparent"
        />
    );
};

export default function CartDrawer() {
    const { items, isOpen, closeCart, removeItem, updateQuantity, totalAmount, totalItems } = useCart();

    useEffect(() => {
        const handleStockExceeded = (e: any) => {
            const { maxStock } = e.detail;
            toast.error(`Sản phẩm này chỉ còn ${maxStock} sản phẩm trong kho!`);
        };
        window.addEventListener('cart-stock-exceeded', handleStockExceeded);
        return () => window.removeEventListener('cart-stock-exceeded', handleStockExceeded);
    }, []);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={closeCart}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100005]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full sm:w-[440px] bg-white z-[100006] flex flex-col shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-150 bg-white sticky top-0 z-20 shadow-2xs">
                            <div className="flex items-center gap-2.5">
                                <ShoppingBag size={20} className="text-[#1e40af]" strokeWidth={2} />
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Giỏ hàng</h2>
                                <span className="px-2 py-0.5 bg-[#1e40af] text-white text-[11px] rounded-full font-black">
                                    {totalItems}
                                </span>
                            </div>
                            <button
                                onClick={closeCart}
                                className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors text-slate-600 hover:text-slate-900 cursor-pointer"
                                aria-label="Đóng giỏ hàng"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                                        <ShoppingBag size={28} className="text-gray-300" />
                                    </div>
                                    <p className="text-gray-500 text-sm font-light">Giỏ hàng trống</p>
                                    <p className="text-gray-400 text-xs mt-1">Hãy thêm sản phẩm yêu thích vào giỏ!</p>
                                    <button
                                        onClick={closeCart}
                                        className="mt-6 px-6 py-2.5 bg-black text-white text-sm rounded-full hover:bg-gray-800 transition-colors"
                                    >
                                        Tiếp tục mua sắm
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <AnimatePresence>
                                        {items.map((item) => (
                                            <motion.div
                                                key={`${item.product.id}-${item.selectedSize}-${item.selectedColor.name}`}
                                                layout
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="flex gap-4 p-3 bg-gray-50 rounded-xl"
                                            >
                                                {/* Product Image */}
                                                <div className="relative w-20 h-24 rounded-lg overflow-hidden flex-shrink-0">
                                                    <Image
                                                        src={item.product.images[0]}
                                                        alt={item.product.name}
                                                        fill
                                                        className="object-cover"
                                                        sizes="80px"
                                                    />
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-medium text-gray-800 line-clamp-1">
                                                        {item.product.name}
                                                    </h4>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                                        Size: {item.selectedSize} • {item.selectedColor.name}
                                                    </p>
                                                    <p className="text-sm font-semibold text-black mt-1">
                                                        {formatPrice(item.product.price)}
                                                    </p>

                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center justify-between mt-2">
                                                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                                            <button
                                                                onClick={() =>
                                                                    updateQuantity(
                                                                        item.product.id,
                                                                        item.selectedSize,
                                                                        item.selectedColor.name,
                                                                        item.quantity - 1
                                                                    )
                                                                }
                                                                className="p-1.5 hover:bg-gray-100 transition-colors"
                                                                aria-label="Giảm số lượng"
                                                            >
                                                                <Minus size={12} />
                                                            </button>
                                                            <QuantityControl item={item} updateQuantity={updateQuantity} />
                                                            <button
                                                                onClick={() => {
                                                                    const getMaxStock = () => {
                                                                        const { product, selectedColor, selectedSize } = item;
                                                                        if (!product || !selectedColor || !selectedSize) return 999;
                                                                        const variants = product.variants || [];
                                                                        const match = variants.find((v: any) => 
                                                                            (v.color === selectedColor.name || v.color === 'Mặc định' || (!v.color && selectedColor.name === 'Mặc định')) 
                                                                            && 
                                                                            (v.size === selectedSize || v.size === 'One Size' || (!v.size && selectedSize === 'One Size'))
                                                                        );
                                                                        
                                                                        let stock = 999;
                                                                        if (match && match.stock !== undefined) {
                                                                            stock = Number(match.stock) || 0;
                                                                        } else if (variants.length === 0) {
                                                                            stock = product.inStock ? 50 : 0;
                                                                        }

                                                                        if (product.isFlashSale) {
                                                                            const fsVariant = product.flashSaleVariants?.find((v: any) => 
                                                                                (v.color === selectedColor.name || v.color === 'Mặc định' || (!v.color && selectedColor.name === 'Mặc định')) 
                                                                                && 
                                                                                (v.size === selectedSize || v.size === 'One Size' || (!v.size && selectedSize === 'One Size'))
                                                                            );
                                                                            if (fsVariant) {
                                                                                const fsStock = fsVariant.stockQuantity !== undefined ? Number(fsVariant.stockQuantity) : (Number(fsVariant.stock) || 0);
                                                                                const fsSold = Number(fsVariant.soldQuantity) || 0;
                                                                                stock = Math.min(stock, fsStock - fsSold);
                                                                            } else if (product.flashSaleStock !== undefined && product.flashSaleStock !== null) {
                                                                                const totalFsStock = Number(product.flashSaleStock) || 0;
                                                                                stock = Math.min(stock, totalFsStock);
                                                                            }
                                                                        }
                                                                        return Math.max(0, stock);
                                                                    };
                                                                    const maxStock = getMaxStock();
                                                                    if (item.quantity >= maxStock) {
                                                                        toast.error(`Sản phẩm này chỉ còn ${maxStock} sản phẩm trong kho`);
                                                                    } else {
                                                                        updateQuantity(
                                                                            item.product.id,
                                                                            item.selectedSize,
                                                                            item.selectedColor.name,
                                                                            item.quantity + 1
                                                                        );
                                                                    }
                                                                }}
                                                                className="p-1.5 hover:bg-gray-100 transition-colors"
                                                                aria-label="Tăng số lượng"
                                                            >
                                                                <Plus size={12} />
                                                            </button>
                                                        </div>

                                                        <button
                                                            onClick={() =>
                                                                removeItem(item.product.id, item.selectedSize, item.selectedColor.name)
                                                            }
                                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                            aria-label="Xóa sản phẩm"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* Footer - Checkout */}
                        {items.length > 0 && (
                            <div className="border-t border-slate-150 p-5 sm:p-6 pb-8 space-y-3.5 bg-white sticky bottom-0 z-20 shadow-[0_-8px_20px_rgba(0,0,0,0.06)]">
                                {/* Shipping Notice */}
                                {totalAmount >= 500000 ? (
                                    <div className="flex items-center gap-2 py-2 px-3 bg-emerald-50 border border-emerald-200/80 rounded-xl">
                                        <span className="text-emerald-600 text-xs">🎉</span>
                                        <span className="text-emerald-800 text-xs font-bold">
                                            Miễn phí vận chuyển cho đơn hàng này!
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 py-2 px-3 bg-amber-50 border border-amber-200/80 rounded-xl">
                                        <span className="text-amber-600 text-xs">🚚</span>
                                        <span className="text-amber-900 text-xs font-bold">
                                            Mua thêm <span className="text-amber-700 font-extrabold">{formatPrice(500000 - totalAmount)}</span> để được Miễn phí vận chuyển!
                                        </span>
                                    </div>
                                )}

                                {/* Total */}
                                <div className="flex items-center justify-between py-1">
                                    <span className="text-sm font-bold text-slate-500">Tổng cộng:</span>
                                    <span className="text-2xl font-black text-slate-900">
                                        {formatPrice(totalAmount)}
                                    </span>
                                </div>

                                {/* Checkout Button */}
                                <Link href="/checkout" onClick={closeCart} className="block">
                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-950 hover:bg-[#1e40af] text-white rounded-xl text-sm font-black tracking-wider uppercase transition-all duration-300 shadow-md cursor-pointer"
                                    >
                                        <span>THANH TOÁN</span>
                                        <ArrowRight size={15} />
                                    </motion.button>
                                </Link>

                                {/* Continue Shopping */}
                                <button
                                    onClick={closeCart}
                                    className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-950 transition-colors py-1 uppercase tracking-wider cursor-pointer"
                                >
                                    ← Tiếp tục mua sắm
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
