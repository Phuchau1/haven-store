'use client';
// ===== BRAND CRAFTSMANSHIP & PHILOSOPHY SECTION =====
import React from 'react';
import { motion } from 'framer-motion';
import { Feather, Compass, ShieldCheck, PackageCheck } from 'lucide-react';

const BRAND_PILLARS = [
    {
        number: '01',
        icon: Feather,
        title: 'Sợi Vải Tự Nhiên',
        description: 'Ưu tiên Organic Cotton, Modal & Bamboo có nguồn gốc rõ ràng. Cho bề mặt vải êm mịn, thoáng khí tự nhiên và an toàn cho làn da.',
    },
    {
        number: '02',
        icon: Compass,
        title: 'Phom Dáng Hiệu Chỉnh Tỉ Mỉ',
        description: 'Mỗi mẫu thiết kế trải qua hàng chục lần điều chỉnh trên vóc dáng thực tế, đảm bảo đường nét lịch lãm mà vẫn thoải mái khi chuyển động.',
    },
    {
        number: '03',
        icon: ShieldCheck,
        title: 'Kỹ Thuật May Tinh Thảo',
        description: 'Mật độ chỉ may dày dặn, xử lý đường nét sắc sảo và công nghệ xử lý bề mặt giúp sản phẩm giữ phom chuẩn bền lâu qua nhiều lần giặt.',
    },
    {
        number: '04',
        icon: PackageCheck,
        title: 'Trải Nghiệm Mở Hộp Tinh Tế',
        description: 'Mỗi đơn hàng được đóng gói chỉn chu trong hộp cứng bảo vệ cao cấp, đính kèm túi thơm thảo mộc và thiệp cảm ơn cá nhân hóa.',
    },
];

export default function FeaturesBanner() {
    return (
        <section className="py-20 lg:py-24 bg-[#fafafa] border-y border-slate-200/80">
            <div className="container-torano">
                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <span className="text-xs font-bold text-amber-800 tracking-wide uppercase block mb-3">
                        Triết Lý Thiết Kế
                    </span>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight uppercase">
                        Sự Tinh Tế Trong Từng Chi Tiết
                    </h2>
                    <div className="w-12 h-[2px] bg-slate-900 mx-auto my-4 opacity-80" />
                    <p className="text-sm sm:text-[15px] text-slate-600 font-normal leading-relaxed">
                        Không chạy theo xu hướng nhất thời. HAVEN tập trung tạo nên những trang phục bền vững với thời gian — nơi chất liệu tự nhiên gặp gỡ kỹ thuật may đo chuẩn xác.
                    </p>
                </div>

                {/* Pillars Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {BRAND_PILLARS.map((pillar, index) => (
                        <motion.div
                            key={pillar.title}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.12 }}
                            className="relative flex flex-col p-8 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-900 shadow-sm hover:shadow-lg transition-all duration-300 group"
                        >
                            {/* Number & Icon Row */}
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-3xl font-light font-mono text-slate-300 group-hover:text-amber-800 transition-colors duration-300">
                                    {pillar.number}
                                </span>
                                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-300 shadow-xs">
                                    <pillar.icon size={19} strokeWidth={1.8} />
                                </div>
                            </div>

                            <h3 className="text-[16px] font-bold text-slate-900 mb-3 tracking-tight group-hover:text-slate-900 transition-colors">
                                {pillar.title}
                            </h3>
                            
                            <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                                {pillar.description}
                            </p>

                            {/* Subtle line indicator on hover */}
                            <div className="absolute bottom-0 left-8 right-8 h-[2px] bg-slate-900 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
