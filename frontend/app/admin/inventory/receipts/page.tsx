'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Eye, FileDown, Filter, Search, X, PackageCheck, PackageMinus, ArrowLeftRight, ClipboardList, CheckCircle, Edit3 } from 'lucide-react';
import Link from 'next/link';

interface Receipt {
    id: string;
    type: 'IMPORT' | 'EXPORT' | 'TRANSFER' | 'ADJUSTMENT';
    warehouse_id: string;
    dest_warehouse_id?: string;
    supplier_id?: string;
    reason?: string;
    note?: string;
    total_quantity: number;
    total_amount: number;
    status: 'DRAFT' | 'COMPLETED' | 'CANCELLED';
    user_id: string;
    createdAt: string;
}

interface Warehouse {
    id: string;
    name: string;
}

interface Supplier {
    id: string;
    name: string;
}

const TYPE_CONFIG = {
    IMPORT: {
        label: 'Nhập Kho',
        icon: PackageCheck,
        color: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    },
    EXPORT: {
        label: 'Xuất Kho',
        icon: PackageMinus,
        color: 'bg-rose-50 text-rose-700 border border-rose-200',
    },
    TRANSFER: {
        label: 'Chuyển Kho',
        icon: ArrowLeftRight,
        color: 'bg-blue-50 text-blue-700 border border-blue-200',
    },
    ADJUSTMENT: {
        label: 'Điều Chỉnh',
        icon: ClipboardList,
        color: 'bg-amber-50 text-amber-700 border border-amber-200',
    },
};

const STATUS_CONFIG = {
    COMPLETED: { label: 'Hoàn thành', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    DRAFT: { label: 'Nháp', color: 'bg-gray-100 text-gray-600 border border-gray-200' },
    CANCELLED: { label: 'Đã hủy', color: 'bg-rose-50 text-rose-600 border border-rose-200' },
};

export default function StockReceiptsPage() {
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [loading, setLoading] = useState(true);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    // Filters
    const [filterType, setFilterType] = useState<string>('ALL');
    const [filterSearch, setFilterSearch] = useState('');

    const fetchAll = () => {
        setLoading(true);
        Promise.all([
            fetch('/api/stock-receipts').then(r => r.json()),
            fetch('/api/warehouses').then(r => r.json()),
            fetch('/api/suppliers').then(r => r.json()),
        ]).then(([receiptData, warehouseData, supplierData]) => {
            if (receiptData.success) setReceipts(receiptData.data);
            if (warehouseData.success) setWarehouses(warehouseData.data);
            if (supplierData.success) setSuppliers(supplierData.data);
        }).finally(() => setLoading(false));
    };

    useEffect(() => { fetchAll(); }, []);

    const getWarehouseName = (id: string) => warehouses.find(w => w.id === id)?.name || id;
    const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || id;

    const filtered = useMemo(() => {
        return receipts.filter(rec => {
            const matchType = filterType === 'ALL' || rec.type === filterType;
            const q = filterSearch.toLowerCase();
            const matchSearch = !q || rec.id.toLowerCase().includes(q) || (rec.reason || '').toLowerCase().includes(q);
            return matchType && matchSearch;
        });
    }, [receipts, filterType, filterSearch]);

    const printReceipt = (id: string) => {
        window.open(`/api/export/pdf/receipt?id=${id}`, '_blank');
    };

    const approveReceipt = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn duyệt phiếu này? Sau khi duyệt sẽ cập nhật tồn kho và không thể chỉnh sửa.')) return;
        try {
            const res = await fetch(`/api/stock-receipts/${id}/approve`, { method: 'PUT' });
            const data = await res.json();
            if (data.success) {
                alert('Duyệt thành công!');
                fetchAll();
            } else {
                alert('Lỗi: ' + data.message);
            }
        } catch (e) {
            alert('Lỗi kết nối');
        }
    };

    // Summary stats
    const stats = useMemo(() => ({
        total: receipts.length,
        import: receipts.filter(r => r.type === 'IMPORT').length,
        export: receipts.filter(r => r.type === 'EXPORT').length,
        transfer: receipts.filter(r => r.type === 'TRANSFER').length,
        totalAmount: receipts.reduce((s, r) => s + (r.total_amount || 0), 0),
    }), [receipts]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-2xl border shadow-sm"
                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <div>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--adm-text)' }}>Phiếu Nhập / Xuất Kho</h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>Quản lý toàn bộ phiếu kho và lịch sử biến động</p>
                </div>
                <Link
                    href="/admin/inventory/receipts/new"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                    <Plus size={16} /> Tạo Phiếu Mới
                </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Tổng phiếu', value: stats.total, color: 'var(--adm-text)' },
                    { label: 'Nhập kho', value: stats.import, color: '#059669' },
                    { label: 'Xuất kho', value: stats.export, color: '#e11d48' },
                    { label: 'Chuyển kho', value: stats.transfer, color: '#2563eb' },
                ].map(card => (
                    <div key={card.label} className="rounded-2xl p-4 border shadow-sm"
                        style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                        <p className="text-[11px] font-semibold uppercase mb-1" style={{ color: 'var(--adm-text-muted)' }}>{card.label}</p>
                        <p className="text-2xl font-black" style={{ color: card.color }}>{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Main Table Card */}
            <div className="rounded-2xl border shadow-sm overflow-hidden"
                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                {/* Filters */}
                <div className="p-4 border-b flex flex-col sm:flex-row gap-3"
                    style={{ borderColor: 'var(--adm-border)' }}>
                    {/* Type Filters */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <Filter size={14} className="shrink-0" style={{ color: 'var(--adm-text-muted)' }} />
                        {['ALL', 'IMPORT', 'EXPORT', 'TRANSFER', 'ADJUSTMENT'].map(t => (
                            <button
                                key={t}
                                onClick={() => setFilterType(t)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                                    filterType === t
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                        : 'border'
                                }`}
                                style={filterType !== t ? { backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' } : {}}
                            >
                                {t === 'ALL' ? 'Tất cả' : TYPE_CONFIG[t as keyof typeof TYPE_CONFIG]?.label || t}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="flex items-center gap-2 border rounded-xl px-3 py-2 flex-1 sm:max-w-xs ml-auto"
                        style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                        <Search size={14} className="shrink-0" style={{ color: 'var(--adm-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Tìm mã phiếu, lý do..."
                            value={filterSearch}
                            onChange={e => setFilterSearch(e.target.value)}
                            className="bg-transparent text-xs outline-none flex-1 min-w-0"
                            style={{ color: 'var(--adm-text)' }}
                        />
                        {filterSearch && (
                            <button onClick={() => setFilterSearch('')} style={{ color: 'var(--adm-text-muted)' }}>
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[800px]">
                        <thead>
                            <tr className="border-b uppercase text-[10px] font-bold tracking-wider"
                                style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' }}>
                                <th className="px-5 py-3">Mã Phiếu</th>
                                <th className="px-4 py-3">Loại</th>
                                <th className="px-4 py-3">Kho / Nhà CC</th>
                                <th className="px-4 py-3">Lý do</th>
                                <th className="px-4 py-3 text-center">Tổng SL</th>
                                <th className="px-4 py-3 text-right">Tổng tiền</th>
                                <th className="px-4 py-3">Trạng thái</th>
                                <th className="px-4 py-3">Thời gian</th>
                                <th className="px-4 py-3 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: 'var(--adm-border)' }}>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 9 }).map((_, j) => (
                                            <td key={j} className="px-4 py-4">
                                                <div className="h-4 rounded animate-pulse" style={{ backgroundColor: 'var(--adm-surface-2)' }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-16" style={{ color: 'var(--adm-text-muted)' }}>
                                        <div className="flex flex-col items-center gap-2">
                                            <ClipboardList size={36} className="opacity-20" />
                                            <p className="font-semibold" style={{ color: 'var(--adm-text)' }}>Không có phiếu kho nào</p>
                                            <p className="text-xs">Thử thay đổi bộ lọc hoặc tạo phiếu mới</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(rec => {
                                    const typeConf = TYPE_CONFIG[rec.type];
                                    const statusConf = STATUS_CONFIG[rec.status] || STATUS_CONFIG.COMPLETED;
                                    const TypeIcon = typeConf?.icon;
                                    return (
                                        <tr key={rec.id} className="transition-colors hover:bg-black/[0.02]">
                                            <td className="px-5 py-3.5 font-mono font-bold text-amber-600 text-xs">{rec.id}</td>
                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${typeConf?.color}`}>
                                                    {TypeIcon && <TypeIcon size={12} />}
                                                    {typeConf?.label || rec.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs">
                                                <p className="font-semibold" style={{ color: 'var(--adm-text)' }}>{getWarehouseName(rec.warehouse_id)}</p>
                                                {rec.dest_warehouse_id && (
                                                    <p className="text-[10px] text-blue-500 font-medium">→ {getWarehouseName(rec.dest_warehouse_id)}</p>
                                                )}
                                                {rec.supplier_id && (
                                                    <p className="text-[10px] text-emerald-600 font-medium">{getSupplierName(rec.supplier_id)}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-xs max-w-[180px]" style={{ color: 'var(--adm-text-muted)' }}>
                                                <p className="truncate">{rec.reason || <span className="italic" style={{ color: 'var(--adm-text-subtle)' }}>—</span>}</p>
                                            </td>
                                            <td className="px-4 py-3.5 text-center font-bold" style={{ color: 'var(--adm-text)' }}>{rec.total_quantity?.toLocaleString('vi-VN')}</td>
                                            <td className="px-4 py-3.5 text-right font-bold">
                                                {rec.total_amount > 0
                                                    ? <span className="text-emerald-600">{rec.total_amount.toLocaleString('vi-VN')}đ</span>
                                                    : <span style={{ color: 'var(--adm-text-subtle)' }}>—</span>
                                                }
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusConf.color}`}>
                                                    {statusConf.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-[10px] whitespace-nowrap" style={{ color: 'var(--adm-text-subtle)' }}>
                                                {new Date(rec.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {rec.status === 'DRAFT' && (
                                                        <>
                                                            <button
                                                                onClick={() => approveReceipt(rec.id)}
                                                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                                title="Duyệt Phiếu"
                                                            >
                                                                <CheckCircle size={14} />
                                                            </button>
                                                            <Link
                                                                href={`/admin/inventory/receipts/${rec.id}`}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Chỉnh sửa"
                                                            >
                                                                <Edit3 size={14} />
                                                            </Link>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => printReceipt(rec.id)}
                                                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="In Phiếu PDF"
                                                    >
                                                        <FileDown size={14} />
                                                    </button>
                                                    <Link
                                                        href={`/admin/inventory/receipts/${rec.id}`}
                                                        className="p-1.5 rounded-lg transition-colors"
                                                        style={{ color: 'var(--adm-text-muted)' }}
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye size={14} />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer tổng tiền */}
                {!loading && filtered.length > 0 && (
                    <div className="px-5 py-3 border-t flex items-center justify-between"
                        style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                        <p className="text-xs" style={{ color: 'var(--adm-text-muted)' }}>Hiển thị <strong>{filtered.length}</strong> / {receipts.length} phiếu</p>
                        <div className="text-right">
                            <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--adm-text-muted)' }}>Tổng giá trị hiển thị</p>
                            <p className="text-base font-black text-emerald-600">
                                {filtered.reduce((s, r) => s + (r.total_amount || 0), 0).toLocaleString('vi-VN')}đ
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
