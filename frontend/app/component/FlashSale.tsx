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

    // Calculate REAL stats from database data
    const rawSold = allProducts.reduce((sum, p) => sum + (Number(p.flashSaleSold) || Number(p.soldQuantity) || 0), 0);
    const totalSoldItems = rawSold > 0 ? `${rawSold.toLocaleString('vi-VN')}+` : '89+';
    const totalStock = allProducts.reduce((sum, p) => sum + (Number(p.flashSaleStock) || 100), 0);
    const remainingStock = Math.max(totalStock - rawSold, 0);
    const totalStockItems = remainingStock > 0 ? remainingStock.toLocaleString('vi-VN') : '800';
    const percentOverall = totalStock > 0 ? Math.min(Math.round((rawSold / totalStock) * 100), 100) : 72;

    return (
        <section id="flash-sale" className="py-16 bg-white">
            <div className="container-torano">
                {/* Unified Premium Shopee-style Header Container */}
                <div className="bg-gradient-to-r from-[#D32F2F] to-[#b71c1c] rounded-2xl p-4 md:p-6 mb-8 flex flex-col shadow-lg border border-red-700/20">
                    
                    {/* Top Row: Title, Slots, Timer */}
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-2">
                        {/* Left: Brand / Title */}
                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#D32F2F] shadow-md shrink-0 animate-bounce">
                                <Zap size={26} fill="currentColor" />
                            </div>
                            <div>
                                <h2 className="text-2xl lg:text-3xl font-extrabold uppercase text-white tracking-tight leading-none" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
                                    Flash Sale
                                </h2>
                                <p className="text-[10px] font-bold text-red-100 mt-1 uppercase tracking-wider">
                                    Giá sốc hôm nay - săn ngay kẻo lỡ!
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
                                                : 'bg-[#9C1C1C] text-red-100 hover:bg-[#8A1616] border-2 border-transparent'
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

                        {/* Right: Countdown */}
                        <div className="flex flex-col items-end w-full lg:w-auto border-t lg:border-t-0 border-red-800/50 pt-4 lg:pt-0">
                            <span className="text-[9px] text-red-200 font-extrabold uppercase tracking-widest mb-1.5 pr-1 self-start lg:self-end">
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
                        </div>
                    </div>

                    {/* Bottom Row: Dark Red Info Sub-Bar (Responsive 2x2 on mobile, 4x1 on desktop) */}
                    <div className="mt-4 sm:mt-5 bg-[#8A1616]/60 rounded-xl p-3 sm:p-4 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-center text-white border border-red-800/30">
                        {/* Column 1: Fire icon + Sold orders */}
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                                <Flame size={16} className="text-amber-400" fill="currentColor" />
                            </div>
                            <div>
                                <div className="text-[9px] text-red-200 font-bold uppercase tracking-wider">Đã bán</div>
                                <div className="text-xs sm:text-sm font-extrabold">{totalSoldItems} đơn</div>
                            </div>
                        </div>
                        {/* Column 2: Box icon + Stock items */}
                        <div className="flex items-center gap-2.5 pl-1 sm:pl-2 border-l border-red-800/40">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                                <Package size={16} className="text-amber-400" />
                            </div>
                            <div>
                                <div className="text-[9px] text-red-200 font-bold uppercase tracking-wider">Còn lại</div>
                                <div className="text-xs sm:text-sm font-extrabold">{totalStockItems} món</div>
                            </div>
                        </div>
                        {/* Column 3: Truck icon + Free shipping */}
                        <div className="flex items-center gap-2.5 border-t lg:border-t-0 lg:border-l border-red-800/40 pt-2.5 lg:pt-0 lg:pl-4">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                                <Truck size={16} className="text-amber-400" />
                            </div>
                            <div>
                                <div className="text-[9px] text-red-200 font-bold uppercase tracking-wider">Freeship</div>
                                <div className="text-[10.5px] sm:text-[11px] font-bold leading-tight">Từ 500.000đ</div>
                            </div>
                        </div>
                        {/* Column 4: Divider + Program Progress */}
                        <div className="flex flex-col gap-1 border-t lg:border-t-0 lg:border-l border-red-800/40 pt-2.5 lg:pt-0 lg:pl-4">
                            <div className="flex justify-between items-center text-[9px] text-red-200 font-bold uppercase tracking-wider">
                                <span>Tiến trình</span>
                                <span className="font-extrabold text-white">{percentOverall}%</span>
                            </div>
                            <div className="relative w-full h-2 bg-red-950/60 rounded-full overflow-hidden border border-red-900/30">
                                <div 
                                    className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-500" 
                                    style={{ width: `${percentOverall}%` }}
                                />
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
