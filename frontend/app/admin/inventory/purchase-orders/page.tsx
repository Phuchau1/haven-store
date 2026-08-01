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
    draft:     'bg-gray-100 text-gray-700 border-gray-200',
    pending:   'bg-amber-50 text-amber-700 border-amber-200',
    confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
    received:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
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

    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating]     = useState(false);
    const [form, setForm]             = useState({
        supplier_id: '',
        expectedDate: '',
        notes: '',
        items: [{ sku: '', productName: '', quantity: 1, unitPrice: 0 }]
    });

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

    useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);
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

    const inputStyle = { backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border shadow-sm"
                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <div>
                    <h1 className="text-xl font-black flex items-center gap-2" style={{ color: 'var(--adm-text)' }}>
                        <ShoppingCart size={20} className="text-sky-500" />
                        Đơn Mua Hàng (Purchase Orders)
                    </h1>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                        Tạo PO từ nhà cung cấp → Phiếu Nhập kho tự động khi nhận hàng
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchOrders} className="px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5"
                        style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}>
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Tải lại
                    </button>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                        <Plus size={14} /> Tạo Đơn Mới
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Tổng đơn', value: orders.length, color: 'var(--adm-text)' },
                    { label: 'Chờ duyệt', value: orders.filter(o => o.status === 'pending').length, color: '#d97706' },
                    { label: 'Đã xác nhận', value: orders.filter(o => o.status === 'confirmed').length, color: '#2563eb' },
                    { label: 'Đã nhận hàng', value: orders.filter(o => o.status === 'received').length, color: '#059669' },
                ].map((s, i) => (
                    <div key={i} className="border rounded-2xl p-4 text-center" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                        <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex items-center gap-2 rounded-xl px-4 py-2.5 border"
                    style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                    <Search size={14} className="shrink-0" style={{ color: 'var(--adm-text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Tìm theo Mã PO, Nhà Cung Cấp..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="flex-1 bg-transparent text-xs focus:outline-none"
                        style={{ color: 'var(--adm-text)' }}
                    />
                    {search && <button onClick={() => setSearch('')} style={{ color: 'var(--adm-text-muted)' }}><X size={12} /></button>}
                </div>
                <select
                    value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                    className="border rounded-xl px-3 py-2.5 text-xs focus:outline-none cursor-pointer"
                    style={inputStyle}
                >
                    <option value="">Tất cả trạng thái</option>
                    {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="text-[10px] font-bold uppercase tracking-wider border-b"
                            style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' }}>
                            <tr>
                                <th className="px-4 py-3">Mã PO</th>
                                <th className="px-4 py-3">Nhà Cung Cấp</th>
                                <th className="px-4 py-3">Ngày Dự Nhận</th>
                                <th className="px-4 py-3">Tổng Tiền</th>
                                <th className="px-4 py-3">Trạng Thái</th>
                                <th className="px-4 py-3 text-center">Hành Động</th>
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
                                        <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                                        <p>Không có đơn mua hàng nào</p>
                                        <button onClick={() => setShowCreate(true)} className="mt-3 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs rounded-xl font-bold">
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
                                            className="border-b last:border-0 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                                            style={{ borderColor: 'var(--adm-border)' }}
                                        >
                                            <td className="px-4 py-3 font-bold font-mono text-sky-600">
                                                {order.id || oid.slice(-8).toUpperCase()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-semibold" style={{ color: 'var(--adm-text)' }}>{order.supplier?.name || '—'}</p>
                                                <p className="text-[10px]" style={{ color: 'var(--adm-text-muted)' }}>{order.supplier?.phone || ''}</p>
                                            </td>
                                            <td className="px-4 py-3" style={{ color: 'var(--adm-text)' }}>
                                                {order.expectedDate || order.expected_date
                                                    ? new Date(order.expectedDate || order.expected_date!).toLocaleDateString('vi-VN')
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3 font-bold" style={{ color: 'var(--adm-text)' }}>{formatVND(order.totalAmount || order.total_amount || 0)}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                    {STATUS_LABEL[order.status] || order.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => setDetailOrder(order)}
                                                        className="p-1.5 rounded-lg border transition-colors"
                                                        style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' }}
                                                    >
                                                        <Eye size={13} />
                                                    </button>
                                                    {nexts.map(s => (
                                                        <button
                                                            key={s}
                                                            onClick={() => updateStatus(oid, s)}
                                                            disabled={updatingId === oid}
                                                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border disabled:opacity-40 ${
                                                                s === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' :
                                                                s === 'received'  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' :
                                                                'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                                                            }`}
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
                        className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40 flex items-center gap-1"
                        style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}>
                        <ChevronLeft size={13} /> Trước
                    </button>
                    <span className="text-xs" style={{ color: 'var(--adm-text-muted)' }}>Trang {page}/{totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40 flex items-center gap-1"
                        style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}>
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
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto border rounded-2xl p-6 space-y-5 shadow-2xl"
                            style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                        >
                            <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--adm-border)' }}>
                                <h3 className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--adm-text)' }}>
                                    <ShoppingCart size={18} className="text-sky-500" /> Tạo Đơn Mua Hàng Mới
                                </h3>
                                <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-full border flex items-center justify-center"
                                    style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' }}>
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--adm-text-muted)' }}><Building2 size={12} /> Nhà Cung Cấp *</label>
                                    <select
                                        value={form.supplier_id}
                                        onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value }))}
                                        className="w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
                                        style={inputStyle}
                                    >
                                        <option value="">-- Chọn nhà cung cấp --</option>
                                        {suppliers.map(s => (
                                            <option key={s._id} value={s._id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--adm-text-muted)' }}><Calendar size={12} /> Ngày Dự Nhận Hàng</label>
                                    <input
                                        type="date"
                                        value={form.expectedDate}
                                        onChange={e => setForm(f => ({ ...f, expectedDate: e.target.value }))}
                                        className="w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold" style={{ color: 'var(--adm-text-muted)' }}>Ghi Chú</label>
                                <textarea
                                    rows={2}
                                    value={form.notes}
                                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                    placeholder="Ghi chú cho đơn mua hàng này..."
                                    className="w-full border rounded-xl px-3 py-2 text-xs focus:outline-none resize-none"
                                    style={inputStyle}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--adm-text-muted)' }}><Package size={12} /> Sản Phẩm Đặt Mua *</label>
                                    <button
                                        onClick={handleAddItem}
                                        className="px-2 py-1 rounded-lg bg-sky-50 text-sky-700 text-[10px] font-bold border border-sky-200 hover:bg-sky-100 flex items-center gap-1"
                                    >
                                        <Plus size={11} /> Thêm dòng
                                    </button>
                                </div>
                                <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--adm-border)' }}>
                                    <table className="w-full text-xs">
                                        <thead className="text-[9px] uppercase tracking-wider border-b" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' }}>
                                            <tr>
                                                <th className="px-3 py-2 text-left">SKU</th>
                                                <th className="px-3 py-2 text-left">Tên SP</th>
                                                <th className="px-3 py-2 text-center">SL</th>
                                                <th className="px-3 py-2 text-right">Đơn Giá</th>
                                                <th className="px-3 py-2 text-right">Thành Tiền</th>
                                                <th className="px-3 py-2" />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {form.items.map((it, i) => (
                                                <tr key={i} className="border-b last:border-0" style={{ borderColor: 'var(--adm-border)' }}>
                                                    <td className="px-2 py-1.5">
                                                        <input value={it.sku} onChange={e => handleItemChange(i, 'sku', e.target.value)}
                                                            placeholder="SKU-001"
                                                            className="w-24 border rounded px-2 py-1 text-[11px] focus:outline-none focus:border-sky-500"
                                                            style={inputStyle} />
                                                    </td>
                                                    <td className="px-2 py-1.5">
                                                        <input value={it.productName} onChange={e => handleItemChange(i, 'productName', e.target.value)}
                                                            placeholder="Áo polo trắng"
                                                            className="w-32 border rounded px-2 py-1 text-[11px] focus:outline-none focus:border-sky-500"
                                                            style={inputStyle} />
                                                    </td>
                                                    <td className="px-2 py-1.5">
                                                        <input type="number" min="1" value={it.quantity} onChange={e => handleItemChange(i, 'quantity', Number(e.target.value))}
                                                            className="w-16 border rounded px-2 py-1 text-[11px] text-center focus:outline-none focus:border-sky-500"
                                                            style={inputStyle} />
                                                    </td>
                                                    <td className="px-2 py-1.5">
                                                        <input type="number" min="0" value={it.unitPrice} onChange={e => handleItemChange(i, 'unitPrice', Number(e.target.value))}
                                                            className="w-24 border rounded px-2 py-1 text-[11px] text-right focus:outline-none focus:border-sky-500"
                                                            style={inputStyle} />
                                                    </td>
                                                    <td className="px-2 py-1.5 text-right text-emerald-600 font-bold">
                                                        {formatVND(it.quantity * it.unitPrice)}
                                                    </td>
                                                    <td className="px-2 py-1.5">
                                                        {form.items.length > 1 && (
                                                            <button onClick={() => removeItem(i)} className="p-1 rounded hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                                                style={{ color: 'var(--adm-text-muted)' }}>
                                                                <X size={12} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="border-t" style={{ borderColor: 'var(--adm-border)', backgroundColor: 'var(--adm-surface-2)' }}>
                                            <tr>
                                                <td colSpan={4} className="px-3 py-2 text-right text-[11px] font-bold" style={{ color: 'var(--adm-text-muted)' }}>Tổng Cộng:</td>
                                                <td className="px-3 py-2 text-right text-emerald-600 font-black text-sm">{formatVND(calcTotal())}</td>
                                                <td />
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowCreate(false)} className="flex-1 h-11 rounded-xl border text-xs font-bold"
                                    style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}>
                                    Hủy
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={creating}
                                    className="flex-1 h-11 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-40"
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
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto border rounded-2xl p-6 space-y-5 shadow-2xl"
                            style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                        >
                            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--adm-border)' }}>
                                <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--adm-text)' }}>
                                    <ClipboardList size={16} className="text-sky-500" />
                                    Chi Tiết PO — {detailOrder.id || detailOrder._id?.slice(-8).toUpperCase()}
                                </h3>
                                <button onClick={() => setDetailOrder(null)} className="w-8 h-8 rounded-full border flex items-center justify-center"
                                    style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' }}>
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                {[
                                    { label: 'Nhà Cung Cấp', main: detailOrder.supplier?.name || '—', sub: detailOrder.supplier?.phone || '' },
                                    { label: 'Tổng Tiền', main: formatVND(detailOrder.totalAmount || detailOrder.total_amount || 0), mainClass: 'text-emerald-600 font-black text-base', sub: '' },
                                    { label: 'Ngày Dự Nhận', main: detailOrder.expectedDate ? new Date(detailOrder.expectedDate).toLocaleDateString('vi-VN') : '—', sub: '' },
                                ].map((info, i) => (
                                    <div key={i} className="rounded-xl p-3 border" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                                        <p className="text-[10px] mb-1" style={{ color: 'var(--adm-text-muted)' }}>{info.label}</p>
                                        <p className={info.mainClass || 'font-bold'} style={!info.mainClass ? { color: 'var(--adm-text)' } : {}}>{info.main}</p>
                                        {info.sub && <p className="text-[10px]" style={{ color: 'var(--adm-text-muted)' }}>{info.sub}</p>}
                                    </div>
                                ))}
                                <div className="rounded-xl p-3 border" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                                    <p className="text-[10px] mb-1" style={{ color: 'var(--adm-text-muted)' }}>Trạng Thái</p>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLORS[detailOrder.status] || ''}`}>
                                        {STATUS_LABEL[detailOrder.status] || detailOrder.status}
                                    </span>
                                </div>
                            </div>

                            {(detailOrder.items || []).length > 0 && (
                                <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--adm-border)' }}>
                                    <p className="text-[10px] font-bold uppercase px-3 py-2 border-b" style={{ color: 'var(--adm-text-muted)', borderColor: 'var(--adm-border)', backgroundColor: 'var(--adm-surface-2)' }}>Sản Phẩm Đặt Mua</p>
                                    {detailOrder.items?.map((it, i) => (
                                        <div key={i} className="flex justify-between items-center px-3 py-2 border-b last:border-0" style={{ borderColor: 'var(--adm-border)' }}>
                                            <div>
                                                <p className="text-xs font-semibold" style={{ color: 'var(--adm-text)' }}>{it.productName || it.sku}</p>
                                                <p className="text-[10px] font-mono" style={{ color: 'var(--adm-text-muted)' }}>{it.sku}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs" style={{ color: 'var(--adm-text)' }}>×{it.quantity}</p>
                                                <p className="text-[10px] text-emerald-600">{formatVND(it.unitPrice)}/sp</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {detailOrder.notes && (
                                <div className="rounded-xl p-3 border" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                                    <p className="text-[10px] mb-1" style={{ color: 'var(--adm-text-muted)' }}>Ghi Chú</p>
                                    <p className="text-xs" style={{ color: 'var(--adm-text)' }}>{detailOrder.notes}</p>
                                </div>
                            )}

                            {(STATUS_TRANSITIONS[detailOrder.status] || []).length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--adm-text-muted)' }}>Chuyển Trạng Thái:</p>
                                    <div className="flex gap-2">
                                        {STATUS_TRANSITIONS[detailOrder.status]?.map(s => (
                                            <button
                                                key={s}
                                                onClick={() => updateStatus(detailOrder._id || detailOrder.id || '', s)}
                                                disabled={updatingId === (detailOrder._id || detailOrder.id)}
                                                className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all border disabled:opacity-40 ${
                                                    s === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' :
                                                    s === 'received'  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' :
                                                    'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
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
