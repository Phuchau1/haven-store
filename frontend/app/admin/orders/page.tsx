/* eslint-disable */
'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Search,
    Eye,
    Package,
    Truck,
    CheckCircle2,
    XCircle,
    Clock,
    ChevronDown,
    MapPin,
    Phone,
    Mail,
    Calendar,
    X,
} from 'lucide-react';
import { OrderData } from '@/types';
import { formatPrice } from '@/lib/format';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { SkeletonTable, SkeletonList } from '../components/SkeletonLoaders';
import { EmptyState } from '../components/EmptyState';
import { AdminPagination } from '../components/AdminPagination';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const isValidImageSrc = (src?: string | null): src is string => {
    if (!src || src.trim() === '') return false;
    if (src.startsWith('/')) return true;
    try {
        const url = new URL(src);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

const ITEMS_PER_PAGE = 10;

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------
const STATUS_OPTIONS = [
    { id: 'pending',    label: 'Chờ bộ phận xử lý',    icon: Clock,         color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-100'  },
    { id: 'processing', label: 'Xác nhận & Đóng gói',   icon: Package,       color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100'   },
    { id: 'shipped',    label: 'Đang vận chuyển',        icon: Truck,         color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-100' },
    { id: 'delivered',  label: 'Giao hàng thành công',   icon: CheckCircle2,  color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100'},
    { id: 'cancelled',  label: 'Hủy đơn hàng này',       icon: XCircle,       color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-100'   },
];

// Status tabs config (includes "all")
const FILTER_TABS = [
    { id: 'all', label: 'Tất cả' },
    ...STATUS_OPTIONS.map(s => ({ id: s.id, label: s.label.replace(' bộ phận', '').replace(' thành công', '').replace(' hàng này', '') })),
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function AdminOrders() {
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Close dropdown on outside click
    const handleOutsideClick = useCallback((e: MouseEvent) => {
        if (openDropdownId) {
            const ref = dropdownRefs.current[openDropdownId];
            if (ref && !ref.contains(e.target as Node)) {
                setOpenDropdownId(null);
            }
        }
    }, [openDropdownId]);

    useEffect(() => {
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [handleOutsideClick]);

    // Fetch orders
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/orders');
            if (!res.ok) throw new Error(`Lỗi server (${res.status})`);
            const data = await res.json();
            if (data.success) setOrders(data.orders);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    // Update status
    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        setIsSubmitting(true);
        setOpenDropdownId(null);
        try {
            const res = await fetch('/api/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: orderId, status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' } : o));
                if (selectedOrder?.id === orderId) {
                    setSelectedOrder(prev => prev ? { ...prev, status: newStatus as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' } : prev);
                }
            }
        } catch {
            alert('Lỗi cập nhật trạng thái');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusInfo = (status: string) =>
        STATUS_OPTIONS.find(s => s.id === status) || STATUS_OPTIONS[0];

    const getStatusTrackerWidth = (status: string) => {
        const widths = ['w-1/4', 'w-1/2', 'w-3/4', 'w-full'];
        const index = STATUS_OPTIONS.findIndex(s => s.id === status);
        return widths[Math.max(0, Math.min(index, widths.length - 1))];
    };

    const getColorSwatchClass = (colorName: string) => {
        const map: Record<string, string> = {
            'Đen': 'bg-black', 'Trắng': 'bg-white', 'Xanh': 'bg-blue-500',
            'Xanh dương': 'bg-blue-500', 'Xanh navy': 'bg-slate-900',
            'Đỏ': 'bg-red-600', 'Hồng': 'bg-pink-400', 'Vàng': 'bg-yellow-400',
            'Nâu': 'bg-amber-700', 'Be': 'bg-amber-100', 'Ghi': 'bg-slate-400',
            'Xám': 'bg-slate-400', 'Kem': 'bg-amber-100', 'Tím': 'bg-violet-500',
        };
        return map[colorName] ?? 'bg-slate-200';
    };

    // Derived: filter + search
    const filteredOrders = orders.filter(o => {
        const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            (o.id?.toLowerCase().includes(q)) ||
            o.customerName.toLowerCase().includes(q) ||
            o.email.toLowerCase().includes(q);
        return matchesStatus && matchesSearch;
    });

    // Reset page when filter/search changes
    useEffect(() => { setCurrentPage(1); }, [filterStatus, searchQuery]);

    // Pagination
    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
    );

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
        <div className="space-y-5">

            {/* ── Page Header ─────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--adm-text)' }}>
                        Quản lý đơn hàng
                    </h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--adm-text-muted)' }}>
                        Theo dõi, kiểm tra và cập nhật tiến độ vận chuyển.
                    </p>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-72">
                    <Search
                        className="absolute left-3.5 top-1/2 -translate-y-1/2"
                        size={16}
                        style={{ color: 'var(--adm-text-subtle)' }}
                    />
                    <input
                        type="text"
                        placeholder="Mã đơn, tên, email..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="adm-input w-full pl-10"
                    />
                </div>
            </div>

            {/* ── Status Filter Tabs (horizontal scroll on mobile) ─────────── */}
            <div
                className="overflow-x-auto pb-1"
                style={{ scrollbarWidth: 'none' }}
            >
                <div className="flex gap-2 min-w-max">
                    {FILTER_TABS.map(tab => {
                        const isActive = filterStatus === tab.id;
                        const statusInfo = tab.id !== 'all' ? STATUS_OPTIONS.find(s => s.id === tab.id) : null;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setFilterStatus(tab.id)}
                                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all min-h-[36px] ${
                                    isActive
                                        ? 'bg-[var(--adm-primary)] text-white border-[var(--adm-primary)] shadow-md'
                                        : 'bg-[var(--adm-surface)] text-[var(--adm-text-muted)] border-[var(--adm-border)] hover:border-[var(--adm-primary)] hover:text-[var(--adm-primary)]'
                                }`}
                            >
                                {statusInfo && <statusInfo.icon size={13} />}
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Table Card Wrapper ────────────────────────────────────────── */}
            <div className="adm-card overflow-hidden">

                {/* ── DESKTOP TABLE (md+) ── */}
                <div className="hidden md:block">
                    <div className="adm-table-scroll overflow-x-auto">
                        <table className="adm-table w-full text-left border-collapse">
                            <thead>
                                <tr style={{ backgroundColor: 'var(--adm-surface-2)', borderBottom: '1px solid var(--adm-border)' }}>
                                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--adm-text-subtle)' }}>
                                        Thông tin đơn hàng
                                    </th>
                                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--adm-text-subtle)' }}>
                                        Hình thức &amp; Ngày
                                    </th>
                                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--adm-text-subtle)' }}>
                                        Tổng tiền
                                    </th>
                                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--adm-text-subtle)' }}>
                                        Cập nhật trạng thái
                                    </th>
                                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-center" style={{ color: 'var(--adm-text-subtle)' }}>
                                        Chi tiết
                                    </th>
                                </tr>
                            </thead>
                            <tbody style={{ borderTop: '1px solid var(--adm-border)' }}>
                                {loading ? (
                                    <SkeletonTable rows={ITEMS_PER_PAGE} cols={5} />
                                ) : paginatedOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={5}>
                                            <EmptyState
                                                icon={Package}
                                                title="Không tìm thấy đơn hàng nào"
                                                description={searchQuery ? `Không có kết quả khớp với "${searchQuery}"` : 'Chưa có đơn hàng nào trong trạng thái này.'}
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedOrders.map(order => {
                                        const statusInfo = getStatusInfo(order.status);
                                        return (
                                            <tr
                                                key={order.id}
                                                className="transition-colors duration-200"
                                                style={{ borderBottom: '1px solid var(--adm-border)' }}
                                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--adm-surface-2)')}
                                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                                            >
                                                {/* Order ID / Customer */}
                                                <td className="px-5 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[10px] font-extrabold flex-shrink-0"
                                                            style={{ backgroundColor: 'var(--adm-primary)' }}
                                                        >
                                                            LF
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-extrabold tracking-tight" style={{ color: 'var(--adm-text)' }}>
                                                                #{order.id}
                                                            </p>
                                                            <p className="text-[11px] mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                                                                {order.customerName}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Date / Payment */}
                                                <td className="px-5 py-5">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--adm-text)' }}>
                                                            <Calendar size={12} style={{ color: 'var(--adm-text-subtle)' }} />
                                                            {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                                        </div>
                                                        <span className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: 'var(--adm-text-subtle)' }}>
                                                            {order.paymentMethod === 'pay-cod' || order.paymentMethod === 'cod' ? 'Thanh toán COD' : order.paymentMethod === 'momo' ? 'Ví MoMo' : order.paymentMethod === 'vnpay' ? 'Ví VNPAY' : 'Chuyển khoản'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Total */}
                                                <td className="px-5 py-5">
                                                    <p className="text-sm font-extrabold" style={{ color: 'var(--adm-primary)' }}>
                                                        {formatPrice(order.finalAmount || order.totalAmount)}
                                                    </p>
                                                </td>

                                                {/* Status Dropdown */}
                                                <td className="px-5 py-5">
                                                    <div
                                                        className="relative"
                                                        ref={el => { dropdownRefs.current[order.id!] = el; }}
                                                    >
                                                        <button
                                                            onClick={() => setOpenDropdownId(openDropdownId === order.id ? null : order.id!)}
                                                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[11px] font-extrabold border shadow-sm transition-all hover:shadow-md min-h-[38px] ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}
                                                        >
                                                            <statusInfo.icon size={13} className="animate-pulse" />
                                                            <span className="hidden lg:inline">{statusInfo.label}</span>
                                                            <span className="lg:hidden">{statusInfo.label.replace(' bộ phận', '').replace(' thành công', '')}</span>
                                                            <ChevronDown
                                                                size={13}
                                                                className={`ml-1 opacity-50 transition-transform duration-200 ${openDropdownId === order.id ? 'rotate-180' : ''}`}
                                                            />
                                                        </button>

                                                        <AnimatePresence>
                                                            {openDropdownId === order.id && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                                                    transition={{ duration: 0.15, ease: 'easeOut' }}
                                                                    className="absolute left-0 top-full mt-2 z-[200] w-64 rounded-2xl shadow-2xl border p-2.5"
                                                                    style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                                                                >
                                                                    <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--adm-text-subtle)' }}>
                                                                        Chọn trạng thái mới:
                                                                    </p>
                                                                    <div className="space-y-0.5">
                                                                        {STATUS_OPTIONS.map((opt, optIdx) => {
                                                                            const currentIdx = STATUS_OPTIONS.findIndex(s => s.id === order.status);
                                                                            
                                                                            // Logic: Chỉ được tiến, không được lùi
                                                                            const isBackward = optIdx < currentIdx; 
                                                                            const isTerminal = order.status === 'cancelled' || order.status === 'delivered';
                                                                            const isSame = order.status === opt.id;
                                                                            
                                                                            const isDisabled = isSubmitting || (isBackward && !isSame) || (isTerminal && !isSame);

                                                                            return (
                                                                            <button
                                                                                key={opt.id}
                                                                                onClick={() => handleUpdateStatus(order.id!, opt.id)}
                                                                                disabled={isDisabled}
                                                                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition-all min-h-[40px] ${
                                                                                    isDisabled && !isSame ? 'opacity-40 cursor-not-allowed grayscale' : ''
                                                                                } ${
                                                                                    isSame
                                                                                        ? 'bg-slate-900 text-white shadow-lg dark:bg-slate-100 dark:text-slate-900'
                                                                                        : !isDisabled ? 'hover:bg-[var(--adm-surface-2)] text-[var(--adm-text)]' : 'text-[var(--adm-text-subtle)]'
                                                                                }`}
                                                                            >
                                                                                <div className={`p-1.5 rounded-lg ${isSame ? 'bg-white/20' : opt.bg}`}>
                                                                                    <opt.icon size={13} className={isSame ? 'text-white dark:text-slate-900' : opt.color} />
                                                                                </div>
                                                                                {opt.label}
                                                                                {isSame && (
                                                                                    <div className="ml-auto w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                                                                )}
                                                                            </button>
                                                                        )})}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </td>

                                                {/* View Button */}
                                                <td className="px-5 py-5 text-center">
                                                    <button
                                                        onClick={() => setSelectedOrder(order)}
                                                        aria-label="Xem chi tiết đơn hàng"
                                                        className="w-10 h-10 flex items-center justify-center border rounded-xl mx-auto transition-all hover:shadow-md active:scale-90"
                                                        style={{
                                                            backgroundColor: 'var(--adm-surface)',
                                                            borderColor: 'var(--adm-border)',
                                                            color: 'var(--adm-text-muted)',
                                                        }}
                                                        onMouseEnter={e => {
                                                            (e.currentTarget as HTMLButtonElement).style.color = 'var(--adm-primary)';
                                                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--adm-primary)';
                                                        }}
                                                        onMouseLeave={e => {
                                                            (e.currentTarget as HTMLButtonElement).style.color = 'var(--adm-text-muted)';
                                                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--adm-border)';
                                                        }}
                                                    >
                                                        <Eye size={17} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── MOBILE CARD LIST (< md) ── */}
                <div className="md:hidden">
                    {loading ? (
                        <div className="p-4">
                            <SkeletonList rows={5} />
                        </div>
                    ) : paginatedOrders.length === 0 ? (
                        <EmptyState
                            icon={Package}
                            title="Không tìm thấy đơn hàng nào"
                            description={searchQuery ? `Không có kết quả khớp với "${searchQuery}"` : 'Chưa có đơn hàng nào trong trạng thái này.'}
                        />
                    ) : (
                        <div className="divide-y" style={{ borderColor: 'var(--adm-border)' }}>
                            {paginatedOrders.map(order => {
                                const statusInfo = getStatusInfo(order.status);
                                return (
                                    <motion.div
                                        key={order.id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 flex flex-col gap-3"
                                        style={{ backgroundColor: 'var(--adm-surface)' }}
                                    >
                                        {/* Row 1: ID + Status badge */}
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[9px] font-extrabold flex-shrink-0"
                                                    style={{ backgroundColor: 'var(--adm-primary)' }}
                                                >
                                                    LF
                                                </div>
                                                <div>
                                                    <p className="text-sm font-extrabold leading-tight" style={{ color: 'var(--adm-text)' }}>
                                                        #{order.id}
                                                    </p>
                                                    <p className="text-[11px]" style={{ color: 'var(--adm-text-muted)' }}>
                                                        {order.customerName}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Status badge */}
                                            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                                                <statusInfo.icon size={11} />
                                                {statusInfo.label.replace(' bộ phận', '').replace(' thành công', '')}
                                            </span>
                                        </div>

                                        {/* Row 2: Date, Payment, Total */}
                                        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--adm-text-muted)' }}>
                                            <div className="flex items-center gap-1">
                                                <Calendar size={11} />
                                                <span>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                            <span className="text-[10px] uppercase font-bold tracking-tight" style={{ color: 'var(--adm-text-subtle)' }}>
                                                {order.paymentMethod === 'pay-cod' || order.paymentMethod === 'cod' ? 'Thanh toán COD' : order.paymentMethod === 'momo' ? 'Ví MoMo' : order.paymentMethod === 'vnpay' ? 'Ví VNPAY' : 'Chuyển khoản'}
                                            </span>
                                            <span className="ml-auto text-sm font-extrabold" style={{ color: 'var(--adm-primary)' }}>
                                                {formatPrice(order.finalAmount || order.totalAmount)}
                                            </span>
                                        </div>

                                        {/* Row 3: View button */}
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="adm-btn-secondary w-full flex items-center justify-center gap-2 text-xs min-h-[40px]"
                                        >
                                            <Eye size={14} />
                                            Xem chi tiết
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {!loading && filteredOrders.length > ITEMS_PER_PAGE && (
                    <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--adm-border)' }}>
                        <AdminPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredOrders.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            {/* ── ORDER DETAIL MODAL ──────────────────────────────────────── */}
            <AnimatePresence>
                {selectedOrder && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedOrder(null)}
                            className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm"
                        />

                        {/* Modal panel — full-screen mobile, constrained on lg+ */}
                        <motion.div
                            key="modal"
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.98 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="fixed inset-0 z-[111] flex flex-col lg:items-center lg:justify-center lg:p-6 pointer-events-none"
                        >
                            <div
                                className="pointer-events-auto flex flex-col w-full h-full lg:h-auto lg:max-w-4xl lg:max-h-[90vh] lg:rounded-[24px] shadow-2xl overflow-hidden"
                                style={{ backgroundColor: 'var(--adm-surface)' }}
                            >

                                {/* Modal Header */}
                                <div
                                    className="px-4 sm:px-6 py-4 flex items-center justify-between shrink-0 border-b"
                                    style={{ borderColor: 'var(--adm-border)', backgroundColor: 'var(--adm-surface)' }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl shadow-lg" style={{ backgroundColor: 'var(--adm-primary)' }}>
                                            <Package size={18} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: 'var(--adm-text)' }}>
                                                Đơn hàng #{selectedOrder.id}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--adm-text-subtle)' }}>
                                                    {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        aria-label="Đóng chi tiết đơn hàng"
                                        className="p-2 rounded-xl transition-all min-h-[40px] min-w-[40px] flex items-center justify-center"
                                        style={{
                                            backgroundColor: 'var(--adm-surface-2)',
                                            color: 'var(--adm-text-muted)',
                                        }}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ backgroundColor: 'var(--adm-bg)' }}>
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                                        {/* Left: Status + Products */}
                                        <div className="lg:col-span-2 space-y-5">

                                            {/* Status Stepper — horizontally scrollable on mobile */}
                                            <div
                                                className="p-4 sm:p-5 rounded-2xl border"
                                                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                                            >
                                                <h4 className="text-[10px] font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--adm-text-subtle)' }}>
                                                    Trạng thái đơn hàng
                                                </h4>
                                                {/* Scroll wrapper on mobile */}
                                                <div className="overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                                                    <div className="flex items-start justify-between relative px-2 min-w-[340px]">
                                                        {/* Connecting line */}
                                                        <div className="absolute top-5 left-0 w-full h-[2px] rounded-full -z-0" style={{ backgroundColor: 'var(--adm-border)' }}>
                                                            <div
                                                                className={`h-full transition-all duration-1000 rounded-full ${getStatusTrackerWidth(selectedOrder.status)}`}
                                                                style={{ backgroundColor: 'var(--adm-primary)' }}
                                                            />
                                                        </div>

                                                        {STATUS_OPTIONS.slice(0, 4).map((opt, idx) => {
                                                            const isCompleted = STATUS_OPTIONS.findIndex(s => s.id === selectedOrder.status) >= idx;
                                                            const isActive = selectedOrder.status === opt.id;
                                                            return (
                                                                <div key={opt.id} className="flex flex-col items-center relative z-10 w-24">
                                                                    <div
                                                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${
                                                                            isActive
                                                                                ? 'scale-110 shadow-lg border-white'
                                                                                : isCompleted
                                                                                ? 'border-white'
                                                                                : 'border-white'
                                                                        }`}
                                                                        style={{
                                                                            backgroundColor: isActive || isCompleted ? 'var(--adm-primary)' : 'var(--adm-surface-2)',
                                                                            color: isActive || isCompleted ? '#fff' : 'var(--adm-text-subtle)',
                                                                        }}
                                                                    >
                                                                        <opt.icon size={16} />
                                                                    </div>
                                                                    <p
                                                                        className={`mt-2 text-[10px] font-bold uppercase text-center leading-tight`}
                                                                        style={{ color: isActive ? 'var(--adm-primary)' : 'var(--adm-text-subtle)' }}
                                                                    >
                                                                        {opt.label.replace(' bộ phận', '').replace(' thành công', '')}
                                                                    </p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Products List */}
                                            <div
                                                className="p-4 sm:p-5 rounded-2xl border"
                                                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                                            >
                                                <h4 className="text-[10px] font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--adm-text-subtle)' }}>
                                                    Sản phẩm ({selectedOrder.items.length})
                                                </h4>
                                                <div className="space-y-3">
                                                    {selectedOrder.items.map((item, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex items-center gap-3 p-3 rounded-xl border"
                                                            style={{ backgroundColor: 'var(--adm-bg)', borderColor: 'var(--adm-border)' }}
                                                        >
                                                            <div
                                                                className="w-14 h-14 rounded-xl overflow-hidden relative flex-shrink-0 border"
                                                                style={{ borderColor: 'var(--adm-border)', backgroundColor: 'var(--adm-surface-2)' }}
                                                            >
                                                                {isValidImageSrc(item.product.images[0]) && (
                                                                    <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold truncate" style={{ color: 'var(--adm-text)' }}>
                                                                    {item.product.name}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                    <span
                                                                        className="px-2 py-0.5 rounded-md text-[10px] font-bold border"
                                                                        style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' }}
                                                                    >
                                                                        {item.selectedSize}
                                                                    </span>
                                                                    <div
                                                                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border"
                                                                        style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                                                                    >
                                                                        <div className={`w-2 h-2 rounded-full border border-slate-200 ${getColorSwatchClass(item.selectedColor.name)}`} />
                                                                        <span className="text-[10px] font-bold" style={{ color: 'var(--adm-text-muted)' }}>
                                                                            {item.selectedColor.name}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-xs font-bold ml-auto" style={{ color: 'var(--adm-primary)' }}>
                                                                        x{item.quantity}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="text-right pl-2 flex-shrink-0">
                                                                <p className="text-sm font-bold" style={{ color: 'var(--adm-text)' }}>
                                                                    {formatPrice(item.product.price * item.quantity)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Customer + Summary */}
                                        <div className="space-y-5">
                                            {/* Customer Info */}
                                            <div
                                                className="p-4 sm:p-5 rounded-2xl border space-y-4"
                                                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                                            >
                                                <h4 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--adm-text-subtle)' }}>
                                                    Khách hàng
                                                </h4>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div
                                                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold border flex-shrink-0"
                                                            style={{ backgroundColor: 'var(--adm-surface-2)', color: 'var(--adm-text-muted)', borderColor: 'var(--adm-border)' }}
                                                        >
                                                            {selectedOrder.customerName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold" style={{ color: 'var(--adm-text)' }}>
                                                                {selectedOrder.customerName}
                                                            </p>
                                                            <p className="text-[10px]" style={{ color: 'var(--adm-text-subtle)' }}>
                                                                ID: {selectedOrder.id?.split('-')[1] || '---'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2.5 pt-3 border-t" style={{ borderColor: 'var(--adm-border)' }}>
                                                        {[
                                                            { Icon: Phone, text: selectedOrder.phone },
                                                            { Icon: Mail, text: selectedOrder.email },
                                                            { Icon: MapPin, text: selectedOrder.address },
                                                        ].map(({ Icon, text }) => (
                                                            <div key={text} className="flex items-start gap-2.5 text-xs" style={{ color: 'var(--adm-text)' }}>
                                                                <div
                                                                    className="w-6 h-6 flex items-center justify-center rounded-lg flex-shrink-0"
                                                                    style={{ backgroundColor: 'var(--adm-surface-2)', color: 'var(--adm-text-subtle)' }}
                                                                >
                                                                    <Icon size={12} />
                                                                </div>
                                                                <span className="font-medium leading-relaxed break-all">{text}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Payment Summary */}
                                            <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl shadow-xl text-white dark:bg-slate-800">
                                                <h4 className="text-[10px] font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--adm-text-subtle)' }}>
                                                    Thanh toán
                                                </h4>
                                                <div className="space-y-2.5">
                                                    <div className="flex justify-between text-xs font-medium" style={{ color: 'var(--adm-text-muted)' }}>
                                                        <span>Tạm tính</span>
                                                        <span>{formatPrice(selectedOrder.totalAmount)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs font-medium" style={{ color: 'var(--adm-text-muted)' }}>
                                                        <span>Vận chuyển</span>
                                                        <span className="text-emerald-400 font-bold">Miễn phí</span>
                                                    </div>
                                                    <div className="h-px my-2" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-xs font-bold uppercase" style={{ color: 'var(--adm-text-subtle)' }}>
                                                            Tổng cộng
                                                        </span>
                                                        <p className="text-xl font-black text-white">{formatPrice(selectedOrder.totalAmount)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                {/* Modal Footer — quick status updater, scrollable on mobile */}
                                <div
                                    className="shrink-0 border-t px-4 py-3"
                                    style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                                >
                                    <div className="overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                                        <div className="flex items-center gap-2 min-w-max">
                                            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline shrink-0" style={{ color: 'var(--adm-text-subtle)' }}>
                                                Cập nhật nhanh:
                                            </span>
                                            <div className="flex gap-2">
                                                {STATUS_OPTIONS.map(opt => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => handleUpdateStatus(selectedOrder.id!, opt.id)}
                                                        disabled={isSubmitting}
                                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all border whitespace-nowrap active:scale-95 min-h-[38px] disabled:opacity-50 ${
                                                            selectedOrder.status === opt.id
                                                                ? `${opt.bg} ${opt.color} ${opt.border} ring-2 ring-offset-1 ring-indigo-200`
                                                                : 'bg-[var(--adm-surface-2)] text-[var(--adm-text-muted)] border-[var(--adm-border)] hover:bg-[var(--adm-surface)] hover:border-[var(--adm-primary)] hover:text-[var(--adm-primary)]'
                                                        }`}
                                                    >
                                                        <opt.icon size={13} />
                                                        {opt.label.replace(' bộ phận', '').replace(' hàng thành công', '')}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
