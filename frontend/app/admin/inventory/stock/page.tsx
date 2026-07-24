'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Package, Search, Filter, RefreshCw, AlertTriangle, XCircle,
    CheckCircle2, Clock, ShieldAlert, ArrowUpDown, Download,
    Layers, ChevronLeft, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────
interface InventoryItem {
    _id: string;
    sku: string;
    productName: string;
    color: string;
    size: string;
    warehouseName: string;
    locationRack: string;
    available: number;
    reserved: number;
    sold: number;
    damaged: number;
    transfer: number;
    minStock: number;
    costPrice: number;
    sellingPrice: number;
    status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED';
}

interface Pagination {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
}

const STATUS_CONFIG = {
    IN_STOCK:       { label: 'Còn hàng',    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    LOW_STOCK:      { label: 'Sắp hết',     color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    OUT_OF_STOCK:   { label: 'Hết hàng',    color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
    DISCONTINUED:   { label: 'Ngừng KD',    color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' }
};

export default function InventoryStockPage() {
    const [items, setItems]               = useState<InventoryItem[]>([]);
    const [pagination, setPagination]     = useState<Pagination>({ page: 1, limit: 15, totalItems: 0, totalPages: 1 });
    const [loading, setLoading]           = useState(true);
    const [search, setSearch]             = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortBy, setSortBy]             = useState('updatedAt');

    const fetchInventory = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: '15',
                ...(search && { search }),
                ...(statusFilter && { status: statusFilter })
            });
            const res = await fetch(`/api/wms/inventory?${params}`);
            const data = await res.json();
            if (data.success) {
                setItems(data.items || []);
                setPagination(data.pagination);
            }
        } catch (err) {
            toast.error('Không thể tải danh sách tồn kho');
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter]);

    useEffect(() => {
        const t = setTimeout(() => fetchInventory(1), 350);
        return () => clearTimeout(t);
    }, [fetchInventory]);

    const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-xl">
                <div>
                    <h1 className="text-xl font-black text-white flex items-center gap-2">
                        <Package size={20} className="text-amber-400" />
                        Quản Lý Tồn Kho theo SKU
                    </h1>
                    <p className="text-slate-400 text-xs mt-0.5">6 loại tồn: Available / Reserved / Sold / Damaged / Transfer • Tổng {pagination.totalItems} SKU</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/inventory/stocktake"
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
                    >
                        <Layers size={13} /> Kiểm Kê Kho
                    </Link>
                    <Link
                        href="/admin/inventory/wms-dashboard"
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
                    >
                        WMS Dashboard →
                    </Link>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex items-center gap-2 bg-slate-900/70 rounded-xl px-4 py-2.5 border border-slate-800">
                    <Search size={15} className="text-slate-500 shrink-0" />
                    <input
                        type="text"
                        placeholder="Tìm theo Tên SP, SKU, Barcode..."
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
                    <option value="IN_STOCK">Còn hàng</option>
                    <option value="LOW_STOCK">Sắp hết hàng</option>
                    <option value="OUT_OF_STOCK">Hết hàng</option>
                    <option value="DISCONTINUED">Ngừng kinh doanh</option>
                </select>
                <button
                    onClick={() => fetchInventory(pagination.page)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
                >
                    <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Làm mới
                </button>
            </div>

            {/* Stock Table */}
            <div className="bg-slate-900/70 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                            <tr>
                                <th className="px-4 py-3">SKU / Sản phẩm</th>
                                <th className="px-4 py-3 text-center">Available</th>
                                <th className="px-4 py-3 text-center">Reserved</th>
                                <th className="px-4 py-3 text-center">Sold</th>
                                <th className="px-4 py-3 text-center">Damaged</th>
                                <th className="px-4 py-3">Vị trí kho</th>
                                <th className="px-4 py-3">Giá vốn</th>
                                <th className="px-4 py-3">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 8 }).map((__, j) => (
                                            <td key={j} className="px-4 py-3">
                                                <div className="h-3 bg-slate-800 rounded animate-pulse" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                                        <Package size={32} className="mx-auto mb-2 opacity-30" />
                                        <p>Không tìm thấy SKU nào phù hợp</p>
                                    </td>
                                </tr>
                            ) : (
                                items.map((item, idx) => (
                                    <motion.tr
                                        key={item._id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.02 }}
                                        className="hover:bg-slate-800/40 transition-colors"
                                    >
                                        <td className="px-4 py-3">
                                            <p className="font-bold text-amber-400 font-mono">{item.sku}</p>
                                            <p className="text-slate-300 font-medium mt-0.5 line-clamp-1">{item.productName}</p>
                                            <p className="text-slate-500 text-[10px]">{item.color} / {item.size}</p>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`font-black text-sm ${item.available === 0 ? 'text-rose-400' : item.available <= item.minStock ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                {item.available}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center font-semibold text-amber-300">{item.reserved}</td>
                                        <td className="px-4 py-3 text-center font-semibold text-purple-400">{item.sold}</td>
                                        <td className="px-4 py-3 text-center font-semibold text-rose-400">{item.damaged}</td>
                                        <td className="px-4 py-3">
                                            <p className="text-slate-300 text-[11px]">{item.warehouseName}</p>
                                            <p className="text-slate-500 text-[10px] font-mono">{item.locationRack}</p>
                                        </td>
                                        <td className="px-4 py-3 text-slate-300">{formatVND(item.costPrice)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_CONFIG[item.status]?.color || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                                {STATUS_CONFIG[item.status]?.label || item.status}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-slate-500 text-xs">
                            Trang {pagination.page} / {pagination.totalPages} • Tổng {pagination.totalItems} SKU
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => fetchInventory(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, i) => {
                                const p = i + 1;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => fetchInventory(p)}
                                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${pagination.page === p ? 'bg-amber-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => fetchInventory(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages}
                                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
