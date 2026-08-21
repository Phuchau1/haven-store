'use client';
// ===== TRUST BAR COMPONENT =====
// Dải tín nhiệm hiển thị ngay dưới Hero Banner
import React from 'react';
import { Truck, RefreshCw, ShieldCheck, CreditCard } from 'lucide-react';

const TRUST_ITEMS = [
    {
        icon: Truck,
        title: 'Miễn phí vận chuyển',
        subtitle: 'Cho đơn từ 500.000đ',
    },
    {
        icon: RefreshCw,
        title: 'Đổi trả 30 ngày',
        subtitle: 'Miễn phí, không cần lý do',
    },
    {
        icon: ShieldCheck,
        title: 'Hàng chính hãng 100%',
        subtitle: 'Cam kết chất lượng',
    },
    {
        icon: CreditCard,
        title: 'Thanh toán an toàn',
        subtitle: 'VISA, MoMo, COD',
    },
];

export default function TrustBar() {
    return (
        <div className="bg-white border-y border-gray-100">
            <div className="container-torano">
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
                    {TRUST_ITEMS.map(({ icon: Icon, title, subtitle }) => (
                        <div
                            key={title}
                            className="flex items-center justify-center gap-3 px-4 py-4 md:py-5 hover:bg-gray-50 transition-colors duration-200"
                        >
                            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-black flex items-center justify-center">
                                <Icon size={16} className="text-white" strokeWidth={2} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[13px] font-semibold text-gray-900 leading-tight truncate">
                                    {title}
                                </p>
                                <p className="text-[11px] text-gray-500 mt-0.5 truncate hidden sm:block">
                                    {subtitle}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
