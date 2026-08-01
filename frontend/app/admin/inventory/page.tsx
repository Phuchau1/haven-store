'use client';

import React, { useState, useEffect } from 'react';
import { Boxes, AlertTriangle, ArrowDownLeft, ArrowUpRight, Download } from 'lucide-react';
import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    PointElement, 
    LineElement, 
    Title, 
    Tooltip, 
    Legend,
    BarElement 
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend
);

export default function WMSDashboard() {
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalSKUs: 0,
        totalStock: 0,
        totalStockValue: 0,
        lowStockSKUs: 0,
        outOfStockSKUs: 0,
        importsToday: 0,
        exportsToday: 0,
        chartLabels: [],
        importData: [],
        exportData: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/inventory-reports/dashboard-stats')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setStats(data.data);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const lineChartData = {
        labels: stats.chartLabels || ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
        datasets: [
            {
                label: 'Nhập kho',
                data: stats.importData || [0, 0, 0, 0, 0, 0, 0],
                borderColor: 'rgb(16, 185, 129)',
                tension: 0.3
            },
            {
                label: 'Xuất kho',
                data: stats.exportData || [0, 0, 0, 0, 0, 0, 0],
                borderColor: 'rgb(244, 63, 94)',
                tension: 0.3
            }
        ]
    };

    if (loading) return <div className="p-8 text-center" style={{ color: 'var(--adm-text-muted)' }}>Đang tải dữ liệu...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center p-6 rounded-2xl border shadow-sm"
                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <div>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--adm-text)' }}>Dashboard Kho Hàng</h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>Tổng quan tình hình xuất nhập tồn theo thời gian thực</p>
                </div>
                <a 
                    href="/api/export/excel/transactions" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm"
                >
                    <Download size={15} />
                    Xuất Excel (Lịch sử)
                </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl border shadow-sm flex items-center gap-4"
                    style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
                        <Boxes size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--adm-text-muted)' }}>Tổng Tồn Kho</p>
                        <p className="text-xl font-black mt-1" style={{ color: 'var(--adm-text)' }}>{stats.totalStock.toLocaleString('vi-VN')} chiếc</p>
                    </div>
                </div>
                
                <div className="p-5 rounded-2xl border shadow-sm flex items-center gap-4"
                    style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                    <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 border border-rose-100 shrink-0">
                        <AlertTriangle size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--adm-text-muted)' }}>Hết / Sắp Hết</p>
                        <p className="text-xl font-black text-rose-600 mt-1">{stats.outOfStockSKUs} / {stats.lowStockSKUs} SKU</p>
                    </div>
                </div>

                <div className="p-5 rounded-2xl border shadow-sm flex items-center gap-4"
                    style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
                        <ArrowDownLeft size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--adm-text-muted)' }}>Nhập hôm nay</p>
                        <p className="text-xl font-black text-emerald-600 mt-1">+{stats.importsToday}</p>
                    </div>
                </div>

                <div className="p-5 rounded-2xl border shadow-sm flex items-center gap-4"
                    style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
                        <ArrowUpRight size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--adm-text-muted)' }}>Xuất hôm nay</p>
                        <p className="text-xl font-black text-amber-600 mt-1">-{stats.exportsToday}</p>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl border shadow-sm"
                    style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                    <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--adm-text)' }}>Lưu lượng Nhập/Xuất (Tháng)</h3>
                    <Line data={lineChartData} options={{ responsive: true }} />
                </div>
                <div className="p-6 rounded-2xl border shadow-sm flex flex-col justify-between"
                    style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                    <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--adm-text)' }}>Giá trị Tồn Kho ước tính</h3>
                    <div className="flex flex-col items-center justify-center py-8">
                        <p className="text-4xl font-black text-amber-600">{stats.totalStockValue.toLocaleString('vi-VN')} đ</p>
                        <p className="text-xs mt-2" style={{ color: 'var(--adm-text-muted)' }}>Dựa trên giá bán hiện tại của {stats.totalSKUs} SKU</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
