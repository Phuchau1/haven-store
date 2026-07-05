'use client';
// ===== PRODUCT FILTER COMPONENT =====
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { FilterState } from '@/types';

interface ProductFilterProps {
    filters: FilterState;
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
    isOpen: boolean;
    onClose: () => void;
}

const allSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '29', '30', '31', '32', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44'];

const allColors = [
    { name: 'Đen',   hex: '#1a1a1a' },
    { name: 'Trắng', hex: '#f5f5f5' },
    { name: 'Xám',   hex: '#808080' },
    { name: 'Be',    hex: '#d4c5a9' },
    { name: 'Nâu',   hex: '#8B4513' },
    { name: 'Đỏ',    hex: '#c41e3a' },
    { name: 'Xanh',  hex: '#1a3a5c' },
    { name: 'Hồng',  hex: '#e8b4b8' },
    { name: 'Vàng',  hex: '#d4ac0d' },
    { name: 'Xanh lá', hex: '#2d6a4f' },
];

const sortOptions = [
    { value: 'newest'    as const, label: 'Mới nhất' },
    { value: 'popular'   as const, label: 'Phổ biến nhất' },
    { value: 'price-asc' as const, label: 'Giá: Thấp → Cao' },
    { value: 'price-desc'as const, label: 'Giá: Cao → Thấp' },
];

const MAX_PRICE = 5000000;

function formatPrice(price: number) {
    if (price >= 1000000) return (price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1) + 'tr';
    if (price >= 1000) return Math.round(price / 1000) + 'k';
    return price + 'đ';
}

export default function ProductFilter({ filters, setFilters, isOpen, onClose }: ProductFilterProps) {
    const [categories, setCategories] = useState<{ value: string; label: string }[]>([
        { value: '', label: 'Tất cả' },
    ]);
    const [priceRange, setPriceRange] = useState<[number, number]>(filters.priceRange);
    const [activeThumb, setActiveThumb] = useState<'min' | 'max'>('min');
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Đồng bộ local priceRange khi parent reset
    useEffect(() => {
        setPriceRange(filters.priceRange);
    }, [filters.priceRange]);

    // Fetch danh mục từ API
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/categories');
                const data = await res.json();
                if (data.success && Array.isArray(data.categories)) {
                    const opts = data.categories.map((c: { id: string; name: string }) => ({
                        value: c.id,
                        label: c.name,
                    }));
                    setCategories([{ value: '', label: 'Tất cả' }, ...opts]);
                }
            } catch {
                // giữ fallback mặc định
            }
        };
        fetchCategories();
    }, []);

    const handlePriceChange = (newRange: [number, number]) => {
        setPriceRange(newRange);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setFilters(prev => ({ ...prev, priceRange: newRange }));
        }, 350);
    };

    const toggleSize = (size: string) => {
        setFilters(prev => ({
            ...prev,
            sizes: prev.sizes.includes(size)
                ? prev.sizes.filter(s => s !== size)
                : [...prev.sizes, size],
        }));
    };

    const toggleColor = (color: string) => {
        setFilters(prev => ({
            ...prev,
            colors: prev.colors.includes(color)
                ? prev.colors.filter(c => c !== color)
                : [...prev.colors, color],
        }));
    };

    const resetClientFilters = () => {
        setFilters(prev => ({
            ...prev,
            sizes: [],
            colors: [],
            priceRange: [0, MAX_PRICE],
            sortBy: 'newest',
        }));
    };

    const activeFiltersCount =
        filters.sizes.length +
        filters.colors.length +
        (filters.priceRange[0] > 0 || filters.priceRange[1] < MAX_PRICE ? 1 : 0) +
        (filters.sortBy !== 'newest' ? 1 : 0);

    const renderContent = () => (
        <div className="space-y-7">
            {/* ── Danh mục ─────────────────────────────── */}
            <section>
                <h4 className="text-[11px] font-bold tracking-[0.15em] uppercase text-gray-400 mb-3">
                    Danh mục
                </h4>
                <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                        <button
                            key={cat.value}
                            onClick={() =>
                                setFilters(prev => ({
                                    ...prev,
                                    category: cat.value,
                                    subCategory: '', // reset subCategory khi đổi category
                                }))
                            }
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                                filters.category === cat.value
                                    ? 'bg-black text-white border-black'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* ── Sắp xếp ──────────────────────────────── */}
            <section>
                <h4 className="text-[11px] font-bold tracking-[0.15em] uppercase text-gray-400 mb-3">
                    Sắp xếp
                </h4>
                <div className="grid grid-cols-2 gap-2">
                    {sortOptions.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setFilters(prev => ({ ...prev, sortBy: opt.value }))}
                            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                                filters.sortBy === opt.value
                                    ? 'bg-black text-white border-black'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* ── Kích cỡ ──────────────────────────────── */}
            <section>
                <h4 className="text-[11px] font-bold tracking-[0.15em] uppercase text-gray-400 mb-3">
                    Kích cỡ
                </h4>
                <div className="flex flex-wrap gap-2">
                    {allSizes.map(size => (
                        <button
                            key={size}
                            onClick={() => toggleSize(size)}
                            className={`min-w-[38px] h-9 px-2 rounded-lg text-xs font-semibold transition-all border ${
                                filters.sizes.includes(size)
                                    ? 'bg-black text-white border-black'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                            }`}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </section>

            {/* ── Màu sắc ──────────────────────────────── */}
            <section>
                <h4 className="text-[11px] font-bold tracking-[0.15em] uppercase text-gray-400 mb-3">
                    Màu sắc
                </h4>
                <div className="flex flex-wrap gap-2">
                    {allColors.map(color => {
                        const isSelected = filters.colors.includes(color.name);
                        return (
                            <button
                                key={color.name}
                                onClick={() => toggleColor(color.name)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                                    isSelected
                                        ? 'bg-black text-white border-black'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                }`}
                            >
                                <span
                                    className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-gray-300"
                                    style={{ backgroundColor: color.hex }}
                                />
                                {color.name}
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* ── Khoảng giá ───────────────────────────── */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[11px] font-bold tracking-[0.15em] uppercase text-gray-400">
                        Khoảng giá
                    </h4>
                    <span className="text-xs font-semibold text-black">
                        {formatPrice(priceRange[0])} — {formatPrice(priceRange[1])}
                    </span>
                </div>

                {/* Dual Thumb Slider */}
                <div className="px-1 space-y-3">
                    <div className="relative h-6 flex items-center">
                        {/* Track */}
                        <div className="absolute h-[4px] w-full bg-gray-200 rounded-full" />
                        {/* Active segment */}
                        <div
                            className="absolute h-[4px] bg-black rounded-full"
                            style={{
                                left: `${(priceRange[0] / MAX_PRICE) * 100}%`,
                                right: `${100 - (priceRange[1] / MAX_PRICE) * 100}%`,
                            }}
                        />
                        {/* Min thumb */}
                        <input
                            type="range"
                            min={0} max={MAX_PRICE} step={50000}
                            value={priceRange[0]}
                            onChange={e => {
                                const val = Math.min(Number(e.target.value), priceRange[1] - 50000);
                                handlePriceChange([val, priceRange[1]]);
                            }}
                            onMouseDown={() => setActiveThumb('min')}
                            onTouchStart={() => setActiveThumb('min')}
                            className={`absolute w-full h-1 appearance-none bg-transparent pointer-events-none
                                [&::-webkit-slider-thumb]:pointer-events-auto
                                [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:h-[18px]
                                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none
                                [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2
                                [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-md
                                [&::-webkit-slider-thumb]:cursor-pointer
                                [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-[18px]
                                [&::-moz-range-thumb]:h-[18px] [&::-moz-range-thumb]:rounded-full
                                [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2
                                [&::-moz-range-thumb]:border-black [&::-moz-range-thumb]:shadow-md
                                ${activeThumb === 'min' ? 'z-20' : 'z-10'}`}
                            aria-label="Giá tối thiểu"
                        />
                        {/* Max thumb */}
                        <input
                            type="range"
                            min={0} max={MAX_PRICE} step={50000}
                            value={priceRange[1]}
                            onChange={e => {
                                const val = Math.max(Number(e.target.value), priceRange[0] + 50000);
                                handlePriceChange([priceRange[0], val]);
                            }}
                            onMouseDown={() => setActiveThumb('max')}
                            onTouchStart={() => setActiveThumb('max')}
                            className={`absolute w-full h-1 appearance-none bg-transparent pointer-events-none
                                [&::-webkit-slider-thumb]:pointer-events-auto
                                [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:h-[18px]
                                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none
                                [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2
                                [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-md
                                [&::-webkit-slider-thumb]:cursor-pointer
                                [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-[18px]
                                [&::-moz-range-thumb]:h-[18px] [&::-moz-range-thumb]:rounded-full
                                [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2
                                [&::-moz-range-thumb]:border-black [&::-moz-range-thumb]:shadow-md
                                ${activeThumb === 'max' ? 'z-20' : 'z-10'}`}
                            aria-label="Giá tối đa"
                        />
                    </div>
                    {/* Labels */}
                    <div className="flex justify-between text-[10px] text-gray-400 font-light select-none">
                        <span>0đ</span>
                        <span>5,000,000đ</span>
                    </div>
                </div>
            </section>

            {/* ── Nút xóa bộ lọc ───────────────────────── */}
            {activeFiltersCount > 0 && (
                <button
                    onClick={resetClientFilters}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all"
                >
                    <RotateCcw size={14} />
                    Xóa bộ lọc ({activeFiltersCount})
                </button>
            )}
        </div>
    );

    return (
        <>
            {/* ── Desktop Sidebar ──────────────────────── */}
            <div className="hidden lg:block sticky top-24">
                <div className="flex items-center gap-2 mb-6">
                    <SlidersHorizontal size={16} />
                    <h3 className="text-sm font-bold tracking-wide uppercase">Bộ lọc</h3>
                    {activeFiltersCount > 0 && (
                        <span className="px-2 py-0.5 bg-black text-white text-[10px] rounded-full font-bold">
                            {activeFiltersCount}
                        </span>
                    )}
                </div>
                {renderContent()}
            </div>

            {/* ── Mobile Drawer ────────────────────────── */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
                        />
                        {/* Drawer */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                            className="fixed top-0 left-0 h-full w-80 bg-white z-[60] flex flex-col lg:hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <SlidersHorizontal size={16} />
                                    <h3 className="text-sm font-bold tracking-wide uppercase">Bộ lọc</h3>
                                    {activeFiltersCount > 0 && (
                                        <span className="px-2 py-0.5 bg-black text-white text-[10px] rounded-full">
                                            {activeFiltersCount}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    aria-label="Đóng bộ lọc"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Scrollable content */}
                            <div className="flex-1 overflow-y-auto p-5">
                                {renderContent()}
                            </div>

                            {/* Footer */}
                            <div className="p-5 border-t border-gray-100">
                                <button
                                    onClick={onClose}
                                    className="w-full py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition-colors"
                                >
                                    Xem {'{'}kết quả{'}'} sản phẩm
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
