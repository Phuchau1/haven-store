'use client';
import React, { useState, useEffect } from 'react';
import { Zap, DollarSign, ShoppingBag, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
    totalActive: number;
    totalRevenue: number;
    totalSold: number;
    endingSoon: Array<{ id: string; name: string; endTime: string }>;
    topProducts: Array<{ id: string; name: string; sold: number; revenue: number }>;
}

export default function FlashSaleDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/flash-sales/admin/dashboard');
                const json = await res.json();
                if (json.success) setData(json.data);
            } catch (error) {
                console.error('Error fetching dashboard:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="p-6 text-center text-gray-500">Đang tải dữ liệu...</div>;
    }

    if (!data) {
        return <div className="p-6 text-center text-red-500">Lỗi tải dữ liệu</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--adm-text)' }}>Dashboard Flash Sale</h1>
                    <p className="text-sm" style={{ color: 'var(--adm-text-muted)' }}>Thống kê tổng quan các chương trình Flash Sale</p>
                </div>
                <Link href="/admin/flash-sales" className="adm-btn-primary">
                    Quản lý chiến dịch
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="adm-card p-6 flex items-center gap-4">
                    <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl">
                        <Zap size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--adm-text-muted)' }}>Đang chạy</p>
                        <h2 className="text-3xl font-bold">{data.totalActive}</h2>
                    </div>
                </div>
                <div className="adm-card p-6 flex items-center gap-4">
                    <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--adm-text-muted)' }}>Doanh thu</p>
                        <h2 className="text-3xl font-bold">{data.totalRevenue.toLocaleString()} đ</h2>
                    </div>
                </div>
                <div className="adm-card p-6 flex items-center gap-4">
                    <div className="p-4 bg-orange-100 text-orange-600 rounded-2xl">
                        <ShoppingBag size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--adm-text-muted)' }}>Đã bán</p>
                        <h2 className="text-3xl font-bold">{data.totalSold}</h2>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ending Soon */}
                <div className="adm-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="text-rose-500" size={20} />
                        <h3 className="text-lg font-bold">Sắp kết thúc</h3>
                    </div>
                    {data.endingSoon.length > 0 ? (
                        <div className="space-y-4">
                            {data.endingSoon.map((fs) => (
                                <div key={fs.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                    <span className="font-semibold text-gray-800">{fs.name}</span>
                                    <span className="text-sm text-rose-500 font-medium">
                                        KT: {new Date(fs.endTime).toLocaleString('vi-VN')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">Không có Flash Sale nào sắp kết thúc.</p>
                    )}
                </div>

                {/* Top Products */}
                <div className="adm-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="text-blue-500" size={20} />
                        <h3 className="text-lg font-bold">Top sản phẩm bán chạy</h3>
                    </div>
                    {data.topProducts.length > 0 ? (
                        <div className="space-y-4">
                            {data.topProducts.map((p, idx: number) => (
                                <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                        <span className="font-semibold text-gray-800 line-clamp-1">{p.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-emerald-600">{p.sold} đã bán</p>
                                        <p className="text-xs text-gray-500">{p.revenue.toLocaleString()} đ</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">Chưa có dữ liệu sản phẩm bán chạy.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
