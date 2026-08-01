'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeftRight, Search, RefreshCw, Package,
    CheckCircle2, XCircle, AlertTriangle, ShieldCheck, X, Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ReturnOrder {
    _id: string;
    id: string;
    customerName?: string;
    name?: string;
    phone: string;
    address: string;
    finalAmount?: number;
    totalAmount?: number;
    status: string;
    items: Array<{
        product: { id: string; name: string; images?: string[] };
        selectedSize: string;
        selectedColor: { name: string; hex?: string };
        quantity: number;
    }>;
    returnRequest?: {
        status?: 'none' | 'pending' | 'approved' | 'rejected';
        reason?: string;
        images?: string[];
        requestedAt?: string;
        rejectReason?: string;
    };
    createdAt?: string;
}

const STATUS_BADGE: Record<string, string> = {
    return_requested: 'bg-amber-50 text-amber-700 border-amber-300 font-bold',
    shipped:          'bg-blue-50 text-blue-700 border-blue-200',
    delivered:        'bg-emerald-50 text-emerald-700 border-emerald-200',
    refunded:         'bg-rose-50 text-rose-700 border-rose-200',
    processing:       'bg-amber-50 text-amber-700 border-amber-200',
    cancelled:        'bg-gray-100 text-gray-600 border-gray-200',
};

const STATUS_LABEL: Record<string, string> = {
    return_requested: '⏳ Chờ Admin Duyệt Hoàn',
    shipped:          '🚚 Đang Giao',
    delivered:        '✅ Đã Giao (Thành công)',
    refunded:         '↩️ Đã Hoàn Hàng',
    processing:       '📦 Đang Xử Lý',
    cancelled:        '❌ Đã Hủy',
};

export default function ReturnManagementPage() {
    const [orders, setOrders]             = useState<ReturnOrder[]>([]);
    const [loading, setLoading]           = useState(true);
    const [search, setSearch]             = useState('');
    const [statusFilter, setStatusFilter] = useState('return_requested');
    const [selectedOrder, setSelectedOrder] = useState<ReturnOrder | null>(null);
    const [returnType, setReturnType]     = useState<'RETURN_GOOD' | 'RETURN_DAMAGE'>('RETURN_GOOD');
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [submitting, setSubmitting]     = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            params.set('t', Date.now().toString());
            const res = await fetch(`/api/orders?${params}`);
            const data = await res.json();
            if (data.success) {
                const all = data.orders || [];
                const sorted = [...all].sort((a, b) => (a.status === 'return_requested' ? -1 : 1));
                setOrders(sorted);
            }
        } catch {
            toast.error('Không thể tải danh sách đơn hàng hoàn');
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        const t = setTimeout(() => fetchOrders(), 300);
        return () => clearTimeout(t);
    }, [fetchOrders]);

    useEffect(() => {
        const interval = setInterval(() => fetchOrders(), 15000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const handleReviewReturn = async (action: 'approve' | 'reject') => {
        if (!selectedOrder) return;
        if (action === 'reject' && !rejectReason.trim()) {
            toast.error('Vui lòng nhập lý do từ chối để thông báo cho khách hàng');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/wms/review-return-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: selectedOrder.id,
                    action,
                    returnType,
                    rejectReason,
                    adminName: 'Admin WMS'
                })
            });
            const data = await res.json();
            if (data.success) {
                if (action === 'approve') {
                    toast.success(`✅ ĐÃ DUYỆT hoàn hàng cho đơn #${selectedOrder.id}! Hàng đã được nhập kho.`);
                    setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'refunded' } : o));
                } else {
                    toast.success(`❌ Đã TỪ CHỐI yêu cầu hoàn đơn #${selectedOrder.id}.`);
                    setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'delivered' } : o));
                }
                setSelectedOrder(null);
                setShowRejectForm(false);
                setRejectReason('');
            } else {
                throw new Error(data.message);
            }
        } catch (err: any) {
            toast.error(err.message || 'Lỗi xử lý duyệt yêu cầu');
        } finally {
            setSubmitting(false);
        }
    };

    const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';

    const filteredOrders = orders.filter(o => {
        const matchSearch =
            (o.id || '').toLowerCase().includes(search.toLowerCase()) ||
            (o.customerName || o.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (o.phone || '').includes(search);

        if (statusFilter === 'return_requested') return matchSearch && (o.status === 'return_requested' || o.returnRequest?.status === 'pending');
        if (statusFilter) return matchSearch && o.status === statusFilter;
        return matchSearch;
    });

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border shadow-sm"
                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <div>
                    <h1 className="text-xl font-black flex items-center gap-2" style={{ color: 'var(--adm-text)' }}>
                        <ArrowLeftRight size={20} className="text-rose-500" />
                        Duyệt Yêu Cầu Hoàn Hàng (Return Approval)
                    </h1>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                        Kiểm tra hình ảnh bằng chứng khách gửi → Duyệt nhập kho hoặc Từ chối kèm lý do
                    </p>
                </div>
                <button
                    onClick={fetchOrders}
                    className="px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5"
                    style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                >
                    <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Tải lại
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex items-center gap-2 rounded-xl px-4 py-2.5 border"
                    style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                    <Search size={14} className="shrink-0" style={{ color: 'var(--adm-text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Tìm theo Mã Đơn, Tên Khách, SĐT..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="flex-1 bg-transparent text-xs focus:outline-none"
                        style={{ color: 'var(--adm-text)' }}
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="border rounded-xl px-3 py-2.5 text-xs focus:outline-none cursor-pointer"
                    style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                >
                    <option value="return_requested">⏳ Đơn chờ Admin duyệt ({orders.filter(o => o.status === 'return_requested').length})</option>
                    <option value="refunded">↩️ Đã hoàn hàng / Nhập kho</option>
                    <option value="delivered">✅ Đã giao hàng</option>
                    <option value="">Tất cả trạng thái</option>
                </select>
            </div>

            {/* Table */}
            <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="text-[10px] font-bold uppercase tracking-wider border-b"
                            style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' }}>
                            <tr>
                                <th className="px-4 py-3">Mã Đơn</th>
                                <th className="px-4 py-3">Khách Hàng</th>
                                <th className="px-4 py-3">Ảnh Bằng Chứng</th>
                                <th className="px-4 py-3">Tổng Tiền</th>
                                <th className="px-4 py-3">Trạng Thái</th>
                                <th className="px-4 py-3 text-center">Hành Động Admin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b" style={{ borderColor: 'var(--adm-border)' }}>
                                        {Array.from({ length: 6 }).map((__, j) => (
                                            <td key={j} className="px-4 py-3">
                                                <div className="h-3 rounded animate-pulse" style={{ backgroundColor: 'var(--adm-surface-2)' }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center" style={{ color: 'var(--adm-text-muted)' }}>
                                        <ArrowLeftRight size={32} className="mx-auto mb-2 opacity-30" />
                                        <p>Không có đơn hoàn hàng nào trong mục này</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order, idx) => (
                                    <motion.tr
                                        key={order._id || order.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.02 }}
                                        className="border-b last:border-0 transition-colors hover:bg-black/[0.02]"
                                        style={{ borderColor: 'var(--adm-border)' }}
                                    >
                                        <td className="px-4 py-3 font-bold font-mono text-amber-600">{order.id}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-semibold" style={{ color: 'var(--adm-text)' }}>{order.customerName || order.name || 'Khách hàng'}</p>
                                            <p className="text-[10px]" style={{ color: 'var(--adm-text-muted)' }}>{order.phone}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            {order.returnRequest?.images && order.returnRequest.images.length > 0 ? (
                                                <div className="flex gap-1.5">
                                                    {order.returnRequest.images.slice(0, 3).map((img, i) => (
                                                        <div key={i}
                                                            onClick={() => setPreviewImage(img)}
                                                            className="w-10 h-10 rounded-lg border overflow-hidden cursor-pointer transition-all relative group"
                                                            style={{ borderColor: 'var(--adm-border)' }}
                                                        >
                                                            <img src={img} alt="Proof" className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                                                <Eye size={10} className="text-white" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {order.returnRequest.images.length > 3 && (
                                                        <div className="w-10 h-10 rounded-lg border flex items-center justify-center text-[10px] font-bold"
                                                            style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' }}>
                                                            +{order.returnRequest.images.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] italic" style={{ color: 'var(--adm-text-subtle)' }}>Chưa có ảnh</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-bold" style={{ color: 'var(--adm-text)' }}>{formatVND(order.finalAmount || order.totalAmount || 0)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                {STATUS_LABEL[order.status] || order.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {order.status === 'return_requested' ? (
                                                <button
                                                    onClick={() => { setSelectedOrder(order); setReturnType('RETURN_GOOD'); setShowRejectForm(false); }}
                                                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition-all flex items-center gap-1 mx-auto shadow-sm"
                                                >
                                                    🔍 Xem Bằng Chứng & Duyệt
                                                </button>
                                            ) : order.status === 'refunded' ? (
                                                <span className="text-rose-600 text-[10px] font-bold">↩️ Đã Duyệt Hoàn</span>
                                            ) : (
                                                <button
                                                    onClick={() => { setSelectedOrder(order); setReturnType('RETURN_GOOD'); setShowRejectForm(false); }}
                                                    className="px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1 mx-auto"
                                                    style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                                                >
                                                    <Eye size={12} /> Chi tiết
                                                </button>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Review Modal */}
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
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xl max-h-[90vh] overflow-y-auto border rounded-2xl p-6 space-y-5 shadow-2xl"
                            style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                        >
                            <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--adm-border)' }}>
                                <div>
                                    <h3 className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--adm-text)' }}>
                                        <ShieldCheck size={18} className="text-amber-500" />
                                        Xem Xét Yêu Cầu Hoàn Hàng — Đơn #{selectedOrder.id}
                                    </h3>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>{selectedOrder.customerName || selectedOrder.name} • {selectedOrder.phone}</p>
                                </div>
                                <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-full border flex items-center justify-center"
                                    style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' }}>
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Proof Images */}
                            <div className="rounded-xl p-4 border space-y-3" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                                <p className="text-amber-600 text-xs font-bold uppercase tracking-wider">📸 Hình Ảnh Bằng Chứng Khách Hàng Chụp:</p>
                                {selectedOrder.returnRequest?.images && selectedOrder.returnRequest.images.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        {selectedOrder.returnRequest.images.map((img, i) => (
                                            <div key={i} onClick={() => setPreviewImage(img)} className="h-24 rounded-xl border overflow-hidden cursor-pointer hover:border-amber-400 transition-all"
                                                style={{ borderColor: 'var(--adm-border)' }}>
                                                <img src={img} alt="Proof" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs italic" style={{ color: 'var(--adm-text-muted)' }}>Khách hàng chưa tải lên hình ảnh bằng chứng.</p>
                                )}

                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--adm-text-muted)' }}>Lý do hoàn hàng:</p>
                                    <p className="text-xs p-2.5 rounded-xl border" style={{ color: 'var(--adm-text)', backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                                        {selectedOrder.returnRequest?.reason || 'Chưa cung cấp lý do'}
                                    </p>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="rounded-xl p-3 border space-y-2" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--adm-text-muted)' }}>Sản phẩm trong đơn</p>
                                {selectedOrder.items?.map((it, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs">
                                        <div>
                                            <p className="font-semibold" style={{ color: 'var(--adm-text)' }}>{it.product?.name}</p>
                                            <p className="text-[10px]" style={{ color: 'var(--adm-text-muted)' }}>{it.selectedColor?.name} / {it.selectedSize} × {it.quantity}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Approval Options */}
                            {selectedOrder.status === 'return_requested' && !showRejectForm && (
                                <div className="space-y-3 pt-2">
                                    <p className="text-xs font-bold uppercase" style={{ color: 'var(--adm-text-muted)' }}>1. Chọn loại nhập kho nếu Duyệt:</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setReturnType('RETURN_GOOD')}
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${returnType === 'RETURN_GOOD' ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'border'}`}
                                            style={returnType !== 'RETURN_GOOD' ? { backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' } : {}}
                                        >
                                            <CheckCircle2 size={16} className={returnType === 'RETURN_GOOD' ? 'text-emerald-500' : ''} style={returnType !== 'RETURN_GOOD' ? { color: 'var(--adm-text-muted)' } : {}} />
                                            <p className="font-bold text-xs mt-1">✨ Hàng Nguyên Vẹn</p>
                                            <p className="text-[10px]" style={{ color: 'var(--adm-text-muted)' }}>Cộng kho Available</p>
                                        </button>
                                        <button
                                            onClick={() => setReturnType('RETURN_DAMAGE')}
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${returnType === 'RETURN_DAMAGE' ? 'bg-rose-50 border-rose-400 text-rose-700' : 'border'}`}
                                            style={returnType !== 'RETURN_DAMAGE' ? { backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' } : {}}
                                        >
                                            <XCircle size={16} className={returnType === 'RETURN_DAMAGE' ? 'text-rose-500' : ''} style={returnType !== 'RETURN_DAMAGE' ? { color: 'var(--adm-text-muted)' } : {}} />
                                            <p className="font-bold text-xs mt-1">🚨 Hàng Lỗi / Hỏng</p>
                                            <p className="text-[10px]" style={{ color: 'var(--adm-text-muted)' }}>Cộng kho Damaged</p>
                                        </button>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => setShowRejectForm(true)}
                                            className="flex-1 h-12 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs"
                                        >
                                            ❌ Từ Chối Yêu Cầu
                                        </button>
                                        <button
                                            onClick={() => handleReviewReturn('approve')}
                                            disabled={submitting}
                                            className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 disabled:opacity-40"
                                        >
                                            {submitting ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                            ✅ Duyệt Hoàn Hàng & Cập Nhật Kho
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Reject Form */}
                            {showRejectForm && (
                                <div className="space-y-3 pt-2">
                                    <label className="text-rose-600 text-xs font-bold uppercase block">Nhập lý do từ chối yêu cầu hoàn hàng *</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Ví dụ: Hình ảnh chụp không rõ ràng, sản phẩm đã qua sử dụng quá 7 ngày..."
                                        value={rejectReason}
                                        onChange={e => setRejectReason(e.target.value)}
                                        className="w-full border border-rose-300 rounded-xl p-3 text-xs focus:outline-none resize-none"
                                        style={{ backgroundColor: 'var(--adm-surface-2)', color: 'var(--adm-text)' }}
                                    />
                                    <div className="flex gap-3">
                                        <button onClick={() => setShowRejectForm(false)} className="flex-1 h-10 rounded-xl border text-xs font-bold"
                                            style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}>
                                            Quay lại
                                        </button>
                                        <button
                                            onClick={() => handleReviewReturn('reject')}
                                            disabled={submitting || !rejectReason.trim()}
                                            className="flex-1 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-40"
                                        >
                                            {submitting ? '...' : 'Xác Nhận Từ Chối'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Image Preview Lightbox */}
            <AnimatePresence>
                {previewImage && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setPreviewImage(null)}
                            className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 cursor-pointer"
                        >
                            <img src={previewImage} alt="Preview Proof" className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl" />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
