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
    IMPORT:        { label: 'Nhập kho',           color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: 'up' },
    EXPORT_SALE:   { label: 'Xuất bán',           color: 'text-purple-700 bg-purple-50 border-purple-200',   icon: 'down' },
    EXPORT_DAMAGE: { label: 'Xuất hủy',           color: 'text-rose-700 bg-rose-50 border-rose-200',         icon: 'down' },
    RESERVE:       { label: 'Giữ chỗ đơn',        color: 'text-amber-700 bg-amber-50 border-amber-200',      icon: 'down' },
    RELEASE:       { label: 'Hoàn giữ chỗ',       color: 'text-blue-700 bg-blue-50 border-blue-200',         icon: 'up' },
    DEDUCT:        { label: 'Trừ tồn giao hàng',  color: 'text-orange-700 bg-orange-50 border-orange-200',   icon: 'down' },
    ADJUST_UP:     { label: 'Điều chỉnh tăng',    color: 'text-teal-700 bg-teal-50 border-teal-200',         icon: 'up' },
    ADJUST_DOWN:   { label: 'Điều chỉnh giảm',    color: 'text-pink-700 bg-pink-50 border-pink-200',         icon: 'down' },
    STOCKTAKE:     { label: 'Kiểm kê cân bằng',   color: 'text-cyan-700 bg-cyan-50 border-cyan-200',         icon: 'up' },
    RETURN_IN:     { label: 'Nhập hoàn hàng',     color: 'text-lime-700 bg-lime-50 border-lime-200',         icon: 'up' },
    RETURN_DAMAGE: { label: 'Hoàn hàng hỏng',     color: 'text-red-700 bg-red-50 border-red-200',            icon: 'down' },
    TRANSFER_IN:   { label: 'Nhận chuyển kho',    color: 'text-indigo-700 bg-indigo-50 border-indigo-200',   icon: 'up' },
    TRANSFER_OUT:  { label: 'Xuất chuyển kho',    color: 'text-violet-700 bg-violet-50 border-violet-200',   icon: 'down' },
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

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border shadow-sm"
                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <div>
                    <h1 className="text-xl font-black flex items-center gap-2" style={{ color: 'var(--adm-text)' }}>
                        <History size={20} className="text-amber-500" />
                        Lịch Sử Giao Dịch Kho
                    </h1>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                        Immutable Audit Trail • {totalItems} giao dịch • 13 loại biến động kho
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchTransactions(page)}
                        className="px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5"
                        style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Làm mới
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex items-center gap-2 rounded-xl px-4 py-2.5 border"
                    style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                    <Search size={15} className="shrink-0" style={{ color: 'var(--adm-text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Tìm theo SKU, Tên sản phẩm, Mã đơn hàng..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="flex-1 bg-transparent text-xs focus:outline-none"
                        style={{ color: 'var(--adm-text)' }}
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    className="border rounded-xl px-3 py-2.5 text-xs focus:outline-none cursor-pointer"
                    style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                >
                    <option value="">Tất cả loại GD</option>
                    {Object.entries(TX_TYPE_CONFIG).map(([key, cfg]) => (
                        <option key={key} value={key}>{cfg.label}</option>
                    ))}
                </select>
            </div>

            {/* Transaction Table */}
            <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="text-[10px] font-bold uppercase tracking-wider border-b"
                            style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' }}>
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
                        <tbody>
                            {loading ? (
                                Array.from({ length: 10 }).map((_, i) => (
                                    <tr key={i} className="border-b" style={{ borderColor: 'var(--adm-border)' }}>
                                        {Array.from({ length: 10 }).map((__, j) => (
                                            <td key={j} className="px-4 py-3">
                                                <div className="h-3 rounded animate-pulse" style={{ backgroundColor: 'var(--adm-surface-2)' }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-12 text-center" style={{ color: 'var(--adm-text-muted)' }}>
                                        <History size={32} className="mx-auto mb-2 opacity-30" />
                                        <p>Chưa có giao dịch kho nào được ghi lại</p>
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx, idx) => {
                                    const cfg = TX_TYPE_CONFIG[tx.type] || { label: tx.type, color: 'text-gray-600 bg-gray-100 border-gray-200', icon: 'up' as const };
                                    const isUp = tx.quantityChange >= 0;
                                    return (
                                        <motion.tr
                                            key={tx._id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: idx * 0.02 }}
                                            className="border-b last:border-0 transition-colors hover:bg-black/[0.02]"
                                            style={{ borderColor: 'var(--adm-border)' }}
                                        >
                                            <td className="px-4 py-3 font-mono text-amber-600 text-[11px] whitespace-nowrap">{tx.transactionCode}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${cfg.color}`}>
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-bold" style={{ color: 'var(--adm-text)' }}>{tx.sku}</p>
                                                <p className="text-[10px] line-clamp-1" style={{ color: 'var(--adm-text-muted)' }}>{tx.productName} {tx.color && `• ${tx.color}`} {tx.size && `/ ${tx.size}`}</p>
                                            </td>
                                            <td className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--adm-text)' }}>{tx.quantityBefore}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-black flex items-center justify-center gap-0.5 ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {isUp ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />}
                                                    {isUp ? '+' : ''}{tx.quantityChange}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center font-black" style={{ color: 'var(--adm-text)' }}>{tx.quantityAfter}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-0.5 rounded-md border text-[10px] font-mono"
                                                    style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}>
                                                    {tx.stockType}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {tx.orderId ? (
                                                    <span className="text-blue-600 font-mono text-[10px]">{tx.orderId}</span>
                                                ) : (
                                                    <span className="text-[10px]" style={{ color: 'var(--adm-text-subtle)' }}>—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-[11px]" style={{ color: 'var(--adm-text-muted)' }}>{tx.performedBy}</td>
                                            <td className="px-4 py-3 text-[10px] whitespace-nowrap" style={{ color: 'var(--adm-text-subtle)' }}>
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
                    <div className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--adm-border)' }}>
                        <span className="text-xs" style={{ color: 'var(--adm-text-muted)' }}>Trang {page} / {totalPages} • {totalItems} giao dịch</span>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => { setPage(p => p - 1); fetchTransactions(page - 1); }}
                                disabled={page <= 1}
                                className="w-7 h-7 rounded-lg border flex items-center justify-center disabled:opacity-30"
                                style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                            >
                                <ChevronLeft size={13} />
                            </button>
                            <span className="text-xs px-2" style={{ color: 'var(--adm-text-muted)' }}>{page}</span>
                            <button
                                onClick={() => { setPage(p => p + 1); fetchTransactions(page + 1); }}
                                disabled={page >= totalPages}
                                className="w-7 h-7 rounded-lg border flex items-center justify-center disabled:opacity-30"
                                style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
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
