'use client';
// ===== PRODUCT FILTER COMPONENT =====
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal } from 'lucide-react';
import { FilterState } from '@/types';
// formatPrice removed
interface ProductFilterProps {
    filters: FilterState;
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
    isOpen: boolean;
    onClose: () => void;
}

const allSizes = ['S', 'M', 'L', 'XL', 'XXL', '28', '29', '30', '31', '32', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44'];
const allColors = [
    { name: 'Đen', hex: '#1a1a1a' },
    { name: 'Trắng', hex: '#ffffff' },
    { name: 'Xám', hex: '#808080' },
    { name: 'Be', hex: '#d4c5a9' },
    { name: 'Nâu', hex: '#8B4513' },
    { name: 'Đỏ', hex: '#c41e3a' },
    { name: 'Xanh', hex: '#1a3a5c' },
    { name: 'Hồng', hex: '#e8b4b8' },
];


const sortOptions = [
    { value: 'newest' as const, label: 'Mới nhất' },
    { value: 'popular' as const, label: 'Phổ biến nhất' },
    { value: 'price-asc' as const, label: 'Giá: Thấp → Cao' },
    { value: 'price-desc' as const, label: 'Giá: Cao → Thấp' },
];

const colorSwatchClasses: Record<string, string> = {
    'Đen': 'bg-[#1a1a1a]',
    'Trắng': 'bg-[#ffffff]',
    'Xám': 'bg-[#808080]',
    'Be': 'bg-[#d4c5a9]',
    'Nâu': 'bg-[#8B4513]',
    'Đỏ': 'bg-[#c41e3a]',
    'Xanh': 'bg-[#1a3a5c]',
    'Hồng': 'bg-[#e8b4b8]',
};

export default function ProductFilter({ filters, setFilters, isOpen, onClose }: ProductFilterProps) {
    const [categories, setCategories] = useState<{value: string, label: string}[]>([{ value: '', label: 'Tất cả' }]);
    const [priceRange, setPriceRange] = useState<[number, number]>(filters.priceRange);
    const [activeThumb, setActiveThumb] = useState<'min' | 'max'>('min');
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    // Helper: format price with commas to match screenshot exactly
    const formatPriceWithCommas = (price: number): string => {
        if (price === 0) return '0đ';
        return price.toLocaleString('en-US') + 'đ';
    };

    // Sync local state when parent filters.priceRange changes (e.g. on Reset)
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPriceRange(filters.priceRange);
    }, [filters.priceRange]);

    const handleLocalPriceChange = (newRange: [number, number]) => {
        setPriceRange(newRange);
        
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        
        debounceTimeout.current = setTimeout(() => {
            setFilters((prev) => ({
                ...prev,
                priceRange: newRange,
            }));
        }, 400); // 400ms debounce
    };

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/categories');
                const data = await res.json();
                if (data.success && data.categories) {
                    const dynamicOptions = data.categories.map((c: Record<string, string>) => ({
                        value: c.id,
                        label: c.name
                    }));
                    setCategories([{ value: '', label: 'Tất cả' }, ...dynamicOptions]);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, []);

    const toggleSize = (size: string) => {
        setFilters((prev) => ({
            ...prev,
            sizes: prev.sizes.includes(size)
                ? prev.sizes.filter((s) => s !== size)
                : [...prev.sizes, size],
        }));
    };

    const toggleColor = (color: string) => {
        setFilters((prev) => ({
            ...prev,
            colors: prev.colors.includes(color)
                ? prev.colors.filter((c) => c !== color)
                : [...prev.colors, color],
        }));
    };

    const resetFilters = () => {
        setFilters({
            category: '',
            search: '',
            sizes: [],
            colors: [],
            priceRange: [0, 3000000],
            sortBy: 'newest',
        });
    };

    const activeFiltersCount =
        (filters.category ? 1 : 0) +
        filters.sizes.length +
        filters.colors.length +
        (filters.priceRange[0] > 0 || filters.priceRange[1] < 3000000 ? 1 : 0);

    const renderFilterContent = () => (
        <div className="space-y-6">
            {/* Category */}
            <div>
                <h4 className="text-xs font-semibold tracking-wider uppercase text-gray-400 mb-3">Danh mục</h4>
                <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                        <button
                            key={cat.value}
                            onClick={() => setFilters((prev) => ({ ...prev, category: cat.value }))}
                            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${filters.category === cat.value
                                    ? 'bg-black text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sort */}
            <div>
                <h4 className="text-xs font-semibold tracking-wider uppercase text-gray-400 mb-3">Sắp xếp</h4>
                <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as FilterState['sortBy'] }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 transition-all"
                    aria-label="Chọn cách sắp xếp"
                >
                    {sortOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {/* Size */}
            <div>
                <h4 className="text-xs font-semibold tracking-wider uppercase text-gray-400 mb-3">Kích cỡ</h4>
                <div className="flex flex-wrap gap-2">
                    {allSizes.map((size) => (
                        <button
                            key={size}
                            onClick={() => toggleSize(size)}
                            className={`min-w-[40px] h-9 px-2 rounded-lg text-xs font-medium transition-all ${filters.sizes.includes(size)
                                    ? 'bg-black text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </div>

            {/* Color */}
            <div>
                <h4 className="text-xs font-semibold tracking-wider uppercase text-gray-400 mb-3">Màu sắc</h4>
                <div className="flex flex-wrap gap-2">
                    {allColors.map((color) => (
                        <button
                            key={color.name}
                            onClick={() => toggleColor(color.name)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${filters.colors.includes(color.name)
                                    ? 'bg-black text-white'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <span
                                className={`w-3.5 h-3.5 rounded-full border border-gray-200 ${colorSwatchClasses[color.name] || ''}`}
                            />
                            {color.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Price Range */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-black">Khoảng giá</h4>
                    <span className="text-sm font-light text-gray-400">—</span>
                </div>
                <div className="space-y-4 px-1">
                    {/* Tooltips */}
                    <div className="relative h-7 w-full mb-1">
                        {/* Min Tooltip */}
                        <div 
                            className="absolute bg-gray-50 border border-gray-200 text-gray-800 text-[10px] px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap -translate-x-1/2 z-30"
                            style={{ left: `${(priceRange[0] / 3000000) * 100}%` }}
                        >
                            {formatPriceWithCommas(priceRange[0])}
                        </div>
                        
                        {/* Max Tooltip */}
                        <div 
                            className="absolute bg-gray-50 border border-gray-200 text-gray-800 text-[10px] px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap -translate-x-1/2 z-30"
                            style={{ left: `${(priceRange[1] / 3000000) * 100}%` }}
                        >
                            {formatPriceWithCommas(priceRange[1])}
                        </div>
                    </div>

                    {/* Dual Range Sliders Container */}
                    <div className="relative h-6 w-full flex items-center">
                        {/* Custom Track Background */}
                        <div className="absolute h-[5px] w-full bg-gray-200 rounded-lg pointer-events-none" />
                        
                        {/* Active Track Highlight */}
                        <div 
                            className="absolute h-[5px] bg-[#1c1c1c] rounded-lg pointer-events-none" 
                            style={{
                                left: `${(priceRange[0] / 3000000) * 100}%`,
                                right: `${100 - (priceRange[1] / 3000000) * 100}%`
                            }}
                        />

                        {/* Min Range Slider */}
                        <input
                            type="range"
                            min={0}
                            max={3000000}
                            step={10000}
                            value={priceRange[0]}
                            onChange={(e) => {
                                const val = Math.min(Number(e.target.value), priceRange[1] - 10000);
                                handleLocalPriceChange([val, priceRange[1]]);
                            }}
                            onMouseDown={() => setActiveThumb('min')}
                            onTouchStart={() => setActiveThumb('min')}
                            className={`absolute w-full h-1 bg-transparent appearance-none pointer-events-none cursor-pointer focus:outline-none 
                                       [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-neutral-800
                                       [&::-moz-range-thumb]:w-[18px] [&::-moz-range-thumb]:h-[18px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-neutral-800
                                       ${activeThumb === 'min' ? 'z-30' : 'z-20'}`}
                            aria-label="Giá tối thiểu"
                        />

                        {/* Max Range Slider */}
                        <input
                            type="range"
                            min={0}
                            max={3000000}
                            step={10000}
                            value={priceRange[1]}
                            onChange={(e) => {
                                const val = Math.max(Number(e.target.value), priceRange[0] + 10000);
                                handleLocalPriceChange([priceRange[0], val]);
                            }}
                            onMouseDown={() => setActiveThumb('max')}
                            onTouchStart={() => setActiveThumb('max')}
                            className={`absolute w-full h-1 bg-transparent appearance-none pointer-events-none cursor-pointer focus:outline-none 
                                       [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-neutral-800
                                       [&::-moz-range-thumb]:w-[18px] [&::-moz-range-thumb]:h-[18px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-neutral-800
                                       ${activeThumb === 'max' ? 'z-30' : 'z-20'}`}
                            aria-label="Giá tối đa"
                        />
                    </div>

                    {/* Ticks and Labels */}
                    <div className="relative w-full h-7 mt-1 text-[11px] text-gray-400 font-light select-none">
                        {/* Left Label */}
                        <div className="absolute left-0 flex flex-col items-start">
                            <span className="h-1 w-[1px] bg-gray-300 mb-1" />
                            <span>0đ</span>
                        </div>
                        {/* Right Label */}
                        <div className="absolute right-0 flex flex-col items-end">
                            <span className="h-1 w-[1px] bg-gray-300 mb-1" />
                            <span>3,000,000đ</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reset */}
            {activeFiltersCount > 0 && (
                <button
                    onClick={resetFilters}
                    className="w-full py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    Xóa tất cả bộ lọc ({activeFiltersCount})
                </button>
            )}
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar Filter */}
            <div className="hidden lg:block">
                <div className="sticky top-24">
                    <div className="flex items-center gap-2 mb-6">
                        <SlidersHorizontal size={16} />
                        <h3 className="text-sm font-semibold tracking-wide uppercase">Bộ lọc</h3>
                        {activeFiltersCount > 0 && (
                            <span className="px-2 py-0.5 bg-black text-white text-[10px] rounded-full">
                                {activeFiltersCount}
                            </span>
                        )}
                    </div>
                    {renderFilterContent()}
                </div>
            </div>

            {/* Mobile Filter Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 h-full w-80 bg-white z-50 p-6 overflow-y-auto lg:hidden"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <SlidersHorizontal size={16} />
                                    <h3 className="text-sm font-semibold tracking-wide uppercase">Bộ lọc</h3>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full" aria-label="Đóng bộ lọc">
                                    <X size={18} />
                                </button>
                            </div>
                            {renderFilterContent()}
                            <button
                                onClick={onClose}
                                className="w-full mt-6 py-3 bg-black text-white rounded-xl text-sm font-medium"
                            >
                                Áp dụng bộ lọc
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
