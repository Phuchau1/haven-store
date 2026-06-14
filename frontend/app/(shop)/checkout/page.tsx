'use client';
// ===== CHECKOUT PAGE - Trang thanh toán =====
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronLeft, ShoppingBag, Lock } from 'lucide-react';
import { useCart } from '@/app/component/CartContext';
import { formatPrice } from '@/lib/format';
import CheckoutForm from '@/app/component/CheckoutForm';
import OrderSuccessModal from '@/app/component/OrderSuccessModal';
import { useAuthStore } from '@/app/store/useAuthStore';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, totalAmount, clearCart } = useCart();
    const { user } = useAuthStore();
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [orderInfo, setOrderInfo] = useState({ orderId: '', email: '' });
    const [isMounted, setIsMounted] = useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleOrderSuccess = (orderId: string, email: string) => {
        setOrderInfo({ orderId, email });
        setShowSuccessModal(true);
        clearCart();
    };

    const handleCloseModal = () => {
        setShowSuccessModal(false);
        router.push('/');
    };

    // Hydration check
    if (!isMounted) return null;

    // Login check
    if (!user && !showSuccessModal) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-gray-100 max-w-md w-full">
                    <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                        <Lock size={32} className="text-slate-700" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Yêu cầu đăng nhập</h2>
                    <p className="text-sm text-slate-500 mt-2 mb-8 font-medium">Bạn cần đăng nhập tài khoản để có thể tiến hành đặt hàng và thanh toán.</p>
                    <div className="space-y-3">
                        <Link href="/login" className="block w-full py-4 px-4 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-slate-800 transition-all active:scale-[0.98]">
                            Đăng nhập ngay
                        </Link>
                        <Link href="/register" className="block w-full py-4 px-4 bg-white text-slate-900 text-sm font-bold border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all active:scale-[0.98]">
                            Tạo tài khoản mới
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Redirect if cart is empty
    if (items.length === 0 && !showSuccessModal) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <ShoppingBag size={32} className="text-gray-300" />
                    </div>
                    <h2 className="text-2xl font-medium text-gray-800">Giỏ hàng trống</h2>
                    <p className="text-sm text-gray-500 mt-2">Hãy thêm sản phẩm vào giỏ hàng trước khi thanh toán</p>
                    <Link href="/products">
                        <button className="mt-6 px-6 py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-900 transition-colors">
                            Mua sắm ngay
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/30">
            {/* Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="container-torano py-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors"
                    >
                        <ChevronLeft size={16} />
                        Quay lại
                    </button>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mt-6"
                    >
                        <h1 className="text-2xl lg:text-3xl font-light text-black tracking-tight">Thanh toán</h1>
                        <p className="text-sm text-gray-500 mt-2 font-light">
                            Hoàn tất đơn hàng của bạn
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Checkout Form */}
                    <div className="lg:col-span-3">
                        <CheckoutForm onSuccess={handleOrderSuccess} />
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-2">
                        <div className="sticky top-24">
                            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-5">
                                    Đơn hàng của bạn
                                </h3>

                                {/* Items */}
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                    {items.map((item) => (
                                        <div
                                            key={`${item.product.id}-${item.selectedSize}-${item.selectedColor.name}`}
                                            className="flex gap-3"
                                        >
                                            {/* Image */}
                                            <div className="relative w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50">
                                                <Image
                                                    src={item.product.images[0]}
                                                    alt={item.product.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="64px"
                                                />
                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                                                    {item.quantity}
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-gray-800 line-clamp-1">
                                                    {item.product.name}
                                                </h4>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {item.selectedSize} • {item.selectedColor.name}
                                                </p>
                                                <p className="text-sm font-semibold text-black mt-1">
                                                    {formatPrice(item.product.price * item.quantity)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Divider */}
                                <div className="border-t border-gray-100 my-5" />

                                {/* Totals */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Tạm tính</span>
                                        <span>{formatPrice(totalAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-emerald-600">
                                        <span>Phí vận chuyển</span>
                                        <span className="font-medium">Miễn phí</span>
                                    </div>
                                    <div className="border-t border-gray-100 pt-3 mt-3">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-sm text-gray-500">Tổng cộng</span>
                                            <span className="text-2xl font-semibold text-black">
                                                {formatPrice(totalAmount)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Trust Badges */}
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                        <span>Thanh toán an toàn & bảo mật</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            <OrderSuccessModal
                isOpen={showSuccessModal}
                orderId={orderInfo.orderId}
                email={orderInfo.email}
                onClose={handleCloseModal}
            />
        </div>
    );
}

