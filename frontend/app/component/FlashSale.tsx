'use client';
// ===== FLASH SALE SECTION - With discount filter tabs =====
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Flame, Percent } from 'lucide-react';
import { Product } from '@/types';
import ProductCard from './ProductCard';

const DISCOUNT_TABS = [
    { label: 'Tất cả', value: 'all', color: 'bg-[#111111] text-white', activeColor: 'bg-[#111111] text-white' },
    { label: 'Sale 30%+', value: '30', color: 'bg-white text-[#111111] border-gray-200', activeColor: 'bg-[#111111] text-white' },
    { label: 'Sale 50%+', value: '50', color: 'bg-white text-[#111111] border-gray-200', activeColor: 'bg-[#111111] text-white' },
    { label: 'Sale 70%+', value: '70', color: 'bg-white text-[#111111] border-gray-200', activeColor: 'bg-[#111111] text-white' },
];

export default function FlashSale() {
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isActive, setIsActive] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [tabLoading, setTabLoading] = useState(false);

    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

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
                    setDisplayProducts(products.slice(0, 8));

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

    // Lọc sản phẩm theo tab discount được chọn (lọc từ allProducts đã lấy về)
    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setTabLoading(true);

        setTimeout(() => {
            if (tab === 'all') {
                setDisplayProducts(allProducts.slice(0, 8));
            } else {
                const threshold = parseInt(tab, 10);
                const filtered = allProducts.filter(p => {
                    if (p.originalPrice && p.price) {
                        const pct = Math.round((1 - p.price / p.originalPrice) * 100);
                        return pct >= threshold;
                    }
                    return false;
                });
                setDisplayProducts(filtered.slice(0, 8));
            }
            setTabLoading(false);
        }, 300); // Fake delay for animation
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
        <section id="flash-sale" className="py-16 bg-white">
            <div className="container-torano">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="flex items-center gap-4"
                    >
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#D32F2F] text-white animate-pulse">
                            <Zap size={24} fill="currentColor" />
                        </div>
                        <div>
                            <h2 className="text-3xl lg:text-4xl font-extrabold uppercase text-[#D32F2F] tracking-tight">
                                Flash Sale
                            </h2>
                            <p className="text-sm font-medium text-gray-600 mt-1 uppercase tracking-wider">
                                Giá sốc mỗi ngày
                            </p>
                        </div>
                    </motion.div>

                    {/* Countdown Timer */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex items-center gap-2"
                    >
                        <span className="text-sm font-medium text-gray-600 mr-2 uppercase tracking-wide">Kết thúc sau:</span>
                        <div className="flex items-center gap-2">
                            {[
                                { value: timeLeft.hours, color: 'bg-[#D32F2F]' },
                                { value: timeLeft.minutes, color: 'bg-[#D32F2F]' },
                                { value: timeLeft.seconds, color: 'bg-[#D32F2F]' }
                            ].map((unit, i) => (
                                <React.Fragment key={i}>
                                    <div className={`w-12 h-12 flex items-center justify-center ${unit.color} text-white rounded-lg shadow-md`}>
                                        <span className="text-xl font-bold font-mono">
                                            {String(unit.value).padStart(2, '0')}
                                        </span>
                                    </div>
                                    {i < 2 && <span className="text-xl font-bold text-[#D32F2F]">:</span>}
                                </React.Fragment>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Discount Filter Tabs */}
                <div className="flex items-center gap-2 mb-8 flex-wrap">
                    {DISCOUNT_TABS.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => handleTabChange(tab.value)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full border-2 text-sm font-bold transition-all duration-200 ${
                                activeTab === tab.value
                                    ? tab.activeColor + ' border-transparent shadow-md scale-105'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#111111] hover:text-[#111111]'
                            }`}
                        >
                            {tab.value !== 'all' && <Percent size={13} />}
                            {tab.value === 'all' && <Flame size={13} />}
                            {tab.label}
                        </button>
                    ))}
                    <Link
                        href={`/products?discount=${activeTab === 'all' ? 'true' : activeTab}`}
                        className="ml-auto text-xs font-semibold text-[#111111] underline underline-offset-2 hover:text-[#C9A227] transition-colors"
                    >
                        Xem tất cả →
                    </Link>
                </div>

                {/* Products Grid */}
                <AnimatePresence mode="wait">
                    {tabLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 lg:gap-8"
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
                            className="text-center py-16 text-gray-500"
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
                                <ProductCard key={product.id} product={product} index={index} />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* View All Button */}
                <div className="mt-10 flex flex-col items-center gap-4">
                    <Link
                        href="/products?discounted=true"
                        className="inline-flex items-center gap-2 px-10 py-3.5 bg-[#C9A227] text-white font-bold uppercase tracking-wider text-sm rounded-full hover:bg-[#111111] transition-all shadow-md"
                    >
                        Xem tất cả Flash Sale
                    </Link>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <Link href="/products?discount=30" className="inline-flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 text-gray-600 font-semibold text-xs rounded-full hover:border-[#111111] hover:text-[#111111] transition-all">
                            <Percent size={12} /> Sale 30%+
                        </Link>
                        <Link href="/products?discount=50" className="inline-flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 text-gray-600 font-semibold text-xs rounded-full hover:border-[#111111] hover:text-[#111111] transition-all">
                            <Percent size={12} /> Sale 50%+
                        </Link>
                        <Link href="/products?discount=70" className="inline-flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 text-gray-600 font-semibold text-xs rounded-full hover:border-[#111111] hover:text-[#111111] transition-all">
                            <Percent size={12} /> Sale 70%+
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
