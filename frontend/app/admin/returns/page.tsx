'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
    RotateCcw, Search, CheckCircle2, XCircle, Clock, 
    Eye, AlertCircle, RefreshCw, Image as ImageIcon,
    Check, X
} from 'lucide-react';

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
    reason: string;
    images?: string[];
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
    status: string;
    returnRequest?: ReturnRequestData;
    createdAt: string;
}

export default function AdminReturnsPage() {
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'returning' | 'refunded'>('pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
    
    // Modal states
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewAction, setReviewAction] = useState<'approve' | 'instant_refund' | 'reject' | 'confirm_received'>('approve');
    const [rejectReason, setRejectReason] = useState('');
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

    const handleOpenReview = (order: OrderData, action: 'approve' | 'instant_refund' | 'reject' | 'confirm_received') => {
        setSelectedOrder(order);
        setReviewAction(action);
        setRejectReason('');
        setReviewModalOpen(true);
    };

    const handleReviewSubmit = async () => {
        if (!selectedOrder) return;
        if (reviewAction === 'reject' && (!rejectReason || rejectReason.trim().length < 5)) {
            showToast('Vui lòng nhập lý do từ chối (ít nhất 5 ký tự)', 'error');
            return;
        }

        setSubmitting(true);
        try {
            let url = `/api/orders/return-request/${selectedOrder.id}`;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let body: Record<string, any> = { 
                action: reviewAction === 'instant_refund' ? 'approve' : reviewAction, 
                instantRefund: reviewAction === 'instant_refund',
                rejectReason: rejectReason.trim(), 
                adminName: 'Admin' 
            };
            if (reviewAction === 'confirm_received') {
                url = `/api/orders/return-received/${selectedOrder.id}`;
                body = { adminName: 'Admin' };
            }
            const res = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (data.success) {
                const msg = reviewAction === 'instant_refund'
                    ? '💰 Đã duyệt & Hoàn tiền ngay vào Ví HAVEN của khách hàng thành công!'
                    : reviewAction === 'approve' 
                        ? '✅ Đã duyệt hoàn hàng — thời hạn khách gửi hàng là 3–5 ngày' 
                        : reviewAction === 'confirm_received' 
                            ? '💰 Đã xác nhận nhận hàng & hoàn tiền vào Ví thành công!' 
                            : '❌ Đã từ chối hoàn hàng';
                showToast(msg, 'success');
                setReviewModalOpen(false);
                setSelectedOrder(null);
                fetchReturns();
            } else {
                showToast(data.message || 'Xử lý thất bại', 'error');
            }
        } catch (err) {
            console.error('Error reviewing return:', err);
            showToast('Lỗi kết nối máy chủ', 'error');
        } finally {
            setSubmitting(false);
        }
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
                <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 text-sm font-medium transition-all animate-bounce ${
                    toastMessage.type === 'success' 
                    ? 'bg-emerald-900/90 border-emerald-700 text-emerald-100' 
                    : 'bg-rose-900/90 border-rose-700 text-rose-100'
                }`}>
                    {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
                    {toastMessage.text}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                        <RotateCcw className="w-7 h-7 text-indigo-600" />
                        Quản lý Hoàn Hàng & Trả Tiền (SLA Engine)
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Chuẩn hóa thời gian xét duyệt 24–48h, theo dõi mã vận đơn hoàn trả và hoàn tiền vào Ví</p>
                </div>
                <button
                    onClick={fetchReturns}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors w-fit cursor-pointer"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
                        <span>Tổng yêu cầu</span>
                        <RotateCcw className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</p>
                </div>
                <div 
                    onClick={() => setFilterStatus('pending')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-xs ${
                        filterStatus === 'pending' ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20' : 'bg-white border-slate-200 hover:border-amber-200'
                    }`}
                >
                    <div className="flex items-center justify-between text-amber-700 text-xs font-semibold uppercase">
                        <span>Chờ duyệt (24-48h)</span>
                        <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                    <p className="text-2xl font-bold text-amber-900 mt-2">{stats.pending}</p>
                </div>
                <div 
                    onClick={() => setFilterStatus('returning')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-xs ${
                        filterStatus === 'returning' ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-400/20' : 'bg-white border-slate-200 hover:border-orange-200'
                    }`}
                >
                    <div className="flex items-center justify-between text-orange-700 text-xs font-semibold uppercase">
                        <span>Đang gửi hàng hoàn</span>
                        <span className="text-sm">🚚</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-900 mt-2">{(stats as any).returning || 0}</p>
                </div>
                <div 
                    onClick={() => setFilterStatus('refunded')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-xs ${
                        filterStatus === 'refunded' ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/20' : 'bg-white border-slate-200 hover:border-emerald-200'
                    }`}
                >
                    <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold uppercase">
                        <span>Đã hoàn tiền</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-2xl font-bold text-emerald-900 mt-2">{stats.refunded || 0}</p>
                </div>
                <div 
                    onClick={() => setFilterStatus('rejected')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-xs ${
                        filterStatus === 'rejected' ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/20' : 'bg-white border-slate-200 hover:border-rose-200'
                    }`}
                >
                    <div className="flex items-center justify-between text-rose-700 text-xs font-semibold uppercase">
                        <span>Đã từ chối</span>
                        <XCircle className="w-4 h-4 text-rose-500" />
                    </div>
                    <p className="text-2xl font-bold text-rose-900 mt-2">{stats.rejected}</p>
                </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                    {[
                        { id: 'pending', label: `Chờ duyệt (${stats.pending})` },
                        { id: 'returning', label: `Đang gửi hàng hoàn (${(stats as any).returning || 0})` },
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
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo mã đơn, mã vận đơn, SĐT..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                                <th className="p-4">Mã đơn hàng</th>
                                <th className="p-4">Khách hàng</th>
                                <th className="p-4">Lý do & Bằng chứng</th>
                                <th className="p-4">Vận đơn trả hàng</th>
                                <th className="p-4">Số tiền hoàn</th>
                                <th className="p-4">Hạn chót SLA</th>
                                <th className="p-4">Trạng thái</th>
                                <th className="p-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-400">
                                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                                        Đang tải danh sách...
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-400">
                                        <RotateCcw className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                        Không có yêu cầu hoàn hàng nào phù hợp
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

                                    return (
                                        <tr key={order._id || order.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="p-4 font-bold text-indigo-600">
                                                #{order.id}
                                            </td>
                                            <td className="p-4">
                                                <div className="font-semibold text-slate-800">{order.customerName}</div>
                                                <div className="text-[11px] text-slate-400">{order.phone}</div>
                                            </td>
                                            <td className="p-4 max-w-xs">
                                                <div className="font-medium text-slate-700 truncate" title={req?.reason}>
                                                    "{req?.reason || '—'}"
                                                </div>
                                                {req?.images && req.images.length > 0 && (
                                                    <div className="flex items-center gap-1 mt-1 text-[10px] text-indigo-600 font-semibold">
                                                        <ImageIcon className="w-3 h-3" />
                                                        {req.images.length} ảnh bằng chứng
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                {req?.returnTrackingNumber ? (
                                                    <div>
                                                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-[11px]">
                                                            {req.returnTrackingNumber}
                                                        </span>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">{req.returnCarrier || 'Chuyển phát'}</p>
                                                    </div>
                                                ) : isReturning ? (
                                                    <span className="text-[11px] text-amber-600 italic">⏳ Chờ khách nhập mã</span>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="p-4 font-bold text-slate-900">
                                                {(order.finalAmount || order.totalAmount || 0).toLocaleString('vi-VN')}đ
                                            </td>
                                            <td className="p-4 text-slate-500">
                                                {isPending && req?.reviewDeadline ? (
                                                    <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                        Duyệt trước: {new Date(req.reviewDeadline).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                                                    </span>
                                                ) : isReturning && req?.shippingDeadline ? (
                                                    <span className="text-[11px] text-orange-700 font-semibold bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                                                        Gửi trước: {new Date(req.shippingDeadline).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                                    </span>
                                                ) : req?.requestedAt ? (
                                                    new Date(req.requestedAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
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
                                                        🚚 Đang hoàn hàng
                                                    </span>
                                                )}
                                                {isRefunded && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <CheckCircle2 className="w-3 h-3" /> Đã hoàn tiền
                                                    </span>
                                                )}
                                                {isApproved && !isReturning && !isRefunded && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
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
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setSelectedOrder(order)}
                                                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                                        title="Xem chi tiết & Tiến trình SLA"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {isPending && (
                                                        <>
                                                            <button
                                                                onClick={() => handleOpenReview(order, 'instant_refund')}
                                                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                                                                title="Duyệt và hoàn tiền ngay lập tức vào Ví HAVEN"
                                                            >
                                                                ⚡ Hoàn tiền ngay
                                                            </button>
                                                            <button
                                                                onClick={() => handleOpenReview(order, 'approve')}
                                                                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                                                                title="Duyệt cho phép gửi hàng về kho (Hạn 3-5 ngày)"
                                                            >
                                                                <Check className="w-3.5 h-3.5" /> Duyệt gửi hàng
                                                            </button>
                                                            <button
                                                                onClick={() => handleOpenReview(order, 'reject')}
                                                                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                                                            >
                                                                <X className="w-3.5 h-3.5" /> Từ chối
                                                            </button>
                                                        </>
                                                    )}
                                                    {isReturning && (
                                                        <button
                                                            onClick={() => handleOpenReview(order, 'confirm_received')}
                                                            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                                                        >
                                                            💰 Đã nhận hàng & Hoàn tiền
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

            {/* Detail Drawer / Modal với SLA Timeline */}
            {selectedOrder && !reviewModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-100">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Chi tiết Tiến trình Hoàn hàng #{selectedOrder.id}</h3>
                                <p className="text-xs text-slate-500">Khách hàng: {selectedOrder.customerName} - {selectedOrder.phone}</p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* SLA Timeline 5 Bước */}
                        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-2">
                            <h4 className="text-xs font-bold uppercase text-indigo-900 flex items-center gap-1.5">
                                ⏱️ Các Mốc Thời Gian SLA
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                                <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                                    <span className="text-[10px] text-slate-400 block">1. Khách gửi yêu cầu</span>
                                    <strong className="text-slate-800 text-[11px]">
                                        {selectedOrder.returnRequest?.requestedAt ? new Date(selectedOrder.returnRequest.requestedAt).toLocaleDateString('vi-VN') : '—'}
                                    </strong>
                                </div>
                                <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                                    <span className="text-[10px] text-slate-400 block">2. Shop xét duyệt</span>
                                    <strong className="text-slate-800 text-[11px]">
                                        {selectedOrder.returnRequest?.reviewedAt ? new Date(selectedOrder.returnRequest.reviewedAt).toLocaleDateString('vi-VN') : 'Trong 24-48h'}
                                    </strong>
                                </div>
                                <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                                    <span className="text-[10px] text-slate-400 block">3. Mã gửi hàng</span>
                                    <strong className="text-indigo-700 text-[11px] truncate block">
                                        {selectedOrder.returnRequest?.returnTrackingNumber || 'Hạn 3-5 ngày'}
                                    </strong>
                                </div>
                                <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                                    <span className="text-[10px] text-slate-400 block">4. Hoàn tiền Ví</span>
                                    <strong className="text-emerald-700 text-[11px]">
                                        {selectedOrder.status === 'refunded' ? 'Đã hoàn tất' : 'Trong 1-3 ngày'}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        {/* Return Request Details */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-600 uppercase">Lý do từ khách hàng</span>
                                <span className="text-slate-400">
                                    {selectedOrder.returnRequest?.requestedAt 
                                        ? new Date(selectedOrder.returnRequest.requestedAt).toLocaleString('vi-VN')
                                        : ''}
                                </span>
                            </div>
                            <p className="text-sm font-medium text-slate-900 bg-white p-3 rounded-lg border border-slate-100">
                                "{selectedOrder.returnRequest?.reason || 'Chưa cung cấp lý do'}"
                            </p>

                            {/* Images */}
                            {selectedOrder.returnRequest?.images && selectedOrder.returnRequest.images.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-slate-600 uppercase mb-2">Ảnh bằng chứng từ khách</p>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {selectedOrder.returnRequest.images.map((img, idx) => (
                                            <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 shrink-0 hover:opacity-90">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={img} alt={`Evidence ${idx}`} className="w-full h-full object-cover" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* If Rejected */}
                            {selectedOrder.returnRequest?.status === 'rejected' && (
                                <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-rose-900 text-xs space-y-1">
                                    <p className="font-bold flex items-center gap-1">
                                        <XCircle className="w-4 h-4 text-rose-600" /> Lý do từ chối:
                                    </p>
                                    <p>{selectedOrder.returnRequest.rejectReason}</p>
                                </div>
                            )}
                        </div>

                        {/* Order Items */}
                        <div>
                            <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Sản phẩm trong đơn</h4>
                            <div className="space-y-2">
                                {selectedOrder.items.map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                                        <div className="w-12 h-12 bg-slate-200 rounded-lg overflow-hidden shrink-0">
                                            {item.product?.images?.[0] && (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 text-xs">
                                            <p className="font-semibold text-slate-800 truncate">{item.product.name}</p>
                                            <p className="text-slate-400">Size: {item.selectedSize} | Màu: {item.selectedColor.name} | x{item.quantity}</p>
                                        </div>
                                        <p className="font-bold text-xs text-slate-900">{(item.product.price * item.quantity).toLocaleString('vi-VN')}đ</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        {selectedOrder.returnRequest?.status === 'pending' && (
                            <div className="flex flex-wrap justify-end gap-2.5 pt-3 border-t border-slate-100">
                                <button
                                    onClick={() => handleOpenReview(selectedOrder, 'reject')}
                                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                    <X className="w-4 h-4" /> Từ chối
                                </button>
                                <button
                                    onClick={() => handleOpenReview(selectedOrder, 'approve')}
                                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Check className="w-4 h-4" /> Cho phép gửi hàng về (3-5 ngày)
                                </button>
                                <button
                                    onClick={() => handleOpenReview(selectedOrder, 'instant_refund')}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                                >
                                    ⚡ Hoàn tiền ngay vào Ví
                                </button>
                            </div>
                        )}
                        {selectedOrder.status === 'returning' && (
                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    onClick={() => handleOpenReview(selectedOrder, 'confirm_received')}
                                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                                >
                                    💰 Xác nhận đã nhận hàng & Hoàn tiền vào Ví
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Review Confirm Modal */}
            {reviewModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${
                                reviewAction === 'instant_refund' ? 'bg-emerald-100 text-emerald-700' :
                                reviewAction === 'approve' ? 'bg-indigo-100 text-indigo-700' : 
                                reviewAction === 'confirm_received' ? 'bg-teal-100 text-teal-700' : 
                                'bg-rose-100 text-rose-700'
                            }`}>
                                {reviewAction === 'reject' ? <X className="w-6 h-6" /> : <Check className="w-6 h-6" />}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    {reviewAction === 'instant_refund' ? '⚡ Duyệt & Hoàn tiền ngay vào Ví' :
                                     reviewAction === 'approve' ? 'Chấp thuận hoàn hàng' : 
                                     reviewAction === 'confirm_received' ? 'Xác nhận nhận hàng & Hoàn tiền' : 
                                     'Từ chối hoàn hàng'}
                                </h3>
                                <p className="text-xs text-slate-500">Đơn hàng #{selectedOrder.id} • Số tiền: {(selectedOrder.finalAmount || selectedOrder.totalAmount || 0).toLocaleString('vi-VN')} đ</p>
                            </div>
                        </div>

                        {reviewAction === 'instant_refund' ? (
                            <p className="text-xs text-slate-600 leading-relaxed bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200">
                                Hệ thống sẽ <strong>hoàn tiền ngay lập tức</strong> số tiền <strong>{(selectedOrder.finalAmount || selectedOrder.totalAmount || 0).toLocaleString('vi-VN')} đ</strong> vào <strong>Ví HAVEN</strong> của khách hàng. Khách có thể dùng số dư mua hàng hoặc rút về ngân hàng.
                            </p>
                        ) : reviewAction === 'approve' ? (
                            <p className="text-xs text-slate-600 leading-relaxed bg-indigo-50 p-3.5 rounded-2xl border border-indigo-200">
                                Khi chấp thuận, đơn hàng sẽ chuyển sang trạng thái <strong>Đang gửi hàng hoàn (returning)</strong> với thời hạn <strong>3–5 ngày</strong>. Khách hàng sẽ gửi sản phẩm về kho và cập nhật mã vận đơn. Tiền sẽ được hoàn sau khi shop nhận hàng.
                            </p>
                        ) : reviewAction === 'confirm_received' ? (
                            <p className="text-xs text-slate-600 leading-relaxed bg-teal-50 p-3.5 rounded-2xl border border-teal-200">
                                Xác nhận đã nhận lại kiện hàng vật lý. Hệ thống sẽ tự động hoàn <strong>{(selectedOrder.finalAmount || selectedOrder.totalAmount || 0).toLocaleString('vi-VN')} đ</strong> vào Ví HAVEN của khách hàng.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700">Lý do từ chối <span className="text-rose-500">*</span></label>
                                <textarea
                                    value={rejectReason}
                                    onChange={e => setRejectReason(e.target.value)}
                                    placeholder="Nhập lý do chi tiết từ chối yêu cầu của khách hàng..."
                                    rows={3}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setReviewModalOpen(false)}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleReviewSubmit}
                                disabled={submitting}
                                className={`px-4 py-2 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                                    reviewAction === 'instant_refund' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                    reviewAction === 'approve' ? 'bg-indigo-600 hover:bg-indigo-700' :
                                    reviewAction === 'confirm_received' ? 'bg-teal-600 hover:bg-teal-700' :
                                    'bg-rose-600 hover:bg-rose-700'
                                } disabled:opacity-50`}
                            >
                                {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                {reviewAction === 'instant_refund' ? 'Xác nhận Hoàn tiền ngay' :
                                 reviewAction === 'approve' ? 'Xác nhận Chấp thuận (Hạn 5 ngày)' : 
                                 reviewAction === 'confirm_received' ? 'Xác nhận Hoàn tiền' : 
                                 'Xác nhận Từ chối'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
