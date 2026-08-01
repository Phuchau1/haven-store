'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Truck, Package, CheckCircle2, Clock, MapPin, Search,
    QrCode, ExternalLink, RefreshCw, X, ShieldAlert, ArrowRight,
    RotateCcw, AlertTriangle, ChevronRight, Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface OrderItem {
    product: { id: string; name: string };
    selectedSize: string;
    selectedColor: { name: string };
    quantity: number;
}

interface OrderData {
    id: string;
    customerName?: string;
    name?: string;
    phone: string;
    address: string;
    finalAmount?: number;
    totalAmount?: number;
    status: string;
    carrierCode?: string;
    trackingNumber?: string;
    items: OrderItem[];
    createdAt?: string;
}

// ─── Status display map ───────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
    pending:              'Chờ xác nhận',
    confirmed:            'Đã xác nhận',
    processing:           'Đang đóng gói',
    waiting_pickup:       'Chờ lấy hàng',
    picked_up:            'Đã lấy hàng',
    in_transit:           'Đang vận chuyển',
    out_for_delivery:     'Đang giao đến khách',
    shipped:              'Đang vận chuyển',
    delivered:            '✅ Giao thành công',
    completed:            '✅ Hoàn tất',
    awaiting_review:      'Chờ đánh giá',
    reviewed:             'Đã đánh giá',
    return_requested:     '⏳ Chờ duyệt hoàn',
    returning:            '↩️ Đang hoàn hàng',
    return_received:      'Shop nhận hàng trả',
    refunded:             '💚 Đã hoàn tiền',
    cancelled:            '❌ Đã hủy',
    delivery_failed:      'Giao hàng thất bại',
    returned_to_seller:   'Hoàn về shop',
};

const STATUS_BADGE: Record<string, string> = {
    pending:              'bg-amber-50 text-amber-700 border-amber-200',
    confirmed:            'bg-blue-50 text-blue-700 border-blue-200',
    processing:           'bg-indigo-50 text-indigo-700 border-indigo-200',
    waiting_pickup:       'bg-purple-50 text-purple-700 border-purple-200',
    picked_up:            'bg-violet-50 text-violet-700 border-violet-200',
    in_transit:           'bg-sky-50 text-sky-700 border-sky-200',
    out_for_delivery:     'bg-blue-50 text-blue-700 border-blue-200',
    shipped:              'bg-sky-50 text-sky-700 border-sky-200',
    delivered:            'bg-emerald-50 text-emerald-700 border-emerald-200',
    completed:            'bg-emerald-50 text-emerald-700 border-emerald-200',
    awaiting_review:      'bg-teal-50 text-teal-700 border-teal-200',
    reviewed:             'bg-teal-50 text-teal-700 border-teal-200',
    return_requested:     'bg-amber-50 text-amber-800 border-amber-300',
    returning:            'bg-orange-50 text-orange-700 border-orange-200',
    return_received:      'bg-lime-50 text-lime-700 border-lime-200',
    refunded:             'bg-rose-50 text-rose-700 border-rose-200',
    cancelled:            'bg-gray-100 text-gray-600 border-gray-200',
    delivery_failed:      'bg-red-50 text-red-700 border-red-200',
    returned_to_seller:   'bg-orange-50 text-orange-700 border-orange-200',
};

// Carriers that have been shipped
const CARRIER_STATUSES = ['waiting_pickup', 'picked_up', 'in_transit', 'out_for_delivery', 'shipped', 'delivered', 'completed', 'awaiting_review', 'reviewed'];

// Status filter tabs
const FILTER_TABS = [
    { id: 'all',              label: 'Tất cả' },
    { id: 'need_waybill',     label: '📦 Cần tạo vận đơn' },
    { id: 'in_transit',       label: '🚚 Đang vận chuyển' },
    { id: 'delivered',        label: '✅ Đã giao' },
    { id: 'return_requested', label: '⏳ Chờ duyệt hoàn' },
    { id: 'refunded',         label: '↩️ Đã hoàn tiền' },
];

const CARRIERS = [
    { code: 'GHN',         name: 'GHN Express',       logo: '🟠' },
    { code: 'GHTK',        name: 'GHTK Tiết Kiệm',    logo: '🟢' },
    { code: 'VIETTELPOST', name: 'Viettel Post',       logo: '🔴' },
    { code: 'VNPOST',      name: 'VNPost Bưu Điện',   logo: '🔵' },
];

// Normalize carrier sub-statuses
function normalizeStatus(status: string): string {
    const inTransit = ['waiting_pickup', 'picked_up', 'in_transit', 'out_for_delivery', 'shipping'];
    if (inTransit.includes(status)) return 'in_transit';
    if (['completed', 'awaiting_review', 'reviewed'].includes(status)) return 'delivered';
    return status;
}

export default function LogisticsManagementPage() {
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
    const [selectedCarrier, setSelectedCarrier] = useState('GHN');
    const [submitting, setSubmitting] = useState(false);
    const [trackingModal, setTrackingModal] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [filterTab, setFilterTab] = useState('all');

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/orders');
            const data = await res.json();
            if (data.success && data.orders) {
                setOrders(data.orders);
            }
        } catch (err) {
            toast.error('Không thể lấy danh sách đơn hàng từ server');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const handleCreateWaybill = async (order: OrderData) => {
        setSubmitting(true);
        try {
            const res = await fetch('/api/wms/waybill', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderData: {
                        id: order.id,
                        customerName: order.customerName || order.name || 'Khách hàng',
                        phone: order.phone,
                        address: order.address,
                        totalAmount: order.finalAmount || order.totalAmount || 0,
                        items: order.items.map(it => ({
                            sku: `${it.product?.id || 'PROD'}-${it.selectedColor?.name || ''}-${it.selectedSize || ''}`,
                            productName: it.product?.name || 'Sản phẩm',
                            quantity: it.quantity
                        }))
                    },
                    carrierCode: selectedCarrier
                })
            });

            const data = await res.json();
            if (data.success && data.waybill) {
                const waybill = data.waybill;
                setOrders(prev => prev.map(o => o.id === order.id ? {
                    ...o,
                    status: 'waiting_pickup',
                    carrierCode: waybill.carrierCode,
                    trackingNumber: waybill.trackingNumber
                } : o));
                toast.success(`✅ Đã tạo vận đơn ${waybill.carrierName} thành công! Tracking: ${waybill.trackingNumber}`);
                setSelectedOrder(null);
            } else {
                throw new Error(data.message || 'Không thể tạo vận đơn');
            }
        } catch (err: any) {
            toast.error(err.message || 'Không thể tạo vận đơn');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFetchTracking = async (trackingNum: string) => {
        try {
            const res = await fetch(`/api/wms/tracking/${trackingNum}`);
            const data = await res.json();
            if (data.success) {
                setTrackingModal(data.tracking);
            } else {
                toast.error('Không tìm thấy thông tin tracking');
            }
        } catch (err) {
            toast.error('Không thể lấy lịch trình giao hàng');
        }
    };

    // Filter orders
    const filteredOrders = orders.filter(o => {
        const s = search.toLowerCase();
        const matchSearch =
            (o.id || '').toLowerCase().includes(s) ||
            (o.customerName || o.name || '').toLowerCase().includes(s) ||
            (o.phone || '').includes(s) ||
            (o.trackingNumber || '').toLowerCase().includes(s);

        const norm = normalizeStatus(o.status);
        if (filterTab === 'all') return matchSearch;
        if (filterTab === 'need_waybill') return matchSearch && (o.status === 'processing' || o.status === 'confirmed') && !o.trackingNumber;
        if (filterTab === 'in_transit') return matchSearch && (CARRIER_STATUSES.includes(o.status) && !['delivered', 'completed', 'awaiting_review', 'reviewed'].includes(o.status));
        if (filterTab === 'delivered') return matchSearch && ['delivered', 'completed', 'awaiting_review', 'reviewed'].includes(o.status);
        if (filterTab === 'return_requested') return matchSearch && o.status === 'return_requested';
        if (filterTab === 'refunded') return matchSearch && ['refunded', 'returning', 'return_received'].includes(o.status);
        return matchSearch;
    });

    // Counts for tabs
    const tabCounts: Record<string, number> = {
        all: orders.length,
        need_waybill: orders.filter(o => (o.status === 'processing' || o.status === 'confirmed') && !o.trackingNumber).length,
        in_transit: orders.filter(o => CARRIER_STATUSES.includes(o.status) && !['delivered', 'completed', 'awaiting_review', 'reviewed'].includes(o.status)).length,
        delivered: orders.filter(o => ['delivered', 'completed', 'awaiting_review', 'reviewed'].includes(o.status)).length,
        return_requested: orders.filter(o => o.status === 'return_requested').length,
        refunded: orders.filter(o => ['refunded', 'returning', 'return_received'].includes(o.status)).length,
    };

    const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-6 rounded-2xl border shadow-sm"
                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider inline-block mb-2">
                        Logistics & Fulfillment
                    </span>
                    <h1 className="text-xl font-black" style={{ color: 'var(--adm-text)' }}>
                        Quản Lý Vận Chuyển Đơn Hàng
                    </h1>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                        Tạo vận đơn GHN / GHTK / ViettelPost / VNPost & theo dõi Live Tracking
                    </p>

                    {/* Workflow note */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]" style={{ color: 'var(--adm-text-muted)' }}>
                        <span className="px-2 py-0.5 rounded-lg border font-semibold" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>Admin duyệt đơn</span>
                        <ChevronRight size={12} />
                        <span className="px-2 py-0.5 rounded-lg border font-semibold" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>Tạo vận đơn</span>
                        <ChevronRight size={12} />
                        <span className="px-2 py-0.5 rounded-lg border font-semibold" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>Vận chuyển giao hàng</span>
                        <ChevronRight size={12} />
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">Khách nhận hàng</span>
                        <ChevronRight size={12} />
                        <Link href="/admin/inventory/returns" className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-semibold hover:bg-amber-100 transition-colors">
                            ↩️ Duyệt hoàn hàng (WMS)
                        </Link>
                    </div>
                </div>

                <button
                    onClick={fetchOrders}
                    className="px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0"
                    style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Cập nhật từ Database
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {FILTER_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilterTab(tab.id)}
                        className={`px-3.5 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                            filterTab === tab.id
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'border'
                        }`}
                        style={filterTab !== tab.id ? { backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' } : {}}
                    >
                        {tab.label}
                        {tabCounts[tab.id] > 0 && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                                filterTab === tab.id ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'
                            }`}>
                                {tabCounts[tab.id]}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 border"
                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <Search size={16} className="shrink-0" style={{ color: 'var(--adm-text-muted)' }} />
                <input
                    type="text"
                    placeholder="Tìm đơn theo Mã Đơn, Tên Khách, SĐT, Tracking..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 bg-transparent text-xs focus:outline-none"
                    style={{ color: 'var(--adm-text)' }}
                />
                {search && (
                    <button onClick={() => setSearch('')} style={{ color: 'var(--adm-text-muted)' }}>
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Return Requested Alert */}
            {tabCounts.return_requested > 0 && filterTab !== 'return_requested' && (
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50 border border-amber-200"
                >
                    <div className="flex items-center gap-2.5">
                        <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                        <p className="text-xs font-semibold text-amber-800">
                            Có <strong>{tabCounts.return_requested}</strong> đơn hàng đang chờ duyệt hoàn — cần xử lý tại WMS Returns
                        </p>
                    </div>
                    <Link
                        href="/admin/inventory/returns"
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold whitespace-nowrap flex items-center gap-1 transition-all"
                    >
                        Duyệt ngay <ArrowRight size={12} />
                    </Link>
                </motion.div>
            )}

            {/* Orders Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-48 rounded-2xl border animate-pulse"
                            style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }} />
                    ))
                ) : filteredOrders.length === 0 ? (
                    <div className="col-span-full py-16 text-center" style={{ color: 'var(--adm-text-muted)' }}>
                        <Truck size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="font-semibold" style={{ color: 'var(--adm-text)' }}>Không tìm thấy đơn hàng nào</p>
                        <p className="text-xs mt-1">Thử chuyển sang tab khác hoặc xóa từ khóa tìm kiếm</p>
                    </div>
                ) : (
                    filteredOrders.map((order, idx) => (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="rounded-2xl p-5 border shadow-sm space-y-4"
                            style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                        >
                            {/* Order Header */}
                            <div className="flex items-start justify-between gap-3 pb-3 border-b"
                                style={{ borderColor: 'var(--adm-border)' }}>
                                <div>
                                    <span className="font-black text-sm text-amber-600">{order.id}</span>
                                    <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--adm-text)' }}>
                                        {order.customerName || order.name || 'Khách hàng'}
                                    </p>
                                    <p className="text-[11px]" style={{ color: 'var(--adm-text-muted)' }}>{order.phone}</p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                    {STATUS_LABEL[order.status] || order.status}
                                </span>
                            </div>

                            {/* Address & Items */}
                            <div className="space-y-2 text-xs">
                                <p className="flex items-start gap-1.5" style={{ color: 'var(--adm-text-muted)' }}>
                                    <MapPin size={13} className="shrink-0 text-amber-500 mt-0.5" />
                                    <span className="line-clamp-2">{order.address}</span>
                                </p>
                                <div className="pt-2 border-t space-y-1" style={{ borderColor: 'var(--adm-border)' }}>
                                    {order.items?.slice(0, 3).map((it, iIdx) => (
                                        <p key={iIdx} className="flex justify-between" style={{ color: 'var(--adm-text)' }}>
                                            <span className="line-clamp-1 flex-1">
                                                • {it.product?.name || 'Sản phẩm'}
                                                {it.selectedColor?.name && ` (${it.selectedColor.name})`}
                                                {it.selectedSize && ` / ${it.selectedSize}`}
                                            </span>
                                            <span className="font-bold ml-2 shrink-0">×{it.quantity}</span>
                                        </p>
                                    ))}
                                    {order.items?.length > 3 && (
                                        <p className="text-[11px]" style={{ color: 'var(--adm-text-muted)' }}>+{order.items.length - 3} sản phẩm khác</p>
                                    )}
                                </div>
                            </div>

                            {/* Footer: Amount + Actions */}
                            <div className="flex items-center justify-between pt-3 border-t"
                                style={{ borderColor: 'var(--adm-border)' }}>
                                <div>
                                    <span className="text-[10px]" style={{ color: 'var(--adm-text-subtle)' }}>Tổng thanh toán:</span>
                                    <p className="font-black text-sm" style={{ color: 'var(--adm-text)' }}>
                                        {formatVND(order.finalAmount || order.totalAmount || 0)}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Có tracking → hiện tracking + trạng thái */}
                                    {order.trackingNumber ? (
                                        <>
                                            <button
                                                onClick={() => handleFetchTracking(order.trackingNumber!)}
                                                className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200 flex items-center gap-1.5 transition-all"
                                            >
                                                <Truck size={13} />
                                                Tracking: {order.carrierCode && <span className="font-mono">{order.carrierCode}</span>}
                                            </button>

                                            {/* return_requested → link sang WMS Returns */}
                                            {order.status === 'return_requested' && (
                                                <Link
                                                    href="/admin/inventory/returns"
                                                    className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[11px] border border-amber-300 flex items-center gap-1 transition-all animate-pulse"
                                                >
                                                    <RotateCcw size={13} /> Duyệt Hoàn
                                                </Link>
                                            )}

                                            {/* Đã refunded */}
                                            {order.status === 'refunded' && (
                                                <span className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 font-bold text-[11px] border border-rose-200 flex items-center gap-1">
                                                    ✅ Đã hoàn tiền
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        /* Chưa có tracking → cho phép tạo vận đơn nếu đơn đang processing/confirmed */
                                        (order.status === 'processing' || order.status === 'confirmed' || order.status === 'pending') ? (
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                                            >
                                                <Truck size={13} /> Tạo Vận Đơn
                                            </button>
                                        ) : (
                                            <span className="text-[11px]" style={{ color: 'var(--adm-text-muted)' }}>—</span>
                                        )
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* ── Carrier Selection Modal ───────────────────────────────── */}
            <AnimatePresence>
                {selectedOrder && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedOrder(null)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md border rounded-2xl p-6 space-y-5 shadow-2xl"
                            style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                        >
                            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--adm-border)' }}>
                                <div>
                                    <h3 className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--adm-text)' }}>
                                        <Truck size={18} className="text-amber-500" />
                                        Tạo Vận Đơn Giao Hàng
                                    </h3>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                                        Đơn #{selectedOrder.id} • {selectedOrder.customerName || selectedOrder.name}
                                    </p>
                                </div>
                                <button onClick={() => setSelectedOrder(null)}
                                    className="w-8 h-8 rounded-full border flex items-center justify-center"
                                    style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' }}>
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Order Summary */}
                            <div className="p-3 rounded-xl border text-xs space-y-1"
                                style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                                <p className="flex items-start gap-1.5" style={{ color: 'var(--adm-text-muted)' }}>
                                    <MapPin size={12} className="text-amber-500 mt-0.5 shrink-0" />
                                    {selectedOrder.address}
                                </p>
                                <p className="font-bold" style={{ color: 'var(--adm-text)' }}>
                                    COD: {formatVND(selectedOrder.finalAmount || selectedOrder.totalAmount || 0)}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold" style={{ color: 'var(--adm-text-muted)' }}>
                                    Chọn Đơn Vị Vận Chuyển:
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {CARRIERS.map(c => (
                                        <button
                                            key={c.code}
                                            onClick={() => setSelectedCarrier(c.code)}
                                            className={`p-3 rounded-xl border text-left transition-all text-xs font-semibold ${
                                                selectedCarrier === c.code
                                                    ? 'bg-amber-50 border-amber-400 text-amber-800 shadow-sm'
                                                    : 'border'
                                            }`}
                                            style={selectedCarrier !== c.code ? { backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' } : {}}
                                        >
                                            <span className="text-base">{c.logo}</span>
                                            <p className="mt-1">{c.name}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => handleCreateWaybill(selectedOrder)}
                                disabled={submitting}
                                className="w-full h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 transition-all"
                            >
                                {submitting ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                Xác Nhận Tạo Vận Đơn & Trừ Tồn Kho
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Live Tracking Modal ───────────────────────────────────── */}
            <AnimatePresence>
                {trackingModal && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setTrackingModal(null)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto border rounded-2xl p-6 space-y-5 shadow-2xl"
                            style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                        >
                            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--adm-border)' }}>
                                <div>
                                    <h3 className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--adm-text)' }}>
                                        <Truck size={18} className="text-blue-500" />
                                        Live Tracking: {trackingModal.trackingNumber}
                                    </h3>
                                    <p className="text-xs font-semibold text-emerald-600 mt-0.5">{trackingModal.statusLabel}</p>
                                </div>
                                <button onClick={() => setTrackingModal(null)}
                                    className="w-8 h-8 rounded-full border flex items-center justify-center"
                                    style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' }}>
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-4 relative pl-5">
                                <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-gradient-to-b from-blue-300 to-transparent rounded-full" />
                                {trackingModal.timeline?.map((step: any, idx: number) => (
                                    <div key={idx} className="flex gap-3 text-xs relative">
                                        <div className="absolute -left-5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white mt-0.5 shadow-sm" />
                                        <div>
                                            <p className="font-semibold" style={{ color: 'var(--adm-text)' }}>{step.note}</p>
                                            <p className="text-[11px] mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                                                {step.location && `📍 ${step.location} • `}{step.time}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {(!trackingModal.timeline || trackingModal.timeline.length === 0) && (
                                    <p className="text-xs text-center py-4" style={{ color: 'var(--adm-text-muted)' }}>
                                        Chưa có lịch trình cập nhật
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
