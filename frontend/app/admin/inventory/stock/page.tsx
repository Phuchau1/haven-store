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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl border" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
                            <Package size={22} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--adm-text)' }}>
                                Quản Lý Tồn Kho WMS
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">Enterprise</span>
                            </h1>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>Quản lý trực quan tồn khả dụng, tồn giữ đơn, hàng lỗi & giá trị vốn lưu động theo SKU</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        onClick={handleSyncProducts}
                        disabled={syncing}
                        className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all disabled:opacity-50"
                        style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                        title="Đồng bộ toàn bộ sản phẩm từ cửa hàng vào hệ thống kho WMS"
                    >
                        <RefreshCw size={15} className={`text-blue-600 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Đang đồng bộ...' : 'Đồng Bộ Kho'}
                    </button>
                    <button
                        onClick={handleExportCsv}
                        className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all"
                        style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                    >
                        <FileSpreadsheet size={15} className="text-emerald-600" />
                        Xuất Excel/CSV
                    </button>

                    <Link
                        href="/admin/inventory/stocktake"
                        className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all"
                        style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                    >
                        <Layers size={15} className="text-blue-600" />
                        Kiểm Kê Kho
                    </Link>

                    <Link
                        href="/admin/inventory/wms-dashboard"
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
                    >
                        <TrendingUp size={15} />
                        WMS Dashboard →
                    </Link>
                </div>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--adm-text-subtle)' }}>Tổng SKU</p>
                    <p className="text-xl font-black mt-1" style={{ color: 'var(--adm-text)' }}>{pagination.totalItems}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>Mã hàng khả dụng</p>
                </div>

                <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--adm-text-subtle)' }}>Giá Trị Tồn Kho</p>
                    <p className="text-base font-black text-amber-600 mt-1 truncate">{formatVND(summary.totalValuation)}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>Tổng giá vốn kho</p>
                </div>

                <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                    <p className="text-emerald-600 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 size={12} /> Đủ Hàng
                    </p>
                    <p className="text-xl font-black text-emerald-600 mt-1">{summary.inStockCount}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>SKU tồn ổn định</p>
                </div>

                <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                    <p className="text-amber-600 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle size={12} /> Sắp Hết
                    </p>
                    <p className="text-xl font-black text-amber-600 mt-1">{summary.lowStockCount}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>Dưới ngưỡng an toàn</p>
                </div>

                <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                    <p className="text-rose-600 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1">
                        <XCircle size={12} /> Hết Hàng
                    </p>
                    <p className="text-xl font-black text-rose-600 mt-1">{summary.outOfStockCount}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>Cần nhập kho ngay</p>
                </div>

                <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                    <p className="text-purple-600 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1">
                        <Clock size={12} /> Tồn Giữ Đơn
                    </p>
                    <p className="text-xl font-black text-purple-600 mt-1">{summary.totalReserved}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>Đơn chưa xuất hàng</p>
                </div>
            </div>

            {/* Controls & Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3 p-3 rounded-2xl border" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <div className="flex-1 flex items-center gap-2 rounded-xl px-4 py-2 border" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                    <Search size={16} className="shrink-0" style={{ color: 'var(--adm-text-subtle)' }} />
                    <input
                        type="text"
                        placeholder="Tìm theo Tên sản phẩm, Mã SKU, Mã màu, Size..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="flex-1 bg-transparent text-xs focus:outline-none"
                        style={{ color: 'var(--adm-text)' }}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} style={{ color: 'var(--adm-text-subtle)' }}>
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="border rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer font-medium"
                        style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                    >
                        <option value="">Tất cả trạng thái kho</option>
                        <option value="IN_STOCK">🟢 Còn hàng</option>
                        <option value="LOW_STOCK">⚠️ Sắp hết hàng (Low Stock)</option>
                        <option value="OUT_OF_STOCK">🚨 Hết hàng (Out of Stock)</option>
                        <option value="DISCONTINUED">⚪ Ngừng kinh doanh</option>
                    </select>

                    <button
                        onClick={() => fetchInventory(pagination.page)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all shrink-0"
                        style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="uppercase text-[10px] font-bold tracking-wider border-b" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-subtle)' }}>
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
                        <tbody className="divide-y" style={{ borderColor: 'var(--adm-border)' }}>
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 9 }).map((__, j) => (
                                            <td key={j} className="px-4 py-4">
                                                <div className="h-4 rounded animate-pulse" style={{ backgroundColor: 'var(--adm-surface-2)' }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-16 text-center" style={{ color: 'var(--adm-text-muted)' }}>
                                        <Package size={40} className="mx-auto mb-3 opacity-20 text-amber-500" />
                                        <p className="text-sm font-semibold" style={{ color: 'var(--adm-text)' }}>Không tìm thấy mã SKU kho nào</p>
                                        <p className="text-xs mt-1" style={{ color: 'var(--adm-text-muted)' }}>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái</p>
                                    </td>
                                </tr>
                            ) : (
                                items.map((item, idx) => (
                                    <motion.tr
                                        key={item._id}
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.015 }}
                                        className="transition-colors group hover:bg-[var(--adm-surface-2)]"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <div>
                                                    <p className="font-mono font-bold text-amber-600 text-xs">
                                                        {item.sku}
                                                    </p>
                                                    <p className="font-semibold text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--adm-text)' }}>{item.productName}</p>
                                                    <div className="flex items-center gap-2 text-[10px] mt-1" style={{ color: 'var(--adm-text-muted)' }}>
                                                        <span className="px-1.5 py-0.5 rounded border font-mono" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>Màu: {item.color}</span>
                                                        <span className="px-1.5 py-0.5 rounded border font-mono" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>Size: {item.size}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Available */}
                                        <td className="px-4 py-4 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className={`px-3 py-1 rounded-xl font-black text-sm border shadow-sm ${
                                                    item.available === 0
                                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                        : item.available <= item.minStock
                                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                }`}>
                                                    {item.available}
                                                </span>
                                                <span className="text-[10px] mt-1 font-mono" style={{ color: 'var(--adm-text-subtle)' }}>Ngưỡng: {item.minStock}</span>
                                            </div>
                                        </td>

                                        {/* Reserved */}
                                        <td className="px-4 py-4 text-center font-bold text-amber-700 text-xs">
                                            {item.reserved > 0 ? (
                                                <span className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200">
                                                    {item.reserved}
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--adm-text-subtle)' }}>0</span>
                                            )}
                                        </td>

                                        {/* Sold */}
                                        <td className="px-4 py-4 text-center font-bold text-purple-700 text-xs">
                                            {item.sold || 0}
                                        </td>

                                        {/* Damaged */}
                                        <td className="px-4 py-4 text-center font-bold text-xs">
                                            {item.damaged > 0 ? (
                                                <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                                                    {item.damaged}
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--adm-text-subtle)' }}>0</span>
                                            )}
                                        </td>

                                        {/* Warehouse location */}
                                        <td className="px-4 py-4">
                                            <p className="text-xs font-medium" style={{ color: 'var(--adm-text)' }}>{item.warehouseName || 'Kho Tổng'}</p>
                                            <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--adm-text-subtle)' }}>Kệ: {item.locationRack || 'A1-01'}</p>
                                        </td>

                                        {/* Cost Price */}
                                        <td className="px-4 py-4 font-semibold" style={{ color: 'var(--adm-text)' }}>
                                            {formatVND(item.costPrice)}
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap inline-flex items-center gap-1.5 shadow-sm ${STATUS_CONFIG[item.status]?.color || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
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
                                                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center gap-1.5 ml-auto transition-all"
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
                    <div className="px-5 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                        <span className="text-xs font-medium" style={{ color: 'var(--adm-text-muted)' }}>
                            Hiển thị trang <strong className="text-amber-600">{pagination.page}</strong> / {pagination.totalPages} (Tổng <strong style={{ color: 'var(--adm-text)' }}>{pagination.totalItems}</strong> SKU)
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => fetchInventory(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                                className="w-8 h-8 rounded-xl border flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                            >
                                <ChevronLeft size={15} />
                            </button>
                            {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, i) => {
                                const p = i + 1;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => fetchInventory(p)}
                                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${pagination.page === p ? 'bg-blue-600 text-white shadow-md' : 'border'}`}
                                        style={pagination.page !== p ? { backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' } : {}}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => fetchInventory(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages}
                                className="w-8 h-8 rounded-xl border flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
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
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="border rounded-2xl p-6 max-w-lg w-full shadow-2xl relative space-y-5"
                            style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                        >
                            <button
                                onClick={() => setSelectedSkuItem(null)}
                                className="absolute top-5 right-5 p-1 rounded-xl"
                                style={{ backgroundColor: 'var(--adm-surface-2)', color: 'var(--adm-text-muted)' }}
                            >
                                <X size={18} />
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
                                    <Edit3 size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold" style={{ color: 'var(--adm-text)' }}>Điều Chỉnh Tồn Kho Thủ Công</h3>
                                    <p className="text-xs" style={{ color: 'var(--adm-text-muted)' }}>SKU: <strong className="text-amber-600 font-mono">{selectedSkuItem.sku}</strong></p>
                                </div>
                            </div>

                            {/* SKU Info Card */}
                            <div className="p-3.5 rounded-xl border space-y-1 text-xs" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                                <p className="font-semibold" style={{ color: 'var(--adm-text)' }}>{selectedSkuItem.productName}</p>
                                <p style={{ color: 'var(--adm-text-muted)' }}>Màu: <span style={{ color: 'var(--adm-text)' }}>{selectedSkuItem.color}</span> | Size: <span style={{ color: 'var(--adm-text)' }}>{selectedSkuItem.size}</span></p>
                                <div className="flex items-center justify-between pt-2 border-t mt-2" style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' }}>
                                    <span>Tồn khả dụng hiện tại:</span>
                                    <span className="text-emerald-600 font-black text-sm">{selectedSkuItem.available} sp</span>
                                </div>
                            </div>

                            <form onSubmit={handleAdjustSubmit} className="space-y-4">
                                {/* Type Selector */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold" style={{ color: 'var(--adm-text)' }}>Loại điều chỉnh</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setAdjustType('ADD')}
                                            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                                adjustType === 'ADD'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm'
                                                    : 'border'
                                            }`}
                                            style={adjustType !== 'ADD' ? { backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' } : {}}
                                        >
                                            <Plus size={14} /> Nhập Thêm
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setAdjustType('SUBTRACT')}
                                            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                                adjustType === 'SUBTRACT'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-sm'
                                                    : 'border'
                                            }`}
                                            style={adjustType !== 'SUBTRACT' ? { backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' } : {}}
                                        >
                                            <Minus size={14} /> Xuất Bớt
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setAdjustType('DAMAGE')}
                                            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                                adjustType === 'DAMAGE'
                                                    ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-sm'
                                                    : 'border'
                                            }`}
                                            style={adjustType !== 'DAMAGE' ? { backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' } : {}}
                                        >
                                            <AlertTriangle size={14} /> Báo Hỏng
                                        </button>
                                    </div>
                                </div>

                                {/* Quantity Input */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold" style={{ color: 'var(--adm-text)' }}>
                                        Số lượng thay đổi ({adjustType === 'SUBTRACT' ? '-' : '+'})
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setAdjustQty(prev => Math.max(1, prev - 1))}
                                            className="w-10 h-10 rounded-xl border font-bold flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            min={1}
                                            value={adjustQty || ''}
                                            onChange={e => setAdjustQty(Math.max(1, parseInt(e.target.value) || 0))}
                                            placeholder="Nhập số lượng..."
                                            className="flex-1 border rounded-xl px-4 py-2.5 font-mono font-bold text-center text-sm focus:outline-none focus:border-amber-500"
                                            style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setAdjustQty(prev => prev + 1)}
                                            className="w-10 h-10 rounded-xl border font-bold flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-right" style={{ color: 'var(--adm-text-muted)' }}>
                                        Tồn kho dự kiến sau điều chỉnh: <strong className="text-amber-600 font-bold">{
                                            adjustType === 'SUBTRACT'
                                                ? Math.max(0, selectedSkuItem.available - adjustQty)
                                                : selectedSkuItem.available + adjustQty
                                        } sp</strong>
                                    </p>
                                </div>

                                {/* Reason Input */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold" style={{ color: 'var(--adm-text)' }}>
                                        Lý do điều chỉnh (bắt buộc)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={adjustReason}
                                        onChange={e => setAdjustReason(e.target.value)}
                                        placeholder="Ví dụ: Nhập bổ sung lô hàng mới, phát hiện thất thoát khi kiểm kê nhanh, hàng rách chỉ..."
                                        className="w-full border rounded-xl p-3 text-xs focus:outline-none focus:border-amber-500 resize-none"
                                        style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                                        required
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2.5 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedSkuItem(null)}
                                        className="px-4 py-2.5 rounded-xl text-xs font-semibold border"
                                        style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={adjusting || adjustQty <= 0 || !adjustReason.trim()}
                                        className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-md"
                                    >
                                        {adjusting && <RefreshCw size={13} className="animate-spin" />}
                                        Xác Nhận Điều Chỉnh
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
