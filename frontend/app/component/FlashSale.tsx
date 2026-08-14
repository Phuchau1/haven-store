'use client';
// ===== FLASH SALE SECTION - With Shopee-style dynamic time slots and product slider =====
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Flame, Percent, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '@/types';
import ProductCard from './ProductCard';

export default function FlashSale() {
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isActive, setIsActive] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [tabLoading, setTabLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
    
    const scrollRef = useRef<HTMLDivElement>(null);

    // Generate dynamic date slots for the header bar
    const getFlashSaleSlots = () => {
        const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        const now = new Date();
        
        const slots = [
            { label: "Hôm nay", subLabel: "ĐANG DIỄN RA", value: "all" }
        ];
        
        const discountValues = ["all", "30", "40", "50"];
        for (let i = 1; i <= 3; i++) {
            const futureDate = new Date();
            futureDate.setDate(now.getDate() + i);
            const dayStr = String(futureDate.getDate()).padStart(2, '0');
            const monthStr = months[futureDate.getMonth()];
            
            slots.push({
                label: `${dayStr}/${monthStr}`,
                subLabel: "SẮP MỞ",
                value: discountValues[i]
            });
        }
        return slots;
    };
    
    const slots = getFlashSaleSlots();

    useEffect(() => {
        let timer: NodeJS.Timeout;

        const fetchData = async () => {
            try {
                const res = await fetch('/api/flash-sales/active');
                const json = await res.json();

                if (json.success && json.data) {
                    const flashSaleData = json.data;
                    setIsActive(true);
                    
                    const products = flashSaleData.products || [];
                    setAllProducts(products);
                    setDisplayProducts(products.slice(0, 12)); // Fetch more products to support sliding

                    if (flashSaleData.endTime) {
                        const targetDate = new Date(flashSaleData.endTime);
                        timer = setInterval(() => {
                            const distance = targetDate.getTime() - new Date().getTime();
                            if (distance < 0) {
                                setIsActive(false);
                                clearInterval(timer);
                            } else {
                                setTimeLeft({
                                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                                    seconds: Math.floor((distance % (1000 * 60)) / 1000)
                                });
                            }
                        }, 1000);
                    }
                } else {
                    setIsActive(false);
                }
            } catch (error) {
                console.error('Fetch error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        return () => { if (timer) clearInterval(timer); };
    }, []);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setTabLoading(true);

        setTimeout(() => {
            if (tab === 'all') {
                setDisplayProducts(allProducts.slice(0, 12));
            } else {
                const threshold = parseInt(tab, 10);
                const filtered = allProducts.filter(p => {
                    if (p.originalPrice && p.price && p.originalPrice > p.price) {
                        const pct = Math.round((1 - p.price / p.originalPrice) * 100);
                        return pct >= threshold;
                    }
                    return false;
                });
                setDisplayProducts(filtered.slice(0, 12));
            }
            setTabLoading(false);
        }, 300);
    };

    const handleScroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollAmount = clientWidth * 0.75;
            scrollRef.current.scrollTo({
                left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (loading) {
        return (
            <section className="py-16 bg-white">
                <div className="container-torano">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="aspect-[3/4] rounded-2xl shimmer bg-gray-100" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (!isActive || allProducts.length === 0) return null;

    return (
        <section id="flash-sale" className="py-16 bg-white overflow-hidden">
            <div className="container-torano">
                {/* Unified Premium Shopee-style Header Bar */}
                <div className="bg-gradient-to-r from-[#D32F2F] to-[#b71c1c] rounded-2xl p-4 md:p-6 mb-8 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-lg border border-red-700/20">
                    
                    {/* Left: Brand / Title */}
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white text-[#D32F2F] shadow-md animate-bounce">
                            <Zap size={26} fill="currentColor" />
                        </div>
                        <div>
                            <h2 className="text-2xl lg:text-3xl font-extrabold uppercase text-white tracking-tight leading-none">
                                Flash Sale
                            </h2>
                            <p className="text-[11px] font-bold text-red-100 mt-1 uppercase tracking-wider">
                                Giá sốc mỗi ngày
                            </p>
                        </div>
                    </div>

                    {/* Middle: Date/Time Slots */}
                    <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 hide-scrollbar justify-start lg:justify-center">
                        {slots.map((slot, index) => {
                            const isActiveTab = activeTab === slot.value;
                            return (
                                <button
                                    key={index}
                                    onClick={() => handleTabChange(slot.value)}
                                    className={`flex flex-col items-center justify-center min-w-[90px] sm:min-w-[100px] py-1.5 px-3 rounded-xl transition-all ${
                                        isActiveTab 
                                            ? 'bg-white text-[#D32F2F] font-bold shadow-md scale-105 border-2 border-white' 
                                            : 'bg-red-800/40 text-red-100 hover:bg-red-800/60 border-2 border-transparent'
                                    }`}
                                >
                                    <span className="text-sm font-extrabold">{slot.label}</span>
                                    <span className={`text-[9px] mt-0.5 font-bold uppercase tracking-wider ${isActiveTab ? 'text-[#D32F2F]/80' : 'text-red-200'}`}>
                                        {slot.subLabel}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Right: Countdown & Link */}
                    <div className="flex items-center justify-between lg:justify-end w-full lg:w-auto gap-6 border-t lg:border-t-0 border-red-800/50 pt-4 lg:pt-0">
                        <div className="flex items-center gap-3">
                            {[
                                { value: timeLeft.hours, label: 'Giờ' },
                                { value: timeLeft.minutes, label: 'Phút' },
                                { value: timeLeft.seconds, label: 'Giây' }
                            ].map((unit, i) => (
                                <React.Fragment key={i}>
                                    <div className="flex flex-col items-center">
                                        <div className="w-11 h-11 flex items-center justify-center bg-[#111111] text-white rounded-xl shadow-md border border-neutral-800">
                                            <span className="text-lg font-bold font-mono">
                                                {String(unit.value).padStart(2, '0')}
                                            </span>
                                        </div>
                                        <span className="text-[9px] text-red-100 font-bold mt-1 uppercase tracking-wider">{unit.label}</span>
                                    </div>
                                    {i < 2 && <span className="text-lg font-bold text-white mb-4">:</span>}
                                </React.Fragment>
                            ))}
                        </div>
                        
                        <Link
                            href="/khuyen-mai/giam-gia"
                            className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-white bg-red-800/60 hover:bg-white hover:text-[#D32F2F] px-4 py-2.5 rounded-xl transition-all shadow-sm"
                        >
                            Xem tất cả &gt;
                        </Link>
                    </div>
                </div>

                {/* Products Carousel Slider */}
                <div className="relative group/slider px-2">
                    {/* Left Navigation Arrow */}
                    <button 
                        onClick={() => handleScroll('left')}
                        className="absolute left-[-15px] top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-[#D32F2F] hover:text-white transition-all opacity-0 group-hover/slider:opacity-100"
                        aria-label="Trước"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    
                    <AnimatePresence mode="wait">
                        {tabLoading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="grid grid-cols-2 md:grid-cols-4 gap-4"
                            >
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="aspect-[3/4] rounded-2xl shimmer bg-red-100/40" />
                                ))}
                            </motion.div>
                        ) : displayProducts.length === 0 ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-16 text-gray-500 bg-gray-50 rounded-2xl"
                            >
                                <Percent size={40} className="mx-auto mb-3 text-red-200" />
                                <p className="font-medium">Không có sản phẩm sale {activeTab !== 'all' ? `${activeTab}%+` : ''} nào.</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.25 }}
                                ref={scrollRef}
                                className="flex gap-4 md:gap-6 overflow-x-auto scroll-smooth hide-scrollbar pb-6 snap-x snap-mandatory"
                                style={{ scrollbarWidth: 'none' }}
                            >
                                {displayProducts.map((product: Product, index: number) => (
                                    <div key={product.id} className="min-w-[250px] sm:min-w-[280px] md:min-w-[290px] snap-start flex-shrink-0">
                                        <ProductCard product={product} index={index} isFlashSaleCard={true} />
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Right Navigation Arrow */}
                    <button 
                        onClick={() => handleScroll('right')}
                        className="absolute right-[-15px] top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-[#D32F2F] hover:text-white transition-all opacity-0 group-hover/slider:opacity-100"
                        aria-label="Sau"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* View All Button */}
                <div className="mt-8 flex flex-col items-center gap-4">
                    <Link
                        href="/khuyen-mai/giam-gia"
                        className="inline-flex items-center gap-2 px-10 py-3.5 bg-[#C9A227] text-white font-bold uppercase tracking-wider text-sm rounded-full hover:bg-[#111111] transition-all shadow-md"
                    >
                        Xem tất cả Flash Sale
                    </Link>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <Link href="/khuyen-mai/giam-gia-20" className="inline-flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 text-gray-600 font-semibold text-xs rounded-full hover:border-[#111111] hover:text-[#111111] transition-all">
                            <Percent size={12} /> Sale 20%+
                        </Link>
                        <Link href="/khuyen-mai/giam-gia-30" className="inline-flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 text-gray-600 font-semibold text-xs rounded-full hover:border-[#111111] hover:text-[#111111] transition-all">
                            <Percent size={12} /> Sale 30%+
                        </Link>
                        <Link href="/khuyen-mai/giam-gia-40" className="inline-flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 text-gray-600 font-semibold text-xs rounded-full hover:border-[#111111] hover:text-[#111111] transition-all">
                            <Percent size={12} /> Sale 40%+
                        </Link>
                        <Link href="/khuyen-mai/giam-gia-50" className="inline-flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 text-gray-600 font-semibold text-xs rounded-full hover:border-[#111111] hover:text-[#111111] transition-all">
                            <Percent size={12} /> Sale 50%+
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
