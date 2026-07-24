'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Layers, Search, CheckCircle2, AlertTriangle, RefreshCw,
    Download, FileText, Check, ShieldAlert, ArrowLeftRight
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
}

export default function StocktakePage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [notes, setNotes] = useState('');

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/wms/inventory?limit=50');
            const data = await res.json();
            if (data.success) {
                const initial = (data.items || []).map((i: any) => ({
                    ...i,
                    actualCount: i.available // Mặc định tồn thực tế = tồn hệ thống
                }));
                setItems(initial);
            }
        } catch (err) {
            toast.error('Không thể tải danh sách tồn kho');
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
                    notes,
                    user: 'Admin WMS Manager'
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success('✨ Đã kiểm kê & cân bằng tồn kho thành công!');
                fetchInventory();
            } else {
                throw new Error(data.message);
            }
        } catch (err: any) {
            toast.error(err.message || 'Lỗi kiểm kê kho');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredItems = items.filter(i =>
        i.productName.toLowerCase().includes(search.toLowerCase()) ||
        i.sku.toLowerCase().includes(search.toLowerCase())
    );

    // Tính tổng chênh lệch
    const totalVariance = filteredItems.reduce((sum, item) => sum + ((item.actualCount ?? item.available) - item.available), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
                <div>
                    <div className="flex items-center gap-2">
                        <Link href="/admin/inventory/wms-dashboard" className="text-slate-400 hover:text-white text-xs transition-colors">
                            ← Về WMS Dashboard
                        </Link>
                        <span className="text-slate-700">|</span>
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">
                            Stocktake & Reconciliation
                        </span>
                    </div>
                    <h1 className="text-2xl font-black text-white mt-1">Kiểm Kê Kho Thực Tế & Cân Bằng Tồn Kho</h1>
                    <p className="text-slate-400 text-xs">So sánh số lượng tồn kho Hệ thống vs Thực tế và điều chỉnh tự động</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePerformReconciliation}
                        disabled={submitting || loading}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-bold shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
                    >
                        {submitting ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        Tạo Biên Bản & Cân Bằng Kho
                    </button>
                </div>
            </div>

            {/* Filter & Summary Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 flex items-center gap-3 col-span-2">
                    <Search size={16} className="text-slate-500" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo mã SKU, Tên sản phẩm..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-transparent text-white placeholder-slate-500 text-xs focus:outline-none"
                    />
                </div>

                <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400 text-xs font-medium">Tổng Chênh Lệch:</span>
                    <span className={`font-black text-sm ${totalVariance === 0 ? 'text-emerald-400' : totalVariance > 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                        {totalVariance > 0 ? `+${totalVariance}` : totalVariance} sản phẩm
                    </span>
                </div>
            </div>

            {/* Stocktake Table */}
            <div className="bg-slate-900/70 rounded-3xl border border-slate-800 backdrop-blur-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                            <tr>
                                <th className="p-4">Mã SKU</th>
                                <th className="p-4">Sản Phẩm</th>
                                <th className="p-4">Màu / Size</th>
                                <th className="p-4 text-center">Tồn Hệ Thống</th>
                                <th className="p-4 text-center">Tồn Thực Tế</th>
                                <th className="p-4 text-center">Chênh Lệch</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">
                                        <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-amber-400" />
                                        Đang tải dữ liệu tồn kho...
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">
                                        Không tìm thấy mã SKU nào phù hợp
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map(item => {
                                    const actual = item.actualCount ?? item.available;
                                    const diff = actual - item.available;

                                    return (
                                        <tr key={item.sku} className="hover:bg-slate-800/40 transition-colors">
                                            <td className="p-4 font-bold text-amber-400">{item.sku}</td>
                                            <td className="p-4 font-semibold text-white">{item.productName}</td>
                                            <td className="p-4 text-slate-400">{item.color} / {item.size}</td>
                                            <td className="p-4 text-center font-bold text-slate-200">{item.available}</td>
                                            <td className="p-4 text-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={actual}
                                                    onChange={e => handleActualChange(item.sku, parseInt(e.target.value) || 0)}
                                                    className="w-20 bg-slate-950 border border-slate-700 rounded-xl px-2 py-1 text-center font-bold text-white focus:outline-none focus:border-amber-400"
                                                />
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                                                    diff === 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                    diff > 0 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                    'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                }`}>
                                                    {diff > 0 ? `+${diff}` : diff}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
