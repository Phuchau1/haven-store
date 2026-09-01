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
        <div className="min-h-screen bg-slate-50/50 pb-24 lg:pb-16">
            {/* ── HEADER DOANH NGHIỆP & TIẾN TRÌNH THANH TOÁN ── */}
            <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer py-1.5 px-2.5 -ml-2 rounded-lg hover:bg-slate-100/80"
                    >
                        <ChevronLeft size={18} />
                        <span>Quay lại giỏ hàng</span>
                    </button>

                    {/* Progress Steps (Desktop) */}
                    <div className="hidden md:flex items-center gap-2.5 text-xs sm:text-sm font-medium">
                        <span className="text-slate-400">Giỏ hàng</span>
                        <span className="text-slate-300">›</span>
                        <span className="text-slate-900 font-semibold bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                            Thanh toán
                        </span>
                        <span className="text-slate-300">›</span>
                        <span className="text-slate-400">Hoàn tất</span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                        <ShieldCheck size={16} className="text-emerald-600" />
                        <span className="hidden sm:inline">Bảo mật SSL 256-bit</span>
                    </div>
                </div>
            </header>

            {/* ── TIÊU ĐỀ TRANG ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Thanh toán đơn hàng
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Vui lòng kiểm tra kỹ thông tin người nhận và lựa chọn phương thức thanh toán phù hợp.
                </p>
            </div>

            {/* ── NỘI DUNG CHÍNH (2 CỘT CHUẨN DOANH NGHIỆP) ── */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
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
