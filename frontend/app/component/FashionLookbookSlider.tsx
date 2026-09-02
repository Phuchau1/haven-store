'use client';

// ===== EDITORIAL FASHION LOOKBOOK CAROUSEL (HUMAN DESIGNED, CONTEMPORARY HIGH-FASHION) =====
import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react';

interface LookbookItem {
    id: string;
    lookNumber: string;
    title: string;
    category: string;
    description: string;
    image: string;
    link: string;
    tag: string;
}

const LOOKBOOK_ITEMS: LookbookItem[] = [
    {
        id: 'look-1',
        lookNumber: '01',
        title: 'Áo Polo Cotton Pique Dệt Phối',
        category: 'Nam • New Collection',
        description: 'Chất vải sợi dệt thoáng khí, bề mặt mềm mịn với phom dáng Regular Fit tôn dáng tự nhiên.',
        image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=1000&auto=format&fit=crop&q=85',
        link: '/products?category=ao-nam',
        tag: 'Bestseller 2026'
    },
    {
        id: 'look-2',
        lookNumber: '02',
        title: 'Sơ Mi Lụa Cổ Cuba Tối Giản',
        category: 'Nam & Nữ • Minimalist',
        description: 'Vẻ đẹp thanh lịch vượt thời gian. Cắt may tinh giản, độ rủ nhẹ nhàng thích hợp cho cả công sở và dạo phố.',
        image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1000&auto=format&fit=crop&q=85',
        link: '/products?category=ao-nam',
        tag: 'Must-Have'
    },
    {
        id: 'look-3',
        lookNumber: '03',
        title: 'Blazer Phom Rộng Cấu Trúc Nhẹ',
        category: 'Nữ • Tailored Fit',
        description: 'Đường may đệm vai tự nhiên, ve áo sắc nét mang lại phong thái tự tin và chỉn chu trong mọi buổi gặp gỡ.',
        image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1000&auto=format&fit=crop&q=85',
        link: '/products?category=ao-nu',
        tag: 'Editorial Pick'
    },
    {
        id: 'look-4',
        lookNumber: '04',
        title: 'Quần Tây Xếp Ly Dáng Đứng',
        category: 'Nam • Smart Casual',
        description: 'Chất liệu pha len chống nhăn cao cấp, đai quần tinh tế cùng đường ly sắc sảo giúp tôn chiều cao người mặc.',
        image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=1000&auto=format&fit=crop&q=85',
        link: '/products?category=quan-nam',
        tag: 'Signature'
    },
    {
        id: 'look-5',
        lookNumber: '05',
        title: 'Set Váy Đầm Suông Linen Tự Nhiên',
        category: 'Nữ • Summer Breeze',
        description: 'Chất liệu sợi lanh 100% tự nhiên được xử lý mềm mượt, mang lại cảm giác mát lành và bay bổng suốt ngày dài.',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&auto=format&fit=crop&q=85',
        link: '/products?category=dam-nu',
        tag: 'New Season'
    }
];

export default function FashionLookbookSlider() {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScrollButtons = () => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setCanScrollLeft(scrollLeft > 10);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    };

    const handleScroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return;
        const cardWidth = 360;
        const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
        scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    };

    return (
        <section className="py-16 sm:py-20 lg:py-24 bg-[#fafbfc] border-y border-slate-200/80 overflow-hidden">
            <div className="container-torano">
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 lg:mb-14 gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2.5">
                            <span className="w-6 h-[1.5px] bg-slate-900" />
                            <span className="text-[11px] font-bold tracking-[2.5px] uppercase text-slate-500">
                                HAVEN EDITORIAL • ARCHIVE 2026
                            </span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                            Cảm Hứng Thời Trang Đương Đại
                        </h2>
                        <p className="text-sm text-slate-600 font-normal mt-2 max-w-xl">
                            Khám phá những bản phối phong cách được tạo nên từ phom dáng chuẩn mực và chất liệu tự nhiên cao cấp.
                        </p>
                    </div>

                    {/* Navigation Arrows */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleScroll('left')}
                            disabled={!canScrollLeft}
                            className={`w-11 h-11 rounded-full border border-slate-200 flex items-center justify-center transition-all cursor-pointer ${
                                canScrollLeft
                                    ? 'bg-white hover:bg-slate-900 hover:text-white hover:border-slate-900 text-slate-800 shadow-sm'
                                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                            }`}
                            aria-label="Lướt sang trái"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <button
                            onClick={() => handleScroll('right')}
                            disabled={!canScrollRight}
                            className={`w-11 h-11 rounded-full border border-slate-200 flex items-center justify-center transition-all cursor-pointer ${
                                canScrollRight
                                    ? 'bg-white hover:bg-slate-900 hover:text-white hover:border-slate-900 text-slate-800 shadow-sm'
                                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                            }`}
                            aria-label="Lướt sang phải"
                        >
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>

                {/* Sliding Cards Container */}
                <div
                    ref={scrollContainerRef}
                    onScroll={checkScrollButtons}
                    className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none select-none"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {LOOKBOOK_ITEMS.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.45, delay: index * 0.08 }}
                            className="w-[290px] sm:w-[330px] lg:w-[360px] flex-shrink-0 snap-start group"
                        >
                            <Link href={item.link} className="block">
                                {/* Image Box */}
                                <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-slate-100 mb-4 border border-slate-200/70 shadow-xs group-hover:shadow-xl transition-all duration-500">
                                    <Image
                                        src={item.image}
                                        alt={item.title}
                                        fill
                                        sizes="(max-width: 640px) 290px, (max-width: 1024px) 330px, 360px"
                                        className="object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                                    />

                                    {/* Gradient overlay on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                    {/* Look number badge */}
                                    <div className="absolute top-3.5 left-3.5 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-slate-900 text-xs font-bold font-mono tracking-wider shadow-sm">
                                        LOOK {item.lookNumber}
                                    </div>

                                    {/* Tag badge */}
                                    <div className="absolute top-3.5 right-3.5 px-2.5 py-1 bg-slate-900/80 backdrop-blur-md rounded-full text-white text-[11px] font-semibold tracking-wide">
                                        {item.tag}
                                    </div>

                                    {/* Bottom Discover CTA */}
                                    <div className="absolute bottom-4 left-4 right-4 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-between text-white text-xs font-bold uppercase tracking-wider">
                                        <span>Xem chi tiết sản phẩm</span>
                                        <div className="w-7 h-7 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-md">
                                            <ArrowUpRight size={15} strokeWidth={2.5} />
                                        </div>
                                    </div>
                                </div>

                                {/* Content Info */}
                                <div className="space-y-1.5 px-1">
                                    <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                                        {item.category}
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-800 transition-colors leading-snug line-clamp-1">
                                        {item.title}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-normal leading-relaxed line-clamp-2">
                                        {item.description}
                                    </p>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom View All Link */}
                <div className="mt-10 text-center">
                    <Link
                        href="/products"
                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-sm hover:shadow-md cursor-pointer"
                    >
                        <span>Xem Tất Cả Sản Phẩm Mới</span>
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        </section>
    );
}