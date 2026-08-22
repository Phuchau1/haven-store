'use client';
// ===== CHECKOUT PAGE - TRANG THANH TOÁN DOANH NGHIỆP =====
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ShoppingBag, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/app/component/CartContext';
import CheckoutForm from '@/app/component/CheckoutForm';
import OrderSuccessModal from '@/app/component/OrderSuccessModal';
import { useVoucherStore } from '@/app/store/useVoucherStore';
import { useCartStore } from '@/app/store/useCartStore';

export default function CheckoutPage() {
    const router = useRouter();
    const { items: cartItems, clearCart, closeCart } = useCart();
    
    // Ưu tiên hiển thị Buy Now Item nếu có
    const buyNowItem = useCartStore(s => s.buyNowItem);
    const items = buyNowItem ? [buyNowItem] : cartItems;
    
    const { removeVoucher } = useVoucherStore();
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [orderInfo, setOrderInfo] = useState({ orderId: '', email: '' });
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        closeCart();
        
        return () => {
            useCartStore.getState().clearBuyNowItem();
        };
    }, [closeCart]);

    const handleOrderSuccess = (orderId: string, email: string) => {
        setOrderInfo({ orderId, email });
        setShowSuccessModal(true);
        
        const buyNowItem = useCartStore.getState().buyNowItem;
        if (buyNowItem) {
            useCartStore.getState().clearBuyNowItem();
        } else {
            clearCart();
        }
        removeVoucher();
    };

    const handleCloseModal = () => {
        setShowSuccessModal(false);
        router.push('/');
    };

    if (!isMounted) return null;

    // Giỏ hàng trống
    if (items.length === 0 && !showSuccessModal) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center px-4 bg-[#f8fafc]">
                <div className="text-center max-w-md bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <ShoppingBag size={36} />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">Giỏ hàng của bạn đang trống</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                        Hãy dạo qua cửa hàng và chọn những sản phẩm thời trang ưng ý trước khi thanh toán.
                    </p>
                    <Link href="/products">
                        <button className="mt-6 w-full py-3.5 px-6 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-2xl text-sm font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer">
                            Khám phá sản phẩm ngay
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-24 lg:pb-16">
            {/* ── HEADER DOANH NGHIỆP & TIẾN TRÌNH THANH TOÁN ── */}
            <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs backdrop-blur-md bg-white/95">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-950 transition-colors cursor-pointer py-1 px-2 -ml-2 rounded-lg hover:bg-slate-100"
                    >
                        <ChevronLeft size={17} />
                        <span>Giỏ hàng</span>
                    </button>

                    {/* Progress Steps (Desktop) */}
                    <div className="hidden md:flex items-center gap-3 text-xs font-bold">
                        <span className="text-slate-400">1. Giỏ hàng</span>
                        <span className="text-slate-300">›</span>
                        <span className="text-[#0f172a] font-extrabold flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full">
                            2. Thanh toán
                        </span>
                        <span className="text-slate-300">›</span>
                        <span className="text-slate-400">3. Hoàn tất</span>
                    </div>

                    {/* Secure Badge */}
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                        <Lock size={12} />
                        <span>BẢO MẬT SSL 256-BIT</span>
                    </div>
                </div>
            </header>

            {/* ── TIÊU ĐỀ TRANG ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-3">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="flex items-center gap-2.5">
                        <span className="w-1.5 h-6 sm:h-7 bg-[#0f172a] rounded-full" />
                        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-slate-950">
                            Thanh toán đơn hàng
                        </h1>
                    </div>
                </motion.div>
            </div>

            {/* ── NỘI DUNG CHÍNH (2 CỘT CHUẨN DOANH NGHIỆP) ── */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
                <CheckoutForm onSuccess={handleOrderSuccess} />
            </main>

            {/* Modal hoàn tất thành công */}
            <OrderSuccessModal
                isOpen={showSuccessModal}
                orderId={orderInfo.orderId}
                email={orderInfo.email}
                onClose={handleCloseModal}
            />
        </div>
    );
}
