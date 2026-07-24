'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    History, Search, ArrowUpCircle, ArrowDownCircle,
    RefreshCw, ChevronLeft, ChevronRight, Info
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface TxItem {
    _id: string;
    transactionCode: string;
    type: string;
    sku: string;
    productName: string;
    color: string;
    size: string;
    quantityBefore: number;
    quantityChange: number;
    quantityAfter: number;
    stockType: string;
    orderId?: string;
    performedBy: string;
    notes: string;
    warehouseName: string;
    createdAt: string;
}

const TX_TYPE_CONFIG: Record<string, { label: string; color: string; icon: 'up' | 'down' }> = {
    IMPORT:        { label: 'Nhập kho',           color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: 'up' },
    EXPORT_SALE:   { label: 'Xuất bán',           color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',   icon: 'down' },
    EXPORT_DAMAGE: { label: 'Xuất hủy',           color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',         icon: 'down' },
    RESERVE:       { label: 'Giữ chỗ đơn',        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',      icon: 'down' },
    RELEASE:       { label: 'Hoàn giữ chỗ',       color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',         icon: 'up' },
    DEDUCT:        { label: 'Trừ tồn giao hàng',  color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',   icon: 'down' },
    ADJUST_UP:     { label: 'Điều chỉnh tăng',    color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',         icon: 'up' },
    ADJUST_DOWN:   { label: 'Điều chỉnh giảm',    color: 'text-pink-400 bg-pink-500/10 border-pink-500/20',         icon: 'down' },
    STOCKTAKE:     { label: 'Kiểm kê cân bằng',   color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',         icon: 'up' },
    RETURN_IN:     { label: 'Nhập hoàn hàng',     color: 'text-lime-400 bg-lime-500/10 border-lime-500/20',         icon: 'up' },
    RETURN_DAMAGE: { label: 'Hoàn hàng hỏng',     color: 'text-red-400 bg-red-500/10 border-red-500/20',            icon: 'down' },
    TRANSFER_IN:   { label: 'Nhận chuyển kho',    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',   icon: 'up' },
    TRANSFER_OUT:  { label: 'Xuất chuyển kho',    color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',   icon: 'down' },
};

export default function InventoryTransactionsPage() {
    const [transactions, setTransactions] = useState<TxItem[]>([]);
    const [loading, setLoading]           = useState(true);
    const [search, setSearch]             = useState('');
    const [typeFilter, setTypeFilter]     = useState('');
    const [page, setPage]                 = useState(1);
    const [totalPages, setTotalPages]     = useState(1);
    const [totalItems, setTotalItems]     = useState(0);

    const fetchTransactions = useCallback(async (pg = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(pg),
                limit: '20',
                ...(search && { search }),
                ...(typeFilter && { type: typeFilter })
            });
            const res = await fetch(`/api/wms/transactions?${params}`);
            const data = await res.json();
            if (data.success) {
                setTransactions(data.items || []);
                setTotalPages(data.pagination?.totalPages || 1);
                setTotalItems(data.pagination?.totalItems || 0);
            }
        } catch (err) {
            toast.error('Không thể tải lịch sử giao dịch kho');
        } finally {
            setLoading(false);
        }
    }, [search, typeFilter]);

    useEffect(() => {
        const t = setTimeout(() => fetchTransactions(1), 300);
        return () => clearTimeout(t);
    }, [fetchTransactions]);

    const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n || 0);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-xl">
                <div>
                    <h1 className="text-xl font-black text-white flex items-center gap-2">
                        <History size={20} className="text-amber-400" />
                        Lịch Sử Giao Dịch Kho
                    </h1>
                    <p className="text-slate-400 text-xs mt-0.5">
                        Immutable Audit Trail • {totalItems} giao dịch • 13 loại biến động kho
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchTransactions(page)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Làm mới
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex items-center gap-2 bg-slate-900/70 rounded-xl px-4 py-2.5 border border-slate-800">
                    <Search size={15} className="text-slate-500 shrink-0" />
                    <input
                        type="text"
                        placeholder="Tìm theo SKU, Tên sản phẩm, Mã đơn hàng..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="flex-1 bg-transparent text-white placeholder-slate-500 text-xs focus:outline-none"
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    className="bg-slate-900/70 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none cursor-pointer"
                >
                    <option value="">Tất cả loại GD</option>
                    {Object.entries(TX_TYPE_CONFIG).map(([key, cfg]) => (
                        <option key={key} value={key}>{cfg.label}</option>
                    ))}
                </select>
            </div>

            {/* Transaction Table */}
            <div className="bg-slate-900/70 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                            <tr>
                                <th className="px-4 py-3">Mã Giao Dịch</th>
                                <th className="px-4 py-3">Loại</th>
                                <th className="px-4 py-3">SKU / Sản phẩm</th>
                                <th className="px-4 py-3 text-center">Trước</th>
                                <th className="px-4 py-3 text-center">Thay đổi</th>
                                <th className="px-4 py-3 text-center">Sau</th>
                                <th className="px-4 py-3">Loại tồn</th>
                                <th className="px-4 py-3">Mã đơn</th>
                                <th className="px-4 py-3">Người thực hiện</th>
                                <th className="px-4 py-3">Thời gian</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {loading ? (
                                Array.from({ length: 10 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 10 }).map((__, j) => (
                                            <td key={j} className="px-4 py-3">
                                                <div className="h-3 bg-slate-800 rounded animate-pulse" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                                        <History size={32} className="mx-auto mb-2 opacity-30" />
                                        <p>Chưa có giao dịch kho nào được ghi lại</p>
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx, idx) => {
                                    const cfg = TX_TYPE_CONFIG[tx.type] || { label: tx.type, color: 'text-slate-400 bg-slate-800 border-slate-700', icon: 'up' as const };
                                    const isUp = tx.quantityChange >= 0;
                                    return (
                                        <motion.tr
                                            key={tx._id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: idx * 0.02 }}
                                            className="hover:bg-slate-800/40 transition-colors"
                                        >
                                            <td className="px-4 py-3 font-mono text-amber-400 text-[11px] whitespace-nowrap">{tx.transactionCode}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${cfg.color}`}>
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-white">{tx.sku}</p>
                                                <p className="text-slate-500 text-[10px] line-clamp-1">{tx.productName} {tx.color && `• ${tx.color}`} {tx.size && `/ ${tx.size}`}</p>
                                            </td>
                                            <td className="px-4 py-3 text-center text-slate-300 font-semibold">{tx.quantityBefore}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-black flex items-center justify-center gap-0.5 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {isUp ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />}
                                                    {isUp ? '+' : ''}{tx.quantityChange}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center font-black text-white">{tx.quantityAfter}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded-md border border-slate-700 font-mono">
                                                    {tx.stockType}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {tx.orderId ? (
                                                    <span className="text-blue-400 font-mono text-[10px]">{tx.orderId}</span>
                                                ) : (
                                                    <span className="text-slate-600 text-[10px]">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-slate-400 text-[11px]">{tx.performedBy}</td>
                                            <td className="px-4 py-3 text-slate-500 text-[10px] whitespace-nowrap">
                                                {new Date(tx.createdAt).toLocaleString('vi-VN')}
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-slate-500 text-xs">Trang {page} / {totalPages} • {totalItems} giao dịch</span>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => { setPage(p => p - 1); fetchTransactions(page - 1); }}
                                disabled={page <= 1}
                                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center disabled:opacity-30"
                            >
                                <ChevronLeft size={13} />
                            </button>
                            <span className="text-xs text-slate-400 px-2">{page}</span>
                            <button
                                onClick={() => { setPage(p => p + 1); fetchTransactions(page + 1); }}
                                disabled={page >= totalPages}
                                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center disabled:opacity-30"
                            >
                                <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
