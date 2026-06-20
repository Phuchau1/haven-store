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
import { Line, Bar } from 'react-chartjs-2';

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

    if (loading) return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Dashboard Kho Hàng</h2>
                    <p className="text-sm text-slate-500">Tổng quan tình hình xuất nhập tồn.</p>
                </div>
                <a 
                    href="/api/export/excel/transactions" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Download size={16} />
                    Xuất Excel (Lịch sử)
                </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Boxes size={22} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tổng Tồn Kho</p>
                        <p className="text-xl font-bold text-slate-800 mt-1">{stats.totalStock.toLocaleString('vi-VN')} chiếc</p>
                    </div>
                </div>
                
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                        <AlertTriangle size={22} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Hết / Sắp Hết</p>
                        <p className="text-xl font-bold text-rose-600 mt-1">{stats.outOfStockSKUs} / {stats.lowStockSKUs} SKU</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                        <ArrowDownLeft size={22} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Nhập hôm nay</p>
                        <p className="text-xl font-bold text-emerald-600 mt-1">+{stats.importsToday}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                        <ArrowUpRight size={22} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Xuất hôm nay</p>
                        <p className="text-xl font-bold text-amber-600 mt-1">-{stats.exportsToday}</p>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4">Lưu lượng Nhập/Xuất (Tháng)</h3>
                    <Line data={lineChartData} options={{ responsive: true }} />
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4">Giá trị Tồn Kho ước tính</h3>
                    <div className="flex flex-col items-center justify-center h-full">
                        <p className="text-4xl font-black text-indigo-600">{stats.totalStockValue.toLocaleString('vi-VN')} đ</p>
                        <p className="text-slate-500 mt-2">Dựa trên giá bán hiện tại của {stats.totalSKUs} SKU</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
