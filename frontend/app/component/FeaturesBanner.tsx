'use client';
// ===== BRAND CRAFTSMANSHIP & VALUES SECTION =====
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Scissors, Award, Gift } from 'lucide-react';

const BRAND_PILLARS = [
    {
        icon: Sparkles,
        title: 'Chất Liệu Tuyển Chọn',
        description: 'Cotton Organic, Bamboo & Modal cao cấp, thoáng mát và mềm mại tuyệt đối.',
    },
    {
        icon: Scissors,
        title: 'Form Dáng Chuẩn Á Đông',
        description: 'Thiết kế theo tỷ lệ cơ thể nam giới Việt, tôn nét lịch lãm và trẻ trung.',
    },
    {
        icon: Award,
        title: 'Độ Bền Vượt Trội',
        description: 'Đường may tinh xảo, công nghệ nhuộm giữ màu và chống co rút sau nhiều lần giặt.',
    },
    {
        icon: Gift,
        title: 'Đóng Gói Sang Trọng',
        description: 'Hộp cao cấp kèm túi thơm & thư cảm ơn, sẵn sàng làm quà tặng trang trọng.',
    },
];

export default function FeaturesBanner() {
    return (
        <section className="py-16 lg:py-20 bg-white border-y border-slate-200/80">
            <div className="container-torano">
                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto mb-14">
                    <span className="text-xs font-bold text-[#1e40af] uppercase tracking-[0.25em] block mb-2">
                        Quy Chuẩn Chất Lượng
                    </span>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase text-slate-950 tracking-tight">
                        Giá Trị Thương Hiệu HAVEN
                    </h2>
                    <p className="mt-3 text-sm text-slate-500 font-normal leading-relaxed">
                        Mỗi thiết kế là sự kết hợp giữa tư duy thẩm mỹ hiện đại và tay nghề may đo tỉ mỉ
                    </p>
                </div>

                {/* Pillars Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    {BRAND_PILLARS.map((pillar, index) => (
                        <motion.div
                            key={pillar.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            className="flex flex-col items-start p-6 rounded-2xl bg-[#f8fafc] border border-slate-200/70 hover:border-slate-900 transition-all duration-300 group hover:shadow-md"
                        >
                            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center mb-4 text-[#0a192f] group-hover:bg-[#0a192f] group-hover:text-white group-hover:border-[#0a192f] transition-all duration-300">
                                <pillar.icon size={20} strokeWidth={2} />
                            </div>
                            <h3 className="text-[15px] font-bold text-slate-900 uppercase tracking-tight mb-2 group-hover:text-[#1e40af] transition-colors">
                                {pillar.title}
                            </h3>
                            <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                                {pillar.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
