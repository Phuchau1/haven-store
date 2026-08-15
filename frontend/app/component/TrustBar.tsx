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
        <div className="bg-white border-y border-slate-150">
            <div className="container-torano">
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
                    {TRUST_ITEMS.map(({ icon: Icon, title, subtitle }) => (
                        <div
                            key={title}
                            className="group flex items-center justify-center gap-3 px-4 py-4 md:py-5 hover:bg-slate-50/80 transition-all duration-200"
                        >
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#1e40af] group-hover:bg-[#d97706] flex items-center justify-center transition-colors duration-300 shadow-xs">
                                <Icon size={18} className="text-amber-400 group-hover:text-white transition-colors" strokeWidth={2} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[13.5px] font-bold text-slate-900 leading-tight truncate group-hover:text-amber-700 transition-colors">
                                    {title}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5 truncate hidden sm:block font-medium">
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
