'use client';
// ===== BST XUÂN HÈ / COLLECTION BANNER SECTION (ADMIN MANAGED) =====
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface CollectionBannerData {
    id: string;
    title: string;
    subtitle?: string;
    image: string;
    link: string;
    link_text?: string;
    status: string;
}

const DEFAULT_BANNER: CollectionBannerData = {
    id: 'banner-collection-1',
    title: 'BST XUÂN HÈ 2026: EASY DAILY | BẮT NHỊP SỐNG - HÒA NHỊP SỐNG',
    subtitle: '✨ BST Xuân Hè cập bến mang theo tinh thần "Easy" thoải mái trải nghiệm cùng những trang phục "Daily" tiện dụng mỗi ngày. HAVEN tin rằng, khi trang phục đủ nhẹ tênh, tâm trí sẽ tự khắc rộng mở để bạn bắt trọn nhịp điệu cuộc sống. Sẵn sàng cho một diện mạo rạng rỡ và trải nghiệm đầy năng lượng cùng HAVEN ngay hôm nay!',
    image: '/bst-xuan-he-2026.png',
    link: '/products',
    link_text: 'Xem chi tiết',
    status: 'active'
};

export default function FeaturesBanner() {
    const [banner, setBanner] = useState<CollectionBannerData>(DEFAULT_BANNER);

    useEffect(() => {
        const fetchBanner = async () => {
            try {
                const res = await fetch('/api/banners?type=collection');
                const data = await res.json();
                if (data.success && Array.isArray(data.banners) && data.banners.length > 0) {
                    const activeBanner = data.banners.find((b: CollectionBannerData) => b.status === 'active') || data.banners[0];
                    if (activeBanner) {
                        setBanner({
                            id: activeBanner.id || DEFAULT_BANNER.id,
                            title: activeBanner.title || DEFAULT_BANNER.title,
                            subtitle: activeBanner.subtitle || DEFAULT_BANNER.subtitle,
                            image: activeBanner.image || DEFAULT_BANNER.image,
                            link: activeBanner.link || DEFAULT_BANNER.link,
                            link_text: activeBanner.link_text || DEFAULT_BANNER.link_text,
                            status: activeBanner.status || 'active'
                        });
                    }
                }
            } catch (err) {
                console.error('Error fetching collection banner:', err);
            }
        };
        fetchBanner();
    }, []);

    if (banner.status !== 'active') return null;

    return (
        <section className="py-8 sm:py-10 lg:py-12 bg-white border-y border-slate-100 overflow-hidden">
            <div className="container-torano max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-center">
                    {/* ── Left: Collection Banner Image ─────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="lg:col-span-6 relative group"
                    >
                        <Link 
                            href={banner.link || '/products'} 
                            className="block relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-lg border border-slate-100 transition-all duration-500"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={banner.image || '/bst-xuan-he-2026.png'}
                                alt={banner.title}
                                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                        </Link>
                    </motion.div>

                    {/* ── Right: Collection Description & Action ───────── */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="lg:col-span-6 flex flex-col justify-center"
                    >
                        <h2 className="text-xl sm:text-2xl lg:text-[28px] font-black text-slate-900 leading-[1.25] tracking-tight uppercase">
                            {banner.title}
                        </h2>

                        {banner.subtitle && (
                            <div className="mt-3 sm:mt-3.5 space-y-3 text-slate-600 text-[13px] sm:text-[14px] leading-relaxed font-normal">
                                <p className="whitespace-pre-line">{banner.subtitle}</p>
                            </div>
                        )}

                        <div className="mt-4 sm:mt-5">
                            <Link
                                href={banner.link || '/products'}
                                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-900 hover:text-[#C9A227] underline underline-offset-8 decoration-2 hover:decoration-[#C9A227] transition-all group cursor-pointer"
                            >
                                <span>{banner.link_text || 'Xem chi tiết'}</span>
                                <ArrowRight size={16} className="transform group-hover:translate-x-1.5 transition-transform duration-300" />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
