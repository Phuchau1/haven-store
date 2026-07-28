'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package, Search, Filter, RefreshCw, AlertTriangle, XCircle,
    CheckCircle2, Clock, ShieldAlert, ArrowUpDown, Download,
    Layers, ChevronLeft, ChevronRight, SlidersHorizontal, Plus, Minus,
    FileSpreadsheet, Edit3, X, ArrowRightLeft, DollarSign, TrendingUp
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
    IN_STOCK:       { label: 'Còn hàng',    icon: '🟢', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    LOW_STOCK:      { label: 'Sắp hết',     icon: '⚠️', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    OUT_OF_STOCK:   { label: 'Hết hàng',    icon: '🚨', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
    DISCONTINUED:   { label: 'Ngừng KD',    icon: '⚪', color: 'bg-slate-500/10 text-slate-400 border-slate-500/30' }
};

export default function InventoryStockPage() {
    const [items, setItems]               = useState<InventoryItem[]>([]);
    const [pagination, setPagination]     = useState<Pagination>({ page: 1, limit: 15, totalItems: 0, totalPages: 1 });
    const [loading, setLoading]           = useState(true);
    const [search, setSearch]             = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    
    // Adjust Stock Modal State
    const [selectedSkuItem, setSelectedSkuItem] = useState<InventoryItem | null>(null);
    const [adjustQty, setAdjustQty]             = useState<number>(0);
    const [adjustType, setAdjustType]           = useState<'ADD' | 'SUBTRACT' | 'DAMAGE'>('ADD');
    const [adjustReason, setAdjustReason]       = useState('');
    const [adjusting, setAdjusting]             = useState(false);
    const [syncing, setSyncing]                 = useState(false);

    // Summary KPIs
    const [summary, setSummary] = useState({
        totalValuation: 0,
        totalAvailable: 0,
        totalReserved: 0,
        totalDamaged: 0,
        inStockCount: 0,
        lowStockCount: 0,
        outOfStockCount: 0
    });

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
                const list: InventoryItem[] = data.items || [];
                setItems(list);
                setPagination(data.pagination || { page: 1, limit: 15, totalItems: list.length, totalPages: 1 });
                
                // Calculate KPIs
                let val = 0, avail = 0, resv = 0, dmg = 0;
                let inStk = 0, lowStk = 0, outStk = 0;
                list.forEach(i => {
                    val += (i.available * (i.costPrice || i.sellingPrice || 0));
                    avail += i.available || 0;
                    resv  += i.reserved || 0;
                    dmg   += i.damaged || 0;
                    if (i.available === 0) outStk++;
                    else if (i.available <= i.minStock) lowStk++;
                    else inStk++;
                });
                setSummary({
                    totalValuation: val,
                    totalAvailable: avail,
                    totalReserved: resv,
                    totalDamaged: dmg,
                    inStockCount: inStk,
                    lowStockCount: lowStk,
                    outOfStockCount: outStk
                });
            }
        } catch (err) {
            toast.error('Không thể tải danh sách tồn kho');
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter]);

    useEffect(() => {
        const t = setTimeout(() => fetchInventory(1), 300);
        return () => clearTimeout(t);
    }, [fetchInventory]);

    const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';

    const handleExportCsv = () => {
        window.open('/api/wms/export', '_blank');
        toast.success('📥 Đã tải xuống báo cáo tồn kho CSV!');
    };

    const handleSyncProducts = async () => {
        setSyncing(true);
        try {
            const res = await fetch('/api/wms/sync-products', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || '✅ Đồng bộ kho từ sản phẩm thành công!');
                fetchInventory(1);
            } else {
                throw new Error(data.message);
            }
        } catch (err: any) {
            toast.error(err.message || 'Lỗi đồng bộ kho');
        } finally {
            setSyncing(false);
        }
    };

    const handleAdjustSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSkuItem) return;
        if (!adjustReason.trim()) {
            toast.error('Vui lòng nhập lý do điều chỉnh tồn kho bắt buộc');
            return;
        }

        const finalQty = adjustType === 'SUBTRACT' ? -Math.abs(adjustQty) : Math.abs(adjustQty);
        if (finalQty === 0) {
            toast.error('Số lượng điều chỉnh phải khác 0');
            return;
        }

        setAdjusting(true);
        try {
            const res = await fetch('/api/wms/adjust', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sku: selectedSkuItem.sku,
                    adjustQty: finalQty,
                    reason: `${adjustType === 'DAMAGE' ? '[HÀNG HỎNG/LỖI] ' : ''}${adjustReason}`,
                    performedBy: 'Admin Kho Enterprise'
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`✅ Đã điều chỉnh tồn kho SKU ${selectedSkuItem.sku} thành công!`);
                setSelectedSkuItem(null);
                setAdjustQty(0);
                setAdjustReason('');
                fetchInventory(pagination.page);
            } else {
                throw new Error(data.message);
            }
        } catch (err: any) {
            toast.error(err.message || 'Lỗi khi điều chỉnh tồn kho');
        } finally {
            setAdjusting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl shadow-2xl">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Package size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                                Quản Lý Tồn Kho WMS
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">Enterprise</span>
                            </h1>
                            <p className="text-slate-400 text-xs mt-0.5">Quản lý trực quan tồn khả dụng, tồn giữ đơn, hàng lỗi & giá trị vốn lưu động theo SKU</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        onClick={handleSyncProducts}
                        disabled={syncing}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all shadow-sm disabled:opacity-50"
                        title="Đồng bộ toàn bộ sản phẩm từ cửa hàng vào hệ thống kho WMS"
                    >
                        <RefreshCw size={15} className={`text-blue-400 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Đang đồng bộ...' : 'Đồng Bộ Kho'}
                    </button>
                    <button
                        onClick={handleExportCsv}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all shadow-sm"
                    >
                        <FileSpreadsheet size={15} className="text-emerald-400" />
                        Xuất Excel/CSV
                    </button>

                    <Link
                        href="/admin/inventory/stocktake"
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all shadow-sm"
                    >
                        <Layers size={15} className="text-blue-400" />
                        Kiểm Kê Kho
                    </Link>

                    <Link
                        href="/admin/inventory/wms-dashboard"
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all"
                    >
                        <TrendingUp size={15} />
                        WMS Dashboard →
                    </Link>
                </div>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                    <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Tổng SKU</p>
                    <p className="text-xl font-black text-white mt-1">{pagination.totalItems}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">Mã hàng khả dụng</p>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                    <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Giá Trị Tồn Kho</p>
                    <p className="text-base font-black text-amber-400 mt-1 truncate">{formatVND(summary.totalValuation)}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">Tổng giá vốn kho</p>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                    <p className="text-emerald-400 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 size={12} /> Đủ Hàng
                    </p>
                    <p className="text-xl font-black text-emerald-400 mt-1">{summary.inStockCount}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">SKU tồn ổn định</p>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                    <p className="text-amber-400 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle size={12} /> Sắp Hết
                    </p>
                    <p className="text-xl font-black text-amber-400 mt-1">{summary.lowStockCount}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">Dưới ngưỡng an toàn</p>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                    <p className="text-rose-400 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1">
                        <XCircle size={12} /> Hết Hàng
                    </p>
                    <p className="text-xl font-black text-rose-400 mt-1">{summary.outOfStockCount}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">Cần nhập kho ngay</p>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                    <p className="text-purple-400 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1">
                        <Clock size={12} /> Tồn Giữ Đơn
                    </p>
                    <p className="text-xl font-black text-purple-400 mt-1">{summary.totalReserved}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">Đơn chưa xuất hàng</p>
                </div>
            </div>

            {/* Controls & Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                <div className="flex-1 flex items-center gap-2 bg-slate-950/80 rounded-xl px-4 py-2.5 border border-slate-800">
                    <Search size={16} className="text-slate-500 shrink-0" />
                    <input
                        type="text"
                        placeholder="Tìm theo Tên sản phẩm, Mã SKU, Mã màu, Size..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="flex-1 bg-transparent text-white placeholder-slate-500 text-xs focus:outline-none"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="text-slate-500 hover:text-white">
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none cursor-pointer font-medium"
                    >
                        <option value="">Tất cả trạng thái kho</option>
                        <option value="IN_STOCK">🟢 Còn hàng</option>
                        <option value="LOW_STOCK">⚠️ Sắp hết hàng (Low Stock)</option>
                        <option value="OUT_OF_STOCK">🚨 Hết hàng (Out of Stock)</option>
                        <option value="DISCONTINUED">⚪ Ngừng kinh doanh</option>
                    </select>

                    <button
                        onClick={() => fetchInventory(pagination.page)}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all shrink-0"
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                            <tr>
                                <th className="px-5 py-4">Mã SKU & Sản Phẩm</th>
                                <th className="px-4 py-4 text-center">Tồn Bán (Available)</th>
                                <th className="px-4 py-4 text-center">Tồn Giữ (Reserved)</th>
                                <th className="px-4 py-4 text-center">Đã Bán</th>
                                <th className="px-4 py-4 text-center">Hàng Lỗi (Damaged)</th>
                                <th className="px-4 py-4">Vị Trí Kệ Kho</th>
                                <th className="px-4 py-4">Giá Vốn Kho</th>
                                <th className="px-4 py-4">Trạng Thái</th>
                                <th className="px-5 py-4 text-right">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 9 }).map((__, j) => (
                                            <td key={j} className="px-4 py-4">
                                                <div className="h-4 bg-slate-800 rounded animate-pulse" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-16 text-center text-slate-500">
                                        <Package size={40} className="mx-auto mb-3 opacity-20 text-amber-400" />
                                        <p className="text-sm font-semibold text-slate-300">Không tìm thấy mã SKU kho nào</p>
                                        <p className="text-xs text-slate-500 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái</p>
                                    </td>
                                </tr>
                            ) : (
                                items.map((item, idx) => (
                                    <motion.tr
                                        key={item._id}
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.015 }}
                                        className="hover:bg-slate-800/50 transition-colors group"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <div>
                                                    <p className="font-mono font-bold text-amber-400 text-xs group-hover:text-amber-300 transition-colors">
                                                        {item.sku}
                                                    </p>
                                                    <p className="text-slate-200 font-semibold text-xs mt-0.5 line-clamp-1">{item.productName}</p>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                                                        <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">Màu: {item.color}</span>
                                                        <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">Size: {item.size}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Available */}
                                        <td className="px-4 py-4 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className={`px-3 py-1 rounded-xl font-black text-sm border shadow-sm ${
                                                    item.available === 0
                                                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                        : item.available <= item.minStock
                                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                }`}>
                                                    {item.available}
                                                </span>
                                                <span className="text-[10px] text-slate-500 mt-1 font-mono">Ngưỡng: {item.minStock}</span>
                                            </div>
                                        </td>

                                        {/* Reserved */}
                                        <td className="px-4 py-4 text-center font-bold text-amber-300 text-xs">
                                            {item.reserved > 0 ? (
                                                <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                                    {item.reserved}
                                                </span>
                                            ) : (
                                                <span className="text-slate-600">0</span>
                                            )}
                                        </td>

                                        {/* Sold */}
                                        <td className="px-4 py-4 text-center font-bold text-purple-300 text-xs">
                                            {item.sold || 0}
                                        </td>

                                        {/* Damaged */}
                                        <td className="px-4 py-4 text-center font-bold text-xs">
                                            {item.damaged > 0 ? (
                                                <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                                    {item.damaged}
                                                </span>
                                            ) : (
                                                <span className="text-slate-600">0</span>
                                            )}
                                        </td>

                                        {/* Warehouse location */}
                                        <td className="px-4 py-4">
                                            <p className="text-slate-300 text-xs font-medium">{item.warehouseName || 'Kho Tổng'}</p>
                                            <p className="text-slate-500 text-[10px] font-mono mt-0.5">Kệ: {item.locationRack || 'A1-01'}</p>
                                        </td>

                                        {/* Cost Price */}
                                        <td className="px-4 py-4 font-semibold text-slate-300">
                                            {formatVND(item.costPrice)}
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap inline-flex items-center gap-1.5 shadow-sm ${STATUS_CONFIG[item.status]?.color || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                                <span className="text-[10px]">{STATUS_CONFIG[item.status]?.icon || '•'}</span>
                                                <span>{STATUS_CONFIG[item.status]?.label || item.status}</span>
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-5 py-4 text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedSkuItem(item);
                                                    setAdjustQty(0);
                                                    setAdjustType('ADD');
                                                    setAdjustReason('');
                                                }}
                                                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 ml-auto transition-all"
                                            >
                                                <Edit3 size={13} />
                                                Điều chỉnh
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <span className="text-slate-400 text-xs font-medium">
                            Hiển thị trang <strong className="text-amber-400">{pagination.page}</strong> / {pagination.totalPages} (Tổng <strong className="text-white">{pagination.totalItems}</strong> SKU)
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => fetchInventory(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={15} />
                            </button>
                            {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, i) => {
                                const p = i + 1;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => fetchInventory(p)}
                                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${pagination.page === p ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => fetchInventory(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages}
                                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Manual Stock Adjustment Modal */}
            <AnimatePresence>
                {selectedSkuItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-5"
                        >
                            <button
                                onClick={() => setSelectedSkuItem(null)}
                                className="absolute top-5 right-5 text-slate-500 hover:text-white p-1 rounded-xl bg-slate-800/50"
                            >
                                <X size={18} />
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    <Edit3 size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Điều Chỉnh Tồn Kho Thủ Công</h3>
                                    <p className="text-slate-400 text-xs">SKU: <strong className="text-amber-400 font-mono">{selectedSkuItem.sku}</strong></p>
                                </div>
                            </div>

                            {/* SKU Info Card */}
                            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1 text-xs">
                                <p className="text-slate-200 font-semibold">{selectedSkuItem.productName}</p>
                                <p className="text-slate-400">Màu: <span className="text-slate-200">{selectedSkuItem.color}</span> | Size: <span className="text-slate-200">{selectedSkuItem.size}</span></p>
                                <div className="flex items-center justify-between text-slate-400 pt-2 border-t border-slate-800/80 mt-2">
                                    <span>Tồn khả dụng hiện tại:</span>
                                    <span className="text-emerald-400 font-black text-sm">{selectedSkuItem.available} sp</span>
                                </div>
                            </div>

                            <form onSubmit={handleAdjustSubmit} className="space-y-4">
                                {/* Type Selector */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-300">Loại điều chỉnh</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setAdjustType('ADD')}
                                            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                                adjustType === 'ADD'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10 shadow-lg'
                                                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                                            }`}
                                        >
                                            <Plus size={14} /> Nhập Thêm
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setAdjustType('SUBTRACT')}
                                            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                                adjustType === 'SUBTRACT'
                                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/40 shadow-amber-500/10 shadow-lg'
                                                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                                            }`}
                                        >
                                            <Minus size={14} /> Xuất Bớt
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setAdjustType('DAMAGE')}
                                            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                                adjustType === 'DAMAGE'
                                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/40 shadow-rose-500/10 shadow-lg'
                                                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                                            }`}
                                        >
                                            <AlertTriangle size={14} /> Báo Hỏng
                                        </button>
                                    </div>
                                </div>

                                {/* Quantity Input */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-300">
                                        Số lượng thay đổi ({adjustType === 'SUBTRACT' ? '-' : '+'})
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setAdjustQty(prev => Math.max(1, prev - 1))}
                                            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center border border-slate-700 shrink-0"
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            min={1}
                                            value={adjustQty || ''}
                                            onChange={e => setAdjustQty(Math.max(1, parseInt(e.target.value) || 0))}
                                            placeholder="Nhập số lượng..."
                                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono font-bold text-center text-sm focus:outline-none focus:border-amber-500"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setAdjustQty(prev => prev + 1)}
                                            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center border border-slate-700 shrink-0"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-slate-400 text-right">
                                        Tồn kho dự kiến sau điều chỉnh: <strong className="text-amber-400 font-bold">{
                                            adjustType === 'SUBTRACT'
                                                ? Math.max(0, selectedSkuItem.available - adjustQty)
                                                : selectedSkuItem.available + adjustQty
                                        } sp</strong>
                                    </p>
                                </div>

                                {/* Reason Input */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-300">
                                        Lý do điều chỉnh (bắt buộc)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={adjustReason}
                                        onChange={e => setAdjustReason(e.target.value)}
                                        placeholder="Ví dụ: Nhập bổ sung lô hàng mới, phát hiện thất thoát khi kiểm kê nhanh, hàng rách chỉ..."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                                        required
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2.5 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedSkuItem(null)}
                                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={adjusting || adjustQty <= 0 || !adjustReason.trim()}
                                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                                    >
                                        {adjusting && <RefreshCw size={13} className="animate-spin" />}
                                        Lưu & Cập Nhật Tồn Kho
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
