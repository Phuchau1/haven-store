'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Eye, FileDown, Filter, Search, X, PackageCheck, PackageMinus, ArrowLeftRight, ClipboardList } from 'lucide-react';
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
    COMPLETED: { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-700' },
    DRAFT: { label: 'Nháp', color: 'bg-slate-100 text-slate-600' },
    CANCELLED: { label: 'Đã hủy', color: 'bg-rose-100 text-rose-600' },
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Phiếu Nhập / Xuất Kho</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Quản lý toàn bộ phiếu kho và lịch sử biến động</p>
                </div>
                <Link
                    href="/admin/inventory/receipts/new"
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
                >
                    <Plus size={16} /> Tạo Phiếu Mới
                </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Tổng phiếu', value: stats.total, color: 'text-slate-700', bg: 'bg-white' },
                    { label: 'Nhập kho', value: stats.import, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Xuất kho', value: stats.export, color: 'text-rose-600', bg: 'bg-rose-50' },
                    { label: 'Chuyển kho', value: stats.transfer, color: 'text-blue-600', bg: 'bg-blue-50' },
                ].map(card => (
                    <div key={card.label} className={`${card.bg} rounded-2xl p-4 border border-slate-100 shadow-sm`}>
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{card.label}</p>
                        <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Filters */}
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
                    {/* Type Filters */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <Filter size={15} className="text-slate-400 flex-shrink-0" />
                        {['ALL', 'IMPORT', 'EXPORT', 'TRANSFER', 'ADJUSTMENT'].map(t => (
                            <button
                                key={t}
                                onClick={() => setFilterType(t)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                                    filterType === t
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {t === 'ALL' ? 'Tất cả' : TYPE_CONFIG[t as keyof typeof TYPE_CONFIG]?.label || t}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 sm:max-w-xs ml-auto">
                        <Search size={15} className="text-slate-400 flex-shrink-0" />
                        <input
                            type="text"
                            placeholder="Tìm mã phiếu, lý do..."
                            value={filterSearch}
                            onChange={e => setFilterSearch(e.target.value)}
                            className="bg-transparent text-sm outline-none flex-1 min-w-0"
                        />
                        {filterSearch && (
                            <button onClick={() => setFilterSearch('')}>
                                <X size={14} className="text-slate-400 hover:text-slate-700" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase">Mã Phiếu</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Loại</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Kho / Nhà CC</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Lý do</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">Tổng SL</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Tổng tiền</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Trạng thái</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Thời gian</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 9 }).map((_, j) => (
                                            <td key={j} className="px-4 py-4">
                                                <div className="h-4 bg-slate-100 rounded animate-pulse" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-16 text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <ClipboardList size={36} className="text-slate-200" />
                                            <p className="font-medium">Không có phiếu kho nào</p>
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
                                        <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-5 py-3.5 font-mono font-bold text-slate-700 text-sm">{rec.id}</td>
                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase ${typeConf?.color}`}>
                                                    {TypeIcon && <TypeIcon size={12} />}
                                                    {typeConf?.label || rec.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-sm">
                                                <p className="font-semibold text-slate-800">{getWarehouseName(rec.warehouse_id)}</p>
                                                {rec.dest_warehouse_id && (
                                                    <p className="text-xs text-blue-500 font-medium">→ {getWarehouseName(rec.dest_warehouse_id)}</p>
                                                )}
                                                {rec.supplier_id && (
                                                    <p className="text-xs text-emerald-600 font-medium">{getSupplierName(rec.supplier_id)}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-sm text-slate-600 max-w-[180px]">
                                                <p className="truncate">{rec.reason || <span className="text-slate-300 italic">—</span>}</p>
                                            </td>
                                            <td className="px-4 py-3.5 text-center font-bold text-slate-700">{rec.total_quantity?.toLocaleString('vi-VN')}</td>
                                            <td className="px-4 py-3.5 text-right font-bold text-slate-800">
                                                {rec.total_amount > 0
                                                    ? <span className="text-rose-600">{rec.total_amount.toLocaleString('vi-VN')} đ</span>
                                                    : <span className="text-slate-300">—</span>
                                                }
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${statusConf.color}`}>
                                                    {statusConf.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                                                {new Date(rec.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => printReceipt(rec.id)}
                                                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="In Phiếu PDF"
                                                    >
                                                        <FileDown size={15} />
                                                    </button>
                                                    <button
                                                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
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
                    <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <p className="text-sm text-slate-500">Hiển thị <span className="font-bold text-slate-700">{filtered.length}</span> / {receipts.length} phiếu</p>
                        <div className="text-right">
                            <p className="text-xs font-semibold text-slate-500 uppercase">Tổng giá trị hiển thị</p>
                            <p className="text-lg font-black text-rose-600">
                                {filtered.reduce((s, r) => s + (r.total_amount || 0), 0).toLocaleString('vi-VN')} đ
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
