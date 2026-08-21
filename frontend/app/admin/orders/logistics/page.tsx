'use client';
// ===== QUẢN LÝ VẬN ĐƠN & ĐƠN HÀNG LOGISTICS (CHUẨN DOANH NGHIỆP) =====
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Truck, Package, CheckCircle2, Clock, MapPin, Search,
    QrCode, ExternalLink, RefreshCw, X, ShieldAlert, ArrowRight,
    RotateCcw, AlertTriangle, ChevronRight, Filter, Eye, Phone,
    User, Calendar, DollarSign, Printer, ArrowUpRight, Check,
    Layers, ShoppingBag, Send
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface OrderItem {
    product: { id: string; name: string };
    selectedSize: string;
    selectedColor: { name: string };
    quantity: number;
    price?: number;
}

interface OrderData {
    id: string;
    customerName?: string;
    name?: string;
    phone: string;
    address: string;
    finalAmount?: number;
    totalAmount?: number;
    shippingFee?: number;
    discountAmount?: number;
    paymentMethod?: string;
    note?: string;
    status: string;
    carrierCode?: string;
    trackingNumber?: string;
    items: OrderItem[];
    createdAt?: string;
    returnRequest?: {
        status: string;
        reason: string;
        images?: string[];
        requestedAt?: string;
        reviewedAt?: string;
        reviewedBy?: string;
        rejectReason?: string;
    };
    shippingTimeline?: any[];
}

// ─── Status display map ───────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
    pending:              '⏳ Chờ xác nhận',
    confirmed:            '🔵 Đã xác nhận',
    processing:           '📦 Đang đóng gói',
    waiting_pickup:       '🚚 Chờ lấy hàng',
    picked_up:            '🚚 Đã lấy hàng',
    in_transit:           '🚚 Đang vận chuyển',
    out_for_delivery:     '🛵 Đang giao đến khách',
    shipped:              '🚚 Đang vận chuyển',
    delivered:            '✅ Giao thành công',
    completed:            '✅ Hoàn tất',
    awaiting_review:      '⭐ Chờ đánh giá',
    reviewed:             '⭐ Đã đánh giá',
    return_requested:     '⏳ Chờ duyệt hoàn',
    returning:            '🚚 Đang hoàn hàng',
    return_received:      '📦 Shop nhận hàng trả',
    refunded:             '💰 Đã hoàn tiền',
    cancelled:            '❌ Đã hủy',
    delivery_failed:      '⚠️ Giao hàng thất bại',
    returned_to_seller:   '↩️ Hoàn về shop',
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
    return_requested:     'bg-amber-100 text-amber-900 border-amber-300 font-bold',
    returning:            'bg-blue-50 text-blue-800 border-blue-200',
    return_received:      'bg-teal-50 text-teal-800 border-teal-200',
    refunded:             'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    cancelled:            'bg-slate-100 text-slate-600 border-slate-200',
    delivery_failed:      'bg-rose-50 text-rose-700 border-rose-200',
    returned_to_seller:   'bg-orange-50 text-orange-700 border-orange-200',
};

// Status filter tabs
const FILTER_TABS = [
    { id: 'all',              label: 'Tất cả đơn hàng' },
    { id: 'need_waybill',     label: '📦 Cần tạo vận đơn' },
    { id: 'in_transit',       label: '🚚 Đang vận chuyển' },
    { id: 'delivered',        label: '✅ Đã giao thành công' },
    { id: 'return_requested', label: '⏳ Chờ duyệt hoàn' },
    { id: 'returns',          label: '↩️ Đang hoàn / Đã hoàn' },
    { id: 'cancelled',        label: '❌ Đã hủy' },
];

const CARRIERS = [
    { code: 'GHN',         name: 'GHN Express',       logo: '🟠' },
    { code: 'GHTK',        name: 'GHTK Tiết Kiệm',    logo: '🟢' },
    { code: 'VIETTELPOST', name: 'Viettel Post',       logo: '🔴' },
    { code: 'VNPOST',      name: 'VNPost Bưu Điện',   logo: '🔵' },
];

export default function LogisticsManagementPage() {
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal chi tiết đơn hàng (Toàn diện, click vào bất kỳ đơn nào)
    const [viewingOrderDetail, setViewingOrderDetail] = useState<OrderData | null>(null);

    // Modal tạo vận đơn
    const [waybillOrder, setWaybillOrder] = useState<OrderData | null>(null);
    const [selectedCarrier, setSelectedCarrier] = useState('GHN');
    const [submittingWaybill, setSubmittingWaybill] = useState(false);

    // Modal tracking
    const [trackingModal, setTrackingModal] = useState<any>(null);

    // Search & Filter
    const [search, setSearch] = useState('');
    const [filterTab, setFilterTab] = useState('all');
    const [updatingStatus, setUpdatingStatus] = useState(false);

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

    const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Mới đây';
        return new Date(dateStr).toLocaleString('vi-VN', {
            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    // ─── CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG ─────────────────────────
    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        setUpdatingStatus(true);
        try {
            const res = await fetch('/api/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: orderId, status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`✅ Đã cập nhật trạng thái đơn thành "${STATUS_LABEL[newStatus] || newStatus}"`);
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
                if (viewingOrderDetail && viewingOrderDetail.id === orderId) {
                    setViewingOrderDetail(prev => prev ? { ...prev, status: newStatus } : null);
                }
            } else {
                toast.error(data.message || 'Lỗi cập nhật trạng thái');
            }
        } catch (e) {
            toast.error('Lỗi kết nối máy chủ');
        } finally {
            setUpdatingStatus(false);
        }
    };

    // ─── TẠO VẬN ĐƠN VẬN CHUYỂN ──────────────────────────────
    const handleCreateWaybill = async (order: OrderData) => {
        setSubmittingWaybill(true);
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
                if (viewingOrderDetail && viewingOrderDetail.id === order.id) {
                    setViewingOrderDetail(prev => prev ? {
                        ...prev,
                        status: 'waiting_pickup',
                        carrierCode: waybill.carrierCode,
                        trackingNumber: waybill.trackingNumber
                    } : null);
                }
                toast.success(`✅ Đã tạo vận đơn ${waybill.carrierName} thành công! Tracking: ${waybill.trackingNumber}`);
                setWaybillOrder(null);
            } else {
                throw new Error(data.message || 'Không thể tạo vận đơn');
            }
        } catch (err: any) {
            toast.error(err.message || 'Không thể tạo vận đơn');
        } finally {
            setSubmittingWaybill(false);
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

    const handleReviewReturn = async (orderId: string, action: 'approve' | 'reject') => {
        let rejectReason = '';
        if (action === 'reject') {
            const input = window.prompt('Nhập lý do từ chối yêu cầu hoàn hàng (tối thiểu 5 ký tự):');
            if (!input || input.trim().length < 5) {
                toast.error('Cần nhập lý do từ chối hợp lệ');
                return;
            }
            rejectReason = input.trim();
        }

        setUpdatingStatus(true);
        try {
            const res = await fetch(`/api/orders/return-request/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    rejectReason,
                    adminName: 'Admin WMS'
                })
            });
            const data = await res.json();
            if (data.success) {
                const newStatus = action === 'approve' ? 'returning' : 'delivered';
                toast.success(action === 'approve' ? '✅ Đã chấp thuận yêu cầu hoàn hàng! (Chờ khách gửi về)' : '❌ Đã từ chối yêu cầu hoàn hàng');
                setOrders(prev => prev.map(o => o.id === orderId ? {
                    ...o,
                    status: newStatus,
                    returnRequest: o.returnRequest ? {
                        ...o.returnRequest,
                        status: action === 'approve' ? 'approved' : 'rejected',
                        reviewedAt: new Date().toISOString(),
                        rejectReason
                    } : undefined
                } : o));
                if (viewingOrderDetail && viewingOrderDetail.id === orderId) {
                    setViewingOrderDetail(prev => prev ? {
                        ...prev,
                        status: newStatus,
                        returnRequest: prev.returnRequest ? {
                            ...prev.returnRequest,
                            status: action === 'approve' ? 'approved' : 'rejected',
                            reviewedAt: new Date().toISOString(),
                            rejectReason
                        } : undefined
                    } : null);
                }
            } else {
                toast.error(data.message || 'Lỗi xử lý yêu cầu hoàn');
            }
        } catch {
            toast.error('Lỗi kết nối máy chủ');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleConfirmRefund = async (orderId: string) => {
        if (!window.confirm('Xác nhận đã nhận đủ hàng và đã hoàn tiền thành công cho khách hàng?')) return;
        setUpdatingStatus(true);
        try {
            const res = await fetch(`/api/orders/return-received/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminName: 'Admin WMS' })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('💰 Đã xác nhận nhận hàng & hoàn tiền thành công!');
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'refunded' } : o));
                if (viewingOrderDetail && viewingOrderDetail.id === orderId) {
                    setViewingOrderDetail(prev => prev ? { ...prev, status: 'refunded' } : null);
                }
            } else {
                toast.error(data.message || 'Lỗi xác nhận hoàn tiền');
            }
        } catch {
            toast.error('Lỗi kết nối máy chủ');
        } finally {
            setUpdatingStatus(false);
        }
    };

    // Filter orders
    const filteredOrders = orders.filter(o => {
        const s = search.toLowerCase();
        const matchSearch =
            (o.id || '').toLowerCase().includes(s) ||
            (o.customerName || o.name || '').toLowerCase().includes(s) ||
            (o.phone || '').includes(s) ||
            (o.trackingNumber || '').toLowerCase().includes(s) ||
            (o.address || '').toLowerCase().includes(s);

        if (!matchSearch) return false;

        if (filterTab === 'need_waybill') {
            return !o.trackingNumber && ['pending', 'confirmed', 'processing'].includes(o.status);
        }
        if (filterTab === 'in_transit') {
            return ['waiting_pickup', 'picked_up', 'in_transit', 'out_for_delivery', 'shipped'].includes(o.status);
        }
        if (filterTab === 'delivered') {
            return ['delivered', 'completed', 'awaiting_review', 'reviewed'].includes(o.status);
        }
        if (filterTab === 'return_requested') {
            return o.status === 'return_requested';
        }
        if (filterTab === 'returns') {
            return ['returning', 'return_received', 'refunded', 'returned_to_seller'].includes(o.status);
        }
        if (filterTab === 'cancelled') {
            return o.status === 'cancelled';
        }
        return true;
    });

    return (
        <div className="space-y-6 pb-20">
            {/* ── HEADER QUẢN LÝ VẬN ĐƠN & ĐƠN HÀNG ── */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl border bg-white border-slate-200/90 shadow-2xs">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-slate-900 text-white shadow-xs">
                        <Truck size={22} />
                    </div>
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                            Quản Lý Đơn Hàng & Vận Đơn
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                                Logistics Hub
                            </span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Click trực tiếp vào đơn hàng để xem chi tiết, điều chỉnh trạng thái và tạo vận đơn GHN / GHTK / Viettel Post
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={fetchOrders}
                        className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                        Làm Mới
                    </button>
                </div>
            </div>

            {/* ── BỘ LỌC TABS & Ô TÌM KIẾM ── */}
            <div className="p-4 rounded-2xl border bg-white border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
                    {FILTER_TABS.map(tab => {
                        const isActive = filterTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setFilterTab(tab.id)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                    isActive
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="relative w-full sm:w-80">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm mã đơn, tên khách, SĐT, địa chỉ..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 outline-none"
                    />
                </div>
            </div>

            {/* ── DANH SÁCH ĐƠN HÀNG: 1 HÀNG 1 ĐƠN (CHUẨN DOANH NGHIỆP) ── */}
            <div className="space-y-3">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-28 rounded-2xl border border-slate-200 bg-white animate-pulse" />
                    ))
                ) : filteredOrders.length === 0 ? (
                    <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                        <Truck size={40} className="mx-auto mb-3 opacity-30 text-slate-600" />
                        <p className="font-bold text-slate-700 text-sm">Không tìm thấy đơn hàng nào</p>
                        <p className="text-xs text-slate-400 mt-1">Thử chuyển sang tab khác hoặc thay đổi từ khóa tìm kiếm</p>
                    </div>
                ) : (
                    filteredOrders.map((order, idx) => {
                        const totalMoney = order.finalAmount || order.totalAmount || 0;
                        const statusBadgeClass = STATUS_BADGE[order.status] || 'bg-slate-100 text-slate-600 border-slate-200';
                        const statusLabel = STATUS_LABEL[order.status] || order.status;

                        return (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.02 }}
                                onClick={() => setViewingOrderDetail(order)}
                                className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-400 hover:shadow-md transition-all cursor-pointer relative group"
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                                    {/* Cột 1: Mã Đơn & Khách Hàng (4 phần) */}
                                    <div className="lg:col-span-4 space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-black text-sm text-amber-600 group-hover:text-amber-700 transition-colors">
                                                {order.id}
                                            </span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase ${statusBadgeClass}`}>
                                                {statusLabel}
                                            </span>
                                        </div>

                                        <div>
                                            <p className="text-xs sm:text-sm font-bold text-slate-900">
                                                {order.customerName || order.name || 'Khách hàng'}
                                            </p>
                                            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                                                <Phone size={11} className="text-slate-400" />
                                                {order.phone}
                                            </p>
                                        </div>

                                        <p className="text-[11.5px] text-slate-500 flex items-start gap-1 line-clamp-1">
                                            <MapPin size={12} className="text-amber-500 shrink-0 mt-0.5" />
                                            <span>{order.address}</span>
                                        </p>
                                    </div>

                                    {/* Cột 2: Danh Sách Sản Phẩm (4 phần) */}
                                    <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-4 space-y-1.5 text-xs text-slate-700">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                            Sản phẩm ({order.items?.length || 0}):
                                        </p>
                                        {order.items?.slice(0, 2).map((it, iIdx) => (
                                            <div key={iIdx} className="flex justify-between items-center text-xs">
                                                <span className="line-clamp-1 font-medium text-slate-800 flex-1">
                                                    • {it.product?.name || 'Sản phẩm'}
                                                    {it.selectedColor?.name && ` (${it.selectedColor.name})`}
                                                    {it.selectedSize && ` / ${it.selectedSize}`}
                                                </span>
                                                <span className="font-bold ml-2 text-slate-900 shrink-0">×{it.quantity}</span>
                                            </div>
                                        ))}
                                        {order.items?.length > 2 && (
                                            <p className="text-[11px] font-bold text-slate-400">
                                                +{order.items.length - 2} sản phẩm khác...
                                            </p>
                                        )}
                                    </div>

                                    {/* Cột 3: Tổng Tiền & Nút Thao Tác (4 phần) */}
                                    <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-4 flex flex-col sm:flex-row lg:flex-col justify-between items-start sm:items-center lg:items-end gap-3">
                                        <div className="text-left lg:text-right">
                                            <span className="text-[10.5px] text-slate-400 block font-medium">Tổng thanh toán:</span>
                                            <p className="text-base font-black text-slate-950">
                                                {formatVND(totalMoney)}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            {/* Nút Xem Chi Tiết */}
                                            <button
                                                type="button"
                                                onClick={() => setViewingOrderDetail(order)}
                                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                                            >
                                                <Eye size={13} />
                                                <span>Chi Tiết</span>
                                            </button>

                                            {/* Nếu có tracking -> nút Tracking */}
                                            {order.trackingNumber ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleFetchTracking(order.trackingNumber!)}
                                                    className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                                >
                                                    <Truck size={13} />
                                                    <span>{order.carrierCode || 'Vận Đơn'}</span>
                                                </button>
                                            ) : (
                                                /* Chưa có tracking -> nút Tạo Vận Đơn */
                                                ['pending', 'confirmed', 'processing'].includes(order.status) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setWaybillOrder(order)}
                                                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                                                    >
                                                        <Truck size={13} />
                                                        <span>Tạo Vận Đơn</span>
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* ════════════ MODAL CHI TIẾT ĐƠN HÀNG CHUẨN DOANH NGHIỆP (TO, RÕ, ĐẦY ĐỦ THAO TÁC) ════════════ */}
            <AnimatePresence>
                {viewingOrderDetail && (
                    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
                        >
                            {/* Header modal */}
                            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                                        <ShoppingBag size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-base sm:text-lg font-black text-slate-950 font-mono">
                                                Đơn Hàng: #{viewingOrderDetail.id}
                                            </h2>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border uppercase ${STATUS_BADGE[viewingOrderDetail.status] || 'bg-slate-100 text-slate-600'}`}>
                                                {STATUS_LABEL[viewingOrderDetail.status] || viewingOrderDetail.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Ngày tạo: {formatDate(viewingOrderDetail.createdAt)}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setViewingOrderDetail(null)}
                                    className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body Modal (Scrollable) */}
                            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                                {/* Thao tác cập nhật trạng thái nhanh & chuẩn Doanh Nghiệp */}
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                            <Layers size={13} className="text-indigo-600" />
                                            Cập Nhật Trạng Thái Đơn Hàng:
                                        </label>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase ${STATUS_BADGE[viewingOrderDetail.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                            {STATUS_LABEL[viewingOrderDetail.status] || viewingOrderDetail.status}
                                        </span>
                                    </div>

                                    {/* Nhóm 1: Tiến trình giao hàng */}
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tiến Trình Giao Hàng:</p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {[
                                                { val: 'pending',    label: '⏳ Chờ xác nhận' },
                                                { val: 'confirmed',  label: '🔵 Đã xác nhận' },
                                                { val: 'processing', label: '📦 Đang đóng gói' },
                                                { val: 'shipped',    label: '🚚 Đang vận chuyển' },
                                                { val: 'delivered',  label: '✅ Giao thành công' },
                                                { val: 'cancelled',  label: '❌ Hủy đơn hàng' },
                                            ].map(st => {
                                                const isDelivered = viewingOrderDetail.status === 'delivered' || viewingOrderDetail.status === 'completed';
                                                const isCancelled = viewingOrderDetail.status === 'cancelled';
                                                const cannotCancel = isDelivered && st.val === 'cancelled';
                                                const cannotAdvance = isCancelled && st.val !== 'cancelled';
                                                const isDisabled = updatingStatus || cannotCancel || cannotAdvance;

                                                return (
                                                <button
                                                    key={st.val}
                                                    type="button"
                                                    disabled={isDisabled}
                                                    onClick={() => handleUpdateStatus(viewingOrderDetail.id, st.val)}
                                                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                                                        isDisabled ? 'opacity-40 cursor-not-allowed grayscale' : ''
                                                    } ${
                                                        viewingOrderDetail.status === st.val
                                                            ? 'bg-slate-900 text-white shadow-xs'
                                                            : !isDisabled ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-slate-50 border border-slate-200 text-slate-400'
                                                    }`}
                                                >
                                                    {st.label}
                                                </button>
                                            )})}
                                        </div>
                                    </div>

                                    {/* Nhóm 2: Tiến trình hoàn tiền / đổi trả */}
                                    <div className="pt-2.5 border-t border-slate-200/60 space-y-1.5">
                                        <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                                            <RotateCcw size={11} /> Tiến Trình Trả Hàng & Hoàn Tiền:
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {[
                                                { val: 'return_requested', label: '⏳ Chờ duyệt hoàn' },
                                                { val: 'returning',        label: '🚚 Đang gửi trả' },
                                                { val: 'return_received',  label: '📦 Shop đã nhận hàng trả' },
                                                { val: 'refunded',         label: '💰 Đã hoàn tiền' },
                                            ].map(st => (
                                                <button
                                                    key={st.val}
                                                    type="button"
                                                    disabled={updatingStatus}
                                                    onClick={() => handleUpdateStatus(viewingOrderDetail.id, st.val)}
                                                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                                                        viewingOrderDetail.status === st.val
                                                            ? 'bg-amber-600 text-white shadow-xs'
                                                            : 'bg-white border border-amber-200 text-amber-800 hover:bg-amber-50'
                                                    }`}
                                                >
                                                    {st.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Hồ Sơ Yêu Cầu Trả Hàng / Hoàn Tiền nếu có */}
                                {(viewingOrderDetail.returnRequest || ['return_requested', 'returning', 'return_received', 'refunded'].includes(viewingOrderDetail.status)) && (
                                    <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                                        <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                                            <h4 className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                                                <ShieldAlert size={15} className="text-amber-600" />
                                                Hồ Sơ Yêu Cầu Trả Hàng / Hoàn Tiền
                                            </h4>
                                            <span className="text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-amber-200/70 text-amber-900">
                                                {viewingOrderDetail.returnRequest?.status === 'pending' ? '⏳ Chờ Admin xét duyệt' :
                                                 viewingOrderDetail.returnRequest?.status === 'approved' ? '✅ Đã chấp thuận' :
                                                 viewingOrderDetail.returnRequest?.status === 'rejected' ? '❌ Đã từ chối' : 'Yêu cầu hoàn'}
                                            </span>
                                        </div>

                                        <div className="space-y-1 text-xs text-amber-950">
                                            <p><span className="font-bold text-amber-800">Lý do khách gửi:</span> {viewingOrderDetail.returnRequest?.reason || 'Khách yêu cầu hoàn hàng'}</p>
                                            {viewingOrderDetail.returnRequest?.requestedAt && (
                                                <p className="text-[11px] text-amber-700">Thời gian yêu cầu: {formatDate(viewingOrderDetail.returnRequest.requestedAt)}</p>
                                            )}
                                            {viewingOrderDetail.returnRequest?.rejectReason && (
                                                <p className="text-[11px] text-rose-700 font-semibold">Lý do từ chối: {viewingOrderDetail.returnRequest.rejectReason}</p>
                                            )}
                                        </div>

                                        {/* Ảnh bằng chứng khách gửi */}
                                        {viewingOrderDetail.returnRequest?.images && viewingOrderDetail.returnRequest.images.length > 0 && (
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-bold text-amber-900">Ảnh bằng chứng khách gửi ({viewingOrderDetail.returnRequest.images.length}):</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {viewingOrderDetail.returnRequest.images.map((img, i) => (
                                                        <a key={i} href={img} target="_blank" rel="noreferrer" className="w-16 h-16 rounded-xl overflow-hidden border border-amber-200 hover:scale-105 transition-transform block bg-white">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Nút hành động nhanh theo quy trình */}
                                        <div className="pt-2 border-t border-amber-200/60 flex flex-wrap items-center gap-2">
                                            {viewingOrderDetail.status === 'return_requested' && (
                                                <>
                                                    <button
                                                        type="button"
                                                        disabled={updatingStatus}
                                                        onClick={() => handleReviewReturn(viewingOrderDetail.id, 'approve')}
                                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                                                    >
                                                        <Check size={14} /> Chấp Thuận Hoàn Hàng (Cho phép gửi về)
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={updatingStatus}
                                                        onClick={() => handleReviewReturn(viewingOrderDetail.id, 'reject')}
                                                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                                                    >
                                                        <X size={14} /> Từ Chối Yêu Cầu
                                                    </button>
                                                </>
                                            )}
                                            {viewingOrderDetail.status === 'returning' && (
                                                <button
                                                    type="button"
                                                    disabled={updatingStatus}
                                                    onClick={() => handleUpdateStatus(viewingOrderDetail.id, 'return_received')}
                                                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                                                >
                                                    <Package size={14} /> Xác Nhận Đã Nhận Hàng Trả Về Kho
                                                </button>
                                            )}
                                            {viewingOrderDetail.status === 'return_received' && (
                                                <button
                                                    type="button"
                                                    disabled={updatingStatus}
                                                    onClick={() => handleConfirmRefund(viewingOrderDetail.id)}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                                                >
                                                    <DollarSign size={14} /> Xác Nhận Đã Hoàn Tiền Thành Công
                                                </button>
                                            )}
                                            {viewingOrderDetail.status === 'refunded' && (
                                                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                                    <CheckCircle2 size={15} /> Đã hoàn tất hoàn tiền & xử lý đơn hàng.
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Thông tin khách hàng & Vận chuyển */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Khách hàng */}
                                    <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                                        <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-2 border-b border-slate-100 flex items-center gap-1.5">
                                            <User size={14} className="text-slate-500" />
                                            Thông Tin Người Nhận
                                        </h4>
                                        <p className="text-sm font-black text-slate-900">
                                            {viewingOrderDetail.customerName || viewingOrderDetail.name || 'Khách hàng'}
                                        </p>
                                        <p className="font-bold text-slate-600 flex items-center gap-1">
                                            <Phone size={12} className="text-slate-400" />
                                            {viewingOrderDetail.phone}
                                        </p>
                                        <p className="text-slate-600 flex items-start gap-1">
                                            <MapPin size={13} className="text-amber-500 shrink-0 mt-0.5" />
                                            <span>{viewingOrderDetail.address}</span>
                                        </p>
                                    </div>

                                    {/* Vận chuyển & Thanh toán */}
                                    <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                                        <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-2 border-b border-slate-100 flex items-center gap-1.5">
                                            <Truck size={14} className="text-blue-600" />
                                            Vận Chuyển & Thanh Toán
                                        </h4>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Hình thức thanh toán:</span>
                                            <span className="font-bold text-slate-900 uppercase">{viewingOrderDetail.paymentMethod || 'COD (Tiền mặt)'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Đối tác vận chuyển:</span>
                                            <span className="font-bold text-blue-700">{viewingOrderDetail.carrierCode || 'Chưa gán'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500">Mã vận đơn:</span>
                                            {viewingOrderDetail.trackingNumber ? (
                                                <button
                                                    onClick={() => handleFetchTracking(viewingOrderDetail.trackingNumber!)}
                                                    className="font-mono font-bold text-blue-600 underline flex items-center gap-1"
                                                >
                                                    {viewingOrderDetail.trackingNumber}
                                                    <ExternalLink size={11} />
                                                </button>
                                            ) : (
                                                <span className="text-slate-400 italic">Chưa tạo vận đơn</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Chi tiết sản phẩm trong đơn */}
                                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                    <div className="p-3.5 bg-slate-50/80 border-b border-slate-100 font-bold text-[11px] uppercase tracking-wider text-slate-700">
                                        Danh Sách Sản Phẩm Đặt Mua ({viewingOrderDetail.items?.length || 0})
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-100 text-[10.5px] font-bold text-slate-500 bg-slate-50/40">
                                                    <th className="py-2.5 px-4">Sản phẩm</th>
                                                    <th className="py-2.5 px-3">Phân loại</th>
                                                    <th className="py-2.5 px-3 text-center">Số lượng</th>
                                                    <th className="py-2.5 px-4 text-right">Đơn giá</th>
                                                    <th className="py-2.5 px-4 text-right">Thành tiền</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                                                {viewingOrderDetail.items?.map((it, idx) => {
                                                    const price = it.price || Math.round((viewingOrderDetail.finalAmount || viewingOrderDetail.totalAmount || 0) / (viewingOrderDetail.items.length || 1));
                                                    return (
                                                        <tr key={idx} className="hover:bg-slate-50/60">
                                                            <td className="py-3 px-4 font-bold text-slate-900">
                                                                {it.product?.name || 'Sản phẩm HAVEN'}
                                                            </td>
                                                            <td className="py-3 px-3 text-slate-600">
                                                                Màu: <strong>{it.selectedColor?.name || 'Tiêu chuẩn'}</strong> · Size: <strong>{it.selectedSize || 'F'}</strong>
                                                            </td>
                                                            <td className="py-3 px-3 text-center font-black text-slate-900">
                                                                ×{it.quantity}
                                                            </td>
                                                            <td className="py-3 px-4 text-right text-slate-600">
                                                                {formatVND(price)}
                                                            </td>
                                                            <td className="py-3 px-4 text-right font-black text-slate-900">
                                                                {formatVND(price * it.quantity)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Tổng kết tiền */}
                                    <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex flex-col items-end space-y-1 text-xs">
                                        <div className="flex justify-between w-64 text-slate-600">
                                            <span>Tổng tiền hàng:</span>
                                            <span className="font-bold text-slate-900">
                                                {formatVND(viewingOrderDetail.totalAmount || viewingOrderDetail.finalAmount || 0)}
                                            </span>
                                        </div>
                                        {viewingOrderDetail.discountAmount ? (
                                            <div className="flex justify-between w-64 text-emerald-600">
                                                <span>Giảm giá:</span>
                                                <span className="font-bold">-{formatVND(viewingOrderDetail.discountAmount)}</span>
                                            </div>
                                        ) : null}
                                        <div className="flex justify-between w-64 text-slate-600">
                                            <span>Phí vận chuyển:</span>
                                            <span className="font-bold text-slate-900">
                                                {viewingOrderDetail.shippingFee ? formatVND(viewingOrderDetail.shippingFee) : '0đ (Freeship)'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between w-64 pt-2 border-t border-slate-200 text-sm font-black text-slate-950">
                                            <span>Tổng thanh toán:</span>
                                            <span className="text-base text-amber-600">
                                                {formatVND(viewingOrderDetail.finalAmount || viewingOrderDetail.totalAmount || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Modal */}
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                >
                                    <Printer size={14} /> In Đơn Hàng
                                </button>

                                <div className="flex items-center gap-2">
                                    {!viewingOrderDetail.trackingNumber && ['pending', 'confirmed', 'processing'].includes(viewingOrderDetail.status) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setWaybillOrder(viewingOrderDetail);
                                            }}
                                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                                        >
                                            <Truck size={14} /> Tạo Vận Đơn Đối Tác
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => setViewingOrderDetail(null)}
                                        className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                                    >
                                        Đóng
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ════════════ MODAL TẠO VẬN ĐƠN ════════════ */}
            <AnimatePresence>
                {waybillOrder && (
                    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-5"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                        <Truck size={16} className="text-amber-500" />
                                        Tạo Vận Đơn Giao Hàng
                                    </h3>
                                    <p className="text-[11px] text-slate-500 mt-0.5">Mã đơn: {waybillOrder.id}</p>
                                </div>
                                <button onClick={() => setWaybillOrder(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-3 text-xs">
                                <label className="block font-bold text-slate-700">Chọn Đối Tác Vận Chuyển:</label>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {CARRIERS.map(c => (
                                        <button
                                            key={c.code}
                                            type="button"
                                            onClick={() => setSelectedCarrier(c.code)}
                                            className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                                                selectedCarrier === c.code 
                                                    ? 'border-slate-900 bg-slate-50 shadow-xs' 
                                                    : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <span className="text-lg">{c.logo}</span>
                                            <div>
                                                <p className="font-bold text-slate-900 text-xs">{c.name}</p>
                                                <p className="text-[10px] text-slate-400">{c.code}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Khách nhận:</span>
                                        <span className="font-bold text-slate-900">{waybillOrder.customerName || waybillOrder.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">SĐT:</span>
                                        <span className="font-bold text-slate-900">{waybillOrder.phone}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Tiền thu hộ (COD):</span>
                                        <span className="font-bold text-amber-600">{formatVND(waybillOrder.finalAmount || waybillOrder.totalAmount || 0)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setWaybillOrder(null)}
                                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    disabled={submittingWaybill}
                                    onClick={() => handleCreateWaybill(waybillOrder)}
                                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    {submittingWaybill ? 'Đang tạo...' : 'Xác Nhận Đẩy Vận Đơn'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ════════════ MODAL TRA CỨU TRACKING TIMELINE ════════════ */}
            <AnimatePresence>
                {trackingModal && (
                    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                        <Truck size={16} className="text-blue-600" />
                                        Hành Trình Giao Hàng
                                    </h3>
                                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">{trackingModal.trackingNumber}</p>
                                </div>
                                <button onClick={() => setTrackingModal(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 text-xs">
                                {(trackingModal.events || []).map((ev: any, idx: number) => (
                                    <div key={idx} className="flex items-start gap-3 relative">
                                        <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${idx === 0 ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-slate-300'}`} />
                                        <div>
                                            <p className="font-bold text-slate-900">{ev.statusText || ev.status}</p>
                                            <p className="text-[11px] text-slate-500">{ev.location}</p>
                                            <p className="text-[10px] text-slate-400">{formatDate(ev.timestamp)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button
                                    onClick={() => setTrackingModal(null)}
                                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
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
