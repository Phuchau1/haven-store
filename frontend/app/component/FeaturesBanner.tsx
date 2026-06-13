'use client';
// ===== FEATURES BANNER SECTION =====
import React from 'react';
import { motion } from 'framer-motion';
import { Truck, Shield, RefreshCw, Headphones } from 'lucide-react';

const features = [
    {
        icon: Truck,
        title: 'Miễn phí vận chuyển',
        description: 'Cho đơn hàng từ 500K',
    },
    {
        icon: Shield,
        title: 'Bảo hành chất lượng',
        description: 'Cam kết hàng chính hãng',
    },
    {
        icon: RefreshCw,
        title: 'Đổi trả dễ dàng',
        description: 'Trong vòng 30 ngày',
    },
    {
        icon: Headphones,
        title: 'Hỗ trợ 24/7',
        description: 'Luôn sẵn sàng giúp bạn',
    },
];

export default function FeaturesBanner() {
    return (
        <section className="py-16 border-y border-gray-100">
            <div className="container-torano">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="flex flex-col items-center text-center group"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3 group-hover:bg-black group-hover:text-white transition-all duration-300">
                                <feature.icon size={22} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-sm font-medium text-black">{feature.title}</h3>
                            <p className="text-xs text-gray-400 mt-1 font-light">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
