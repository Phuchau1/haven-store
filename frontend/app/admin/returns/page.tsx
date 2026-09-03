'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
    RotateCcw, Search, CheckCircle2, XCircle, Clock, 
    Eye, AlertCircle, RefreshCw, Image as ImageIcon,
    Check, X, Truck, Package, Building2, MapPin, Copy, ExternalLink,
    User, Phone, Mail, FileText, ChevronRight
} from 'lucide-react';
import Image from 'next/image';

interface OrderItem {
    product: {
        id: string;
        name: string;
        price: number;
        images?: string[];
    };
    quantity: number;
    selectedSize: string;
    selectedColor: { name: string; hex: string };
}

interface ReturnRequestData {
    status: 'pending' | 'approved' | 'rejected' | 'returning' | 'refunded' | 'none';
    returnType?: 'return_and_refund' | 'refund_only';
    returnItems?: {
        productId?: string;
        name?: string;
        image?: string;
        size?: string;
        color?: string;
        quantity?: number;
        price?: number;
        refundAmount?: number;
    }[];
    reason: string;
    customReason?: string;
    description?: string;
    images?: string[];
    videoUrl?: string;
    estimatedRefundAmount?: number;
    refundMethod?: 'wallet' | 'original' | 'bank_transfer';
    bankInfo?: {
        bankName?: string;
        accountNumber?: string;
        accountHolder?: string;
    };
    warehouseAddress?: string;
    requestedAt?: string;
    reviewDeadline?: string;
    reviewedAt?: string;
    reviewedBy?: string;
    rejectReason?: string;
    shippingDeadline?: string;
    returnTrackingNumber?: string;
    returnCarrier?: string;
    returnShippedAt?: string;
    returnReceivedAt?: string;
    inspectionStatus?: 'pending' | 'passed' | 'failed';
    inspectionNote?: string;
    refundDeadline?: string;
    refundedAt?: string;
    refundAmount?: number;
}

interface OrderData {
    _id: string;
    id: string;
    customerName: string;
    phone: string;
    email: string;
    address: string;
    items: OrderItem[];
    totalAmount: number;
    finalAmount: number;
    paymentMethod?: string;
    status: string;
    returnRequest?: ReturnRequestData;
    createdAt: string;
}

export default function AdminReturnsPage() {
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'returning' | 'refunded' | 'rejected'>('pending');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Process Modal State
    const [activeOrder, setActiveOrder] = useState<OrderData | null>(null);
    const [modalMode, setModalMode] = useState<'review' | 'inspect' | 'view'>('review');
    
    // Decision form inside modal
    const [selectedDecision, setSelectedDecision] = useState<'approve_ship' | 'instant_refund' | 'reject'>('approve_ship');
    const [warehouseAddress, setWarehouseAddress] = useState('Kho Tổng HAVEN - 123 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP. Hồ Chí Minh (Hotline: 1900 6868)');
    const [customRefundAmount, setCustomRefundAmount] = useState<number>(0);
    const [rejectReason, setRejectReason] = useState('');
    const [inspectionResult, setInspectionResult] = useState<'passed' | 'failed'>('passed');
    const [inspectionNote, setInspectionNote] = useState('');
    
    const [submitting, setSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        returning: 0,
        refunded: 0
    });

    const fetchReturns = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/orders/returns?status=${filterStatus}`);
            const data = await res.json();
            if (data.success) {
                setOrders(data.orders || []);
                if (data.stats) setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching returns:', error);
            showToast('Không thể tải danh sách đơn hoàn', 'error');
        } finally {
            setLoading(false);
        }
    }, [filterStatus]);

    useEffect(() => {
        fetchReturns();
    }, [fetchReturns]);

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 3500);
    };

    const handleOpenProcess = (order: OrderData, mode: 'review' | 'inspect' | 'view') => {
        setActiveOrder(order);
        setModalMode(mode);
        const req = order.returnRequest;
        const defaultAmt = req?.estimatedRefundAmount || req?.refundAmount || order.finalAmount || order.totalAmount || 0;
        setCustomRefundAmount(defaultAmt);
        setRejectReason('');
        setInspectionNote('');
        setInspectionResult('passed');
        setWarehouseAddress(req?.warehouseAddress || 'Kho Tổng HAVEN - 123 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP. Hồ Chí Minh (Hotline: 1900 6868)');
        
        if (req?.returnType === 'refund_only') {
            setSelectedDecision('instant_refund');
        } else {
            setSelectedDecision('approve_ship');
        }
    };

    const handleSubmitDecision = async () => {
        if (!activeOrder) return;

        if (modalMode === 'review') {
            if (selectedDecision === 'reject' && (!rejectReason || rejectReason.trim().length < 5)) {
                showToast('Vui lòng nhập lý do từ chối chi tiết (tối thiểu 5 ký tự)', 'error');
                return;
            }

            setSubmitting(true);
            try {
                const isInstant = selectedDecision === 'instant_refund';
                const action = selectedDecision === 'reject' ? 'reject' : 'approve';

                const res = await fetch(`/api/orders/return-request/${activeOrder.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action,
                        instantRefund: isInstant,
                        rejectReason: rejectReason.trim(),
                        warehouseAddress: warehouseAddress.trim(),
                        customRefundAmount,
                        adminName: 'Admin'
                    })
                });

                const data = await res.json();
                if (data.success) {
                    showToast(data.message || 'Cập nhật trạng thái thành công!', 'success');
                    setActiveOrder(null);
                    fetchReturns();
                } else {
                    showToast(data.message || 'Xử lý thất bại', 'error');
                }
            } catch {
                showToast('Lỗi kết nối máy chủ', 'error');
            } finally {
                setSubmitting(false);
            }
        } else if (modalMode === 'inspect') {
            if (inspectionResult === 'failed' && (!inspectionNote || inspectionNote.trim().length < 5)) {
                showToast('Vui lòng nhập lý do kiện hàng không đạt (tối thiểu 5 ký tự)', 'error');
                return;
            }

            setSubmitting(true);
            try {
                const res = await fetch(`/api/orders/return-received/${activeOrder.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        inspectionResult,
                        inspectionNote: inspectionNote.trim(),
                        customRefundAmount,
                        adminName: 'Admin'
                    })
                });

                const data = await res.json();
                if (data.success) {
                    showToast(data.message || 'Đã hoàn tất kiểm tra kiện hàng!', 'success');
                    setActiveOrder(null);
                    fetchReturns();
                } else {
                    showToast(data.message || 'Xử lý thất bại', 'error');
                }
            } catch {
                showToast('Lỗi kết nối máy chủ', 'error');
            } finally {
                setSubmitting(false);
            }
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast(`Đã sao chép: ${text}`, 'success');
    };

    const filteredOrders = orders.filter(o => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            o.id.toLowerCase().includes(q) ||
            o.customerName.toLowerCase().includes(q) ||
            o.phone.includes(q) ||
            (o.returnRequest?.reason || '').toLowerCase().includes(q) ||
            (o.returnRequest?.returnTrackingNumber || '').toLowerCase().includes(q)
        );
    });

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-800">
            {/* Toast Notification */}
            {toastMessage && (
                <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-semibold transition-all ${
                    toastMessage.type === 'success' 
                    ? 'bg-emerald-900 text-white border-emerald-700' 
                    : 'bg-rose-900 text-white border-rose-700'
                }`}>
                    {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                    <span>{toastMessage.text}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        Quản lý đổi trả & hoàn tiền
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-1">
                        Theo dõi, xét duyệt và xử lý các yêu cầu trả hàng, hoàn tiền từ khách hàng
                    </p>
                </div>
                <button
                    onClick={fetchReturns}
                    className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors border border-slate-300 shadow-2xs w-fit cursor-pointer"
                >
                    <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                    <span>Làm mới</span>
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                <div 
                    onClick={() => setFilterStatus('all')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        filterStatus === 'all' 
                            ? 'bg-white border-slate-900 ring-2 ring-slate-900/10 shadow-xs' 
                            : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                >
                    <div className="text-slate-500 text-xs font-medium">Tất cả yêu cầu</div>
                    <div className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</div>
                </div>

                <div 
                    onClick={() => setFilterStatus('pending')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        filterStatus === 'pending' 
                            ? 'bg-amber-50/60 border-amber-500 ring-2 ring-amber-500/20 shadow-xs' 
                            : 'bg-white border-slate-200 hover:border-amber-300'
                    }`}
                >
                    <div className="flex items-center justify-between text-amber-800 text-xs font-medium">
                        <span>Chờ duyệt</span>
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div className="text-2xl font-bold text-amber-900 mt-2">{stats.pending}</div>
                </div>

                <div 
                    onClick={() => setFilterStatus('returning')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        filterStatus === 'returning' 
                            ? 'bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/20 shadow-xs' 
                            : 'bg-white border-slate-200 hover:border-blue-300'
                    }`}
                >
                    <div className="flex items-center justify-between text-blue-800 text-xs font-medium">
                        <span>Đang gửi hàng</span>
                        <Truck className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-900 mt-2">{(stats as any).returning || 0}</div>
                </div>

                <div 
                    onClick={() => setFilterStatus('refunded')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        filterStatus === 'refunded' 
                            ? 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs' 
                            : 'bg-white border-slate-200 hover:border-emerald-300'
                    }`}
                >
                    <div className="flex items-center justify-between text-emerald-800 text-xs font-medium">
                        <span>Đã hoàn tiền</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-900 mt-2">{stats.refunded || 0}</div>
                </div>

                <div 
                    onClick={() => setFilterStatus('rejected')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        filterStatus === 'rejected' 
                            ? 'bg-rose-50/60 border-rose-500 ring-2 ring-rose-500/20 shadow-xs' 
                            : 'bg-white border-slate-200 hover:border-rose-300'
                    }`}
                >
                    <div className="flex items-center justify-between text-rose-800 text-xs font-medium">
                        <span>Đã từ chối</span>
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    </div>
                    <div className="text-2xl font-bold text-rose-900 mt-2">{stats.rejected}</div>
                </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="flex gap-1.5 w-full md:w-auto overflow-x-auto no-scrollbar">
                    {[
                        { id: 'pending', label: `Chờ duyệt (${stats.pending})` },
                        { id: 'returning', label: `Đang gửi hàng (${(stats as any).returning || 0})` },
                        { id: 'approved', label: `Đã duyệt (${stats.approved})` },
                        { id: 'refunded', label: `Đã hoàn tiền (${stats.refunded || 0})` },
                        { id: 'rejected', label: `Từ chối (${stats.rejected})` },
                        { id: 'all', label: `Tất cả (${stats.total})` }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterStatus(tab.id as any)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                                filterStatus === tab.id
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm mã đơn, tên khách, số điện thoại..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-slate-400"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                                <th className="p-3.5">Mã đơn</th>
                                <th className="p-3.5">Khách hàng</th>
                                <th className="p-3.5">Sản phẩm & Lý do</th>
                                <th className="p-3.5">Mã vận đơn gửi</th>
                                <th className="p-3.5">Số tiền hoàn</th>
                                <th className="p-3.5">Hạn xử lý</th>
                                <th className="p-3.5">Trạng thái</th>
                                <th className="p-3.5 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="p-10 text-center text-slate-400">
                                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-500" />
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-10 text-center text-slate-400">
                                        <RotateCcw className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                                        Không có yêu cầu hoàn hàng nào
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => {
                                    const req = order.returnRequest;
                                    const isRefunded = order.status === 'refunded' || req?.status === 'refunded' || !!req?.refundedAt;
                                    const isReturning = !isRefunded && (order.status === 'returning' || req?.status === 'returning');
                                    const isRejected = !isRefunded && req?.status === 'rejected';
                                    const isPending = !isRefunded && !isReturning && !isRejected && (req?.status === 'pending' || order.status === 'return_requested');
                                    const isApproved = !isRefunded && !isReturning && !isRejected && !isPending && req?.status === 'approved';
                                    const isRefundOnly = req?.returnType === 'refund_only';
                                    const refundAmt = req?.estimatedRefundAmount || req?.refundAmount || order.finalAmount || order.totalAmount || 0;

                                    return (
                                        <tr key={order._id || order.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="p-3.5">
                                                <span className="font-bold text-slate-900 font-mono text-xs block">
                                                    #{order.id}
                                                </span>
                                                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                                    isRefundOnly 
                                                        ? 'bg-amber-50 text-amber-800 border-amber-200' 
                                                        : 'bg-slate-100 text-slate-700 border-slate-200'
                                                }`}>
                                                    {isRefundOnly ? 'Chỉ hoàn tiền' : 'Trả hàng & hoàn tiền'}
                                                </span>
                                            </td>

                                            <td className="p-3.5">
                                                <div className="font-semibold text-slate-900">{order.customerName}</div>
                                                <div className="text-[11px] text-slate-500">{order.phone}</div>
                                            </td>

                                            <td className="p-3.5 max-w-xs">
                                                <div className="font-medium text-slate-800 truncate" title={req?.reason}>
                                                    {req?.reason || '—'}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {req?.returnItems && req.returnItems.length > 0 && (
                                                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                                                            {req.returnItems.length} SP
                                                        </span>
                                                    )}
                                                    {req?.images && req.images.length > 0 && (
                                                        <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                                                            <ImageIcon size={11} /> {req.images.length} ảnh
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="p-3.5">
                                                {req?.returnTrackingNumber ? (
                                                    <div>
                                                        <button 
                                                            onClick={() => copyToClipboard(req.returnTrackingNumber!)}
                                                            className="font-mono font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200 text-[11px] flex items-center gap-1 cursor-pointer"
                                                            title="Bấm để sao chép"
                                                        >
                                                            {req.returnTrackingNumber} <Copy size={10} />
                                                        </button>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">{req.returnCarrier || 'Chuyển phát'}</p>
                                                    </div>
                                                ) : isReturning ? (
                                                    <span className="text-[11px] text-amber-700 italic">Chờ khách gửi</span>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>

                                            <td className="p-3.5 font-bold text-slate-900 text-xs">
                                                {refundAmt.toLocaleString('vi-VN')} đ
                                            </td>

                                            <td className="p-3.5 text-slate-600">
                                                {isPending && req?.reviewDeadline ? (
                                                    <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1 font-medium">
                                                        <Clock size={11} />
                                                        {new Date(req.reviewDeadline).toLocaleDateString('vi-VN')}
                                                    </span>
                                                ) : isReturning && req?.shippingDeadline ? (
                                                    <span className="text-[11px] text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-flex items-center gap-1 font-medium">
                                                        <Truck size={11} />
                                                        {new Date(req.shippingDeadline).toLocaleDateString('vi-VN')}
                                                    </span>
                                                ) : req?.requestedAt ? (
                                                    new Date(req.requestedAt).toLocaleDateString('vi-VN')
                                                ) : '—'}
                                            </td>

                                            <td className="p-3.5">
                                                {isPending && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                                        <Clock className="w-3 h-3" /> Chờ duyệt
                                                    </span>
                                                )}
                                                {isReturning && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                                                        <Truck className="w-3 h-3" /> Đang gửi hàng
                                                    </span>
                                                )}
                                                {isRefunded && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                        <CheckCircle2 className="w-3 h-3" /> Đã hoàn tiền
                                                    </span>
                                                )}
                                                {isApproved && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                                                        <CheckCircle2 className="w-3 h-3" /> Đã duyệt
                                                    </span>
                                                )}
                                                {isRejected && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                                                        <XCircle className="w-3 h-3" /> Từ chối
                                                    </span>
                                                )}
                                            </td>

                                            <td className="p-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => handleOpenProcess(order, 'view')}
                                                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                                                    >
                                                        Xem
                                                    </button>

                                                    {isPending && (
                                                        <button
                                                            onClick={() => handleOpenProcess(order, 'review')}
                                                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
                                                        >
                                                            Xử lý
                                                        </button>
                                                    )}

                                                    {isReturning && (
                                                        <button
                                                            onClick={() => handleOpenProcess(order, 'inspect')}
                                                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
                                                        >
                                                            Kiểm hàng
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════════════════════
                ADMIN PROCESS MODAL (Giao diện chuẩn e-commerce thanh lịch)
            ════════════════════════════════════════════════════════════════════════════════ */}
            {activeOrder && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-xl border border-slate-200 overflow-hidden my-auto">
                        
                        {/* ── HEADER ── */}
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
                            <div>
                                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                    <span>
                                        {modalMode === 'review' && 'Xử lý yêu cầu hoàn hàng'}
                                        {modalMode === 'inspect' && 'Kiểm tra kiện hàng hoàn về'}
                                        {modalMode === 'view' && 'Chi tiết yêu cầu hoàn hàng'}
                                    </span>
                                    <span className="font-mono text-slate-600">#{activeOrder.id}</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Khách hàng: <strong>{activeOrder.customerName}</strong> ({activeOrder.phone}) · Đặt ngày {new Date(activeOrder.createdAt).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                            <button
                                onClick={() => setActiveOrder(null)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* ── BODY ── */}
                        <div className="p-6 space-y-5 overflow-y-auto flex-1">

                            {/* THÔNG TIN CHUNG */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                                    <div className="font-bold text-slate-700 uppercase tracking-wide text-[11px]">Thông tin giao nhận</div>
                                    <p className="text-slate-600">Người nhận: <strong className="text-slate-800">{activeOrder.customerName}</strong></p>
                                    <p className="text-slate-600">Điện thoại: <strong className="text-slate-800">{activeOrder.phone}</strong></p>
                                    <p className="text-slate-600">Địa chỉ: <span className="text-slate-800">{activeOrder.address}</span></p>
                                    <p className="text-slate-600">Thanh toán: <strong className="text-slate-800 uppercase">{activeOrder.paymentMethod || 'COD'}</strong></p>
                                </div>

                                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                                    <div className="font-bold text-slate-700 uppercase tracking-wide text-[11px]">Hình thức hoàn tiền</div>
                                    <p className="text-slate-600">Lựa chọn của khách: <strong className="text-slate-800">
                                        {activeOrder.returnRequest?.returnType === 'refund_only' ? 'Chỉ hoàn tiền (Không gửi hàng)' : 'Trả hàng & hoàn tiền'}
                                    </strong></p>
                                    <p className="text-slate-600">Nhận qua: <strong className="text-slate-800">
                                        {activeOrder.returnRequest?.refundMethod === 'wallet' && 'Ví HAVEN Pay'}
                                        {activeOrder.returnRequest?.refundMethod === 'original' && 'Cổng thanh toán ban đầu'}
                                        {activeOrder.returnRequest?.refundMethod === 'bank_transfer' && 'Tài khoản ngân hàng'}
                                    </strong></p>
                                    {activeOrder.returnRequest?.bankInfo?.accountNumber && (
                                        <p className="text-slate-700 font-mono text-[11px] pt-1">
                                            Ngân hàng: <strong>{activeOrder.returnRequest.bankInfo.bankName}</strong> | STK: <strong>{activeOrder.returnRequest.bankInfo.accountNumber}</strong> | Chủ TK: <strong>{activeOrder.returnRequest.bankInfo.accountHolder}</strong>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* SẢN PHẨM HOÀN */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-slate-700 uppercase tracking-wide text-[11px]">
                                        Sản phẩm yêu cầu hoàn ({activeOrder.returnRequest?.returnItems?.length || activeOrder.items.length} món)
                                    </span>
                                    <span className="font-bold text-slate-900">
                                        Số tiền: {(activeOrder.returnRequest?.estimatedRefundAmount || activeOrder.finalAmount || activeOrder.totalAmount || 0).toLocaleString('vi-VN')} đ
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {(activeOrder.returnRequest?.returnItems && activeOrder.returnRequest.returnItems.length > 0
                                        ? activeOrder.returnRequest.returnItems
                                        : activeOrder.items.map(it => ({
                                            productId: it.product?.id,
                                            name: it.product?.name,
                                            image: it.product?.images?.[0],
                                            size: it.selectedSize,
                                            color: it.selectedColor?.name,
                                            quantity: it.quantity,
                                            price: it.product?.price,
                                            refundAmount: (it.product?.price || 0) * it.quantity
                                        }))
                                    ).map((item: any, i: number) => (
                                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-white">
                                            <div className="relative w-11 h-11 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                                                <Image 
                                                    src={item.image || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300'} 
                                                    alt={item.name || 'Sản phẩm'} 
                                                    fill 
                                                    className="object-cover" 
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0 text-xs">
                                                <p className="font-semibold text-slate-900 truncate">{item.name}</p>
                                                <p className="text-slate-500 text-[11px] mt-0.5">
                                                    Phân loại: {item.size} · {item.color} | Số lượng: <strong className="text-slate-800">x{item.quantity}</strong>
                                                </p>
                                            </div>
                                            <p className="font-bold text-xs text-slate-900">
                                                {((item.price || 0) * item.quantity).toLocaleString('vi-VN')} đ
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* LÝ DO & BẰNG CHỨNG */}
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                                <div>
                                    <span className="font-bold text-slate-700 uppercase tracking-wide text-[11px] block">Lý do từ khách hàng:</span>
                                    <p className="text-slate-900 font-semibold mt-0.5">
                                        {activeOrder.returnRequest?.reason}
                                        {activeOrder.returnRequest?.customReason && ` (${activeOrder.returnRequest.customReason})`}
                                    </p>
                                </div>

                                {activeOrder.returnRequest?.description && (
                                    <div>
                                        <span className="font-bold text-slate-700 uppercase tracking-wide text-[11px] block">Mô tả chi tiết:</span>
                                        <p className="text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 mt-1 leading-relaxed">
                                            {activeOrder.returnRequest.description}
                                        </p>
                                    </div>
                                )}

                                {activeOrder.returnRequest?.images && activeOrder.returnRequest.images.length > 0 && (
                                    <div>
                                        <span className="font-bold text-slate-700 uppercase tracking-wide text-[11px] block mb-1.5">Ảnh bằng chứng:</span>
                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                            {activeOrder.returnRequest.images.map((img, idx) => (
                                                <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shrink-0 hover:opacity-90">
                                                    <Image src={img} alt={`Evidence ${idx}`} fill className="object-cover" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeOrder.returnRequest?.videoUrl && (
                                    <div>
                                        <span className="font-bold text-slate-700 uppercase tracking-wide text-[11px] block mb-0.5">Video bằng chứng:</span>
                                        <a href={activeOrder.returnRequest.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs break-all inline-flex items-center gap-1">
                                            {activeOrder.returnRequest.videoUrl} <ExternalLink size={11} />
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* ── FORM XÉT DUYỆT (MODE: REVIEW) ── */}
                            {modalMode === 'review' && (
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
                                    <div className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                                        Quyết định của Shop
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                        <label className={`p-3 rounded-xl border transition-all cursor-pointer ${
                                            selectedDecision === 'approve_ship'
                                                ? 'bg-white border-slate-900 ring-2 ring-slate-900/10'
                                                : 'bg-white border-slate-200 hover:border-slate-300'
                                        }`}>
                                            <div className="flex items-start gap-2">
                                                <input
                                                    type="radio"
                                                    name="decision"
                                                    checked={selectedDecision === 'approve_ship'}
                                                    onChange={() => setSelectedDecision('approve_ship')}
                                                    className="mt-0.5"
                                                />
                                                <div>
                                                    <p className="font-semibold text-xs text-slate-900">Cho phép gửi hàng</p>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">Khách gửi hàng về kho trong 3–5 ngày.</p>
                                                </div>
                                            </div>
                                        </label>

                                        <label className={`p-3 rounded-xl border transition-all cursor-pointer ${
                                            selectedDecision === 'instant_refund'
                                                ? 'bg-white border-emerald-600 ring-2 ring-emerald-600/20'
                                                : 'bg-white border-slate-200 hover:border-slate-300'
                                        }`}>
                                            <div className="flex items-start gap-2">
                                                <input
                                                    type="radio"
                                                    name="decision"
                                                    checked={selectedDecision === 'instant_refund'}
                                                    onChange={() => setSelectedDecision('instant_refund')}
                                                    className="mt-0.5"
                                                />
                                                <div>
                                                    <p className="font-semibold text-xs text-slate-900">Hoàn tiền ngay</p>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">Không cần trả hàng. Hoàn tiền tức thì.</p>
                                                </div>
                                            </div>
                                        </label>

                                        <label className={`p-3 rounded-xl border transition-all cursor-pointer ${
                                            selectedDecision === 'reject'
                                                ? 'bg-white border-rose-600 ring-2 ring-rose-600/20'
                                                : 'bg-white border-slate-200 hover:border-slate-300'
                                        }`}>
                                            <div className="flex items-start gap-2">
                                                <input
                                                    type="radio"
                                                    name="decision"
                                                    checked={selectedDecision === 'reject'}
                                                    onChange={() => setSelectedDecision('reject')}
                                                    className="mt-0.5"
                                                />
                                                <div>
                                                    <p className="font-semibold text-xs text-slate-900">Từ chối yêu cầu</p>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">Yêu cầu không đúng quy định.</p>
                                                </div>
                                            </div>
                                        </label>
                                    </div>

                                    {selectedDecision === 'approve_ship' && (
                                        <div className="space-y-1.5 text-xs">
                                            <label className="font-semibold text-slate-700 block">Địa chỉ kho nhận hàng:</label>
                                            <input
                                                type="text"
                                                value={warehouseAddress}
                                                onChange={e => setWarehouseAddress(e.target.value)}
                                                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                                            />
                                        </div>
                                    )}

                                    {selectedDecision === 'instant_refund' && (
                                        <div className="space-y-1.5 text-xs">
                                            <label className="font-semibold text-slate-700 block">Số tiền hoàn vào Ví/STK của khách:</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={customRefundAmount}
                                                    onChange={e => setCustomRefundAmount(Number(e.target.value))}
                                                    className="w-44 p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                                                />
                                                <span className="text-slate-500 font-semibold">VNĐ</span>
                                            </div>
                                        </div>
                                    )}

                                    {selectedDecision === 'reject' && (
                                        <div className="space-y-1.5 text-xs">
                                            <label className="font-semibold text-slate-700 block">Lý do từ chối <span className="text-rose-500">*</span>:</label>
                                            <textarea
                                                rows={2}
                                                value={rejectReason}
                                                onChange={e => setRejectReason(e.target.value)}
                                                placeholder="Nhập lý do gửi đến khách hàng..."
                                                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-rose-400"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── FORM THẨM ĐỊNH (MODE: INSPECT) ── */}
                            {modalMode === 'inspect' && (
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                                    <div className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center justify-between">
                                        <span>Kiểm tra kiện hàng nhận về tại kho</span>
                                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                            Bước: Nghiệm thu & Quyết định hoàn tiền
                                        </span>
                                    </div>

                                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            Mã vận đơn gửi: <strong className="font-mono text-slate-900">{activeOrder.returnRequest?.returnTrackingNumber || 'Chưa có'}</strong> ({activeOrder.returnRequest?.returnCarrier || 'Chuyển phát'})
                                        </div>
                                        <div>
                                            Tổng giá trị hàng hoàn: <strong className="text-emerald-700 font-bold">{(activeOrder.returnRequest?.estimatedRefundAmount || activeOrder.finalAmount || activeOrder.totalAmount || 0).toLocaleString('vi-VN')} đ</strong>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        <label className={`p-3 rounded-xl border transition-all cursor-pointer ${
                                            inspectionResult === 'passed'
                                                ? 'bg-emerald-50/70 border-emerald-600 ring-2 ring-emerald-600/20'
                                                : 'bg-white border-slate-200 hover:border-slate-300'
                                        }`}>
                                            <div className="flex items-start gap-2.5">
                                                <input
                                                    type="radio"
                                                    name="inspectResult"
                                                    checked={inspectionResult === 'passed'}
                                                    onChange={() => setInspectionResult('passed')}
                                                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                                                />
                                                <div>
                                                    <p className="font-bold text-xs text-slate-900 flex items-center gap-1">
                                                        <CheckCircle2 size={13} className="text-emerald-600" />
                                                        Đạt tiêu chuẩn — Hoàn tiền
                                                    </p>
                                                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                                                        Kiện hàng đúng mẫu, nguyên vẹn. Hệ thống sẽ tự động hoàn tiền vào Ví HAVEN và nhập tồn kho.
                                                    </p>
                                                </div>
                                            </div>
                                        </label>

                                        <label className={`p-3 rounded-xl border transition-all cursor-pointer ${
                                            inspectionResult === 'failed'
                                                ? 'bg-rose-50/70 border-rose-600 ring-2 ring-rose-600/20'
                                                : 'bg-white border-slate-200 hover:border-slate-300'
                                        }`}>
                                            <div className="flex items-start gap-2.5">
                                                <input
                                                    type="radio"
                                                    name="inspectResult"
                                                    checked={inspectionResult === 'failed'}
                                                    onChange={() => setInspectionResult('failed')}
                                                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                                                />
                                                <div>
                                                    <p className="font-bold text-xs text-slate-900 flex items-center gap-1">
                                                        <XCircle size={13} className="text-rose-600" />
                                                        Không đạt tiêu chuẩn — Từ chối
                                                    </p>
                                                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                                                        Sản phẩm bị tráo đổi, hư hỏng thêm do khách, hoặc mất phụ kiện/tem nhãn.
                                                    </p>
                                                </div>
                                            </div>
                                        </label>
                                    </div>

                                    {/* Số tiền hoàn khi đạt yêu cầu */}
                                    {inspectionResult === 'passed' && (
                                        <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-1.5 text-xs">
                                            <label className="font-semibold text-slate-800 block">
                                                Số tiền hoàn vào Ví HAVEN của khách:
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={customRefundAmount}
                                                    onChange={e => setCustomRefundAmount(Number(e.target.value))}
                                                    className="w-48 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-emerald-700 focus:bg-white focus:outline-none focus:border-emerald-500"
                                                />
                                                <span className="text-slate-500 font-semibold">VNĐ</span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 italic">
                                                Mặc định hoàn toàn bộ 100% giá trị sản phẩm trả về. Có thể chỉnh sửa nếu cần khấu trừ.
                                            </p>
                                        </div>
                                    )}

                                    <div className="space-y-1.5 text-xs">
                                        <label className="font-semibold text-slate-700 block">
                                            Ghi chú kiểm tra {inspectionResult === 'failed' && <span className="text-rose-500">* (Bắt buộc)</span>}:
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={inspectionNote}
                                            onChange={e => setInspectionNote(e.target.value)}
                                            placeholder={inspectionResult === 'passed' ? 'Ghi chú tình trạng kiện hàng (Ví dụ: Sản phẩm mới 100%, nguyên tem mác)...' : 'Nhập lý do cụ thể gửi thông báo cho khách hàng...'}
                                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── FOOTER ── */}
                        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
                            <button
                                type="button"
                                onClick={() => setActiveOrder(null)}
                                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                            >
                                Đóng
                            </button>

                            {modalMode === 'review' && (
                                <button
                                    type="button"
                                    onClick={handleSubmitDecision}
                                    disabled={submitting}
                                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                                >
                                    {submitting ? 'Đang lưu...' : 'Xác nhận xét duyệt'}
                                </button>
                            )}

                            {modalMode === 'inspect' && (
                                <button
                                    type="button"
                                    onClick={handleSubmitDecision}
                                    disabled={submitting}
                                    className={`px-5 py-2 text-white font-semibold text-xs rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-2xs flex items-center gap-1.5 ${
                                        inspectionResult === 'passed' 
                                            ? 'bg-emerald-600 hover:bg-emerald-700' 
                                            : 'bg-rose-600 hover:bg-rose-700'
                                    }`}
                                >
                                    {inspectionResult === 'passed' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                    <span>
                                        {submitting 
                                            ? 'Đang xử lý...' 
                                            : inspectionResult === 'passed' 
                                            ? 'Xác nhận đạt & Hoàn tiền ngay' 
                                            : 'Xác nhận không đạt & Từ chối'}
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
