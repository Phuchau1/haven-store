'use client';
// ===== ENTERPRISE TRUST BAR =====
import React from 'react';
import { Truck, RotateCcw, ShieldCheck, Headphones } from 'lucide-react';

const TRUST_ITEMS = [
    {
        icon: Truck,
        title: 'Miễn Phí Vận Chuyển',
        subtitle: 'Cho mọi đơn hàng từ 500.000đ',
    },
    {
        icon: RotateCcw,
        title: 'Đổi Hàng Trong 30 Ngày',
        subtitle: 'Đổi size & mẫu tận nhà miễn phí',
    },
    {
        icon: ShieldCheck,
        title: 'Chất Lượng Cam Kết',
        subtitle: '100% sản phẩm đạt tiêu chuẩn cao cấp',
    },
    {
        icon: Headphones,
        title: 'Chăm Sóc Khách Hàng 24/7',
        subtitle: 'Tư vấn tận tâm & hỗ trợ nhanh chóng',
    },
];

export default function TrustBar() {
    return (
        <div className="bg-[#f8fafc] border-y border-slate-200/80">
            <div className="container-torano">
                <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80">
                    {TRUST_ITEMS.map(({ icon: Icon, title, subtitle }) => (
                        <div
                            key={title}
                            className="flex items-center gap-3.5 px-4 sm:px-6 py-4 md:py-5 hover:bg-white transition-colors duration-300 group"
                        >
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-[#0a192f] group-hover:bg-[#0a192f] group-hover:text-white group-hover:border-[#0a192f] transition-all duration-300">
                                <Icon size={18} strokeWidth={2} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[13px] sm:text-[13.5px] font-bold text-slate-900 leading-tight uppercase tracking-wide truncate">
                                    {title}
                                </p>
                                <p className="text-[11.5px] text-slate-500 mt-1 truncate">
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
