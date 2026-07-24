'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeftRight, Search, RefreshCw, Package,
    CheckCircle2, XCircle, AlertTriangle, ChevronLeft,
    ChevronRight, ShieldCheck, Boxes, X
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
    createdAt?: string;
}

interface ReturnResult {
    sku: string;
    productName: string;
    quantity: number;
    condition: string;
    availableAfter: number;
    damagedAfter: number;
}

const RETURN_REASONS = [
    'Khách đổi ý không muốn mua',
    'Sản phẩm bị lỗi / hư hỏng',
    'Sản phẩm không đúng mô tả',
    'Giao sai màu / sai size',
    'Giao hàng quá chậm',
    'Đặt nhầm sản phẩm',
];

const STATUS_BADGE: Record<string, string> = {
    shipped:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
    delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    refunded:  'bg-rose-500/10 text-rose-400 border-rose-500/20',
    processing:'bg-amber-500/10 text-amber-400 border-amber-500/20',
    cancelled: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const STATUS_LABEL: Record<string, string> = {
    shipped:   '🚚 Đang Giao',
    delivered: '✅ Đã Giao',
    refunded:  '↩️ Đã Hoàn',
    processing:'📦 Đã Duyệt',
    cancelled: '❌ Đã Hủy',
};

export default function ReturnManagementPage() {
    const [orders, setOrders]       = useState<ReturnOrder[]>([]);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState('');
    const [statusFilter, setStatusFilter] = useState('shipped');
    const [page, setPage]           = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal state
    const [selectedOrder, setSelectedOrder] = useState<ReturnOrder | null>(null);
    const [returnType, setReturnType]       = useState<'RETURN_GOOD' | 'RETURN_DAMAGE'>('RETURN_GOOD');
    const [returnReason, setReturnReason]   = useState('');
    const [customReason, setCustomReason]   = useState('');
    const [submitting, setSubmitting]       = useState(false);
    const [resultModal, setResultModal]     = useState<ReturnResult[] | null>(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (statusFilter) params.set('status', statusFilter);
            params.set('page', String(page));

            const res = await fetch(`/api/orders?${params}`);
            const data = await res.json();
            if (data.success) {
                // Lọc đơn hàng có thể hoàn (shipped, delivered, refunded)
                const returnable = (data.orders || []).filter((o: ReturnOrder) =>
                    ['shipped', 'delivered', 'refunded'].includes(o.status) ||
                    statusFilter === ''
                );
                setOrders(statusFilter ? returnable : data.orders);
                setTotalPages(Math.ceil((data.orders || []).length / 10) || 1);
            }
        } catch {
            toast.error('Không thể tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, page]);

    useEffect(() => {
        const t = setTimeout(() => fetchOrders(), 300);
        return () => clearTimeout(t);
    }, [fetchOrders]);

    const handleSubmitReturn = async () => {
        if (!selectedOrder) return;
        const finalReason = returnReason === 'Khác' ? customReason : returnReason;
        if (!finalReason.trim()) {
            toast.error('Vui lòng chọn lý do hoàn hàng');
            return;
        }
        setSubmitting(true);
        try {
            const returnItems = selectedOrder.items.map(it => ({
                sku: `${it.product?.id || 'PROD'}-${it.selectedColor?.name?.replace(/\s/g, '-') || ''}-${it.selectedSize || ''}`,
                quantity: it.quantity,
                isDamaged: returnType === 'RETURN_DAMAGE'
            }));

            const res = await fetch('/api/wms/return-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: selectedOrder.id,
                    returnItems,
                    returnType,
                    reason: finalReason,
                    user: 'Admin WMS'
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`✅ Đã xử lý hoàn hàng cho đơn #${selectedOrder.id}!`);
                setOrders(prev => prev.map(o =>
                    o.id === selectedOrder.id ? { ...o, status: 'refunded' } : o
                ));
                setResultModal(data.results);
                setSelectedOrder(null);
                setReturnReason('');
                setCustomReason('');
            } else {
                throw new Error(data.message);
            }
        } catch (err: any) {
            toast.error(err.message || 'Lỗi xử lý hoàn hàng');
        } finally {
            setSubmitting(false);
        }
    };

    const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';

    const filteredOrders = orders.filter(o =>
        (o.id || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.customerName || o.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.phone || '').includes(search)
    );

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-xl">
                <div>
                    <h1 className="text-xl font-black text-white flex items-center gap-2">
                        <ArrowLeftRight size={20} className="text-rose-400" />
                        Quản Lý Hoàn Hàng (Return Management)
                    </h1>
                    <p className="text-slate-400 text-xs mt-0.5">
                        Xử lý hoàn hàng nguyên vẹn (nhập lại kho) hoặc hàng hỏng (vào kho Damaged) • Lưu Audit Trail vĩnh viễn
                    </p>
                </div>
                <button
                    onClick={fetchOrders}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                >
                    <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Tải lại
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex items-center gap-2 bg-slate-900/70 rounded-xl px-4 py-2.5 border border-slate-800">
                    <Search size={14} className="text-slate-500 shrink-0" />
                    <input
                        type="text"
                        placeholder="Tìm theo Mã Đơn, Tên Khách, SĐT..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="flex-1 bg-transparent text-white placeholder-slate-500 text-xs focus:outline-none"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="bg-slate-900/70 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none cursor-pointer"
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="shipped">🚚 Đang giao hàng</option>
                    <option value="delivered">✅ Đã giao thành công</option>
                    <option value="refunded">↩️ Đã hoàn hàng</option>
                    <option value="processing">📦 Đã duyệt - Chờ giao</option>
                </select>
            </div>

            {/* Orders Table */}
            <div className="bg-slate-900/70 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                            <tr>
                                <th className="px-4 py-3">Mã Đơn</th>
                                <th className="px-4 py-3">Khách Hàng</th>
                                <th className="px-4 py-3">Sản Phẩm</th>
                                <th className="px-4 py-3">Tổng Tiền</th>
                                <th className="px-4 py-3">Trạng Thái</th>
                                <th className="px-4 py-3 text-center">Hành Động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 6 }).map((__, j) => (
                                            <td key={j} className="px-4 py-3">
                                                <div className="h-3 bg-slate-800 rounded animate-pulse" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                                        <ArrowLeftRight size={32} className="mx-auto mb-2 opacity-30" />
                                        <p>Không có đơn hàng nào trong trạng thái này</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order, idx) => (
                                    <motion.tr
                                        key={order._id || order.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.02 }}
                                        className="hover:bg-slate-800/40 transition-colors"
                                    >
                                        <td className="px-4 py-3 font-bold font-mono text-amber-400">{order.id}</td>
                                        <td className="px-4 py-3">
                                            <p className="text-white font-semibold">{order.customerName || order.name || 'Khách hàng'}</p>
                                            <p className="text-slate-500 text-[10px]">{order.phone}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            {order.items?.slice(0, 2).map((it, i) => (
                                                <p key={i} className="text-slate-300 text-[11px] line-clamp-1">
                                                    • {it.product?.name} | {it.selectedColor?.name} / {it.selectedSize} × {it.quantity}
                                                </p>
                                            ))}
                                            {(order.items?.length || 0) > 2 && (
                                                <p className="text-slate-500 text-[10px]">+{(order.items?.length || 0) - 2} sản phẩm khác</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-bold text-white">{formatVND(order.finalAmount || order.totalAmount || 0)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE[order.status] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                                {STATUS_LABEL[order.status] || order.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {order.status === 'refunded' ? (
                                                <span className="text-rose-400 text-[10px] font-bold">↩️ Đã Hoàn</span>
                                            ) : (
                                                <button
                                                    onClick={() => { setSelectedOrder(order); setReturnType('RETURN_GOOD'); setReturnReason(''); }}
                                                    className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-[11px] font-bold border border-rose-500/30 transition-all flex items-center gap-1 mx-auto"
                                                >
                                                    <ArrowLeftRight size={11} /> Xử Lý Hoàn
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

            {/* Return Processing Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedOrder(null)}
                            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-5 shadow-2xl"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                                <div>
                                    <h3 className="text-white font-bold text-base flex items-center gap-2">
                                        <ArrowLeftRight size={18} className="text-rose-400" />
                                        Xử Lý Hoàn Hàng
                                    </h3>
                                    <p className="text-amber-400 font-mono text-xs mt-0.5">{selectedOrder.id} • {selectedOrder.customerName || selectedOrder.name}</p>
                                </div>
                                <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white">
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Items Preview */}
                            <div className="bg-slate-950/50 rounded-2xl p-3 border border-slate-800 space-y-2">
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Sản phẩm trong đơn</p>
                                {selectedOrder.items?.map((it, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs">
                                        <div>
                                            <p className="text-white font-semibold">{it.product?.name}</p>
                                            <p className="text-slate-500 text-[10px]">{it.selectedColor?.name} / {it.selectedSize} × {it.quantity}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Condition Selection */}
                            <div className="space-y-2">
                                <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Tình trạng hàng hoàn về:</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setReturnType('RETURN_GOOD')}
                                        className={`p-4 rounded-2xl border-2 text-left transition-all ${returnType === 'RETURN_GOOD' ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                                    >
                                        <CheckCircle2 size={18} className={returnType === 'RETURN_GOOD' ? 'text-emerald-400' : 'text-slate-600'} />
                                        <p className="font-bold text-xs mt-2">✨ Nguyên Vẹn</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">Nhập lại kho Available<br/>Có thể bán tiếp</p>
                                    </button>
                                    <button
                                        onClick={() => setReturnType('RETURN_DAMAGE')}
                                        className={`p-4 rounded-2xl border-2 text-left transition-all ${returnType === 'RETURN_DAMAGE' ? 'bg-rose-500/15 border-rose-500 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                                    >
                                        <XCircle size={18} className={returnType === 'RETURN_DAMAGE' ? 'text-rose-400' : 'text-slate-600'} />
                                        <p className="font-bold text-xs mt-2">🚨 Lỗi / Hỏng</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">Chuyển kho Damaged<br/>Không thể bán lại</p>
                                    </button>
                                </div>
                            </div>

                            {/* Return Reason */}
                            <div className="space-y-2">
                                <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Lý do hoàn hàng:</label>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {RETURN_REASONS.map(r => (
                                        <button
                                            key={r}
                                            onClick={() => setReturnReason(r)}
                                            className={`px-2 py-1.5 rounded-xl text-[10px] font-semibold text-left transition-all ${returnReason === r ? 'bg-amber-500/20 border-amber-400 border text-amber-300' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setReturnReason('Khác')}
                                        className={`px-2 py-1.5 rounded-xl text-[10px] font-semibold text-left transition-all ${returnReason === 'Khác' ? 'bg-amber-500/20 border-amber-400 border text-amber-300' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                                    >
                                        Lý do khác...
                                    </button>
                                </div>
                                {returnReason === 'Khác' && (
                                    <textarea
                                        rows={2}
                                        placeholder="Ghi rõ lý do hoàn hàng..."
                                        value={customReason}
                                        onChange={e => setCustomReason(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs placeholder-slate-600 focus:outline-none mt-1"
                                    />
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmitReturn}
                                disabled={submitting || !returnReason}
                                className="w-full h-12 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white shadow-rose-500/20"
                            >
                                {submitting ? <RefreshCw size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                                Xác Nhận Hoàn Hàng & Cập Nhật Tồn Kho Kho
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Result Modal */}
            <AnimatePresence>
                {resultModal && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setResultModal(null)}
                            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <h3 className="text-white font-bold text-base flex items-center gap-2">
                                    <ShieldCheck size={18} className="text-emerald-400" />
                                    Kết Quả Cập Nhật Tồn Kho
                                </h3>
                                <button onClick={() => setResultModal(null)} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                {resultModal.map((r, i) => (
                                    <div key={i} className="bg-slate-950/70 rounded-xl p-3 border border-slate-800">
                                        <p className="text-white font-bold text-xs">{r.productName}</p>
                                        <p className="text-amber-400 font-mono text-[10px]">{r.sku}</p>
                                        <div className="mt-2 flex gap-3 text-[10px]">
                                            <div className="flex-1">
                                                <p className="text-slate-500">Tồn khả dụng mới:</p>
                                                <p className="text-emerald-400 font-black text-sm">{r.availableAfter} sp</p>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-slate-500">Kho hỏng mới:</p>
                                                <p className="text-rose-400 font-black text-sm">{r.damagedAfter} sp</p>
                                            </div>
                                        </div>
                                        <p className={`mt-1.5 text-[10px] font-bold ${r.condition.includes('NGUYÊN') ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {r.condition}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setResultModal(null)}
                                className="w-full h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs transition-all"
                            >
                                ✅ Đã Hiểu, Đóng
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
