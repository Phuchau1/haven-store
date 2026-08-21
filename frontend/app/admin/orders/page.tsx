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
    RotateCcw,
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
    { id: 'pending',          label: 'Chờ bộ phận xử lý',      icon: Clock,         color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-100'  },
    { id: 'processing',       label: 'Xác nhận & Đóng gói',     icon: Package,       color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100'   },
    { id: 'shipped',          label: 'Đang vận chuyển',          icon: Truck,         color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-100' },
    { id: 'delivered',        label: 'Giao hàng thành công',     icon: CheckCircle2,  color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100'},
    { id: 'return_requested', label: 'Yêu cầu hoàn hàng',       icon: RotateCcw,     color: 'text-amber-700',   bg: 'bg-amber-100',  border: 'border-amber-200'  },
    { id: 'returning',        label: 'Đang hoàn hàng về shop',   icon: RotateCcw,     color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-100' },
    { id: 'refunded',         label: 'Đã hoàn tiền',             icon: RotateCcw,     color: 'text-teal-600',    bg: 'bg-teal-50',    border: 'border-teal-100'   },
    { id: 'cancelled',        label: 'Hủy đơn hàng này',         icon: XCircle,       color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-100'   },
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
    const [liveSync, setLiveSync] = useState(false);
    
    // Shipping Modal State
    const [shippingModalOpen, setShippingModalOpen] = useState(false);
    const [orderToApprove, setOrderToApprove] = useState<string | null>(null);
    const [selectedShippingProvider, setSelectedShippingProvider] = useState<string>('GHN');
    const [isSimulating, setIsSimulating] = useState(false);

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

    // Fetch orders (silent = tránh loading spinner khi auto-poll)
    const fetchOrders = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await fetch(`/api/orders?t=${Date.now()}`);
            if (!res.ok) throw new Error(`Lỗi server (${res.status})`);
            const data = await res.json();
            if (data.success) {
                setOrders(prev => {
                    const prevSig = prev.map(o => `${o.id}-${o.status}`).join(',');
                    const newSig  = (data.orders || []).map((o: OrderData) => `${o.id}-${o.status}`).join(',');
                    return prevSig !== newSig ? data.orders : prev;
                });
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
        // Auto-poll mỗi 10 giây — đồng bộ 2 chiều với khách hàng
        const interval = setInterval(async () => {
            setLiveSync(true);
            await fetchOrders(true);
            setTimeout(() => setLiveSync(false), 700);
        }, 10000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    // Update status
    const handleUpdateStatus = async (orderId: string, newStatus: string, shippingProvider?: string) => {
        setIsSubmitting(true);
        setOpenDropdownId(null);
        try {
            const bodyData: any = { id: orderId, status: newStatus };
            if (shippingProvider) {
                bodyData.shippingProvider = shippingProvider;
            }
            const res = await fetch('/api/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData),
            });
            const data = await res.json();
            if (data.success) {
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any, shippingProvider: shippingProvider || o.shippingProvider } : o));
                if (selectedOrder?.id === orderId) {
                    setSelectedOrder(prev => prev ? { ...prev, status: newStatus as any, shippingProvider: shippingProvider || prev.shippingProvider } : prev);
                }
            }
        } catch {
            alert('Lỗi cập nhật trạng thái');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApproveOrder = (orderId: string) => {
        setOrderToApprove(orderId);
        setShippingModalOpen(true);
    };

    const confirmApproveOrder = async () => {
        if (orderToApprove) {
            const carrierCode = selectedShippingProvider || 'GHN';
            setShippingModalOpen(false);
            await handleInitCarrier(orderToApprove, carrierCode);
            setOrderToApprove(null);
        }
    };

    // ─── CARRIER SIMULATION HANDLERS ──────────────────────────────────────────
    const handleInitCarrier = async (orderId: string, carrierCode: string) => {
        setIsSimulating(true);
        try {
            const res = await fetch('/api/carrier/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, carrierCode })
            });
            const data = await res.json();
            if (data.success) {
                await fetchOrders(true);
                if (selectedOrder?.id === orderId) {
                    const timelineRes = await fetch(`/api/carrier/timeline/${orderId}`);
                    const timelineData = await timelineRes.json();
                    if (timelineData.success) {
                        setSelectedOrder((prev: any) => ({ ...prev, ...timelineData.order, shippingTimeline: timelineData.timeline }));
                    }
                }
            } else {
                alert(data.message || 'Lỗi khi khởi tạo giao hàng');
            }
        } catch {
            alert('Lỗi kết nối server');
        } finally {
            setIsSimulating(false);
        }
    };

    const handleAdvanceCarrier = async (orderId: string) => {
        setIsSimulating(true);
        try {
            const res = await fetch('/api/carrier/advance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId })
            });
            const data = await res.json();
            if (data.success) {
                await fetchOrders(true);
                const timelineRes = await fetch(`/api/carrier/timeline/${orderId}`);
                const timelineData = await timelineRes.json();
                if (timelineData.success) {
                    setSelectedOrder((prev: any) => ({ ...prev, ...timelineData.order, shippingTimeline: timelineData.timeline }));
                }
            } else {
                alert(data.message || 'Không thể tiến bước giao hàng');
            }
        } catch {
            alert('Lỗi kết nối server');
        } finally {
            setIsSimulating(false);
        }
    };

    const getStatusInfo = (status: string) => {
        const ALL_STATUSES: Record<string, { id: string; label: string; icon: any; color: string; bg: string; border: string }> = {
            pending:    { id: 'pending',    label: 'Chờ bộ phận xử lý',  icon: Clock,         color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-100'  },
            processing: { id: 'processing', label: 'Xác nhận & Đóng gói', icon: Package,       color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100'   },
            confirmed:  { id: 'confirmed',  label: 'Đã xác nhận',        icon: Package,       color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100'   },
            packing:    { id: 'packing',    label: 'Đang đóng gói',      icon: Package,       color: 'text-purple-600',  bg: 'bg-purple-50',  border: 'border-purple-100' },
            shipped:    { id: 'shipped',    label: 'Đang vận chuyển',    icon: Truck,         color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-100' },
            shipping:   { id: 'shipping',   label: 'Đang vận chuyển',    icon: Truck,         color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-100' },
            waiting_pickup:   { id: 'waiting_pickup',   label: 'Chờ lấy hàng',         icon: Clock,         color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-100' },
            picked_up:        { id: 'picked_up',        label: 'Đã lấy hàng',          icon: Truck,         color: 'text-cyan-600',    bg: 'bg-cyan-50',    border: 'border-cyan-100'   },
            in_transit:       { id: 'in_transit',       label: 'Đang luân chuyển',     icon: Truck,         color: 'text-sky-600',     bg: 'bg-sky-50',     border: 'border-sky-100'    },
            out_for_delivery: { id: 'out_for_delivery', label: 'Đang giao hàng',       icon: Truck,         color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-100' },
            delivering:       { id: 'delivering',       label: 'Đang giao hàng',       icon: Truck,         color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-100' },
            delivered:        { id: 'delivered',        label: 'Giao hàng thành công',  icon: CheckCircle2,  color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100'},
            completed:        { id: 'completed',        label: 'Giao hàng thành công',  icon: CheckCircle2,  color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100'},
            return_requested: { id: 'return_requested', label: 'Yêu cầu hoàn hàng',    icon: RotateCcw,     color: 'text-amber-700',   bg: 'bg-amber-100',  border: 'border-amber-200'  },
            returning:        { id: 'returning',        label: 'Đang hoàn hàng về shop',icon: RotateCcw,     color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-100' },
            returned:         { id: 'returned',         label: 'Hoàn hàng',            icon: RotateCcw,     color: 'text-pink-600',    bg: 'bg-pink-50',    border: 'border-pink-100'   },
            refunded:         { id: 'refunded',         label: 'Đã hoàn tiền',         icon: RotateCcw,     color: 'text-teal-600',    bg: 'bg-teal-50',    border: 'border-teal-100'   },
            cancelled:        { id: 'cancelled',        label: 'Đã hủy đơn hàng',      icon: XCircle,       color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-100'   },
        };
        return ALL_STATUSES[status] || STATUS_OPTIONS.find(s => s.id === status) || {
            id: status,
            label: status,
            icon: Clock,
            color: 'text-slate-600',
            bg: 'bg-slate-50',
            border: 'border-slate-200'
        };
    };

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
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--adm-text)' }}>
                            Quản lý đơn hàng
                        </h3>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all duration-500 ${liveSync ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-slate-500/10 border-slate-600/20 text-slate-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${liveSync ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                            {liveSync ? 'Đang đồng bộ...' : 'Live Sync 10s'}
                        </div>
                    </div>
                    <p className="text-sm mt-1" style={{ color: 'var(--adm-text-muted)' }}>
                        Theo dõi, kiểm tra và cập nhật tiến độ vận chuyển • Tự động đồng bộ 2 chiều với khách hàng
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
            <div className="adm-card overflow-visible">

                {/* ── DESKTOP TABLE (md+) ── */}
                <div className="hidden md:block">
                    <div className="adm-table-scroll">
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
                                                                    className="absolute right-0 top-full mt-2 z-[200] w-64 rounded-2xl shadow-2xl border p-2.5"
                                                                    style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                                                                >
                                                                    <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--adm-text-subtle)' }}>
                                                                        Chọn trạng thái mới:
                                                                    </p>
                                                                    <div className="space-y-0.5">
                                                                        {STATUS_OPTIONS.map((opt, optIdx) => {
                                                                            let normalizedStatus = order.status;
                                                                            if (['waiting_pickup', 'picked_up', 'in_transit', 'out_for_delivery', 'delivering', 'shipping'].includes(order.status as string)) {
                                                                                normalizedStatus = 'shipped';
                                                                            } else if ((order.status as string) === 'completed') {
                                                                                normalizedStatus = 'delivered';
                                                                            }

                                                                            const currentIdx = STATUS_OPTIONS.findIndex(s => s.id === normalizedStatus);
                                                                            
                                                                            // Logic: Chỉ được tiến, không được lùi
                                                                            const isBackward = currentIdx !== -1 && optIdx < currentIdx;
                                                                            const isTerminal = order.status === 'cancelled' || order.status === 'refunded';
                                                                            const isSame = order.status === opt.id || (normalizedStatus === 'delivered' && opt.id === 'delivered') || (normalizedStatus === 'shipped' && opt.id === 'shipped');
                                                                            
                                                                            // Đơn đã giao thành công thì KHÔNG được hủy
                                                                            const isDelivered = normalizedStatus === 'delivered';
                                                                            const cannotCancelDelivered = isDelivered && opt.id === 'cancelled';
                                                                            
                                                                            const isDisabled = isSubmitting || (isBackward && !isSame) || (isTerminal && !isSame) || cannotCancelDelivered;

                                                                            return (
                                                                            <button
                                                                                key={opt.id}
                                                                                onClick={() => {
                                                                                    if (order.status === 'pending' && opt.id === 'processing') {
                                                                                        handleApproveOrder(order.id!);
                                                                                    } else {
                                                                                        handleUpdateStatus(order.id!, opt.id);
                                                                                    }
                                                                                }}
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

                                            {/* ─── CARRIER SIMULATION CONTROL PANEL ──────────────────────── */}
                                            <div className="p-4 sm:p-5 rounded-2xl border bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-xl">
                                                <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-3">
                                                    <div className="flex items-center gap-2">
                                                        <Truck className="text-indigo-400" size={18} />
                                                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                                                            Mô phỏng Đơn vị Vận chuyển (Carrier Simulator)
                                                        </h4>
                                                    </div>
                                                    {(selectedOrder as any).trackingNumber && (
                                                        <span className="text-[10px] font-mono bg-indigo-500/30 text-indigo-200 px-2.5 py-1 rounded-full border border-indigo-400/30">
                                                            {(selectedOrder as any).trackingNumber}
                                                        </span>
                                                    )}
                                                </div>

                                                {!(selectedOrder as any).trackingNumber ? (
                                                    <div className="space-y-3">
                                                        <p className="text-xs text-slate-300">Chọn nhà vận chuyển để bàn giao và bắt đầu mô phỏng quy trình giao hàng:</p>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {[
                                                                { code: 'GHN', label: '🔴 Giao Hàng Nhanh' },
                                                                { code: 'GHTK', label: '🟢 Giao Hàng Tiết Kiệm' },
                                                                { code: 'JNT', label: '🔴 J&T Express' },
                                                                { code: 'VTP', label: '🔴 Viettel Post' },
                                                                { code: 'BEST', label: '🟡 BEST Express' },
                                                                { code: 'NJV', label: '🔴 Ninja Van' }
                                                            ].map(c => (
                                                                <button
                                                                    key={c.code}
                                                                    disabled={isSimulating}
                                                                    onClick={() => handleInitCarrier(selectedOrder.id!, c.code)}
                                                                    className="px-3 py-1.5 bg-white/10 hover:bg-indigo-600 border border-white/20 hover:border-indigo-400 rounded-xl text-xs font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
                                                                >
                                                                    {c.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between text-xs text-slate-300">
                                                            <span>Đơn vị: <strong className="text-white">{(selectedOrder as any).shippingProvider || (selectedOrder as any).carrierCode}</strong></span>
                                                            <span>Trạng thái: <strong className="text-emerald-400 font-bold uppercase">{selectedOrder.status}</strong></span>
                                                        </div>

                                                        {selectedOrder.status === 'cancelled' || selectedOrder.status === 'refunded' ? (
                                                            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs font-bold text-rose-300 flex items-center gap-2">
                                                                <XCircle size={15} />
                                                                <span>Đơn hàng đã hủy — Toàn bộ tiến trình giao hàng đã dừng.</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    disabled={isSimulating || selectedOrder.status === 'delivered'}
                                                                    onClick={() => handleAdvanceCarrier(selectedOrder.id!)}
                                                                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                                >
                                                                    <Truck size={14} />
                                                                    {selectedOrder.status === 'delivered' ? '✓ Đã giao thành công' : '⏩ Tiến 1 bước giao hàng'}
                                                                </button>
                                                            </div>
                                                        )}

                                                        {(selectedOrder as any).shippingTimeline?.length > 0 && (
                                                            <div className="mt-3 pt-3 border-t border-white/10 space-y-1 max-h-32 overflow-y-auto pr-1">
                                                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Mốc đã qua ({(selectedOrder as any).shippingTimeline.length}):</p>
                                                                {[(selectedOrder as any).shippingTimeline].flat().reverse().slice(0, 3).map((evt: any, i: number) => (
                                                                    <div key={i} className="text-[11px] text-slate-300 flex justify-between bg-white/5 px-2.5 py-1 rounded-lg">
                                                                        <span className="font-semibold text-white">{evt.title}</span>
                                                                        <span className="text-[10px] text-slate-400">{evt.location || ''}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
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
                                                                {isValidImageSrc(item.product.images?.[0]) && (
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
                                                                        {item.selectedSize || '—'}
                                                                    </span>
                                                                    <div
                                                                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border"
                                                                        style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                                                                    >
                                                                        <div className={`w-2 h-2 rounded-full border border-slate-200 ${getColorSwatchClass(item.selectedColor?.name || '')}`} />
                                                                        <span className="text-[10px] font-bold" style={{ color: 'var(--adm-text-muted)' }}>
                                                                            {item.selectedColor?.name || '—'}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-xs font-bold ml-auto" style={{ color: 'var(--adm-primary)' }}>
                                                                        x{item.quantity}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="text-right pl-2 flex-shrink-0">
                                                                <p className="text-sm font-bold" style={{ color: 'var(--adm-text)' }}>
                                                                    {formatPrice((item.product?.price || 0) * item.quantity)}
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
                                                            {(selectedOrder.customerName || '?').charAt(0).toUpperCase()}
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
                                                    {selectedOrder.shippingProvider && (
                                                        <div className="flex justify-between text-xs font-medium" style={{ color: 'var(--adm-text-muted)' }}>
                                                            <span>Đơn vị VC</span>
                                                            <span className="text-blue-400 font-bold">{selectedOrder.shippingProvider}</span>
                                                        </div>
                                                    )}
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
                                                        onClick={() => {
                                                            if (selectedOrder.status === 'pending' && opt.id === 'processing') {
                                                                handleApproveOrder(selectedOrder.id!);
                                                            } else {
                                                                handleUpdateStatus(selectedOrder.id!, opt.id);
                                                            }
                                                        }}
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

            {/* Shipping Provider Modal */}
            <AnimatePresence>
                {shippingModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200]"
                            onClick={() => setShippingModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[201] p-6 rounded-2xl shadow-2xl border"
                            style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                        >
                            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--adm-text)' }}>
                                Chọn đơn vị vận chuyển
                            </h3>
                            <p className="text-sm mb-6" style={{ color: 'var(--adm-text-muted)' }}>
                                Vui lòng chọn một đơn vị vận chuyển để duyệt đơn hàng này và chuẩn bị giao hàng.
                            </p>
                            
                            <div className="space-y-2.5 mb-6 max-h-[320px] overflow-y-auto pr-1">
                                {[
                                    { code: 'GHN',  name: 'Giao Hàng Nhanh (GHN)', color: '#E83B34', tag: 'Chuyển phát nhanh' },
                                    { code: 'GHTK', name: 'Giao Hàng Tiết Kiệm (GHTK)', color: '#009B57', tag: 'Tiết kiệm' },
                                    { code: 'JNT',  name: 'J&T Express', color: '#E30613', tag: 'Toàn quốc' },
                                    { code: 'VTP',  name: 'Viettel Post', color: '#C9272B', tag: 'Bưu điện Viettel' },
                                    { code: 'BEST', name: 'BEST Express', color: '#F5A623', tag: 'Giao hỏa tốc' },
                                    { code: 'NJV',  name: 'Ninja Van', color: '#E60B17', tag: 'Dịch vụ cao cấp' },
                                ].map(c => (
                                    <label key={c.code} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${selectedShippingProvider === c.code ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-900/30 shadow-sm' : 'border-[var(--adm-border)] hover:border-indigo-300'}`}>
                                        <input
                                            type="radio"
                                            name="shippingProvider"
                                            value={c.code}
                                            checked={selectedShippingProvider === c.code}
                                            onChange={(e) => setSelectedShippingProvider(e.target.value)}
                                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <div className="flex-1 flex items-center justify-between">
                                            <span className="font-semibold text-sm" style={{ color: 'var(--adm-text)' }}>{c.name}</span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{ color: c.color, borderColor: `${c.color}40`, backgroundColor: `${c.color}10` }}>
                                                {c.tag}
                                            </span>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShippingModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
                                    style={{ color: 'var(--adm-text-muted)' }}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={confirmApproveOrder}
                                    className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl shadow-indigo-200 dark:shadow-none"
                                >
                                    Xác nhận & Duyệt
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
