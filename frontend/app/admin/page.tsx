'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp, ShoppingBag, Users, DollarSign,
    ArrowUpRight, ArrowDownRight, Calendar, Package,
    AlertCircle, RefreshCw, Plus, FileText, ChevronRight,
    BarChart2, Activity, Zap, CheckCircle2, Clock, Truck, RotateCcw, XCircle, Box
} from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/format';
import { SkeletonCard } from './components/SkeletonLoaders';
import { useToast } from './components/AdminToast';
import AnalyticsCharts from './components/AnalyticsCharts';

interface DashboardStats {
    totalRevenue: number;
    revenueToday: number;
    revenueWeek: number;
    revenueMonth: number;
    revenueYear: number;
    estimatedCost: number;
    grossProfit: number;
    orderCount: number;
    orderStatusCounts: {
        pending: number;
        confirmed: number;
        packing: number;
        shipping: number;
        delivered: number;
        returned: number;
        cancelled: number;
    };
    productCount: number;
    customerCount: number;
    recentOrders: Array<{ id: string; customerName: string; createdAt: string; totalAmount: number; status: string }>;
    pendingOrders?: Array<{ id: string; customerName: string; createdAt: string; totalAmount: number; status: string }>;
    topProducts: Array<{ id: string; name: string; images: string[]; price: number; sales: number }>;
    lowProducts: Array<{ id: string; name: string; images: string[]; price: number; sales: number }>;
    stockStatus: {
        inStock: number;
        lowStock: number;
        outOfStock: number;
    };
    sparklines: {
        revenue: number[];
        orders: number[];
        products: number[];
        customers: number[];
    };
    trends: {
        revenue: string;
        orders: string;
        products: string;
        customers: string;
    };
}

// Sparkline mini chart (SVG)
function Sparkline({ data, color }: { data: number[]; color: string }) {
    if (!data || !data.length) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const W = 80, H = 28;
    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * W;
        const y = H - ((v - min) / range) * H;
        return `${x},${y}`;
    }).join(' ');
    const area = `M0,${H} L${points.replace(/(\d+\.?\d*),(\d+\.?\d*)/g, '$1,$2 ')} L${W},${H} Z`;

    return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
            <defs>
                <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={`M${area}`} fill={`url(#grad-${color.replace('#', '')})`} />
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

const CARD_CONFIGS = [
    {
        key: 'totalRevenue',
        label: 'Tổng Doanh Thu',
        icon: DollarSign,
        color: '#2563EB',
        format: (v: number) => formatPrice(v),
        link: '/admin/orders',
    },
    {
        key: 'orderCount',
        label: 'Tổng Đơn Hàng',
        icon: ShoppingBag,
        color: '#10B981',
        format: (v: number) => (v || 0).toLocaleString('vi-VN'),
        link: '/admin/orders',
    },
    {
        key: 'productCount',
        label: 'Sản Phẩm Trong Hệ Thống',
        icon: Package,
        color: '#8B5CF6',
        format: (v: number) => (v || 0).toLocaleString('vi-VN'),
        link: '/admin/products',
    },
    {
        key: 'customerCount',
        label: 'Khách Hàng',
        icon: Users,
        color: '#F59E0B',
        format: (v: number) => (v || 0).toLocaleString('vi-VN'),
        link: '/admin/users',
    },
];

const STATUS_MAP: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    pending:     { label: 'Chờ xác nhận',     icon: Clock,         color: '#F59E0B', bg: '#FEF3C7' },
    confirmed:   { label: 'Đã xác nhận',      icon: CheckCircle2,  color: '#3B82F6', bg: '#DBEAFE' },
    processing:  { label: 'Đang xử lý',       icon: Package,       color: '#8B5CF6', bg: '#EDE9FE' },
    packing:     { label: 'Đang đóng gói',    icon: Box,           color: '#8B5CF6', bg: '#EDE9FE' },
    shipping:    { label: 'Đang giao',        icon: Truck,         color: '#06B6D4', bg: '#CFFAFE' },
    shipped:     { label: 'Đang vận chuyển',  icon: Truck,         color: '#4F46E5', bg: '#EEF2FF' },
    in_transit:  { label: 'Đang vận chuyển',  icon: Truck,         color: '#0284C7', bg: '#E0F2FE' },
    delivering:  { label: 'Đang giao',        icon: Truck,         color: '#06B6D4', bg: '#CFFAFE' },
    delivered:   { label: 'Giao thành công',  icon: CheckCircle2,  color: '#10B981', bg: '#D1FAE5' },
    completed:   { label: 'Giao thành công',  icon: CheckCircle2,  color: '#10B981', bg: '#D1FAE5' },
    returned:    { label: 'Hoàn hàng',        icon: RotateCcw,     color: '#EC4899', bg: '#FCE7F3' },
    refunded:    { label: 'Đã hoàn tiền',     icon: RotateCcw,     color: '#EC4899', bg: '#FCE7F3' },
    cancelled:   { label: 'Đã hủy',           icon: XCircle,       color: '#EF4444', bg: '#FEE2E2' },
};

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'year'>('month');
    const { showToast } = useToast();

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`/api/admin/stats?timeframe=${timeframe}`);
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `Lỗi server (${res.status})`);
            }
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
            } else {
                throw new Error(data.message || 'Không thể tải dữ liệu');
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu';
            setError(msg);
            showToast('error', 'Lỗi tải dữ liệu', msg);
        } finally {
            setLoading(false);
        }
    }, [timeframe, showToast]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);


    return (
        <div className="space-y-6">
            {/* ─ Page Header & Time Filter ─ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        HAVEN Dashboard
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        Hệ thống thống kê & báo cáo dữ liệu thời gian thực
                    </p>
                </div>

                {/* Filter Timeframe */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="bg-gray-100 p-1 rounded-xl flex items-center text-xs font-semibold">
                        <button
                            onClick={() => setTimeframe('today')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${timeframe === 'today' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            Hôm nay
                        </button>
                        <button
                            onClick={() => setTimeframe('week')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${timeframe === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            Tuần này
                        </button>
                        <button
                            onClick={() => setTimeframe('month')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${timeframe === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            Tháng này
                        </button>
                        <button
                            onClick={() => setTimeframe('year')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${timeframe === 'year' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            Năm nay
                        </button>
                    </div>

                    <button
                        onClick={fetchStats}
                        disabled={loading}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* ─ Main KPI Cards ─ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {loading ? (
                    <SkeletonCard count={4} />
                ) : error ? (
                    <div className="col-span-full bg-red-50 text-red-600 p-4 rounded-2xl border border-red-200 text-sm flex items-center justify-between">
                        <span>{error}</span>
                        <button onClick={fetchStats} className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-semibold">Thử lại</button>
                    </div>
                ) : stats ? (
                    CARD_CONFIGS.map((cfg) => {
                        const rawValue = (stats[cfg.key as keyof DashboardStats] as number);
                        const trendMap: Record<string, string> = {
                            totalRevenue: stats.trends?.revenue || '+0%',
                            orderCount: stats.trends?.orders || '+0%',
                            productCount: stats.trends?.products || '+0%',
                            customerCount: stats.trends?.customers || '+0%'
                        };
                        const trend = trendMap[cfg.key];
                        const isPos = trend.startsWith('+');

                        return (
                            <div key={cfg.key} className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: cfg.color }}>
                                        <cfg.icon size={20} />
                                    </div>
                                    <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-md ${isPos ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        {isPos ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                        {trend}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{cfg.label}</p>
                                    <p className="text-2xl font-extrabold text-gray-900">{cfg.format(rawValue)}</p>
                                </div>
                            </div>
                        );
                    })
                ) : null}
            </div>

            {/* ─ Financial Overview: Lợi nhuận vs Chi phí ─ */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-5 rounded-2xl shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wider text-emerald-100">Ước tính Lợi Nhuận Gộp</p>
                        <p className="text-2xl font-extrabold mt-2">{formatPrice(stats.grossProfit || 0)}</p>
                        <p className="text-[11px] text-emerald-200 mt-2">Dựa trên biên lợi nhuận ước tính 40% giá bán</p>
                    </div>

                    <div className="bg-gradient-to-br from-slate-700 to-slate-800 text-white p-5 rounded-2xl shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-300">Ước tính Chi Phí Nhập Hàng</p>
                        <p className="text-2xl font-extrabold mt-2">{formatPrice(stats.estimatedCost || 0)}</p>
                        <p className="text-[11px] text-slate-400 mt-2">Tổng chi phí giá vốn ước tính 60%</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng Thái Tồn Kho WMS</p>
                            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                                <div className="bg-emerald-50 p-2 rounded-xl">
                                    <p className="text-lg font-bold text-emerald-600">{stats.stockStatus?.inStock || 0}</p>
                                    <p className="text-[10px] font-medium text-emerald-700">Đủ hàng</p>
                                </div>
                                <div className="bg-amber-50 p-2 rounded-xl">
                                    <p className="text-lg font-bold text-amber-600">{stats.stockStatus?.lowStock || 0}</p>
                                    <p className="text-[10px] font-medium text-amber-700">Sắp hết</p>
                                </div>
                                <div className="bg-rose-50 p-2 rounded-xl">
                                    <p className="text-lg font-bold text-rose-600">{stats.stockStatus?.outOfStock || 0}</p>
                                    <p className="text-[10px] font-medium text-rose-700">Hết hàng</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─ Order Status Breakdown (Thống Kê 7 Nấc Đơn Hàng) ─ */}
            {stats?.orderStatusCounts && (
                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <ShoppingBag size={16} className="text-blue-600" />
                        Thống Kê Quy Trình Đơn Hàng
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                        {Object.entries(stats.orderStatusCounts).map(([key, count]) => {
                            const config = STATUS_MAP[key] || { label: key, icon: Clock, color: '#6B7280', bg: '#F3F4F6' };
                            const IconComponent = config.icon;
                            return (
                                <Link
                                    key={key}
                                    href={`/admin/orders?status=${key}`}
                                    className="p-3 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center transition-all hover:scale-105 hover:shadow-md"
                                    style={{ backgroundColor: config.bg }}
                                >
                                    <IconComponent size={18} style={{ color: config.color }} />
                                    <p className="text-lg font-extrabold mt-1 text-gray-900">{count}</p>
                                    <p className="text-[11px] font-semibold text-gray-700 mt-0.5">{config.label}</p>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ─ Analytics Charts ─ */}
            <AnalyticsCharts stats={stats} />

            {/* ─ Top Products vs Recent Orders ─ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">🔥 Top Sản Phẩm Bán Chạy</h3>
                        <Link href="/admin/products" className="text-xs font-semibold text-blue-600 hover:underline">Xem tất cả</Link>
                    </div>
                    <div className="space-y-3">
                        {stats?.topProducts && stats.topProducts.length > 0 ? (
                            stats.topProducts.map((p, idx) => (
                                <div key={p.id || idx} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center justify-center">{idx + 1}</span>
                                        <div>
                                            <p className="text-xs font-bold text-gray-900 line-clamp-1">{p.name}</p>
                                            <p className="text-[11px] text-gray-500">{formatPrice(p.price)}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                        {p.sales} đã bán
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-gray-500 py-4 text-center">Chưa có dữ liệu sản phẩm bán chạy</p>
                        )}
                    </div>
                </div>

                {/* Pending Orders (Đơn hàng chờ xử lý) */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">📦 Đơn Hàng Chờ Xử Lý</h3>
                            {stats?.orderStatusCounts?.pending ? (
                                <span className="bg-amber-100 text-amber-800 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                                    {stats.orderStatusCounts.pending}
                                </span>
                            ) : null}
                        </div>
                        <Link href="/admin/orders?status=pending" className="text-xs font-semibold text-blue-600 hover:underline">Xem tất cả</Link>
                    </div>
                    <div className="space-y-3">
                        {(() => {
                            const rawList = stats?.pendingOrders || stats?.recentOrders || [];
                            // Chỉ lấy các đơn chưa xử lý & đang xử lý, TUYỆT ĐỐI KHÔNG LẤY 'delivered', 'completed', 'cancelled', 'returned', 'refunded'
                            const displayList = rawList.filter(o => 
                                !['delivered', 'completed', 'cancelled', 'returned', 'refunded'].includes(o.status)
                            );

                            if (displayList.length === 0) {
                                return <p className="text-xs text-gray-500 py-6 text-center">Hiện tại không có đơn hàng nào chờ xử lý 🎉</p>;
                            }

                            return displayList.map((o) => {
                                const st = STATUS_MAP[o.status] || { label: o.status, color: '#6B7280', bg: '#F3F4F6' };
                                return (
                                    <div key={o.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                                        <div>
                                            <p className="text-xs font-bold text-gray-900">Mã đơn #{o.id?.substring(0, 8)}</p>
                                            <p className="text-[11px] text-gray-500">{o.customerName || 'Khách vãng lai'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-gray-900">{formatPrice(o.totalAmount)}</p>
                                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-0.5" style={{ backgroundColor: st.bg, color: st.color }}>
                                                {st.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
}
