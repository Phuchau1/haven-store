'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingCart, Plus, Eye, CheckCircle, XCircle, Truck,
    RefreshCw, Search, ChevronLeft, ChevronRight, X,
    Package, Building2, Calendar, CreditCard, ClipboardList
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PurchaseOrder {
    _id: string;
    id?: string;
    supplier?: { _id?: string; name?: string; phone?: string; email?: string };
    supplier_id?: string;
    expectedDate?: string;
    expected_date?: string;
    totalAmount?: number;
    total_amount?: number;
    status: string;
    notes?: string;
    items?: Array<{ sku: string; quantity: number; unitPrice: number; productName?: string }>;
    createdAt?: string;
}

interface Supplier {
    _id: string;
    name: string;
    phone?: string;
    email?: string;
}

const STATUS_COLORS: Record<string, string> = {
    draft:     'bg-slate-500/20 text-slate-300 border-slate-500/30',
    pending:   'bg-amber-500/20 text-amber-300 border-amber-500/30',
    confirmed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    received:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    cancelled: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};
const STATUS_LABEL: Record<string, string> = {
    draft:     '📝 Nháp',
    pending:   '⏳ Chờ Duyệt',
    confirmed: '✅ Đã Duyệt',
    received:  '📦 Đã Nhận Hàng',
    cancelled: '❌ Đã Hủy',
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
    draft:     ['pending', 'cancelled'],
    pending:   ['confirmed', 'cancelled'],
    confirmed: ['received', 'cancelled'],
    received:  [],
    cancelled: [],
};

export default function PurchaseOrdersPage() {
    const [orders, setOrders]       = useState<PurchaseOrder[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage]           = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Create modal
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating]     = useState(false);
    const [form, setForm]             = useState({
        supplier_id: '',
        expectedDate: '',
        notes: '',
        items: [{ sku: '', productName: '', quantity: 1, unitPrice: 0 }]
    });

    // Detail modal
    const [detailOrder, setDetailOrder] = useState<PurchaseOrder | null>(null);
    const [updatingId, setUpdatingId]   = useState<string | null>(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (statusFilter) params.set('status', statusFilter);
            params.set('page', String(page));
            const res = await fetch(`/api/purchase-orders?${params}`);
            const data = await res.json();
            if (data.success) {
                setOrders(data.data || []);
                setTotalPages(data.totalPages || 1);
            }
        } catch {
            toast.error('Không thể tải đơn mua hàng');
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, page]);

    const fetchSuppliers = useCallback(async () => {
        try {
            const res = await fetch('/api/suppliers');
            const data = await res.json();
            if (data.success) setSuppliers(data.data || []);
        } catch {
            console.error('Cannot fetch suppliers');
        }
    }, []);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    useEffect(() => {
        const t = setTimeout(() => fetchOrders(), 300);
        return () => clearTimeout(t);
    }, [fetchOrders]);

    const handleAddItem = () => {
        setForm(f => ({ ...f, items: [...f.items, { sku: '', productName: '', quantity: 1, unitPrice: 0 }] }));
    };

    const handleItemChange = (i: number, field: string, value: string | number) => {
        setForm(f => {
            const items = [...f.items];
            items[i] = { ...items[i], [field]: value };
            return { ...f, items };
        });
    };

    const removeItem = (i: number) => {
        setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
    };

    const calcTotal = () => form.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);

    const handleCreate = async () => {
        if (!form.supplier_id) { toast.error('Chọn nhà cung cấp'); return; }
        if (form.items.some(it => !it.sku.trim() || it.quantity < 1)) {
            toast.error('Điền đầy đủ SKU & số lượng');
            return;
        }
        setCreating(true);
        try {
            const res = await fetch('/api/purchase-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplierId: form.supplier_id,
                    expectedDate: form.expectedDate,
                    notes: form.notes,
                    items: form.items.map(it => ({
                        sku: it.sku,
                        productName: it.productName || it.sku,
                        quantity: Number(it.quantity),
                        unitPrice: Number(it.unitPrice)
                    })),
                    totalAmount: calcTotal()
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('✅ Đã tạo đơn mua hàng!');
                setShowCreate(false);
                setForm({ supplier_id: '', expectedDate: '', notes: '', items: [{ sku: '', productName: '', quantity: 1, unitPrice: 0 }] });
                fetchOrders();
            } else {
                throw new Error(data.message);
            }
        } catch (err: any) {
            toast.error(err.message || 'Lỗi tạo đơn');
        } finally {
            setCreating(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        setUpdatingId(id);
        try {
            const res = await fetch(`/api/purchase-orders/status?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`✅ Cập nhật trạng thái → ${STATUS_LABEL[status]}`);
                setOrders(prev => prev.map(o =>
                    (o._id === id || o.id === id) ? { ...o, status } : o
                ));
                if (detailOrder && (detailOrder._id === id || detailOrder.id === id)) {
                    setDetailOrder(prev => prev ? { ...prev, status } : null);
                }
            } else {
                throw new Error(data.message);
            }
        } catch (err: any) {
            toast.error(err.message || 'Lỗi cập nhật');
        } finally {
            setUpdatingId(null);
        }
    };

    const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';

    const filteredOrders = orders.filter(o => {
        const s = search.toLowerCase();
        return (
            (o.id || o._id || '').toLowerCase().includes(s) ||
            (o.supplier?.name || '').toLowerCase().includes(s) ||
            (o.notes || '').toLowerCase().includes(s)
        );
    });

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-xl">
                <div>
                    <h1 className="text-xl font-black text-white flex items-center gap-2">
                        <ShoppingCart size={20} className="text-sky-400" />
                        Đơn Mua Hàng (Purchase Orders)
                    </h1>
                    <p className="text-slate-400 text-xs mt-0.5">
                        Tạo PO từ nhà cung cấp → Phiếu Nhập kho tự động khi nhận hàng
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchOrders} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700">
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Tải lại
                    </button>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-sky-500/20"
                    >
                        <Plus size={14} /> Tạo Đơn Mới
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Tổng đơn', value: orders.length, color: 'text-white' },
                    { label: 'Chờ duyệt', value: orders.filter(o => o.status === 'pending').length, color: 'text-amber-400' },
                    { label: 'Đã xác nhận', value: orders.filter(o => o.status === 'confirmed').length, color: 'text-blue-400' },
                    { label: 'Đã nhận hàng', value: orders.filter(o => o.status === 'received').length, color: 'text-emerald-400' },
                ].map((s, i) => (
                    <div key={i} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 text-center">
                        <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex items-center gap-2 bg-slate-900/70 rounded-xl px-4 py-2.5 border border-slate-800">
                    <Search size={14} className="text-slate-500 shrink-0" />
                    <input
                        type="text"
                        placeholder="Tìm theo Mã PO, Nhà Cung Cấp..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="flex-1 bg-transparent text-white placeholder-slate-500 text-xs focus:outline-none"
                    />
                    {search && <button onClick={() => setSearch('')} className="text-slate-500 hover:text-white"><X size={12} /></button>}
                </div>
                <select
                    value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                    className="bg-slate-900/70 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none cursor-pointer"
                >
                    <option value="">Tất cả trạng thái</option>
                    {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="bg-slate-900/70 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                            <tr>
                                <th className="px-4 py-3">Mã PO</th>
                                <th className="px-4 py-3">Nhà Cung Cấp</th>
                                <th className="px-4 py-3">Ngày Dự Nhận</th>
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
                                        <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                                        <p>Không có đơn mua hàng nào</p>
                                        <button onClick={() => setShowCreate(true)} className="mt-3 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs rounded-xl font-bold">
                                            + Tạo đơn đầu tiên
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order, idx) => {
                                    const oid = order._id || order.id || '';
                                    const nexts = STATUS_TRANSITIONS[order.status] || [];
                                    return (
                                        <motion.tr
                                            key={oid}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: idx * 0.02 }}
                                            className="hover:bg-slate-800/40 transition-colors"
                                        >
                                            <td className="px-4 py-3 font-bold font-mono text-sky-400">
                                                {order.id || oid.slice(-8).toUpperCase()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-white font-semibold">{order.supplier?.name || '—'}</p>
                                                <p className="text-slate-500 text-[10px]">{order.supplier?.phone || ''}</p>
                                            </td>
                                            <td className="px-4 py-3 text-slate-300">
                                                {order.expectedDate || order.expected_date
                                                    ? new Date(order.expectedDate || order.expected_date!).toLocaleDateString('vi-VN')
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3 font-bold text-white">{formatVND(order.totalAmount || order.total_amount || 0)}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLORS[order.status] || 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                                                    {STATUS_LABEL[order.status] || order.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => setDetailOrder(order)}
                                                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                                                    >
                                                        <Eye size={13} />
                                                    </button>
                                                    {nexts.map(s => (
                                                        <button
                                                            key={s}
                                                            onClick={() => updateStatus(oid, s)}
                                                            disabled={updatingId === oid}
                                                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                                                s === 'cancelled' ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30' :
                                                                s === 'received'  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30' :
                                                                'bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/30'
                                                            } disabled:opacity-40`}
                                                        >
                                                            {updatingId === oid ? '...' : STATUS_LABEL[s]}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="px-3 py-1.5 bg-slate-800 rounded-lg text-slate-300 text-xs disabled:opacity-40 flex items-center gap-1">
                        <ChevronLeft size={13} /> Trước
                    </button>
                    <span className="text-slate-400 text-xs">Trang {page}/{totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="px-3 py-1.5 bg-slate-800 rounded-lg text-slate-300 text-xs disabled:opacity-40 flex items-center gap-1">
                        Tiếp <ChevronRight size={13} />
                    </button>
                </div>
            )}

            {/* Create Order Modal */}
            <AnimatePresence>
                {showCreate && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowCreate(false)}
                            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-5 shadow-2xl"
                        >
                            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                                <h3 className="text-white font-bold text-base flex items-center gap-2">
                                    <ShoppingCart size={18} className="text-sky-400" /> Tạo Đơn Mua Hàng Mới
                                </h3>
                                <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white">
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Supplier Select */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-slate-400 text-xs font-bold flex items-center gap-1"><Building2 size={12} /> Nhà Cung Cấp *</label>
                                    <select
                                        value={form.supplier_id}
                                        onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value }))}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
                                    >
                                        <option value="">-- Chọn nhà cung cấp --</option>
                                        {suppliers.map(s => (
                                            <option key={s._id} value={s._id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-slate-400 text-xs font-bold flex items-center gap-1"><Calendar size={12} /> Ngày Dự Nhận Hàng</label>
                                    <input
                                        type="date"
                                        value={form.expectedDate}
                                        onChange={e => setForm(f => ({ ...f, expectedDate: e.target.value }))}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-1.5">
                                <label className="text-slate-400 text-xs font-bold">Ghi Chú</label>
                                <textarea
                                    rows={2}
                                    value={form.notes}
                                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                    placeholder="Ghi chú cho đơn mua hàng này..."
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none"
                                />
                            </div>

                            {/* Items */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-slate-400 text-xs font-bold flex items-center gap-1"><Package size={12} /> Sản Phẩm Đặt Mua *</label>
                                    <button
                                        onClick={handleAddItem}
                                        className="px-2 py-1 rounded-lg bg-sky-500/20 text-sky-400 text-[10px] font-bold border border-sky-500/30 hover:bg-sky-500/30 flex items-center gap-1"
                                    >
                                        <Plus size={11} /> Thêm dòng
                                    </button>
                                </div>
                                <div className="bg-slate-950/50 rounded-2xl border border-slate-800 overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-950 text-slate-500 uppercase text-[9px] tracking-wider">
                                            <tr>
                                                <th className="px-3 py-2 text-left">SKU</th>
                                                <th className="px-3 py-2 text-left">Tên SP</th>
                                                <th className="px-3 py-2 text-center">SL</th>
                                                <th className="px-3 py-2 text-right">Đơn Giá</th>
                                                <th className="px-3 py-2 text-right">Thành Tiền</th>
                                                <th className="px-3 py-2" />
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {form.items.map((it, i) => (
                                                <tr key={i}>
                                                    <td className="px-2 py-1.5">
                                                        <input value={it.sku} onChange={e => handleItemChange(i, 'sku', e.target.value)}
                                                            placeholder="SKU-001"
                                                            className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-[11px] focus:outline-none focus:border-sky-500" />
                                                    </td>
                                                    <td className="px-2 py-1.5">
                                                        <input value={it.productName} onChange={e => handleItemChange(i, 'productName', e.target.value)}
                                                            placeholder="Áo polo trắng"
                                                            className="w-32 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-[11px] focus:outline-none focus:border-sky-500" />
                                                    </td>
                                                    <td className="px-2 py-1.5">
                                                        <input type="number" min="1" value={it.quantity} onChange={e => handleItemChange(i, 'quantity', Number(e.target.value))}
                                                            className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-[11px] text-center focus:outline-none focus:border-sky-500" />
                                                    </td>
                                                    <td className="px-2 py-1.5">
                                                        <input type="number" min="0" value={it.unitPrice} onChange={e => handleItemChange(i, 'unitPrice', Number(e.target.value))}
                                                            className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-[11px] text-right focus:outline-none focus:border-sky-500" />
                                                    </td>
                                                    <td className="px-2 py-1.5 text-right text-emerald-400 font-bold">
                                                        {formatVND(it.quantity * it.unitPrice)}
                                                    </td>
                                                    <td className="px-2 py-1.5">
                                                        {form.items.length > 1 && (
                                                            <button onClick={() => removeItem(i)} className="p-1 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400">
                                                                <X size={12} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-950/80">
                                            <tr>
                                                <td colSpan={4} className="px-3 py-2 text-right text-slate-400 text-[11px] font-bold">Tổng Cộng:</td>
                                                <td className="px-3 py-2 text-right text-emerald-400 font-black text-sm">{formatVND(calcTotal())}</td>
                                                <td />
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowCreate(false)} className="flex-1 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold">
                                    Hủy
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={creating}
                                    className="flex-1 h-11 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-40"
                                >
                                    {creating ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                    Tạo Đơn Mua Hàng
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Detail Modal */}
            <AnimatePresence>
                {detailOrder && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setDetailOrder(null)}
                            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-5 shadow-2xl"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                                    <ClipboardList size={16} className="text-sky-400" />
                                    Chi Tiết PO — {detailOrder.id || detailOrder._id?.slice(-8).toUpperCase()}
                                </h3>
                                <button onClick={() => setDetailOrder(null)} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
                                    <p className="text-slate-500 text-[10px] mb-1">Nhà Cung Cấp</p>
                                    <p className="text-white font-bold">{detailOrder.supplier?.name || '—'}</p>
                                    <p className="text-slate-400 text-[10px]">{detailOrder.supplier?.phone || ''}</p>
                                </div>
                                <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
                                    <p className="text-slate-500 text-[10px] mb-1">Trạng Thái</p>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLORS[detailOrder.status] || ''}`}>
                                        {STATUS_LABEL[detailOrder.status] || detailOrder.status}
                                    </span>
                                </div>
                                <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
                                    <p className="text-slate-500 text-[10px] mb-1">Tổng Tiền</p>
                                    <p className="text-emerald-400 font-black text-base">{formatVND(detailOrder.totalAmount || detailOrder.total_amount || 0)}</p>
                                </div>
                                <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
                                    <p className="text-slate-500 text-[10px] mb-1">Ngày Dự Nhận</p>
                                    <p className="text-white font-bold">
                                        {detailOrder.expectedDate ? new Date(detailOrder.expectedDate).toLocaleDateString('vi-VN') : '—'}
                                    </p>
                                </div>
                            </div>

                            {/* Items */}
                            {(detailOrder.items || []).length > 0 && (
                                <div className="bg-slate-950/50 rounded-2xl border border-slate-800 overflow-hidden">
                                    <p className="text-slate-400 text-[10px] font-bold uppercase px-3 py-2 border-b border-slate-800">Sản Phẩm Đặt Mua</p>
                                    {detailOrder.items?.map((it, i) => (
                                        <div key={i} className="flex justify-between items-center px-3 py-2 border-b border-slate-800/50 last:border-0">
                                            <div>
                                                <p className="text-white text-xs font-semibold">{it.productName || it.sku}</p>
                                                <p className="text-slate-500 text-[10px] font-mono">{it.sku}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white text-xs">×{it.quantity}</p>
                                                <p className="text-emerald-400 text-[10px]">{formatVND(it.unitPrice)}/sp</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Notes */}
                            {detailOrder.notes && (
                                <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800">
                                    <p className="text-slate-500 text-[10px] mb-1">Ghi Chú</p>
                                    <p className="text-slate-300 text-xs">{detailOrder.notes}</p>
                                </div>
                            )}

                            {/* Transition Actions */}
                            {(STATUS_TRANSITIONS[detailOrder.status] || []).length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-slate-400 text-[10px] font-bold uppercase">Chuyển Trạng Thái:</p>
                                    <div className="flex gap-2">
                                        {STATUS_TRANSITIONS[detailOrder.status]?.map(s => (
                                            <button
                                                key={s}
                                                onClick={() => updateStatus(detailOrder._id || detailOrder.id || '', s)}
                                                disabled={updatingId === (detailOrder._id || detailOrder.id)}
                                                className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all disabled:opacity-40 ${
                                                    s === 'cancelled' ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30' :
                                                    s === 'received'  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30' :
                                                    'bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/30'
                                                }`}
                                            >
                                                {updatingId ? '...' : STATUS_LABEL[s]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
