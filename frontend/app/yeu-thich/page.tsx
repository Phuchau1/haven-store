'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Heart, ArrowLeft, ShoppingBag, Trash2, Search, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFavoritesStore } from '@/app/store/useFavoritesStore';
import ProductCard from '@/app/component/ProductCard';
import { useAuth } from '@/app/component/AuthContext';
import toast from 'react-hot-toast';

export default function FavoritesPage() {
    const { favorites, clearFavorites } = useFavoritesStore();
    const { user } = useAuth();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState('newest');
    const [inStockOnly, setInStockOnly] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showConfirmClear, setShowConfirmClear] = useState(false);

    // Extract unique categories
    const categories = useMemo(() => {
        const cats = new Set(favorites.map(p => p.category));
        return Array.from(cats);
    }, [favorites]);

    // Lọc và sắp xếp
    const filteredAndSortedFavorites = useMemo(() => {
        let result = [...favorites];

        // Tìm kiếm
        if (searchQuery) {
            result = result.filter(p => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Lọc danh mục
        if (selectedCategory) {
            result = result.filter(p => p.category === selectedCategory);
        }

        // Lọc còn hàng
        if (inStockOnly) {
            result = result.filter(p => p.inStock);
        }

        // Sắp xếp
        switch (sortOption) {
            case 'price-asc':
                result.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                result.sort((a, b) => b.price - a.price);
                break;
            case 'name-asc':
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                result.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'best-selling':
                result.sort((a, b) => (b.soldQuantity || 0) - (a.soldQuantity || 0));
                break;
            case 'newest':
            default:
                // Vì danh sách lấy từ DB đã sort theo created_at giảm dần, hoặc push vào mảng local
                // Ta có thể giả định mảng gốc là newest first
                break;
        }

        return result;
    }, [favorites, searchQuery, selectedCategory, inStockOnly, sortOption]);

    const handleClearAll = async () => {
        await clearFavorites(user?.id);
        setShowConfirmClear(false);
        toast.success('Đã xóa toàn bộ danh sách yêu thích');
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-28 pb-20">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-black transition-colors mb-4">
                        <ArrowLeft size={16} className="mr-2" />
                        Tiếp tục mua sắm
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold uppercase flex items-center gap-3">
                                <Heart className="text-[#D32F2F]" size={36} fill="currentColor" />
                                Yêu thích
                            </h1>
                            <p className="text-gray-500 mt-2">
                                Bạn đang có <span className="font-bold text-black">{favorites.length}</span> sản phẩm trong danh sách
                            </p>
                        </div>
                        {favorites.length > 0 && (
                            <button 
                                onClick={() => setShowConfirmClear(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 bg-white"
                            >
                                <Trash2 size={18} />
                                Xóa tất cả
                            </button>
                        )}
                    </div>
                </div>

                {!user ? (
                    /* Login Required State */
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white rounded-3xl shadow-sm border border-gray-100 max-w-2xl mx-auto"
                    >
                        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-5 shadow-xs">
                            <Heart size={40} fill="currentColor" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Đăng Nhập Để Lưu Sản Phẩm Yêu Thích</h2>
                        <p className="text-slate-500 mb-6 max-w-md text-sm leading-relaxed">
                            Vui lòng đăng nhập tài khoản HAVEN để đồng bộ và quản lý danh sách sản phẩm yêu thích trên mọi thiết bị.
                        </p>
                        <div className="flex items-center gap-3">
                            <Link 
                                href="/login?redirect=/yeu-thich"
                                className="inline-flex items-center gap-2 px-8 py-3.5 bg-black text-white rounded-full font-bold hover:bg-[#C9A227] transition-all shadow-md hover:-translate-y-0.5 text-sm cursor-pointer"
                            >
                                Đăng nhập ngay
                            </Link>
                            <Link 
                                href="/"
                                className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-100 text-slate-700 rounded-full font-semibold hover:bg-gray-200 transition-all text-sm cursor-pointer"
                            >
                                Khám phá cửa hàng
                            </Link>
                        </div>
                    </motion.div>
                ) : favorites.length === 0 ? (
                    /* Empty State */
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl shadow-sm border border-gray-100"
                    >
                        <div className="w-24 h-24 bg-red-50 text-red-300 rounded-full flex items-center justify-center mb-6">
                            <Heart size={48} />
                        </div>
                        <h2 className="text-2xl font-bold mb-3">Danh sách trống</h2>
                        <p className="text-gray-500 mb-8 max-w-md">
                            Bạn chưa lưu sản phẩm nào vào danh sách yêu thích. Hãy dạo quanh cửa hàng và "thả tim" những món đồ bạn thích nhé!
                        </p>
                        <Link 
                            href="/"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white rounded-full font-bold hover:bg-[#C9A227] transition-all hover:shadow-lg hover:-translate-y-1"
                        >
                            <ShoppingBag size={20} />
                            Khám phá ngay
                        </Link>
                    </motion.div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar Filters */}
                        <div className="w-full lg:w-64 flex-shrink-0 space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                            <div className="flex items-center gap-2 font-bold text-lg border-b pb-4">
                                <SlidersHorizontal size={20} />
                                Lọc & Sắp xếp
                            </div>
                            
                            {/* Search */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-700">Tìm kiếm</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="Tên sản phẩm..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
                                    />
                                    <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                                </div>
                            </div>

                            {/* Sắp xếp */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-700">Sắp xếp theo</label>
                                <select 
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none cursor-pointer bg-white"
                                >
                                    <option value="newest">Mới thêm gần đây</option>
                                    <option value="price-asc">Giá tăng dần</option>
                                    <option value="price-desc">Giá giảm dần</option>
                                    <option value="best-selling">Bán chạy nhất</option>
                                    <option value="name-asc">Tên A-Z</option>
                                    <option value="name-desc">Tên Z-A</option>
                                </select>
                            </div>

                            {/* Danh mục */}
                            {categories.length > 0 && (
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-gray-700">Danh mục</label>
                                    <select 
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none cursor-pointer bg-white"
                                    >
                                        <option value="">Tất cả danh mục</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat === 'cat-clothing' ? 'Quần áo Nam' : cat === 'cat-womens' ? 'Quần áo Nữ' : cat}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Trạng thái */}
                            <div className="space-y-3 pt-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input 
                                            type="checkbox" 
                                            checked={inStockOnly}
                                            onChange={(e) => setInStockOnly(e.target.checked)}
                                            className="w-5 h-5 border-2 rounded text-black focus:ring-black cursor-pointer transition-all"
                                        />
                                    </div>
                                    <span className="text-gray-700 group-hover:text-black font-medium transition-colors">Chỉ hiện còn hàng</span>
                                </label>
                            </div>
                        </div>

                        {/* Product Grid */}
                        <div className="flex-1">
                            {filteredAndSortedFavorites.length === 0 ? (
                                <div className="bg-white p-12 rounded-2xl text-center border border-gray-100">
                                    <p className="text-gray-500 text-lg">Không tìm thấy sản phẩm nào phù hợp với bộ lọc.</p>
                                    <button 
                                        onClick={() => {
                                            setSearchQuery('');
                                            setSelectedCategory('');
                                            setInStockOnly(false);
                                        }}
                                        className="mt-4 text-black font-bold underline"
                                    >
                                        Xóa bộ lọc
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                    {filteredAndSortedFavorites.map((product, index) => (
                                        <ProductCard 
                                            key={product.id} 
                                            product={product} 
                                            index={index} 
                                            showSold={true}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Xác nhận Xóa toàn bộ */}
            <AnimatePresence>
                {showConfirmClear && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                                    <Trash2 size={32} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Xóa toàn bộ yêu thích?</h3>
                                <p className="text-gray-500 mb-6">
                                    Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi danh sách yêu thích không? Hành động này không thể hoàn tác.
                                </p>
                                <div className="flex gap-3 w-full">
                                    <button 
                                        onClick={() => setShowConfirmClear(false)}
                                        className="flex-1 py-3 px-4 rounded-xl border border-gray-200 font-bold hover:bg-gray-50 transition-colors"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button 
                                        onClick={handleClearAll}
                                        className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
                                    >
                                        Xóa tất cả
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
