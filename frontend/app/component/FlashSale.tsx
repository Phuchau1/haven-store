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
                            <div key={i} className="aspect-square rounded-2xl shimmer bg-gray-100" />
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
        <section id="flash-sale" className="py-14 sm:py-18 bg-[#fafafa]">
            <div className="container-torano">
                {/* Enterprise High-End Flash Sale Header */}
                <div className="bg-gradient-to-r from-[#881337] via-[#be123c] to-[#e11d48] text-white rounded-2xl p-5 sm:p-6 md:p-7 mb-8 shadow-xl relative overflow-hidden">
                    {/* Subtle light overlay pattern */}
                    <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
                    
                    {/* Top Row: Title, Slots, Timer */}
                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-5 sm:gap-6">
                        {/* Left: Brand Title & Badge */}
                        <div className="flex items-center gap-3.5 w-full lg:w-auto">
                            <div className="w-11 h-11 bg-white/15 backdrop-blur-md border border-white/20 text-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                <Flame size={24} className="text-amber-300 fill-amber-300" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase text-white tracking-tight font-display">
                                        Flash Sale
                                    </h2>
                                    <span className="bg-white text-[#9f1239] text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider shadow-2xs">
                                        Giới hạn
                                    </span>
                                </div>
                                <p className="text-xs text-rose-100/90 mt-0.5 font-medium">
                                    Ưu đãi số lượng có hạn · Cập nhật theo từng khung giờ
                                </p>
                            </div>
                        </div>

                        {/* Middle: Date/Time Slots */}
                        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 hide-scrollbar justify-start lg:justify-center">
                            {slots.map((slot, index) => {
                                const isActiveTab = activeTab === slot.value;
                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleTabChange(slot.value)}
                                        className={`flex flex-col items-center justify-center min-w-[92px] sm:min-w-[102px] py-2 px-3.5 rounded-xl transition-all cursor-pointer border ${
                                            isActiveTab 
                                                ? 'bg-white text-[#9f1239] font-black shadow-lg scale-105 border-white' 
                                                : 'bg-black/20 text-white hover:bg-black/30 border-white/15'
                                        }`}
                                    >
                                        <span className="text-xs font-black uppercase tracking-wider">{slot.label}</span>
                                        <span className={`text-[9.5px] mt-0.5 font-bold uppercase tracking-wider ${isActiveTab ? 'text-[#e11d48]' : 'text-rose-200/90'}`}>
                                            {slot.subLabel}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Right: Countdown */}
                        <div className="flex flex-col items-start lg:items-end w-full lg:w-auto border-t lg:border-t-0 border-white/20 pt-3 lg:pt-0">
                            <span className="text-[10px] text-rose-100 font-bold uppercase tracking-widest mb-1 self-start lg:self-end">
                                Kết thúc sau
                            </span>
                            <div className="flex items-center gap-1.5">
                                {[
                                    { value: timeLeft.hours, label: 'Giờ' },
                                    { value: timeLeft.minutes, label: 'Phút' },
                                    { value: timeLeft.seconds, label: 'Giây' }
                                ].map((unit, i) => (
                                    <React.Fragment key={i}>
                                        <div className="flex items-center gap-1">
                                            <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white text-[#9f1239] rounded-lg shadow-sm font-black font-mono text-sm sm:text-base">
                                                {String(unit.value).padStart(2, '0')}
                                            </div>
                                        </div>
                                        {i < 2 && <span className="text-sm font-bold text-white mb-0.5">:</span>}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="px-1">
                    <AnimatePresence mode="wait">
                        {tabLoading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8"
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                    <div key={i} className="aspect-square rounded-2xl shimmer bg-slate-200/60" />
                                ))}
                            </motion.div>
                        ) : displayProducts.length === 0 ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-16 text-slate-500 bg-white rounded-3xl border border-slate-200"
                            >
                                <Percent size={40} className="mx-auto mb-3 text-slate-300" />
                                <p className="font-semibold text-slate-700">Khung giờ này đang được cập nhật sản phẩm.</p>
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
