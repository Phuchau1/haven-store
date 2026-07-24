'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Package, DollarSign, CheckCircle2, Clock, AlertTriangle,
    XCircle, ShieldAlert, ArrowUpRight, ArrowDownRight, RefreshCw,
    Download, TrendingUp, TrendingDown, Layers, Search, Filter
} from 'lucide-react';
import Link from 'next/link';

interface WmsMetrics {
    totalSkus: number;
    totalValuation: number;
    totalAvailable: number;
    totalReserved: number;
    totalSold: number;
    totalDamaged: number;
    statusBreakdown: {
        inStock: number;
        lowStock: number;
        outOfStock: number;
    };
    topStocked: any[];
    topSold: any[];
}

export default function WmsDashboardPage() {
    const [metrics, setMetrics] = useState<WmsMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/wms/dashboard');
            const data = await res.json();
            if (data.success) {
                setMetrics(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch WMS dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    const formatVND = (num: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                            Enterprise WMS System
                        </span>
                        <span className="text-slate-500 text-xs">• Real-time Sync</span>
                    </div>
                    <h1 className="text-2xl font-black text-white mt-1">Báo Cáo Tồn Kho Executive WMS</h1>
                    <p className="text-slate-400 text-xs">Quản lý giá trị kho, 6 trạng thái tồn kho và cảnh báo theo thời gian thực</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchDashboard}
                        disabled={loading}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Làm Mới
                    </button>

                    <Link
                        href="/admin/inventory/stocktake"
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-bold shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
                    >
                        <Layers size={14} /> Kiểm Kê Kho
                    </Link>
                </div>
            </div>

            {/* 8 Metric Executive Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Tổng SKU */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/70 rounded-2xl p-5 border border-slate-800 backdrop-blur-xl space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-medium">Tổng Mã SKU</span>
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                            <Package size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-white">{metrics?.totalSkus || 0}</p>
                    <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                        <TrendingUp size={12} /> Đang hoạt động
                    </p>
                </motion.div>

                {/* 2. Giá trị tồn kho */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-slate-900/70 rounded-2xl p-5 border border-slate-800 backdrop-blur-xl space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-medium">Giá Trị Tồn Kho</span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                            <DollarSign size={16} />
                        </div>
                    </div>
                    <p className="text-xl font-black text-amber-400">{formatVND(metrics?.totalValuation || 0)}</p>
                    <p className="text-[11px] text-slate-400 font-medium">Giá vốn ước tính</p>
                </motion.div>

                {/* 3. Tồn khả dụng (Available) */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900/70 rounded-2xl p-5 border border-slate-800 backdrop-blur-xl space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-medium">Khả Dụng (Available)</span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                            <CheckCircle2 size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-emerald-400">{metrics?.totalAvailable || 0}</p>
                    <p className="text-[11px] text-slate-400">Sẵn sàng mở bán</p>
                </motion.div>

                {/* 4. Đọng giữ đơn (Reserved) */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-900/70 rounded-2xl p-5 border border-slate-800 backdrop-blur-xl space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-medium">Giữ Cho Đơn (Reserved)</span>
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                            <Clock size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-amber-400">{metrics?.totalReserved || 0}</p>
                    <p className="text-[11px] text-slate-400">Chờ duyệt xuất kho</p>
                </motion.div>

                {/* 5. Đã bán (Sold) */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-900/70 rounded-2xl p-5 border border-slate-800 backdrop-blur-xl space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-medium">Đã Bán Thành Công</span>
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                            <TrendingUp size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-purple-400">{metrics?.totalSold || 0}</p>
                    <p className="text-[11px] text-slate-400">Số lượng đã giao bán</p>
                </motion.div>

                {/* 6. Hàng hỏng (Damaged) */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-slate-900/70 rounded-2xl p-5 border border-slate-800 backdrop-blur-xl space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-medium">Hàng Hỏng (Damaged)</span>
                        <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                            <ShieldAlert size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-rose-400">{metrics?.totalDamaged || 0}</p>
                    <p className="text-[11px] text-slate-400">Kho hàng lỗi / hủy</p>
                </motion.div>

                {/* 7. Sắp hết hàng */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-slate-900/70 rounded-2xl p-5 border border-slate-800 backdrop-blur-xl space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-medium">Sắp Hết Hàng (Low)</span>
                        <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20">
                            <AlertTriangle size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-orange-400">{metrics?.statusBreakdown?.lowStock || 0}</p>
                    <p className="text-[11px] text-slate-400">Dưới ngưỡng an toàn</p>
                </motion.div>

                {/* 8. Hết hàng */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-slate-900/70 rounded-2xl p-5 border border-slate-800 backdrop-blur-xl space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-medium">Hết Hàng (Out of Stock)</span>
                        <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
                            <XCircle size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-red-400">{metrics?.statusBreakdown?.outOfStock || 0}</p>
                    <p className="text-[11px] text-slate-400">Cần nhập thêm gấp</p>
                </motion.div>
            </div>

            {/* Top Tables Showcase */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Tồn Nhiều Nhất */}
                <div className="bg-slate-900/70 rounded-3xl p-6 border border-slate-800 backdrop-blur-xl space-y-4">
                    <h3 className="text-white font-bold text-sm flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Package size={16} className="text-amber-400" />
                            Top Tồn Kho Nhiều Nhất
                        </span>
                        <span className="text-xs text-slate-400">High Stock Items</span>
                    </h3>

                    <div className="space-y-2 text-xs">
                        {metrics?.topStocked?.map((item, idx) => (
                            <div key={idx} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
                                <div>
                                    <p className="text-white font-semibold line-clamp-1">{item.productName}</p>
                                    <p className="text-slate-500 text-[11px]">SKU: {item.sku} • {item.color} / {item.size}</p>
                                </div>
                                <span className="bg-emerald-500/10 text-emerald-400 font-bold px-3 py-1 rounded-lg border border-emerald-500/20">
                                    {item.available} sản phẩm
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Bán Chạy Nhất */}
                <div className="bg-slate-900/70 rounded-3xl p-6 border border-slate-800 backdrop-blur-xl space-y-4">
                    <h3 className="text-white font-bold text-sm flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <TrendingUp size={16} className="text-purple-400" />
                            Top Bán Chạy Nhất (Best Sellers)
                        </span>
                        <span className="text-xs text-slate-400">High Volume</span>
                    </h3>

                    <div className="space-y-2 text-xs">
                        {metrics?.topSold?.map((item, idx) => (
                            <div key={idx} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
                                <div>
                                    <p className="text-white font-semibold line-clamp-1">{item.productName}</p>
                                    <p className="text-slate-500 text-[11px]">SKU: {item.sku} • {item.color} / {item.size}</p>
                                </div>
                                <span className="bg-purple-500/10 text-purple-400 font-bold px-3 py-1 rounded-lg border border-purple-500/20">
                                    Đã bán {item.sold}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
