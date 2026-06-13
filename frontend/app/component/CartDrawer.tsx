'use client';
// ===== CART DRAWER - Ngăn kéo giỏ hàng bên phải =====
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/app/component/CartContext';
import { formatPrice } from '@/lib/format';

export default function CartDrawer() {
    const { items, isOpen, closeCart, removeItem, updateQuantity, totalAmount, totalItems } = useCart();

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
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <ShoppingBag size={18} strokeWidth={1.5} />
                                <h2 className="text-lg font-medium tracking-wide">Giỏ hàng</h2>
                                <span className="px-2 py-0.5 bg-black text-white text-[10px] rounded-full font-medium">
                                    {totalItems}
                                </span>
                            </div>
                            <button
                                onClick={closeCart}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                aria-label="Đóng giỏ hàng"
                            >
                                <X size={18} />
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
                                                            <span className="px-3 text-sm font-medium min-w-[32px] text-center">
                                                                {item.quantity}
                                                            </span>
                                                            <button
                                                                onClick={() =>
                                                                    updateQuantity(
                                                                        item.product.id,
                                                                        item.selectedSize,
                                                                        item.selectedColor.name,
                                                                        item.quantity + 1
                                                                    )
                                                                }
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
                            <div className="border-t border-gray-100 p-6 space-y-4">
                                {/* Shipping Notice */}
                                <div className="flex items-center gap-2 py-2 px-3 bg-emerald-50 rounded-lg">
                                    <span className="text-emerald-600 text-xs">🎉</span>
                                    <span className="text-emerald-700 text-xs font-medium">
                                        Miễn phí vận chuyển cho đơn hàng này!
                                    </span>
                                </div>

                                {/* Total */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Tổng cộng</span>
                                    <span className="text-xl font-semibold text-black">
                                        {formatPrice(totalAmount)}
                                    </span>
                                </div>

                                {/* Checkout Button */}
                                <Link href="/checkout" onClick={closeCart}>
                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        className="w-full flex items-center justify-center gap-2 py-4 bg-black text-white rounded-xl text-sm font-medium tracking-wide uppercase hover:bg-gray-900 transition-colors"
                                    >
                                        Thanh toán
                                        <ArrowRight size={14} />
                                    </motion.button>
                                </Link>

                                {/* Continue Shopping */}
                                <button
                                    onClick={closeCart}
                                    className="w-full text-center text-sm text-gray-500 hover:text-black transition-colors py-1"
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
