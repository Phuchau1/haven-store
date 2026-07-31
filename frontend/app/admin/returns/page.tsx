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
    reviewedAt?: string;
    reviewedBy?: string;
    rejectReason?: string;
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
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
    
    // Modal states
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
    const [rejectReason, setRejectReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
    });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    const fetchReturns = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/orders/returns?status=${filterStatus}`);
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
    }, [API_URL, filterStatus]);

    useEffect(() => {
        fetchReturns();
    }, [fetchReturns]);

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 4000);
    };

    const handleOpenReview = (order: OrderData, action: 'approve' | 'reject') => {
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
            const res = await fetch(`${API_URL}/orders/return-request/${selectedOrder.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: reviewAction,
                    rejectReason: rejectReason.trim(),
                    adminName: 'Admin'
                })
            });

            const data = await res.json();
            if (data.success) {
                showToast(reviewAction === 'approve' ? 'Đã duyệt hoàn hàng thành công' : 'Đã từ chối hoàn hàng', 'success');
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
            (o.returnRequest?.reason || '').toLowerCase().includes(q)
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
                        Quản lý Hoàn Hàng & Trả Tiền
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Duyệt các yêu cầu hoàn hàng từ khách hàng và quản lý tiến trình</p>
                </div>
                <button
                    onClick={fetchReturns}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors w-fit"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
                        <span>Tổng yêu cầu</span>
                        <RotateCcw className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</p>
                </div>
                <div 
                    onClick={() => setFilterStatus('pending')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-sm ${
                        filterStatus === 'pending' ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20' : 'bg-white border-slate-200 hover:border-amber-200'
                    }`}
                >
                    <div className="flex items-center justify-between text-amber-700 text-xs font-semibold uppercase">
                        <span>Chờ duyệt</span>
                        <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                    <p className="text-2xl font-bold text-amber-900 mt-2">{stats.pending}</p>
                </div>
                <div 
                    onClick={() => setFilterStatus('approved')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-sm ${
                        filterStatus === 'approved' ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/20' : 'bg-white border-slate-200 hover:border-emerald-200'
                    }`}
                >
                    <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold uppercase">
                        <span>Đã chấp thuận</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-2xl font-bold text-emerald-900 mt-2">{stats.approved}</p>
                </div>
                <div 
                    onClick={() => setFilterStatus('rejected')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-sm ${
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
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                    {[
                        { id: 'pending', label: `Chờ duyệt (${stats.pending})` },
                        { id: 'approved', label: `Đã duyệt (${stats.approved})` },
                        { id: 'rejected', label: `Từ chối (${stats.rejected})` },
                        { id: 'all', label: `Tất cả (${stats.total})` }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterStatus(tab.id as any)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
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
                        placeholder="Tìm theo mã đơn, tên, SĐT..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                                <th className="p-4">Mã đơn hàng</th>
                                <th className="p-4">Khách hàng</th>
                                <th className="p-4">Lý do hoàn</th>
                                <th className="p-4">Số tiền</th>
                                <th className="p-4">Ngày yêu cầu</th>
                                <th className="p-4">Trạng thái</th>
                                <th className="p-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400">
                                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                                        Đang tải danh sách...
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400">
                                        <RotateCcw className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                        Không có yêu cầu hoàn hàng nào
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => {
                                    const req = order.returnRequest;
                                    const isPending = req?.status === 'pending';
                                    const isApproved = req?.status === 'approved';
                                    const isRejected = req?.status === 'rejected';

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
                                                    {req?.reason || '—'}
                                                </div>
                                                {req?.images && req.images.length > 0 && (
                                                    <div className="flex items-center gap-1 mt-1 text-[10px] text-indigo-600 font-semibold">
                                                        <ImageIcon className="w-3 h-3" />
                                                        {req.images.length} ảnh bằng chứng
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 font-bold text-slate-900">
                                                {(order.finalAmount || order.totalAmount || 0).toLocaleString('vi-VN')}đ
                                            </td>
                                            <td className="p-4 text-slate-500">
                                                {req?.requestedAt 
                                                    ? new Date(req.requestedAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
                                                    : '—'}
                                            </td>
                                            <td className="p-4">
                                                {isPending && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                        <Clock className="w-3 h-3" /> Chờ duyệt
                                                    </span>
                                                )}
                                                {isApproved && (
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
                                                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {isPending && (
                                                        <>
                                                            <button
                                                                onClick={() => handleOpenReview(order, 'approve')}
                                                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors flex items-center gap-1"
                                                            >
                                                                <Check className="w-3.5 h-3.5" /> Duyệt
                                                            </button>
                                                            <button
                                                                onClick={() => handleOpenReview(order, 'reject')}
                                                                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-colors flex items-center gap-1"
                                                            >
                                                                <X className="w-3.5 h-3.5" /> Từ chối
                                                            </button>
                                                        </>
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

            {/* Detail Drawer / Modal */}
            {selectedOrder && !reviewModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Chi tiết Yêu cầu Hoàn hàng #{selectedOrder.id}</h3>
                                <p className="text-xs text-slate-500">Khách hàng: {selectedOrder.customerName} - {selectedOrder.phone}</p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
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
                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    onClick={() => handleOpenReview(selectedOrder, 'reject')}
                                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                                >
                                    <X className="w-4 h-4" /> Từ chối yêu cầu
                                </button>
                                <button
                                    onClick={() => handleOpenReview(selectedOrder, 'approve')}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                                >
                                    <Check className="w-4 h-4" /> Chấp thuận & Cho phép trả
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Review Confirm Modal */}
            {reviewModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${reviewAction === 'approve' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {reviewAction === 'approve' ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    {reviewAction === 'approve' ? 'Chấp thuận hoàn hàng' : 'Từ chối hoàn hàng'}
                                </h3>
                                <p className="text-xs text-slate-500">Đơn hàng #{selectedOrder.id}</p>
                            </div>
                        </div>

                        {reviewAction === 'approve' ? (
                            <p className="text-xs text-slate-600 leading-relaxed bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                                Khi chấp thuận, đơn hàng sẽ chuyển sang trạng thái <strong>Đang gửi hàng trả (returning)</strong>. Khách hàng sẽ nhận thông báo gửi sản phẩm về shop.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700">Lý do từ chối <span className="text-rose-500">*</span></label>
                                <textarea
                                    value={rejectReason}
                                    onChange={e => setRejectReason(e.target.value)}
                                    placeholder="Nhập lý do chi tiết từ chối yêu cầu của khách hàng..."
                                    rows={3}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setReviewModalOpen(false)}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleReviewSubmit}
                                disabled={submitting}
                                className={`px-4 py-2 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 ${
                                    reviewAction === 'approve'
                                    ? 'bg-emerald-600 hover:bg-emerald-700'
                                    : 'bg-rose-600 hover:bg-rose-700'
                                } disabled:opacity-50`}
                            >
                                {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                {reviewAction === 'approve' ? 'Xác nhận Chấp thuận' : 'Xác nhận Từ chối'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
