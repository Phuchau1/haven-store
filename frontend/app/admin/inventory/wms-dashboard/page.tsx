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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                            Enterprise WMS System
                        </span>
                        <span className="text-xs" style={{ color: 'var(--adm-text-subtle)' }}>• Tự động đồng bộ MongoDB</span>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight mt-1" style={{ color: 'var(--adm-text)' }}>Báo Cáo Tồn Kho Executive WMS</h1>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>Quản lý giá trị kho, 6 trạng thái tồn kho và cảnh báo theo thời gian thực từ MongoDB</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchDashboard}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all"
                        style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Làm Mới
                    </button>

                    <Link
                        href="/admin/inventory/stocktake"
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all"
                    >
                        <Layers size={14} /> Kiểm Kê Kho
                    </Link>
                </div>
            </div>

            {/* 8 Metric Executive Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Tổng SKU */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-4 border space-y-2" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium" style={{ color: 'var(--adm-text-muted)' }}>Tổng Mã SKU</span>
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                            <Package size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-black" style={{ color: 'var(--adm-text)' }}>{metrics?.totalSkus || 0}</p>
                    <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                        <TrendingUp size={12} /> Đang hoạt động
                    </p>
                </motion.div>

                {/* 2. Giá trị tồn kho */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl p-4 border space-y-2" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium" style={{ color: 'var(--adm-text-muted)' }}>Giá Trị Tồn Kho</span>
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                            <DollarSign size={16} />
                        </div>
                    </div>
                    <p className="text-xl font-black text-amber-600">{formatVND(metrics?.totalValuation || 0)}</p>
                    <p className="text-[11px] font-medium" style={{ color: 'var(--adm-text-subtle)' }}>Giá vốn ước tính</p>
                </motion.div>

                {/* 3. Tồn khả dụng (Available) */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl p-4 border space-y-2" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium" style={{ color: 'var(--adm-text-muted)' }}>Khả Dụng (Available)</span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                            <CheckCircle2 size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-emerald-600">{metrics?.totalAvailable || 0}</p>
                    <p className="text-[11px]" style={{ color: 'var(--adm-text-subtle)' }}>Sẵn sàng mở bán</p>
                </motion.div>

                {/* 4. Đọng giữ đơn (Reserved) */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl p-4 border space-y-2" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium" style={{ color: 'var(--adm-text-muted)' }}>Giữ Cho Đơn (Reserved)</span>
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                            <Clock size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-indigo-600">{metrics?.totalReserved || 0}</p>
                    <p className="text-[11px]" style={{ color: 'var(--adm-text-subtle)' }}>Chờ duyệt xuất kho</p>
                </motion.div>

                {/* 5. Đã bán (Sold) */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl p-4 border space-y-2" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium" style={{ color: 'var(--adm-text-muted)' }}>Đã Bán Thành Công</span>
                        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                            <TrendingUp size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-purple-600">{metrics?.totalSold || 0}</p>
                    <p className="text-[11px]" style={{ color: 'var(--adm-text-subtle)' }}>Số lượng đã bán (MongoDB)</p>
                </motion.div>

                {/* 6. Hàng hỏng (Damaged) */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-2xl p-4 border space-y-2" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium" style={{ color: 'var(--adm-text-muted)' }}>Hàng Hỏng (Damaged)</span>
                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                            <ShieldAlert size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-rose-600">{metrics?.totalDamaged || 0}</p>
                    <p className="text-[11px]" style={{ color: 'var(--adm-text-subtle)' }}>Kho hàng lỗi / hủy</p>
                </motion.div>

                {/* 7. Sắp hết hàng */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl p-4 border space-y-2" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium" style={{ color: 'var(--adm-text-muted)' }}>Sắp Hết Hàng (Low)</span>
                        <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                            <AlertTriangle size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-orange-600">{metrics?.statusBreakdown?.lowStock || 0}</p>
                    <p className="text-[11px]" style={{ color: 'var(--adm-text-subtle)' }}>Dưới ngưỡng an toàn</p>
                </motion.div>

                {/* 8. Hết hàng */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="rounded-2xl p-4 border space-y-2" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium" style={{ color: 'var(--adm-text-muted)' }}>Hết Hàng (Out of Stock)</span>
                        <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
                            <XCircle size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-red-600">{metrics?.statusBreakdown?.outOfStock || 0}</p>
                    <p className="text-[11px]" style={{ color: 'var(--adm-text-subtle)' }}>Cần nhập thêm gấp</p>
                </motion.div>
            </div>

            {/* Top Tables Showcase */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Tồn Nhiều Nhất */}
                <div className="rounded-2xl p-5 border space-y-4" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                    <h3 className="font-bold text-sm flex items-center justify-between" style={{ color: 'var(--adm-text)' }}>
                        <span className="flex items-center gap-2">
                            <Package size={16} className="text-amber-500" />
                            Top Tồn Kho Nhiều Nhất (MongoDB)
                        </span>
                        <span className="text-xs" style={{ color: 'var(--adm-text-subtle)' }}>High Stock Items</span>
                    </h3>

                    <div className="space-y-2 text-xs">
                        {metrics?.topStocked?.map((item, idx) => (
                            <div key={idx} className="p-3 rounded-xl border flex items-center justify-between" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                                <div>
                                    <p className="font-semibold line-clamp-1" style={{ color: 'var(--adm-text)' }}>{item.productName}</p>
                                    <p className="text-[11px]" style={{ color: 'var(--adm-text-subtle)' }}>SKU: {item.sku} • {item.color} / {item.size}</p>
                                </div>
                                <span className="bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-lg border border-emerald-200">
                                    {item.available} sản phẩm
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Bán Chạy Nhất */}
                <div className="rounded-2xl p-5 border space-y-4" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                    <h3 className="font-bold text-sm flex items-center justify-between" style={{ color: 'var(--adm-text)' }}>
                        <span className="flex items-center gap-2">
                            <TrendingUp size={16} className="text-purple-500" />
                            Top Bán Chạy Nhất (Best Sellers - MongoDB)
                        </span>
                        <span className="text-xs" style={{ color: 'var(--adm-text-subtle)' }}>High Volume</span>
                    </h3>

                    <div className="space-y-2 text-xs">
                        {metrics?.topSold?.map((item, idx) => (
                            <div key={idx} className="p-3 rounded-xl border flex items-center justify-between" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                                <div>
                                    <p className="font-semibold line-clamp-1" style={{ color: 'var(--adm-text)' }}>{item.productName}</p>
                                    <p className="text-[11px]" style={{ color: 'var(--adm-text-subtle)' }}>SKU: {item.sku} • {item.color} / {item.size}</p>
                                </div>
                                <span className="bg-purple-50 text-purple-700 font-bold px-3 py-1 rounded-lg border border-purple-200">
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
