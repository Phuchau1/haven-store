'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
    RotateCcw, Search, CheckCircle2, XCircle, Clock, 
    Eye, AlertCircle, RefreshCw, Image as ImageIcon,
    Check, X, Truck, Package, ShieldCheck, ShieldAlert,
    Building2, MapPin, Copy, ExternalLink, ArrowRight,
    AlertTriangle, Sparkles, User, Phone, Mail, FileText
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
    status: 'pending' | 'approved' | 'rejected' | 'none';
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
    
    // Process Modal State (Full Master Modal)
    const [activeOrder, setActiveOrder] = useState<OrderData | null>(null);
    const [modalMode, setModalMode] = useState<'review' | 'inspect' | 'view'>('review');
    
    // Form Actions within Modal
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
        setTimeout(() => setToastMessage(null), 4000);
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
                showToast('Vui lòng nhập lý do từ chối chi tiết (ít nhất 5 ký tự)', 'error');
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
                    showToast(data.message || 'Xử lý yêu cầu thành công!', 'success');
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
                showToast('Vui lòng nhập lý do kiện hàng không đạt thẩm định (ít nhất 5 ký tự)', 'error');
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
                    showToast(data.message || 'Đã hoàn tất thẩm định kiện hàng!', 'success');
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
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Toast Notification */}
            {toastMessage && (
                <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold transition-all animate-bounce ${
                    toastMessage.type === 'success' 
                    ? 'bg-slate-900 border-emerald-500 text-emerald-300' 
                    : 'bg-slate-900 border-rose-500 text-rose-300'
                }`}>
                    {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                    {toastMessage.text}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-slate-800">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-2xl">
                            <RotateCcw className="w-6 h-6 animate-spin-slow" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                                Quản Lý Trả Hàng & Hoàn Tiền (SLA Engine)
                            </h1>
                            <p className="text-slate-300 text-xs mt-0.5">
                                Quy trình chuẩn 5 bước: Tiếp nhận $\rightarrow$ Xét duyệt (24-48h) $\rightarrow$ Khách gửi hàng $\rightarrow$ Thẩm định $\rightarrow$ Hoàn tiền Ví/STK
                            </p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={fetchReturns}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all w-fit cursor-pointer border border-white/10"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới dữ liệu
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                <div 
                    onClick={() => setFilterStatus('all')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-xs ${
                        filterStatus === 'all' ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-400/20' : 'bg-white border-slate-200 hover:border-indigo-200'
                    }`}
                >
                    <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                        <span>Tất cả yêu cầu</span>
                        <RotateCcw className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 mt-2">{stats.total}</p>
                </div>

                <div 
                    onClick={() => setFilterStatus('pending')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-xs ${
                        filterStatus === 'pending' ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20' : 'bg-white border-slate-200 hover:border-amber-200'
                    }`}
                >
                    <div className="flex items-center justify-between text-amber-700 text-xs font-bold uppercase">
                        <span>Chờ duyệt (24-48h)</span>
                        <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                    </div>
                    <p className="text-2xl font-black text-amber-900 mt-2">{stats.pending}</p>
                </div>

                <div 
                    onClick={() => setFilterStatus('returning')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-xs ${
                        filterStatus === 'returning' ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-400/20' : 'bg-white border-slate-200 hover:border-orange-200'
                    }`}
                >
                    <div className="flex items-center justify-between text-orange-700 text-xs font-bold uppercase">
                        <span>Đang gửi hàng hoàn</span>
                        <Truck className="w-4 h-4 text-orange-500" />
                    </div>
                    <p className="text-2xl font-black text-orange-900 mt-2">{(stats as any).returning || 0}</p>
                </div>

                <div 
                    onClick={() => setFilterStatus('refunded')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-xs ${
                        filterStatus === 'refunded' ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/20' : 'bg-white border-slate-200 hover:border-emerald-200'
                    }`}
                >
                    <div className="flex items-center justify-between text-emerald-700 text-xs font-bold uppercase">
                        <span>Đã hoàn tiền</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-2xl font-black text-emerald-900 mt-2">{stats.refunded || 0}</p>
                </div>

                <div 
                    onClick={() => setFilterStatus('rejected')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-xs ${
                        filterStatus === 'rejected' ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/20' : 'bg-white border-slate-200 hover:border-rose-200'
                    }`}
                >
                    <div className="flex items-center justify-between text-rose-700 text-xs font-bold uppercase">
                        <span>Đã từ chối</span>
                        <XCircle className="w-4 h-4 text-rose-500" />
                    </div>
                    <p className="text-2xl font-black text-rose-900 mt-2">{stats.rejected}</p>
                </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                    {[
                        { id: 'pending', label: `Chờ duyệt (${stats.pending})` },
                        { id: 'returning', label: `Đang gửi hàng (${(stats as any).returning || 0})` },
                        { id: 'refunded', label: `Đã hoàn tiền (${stats.refunded || 0})` },
                        { id: 'approved', label: `Đã duyệt (${stats.approved})` },
                        { id: 'rejected', label: `Từ chối (${stats.rejected})` },
                        { id: 'all', label: `Tất cả (${stats.total})` }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterStatus(tab.id as any)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                filterStatus === tab.id
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo mã đơn, mã vận đơn, khách hàng..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                                <th className="p-4">Mã đơn & Hình thức</th>
                                <th className="p-4">Khách hàng</th>
                                <th className="p-4">Sản phẩm & Lý do</th>
                                <th className="p-4">Vận đơn hoàn</th>
                                <th className="p-4">Số tiền dự kiến</th>
                                <th className="p-4">Hạn chót SLA</th>
                                <th className="p-4">Trạng thái</th>
                                <th className="p-4 text-right">Thao tác bài bản</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="p-10 text-center text-slate-400">
                                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                                        Đang tải dữ liệu hoàn hàng...
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-10 text-center text-slate-400">
                                        <RotateCcw className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                        Không tìm thấy yêu cầu hoàn hàng nào
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => {
                                    const req = order.returnRequest;
                                    const isPending = req?.status === 'pending';
                                    const isApproved = req?.status === 'approved';
                                    const isRejected = req?.status === 'rejected';
                                    const isReturning = order.status === 'returning';
                                    const isRefunded = order.status === 'refunded';
                                    const isRefundOnly = req?.returnType === 'refund_only';
                                    const refundAmt = req?.estimatedRefundAmount || req?.refundAmount || order.finalAmount || order.totalAmount || 0;

                                    return (
                                        <tr key={order._id || order.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-4">
                                                <span className="font-bold font-mono text-indigo-600 text-xs block">
                                                    #{order.id}
                                                </span>
                                                <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                                    isRefundOnly 
                                                        ? 'bg-amber-50 text-amber-800 border-amber-200' 
                                                        : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                                }`}>
                                                    {isRefundOnly ? '⚡ Chỉ hoàn tiền' : '📦 Trả hàng & hoàn tiền'}
                                                </span>
                                            </td>

                                            <td className="p-4">
                                                <div className="font-bold text-slate-900">{order.customerName}</div>
                                                <div className="text-[11px] text-slate-500">{order.phone}</div>
                                            </td>

                                            <td className="p-4 max-w-xs">
                                                <div className="font-semibold text-slate-800 truncate" title={req?.reason}>
                                                    {req?.reason || '—'}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {req?.returnItems && req.returnItems.length > 0 && (
                                                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                                                            {req.returnItems.length} sản phẩm hoàn
                                                        </span>
                                                    )}
                                                    {req?.images && req.images.length > 0 && (
                                                        <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-0.5">
                                                            <ImageIcon size={11} /> {req.images.length} ảnh
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                {req?.returnTrackingNumber ? (
                                                    <div>
                                                        <button 
                                                            onClick={() => copyToClipboard(req.returnTrackingNumber!)}
                                                            className="font-mono font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 text-[11px] flex items-center gap-1 cursor-pointer"
                                                            title="Bấm để sao chép"
                                                        >
                                                            {req.returnTrackingNumber} <Copy size={10} />
                                                        </button>
                                                        <p className="text-[10px] text-slate-500 mt-0.5">{req.returnCarrier || 'Chuyển phát'}</p>
                                                    </div>
                                                ) : isReturning ? (
                                                    <span className="text-[11px] text-amber-600 italic">⏳ Khách đang gửi</span>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>

                                            <td className="p-4 font-black text-slate-900 text-xs">
                                                {refundAmt.toLocaleString('vi-VN')}đ
                                            </td>

                                            <td className="p-4 text-slate-600">
                                                {isPending && req?.reviewDeadline ? (
                                                    <span className="text-[11px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                                                        <Clock size={11} />
                                                        Duyệt trước: {new Date(req.reviewDeadline).toLocaleDateString('vi-VN')}
                                                    </span>
                                                ) : isReturning && req?.shippingDeadline ? (
                                                    <span className="text-[11px] text-orange-800 font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-200 inline-flex items-center gap-1">
                                                        <Truck size={11} />
                                                        Gửi trước: {new Date(req.shippingDeadline).toLocaleDateString('vi-VN')}
                                                    </span>
                                                ) : req?.requestedAt ? (
                                                    new Date(req.requestedAt).toLocaleDateString('vi-VN')
                                                ) : '—'}
                                            </td>

                                            <td className="p-4">
                                                {isPending && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                        <Clock className="w-3 h-3" /> Chờ duyệt
                                                    </span>
                                                )}
                                                {isReturning && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                                                        🚚 Đang gửi hàng
                                                    </span>
                                                )}
                                                {isRefunded && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <CheckCircle2 className="w-3 h-3" /> Đã hoàn tiền
                                                    </span>
                                                )}
                                                {isApproved && !isReturning && !isRefunded && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                        <CheckCircle2 className="w-3 h-3" /> Đã duyệt
                                                    </span>
                                                )}
                                                {isRejected && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                        <XCircle className="w-3 h-3" /> Từ chối
                                                    </span>
                                                )}
                                            </td>

                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => handleOpenProcess(order, 'view')}
                                                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                                                        title="Xem tiến trình & bằng chứng"
                                                    >
                                                        <Eye size={13} /> Xem
                                                    </button>

                                                    {isPending && (
                                                        <button
                                                            onClick={() => handleOpenProcess(order, 'review')}
                                                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs transition-all flex items-center gap-1 shadow-md shadow-indigo-100 cursor-pointer"
                                                        >
                                                            <Sparkles size={13} /> Xử lý duyệt
                                                        </button>
                                                    )}

                                                    {isReturning && (
                                                        <button
                                                            onClick={() => handleOpenProcess(order, 'inspect')}
                                                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs transition-all flex items-center gap-1 shadow-md shadow-teal-100 cursor-pointer"
                                                        >
                                                            <ShieldCheck size={13} /> Thẩm định hàng
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
                MASTER PROFESSIONAL MODAL (XỬ LÝ HOÀN HÀNG TOÀN DIỆN BÀI BẢN)
            ════════════════════════════════════════════════════════════════════════════════ */}
            {activeOrder && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
                        
                        {/* ── MODAL HEADER ── */}
                        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 rounded-2xl">
                                    {modalMode === 'review' ? <Sparkles size={20} /> : modalMode === 'inspect' ? <ShieldCheck size={20} /> : <Eye size={20} />}
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                                        {modalMode === 'review' && 'Xét Duyệt Yêu Cầu Hoàn Hàng'}
                                        {modalMode === 'inspect' && 'Thẩm Định Kiện Hàng Hoàn Trả'}
                                        {modalMode === 'view' && 'Hồ Sơ Yêu Cầu Hoàn Hàng'}
                                        <span className="font-mono text-amber-300 font-bold">#{activeOrder.id}</span>
                                    </h3>
                                    <p className="text-xs text-slate-300 mt-0.5">
                                        Khách hàng: <strong>{activeOrder.customerName}</strong> ({activeOrder.phone}) · Đặt ngày {new Date(activeOrder.createdAt).toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveOrder(null)}
                                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* ── MODAL BODY (SCROLLABLE) ── */}
                        <div className="p-6 sm:p-7 space-y-6 overflow-y-auto flex-1 hide-scrollbar">

                            {/* SLA 5 BƯỚC PROGRESS BAR */}
                            <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-indigo-950 uppercase tracking-wider">
                                    <span>Tiến Trình Xử Lý SLA Chuẩn</span>
                                    <span className="text-[11px] text-indigo-600 lowercase font-semibold">tối đa 7-10 ngày toàn trình</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                                    <div className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-2xs">
                                        <span className="text-[10px] text-slate-400 block font-semibold">1. Yêu cầu gửi lúc</span>
                                        <strong className="text-slate-800 text-[11px]">
                                            {activeOrder.returnRequest?.requestedAt ? new Date(activeOrder.returnRequest.requestedAt).toLocaleString('vi-VN') : '—'}
                                        </strong>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-2xs">
                                        <span className="text-[10px] text-slate-400 block font-semibold">2. Hạn Shop duyệt</span>
                                        <strong className="text-amber-700 text-[11px]">
                                            {activeOrder.returnRequest?.reviewDeadline ? new Date(activeOrder.returnRequest.reviewDeadline).toLocaleString('vi-VN') : 'Trong 24-48h'}
                                        </strong>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-2xs">
                                        <span className="text-[10px] text-slate-400 block font-semibold">3. Mã vận đơn khách gửi</span>
                                        <strong className="text-indigo-700 text-[11px] truncate block font-mono">
                                            {activeOrder.returnRequest?.returnTrackingNumber || 'Chờ gửi (Hạn 3-5 ngày)'}
                                        </strong>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-2xs">
                                        <span className="text-[10px] text-slate-400 block font-semibold">4. Hoàn tiền Ví/STK</span>
                                        <strong className="text-emerald-700 text-[11px]">
                                            {activeOrder.status === 'refunded' ? 'Đã hoàn tất' : 'Trong 1-3 ngày sau kiểm'}
                                        </strong>
                                    </div>
                                </div>
                            </div>

                            {/* ── THÔNG TIN KHÁCH HÀNG & YÊU CẦU ── */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                                    <h4 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <User size={14} className="text-indigo-600" /> Thông tin đơn hàng & Người mua
                                    </h4>
                                    <div className="space-y-1 text-slate-600 pt-1">
                                        <p>Người nhận: <strong className="text-slate-900">{activeOrder.customerName}</strong></p>
                                        <p>Số điện thoại: <strong className="text-slate-900 font-mono">{activeOrder.phone}</strong></p>
                                        <p>Email: <span className="text-slate-800">{activeOrder.email}</span></p>
                                        <p>Địa chỉ giao hàng: <span className="text-slate-800">{activeOrder.address}</span></p>
                                        <p>Phương thức thanh toán: <strong className="text-slate-900 uppercase font-bold">{activeOrder.paymentMethod || 'COD'}</strong></p>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                                    <h4 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <Building2 size={14} className="text-emerald-600" /> Hình thức & Nhận tiền hoàn
                                    </h4>
                                    <div className="space-y-1.5 pt-1">
                                        <div>
                                            <span className="text-slate-500">Hình thức yêu cầu:</span>
                                            <span className={`ml-2 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                                                activeOrder.returnRequest?.returnType === 'refund_only'
                                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                                    : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                                            }`}>
                                                {activeOrder.returnRequest?.returnType === 'refund_only' ? '⚡ Chỉ hoàn tiền (Không gửi hàng)' : '📦 Trả hàng & hoàn tiền'}
                                            </span>
                                        </div>
                                        <p>Phương thức nhận tiền: <strong className="text-slate-900 font-bold">
                                            {activeOrder.returnRequest?.refundMethod === 'wallet' && '💰 Ví HAVEN Pay (Cộng tiền ngay)'}
                                            {activeOrder.returnRequest?.refundMethod === 'original' && '💳 Cổng thanh toán ban đầu (VNPay/MoMo)'}
                                            {activeOrder.returnRequest?.refundMethod === 'bank_transfer' && '🏦 Chuyển khoản ngân hàng'}
                                        </strong></p>
                                        {activeOrder.returnRequest?.bankInfo?.accountNumber && (
                                            <div className="p-2 bg-white rounded-xl border border-slate-200 font-mono text-[11px] text-slate-800">
                                                Ngân hàng: <strong>{activeOrder.returnRequest.bankInfo.bankName}</strong> | STK: <strong>{activeOrder.returnRequest.bankInfo.accountNumber}</strong> | Tên: <strong>{activeOrder.returnRequest.bankInfo.accountHolder}</strong>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ── SẢN PHẨM KHÁCH CHỌN HOÀN ── */}
                            <div className="space-y-2.5">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                                    <span>Sản phẩm khách yêu cầu hoàn ({activeOrder.returnRequest?.returnItems?.length || activeOrder.items.length} món)</span>
                                    <span className="text-rose-600 font-black">
                                        Tổng tiền hoàn: {(activeOrder.returnRequest?.estimatedRefundAmount || activeOrder.finalAmount || activeOrder.totalAmount || 0).toLocaleString('vi-VN')}đ
                                    </span>
                                </h4>

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
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/60">
                                            <div className="relative w-12 h-12 bg-slate-200 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                                                <Image 
                                                    src={item.image || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300'} 
                                                    alt={item.name || 'Sản phẩm'} 
                                                    fill 
                                                    className="object-cover" 
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0 text-xs">
                                                <p className="font-bold text-slate-900 truncate">{item.name}</p>
                                                <p className="text-slate-500 mt-0.5">
                                                    Phân loại: <strong className="text-slate-700">{item.size} · {item.color}</strong> · Số lượng yêu cầu hoàn: <strong className="text-rose-600 font-black">x{item.quantity}</strong>
                                                </p>
                                            </div>
                                            <p className="font-black text-xs text-rose-600">
                                                {((item.price || 0) * item.quantity).toLocaleString('vi-VN')}đ
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── LÝ DO, MÔ TẢ & BẰNG CHỨNG ── */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                                <div>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase">Lý do từ khách hàng:</p>
                                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                                        {activeOrder.returnRequest?.reason}
                                        {activeOrder.returnRequest?.customReason && ` (${activeOrder.returnRequest.customReason})`}
                                    </p>
                                </div>

                                {activeOrder.returnRequest?.description && (
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-500 uppercase">Mô tả chi tiết vấn đề:</p>
                                        <p className="text-xs text-slate-800 leading-relaxed bg-white p-3 rounded-xl border border-slate-200 mt-0.5">
                                            {activeOrder.returnRequest.description}
                                        </p>
                                    </div>
                                )}

                                {/* Images */}
                                {activeOrder.returnRequest?.images && activeOrder.returnRequest.images.length > 0 && (
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-500 uppercase mb-2">Ảnh bằng chứng ({activeOrder.returnRequest.images.length} ảnh):</p>
                                        <div className="flex gap-2.5 overflow-x-auto pb-2">
                                            {activeOrder.returnRequest.images.map((img, idx) => (
                                                <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0 hover:opacity-90 shadow-2xs">
                                                    <Image src={img} alt={`Evidence ${idx}`} fill className="object-cover" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeOrder.returnRequest?.videoUrl && (
                                    <div className="text-xs">
                                        <span className="font-bold text-slate-500 uppercase block mb-1">Link Video bằng chứng:</span>
                                        <a href={activeOrder.returnRequest.videoUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline font-semibold break-all flex items-center gap-1">
                                            {activeOrder.returnRequest.videoUrl} <ExternalLink size={12} />
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* ══════════════════════════════════════════════════════════════════════════
                                KHU VỰC QUYẾT ĐỊNH XÉT DUYỆT (MODE: REVIEW)
                            ══════════════════════════════════════════════════════════════════════════ */}
                            {modalMode === 'review' && (
                                <div className="p-5 bg-gradient-to-br from-indigo-50/70 to-slate-50 rounded-2xl border-2 border-indigo-200 space-y-4 shadow-sm">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-indigo-950 flex items-center gap-2">
                                        <Sparkles size={16} className="text-indigo-600" /> Quyết Định Xử Lý Của Shop
                                    </h4>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <label className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                                            selectedDecision === 'approve_ship'
                                                ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-300'
                                                : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                                        }`}>
                                            <div className="flex items-start gap-2.5">
                                                <input
                                                    type="radio"
                                                    name="adminDecision"
                                                    checked={selectedDecision === 'approve_ship'}
                                                    onChange={() => setSelectedDecision('approve_ship')}
                                                    className="mt-1"
                                                />
                                                <div>
                                                    <p className="font-bold text-xs">📦 Cho phép gửi hàng</p>
                                                    <p className={`text-[10px] mt-1 ${selectedDecision === 'approve_ship' ? 'text-indigo-100' : 'text-slate-500'}`}>
                                                        Khách có 3–5 ngày để đóng gói & gửi bưu kiện về kho.
                                                    </p>
                                                </div>
                                            </div>
                                        </label>

                                        <label className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                                            selectedDecision === 'instant_refund'
                                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300'
                                                : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                                        }`}>
                                            <div className="flex items-start gap-2.5">
                                                <input
                                                    type="radio"
                                                    name="adminDecision"
                                                    checked={selectedDecision === 'instant_refund'}
                                                    onChange={() => setSelectedDecision('instant_refund')}
                                                    className="mt-1"
                                                />
                                                <div>
                                                    <p className="font-bold text-xs">⚡ Hoàn tiền ngay</p>
                                                    <p className={`text-[10px] mt-1 ${selectedDecision === 'instant_refund' ? 'text-emerald-100' : 'text-slate-500'}`}>
                                                        Không cần trả hàng. Chuyển tiền ngay vào Ví HAVEN / STK.
                                                    </p>
                                                </div>
                                            </div>
                                        </label>

                                        <label className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                                            selectedDecision === 'reject'
                                                ? 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-300'
                                                : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                                        }`}>
                                            <div className="flex items-start gap-2.5">
                                                <input
                                                    type="radio"
                                                    name="adminDecision"
                                                    checked={selectedDecision === 'reject'}
                                                    onChange={() => setSelectedDecision('reject')}
                                                    className="mt-1"
                                                />
                                                <div>
                                                    <p className="font-bold text-xs">❌ Từ chối yêu cầu</p>
                                                    <p className={`text-[10px] mt-1 ${selectedDecision === 'reject' ? 'text-rose-100' : 'text-slate-500'}`}>
                                                        Yêu cầu không hợp lệ / quá hạn / không đúng chính sách.
                                                    </p>
                                                </div>
                                            </div>
                                        </label>
                                    </div>

                                    {/* Sub forms */}
                                    {selectedDecision === 'approve_ship' && (
                                        <div className="space-y-2 pt-1 bg-white p-3.5 rounded-2xl border border-indigo-100 text-xs">
                                            <label className="font-bold text-slate-700 block flex items-center gap-1">
                                                <MapPin size={13} className="text-indigo-600" /> Địa chỉ kho nhận hàng hoàn (gửi cho khách đóng gói):
                                            </label>
                                            <input
                                                type="text"
                                                value={warehouseAddress}
                                                onChange={e => setWarehouseAddress(e.target.value)}
                                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                    )}

                                    {selectedDecision === 'instant_refund' && (
                                        <div className="space-y-2 pt-1 bg-white p-3.5 rounded-2xl border border-emerald-100 text-xs">
                                            <label className="font-bold text-slate-700 block">
                                                Xác nhận số tiền hoàn vào Ví HAVEN / STK của khách:
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={customRefundAmount}
                                                    onChange={e => setCustomRefundAmount(Number(e.target.value))}
                                                    className="w-48 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700 focus:outline-none focus:border-emerald-500"
                                                />
                                                <span className="font-bold text-slate-600">VNĐ</span>
                                            </div>
                                        </div>
                                    )}

                                    {selectedDecision === 'reject' && (
                                        <div className="space-y-2 pt-1 bg-white p-3.5 rounded-2xl border border-rose-100 text-xs">
                                            <label className="font-bold text-slate-700 block">
                                                Lý do từ chối yêu cầu (gửi vào thông báo khách hàng) <span className="text-rose-500">*</span>:
                                            </label>
                                            <textarea
                                                rows={3}
                                                value={rejectReason}
                                                onChange={e => setRejectReason(e.target.value)}
                                                placeholder="Ví dụ: Sản phẩm đã quá hạn 7 ngày / Bằng chứng không rõ ràng..."
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500 resize-none"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ══════════════════════════════════════════════════════════════════════════
                                KHU VỰC THẨM ĐỊNH KIỆN HÀNG (MODE: INSPECT)
                            ══════════════════════════════════════════════════════════════════════════ */}
                            {modalMode === 'inspect' && (
                                <div className="p-5 bg-gradient-to-br from-teal-50/80 to-slate-50 rounded-2xl border-2 border-teal-200 space-y-4 shadow-sm">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-teal-950 flex items-center gap-2">
                                        <ShieldCheck size={16} className="text-teal-600" /> Nghiệm Thu & Thẩm Định Kiện Hàng Hoàn Trả
                                    </h4>

                                    <div className="bg-white p-3.5 rounded-2xl border border-teal-100 text-xs space-y-1">
                                        <p className="font-bold text-slate-800">Thông tin vận chuyển khách đã gửi:</p>
                                        <p className="text-slate-600">
                                            Đơn vị vận chuyển: <strong>{activeOrder.returnRequest?.returnCarrier || 'Chuyển phát'}</strong> · Mã vận đơn: <strong className="font-mono text-indigo-700 font-bold">{activeOrder.returnRequest?.returnTrackingNumber}</strong>
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <label className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                                            inspectionResult === 'passed'
                                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300'
                                                : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                                        }`}>
                                            <div className="flex items-start gap-2.5">
                                                <input
                                                    type="radio"
                                                    name="inspectionResult"
                                                    checked={inspectionResult === 'passed'}
                                                    onChange={() => setInspectionResult('passed')}
                                                    className="mt-1"
                                                />
                                                <div>
                                                    <p className="font-bold text-xs">✅ Đạt tiêu chuẩn $\rightarrow$ Hoàn tiền ngay</p>
                                                    <p className={`text-[10px] mt-1 ${inspectionResult === 'passed' ? 'text-emerald-100' : 'text-slate-500'}`}>
                                                        Kiện hàng nguyên vẹn, đúng lỗi đã báo. Hệ thống sẽ tự động hoàn tiền vào Ví HAVEN / STK và nhập lại tồn kho.
                                                    </p>
                                                </div>
                                            </div>
                                        </label>

                                        <label className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                                            inspectionResult === 'failed'
                                                ? 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-300'
                                                : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                                        }`}>
                                            <div className="flex items-start gap-2.5">
                                                <input
                                                    type="radio"
                                                    name="inspectionResult"
                                                    checked={inspectionResult === 'failed'}
                                                    onChange={() => setInspectionResult('failed')}
                                                    className="mt-1"
                                                />
                                                <div>
                                                    <p className="font-bold text-xs">❌ Không đạt tiêu chuẩn $\rightarrow$ Từ chối</p>
                                                    <p className={`text-[10px] mt-1 ${inspectionResult === 'failed' ? 'text-rose-100' : 'text-slate-500'}`}>
                                                        Sản phẩm bị cắt tem, tráo hàng, hoặc rách hỏng do người dùng. Shop sẽ gửi trả lại kiện hàng cho khách.
                                                    </p>
                                                </div>
                                            </div>
                                        </label>
                                    </div>

                                    <div className="space-y-2 bg-white p-3.5 rounded-2xl border border-slate-200 text-xs">
                                        <label className="font-bold text-slate-700 block">
                                            Ghi chú thẩm định kiểm hàng {inspectionResult === 'failed' && <span className="text-rose-500">*</span>}:
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={inspectionNote}
                                            onChange={e => setInspectionNote(e.target.value)}
                                            placeholder="Ghi chú chi tiết tình trạng kiện hàng khi mở gói..."
                                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-teal-500 resize-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── MODAL FOOTER ── */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setActiveOrder(null)}
                                className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                            >
                                Đóng
                            </button>

                            {(modalMode === 'review' || modalMode === 'inspect') && (
                                <button
                                    type="button"
                                    onClick={handleSubmitDecision}
                                    disabled={submitting}
                                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
                                >
                                    {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check size={14} />}
                                    <span>
                                        {modalMode === 'review' && (selectedDecision === 'approve_ship' ? 'Xác nhận Chấp thuận cho gửi hàng' : selectedDecision === 'instant_refund' ? 'Xác nhận Hoàn tiền ngay vào Ví' : 'Xác nhận Từ chối')}
                                        {modalMode === 'inspect' && (inspectionResult === 'passed' ? 'Xác nhận Đạt & Hoàn tiền ngay' : 'Xác nhận Không đạt & Từ chối')}
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
