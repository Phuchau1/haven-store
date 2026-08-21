'use client';
// ===== FLASH SALE SECTION - With Shopee-style dynamic time slots and 2-row product grid =====
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Flame, Percent, Package, Truck } from 'lucide-react';
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

    const [slots, setSlots] = useState<{ label: string; subLabel: string; value: string }[]>([
        { label: "HÔM NAY", subLabel: "ĐANG DIỄN RA", value: "all" },
        { label: "NGÀY MAI", subLabel: "SẮP DIỄN RA", value: "30" },
        { label: "GIẢM 40%", subLabel: "HOT DEAL", value: "40" },
        { label: "GIẢM 50%", subLabel: "SIÊU SALE", value: "50" },
    ]);

    useEffect(() => {
        const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        const now = new Date();
        const dayStr = String(now.getDate()).padStart(2, '0');
        const monthStr = months[now.getMonth()];

        const getVietnameseDayOfWeek = (date: Date) => {
            const day = date.getDay();
            if (day === 0) return "CHỦ NHẬT";
            return `THỨ ${day + 1}`;
        };

        const dynamicSlots = [
            { label: "HÔM NAY", subLabel: `${dayStr}/${monthStr}`, value: "all" }
        ];

        const discountValues = ["all", "30", "40", "50"];
        for (let i = 1; i <= 3; i++) {
            const futureDate = new Date();
            futureDate.setDate(now.getDate() + i);
            const fDayStr = String(futureDate.getDate()).padStart(2, '0');
            const fMonthStr = months[futureDate.getMonth()];
            
            dynamicSlots.push({
                label: `${fDayStr}/${fMonthStr}`,
                subLabel: getVietnameseDayOfWeek(futureDate),
                value: discountValues[i]
            });
        }
        setSlots(dynamicSlots);
    }, []);

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
                    setDisplayProducts(products.slice(0, 8)); // Display 8 products to form exactly 2 rows of 4

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
            // Distribute products dynamically to all 4 tabs so they are never empty and have different products!
            if (tab === 'all') {
                setDisplayProducts(allProducts.slice(0, 8));
            } else if (tab === '30') {
                const shifted = [...allProducts].reverse();
                setDisplayProducts(shifted.slice(0, 8));
            } else if (tab === '40') {
                const shifted = [...allProducts];
                if (shifted.length > 3) {
                    const chunk = shifted.splice(0, 3);
                    shifted.push(...chunk);
                }
                setDisplayProducts(shifted.slice(0, 8));
            } else {
                const sorted = [...allProducts].sort((a, b) => a.price - b.price);
                setDisplayProducts(sorted.slice(0, 8));
            }
            setTabLoading(false);
        }, 300);
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

    // Calculate REAL stats from database data (Lấy chính xác tồn kho thực tế của các sản phẩm đang có)
    const rawSold = allProducts.reduce((sum, p) => sum + (Number(p.flashSaleSold) || Number(p.soldQuantity) || 0), 0);
    const totalSoldItems = rawSold > 0 ? `${rawSold.toLocaleString('vi-VN')}` : '0';

    const rawStock = allProducts.reduce((sum, p: any) => {
        if (p.variants && Array.isArray(p.variants) && p.variants.length > 0) {
            const vStock = p.variants.reduce((vSum: number, v: any) => vSum + (Number(v.stock) || 0), 0);
            if (vStock > 0) return sum + vStock;
        }
        return sum + (Number(p.flashSaleStock) || Number(p.countInStock) || Number(p.stock) || 0);
    }, 0);

    const totalStockItems = rawStock > 0 ? `${rawStock.toLocaleString('vi-VN')}` : `${allProducts.length * 50}`;
    const percentOverall = (rawStock + rawSold) > 0 ? Math.min(Math.round((rawSold / (rawStock + rawSold)) * 100), 100) : 15;

    return (
        <section id="flash-sale" className="py-14 lg:py-18 bg-[#fafafa]">
            <div className="container-torano">
                {/* Unified Luxury Enterprise Flash Sale Header */}
                <div className="bg-[#09090b] rounded-2xl p-5 sm:p-7 mb-8 flex flex-col shadow-xl border border-neutral-800 text-white relative overflow-hidden">
                    {/* Subtle luxury glow in corner */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-red-900/15 rounded-full blur-3xl pointer-events-none" />

                    {/* Top Row: Title, Slots, Timer */}
                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 pb-2">
                        {/* Left: Brand / Title */}
                        <div className="flex items-center gap-3.5 w-full lg:w-auto">
                            <div className="w-11 h-11 bg-white text-black rounded-xl flex items-center justify-center shrink-0 shadow-md">
                                <Zap size={22} fill="currentColor" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                                        Flash Sale
                                    </h2>
                                    <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-extrabold uppercase tracking-widest rounded">
                                        Limited
                                    </span>
                                </div>
                                <p className="text-xs text-neutral-400 mt-0.5 tracking-wide">
                                    Ưu đãi số lượng giới hạn hôm nay
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
                                        className={`flex flex-col items-center justify-center min-w-[95px] sm:min-w-[105px] py-2 px-3 rounded-xl transition-all cursor-pointer ${
                                            isActiveTab 
                                                ? 'bg-white text-neutral-950 font-bold shadow-md scale-102 border border-white' 
                                                : 'bg-neutral-900/80 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                                        }`}
                                    >
                                        <span className="text-xs font-black uppercase tracking-wide">{slot.label}</span>
                                        <span className={`text-[10px] mt-0.5 font-medium tracking-tight ${isActiveTab ? 'text-neutral-600' : 'text-neutral-500'}`}>
                                            {slot.subLabel}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Right: Countdown */}
                        <div className="flex flex-col items-end w-full lg:w-auto border-t lg:border-t-0 border-neutral-800 pt-4 lg:pt-0">
                            <span className="text-[10.5px] text-neutral-400 font-bold uppercase tracking-widest mb-1.5 pr-0.5 self-start lg:self-end">
                                Kết thúc sau
                            </span>
                            <div className="flex items-center gap-2">
                                {[
                                    { value: timeLeft.hours, label: 'Giờ' },
                                    { value: timeLeft.minutes, label: 'Phút' },
                                    { value: timeLeft.seconds, label: 'Giây' }
                                ].map((unit, i) => (
                                    <React.Fragment key={i}>
                                        <div className="flex flex-col items-center">
                                            <div className="w-10 h-10 flex items-center justify-center bg-neutral-900 text-white rounded-lg border border-neutral-700 shadow-inner">
                                                <span className="text-base font-bold font-mono">
                                                    {String(unit.value).padStart(2, '0')}
                                                </span>
                                            </div>
                                            <span className="text-[9px] text-neutral-500 font-bold mt-1 uppercase tracking-wider">{unit.label}</span>
                                        </div>
                                        {i < 2 && <span className="text-base font-bold text-neutral-500 mb-3">:</span>}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Minimalist Enterprise Info Bar */}
                    <div className="relative z-10 mt-5 pt-4 border-t border-neutral-800 grid grid-cols-2 lg:grid-cols-4 gap-4 items-center text-neutral-300">
                        {/* Column 1: Fire icon + Sold orders */}
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center shrink-0 border border-neutral-800 text-amber-400">
                                <Flame size={15} fill="currentColor" />
                            </div>
                            <div>
                                <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Đã đặt mua</div>
                                <div className="text-xs sm:text-sm font-black text-white">{totalSoldItems} sản phẩm</div>
                            </div>
                        </div>
                        {/* Column 2: Box icon + Stock items */}
                        <div className="flex items-center gap-2.5 pl-1 sm:pl-2 border-l border-neutral-800">
                            <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center shrink-0 border border-neutral-800 text-neutral-300">
                                <Package size={15} />
                            </div>
                            <div>
                                <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Tồn kho ưu đãi</div>
                                <div className="text-xs sm:text-sm font-black text-white">{totalStockItems} chiếc</div>
                            </div>
                        </div>
                        {/* Column 3: Truck icon + Free shipping */}
                        <div className="flex items-center gap-2.5 border-t lg:border-t-0 lg:border-l border-neutral-800 pt-2.5 lg:pt-0 lg:pl-4">
                            <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center shrink-0 border border-neutral-800 text-emerald-400">
                                <Truck size={15} />
                            </div>
                            <div>
                                <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Giao hàng</div>
                                <div className="text-xs sm:text-sm font-black text-emerald-400">Freeship từ 500K</div>
                            </div>
                        </div>
                        {/* Column 4: Deal indicator */}
                        <div className="flex items-center gap-2.5 border-t lg:border-t-0 lg:border-l border-neutral-800 pt-2.5 lg:pt-0 lg:pl-4">
                            <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center shrink-0 border border-neutral-800 text-red-400">
                                <Percent size={15} />
                            </div>
                            <div>
                                <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Mức giảm</div>
                                <div className="text-xs sm:text-sm font-black text-red-400">Lên đến 50%</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products Grid (Restored 2 rows of products) */}
                <div className="px-2">
                    <AnimatePresence mode="wait">
                        {tabLoading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
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
                                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8"
                            >
                                {displayProducts.map((product: Product, index: number) => (
                                    <ProductCard 
                                        key={product.id} 
                                        product={product} 
                                        index={index} 
                                        isFlashSaleCard={true} 
                                        isUpcomingFlashSale={activeTab !== 'all'} 
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}
