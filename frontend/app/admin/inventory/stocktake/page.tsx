'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Layers, Search, CheckCircle2, AlertTriangle, RefreshCw,
    Download, FileText, Check, ShieldAlert, ArrowLeftRight, X,
    Plus, Minus, Filter, ArrowRight, DollarSign, Calculator, AlertOctagon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface InventoryItem {
    sku: string;
    productName: string;
    color: string;
    size: string;
    available: number;
    costPrice: number;
    actualCount?: number;
    locationRack?: string;
}

export default function StocktakePage() {
    const [items, setItems]               = useState<InventoryItem[]>([]);
    const [loading, setLoading]           = useState(true);
    const [search, setSearch]             = useState('');
    const [onlyVariances, setOnlyVariances] = useState(false);
    const [submitting, setSubmitting]     = useState(false);
    const [notes, setNotes]               = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/wms/inventory?limit=100');
            const data = await res.json();
            if (data.success) {
                const initial = (data.items || []).map((i: any) => ({
                    ...i,
                    actualCount: i.available // Mặc định tồn thực tế = tồn hệ thống
                }));
                setItems(initial);
            }
        } catch (err) {
            toast.error('Không thể tải danh sách tồn kho để kiểm kê');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const handleActualChange = (sku: string, val: number) => {
        setItems(prev => prev.map(item => item.sku === sku ? { ...item, actualCount: Math.max(0, val) } : item));
    };

    const handleSetAllMatched = () => {
        setItems(prev => prev.map(i => ({ ...i, actualCount: i.available })));
        toast.success('Đã đặt toàn bộ số lượng thực tế bằng số tồn hệ thống');
    };

    const handleResetAllZero = () => {
        setItems(prev => prev.map(i => ({ ...i, actualCount: 0 })));
        toast.success('Đã đặt số lượng thực tế về 0 để đếm lại từ đầu');
    };

    const handlePerformReconciliation = async () => {
        setSubmitting(true);
        try {
            const payloadItems = items.map(i => ({
                sku: i.sku,
                actualCount: i.actualCount ?? i.available
            }));

            const res = await fetch('/api/wms/stocktake', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: payloadItems,
                    notes: notes || 'Kiểm kê định kỳ kho WMS Enterprise',
                    user: 'Admin Quản Lý Kho'
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success('✨ Đã chốt phiếu kiểm kê & cân bằng tồn kho thành công!');
                setShowConfirmModal(false);
                setNotes('');
                fetchInventory();
            } else {
                throw new Error(data.message);
            }
        } catch (err: any) {
            toast.error(err.message || 'Lỗi khi cân bằng tồn kho');
        } finally {
            setSubmitting(false);
        }
    };

    // Filters
    const filteredItems = items.filter(i => {
        const matchesSearch = i.productName.toLowerCase().includes(search.toLowerCase()) ||
                              i.sku.toLowerCase().includes(search.toLowerCase()) ||
                              i.color.toLowerCase().includes(search.toLowerCase());
        const hasVariance = (i.actualCount ?? i.available) !== i.available;
        return matchesSearch && (!onlyVariances || hasVariance);
    });

    // Calculations
    const matchedCount = items.filter(i => (i.actualCount ?? i.available) === i.available).length;
    const deficitCount = items.filter(i => (i.actualCount ?? i.available) < i.available).length;
    const surplusCount = items.filter(i => (i.actualCount ?? i.available) > i.available).length;

    const totalQtyVariance = items.reduce((sum, item) => sum + ((item.actualCount ?? item.available) - item.available), 0);
    const totalValueVariance = items.reduce((sum, item) => {
        const diff = (item.actualCount ?? item.available) - item.available;
        return sum + (diff * (item.costPrice || 0));
    }, 0);

    const varianceItemsList = items.filter(i => (i.actualCount ?? i.available) !== i.available);

    const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl shadow-2xl">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <Layers size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                                Phiếu Kiểm Kê & Cân Bằng Tồn Kho
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">Enterprise</span>
                            </h1>
                            <p className="text-slate-400 text-xs mt-0.5">So sánh tồn thực tế vs tồn hệ thống, tính toán chênh lệch giá trị tài chính & cân bằng kho tự động</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <Link
                        href="/admin/inventory/stock"
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
                    >
                        ← Danh Sách Tồn Kho
                    </Link>

                    <button
                        onClick={() => setShowConfirmModal(true)}
                        disabled={loading || items.length === 0}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-40 transition-all"
                    >
                        <CheckCircle2 size={16} />
                        Chốt Phiếu & Cân Bằng Tồn Kho
                    </button>
                </div>
            </div>

            {/* Live Variance KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                    <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Tổng SKU Kiểm Kê</p>
                    <p className="text-xl font-black text-white mt-1">{items.length}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">Mã hàng trong phiếu</p>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                    <p className="text-emerald-400 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 size={12} /> Khớp Hoàn Hảo
                    </p>
                    <p className="text-xl font-black text-emerald-400 mt-1">{matchedCount}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">Thực tế = Hệ thống</p>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                    <p className="text-rose-400 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle size={12} /> Thiếu Hụt (Deficit)
                    </p>
                    <p className="text-xl font-black text-rose-400 mt-1">{deficitCount}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">Thực tế &lt; Hệ thống</p>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                    <p className="text-amber-400 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1">
                        <Plus size={12} /> Dư Thừa (Surplus)
                    </p>
                    <p className="text-xl font-black text-amber-400 mt-1">{surplusCount}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">Thực tế &gt; Hệ thống</p>
                </div>

                <div className="col-span-2 sm:col-span-1 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                    <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Chênh Lệch Tài Chính</p>
                    <p className={`text-base font-black mt-1 truncate ${
                        totalValueVariance < 0 ? 'text-rose-400' : totalValueVariance > 0 ? 'text-amber-400' : 'text-slate-300'
                    }`}>
                        {totalValueVariance > 0 ? '+' : ''}{formatVND(totalValueVariance)}
                    </p>
                    <p className="text-slate-500 text-[10px] mt-0.5">Giá trị vốn chênh lệch</p>
                </div>
            </div>

            {/* Quick Bulk Actions & Controls */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                <div className="flex-1 flex items-center gap-2 bg-slate-950/80 rounded-xl px-4 py-2.5 border border-slate-800">
                    <Search size={16} className="text-slate-500 shrink-0" />
                    <input
                        type="text"
                        placeholder="Tìm theo Tên sản phẩm, Mã SKU, Màu, Size..."
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

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setOnlyVariances(prev => !prev)}
                        className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            onlyVariances
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10'
                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                    >
                        <AlertTriangle size={13} />
                        Chỉ xem mã chênh lệch ({deficitCount + surplusCount})
                    </button>

                    <button
                        onClick={handleSetAllMatched}
                        className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
                    >
                        <Check size={13} className="text-emerald-400" />
                        Cân bằng tất cả
                    </button>

                    <button
                        onClick={handleResetAllZero}
                        className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
                    >
                        <RefreshCw size={13} className="text-rose-400" />
                        Đặt về 0 đếm lại
                    </button>
                </div>
            </div>

            {/* Stocktake Counting Table */}
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                            <tr>
                                <th className="px-5 py-4">Mã SKU & Sản Phẩm</th>
                                <th className="px-4 py-4 text-center">Tồn Hệ Thống</th>
                                <th className="px-4 py-4 text-center min-w-[180px]">Tồn Thực Tế Kiểm Đếm</th>
                                <th className="px-4 py-4 text-center">Chênh Lệch (Số Lượng)</th>
                                <th className="px-4 py-4 text-center">Giá Trị Chênh Lệch</th>
                                <th className="px-4 py-4">Trạng Thái Kiểm Kê</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 6 }).map((__, j) => (
                                            <td key={j} className="px-4 py-4">
                                                <div className="h-4 bg-slate-800 rounded animate-pulse" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-16 text-center text-slate-500">
                                        <Layers size={40} className="mx-auto mb-3 opacity-20 text-blue-400" />
                                        <p className="text-sm font-semibold text-slate-300">Không tìm thấy mã SKU nào phù hợp</p>
                                        <p className="text-xs text-slate-500 mt-1">Thử tắt lọc chênh lệch hoặc xóa từ khóa tìm kiếm</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item, idx) => {
                                    const actual = item.actualCount ?? item.available;
                                    const diff = actual - item.available;
                                    const valDiff = diff * (item.costPrice || 0);

                                    return (
                                        <motion.tr
                                            key={item.sku}
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.015 }}
                                            className={`transition-colors ${
                                                diff < 0
                                                    ? 'bg-rose-500/5 hover:bg-rose-500/10'
                                                    : diff > 0
                                                    ? 'bg-amber-500/5 hover:bg-amber-500/10'
                                                    : 'hover:bg-slate-800/40'
                                            }`}
                                        >
                                            <td className="px-5 py-4">
                                                <p className="font-mono font-bold text-amber-400 text-xs">{item.sku}</p>
                                                <p className="text-slate-200 font-semibold text-xs mt-0.5 line-clamp-1">{item.productName}</p>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                                                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">Màu: {item.color}</span>
                                                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">Size: {item.size}</span>
                                                    {item.locationRack && (
                                                        <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-400">Kệ: {item.locationRack}</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* System Available */}
                                            <td className="px-4 py-4 text-center font-black text-slate-300 text-sm">
                                                {item.available}
                                            </td>

                                            {/* Actual Count Input */}
                                            <td className="px-4 py-4 text-center">
                                                <div className="inline-flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleActualChange(item.sku, actual - 1)}
                                                        className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center border border-slate-700 transition-all active:scale-95"
                                                    >
                                                        -
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={actual}
                                                        onChange={e => handleActualChange(item.sku, parseInt(e.target.value) || 0)}
                                                        className="w-16 bg-transparent text-center font-mono font-black text-amber-400 text-sm focus:outline-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleActualChange(item.sku, actual + 1)}
                                                        className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center border border-slate-700 transition-all active:scale-95"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Quantity Variance */}
                                            <td className="px-4 py-4 text-center">
                                                {diff === 0 ? (
                                                    <span className="text-slate-600 font-mono">0</span>
                                                ) : diff < 0 ? (
                                                    <span className="px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 font-black font-mono text-xs">
                                                        {diff}
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 font-black font-mono text-xs">
                                                        +{diff}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Value Variance */}
                                            <td className="px-4 py-4 text-center font-semibold text-xs">
                                                {valDiff === 0 ? (
                                                    <span className="text-slate-600">0đ</span>
                                                ) : (
                                                    <span className={valDiff < 0 ? 'text-rose-400' : 'text-amber-400'}>
                                                        {valDiff > 0 ? '+' : ''}{formatVND(valDiff)}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Status Tag */}
                                            <td className="px-4 py-4">
                                                {diff === 0 ? (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                                                        <CheckCircle2 size={11} /> Khớp chuẩn
                                                    </span>
                                                ) : diff < 0 ? (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 inline-flex items-center gap-1">
                                                        <AlertTriangle size={11} /> Thiếu hụt
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
                                                        <Plus size={11} /> Dư thừa
                                                    </span>
                                                )}
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Reconciliation Confirmation Modal */}
            <AnimatePresence>
                {showConfirmModal && (
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
                            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl relative space-y-5"
                        >
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="absolute top-5 right-5 text-slate-500 hover:text-white p-1 rounded-xl bg-slate-800/50"
                            >
                                <X size={18} />
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <CheckCircle2 size={22} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Xác Nhận Chốt Phiếu Kiểm Kê</h3>
                                    <p className="text-slate-400 text-xs">Cân bằng tự động số lượng khả dụng trong kho hệ thống WMS</p>
                                </div>
                            </div>

                            {/* Summary Variance Box */}
                            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                                <div className="flex items-center justify-between text-slate-300">
                                    <span>Tổng số mã SKU kiểm kê:</span>
                                    <strong className="text-white font-mono">{items.length} mã</strong>
                                </div>
                                <div className="flex items-center justify-between text-slate-300">
                                    <span>Số mã khớp hoàn hảo:</span>
                                    <strong className="text-emerald-400 font-mono">{matchedCount} mã</strong>
                                </div>
                                <div className="flex items-center justify-between text-slate-300">
                                    <span>Số mã bị chênh lệch:</span>
                                    <strong className="text-amber-400 font-mono">{varianceItemsList.length} mã</strong>
                                </div>
                                <div className="flex items-center justify-between text-slate-300 pt-2 border-t border-slate-800/80">
                                    <span>Tổng chênh lệch tài chính:</span>
                                    <strong className={`font-black text-sm font-mono ${totalValueVariance < 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                                        {totalValueVariance > 0 ? '+' : ''}{formatVND(totalValueVariance)}
                                    </strong>
                                </div>
                            </div>

                            {/* Variance Items Preview List */}
                            {varianceItemsList.length > 0 && (
                                <div className="space-y-1.5">
                                    <p className="text-xs font-semibold text-slate-300">Các mã SKU sẽ bị điều chỉnh:</p>
                                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                                        {varianceItemsList.map(i => {
                                            const diff = (i.actualCount ?? i.available) - i.available;
                                            return (
                                                <div key={i.sku} className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-xl text-xs border border-slate-800">
                                                    <div>
                                                        <span className="font-mono font-bold text-amber-400">{i.sku}</span> - <span className="text-slate-300">{i.productName}</span>
                                                    </div>
                                                    <span className={`font-mono font-bold ${diff < 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                                                        {diff > 0 ? '+' : ''}{diff}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Notes Input */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-300">Ghi chú phiếu kiểm kê</label>
                                <textarea
                                    rows={2}
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Ví dụ: Kiểm kê định kỳ tháng 7/2026, kho tổng Long An..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmModal(false)}
                                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePerformReconciliation}
                                    disabled={submitting}
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                                >
                                    {submitting && <RefreshCw size={13} className="animate-spin" />}
                                    Xác Nhận & Cân Bằng Tồn Kho
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
