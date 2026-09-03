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
    ArrowRight,
    Copy,
    Check,
} from 'lucide-react';
import { OrderData } from '@/types';
import { formatPrice } from '@/lib/format';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
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
// Workflow Stages (Chỉ tiến, không lùi)
// ---------------------------------------------------------------------------
const WORKFLOW_STAGES = [
    { id: 'pending',    label: 'Chờ tiếp nhận' },
    { id: 'processing', label: 'Đã xác nhận'   },
    { id: 'shipped',    label: 'Đang vận chuyển' },
    { id: 'delivered',  label: 'Giao thành công' },
];

const STATUS_BUTTONS = [
    { id: 'pending',    label: 'Chờ xử lý',          icon: Clock,        color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-300' },
    { id: 'processing', label: 'Xác nhận & Đóng gói', icon: Package,      color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-300' },
    { id: 'shipped',    label: 'Đang vận chuyển',     icon: Truck,        color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-300' },
    { id: 'delivered',  label: 'Giao thành công',     icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300' },
    { id: 'cancelled',  label: 'Hủy đơn hàng này',    icon: XCircle,      color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-300' },
];

const normalizeWorkflowStatus = (status?: string): 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'return' => {
    if (!status) return 'pending';
    if (['pending'].includes(status)) return 'pending';
    if (['processing', 'confirmed', 'packing'].includes(status)) return 'processing';
    if (['shipped', 'shipping', 'waiting_pickup', 'picked_up', 'in_transit', 'out_for_delivery', 'delivering'].includes(status)) return 'shipped';
    if (['delivered', 'completed'].includes(status)) return 'delivered';
    if (['cancelled'].includes(status)) return 'cancelled';
    if (['return_requested', 'returning', 'return_received', 'refunded'].includes(status)) return 'return';
    return 'pending';
};

const getStageIndex = (status?: string): number => {
    const norm = normalizeWorkflowStatus(status);
    switch (norm) {
        case 'pending': return 0;
        case 'processing': return 1;
        case 'shipped': return 2;
        case 'delivered': return 3;
        default: return -1;
    }
};

const isTransitionAllowed = (currentStatus: string, targetStatus: string): boolean => {
    const currentNorm = normalizeWorkflowStatus(currentStatus);
    const targetNorm = normalizeWorkflowStatus(targetStatus);

    if (currentStatus === 'cancelled') return false;
    if (currentNorm === 'delivered') return false;

    if (targetStatus === 'cancelled') {
        return currentNorm === 'pending' || currentNorm === 'processing';
    }

    const currentIdx = getStageIndex(currentStatus);
    const targetIdx = getStageIndex(targetStatus);

    if (targetIdx < currentIdx) return false; // Chỉ được tiến, không được lùi
    return true;
};

const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string; dotColor: string }> = {
        pending:          { label: 'Chờ xử lý',       className: 'bg-amber-50 text-amber-700 border-amber-200',   dotColor: 'bg-amber-500' },
        processing:       { label: 'Đang xử lý',      className: 'bg-blue-50 text-blue-700 border-blue-200',      dotColor: 'bg-blue-500' },
        confirmed:        { label: 'Đã xác nhận',     className: 'bg-blue-50 text-blue-700 border-blue-200',      dotColor: 'bg-blue-500' },
        packing:          { label: 'Đang đóng gói',   className: 'bg-purple-50 text-purple-700 border-purple-200',dotColor: 'bg-purple-500' },
        shipped:          { label: 'Đang vận chuyển', className: 'bg-indigo-50 text-indigo-700 border-indigo-200',dotColor: 'bg-indigo-500' },
        shipping:         { label: 'Đang vận chuyển', className: 'bg-indigo-50 text-indigo-700 border-indigo-200',dotColor: 'bg-indigo-500' },
        waiting_pickup:   { label: 'Chờ lấy hàng',    className: 'bg-slate-100 text-slate-700 border-slate-200',  dotColor: 'bg-slate-500' },
        picked_up:        { label: 'Đã lấy hàng',     className: 'bg-cyan-50 text-cyan-700 border-cyan-200',      dotColor: 'bg-cyan-500' },
        in_transit:       { label: 'Đang luân chuyển',className: 'bg-sky-50 text-sky-700 border-sky-200',        dotColor: 'bg-sky-500' },
        out_for_delivery: { label: 'Đang giao hàng',  className: 'bg-orange-50 text-orange-700 border-orange-200',dotColor: 'bg-orange-500' },
        delivering:       { label: 'Đang giao hàng',  className: 'bg-orange-50 text-orange-700 border-orange-200',dotColor: 'bg-orange-500' },
        delivered:        { label: 'Giao thành công', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', dotColor: 'bg-emerald-500' },
        completed:        { label: 'Hoàn tất',        className: 'bg-emerald-50 text-emerald-700 border-emerald-200', dotColor: 'bg-emerald-500' },
        cancelled:        { label: 'Đã hủy',          className: 'bg-rose-50 text-rose-700 border-rose-200',      dotColor: 'bg-rose-500' },
        return_requested: { label: 'Yêu cầu hoàn',    className: 'bg-amber-100 text-amber-900 border-amber-300',  dotColor: 'bg-amber-600' },
        returning:        { label: 'Đang hoàn hàng',  className: 'bg-orange-50 text-orange-700 border-orange-200',dotColor: 'bg-orange-500' },
        return_received:  { label: 'Shop nhận hàng',  className: 'bg-teal-50 text-teal-700 border-teal-200',      dotColor: 'bg-teal-500' },
        refunded:         { label: 'Đã hoàn tiền',    className: 'bg-teal-50 text-teal-700 border-teal-200',      dotColor: 'bg-teal-500' },
    };
    return map[status] || { label: status, className: 'bg-slate-100 text-slate-700 border-slate-200', dotColor: 'bg-slate-400' };
};

const FILTER_TABS = [
    { id: 'all', label: 'Tất cả đơn hàng' },
    { id: 'pending', label: 'Chờ xử lý' },
    { id: 'processing', label: 'Đã xác nhận' },
    { id: 'shipped', label: 'Đang vận chuyển' },
    { id: 'delivered', label: 'Giao thành công' },
    { id: 'cancelled', label: 'Đã hủy' },
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
    const [copiedTracking, setCopiedTracking] = useState(false);
    
    // Shipping Modal State
    const [shippingModalOpen, setShippingModalOpen] = useState(false);
    const [orderToApprove, setOrderToApprove] = useState<string | null>(null);
    const [selectedShippingProvider, setSelectedShippingProvider] = useState<string>('GHN');
    const [isSimulating, setIsSimulating] = useState(false);

    const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
        const interval = setInterval(() => {
            fetchOrders(true);
        }, 10000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    // Handle URL parameters
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const orderIdParam = params.get('id') || params.get('search');
            const statusParam = params.get('status');

            if (orderIdParam) {
                setSearchQuery(orderIdParam);
                setFilterStatus('all');
            } else if (statusParam) {
                setFilterStatus(statusParam);
            }
        }
    }, []);

    // Auto open modal from URL id
    useEffect(() => {
        if (typeof window !== 'undefined' && orders.length > 0) {
            const params = new URLSearchParams(window.location.search);
            const targetId = params.get('id') || params.get('search');
            if (targetId) {
                const targetLower = targetId.toLowerCase();
                const matchedOrder = orders.find(o => 
                    o.id?.toLowerCase() === targetLower || 
                    (o.id && o.id.substring(0, 8).toLowerCase() === targetLower.substring(0, 8))
                );
                if (matchedOrder) {
                    setSelectedOrder(matchedOrder);
                }
            }
        }
    }, [orders]);

    // Sync tracking timeline when modal is open
    useEffect(() => {
        if (selectedOrder?.id) {
            fetch(`/api/carrier/timeline/${selectedOrder.id}`)
                .then(r => r.json())
                .then(data => {
                    if (data.success && data.timeline) {
                        setSelectedOrder((prev: any) => prev && prev.id === selectedOrder.id ? { ...prev, ...data.order, shippingTimeline: data.timeline } : prev);
                    }
                })
                .catch(() => {});
        }
    }, [selectedOrder?.id]);

    // Update status
    const handleUpdateStatus = async (orderId: string, newStatus: string, shippingProvider?: string) => {
        const order = orders.find(o => o.id === orderId) || selectedOrder;
        if (order) {
            if (!isTransitionAllowed(order.status, newStatus)) {
                alert('Thao tác không hợp lệ: Quy trình chỉ được tiến lên, không thể lùi về bước trước!');
                return;
            }
        }

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
            } else {
                alert(data.message || 'Lỗi cập nhật trạng thái');
            }
        } catch {
            alert('Lỗi kết nối máy chủ');
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
                const timelineRes = await fetch(`/api/carrier/timeline/${orderId}`);
                const timelineData = await timelineRes.json();
                if (timelineData.success) {
                    setSelectedOrder((prev: any) => ({ ...prev, ...timelineData.order, shippingTimeline: timelineData.timeline, status: 'shipped', shippingProvider: carrierCode }));
                }
            } else {
                alert(data.message || 'Lỗi khi tạo vận đơn');
            }
        } catch {
            alert('Lỗi kết nối máy chủ');
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
                    setSelectedOrder((prev: any) => ({ ...prev, ...timelineData.order, shippingTimeline: timelineData.timeline, status: data.newStatus || (data.done ? 'delivered' : prev.status) }));
                }
            } else {
                alert(data.message || 'Không thể cập nhật tiến độ giao hàng');
            }
        } catch {
            alert('Lỗi kết nối máy chủ');
        } finally {
            setIsSimulating(false);
        }
    };

    const copyTracking = (tracking: string) => {
        navigator.clipboard.writeText(tracking);
        setCopiedTracking(true);
        setTimeout(() => setCopiedTracking(false), 2000);
    };

    // Filter & Search
    const filteredOrders = orders.filter(o => {
        const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            (o.id?.toLowerCase().includes(q)) ||
            o.customerName.toLowerCase().includes(q) ||
            o.email.toLowerCase().includes(q);
        return matchesStatus && matchesSearch;
    });

    useEffect(() => { setCurrentPage(1); }, [filterStatus, searchQuery]);

    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
    );

    return (
        <div className="space-y-6">

            {/* ── Page Header ─────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Danh sách đơn hàng
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Quản lý xử lý đơn, theo dõi vận chuyển và tiến độ giao nhận hàng
                    </p>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-80">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
                        size={16}
                    />
                    <input
                        type="text"
                        placeholder="Tìm theo mã đơn, khách hàng, email..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* ── Filter Tabs & Returns Link ─── */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0" style={{ scrollbarWidth: 'none' }}>
                    {FILTER_TABS.map(tab => {
                        const isActive = filterStatus === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setFilterStatus(tab.id)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                                    isActive
                                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <Link
                    href="/admin/returns"
                    className="flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors shrink-0"
                >
                    <RotateCcw size={13} />
                    <span>Quản lý đổi trả & hoàn tiền</span>
                </Link>
            </div>

            {/* ── Table ────────────────────────────────────────────────────── */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                
                {/* Desktop view */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-5 py-3.5">Mã đơn & Khách hàng</th>
                                <th className="px-5 py-3.5">Ngày đặt</th>
                                <th className="px-5 py-3.5">Thanh toán</th>
                                <th className="px-5 py-3.5">Tổng tiền</th>
                                <th className="px-5 py-3.5">Cập nhật trạng thái</th>
                                <th className="px-5 py-3.5 text-right">Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                            {loading ? (
                                <SkeletonTable rows={ITEMS_PER_PAGE} cols={6} />
                            ) : paginatedOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <EmptyState
                                            icon={Package}
                                            title="Không có đơn hàng nào"
                                            description={searchQuery ? `Không có kết quả khớp với "${searchQuery}"` : 'Chưa có đơn hàng trong trạng thái này.'}
                                        />
                                    </td>
                                </tr>
                            ) : (
                                paginatedOrders.map(order => {
                                    const badge = getStatusBadge(order.status);
                                    return (
                                        <tr
                                            key={order.id}
                                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                                        >
                                            {/* Order ID & Customer */}
                                            <td className="px-5 py-4">
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white">
                                                        #{order.id}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {order.customerName}
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Date */}
                                            <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-400">
                                                {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                })}
                                            </td>

                                            {/* Payment method */}
                                            <td className="px-5 py-4">
                                                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                                    {order.paymentMethod === 'pay-cod' || order.paymentMethod === 'cod' ? 'COD' : order.paymentMethod === 'momo' ? 'Ví MoMo' : order.paymentMethod === 'vnpay' ? 'VNPAY' : 'Chuyển khoản'}
                                                </span>
                                            </td>

                                            {/* Total */}
                                            <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                                                {formatPrice(order.finalAmount || order.totalAmount)}
                                            </td>

                                            {/* Status dropdown */}
                                            <td className="px-5 py-4">
                                                <div
                                                    className="relative inline-block"
                                                    ref={el => { dropdownRefs.current[order.id!] = el; }}
                                                >
                                                    <button
                                                        onClick={() => setOpenDropdownId(openDropdownId === order.id ? null : order.id!)}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer hover:shadow-xs transition-all ${badge.className}`}
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`} />
                                                        <span>{badge.label}</span>
                                                        <ChevronDown size={13} className={`opacity-60 transition-transform ${openDropdownId === order.id ? 'rotate-180' : ''}`} />
                                                    </button>

                                                    <AnimatePresence>
                                                        {openDropdownId === order.id && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -5, scale: 0.98 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: -5, scale: 0.98 }}
                                                                transition={{ duration: 0.12 }}
                                                                className="absolute left-0 top-full mt-1.5 z-50 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-1.5"
                                                            >
                                                                <div className="space-y-0.5">
                                                                    {STATUS_BUTTONS.map(btn => {
                                                                        const isCurrent = normalizeWorkflowStatus(order.status) === btn.id || (btn.id === 'delivered' && order.status === 'completed') || order.status === btn.id;
                                                                        const allowed = isTransitionAllowed(order.status, btn.id);
                                                                        const isPast = !allowed && !isCurrent;

                                                                        return (
                                                                            <button
                                                                                key={btn.id}
                                                                                disabled={isPast || isSubmitting}
                                                                                onClick={() => {
                                                                                    if (isCurrent) return;
                                                                                    if (order.status === 'pending' && btn.id === 'processing') {
                                                                                        handleApproveOrder(order.id!);
                                                                                    } else {
                                                                                        handleUpdateStatus(order.id!, btn.id);
                                                                                    }
                                                                                }}
                                                                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                                                                    isCurrent
                                                                                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold'
                                                                                        : allowed
                                                                                        ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer'
                                                                                        : 'opacity-30 cursor-not-allowed text-slate-400'
                                                                                }`}
                                                                            >
                                                                                <btn.icon size={13} />
                                                                                <span className="flex-1 text-left">{btn.label}</span>
                                                                                {isCurrent && <Check size={13} className="text-emerald-400" />}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </td>

                                            {/* View button */}
                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                                                >
                                                    <Eye size={14} />
                                                    Chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile view */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                        <div className="p-4"><SkeletonList rows={5} /></div>
                    ) : paginatedOrders.length === 0 ? (
                        <EmptyState icon={Package} title="Không có đơn hàng nào" description="Không tìm thấy đơn hàng." />
                    ) : (
                        paginatedOrders.map(order => {
                            const badge = getStatusBadge(order.status);
                            return (
                                <div key={order.id} className="p-4 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-sm text-slate-900 dark:text-white">#{order.id}</p>
                                            <p className="text-xs text-slate-500">{order.customerName}</p>
                                        </div>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${badge.className}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`} />
                                            {badge.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                                        <span>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                                            {formatPrice(order.finalAmount || order.totalAmount)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setSelectedOrder(order)}
                                        className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5"
                                    >
                                        <Eye size={14} /> Xem chi tiết
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Pagination */}
                {!loading && filteredOrders.length > ITEMS_PER_PAGE && (
                    <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800">
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

            {/* ── PROFESSIONAL ORDER DETAIL MODAL ─────────────────────────── */}
            <AnimatePresence>
                {selectedOrder && (
                    <>
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedOrder(null)}
                            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs"
                        />

                        <motion.div
                            key="modal"
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 10 }}
                            transition={{ duration: 0.15 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none"
                        >
                            <div className="pointer-events-auto flex flex-col w-full max-w-5xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-white">

                                {/* Header */}
                                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <div className="flex items-center gap-2.5">
                                                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                                    Đơn hàng #{selectedOrder.id}
                                                </h2>
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(selectedOrder.status).className}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusBadge(selectedOrder.status).dotColor}`} />
                                                    {getStatusBadge(selectedOrder.status).label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Đặt lúc {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                                    {/* ── Order Progress Stepper ── */}
                                    <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <div className="flex items-center justify-between relative px-2 sm:px-6">
                                            {/* Progress connecting line */}
                                            <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-700 -z-0" />
                                            
                                            {WORKFLOW_STAGES.map((stage, idx) => {
                                                const currentIdx = getStageIndex(selectedOrder.status);
                                                const isCompleted = selectedOrder.status !== 'cancelled' && currentIdx >= idx;
                                                const isActive = selectedOrder.status !== 'cancelled' && currentIdx === idx;

                                                return (
                                                    <div key={stage.id} className="flex flex-col items-center relative z-10">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                                            isActive
                                                                ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/40'
                                                                : isCompleted
                                                                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                                                                : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700'
                                                        }`}>
                                                            {isCompleted && !isActive ? <Check size={14} /> : idx + 1}
                                                        </div>
                                                        <span className={`mt-2 text-xs font-medium ${
                                                            isActive ? 'text-blue-600 dark:text-blue-400 font-bold' : isCompleted ? 'text-slate-900 dark:text-slate-100 font-semibold' : 'text-slate-400'
                                                        }`}>
                                                            {stage.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Grid: 2 columns */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                                        {/* Left col: Products & Shipping */}
                                        <div className="lg:col-span-7 space-y-6">

                                            {/* ── Shipping & Fulfillment Card ── */}
                                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Truck size={16} className="text-slate-500" />
                                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                            Vận chuyển & Giao nhận
                                                        </h3>
                                                    </div>
                                                    {((selectedOrder as any).trackingNumber || (selectedOrder as any).shippingProvider) && (
                                                        <div className="flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-slate-600 dark:text-slate-300">
                                                            <span className="font-mono">{(selectedOrder as any).trackingNumber || (selectedOrder as any).shippingProvider}</span>
                                                            <button
                                                                onClick={() => copyTracking((selectedOrder as any).trackingNumber || (selectedOrder as any).shippingProvider)}
                                                                title="Sao chép mã"
                                                                className="text-slate-400 hover:text-slate-600"
                                                            >
                                                                {copiedTracking ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Shipping provider status */}
                                                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
                                                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                                                        <span>Đơn vị vận chuyển:</span>
                                                        <span className="font-semibold text-slate-900 dark:text-white">
                                                            {(selectedOrder as any).shippingProvider || (selectedOrder as any).carrierCode || 'Giao Hàng Nhanh (GHN)'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                                                        <span>Trạng thái bưu kiện:</span>
                                                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                                                            {getStatusBadge(selectedOrder.status).label}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                {selectedOrder.status === 'pending' && !(selectedOrder as any).trackingNumber ? (
                                                    <div className="pt-2">
                                                        <p className="text-xs text-slate-500 mb-2.5">Chọn đơn vị vận chuyển để bắt đầu bàn giao:</p>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {[
                                                                { code: 'GHN', label: 'GHN Express' },
                                                                { code: 'GHTK', label: 'GHTK' },
                                                                { code: 'VTP', label: 'Viettel Post' },
                                                            ].map(c => (
                                                                <button
                                                                    key={c.code}
                                                                    disabled={isSimulating}
                                                                    onClick={() => handleInitCarrier(selectedOrder.id!, c.code)}
                                                                    className="px-3 py-2 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-center"
                                                                >
                                                                    {c.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : selectedOrder.status !== 'delivered' && selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' ? (
                                                    <div className="pt-2">
                                                        <button
                                                            disabled={isSimulating}
                                                            onClick={() => handleAdvanceCarrier(selectedOrder.id!)}
                                                            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                                        >
                                                            <Truck size={14} />
                                                            <span>{isSimulating ? 'Đang cập nhật...' : 'Tiến 1 bước giao hàng'}</span>
                                                        </button>
                                                    </div>
                                                ) : null}

                                                {/* Timeline */}
                                                {(selectedOrder as any).shippingTimeline?.length > 0 && (
                                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                            Lộ trình giao hàng ({(selectedOrder as any).shippingTimeline.length} mốc):
                                                        </p>
                                                        <div className="max-h-36 overflow-y-auto space-y-2 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                                                            {[(selectedOrder as any).shippingTimeline].flat().reverse().map((evt: any, i: number) => (
                                                                <div key={i} className="text-xs text-slate-600 dark:text-slate-400 pl-2 relative">
                                                                    <div className="font-semibold text-slate-900 dark:text-white">{evt.title}</div>
                                                                    <div className="text-[11px] text-slate-400">{evt.location || ''}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* ── Products List ── */}
                                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                    Sản phẩm ({selectedOrder.items?.length || 0})
                                                </h3>

                                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {(selectedOrder.items || []).map((item, idx) => (
                                                        <div key={idx} className="py-3 flex items-center gap-3.5 first:pt-0 last:pb-0">
                                                            <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden relative shrink-0 border border-slate-200 dark:border-slate-700">
                                                                {isValidImageSrc(item.product?.images?.[0]) ? (
                                                                    <Image src={item.product.images[0]} alt={item.product?.name || ''} fill className="object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                                        <Package size={16} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                                                    {item.product?.name}
                                                                </p>
                                                                <p className="text-[11px] text-slate-500 mt-0.5">
                                                                    Size: {item.selectedSize || 'F'} • Màu: {item.selectedColor?.name || 'Mặc định'} • SL: {item.quantity}
                                                                </p>
                                                            </div>
                                                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                                                                {formatPrice((item.product?.price || 0) * item.quantity)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                        </div>

                                        {/* Right col: Customer & Payment */}
                                        <div className="lg:col-span-5 space-y-6">

                                            {/* ── Customer Info ── */}
                                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                    Khách hàng
                                                </h3>

                                                <div className="space-y-2.5 text-xs">
                                                    <div>
                                                        <p className="text-slate-400 text-[11px]">Họ tên</p>
                                                        <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{selectedOrder.customerName}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-400 text-[11px]">Số điện thoại</p>
                                                        <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{selectedOrder.phone || '—'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-400 text-[11px]">Email</p>
                                                        <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{selectedOrder.email || '—'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-400 text-[11px]">Địa chỉ giao hàng</p>
                                                        <p className="font-semibold text-slate-900 dark:text-white mt-0.5 leading-relaxed">{selectedOrder.address || '—'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ── Payment Summary ── */}
                                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                    Thanh toán
                                                </h3>

                                                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                                                    <div className="flex justify-between">
                                                        <span>Tạm tính tiền hàng:</span>
                                                        <span className="font-semibold text-slate-900 dark:text-white">{formatPrice(selectedOrder.totalAmount)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Phí vận chuyển:</span>
                                                        <span className="text-emerald-600 font-semibold">Miễn phí</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Hình thức:</span>
                                                        <span className="font-semibold text-slate-900 dark:text-white">
                                                            {selectedOrder.paymentMethod === 'pay-cod' || selectedOrder.paymentMethod === 'cod' ? 'COD' : selectedOrder.paymentMethod === 'momo' ? 'Ví MoMo' : selectedOrder.paymentMethod === 'vnpay' ? 'VNPAY' : 'Chuyển khoản'}
                                                        </span>
                                                    </div>
                                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                                                        <span className="font-bold text-slate-900 dark:text-white text-sm">Tổng cộng:</span>
                                                        <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                                                            {formatPrice(selectedOrder.finalAmount || selectedOrder.totalAmount)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>

                                    </div>
                                </div>

                                {/* ── MODAL FOOTER: CẬP NHẬT NHANH (CHỈ TIẾN, KHÔNG LÙI) ── */}
                                <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                                    
                                    {/* Action buttons list */}
                                    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0" style={{ scrollbarWidth: 'none' }}>
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
                                            Cập nhật nhanh:
                                        </span>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {STATUS_BUTTONS.map(btn => {
                                                const normCurrent = normalizeWorkflowStatus(selectedOrder.status);
                                                const isCurrent = normCurrent === btn.id || (btn.id === 'delivered' && selectedOrder.status === 'completed') || selectedOrder.status === btn.id;
                                                const allowed = isTransitionAllowed(selectedOrder.status, btn.id);
                                                const isPast = !allowed && !isCurrent;

                                                return (
                                                    <button
                                                        key={btn.id}
                                                        disabled={isPast || isSubmitting}
                                                        onClick={() => {
                                                            if (isCurrent) return;
                                                            if (selectedOrder.status === 'pending' && btn.id === 'processing') {
                                                                handleApproveOrder(selectedOrder.id!);
                                                            } else {
                                                                handleUpdateStatus(selectedOrder.id!, btn.id);
                                                            }
                                                        }}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap ${
                                                            isCurrent
                                                                ? `${btn.bg} ${btn.color} ${btn.border} ring-2 ring-emerald-400 font-bold shadow-xs`
                                                                : allowed
                                                                ? 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:text-blue-600 cursor-pointer active:scale-95'
                                                                : 'opacity-35 cursor-not-allowed bg-slate-100 dark:bg-slate-800/50 text-slate-400 border-slate-200 dark:border-slate-800'
                                                        }`}
                                                    >
                                                        {isCurrent ? (
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        ) : (
                                                            <btn.icon size={13} />
                                                        )}
                                                        <span>{btn.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Close modal */}
                                    <div className="flex items-center justify-end shrink-0">
                                        <button
                                            onClick={() => setSelectedOrder(null)}
                                            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                        >
                                            Đóng
                                        </button>
                                    </div>

                                </div>

                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── SHIPPING PROVIDER APPROVAL MODAL ── */}
            <AnimatePresence>
                {shippingModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50"
                            onClick={() => setShippingModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 10 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 p-6 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                        >
                            <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">
                                Chọn đơn vị vận chuyển
                            </h3>
                            <p className="text-xs text-slate-500 mb-4">
                                Chọn đơn vị để tạo mã vận đơn và chuyển đơn hàng sang trạng thái đóng gói giao hàng.
                            </p>
                            
                            <div className="space-y-2 mb-5">
                                {[
                                    { code: 'GHN',  name: 'Giao Hàng Nhanh (GHN)' },
                                    { code: 'GHTK', name: 'Giao Hàng Tiết Kiệm (GHTK)' },
                                    { code: 'JNT',  name: 'J&T Express' },
                                    { code: 'VTP',  name: 'Viettel Post' },
                                ].map(c => (
                                    <label key={c.code} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedShippingProvider === c.code ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                        <input
                                            type="radio"
                                            name="shippingProvider"
                                            value={c.code}
                                            checked={selectedShippingProvider === c.code}
                                            onChange={(e) => setSelectedShippingProvider(e.target.value)}
                                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="font-semibold text-xs text-slate-900 dark:text-white">{c.name}</span>
                                    </label>
                                ))}
                            </div>

                            <div className="flex gap-2.5 justify-end">
                                <button
                                    onClick={() => setShippingModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={confirmApproveOrder}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                                >
                                    Xác nhận & Bàn giao
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
