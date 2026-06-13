'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp, ShoppingBag, Users, DollarSign,
    ArrowUpRight, ArrowDownRight, Calendar, Package,
    AlertCircle, RefreshCw, Plus, FileText, ChevronRight,
    BarChart2, Activity, Zap
} from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/format';
import { SkeletonCard, SkeletonList } from './components/SkeletonLoaders';
import { EmptyState } from './components/EmptyState';
import { useToast } from './components/AdminToast';

interface DashboardStats {
    totalRevenue: number;
    orderCount: number;
    productCount: number;
    customerCount: number;
    recentOrders: any[];
    topProducts: any[];
    stockStatus: {
        inStock: number;
        outOfStock: number;
    };
}

// Sparkline mini chart (SVG)
function Sparkline({ data, color }: { data: number[]; color: string }) {
    if (!data.length) return null;
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

const SPARKLINE_DATA = {
    revenue: [40, 65, 45, 80, 55, 90, 70, 95, 60, 88],
    orders:  [10, 20, 15, 35, 25, 45, 30, 50, 40, 55],
    products:[5, 8, 6, 12, 9, 15, 11, 18, 14, 20],
    customers:[20, 30, 25, 40, 35, 55, 45, 60, 50, 70],
};

const CARD_CONFIGS = [
    {
        key: 'totalRevenue',
        label: 'Doanh thu',
        trend: '+12.5%',
        isUp: true,
        icon: DollarSign,
        color: '#10b981',
        sparkData: SPARKLINE_DATA.revenue,
        format: (v: number) => formatPrice(v),
        link: '/admin/orders',
    },
    {
        key: 'orderCount',
        label: 'Đơn hàng',
        trend: '+8.2%',
        isUp: true,
        icon: ShoppingBag,
        color: '#6366f1',
        sparkData: SPARKLINE_DATA.orders,
        format: (v: number) => v.toLocaleString('vi-VN'),
        link: '/admin/orders',
    },
    {
        key: 'productCount',
        label: 'Sản phẩm',
        trend: '+3.4%',
        isUp: true,
        icon: Package,
        color: '#f43f5e',
        sparkData: SPARKLINE_DATA.products,
        format: (v: number) => v.toLocaleString('vi-VN'),
        link: '/admin/products',
    },
    {
        key: 'customerCount',
        label: 'Khách hàng',
        trend: '-2.4%',
        isUp: false,
        icon: Users,
        color: '#f59e0b',
        sparkData: SPARKLINE_DATA.customers,
        format: (v: number) => v.toLocaleString('vi-VN'),
        link: '/admin/users',
    },
];

const STATUS_STYLE: Record<string, { label: string; class: string }> = {
    pending:    { label: 'Chờ xử lý',    class: 'adm-badge adm-badge-warning' },
    processing: { label: 'Đang xử lý',   class: 'adm-badge adm-badge-info' },
    shipped:    { label: 'Đang giao',    class: 'adm-badge adm-badge-info' },
    delivered:  { label: 'Đã giao',      class: 'adm-badge adm-badge-success' },
    cancelled:  { label: 'Đã hủy',       class: 'adm-badge adm-badge-danger' },
};

const QUICK_ACTIONS = [
    { icon: Plus,      label: 'Thêm sản phẩm',  href: '/admin/products',  color: 'var(--adm-primary)',  bg: 'var(--adm-primary-light)' },
    { icon: ShoppingBag, label: 'Xem đơn hàng', href: '/admin/orders',    color: 'var(--adm-success)',  bg: 'var(--adm-success-light)' },
    { icon: FileText,  label: 'Báo cáo kho',    href: '/admin/inventory', color: 'var(--adm-warning)',  bg: 'var(--adm-warning-light)' },
    { icon: Users,     label: 'Khách hàng',     href: '/admin/users',     color: '#8b5cf6',              bg: 'rgba(139,92,246,0.12)' },
];

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useToast();

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/admin/stats');
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
        } catch (err: any) {
            setError(err.message || 'Lỗi khi tải dữ liệu');
            showToast('error', 'Lỗi tải dữ liệu', err.message);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return (
        <div className="space-y-5 md:space-y-6">
            {/* ─ Page header ─ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--adm-text)' }}>
                        Tổng quan hệ thống
                    </h2>
                    <p className="text-xs md:text-sm mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                        Dữ liệu thực tế cập nhật từ database
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchStats}
                        disabled={loading}
                        className="adm-btn-secondary text-xs px-3 py-2 gap-1.5 min-h-0 h-9"
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Làm mới</span>
                    </button>
                    <button className="adm-btn-secondary text-xs px-3 py-2 gap-1.5 min-h-0 h-9">
                        <Calendar size={13} />
                        <span className="hidden sm:inline">Tháng này</span>
                    </button>
                </div>
            </div>

            {/* ─ Quick Actions ─ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
                {QUICK_ACTIONS.map((action) => (
                    <Link
                        key={action.href}
                        href={action.href}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                        style={{ backgroundColor: action.bg }}
                    >
                        <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: action.color, color: '#fff' }}
                        >
                            <action.icon size={14} />
                        </div>
                        <span className="text-xs font-bold leading-tight" style={{ color: action.color }}>
                            {action.label}
                        </span>
                    </Link>
                ))}
            </div>

            {/* ─ Stats Cards ─ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
                {loading ? (
                    <SkeletonCard count={4} />
                ) : error ? (
                    <div className="sm:col-span-2 xl:col-span-4">
                        <div
                            className="adm-card p-5 flex items-center gap-3"
                            style={{ borderColor: 'var(--adm-danger-light)' }}
                        >
                            <AlertCircle size={20} style={{ color: 'var(--adm-danger)' }} />
                            <div>
                                <p className="text-sm font-bold" style={{ color: 'var(--adm-text)' }}>
                                    Lỗi tải dữ liệu
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                                    {error}
                                </p>
                            </div>
                            <button onClick={fetchStats} className="adm-btn-primary ml-auto text-xs px-3 py-2 min-h-0">
                                Thử lại
                            </button>
                        </div>
                    </div>
                ) : stats ? (
                    CARD_CONFIGS.map((cfg, i) => {
                        const value = stats[cfg.key as keyof DashboardStats] as number;
                        return (
                            <motion.div
                                key={cfg.key}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08, duration: 0.4 }}
                            >
                                <Link href={cfg.link} className="adm-card block p-4 md:p-5 group">
                                    <div className="flex items-start justify-between mb-3">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: `${cfg.color}18`, color: cfg.color }}
                                        >
                                            <cfg.icon size={18} />
                                        </div>
                                        <div
                                            className={`flex items-center gap-0.5 text-xs font-bold ${cfg.isUp ? '' : ''}`}
                                            style={{ color: cfg.isUp ? 'var(--adm-success)' : 'var(--adm-danger)' }}
                                        >
                                            {cfg.trend}
                                            {cfg.isUp
                                                ? <ArrowUpRight size={12} />
                                                : <ArrowDownRight size={12} />
                                            }
                                        </div>
                                    </div>

                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p
                                                className="text-[10px] font-bold uppercase tracking-widest mb-1"
                                                style={{ color: 'var(--adm-text-muted)' }}
                                            >
                                                {cfg.label}
                                            </p>
                                            <p
                                                className="text-xl md:text-2xl font-extrabold leading-none"
                                                style={{ color: 'var(--adm-text)' }}
                                            >
                                                {cfg.format(value)}
                                            </p>
                                        </div>
                                        <div className="opacity-60 group-hover:opacity-100 transition-opacity">
                                            <Sparkline data={cfg.sparkData} color={cfg.color} />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })
                ) : null}
            </div>

            {/* ─ Main Grid ─ */}
            {stats && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
                    {/* Left col: Recent Orders + Top Products */}
                    <div className="lg:col-span-2 space-y-4 md:space-y-5">

                        {/* Recent Orders */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="adm-card overflow-hidden"
                        >
                            <div
                                className="flex items-center justify-between px-5 py-4 border-b"
                                style={{ borderColor: 'var(--adm-border)' }}
                            >
                                <div className="flex items-center gap-2">
                                    <Activity size={16} style={{ color: 'var(--adm-primary)' }} />
                                    <h3 className="text-sm font-bold" style={{ color: 'var(--adm-text)' }}>
                                        Đơn hàng mới nhất
                                    </h3>
                                </div>
                                <Link
                                    href="/admin/orders"
                                    className="flex items-center gap-1 text-xs font-bold transition-colors hover:opacity-80"
                                    style={{ color: 'var(--adm-primary)' }}
                                >
                                    Xem tất cả <ChevronRight size={12} />
                                </Link>
                            </div>

                            {stats.recentOrders.length === 0 ? (
                                <EmptyState
                                    icon={ShoppingBag}
                                    title="Chưa có đơn hàng"
                                    description="Các đơn hàng mới sẽ xuất hiện ở đây"
                                />
                            ) : (
                                <>
                                    {/* Desktop table */}
                                    <div className="hidden md:block adm-table-scroll">
                                        <table className="adm-table">
                                            <thead>
                                                <tr>
                                                    <th>Mã đơn / Khách hàng</th>
                                                    <th>Ngày tạo</th>
                                                    <th>Tổng tiền</th>
                                                    <th>Trạng thái</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.recentOrders.slice(0, 8).map(order => {
                                                    const statusInfo = STATUS_STYLE[order.status] || STATUS_STYLE.pending;
                                                    return (
                                                        <tr key={order.id}>
                                                            <td>
                                                                <p className="text-xs font-bold" style={{ color: 'var(--adm-text)' }}>
                                                                    #{order.id}
                                                                </p>
                                                                <p className="text-[11px] mt-0.5 truncate max-w-[160px]" style={{ color: 'var(--adm-text-muted)' }}>
                                                                    {order.customerName}
                                                                </p>
                                                            </td>
                                                            <td className="text-xs" style={{ color: 'var(--adm-text-muted)' }}>
                                                                {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                                            </td>
                                                            <td>
                                                                <span className="text-sm font-bold" style={{ color: 'var(--adm-primary)' }}>
                                                                    {formatPrice(order.totalAmount)}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className={statusInfo.class}>
                                                                    {statusInfo.label}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile card list */}
                                    <div className="md:hidden divide-y" style={{ borderColor: 'var(--adm-border)' }}>
                                        {stats.recentOrders.slice(0, 6).map(order => {
                                            const statusInfo = STATUS_STYLE[order.status] || STATUS_STYLE.pending;
                                            return (
                                                <div
                                                    key={order.id}
                                                    className="flex items-center justify-between px-4 py-3 gap-3 hover:transition-colors"
                                                    style={{ backgroundColor: 'var(--adm-surface)' }}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold" style={{ color: 'var(--adm-text)' }}>
                                                            #{order.id}
                                                        </p>
                                                        <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                                                            {order.customerName} · {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1.5">
                                                        <span className="text-xs font-bold" style={{ color: 'var(--adm-primary)' }}>
                                                            {formatPrice(order.totalAmount)}
                                                        </span>
                                                        <span className={statusInfo.class} style={{ fontSize: '10px' }}>
                                                            {statusInfo.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </motion.div>

                        {/* Top Products */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="adm-card overflow-hidden"
                        >
                            <div
                                className="flex items-center justify-between px-5 py-4 border-b"
                                style={{ borderColor: 'var(--adm-border)' }}
                            >
                                <div className="flex items-center gap-2">
                                    <Zap size={16} style={{ color: 'var(--adm-warning)' }} />
                                    <h3 className="text-sm font-bold" style={{ color: 'var(--adm-text)' }}>
                                        Sản phẩm bán chạy
                                    </h3>
                                </div>
                                <Link
                                    href="/admin/products"
                                    className="flex items-center gap-1 text-xs font-bold hover:opacity-80 transition-opacity"
                                    style={{ color: 'var(--adm-primary)' }}
                                >
                                    Xem tất cả <ChevronRight size={12} />
                                </Link>
                            </div>
                            <div className="p-4 space-y-2">
                                {stats.topProducts.length === 0 ? (
                                    <EmptyState
                                        icon={Package}
                                        title="Chưa có sản phẩm"
                                        description="Thêm sản phẩm để xem dữ liệu"
                                    />
                                ) : (
                                    stats.topProducts.slice(0, 5).map((product, index) => (
                                        <div
                                            key={product.id}
                                            className="flex items-center gap-3 p-2.5 rounded-xl transition-colors hover:opacity-80"
                                            style={{ backgroundColor: 'var(--adm-surface-2)' }}
                                        >
                                            <div
                                                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                                                style={{
                                                    backgroundColor: index === 0 ? '#fef3c7' : index === 1 ? '#f3f4f6' : index === 2 ? '#fef9ee' : 'var(--adm-surface)',
                                                    color: index === 0 ? '#d97706' : index === 1 ? '#6b7280' : index === 2 ? '#92400e' : 'var(--adm-text-muted)',
                                                }}
                                            >
                                                #{index + 1}
                                            </div>
                                            <div
                                                className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100"
                                                style={{ border: '1px solid var(--adm-border)' }}
                                            >
                                                {product.images?.[0] && (
                                                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold truncate" style={{ color: 'var(--adm-text)' }}>
                                                    {product.name}
                                                </p>
                                                <p className="text-[10px] mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                                                    {formatPrice(product.price)}
                                                </p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-sm font-black" style={{ color: 'var(--adm-primary)' }}>
                                                    {product.sales}
                                                </p>
                                                <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--adm-text-subtle)' }}>
                                                    Đã bán
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right col: Stock status */}
                    <div className="space-y-4">
                        {/* Stock Status */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="adm-card p-5"
                        >
                            <div className="flex items-center gap-2 mb-5">
                                <BarChart2 size={16} style={{ color: 'var(--adm-primary)' }} />
                                <h3 className="text-sm font-bold" style={{ color: 'var(--adm-text)' }}>
                                    Tình trạng kho
                                </h3>
                            </div>

                            <div className="space-y-4">
                                {/* In Stock */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: 'var(--adm-success)' }}
                                            />
                                            <span className="text-xs font-semibold" style={{ color: 'var(--adm-text-muted)' }}>
                                                Còn hàng
                                            </span>
                                        </div>
                                        <span className="text-sm font-bold" style={{ color: 'var(--adm-text)' }}>
                                            {stats.stockStatus.inStock}
                                        </span>
                                    </div>
                                    <div
                                        className="w-full h-2 rounded-full overflow-hidden"
                                        style={{ backgroundColor: 'var(--adm-surface-2)' }}
                                    >
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(stats.stockStatus.inStock / stats.productCount) * 100}%` }}
                                            transition={{ duration: 0.8, delay: 0.5 }}
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: 'var(--adm-success)' }}
                                        />
                                    </div>
                                    <p className="text-[10px] mt-1 text-right" style={{ color: 'var(--adm-text-muted)' }}>
                                        {stats.productCount > 0 ? Math.round((stats.stockStatus.inStock / stats.productCount) * 100) : 0}%
                                    </p>
                                </div>

                                {/* Out of Stock */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: 'var(--adm-danger)' }}
                                            />
                                            <span className="text-xs font-semibold" style={{ color: 'var(--adm-text-muted)' }}>
                                                Hết hàng
                                            </span>
                                        </div>
                                        <span className="text-sm font-bold" style={{ color: 'var(--adm-danger)' }}>
                                            {stats.stockStatus.outOfStock}
                                        </span>
                                    </div>
                                    <div
                                        className="w-full h-2 rounded-full overflow-hidden"
                                        style={{ backgroundColor: 'var(--adm-surface-2)' }}
                                    >
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(stats.stockStatus.outOfStock / stats.productCount) * 100}%` }}
                                            transition={{ duration: 0.8, delay: 0.6 }}
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: 'var(--adm-danger)' }}
                                        />
                                    </div>
                                    <p className="text-[10px] mt-1 text-right" style={{ color: 'var(--adm-text-muted)' }}>
                                        {stats.productCount > 0 ? Math.round((stats.stockStatus.outOfStock / stats.productCount) * 100) : 0}%
                                    </p>
                                </div>

                                {/* Alert */}
                                {stats.stockStatus.outOfStock > 0 && (
                                    <div
                                        className="flex items-center gap-2 p-3 rounded-xl text-xs font-semibold"
                                        style={{
                                            backgroundColor: 'var(--adm-danger-light)',
                                            color: 'var(--adm-danger)',
                                        }}
                                    >
                                        <AlertCircle size={14} className="flex-shrink-0" />
                                        <span>
                                            {stats.stockStatus.outOfStock} sản phẩm cần bổ sung hàng!
                                        </span>
                                    </div>
                                )}

                                <Link
                                    href="/admin/inventory"
                                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                                    style={{ backgroundColor: 'var(--adm-primary-light)', color: 'var(--adm-primary)' }}
                                >
                                    <TrendingUp size={14} />
                                    Quản lý kho hàng
                                </Link>
                            </div>
                        </motion.div>

                        {/* System stats mini */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 }}
                            className="adm-card p-5"
                        >
                            <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--adm-text)' }}>
                                Thống kê nhanh
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Tổng sản phẩm', value: stats.productCount, icon: Package, color: 'var(--adm-danger)' },
                                    { label: 'Khách hàng', value: stats.customerCount, icon: Users, color: '#8b5cf6' },
                                    { label: 'Tổng đơn hàng', value: stats.orderCount, icon: ShoppingBag, color: 'var(--adm-primary)' },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: `${item.color}15`, color: item.color }}
                                        >
                                            <item.icon size={14} />
                                        </div>
                                        <div className="flex-1 flex items-center justify-between">
                                            <span className="text-xs" style={{ color: 'var(--adm-text-muted)' }}>
                                                {item.label}
                                            </span>
                                            <span className="text-sm font-bold" style={{ color: 'var(--adm-text)' }}>
                                                {item.value.toLocaleString('vi-VN')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </div>
    );
}
