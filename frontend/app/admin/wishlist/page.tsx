'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
    Heart, Users, Star, TrendingUp, Package, Filter, Search, 
    BarChart2, RefreshCw, ChevronRight, X, Calendar, ShoppingBag, 
    CheckCircle2, AlertCircle, ArrowUpDown, Eye, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { formatPrice } from '@/lib/format';
import { useAuth } from '@/app/component/AuthContext';
import { toast } from 'react-hot-toast';

interface AdminWishlistStats {
    totalFavorites: number;
    totalUsers: number;
    totalConverted: number;
    conversionRate: number;
    topProducts: Array<{
        id: string;
        name: string;
        image: string;
        price: number;
        inStock: boolean;
        soldQuantity: number;
        favorites_count: number;
    }>;
    topCustomers: Array<{
        userId: string;
        name: string;
        email: string;
        avatar: string;
        favoritesCount: number;
    }>;
    topCategories: Array<{
        id: string;
        name: string;
        count: number;
    }>;
    dailyStats: Array<{
        date: string;
        fullDate: string;
        count: number;
    }>;
}

interface ProductWishlist {
    id: string;
    name: string;
    image: string | null;
    price: number;
    originalPrice: number;
    categoryId: string;
    inStock: boolean;
    stockQuantity: number;
    soldQuantity: number;
    favoritesCount: number;
}

interface CustomerWishlist {
    userId: string;
    name: string;
    email: string;
    phone: string;
    avatar: string;
    favoritesCount: number;
    lastAddedAt: string;
}

interface Category {
    id: string;
    name: string;
}

export default function AdminWishlistPage() {
    const { token, user } = useAuth();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'customers'>('dashboard');

    // Dashboard State
    const [stats, setStats] = useState<AdminWishlistStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);

    // Products Tab State
    const [products, setProducts] = useState<ProductWishlist[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [rangeFilter, setRangeFilter] = useState('all');
    const [sortBy, setSortBy] = useState('favorites_desc');

    // Customers Tab State
    const [customers, setCustomers] = useState<CustomerWishlist[]>([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [searchCustomer, setSearchCustomer] = useState('');

    // Modal State: Product Detail (Users who favorited this product)
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [productUsers, setProductUsers] = useState<any[]>([]);
    const [loadingProductUsers, setLoadingProductUsers] = useState(false);

    // Modal State: Customer Detail (Products favorited by this user)
    const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
    const [customerProducts, setCustomerProducts] = useState<any[]>([]);
    const [loadingCustomerProducts, setLoadingCustomerProducts] = useState(false);

    // 1. Fetch Categories for filter
    useEffect(() => {
        fetch('/api/categories')
            .then(res => res.json())
            .then(data => {
                if (data.success) setCategories(data.categories || []);
            })
            .catch(() => {});
    }, []);

    // 2. Fetch Overview Dashboard Stats
    const fetchStats = useCallback(async () => {
        setLoadingStats(true);
        try {
            const res = await fetch('/api/wishlist/admin-stats', {
                headers: { 'Authorization': `Bearer ${token || user?.id}` }
            });
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching wishlist stats:', error);
            toast.error('Không thể tải thống kê Yêu thích');
        } finally {
            setLoadingStats(false);
        }
    }, [token]);

    // 3. Fetch Products Tab
    const fetchProducts = useCallback(async () => {
        setLoadingProducts(true);
        try {
            const params = new URLSearchParams({
                category_id: categoryFilter,
                range: rangeFilter,
                sort_by: sortBy
            });
            const res = await fetch(`/api/wishlist/admin-products?${params}`, {
                headers: { 'Authorization': `Bearer ${token || user?.id}` }
            });
            const data = await res.json();
            if (data.success) {
                setProducts(data.products || []);
            }
        } catch (error) {
            console.error('Error fetching wishlist products:', error);
            toast.error('Không thể tải danh sách sản phẩm');
        } finally {
            setLoadingProducts(false);
        }
    }, [token, categoryFilter, rangeFilter, sortBy]);

    // 4. Fetch Customers Tab
    const fetchCustomers = useCallback(async (searchQuery = '') => {
        setLoadingCustomers(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.set('search', searchQuery);

            const res = await fetch(`/api/wishlist/admin-customers?${params}`, {
                headers: { 'Authorization': `Bearer ${token || user?.id}` }
            });
            const data = await res.json();
            if (data.success) {
                setCustomers(data.customers || []);
            }
        } catch (error) {
            console.error('Error fetching wishlist customers:', error);
            toast.error('Không thể tải danh sách khách hàng');
        } finally {
            setLoadingCustomers(false);
        }
    }, [token]);

    // Trigger Tab Fetches
    useEffect(() => {
        if (activeTab === 'dashboard') fetchStats();
        if (activeTab === 'products') fetchProducts();
        if (activeTab === 'customers') fetchCustomers(searchCustomer);
    }, [activeTab, fetchStats, fetchProducts, fetchCustomers]);

    // Open Product Detail Modal (List of users favorited this product)
    const openProductDetail = async (product: any) => {
        setSelectedProduct(product);
        setLoadingProductUsers(true);
        try {
            const res = await fetch(`/api/wishlist/admin-products/${product.id}/users`, {
                headers: { 'Authorization': `Bearer ${token || user?.id}` }
            });
            const data = await res.json();
            if (data.success) {
                setProductUsers(data.users || []);
            }
        } catch (error) {
            toast.error('Lỗi khi tải chi tiết khách hàng');
        } finally {
            setLoadingProductUsers(false);
        }
    };

    // Open Customer Detail Modal (List of products favorited by this user)
    const openCustomerDetail = async (customer: any) => {
        setSelectedCustomer(customer);
        setLoadingCustomerProducts(true);
        try {
            const res = await fetch(`/api/wishlist/admin-customers/${customer.userId}`, {
                headers: { 'Authorization': `Bearer ${token || user?.id}` }
            });
            const data = await res.json();
            if (data.success) {
                setCustomerProducts(data.products || []);
            }
        } catch (error) {
            toast.error('Lỗi khi tải danh sách sản phẩm yêu thích của khách');
        } finally {
            setLoadingCustomerProducts(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div 
                className="p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
            >
                <div>
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200 uppercase tracking-wider flex items-center gap-1">
                            <Heart size={12} fill="currentColor" /> Analytics & Retargeting
                        </span>
                        <span className="text-xs" style={{ color: 'var(--adm-text-subtle)' }}>• Phân tích nhu cầu khách hàng</span>
                    </div>
                    <h1 className="text-xl font-black tracking-tight mt-1 flex items-center gap-2" style={{ color: 'var(--adm-text)' }}>
                        Quản Lý Sản Phẩm Yêu Thích (Wishlist)
                    </h1>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                        Phân tích sản phẩm hot, tỷ lệ chuyển đổi đơn hàng và hành vi yêu thích của từng khách hàng
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            if (activeTab === 'dashboard') fetchStats();
                            if (activeTab === 'products') fetchProducts();
                            if (activeTab === 'customers') fetchCustomers(searchCustomer);
                        }}
                        className="px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all"
                        style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                    >
                        <RefreshCw size={13} className={loadingStats || loadingProducts || loadingCustomers ? 'animate-spin' : ''} />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: 'var(--adm-border)' }}>
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                        activeTab === 'dashboard'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : 'border'
                    }`}
                    style={activeTab !== 'dashboard' ? { backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' } : {}}
                >
                    <BarChart2 size={14} /> 📊 Dashboard Thống Kê
                </button>

                <button
                    onClick={() => setActiveTab('products')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                        activeTab === 'products'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : 'border'
                    }`}
                    style={activeTab !== 'products' ? { backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' } : {}}
                >
                    <Package size={14} /> 🛍️ Theo Sản Phẩm ({products.length || '—'})
                </button>

                <button
                    onClick={() => setActiveTab('customers')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                        activeTab === 'customers'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : 'border'
                    }`}
                    style={activeTab !== 'customers' ? { backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' } : {}}
                >
                    <Users size={14} /> 👤 Theo Khách Hàng ({customers.length || '—'})
                </button>
            </div>

            {/* ============================================================ */}
            {/* TAB 1: DASHBOARD OVERVIEW */}
            {/* ============================================================ */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    {loadingStats ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-rose-600" />
                        </div>
                    ) : stats ? (
                        <>
                            {/* Stat Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-5 rounded-2xl border bg-rose-50/50 border-rose-200/70 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Tổng lượt Yêu thích</p>
                                        <h3 className="text-2xl font-black text-rose-950 mt-1">{stats.totalFavorites}</h3>
                                        <p className="text-[11px] text-rose-600/80 mt-1">Lượt thả tim trên toàn bộ sản phẩm</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
                                        <Heart size={24} fill="currentColor" />
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl border bg-blue-50/50 border-blue-200/70 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Khách hàng quan tâm</p>
                                        <h3 className="text-2xl font-black text-blue-950 mt-1">{stats.totalUsers}</h3>
                                        <p className="text-[11px] text-blue-600/80 mt-1">Tài khoản có sản phẩm yêu thích</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                                        <Users size={24} />
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl border bg-emerald-50/50 border-emerald-200/70 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Đã chuyển đổi mua hàng</p>
                                        <h3 className="text-2xl font-black text-emerald-950 mt-1">{stats.totalConverted} đơn</h3>
                                        <p className="text-[11px] text-emerald-600/80 mt-1">Sản phẩm yêu thích đã được chốt mua</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                                        <ShoppingBag size={24} />
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl border bg-purple-50/50 border-purple-200/70 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Tỷ lệ chuyển đổi (CR)</p>
                                        <h3 className="text-2xl font-black text-purple-950 mt-1">{stats.conversionRate}%</h3>
                                        <p className="text-[11px] text-purple-600/80 mt-1">Yêu thích → Đặt hàng thành công</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-purple-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                                        <TrendingUp size={24} />
                                    </div>
                                </div>
                            </div>

                            {/* Charts & Top lists */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left (2 cols): Daily Stats Chart + Top 10 Categories */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Daily chart */}
                                    <div 
                                        className="p-5 rounded-2xl border shadow-sm space-y-4"
                                        style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--adm-text)' }}>
                                                <Calendar size={16} className="text-rose-500" />
                                                Lượt Yêu Thích 7 Ngày Gần Nhất
                                            </h3>
                                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                                                7 ngày qua
                                            </span>
                                        </div>

                                        <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2">
                                            {stats.dailyStats.map((item, idx) => {
                                                const maxCount = Math.max(...stats.dailyStats.map(d => d.count), 1);
                                                const heightPct = Math.max(10, Math.round((item.count / maxCount) * 100));
                                                return (
                                                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                                                        <span className="text-[10px] font-bold text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {item.count}
                                                        </span>
                                                        <div 
                                                            className="w-full max-w-[36px] bg-gradient-to-t from-rose-500 to-rose-400 rounded-t-lg transition-all duration-500 group-hover:from-rose-600 group-hover:to-rose-500 shadow-sm"
                                                            style={{ height: `${heightPct}%` }}
                                                        />
                                                        <span className="text-[11px] font-medium" style={{ color: 'var(--adm-text-muted)' }}>
                                                            {item.date}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Top Categories */}
                                    <div 
                                        className="p-5 rounded-2xl border shadow-sm space-y-4"
                                        style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                                    >
                                        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--adm-text)' }}>
                                            <Filter size={16} className="text-blue-500" />
                                            Top Danh Mục Được Yêu Thích Nhất
                                        </h3>
                                        <div className="space-y-3">
                                            {stats.topCategories.map((cat, idx) => {
                                                const maxCount = stats.topCategories[0]?.count || 1;
                                                const pct = Math.round((cat.count / maxCount) * 100);
                                                return (
                                                    <div key={cat.id} className="space-y-1">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>
                                                                #{idx + 1} {cat.name}
                                                            </span>
                                                            <span className="font-bold text-rose-600">{cat.count} ❤️</span>
                                                        </div>
                                                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--adm-surface-2)' }}>
                                                            <div 
                                                                className="h-full bg-gradient-to-r from-blue-500 to-rose-500 rounded-full transition-all duration-500"
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Right (1 col): Top Active Customers */}
                                <div 
                                    className="p-5 rounded-2xl border shadow-sm space-y-4"
                                    style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                                >
                                    <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--adm-border)' }}>
                                        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--adm-text)' }}>
                                            <Users size={16} className="text-emerald-500" />
                                            Khách Thả Tim Nhiều Nhất
                                        </h3>
                                        <button 
                                            onClick={() => setActiveTab('customers')}
                                            className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
                                        >
                                            Xem tất cả <ChevronRight size={12} />
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {stats.topCustomers.map((cust, i) => (
                                            <div 
                                                key={cust.userId} 
                                                onClick={() => openCustomerDetail(cust)}
                                                className="p-3 rounded-xl border flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                                                style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 font-bold flex items-center justify-center text-xs flex-shrink-0">
                                                        #{i + 1}
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-xs font-bold truncate max-w-[140px]" style={{ color: 'var(--adm-text)' }}>
                                                            {cust.name}
                                                        </p>
                                                        <p className="text-[11px] text-gray-500 truncate max-w-[140px]">
                                                            {cust.email || cust.userId}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-600 border border-rose-200">
                                                    {cust.favoritesCount} ❤️
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Top 10 Products Table */}
                            <div 
                                className="rounded-2xl border overflow-hidden shadow-sm space-y-4 p-5"
                                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--adm-text)' }}>
                                        <Star size={16} className="text-amber-500" />
                                        Top 10 Sản Phẩm Được Yêu Thích Nhất
                                    </h3>
                                    <button 
                                        onClick={() => setActiveTab('products')}
                                        className="text-xs text-blue-600 hover:underline flex items-center gap-0.5 font-medium"
                                    >
                                        Xem tất cả sản phẩm <ChevronRight size={12} />
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead 
                                            className="text-[11px] font-bold uppercase border-b"
                                            style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' }}
                                        >
                                            <tr>
                                                <th className="px-4 py-3">Hạng</th>
                                                <th className="px-4 py-3">Sản phẩm</th>
                                                <th className="px-4 py-3 text-center">Lượt Yêu Thích</th>
                                                <th className="px-4 py-3 text-center">Đã Bán</th>
                                                <th className="px-4 py-3 text-right">Giá Hiện Tại</th>
                                                <th className="px-4 py-3 text-center">Trạng Thái</th>
                                                <th className="px-4 py-3 text-center">Thao Tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y" style={{ borderColor: 'var(--adm-border)' }}>
                                            {stats.topProducts.map((product, index) => (
                                                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-3 font-bold text-gray-400">
                                                        #{index + 1}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            {product.image ? (
                                                                <div className="w-10 h-12 relative rounded-lg overflow-hidden flex-shrink-0 border bg-slate-100">
                                                                    <Image src={product.image} alt={product.name} fill className="object-cover" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-10 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                                                    <Package size={18} />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="font-bold text-xs max-w-[220px] truncate" style={{ color: 'var(--adm-text)' }}>
                                                                    {product.name}
                                                                </p>
                                                                <p className="text-[10px] text-gray-400">{product.id}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-600 border border-rose-200">
                                                            <Heart size={12} fill="currentColor" /> {product.favorites_count}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-semibold text-slate-700">
                                                        {product.soldQuantity}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                                                        {formatPrice(product.price)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {product.inStock ? (
                                                            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-600 rounded-full border border-emerald-200">
                                                                Còn hàng
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-600 rounded-full border border-rose-200">
                                                                Hết hàng
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => openProductDetail(product)}
                                                            className="p-1.5 rounded-lg border text-blue-600 hover:bg-blue-50 transition-colors"
                                                            style={{ borderColor: 'var(--adm-border)' }}
                                                            title="Xem danh sách khách thả tim"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>
            )}

            {/* ============================================================ */}
            {/* TAB 2: PRODUCTS VIEW */}
            {/* ============================================================ */}
            {activeTab === 'products' && (
                <div className="space-y-4">
                    {/* Filters bar */}
                    <div 
                        className="p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3"
                        style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                    >
                        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                            {/* Category Filter */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-gray-500">Danh mục:</span>
                                <select
                                    value={categoryFilter}
                                    onChange={e => setCategoryFilter(e.target.value)}
                                    className="px-3 py-1.5 rounded-xl border text-xs font-medium focus:outline-none cursor-pointer"
                                    style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                                >
                                    <option value="all">Tất cả danh mục</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Range Filter */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-gray-500">Thời gian:</span>
                                <select
                                    value={rangeFilter}
                                    onChange={e => setRangeFilter(e.target.value)}
                                    className="px-3 py-1.5 rounded-xl border text-xs font-medium focus:outline-none cursor-pointer"
                                    style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                                >
                                    <option value="all">Tất cả thời gian</option>
                                    <option value="7d">7 ngày qua</option>
                                    <option value="30d">30 ngày qua</option>
                                    <option value="90d">90 ngày qua</option>
                                </select>
                            </div>

                            {/* Sort Filter */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-gray-500">Sắp xếp:</span>
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value)}
                                    className="px-3 py-1.5 rounded-xl border text-xs font-medium focus:outline-none cursor-pointer"
                                    style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                                >
                                    <option value="favorites_desc">Yêu thích: Nhiều → Ít</option>
                                    <option value="favorites_asc">Yêu thích: Ít → Nhiều</option>
                                    <option value="price_desc">Giá: Cao → Thấp</option>
                                    <option value="price_asc">Giá: Thấp → Cao</option>
                                    <option value="sold_desc">Đã bán: Nhiều nhất</option>
                                </select>
                            </div>
                        </div>

                        <span className="text-xs font-bold text-gray-500 self-end sm:self-center">
                            {products.length} sản phẩm
                        </span>
                    </div>

                    {/* Products Table */}
                    <div 
                        className="rounded-2xl border overflow-hidden shadow-sm"
                        style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead 
                                    className="text-[11px] font-bold uppercase border-b"
                                    style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' }}
                                >
                                    <tr>
                                        <th className="px-4 py-3">Sản phẩm</th>
                                        <th className="px-4 py-3 text-center">Lượt Yêu Thích</th>
                                        <th className="px-4 py-3 text-center">Đã Bán</th>
                                        <th className="px-4 py-3 text-right">Giá Bán</th>
                                        <th className="px-4 py-3 text-center">Tồn Kho</th>
                                        <th className="px-4 py-3 text-center">Danh Sách Khách Thả Tim</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: 'var(--adm-border)' }}>
                                    {loadingProducts ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i}>
                                                <td colSpan={6} className="px-4 py-4">
                                                    <div className="h-4 bg-slate-100 rounded animate-pulse" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : products.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                                                Không có sản phẩm nào phù hợp với bộ lọc
                                            </td>
                                        </tr>
                                    ) : (
                                        products.map(product => (
                                            <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        {product.image ? (
                                                            <div className="w-10 h-12 relative rounded-lg overflow-hidden flex-shrink-0 border bg-slate-100">
                                                                <Image src={product.image} alt={product.name} fill className="object-cover" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-10 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                                                <Package size={18} />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-bold text-xs max-w-[260px] truncate" style={{ color: 'var(--adm-text)' }}>
                                                                {product.name}
                                                            </p>
                                                            <p className="text-[10px] text-gray-400">{product.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-600 border border-rose-200">
                                                        <Heart size={12} fill="currentColor" /> {product.favoritesCount}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center font-semibold text-slate-700">
                                                    {product.soldQuantity}
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-slate-900">
                                                    {formatPrice(product.price)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {product.inStock ? (
                                                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-600 rounded-full border border-emerald-200">
                                                            Còn hàng ({product.stockQuantity})
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-600 rounded-full border border-rose-200">
                                                            Hết hàng
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => openProductDetail(product)}
                                                        className="px-3 py-1.5 rounded-xl border text-xs font-bold text-blue-600 bg-blue-50/50 hover:bg-blue-100/70 border-blue-200 transition-colors flex items-center gap-1 mx-auto"
                                                    >
                                                        <Users size={13} /> Xem danh sách khách ({product.favoritesCount})
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* TAB 3: CUSTOMERS VIEW */}
            {/* ============================================================ */}
            {activeTab === 'customers' && (
                <div className="space-y-4">
                    {/* Search bar */}
                    <div 
                        className="p-4 rounded-2xl border shadow-sm flex items-center justify-between gap-4"
                        style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                    >
                        <div className="relative flex-1 max-w-md">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo Tên, Email hoặc Số điện thoại..."
                                value={searchCustomer}
                                onChange={e => {
                                    setSearchCustomer(e.target.value);
                                    fetchCustomers(e.target.value);
                                }}
                                className="w-full pl-9 pr-4 py-2 rounded-xl border text-xs focus:outline-none"
                                style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                            />
                        </div>
                        <span className="text-xs font-bold text-gray-500">
                            {customers.length} khách hàng
                        </span>
                    </div>

                    {/* Customers Table */}
                    <div 
                        className="rounded-2xl border overflow-hidden shadow-sm"
                        style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead 
                                    className="text-[11px] font-bold uppercase border-b"
                                    style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' }}
                                >
                                    <tr>
                                        <th className="px-4 py-3">Khách Hàng</th>
                                        <th className="px-4 py-3">Email / SĐT</th>
                                        <th className="px-4 py-3 text-center">Số Sản Phẩm Yêu Thích</th>
                                        <th className="px-4 py-3 text-center">Hoạt Động Gần Nhất</th>
                                        <th className="px-4 py-3 text-center">Thao Tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: 'var(--adm-border)' }}>
                                    {loadingCustomers ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i}>
                                                <td colSpan={5} className="px-4 py-4">
                                                    <div className="h-4 bg-slate-100 rounded animate-pulse" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : customers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                                                Chưa có khách hàng nào thả tim sản phẩm
                                            </td>
                                        </tr>
                                    ) : (
                                        customers.map(cust => (
                                            <tr key={cust.userId} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 font-bold flex items-center justify-center text-xs flex-shrink-0">
                                                            {cust.name ? cust.name.charAt(0).toUpperCase() : 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-xs" style={{ color: 'var(--adm-text)' }}>
                                                                {cust.name}
                                                            </p>
                                                            <p className="text-[10px] text-gray-400">{cust.userId}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-slate-700">{cust.email || '—'}</p>
                                                    <p className="text-[10px] text-gray-400">{cust.phone || '—'}</p>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-600 border border-rose-200">
                                                        <Heart size={12} fill="currentColor" /> {cust.favoritesCount} sản phẩm
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center text-gray-500 text-[11px]">
                                                    {cust.lastAddedAt ? new Date(cust.lastAddedAt).toLocaleDateString('vi-VN') : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => openCustomerDetail(cust)}
                                                        className="px-3 py-1.5 rounded-xl border text-xs font-bold text-rose-600 bg-rose-50/50 hover:bg-rose-100/70 border-rose-200 transition-colors flex items-center gap-1 mx-auto"
                                                    >
                                                        <Eye size={13} /> Xem danh sách yêu thích
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* MODAL 1: PRODUCT USER LIST */}
            {/* ============================================================ */}
            <AnimatePresence>
                {selectedProduct && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl shadow-2xl border w-full max-w-2xl overflow-hidden space-y-4"
                            style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                        >
                            {/* Modal Header */}
                            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--adm-border)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                                        <Heart size={20} fill="currentColor" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm" style={{ color: 'var(--adm-text)' }}>
                                            Khách Hàng Đã Thả Tim Sản Phẩm
                                        </h3>
                                        <p className="text-xs text-rose-600 font-semibold">{selectedProduct.name}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedProduct(null)}
                                    className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
                                {loadingProductUsers ? (
                                    <div className="flex items-center justify-center py-10">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-600" />
                                    </div>
                                ) : productUsers.length === 0 ? (
                                    <p className="text-center py-8 text-xs text-gray-400">Chưa có thông tin khách hàng</p>
                                ) : (
                                    productUsers.map((u, i) => (
                                        <div 
                                            key={i} 
                                            className="p-3.5 rounded-2xl border flex items-center justify-between"
                                            style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 font-bold flex items-center justify-center text-xs">
                                                    {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-xs" style={{ color: 'var(--adm-text)' }}>{u.name}</p>
                                                    <p className="text-[11px] text-gray-500">{u.email} • {u.phone}</p>
                                                </div>
                                            </div>
                                            <span className="text-[11px] font-medium text-gray-400">
                                                {new Date(u.favoritedAt).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t flex justify-end" style={{ borderColor: 'var(--adm-border)' }}>
                                <button
                                    onClick={() => setSelectedProduct(null)}
                                    className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                                >
                                    Đóng
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ============================================================ */}
            {/* MODAL 2: CUSTOMER FAVORITE PRODUCTS LIST */}
            {/* ============================================================ */}
            <AnimatePresence>
                {selectedCustomer && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl shadow-2xl border w-full max-w-2xl overflow-hidden space-y-4"
                            style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                        >
                            {/* Modal Header */}
                            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--adm-border)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm" style={{ color: 'var(--adm-text)' }}>
                                            Danh Sách Yêu Thích Của Khách Hàng
                                        </h3>
                                        <p className="text-xs text-blue-600 font-semibold">{selectedCustomer.name} ({selectedCustomer.email})</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedCustomer(null)}
                                    className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
                                {loadingCustomerProducts ? (
                                    <div className="flex items-center justify-center py-10">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
                                    </div>
                                ) : customerProducts.length === 0 ? (
                                    <p className="text-center py-8 text-xs text-gray-400">Khách hàng chưa thêm sản phẩm nào vào yêu thích</p>
                                ) : (
                                    customerProducts.map((p, i) => (
                                        <div 
                                            key={i} 
                                            className="p-3.5 rounded-2xl border flex items-center justify-between gap-3"
                                            style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}
                                        >
                                            <div className="flex items-center gap-3">
                                                {p.image ? (
                                                    <div className="w-12 h-14 relative rounded-xl overflow-hidden flex-shrink-0 border bg-slate-100">
                                                        <Image src={p.image} alt={p.name} fill className="object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                                        <Package size={20} />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-bold text-xs max-w-[260px] truncate" style={{ color: 'var(--adm-text)' }}>{p.name}</p>
                                                    <p className="text-xs font-bold text-rose-600 mt-0.5">{formatPrice(p.price)}</p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">Ngày thả tim: {new Date(p.favoritedAt).toLocaleDateString('vi-VN')}</p>
                                                </div>
                                            </div>

                                            <div>
                                                {p.inStock ? (
                                                    <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-600 rounded-full border border-emerald-200">
                                                        Còn hàng
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 text-[10px] font-bold bg-rose-50 text-rose-600 rounded-full border border-rose-200">
                                                        Hết hàng
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t flex justify-end" style={{ borderColor: 'var(--adm-border)' }}>
                                <button
                                    onClick={() => setSelectedCustomer(null)}
                                    className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                                >
                                    Đóng
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
