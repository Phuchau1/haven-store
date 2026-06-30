'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, ArrowRight, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

function PaymentResultContent() {
    const searchParams = useSearchParams();
    const status = searchParams.get('status');
    const orderId = searchParams.get('orderId');
    const reason = searchParams.get('reason');

    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (status === 'success') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsSuccess(true);
            // Clear cart from local storage since order was successful
            localStorage.removeItem('phstore-cart');
        }
    }, [status]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                {isSuccess ? (
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 size={40} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h1>
                        <p className="text-gray-500 mb-6">
                            Cảm ơn bạn đã mua sắm. Đơn hàng <span className="font-semibold text-black">#{orderId}</span> của bạn đã được thanh toán thành công và đang được xử lý.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                            <XCircle size={40} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thất bại</h1>
                        <p className="text-gray-500 mb-6">
                            Rất tiếc, quá trình thanh toán đơn hàng <span className="font-semibold text-black">#{orderId}</span> của bạn không thành công hoặc đã bị huỷ. 
                            {reason && <span className="block mt-2 text-sm text-red-500">Lý do: {reason}</span>}
                        </p>
                    </div>
                )}

                <div className="space-y-3 mt-8">
                    <Link 
                        href="/nguoidung"
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-black text-white rounded-xl font-medium hover:bg-gray-900 transition-colors"
                    >
                        Xem lịch sử đơn hàng
                        <ArrowRight size={18} />
                    </Link>
                    <Link 
                        href="/collections/all"
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-100 text-gray-900 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                        <ShoppingBag size={18} />
                        Tiếp tục mua sắm
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function PaymentResultPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải kết quả thanh toán...</div>}>
            <PaymentResultContent />
        </Suspense>
    );
}
