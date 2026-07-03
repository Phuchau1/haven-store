'use client';

import React, { useEffect, useState } from 'react';
import { Heart, Users, Star, TrendingUp, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { formatPrice } from '@/lib/format';

interface AdminWishlistStats {
    totalFavorites: number;
    totalUsers: number;
    topProducts: Array<{
        id: string;
        name: string;
        image: string;
        price: number;
        inStock: boolean;
        soldQuantity: number;
        favorites_count: number;
    }>;
}

export default function AdminWishlistPage() {
    const [stats, setStats] = useState<AdminWishlistStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/wishlist/admin-stats');
                const data = await res.json();
                if (data.success) {
                    setStats(data.stats);
                }
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu thống kê wishlist:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
            </div>
        );
    }

    if (!stats) {
        return <div className="p-8 text-center text-gray-500">Không có dữ liệu thống kê.</div>;
    }

    const StatCard = ({ title, value, icon: Icon, color, delay }: any) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between"
        >
            <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-3xl font-bold">{value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${color}-50 text-${color}-500`}>
                <Icon size={24} />
            </div>
        </motion.div>
    );

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Phân tích Sản phẩm Yêu thích</h1>
                    <p className="text-gray-500">Thống kê các sản phẩm được khách hàng quan tâm nhất (Wishlist).</p>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard 
                    title="Tổng số lượt yêu thích" 
                    value={stats.totalFavorites} 
                    icon={Heart} 
                    color="red" 
                    delay={0.1} 
                />
                <StatCard 
                    title="Số người dùng có Wishlist" 
                    value={stats.totalUsers} 
                    icon={Users} 
                    color="blue" 
                    delay={0.2} 
                />
                <StatCard 
                    title="Sản phẩm Yêu thích nhất" 
                    value={stats.topProducts.length > 0 ? stats.topProducts[0].favorites_count : 0} 
                    icon={Star} 
                    color="yellow" 
                    delay={0.3} 
                />
            </div>

            {/* Top Products Table */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <TrendingUp size={20} className="text-green-500" />
                        Top 10 Sản phẩm được yêu thích nhất
                    </h2>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-sm">
                            <tr>
                                <th className="px-6 py-4 font-medium">Sản phẩm</th>
                                <th className="px-6 py-4 font-medium text-center">Lượt Yêu thích</th>
                                <th className="px-6 py-4 font-medium text-center">Đã bán</th>
                                <th className="px-6 py-4 font-medium text-right">Giá</th>
                                <th className="px-6 py-4 font-medium text-center">Tồn kho</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {stats.topProducts.map((product, index) => (
                                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <span className="text-lg font-bold text-gray-300 w-6">#{index + 1}</span>
                                            {product.image ? (
                                                <div className="w-12 h-16 relative rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                                    <Image 
                                                        src={product.image} 
                                                        alt={product.name} 
                                                        fill 
                                                        className="object-cover" 
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                                    <Package size={20} />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-semibold text-sm max-w-[250px] truncate">{product.name}</p>
                                                <p className="text-xs text-gray-500">{product.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full font-bold text-sm">
                                                <Heart size={14} fill="currentColor" />
                                                {product.favorites_count}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-medium text-gray-700">
                                        {product.soldQuantity}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                                        {formatPrice(product.price)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            {product.inStock ? (
                                                <span className="px-2.5 py-1 text-xs font-medium bg-green-50 text-green-600 rounded-md">
                                                    Còn hàng
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 text-xs font-medium bg-red-50 text-red-600 rounded-md">
                                                    Hết hàng
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {stats.topProducts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        Chưa có sản phẩm nào được yêu thích
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}
