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
                    actualCount: i.available
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

    const filteredItems = items.filter(i => {
        const matchesSearch = i.productName.toLowerCase().includes(search.toLowerCase()) ||
                              i.sku.toLowerCase().includes(search.toLowerCase()) ||
                              i.color.toLowerCase().includes(search.toLowerCase());
        const hasVariance = (i.actualCount ?? i.available) !== i.available;
        return matchesSearch && (!onlyVariances || hasVariance);
    });

    const matchedCount = items.filter(i => (i.actualCount ?? i.available) === i.available).length;
    const deficitCount = items.filter(i => (i.actualCount ?? i.available) < i.available).length;
    const surplusCount = items.filter(i => (i.actualCount ?? i.available) > i.available).length;

    const totalValueVariance = items.reduce((sum, item) => {
        const diff = (item.actualCount ?? item.available) - item.available;
        return sum + (diff * (item.costPrice || 0));
    }, 0);

    const varianceItemsList = items.filter(i => (i.actualCount ?? i.available) !== i.available);

    const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border shadow-sm"
                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                            <Layers size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight flex items-center gap-2" style={{ color: 'var(--adm-text)' }}>
                                Phiếu Kiểm Kê & Cân Bằng Tồn Kho
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">Enterprise</span>
                            </h1>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>So sánh tồn thực tế vs tồn hệ thống, tính toán chênh lệch giá trị tài chính & cân bằng kho tự động</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <Link
                        href="/admin/inventory/stock"
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all"
                        style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                    >
                        ← Danh Sách Tồn Kho
                    </Link>

                    <button
                        onClick={() => setShowConfirmModal(true)}
                        disabled={loading || items.length === 0}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-40 transition-all shadow-sm"
                    >
                        <CheckCircle2 size={16} />
                        Chốt Phiếu & Cân Bằng Tồn Kho
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                    { label: 'Tổng SKU Kiểm Kê', value: items.length, sub: 'Mã hàng trong phiếu', color: 'var(--adm-text)' },
                    { label: 'Khớp Hoàn Hảo', value: matchedCount, sub: 'Thực tế = Hệ thống', color: '#059669', icon: <CheckCircle2 size={12} /> },
                    { label: 'Thiếu Hụt (Deficit)', value: deficitCount, sub: 'Thực tế < Hệ thống', color: '#e11d48', icon: <AlertTriangle size={12} /> },
                    { label: 'Dư Thừa (Surplus)', value: surplusCount, sub: 'Thực tế > Hệ thống', color: '#d97706', icon: <Plus size={12} /> },
                ].map((stat, i) => (
                    <div key={i} className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                        <p className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: stat.color || 'var(--adm-text-muted)' }}>
                            {stat.icon}{stat.label}
                        </p>
                        <p className="text-xl font-black mt-1" style={{ color: stat.color || 'var(--adm-text)' }}>{stat.value}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--adm-text-subtle)' }}>{stat.sub}</p>
                    </div>
                ))}

                <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl border" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--adm-text-muted)' }}>Chênh Lệch Tài Chính</p>
                    <p className={`text-base font-black mt-1 truncate ${
                        totalValueVariance < 0 ? 'text-rose-600' : totalValueVariance > 0 ? 'text-amber-600' : ''
                    }`} style={totalValueVariance === 0 ? { color: 'var(--adm-text-muted)' } : {}}>
                        {totalValueVariance > 0 ? '+' : ''}{formatVND(totalValueVariance)}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--adm-text-subtle)' }}>Giá trị vốn chênh lệch</p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl border"
                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <div className="flex-1 flex items-center gap-2 rounded-xl px-4 py-2.5 border"
                    style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                    <Search size={16} className="shrink-0" style={{ color: 'var(--adm-text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Tìm theo Tên sản phẩm, Mã SKU, Màu, Size..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="flex-1 bg-transparent text-xs focus:outline-none"
                        style={{ color: 'var(--adm-text)' }}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} style={{ color: 'var(--adm-text-muted)' }}>
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setOnlyVariances(prev => !prev)}
                        className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            onlyVariances ? 'bg-amber-50 text-amber-700 border-amber-300' : 'border'
                        }`}
                        style={!onlyVariances ? { backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' } : {}}
                    >
                        <AlertTriangle size={13} />
                        Chỉ xem mã chênh lệch ({deficitCount + surplusCount})
                    </button>

                    <button
                        onClick={handleSetAllMatched}
                        className="px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all"
                        style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                    >
                        <Check size={13} className="text-emerald-600" />
                        Cân bằng tất cả
                    </button>

                    <button
                        onClick={handleResetAllZero}
                        className="px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all"
                        style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                    >
                        <RefreshCw size={13} className="text-rose-500" />
                        Đặt về 0 đếm lại
                    </button>
                </div>
            </div>

            {/* Stocktake Table */}
            <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="text-[10px] font-bold uppercase tracking-wider border-b"
                            style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' }}>
                            <tr>
                                <th className="px-5 py-4">Mã SKU & Sản Phẩm</th>
                                <th className="px-4 py-4 text-center">Tồn Hệ Thống</th>
                                <th className="px-4 py-4 text-center min-w-[180px]">Tồn Thực Tế Kiểm Đếm</th>
                                <th className="px-4 py-4 text-center">Chênh Lệch (Số Lượng)</th>
                                <th className="px-4 py-4 text-center">Giá Trị Chênh Lệch</th>
                                <th className="px-4 py-4">Trạng Thái Kiểm Kê</th>
                            </tr>
                        </thead>
                        <tbody style={{ borderColor: 'var(--adm-border)' }}>
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 6 }).map((__, j) => (
                                            <td key={j} className="px-4 py-4">
                                                <div className="h-4 rounded animate-pulse" style={{ backgroundColor: 'var(--adm-surface-2)' }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-16 text-center" style={{ color: 'var(--adm-text-muted)' }}>
                                        <Layers size={40} className="mx-auto mb-3 opacity-20 text-blue-400" />
                                        <p className="text-sm font-semibold" style={{ color: 'var(--adm-text)' }}>Không tìm thấy mã SKU nào phù hợp</p>
                                        <p className="text-xs mt-1" style={{ color: 'var(--adm-text-muted)' }}>Thử tắt lọc chênh lệch hoặc xóa từ khóa tìm kiếm</p>
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
                                            className="border-b last:border-0 transition-colors"
                                            style={{
                                                borderColor: 'var(--adm-border)',
                                                backgroundColor: diff < 0
                                                    ? 'rgba(225,29,72,0.04)'
                                                    : diff > 0
                                                    ? 'rgba(217,119,6,0.04)'
                                                    : 'transparent'
                                            }}
                                        >
                                            <td className="px-5 py-4">
                                                <p className="font-mono font-bold text-amber-600 text-xs">{item.sku}</p>
                                                <p className="font-semibold text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--adm-text)' }}>{item.productName}</p>
                                                <div className="flex items-center gap-2 text-[10px] mt-1" style={{ color: 'var(--adm-text-muted)' }}>
                                                    <span className="px-1.5 py-0.5 rounded border font-mono" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>Màu: {item.color}</span>
                                                    <span className="px-1.5 py-0.5 rounded border font-mono" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>Size: {item.size}</span>
                                                    {item.locationRack && (
                                                        <span className="px-1.5 py-0.5 rounded border font-mono" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>Kệ: {item.locationRack}</span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 text-center font-black text-sm" style={{ color: 'var(--adm-text)' }}>
                                                {item.available}
                                            </td>

                                            <td className="px-4 py-4 text-center">
                                                <div className="inline-flex items-center gap-1.5 p-1 rounded-xl border" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleActualChange(item.sku, actual - 1)}
                                                        className="w-8 h-8 rounded-lg border font-bold flex items-center justify-center transition-all active:scale-95"
                                                        style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                                                    >
                                                        -
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={actual}
                                                        onChange={e => handleActualChange(item.sku, parseInt(e.target.value) || 0)}
                                                        className="w-16 text-center font-mono font-black text-amber-600 text-sm focus:outline-none bg-transparent"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleActualChange(item.sku, actual + 1)}
                                                        className="w-8 h-8 rounded-lg border font-bold flex items-center justify-center transition-all active:scale-95"
                                                        style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 text-center">
                                                {diff === 0 ? (
                                                    <span className="font-mono" style={{ color: 'var(--adm-text-subtle)' }}>0</span>
                                                ) : diff < 0 ? (
                                                    <span className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-black font-mono text-xs">
                                                        {diff}
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-black font-mono text-xs">
                                                        +{diff}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-4 text-center font-semibold text-xs">
                                                {valDiff === 0 ? (
                                                    <span style={{ color: 'var(--adm-text-subtle)' }}>0đ</span>
                                                ) : (
                                                    <span className={valDiff < 0 ? 'text-rose-600' : 'text-amber-600'}>
                                                        {valDiff > 0 ? '+' : ''}{formatVND(valDiff)}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-4">
                                                {diff === 0 ? (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                                                        <CheckCircle2 size={11} /> Khớp chuẩn
                                                    </span>
                                                ) : diff < 0 ? (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                                                        <AlertTriangle size={11} /> Thiếu hụt
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
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

            {/* Confirmation Modal */}
            <AnimatePresence>
                {showConfirmModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="rounded-2xl p-6 max-w-xl w-full shadow-2xl relative space-y-5 border"
                            style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                        >
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="absolute top-5 right-5 p-1 rounded-xl transition-colors"
                                style={{ color: 'var(--adm-text-muted)', backgroundColor: 'var(--adm-surface-2)' }}
                            >
                                <X size={18} />
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                                    <CheckCircle2 size={22} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold" style={{ color: 'var(--adm-text)' }}>Xác Nhận Chốt Phiếu Kiểm Kê</h3>
                                    <p className="text-xs" style={{ color: 'var(--adm-text-muted)' }}>Cân bằng tự động số lượng khả dụng trong kho hệ thống WMS</p>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl border space-y-2 text-xs" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                                <div className="flex items-center justify-between" style={{ color: 'var(--adm-text)' }}>
                                    <span>Tổng số mã SKU kiểm kê:</span>
                                    <strong className="font-mono">{items.length} mã</strong>
                                </div>
                                <div className="flex items-center justify-between" style={{ color: 'var(--adm-text)' }}>
                                    <span>Số mã khớp hoàn hảo:</span>
                                    <strong className="text-emerald-600 font-mono">{matchedCount} mã</strong>
                                </div>
                                <div className="flex items-center justify-between" style={{ color: 'var(--adm-text)' }}>
                                    <span>Số mã bị chênh lệch:</span>
                                    <strong className="text-amber-600 font-mono">{varianceItemsList.length} mã</strong>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}>
                                    <span>Tổng chênh lệch tài chính:</span>
                                    <strong className={`font-black text-sm font-mono ${totalValueVariance < 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                                        {totalValueVariance > 0 ? '+' : ''}{formatVND(totalValueVariance)}
                                    </strong>
                                </div>
                            </div>

                            {varianceItemsList.length > 0 && (
                                <div className="space-y-1.5">
                                    <p className="text-xs font-semibold" style={{ color: 'var(--adm-text)' }}>Các mã SKU sẽ bị điều chỉnh:</p>
                                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                                        {varianceItemsList.map(i => {
                                            const diff = (i.actualCount ?? i.available) - i.available;
                                            return (
                                                <div key={i.sku} className="flex items-center justify-between px-3 py-2 rounded-xl text-xs border"
                                                    style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                                                    <div>
                                                        <span className="font-mono font-bold text-amber-600">{i.sku}</span> - <span style={{ color: 'var(--adm-text)' }}>{i.productName}</span>
                                                    </div>
                                                    <span className={`font-mono font-bold ${diff < 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                                                        {diff > 0 ? '+' : ''}{diff}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold" style={{ color: 'var(--adm-text)' }}>Ghi chú phiếu kiểm kê</label>
                                <textarea
                                    rows={2}
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Ví dụ: Kiểm kê định kỳ tháng 7/2026, kho tổng Long An..."
                                    className="w-full border rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500 resize-none"
                                    style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmModal(false)}
                                    className="px-4 py-2.5 rounded-xl text-xs font-semibold border"
                                    style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePerformReconciliation}
                                    disabled={submitting}
                                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-sm"
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
