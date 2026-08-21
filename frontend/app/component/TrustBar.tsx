'use client';
import React from 'react';
import { Truck, RefreshCw, ShieldCheck, Clock } from 'lucide-react';

const TRUST_ITEMS = [
    {
        icon: Truck,
        title: 'GIAO HÀNG HỎA TỐC',
        subtitle: 'Miễn phí cho đơn hàng từ 500.000₫',
    },
    {
        icon: RefreshCw,
        title: '30 NGÀY ĐỔI TRẢ',
        subtitle: 'Thủ tục nhanh chóng, tận nơi',
    },
    {
        icon: ShieldCheck,
        title: '100% CHÍNH HÃNG',
        subtitle: 'Cam kết chất liệu và form dáng cao cấp',
    },
    {
        icon: Clock,
        title: 'HỖ TRỢ TƯ VẤN 24/7',
        subtitle: 'Đội ngũ stylist luôn sẵn sàng hỗ trợ',
    },
];

export default function TrustBar() {
    return (
        <div className="bg-[#fafafa] border-y border-neutral-200/80">
            <div className="container-torano">
                <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-neutral-200/80">
                    {TRUST_ITEMS.map(({ icon: Icon, title, subtitle }) => (
                        <div
                            key={title}
                            className="flex items-center gap-3.5 px-4 sm:px-6 py-4 md:py-5.5 hover:bg-white transition-colors duration-300"
                        >
                            <div className="w-10 h-10 rounded-full border border-neutral-300 bg-white flex items-center justify-center text-neutral-900 shrink-0 shadow-2xs">
                                <Icon size={17} strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-neutral-900 tracking-wider uppercase leading-tight truncate">
                                    {title}
                                </p>
                                <p className="text-[11.5px] text-neutral-500 mt-1 truncate leading-tight">
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
