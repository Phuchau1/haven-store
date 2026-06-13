'use client';

import React, { useState, useEffect } from 'react';
import { Search, Download, History, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function TransactionsPage() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        // Lấy dữ liệu từ API Lịch sử kho thực tế (đã ghi nhận từ đơn hàng)
        fetch('/api/inventory/history')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setHistory(data.history || []);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const filteredHistory = history.filter(item => 
        (item.productName && item.productName.toLowerCase().includes(filter.toLowerCase())) ||
        (item.note && item.note.toLowerCase().includes(filter.toLowerCase())) ||
        (item.variant_id && item.variant_id.toLowerCase().includes(filter.toLowerCase()))
    );

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <History size={24} className="text-black" />
                        Lịch sử xuất/nhập kho
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Theo dõi biến động số lượng kho của các sản phẩm</p>
                </div>
                
                <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            placeholder="Tìm kiếm SP, mã, ghi chú..." 
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/80">
                            <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider rounded-tl-xl">Thời gian</th>
                            <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Loại</th>
                            <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sản phẩm</th>
                            <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Phân loại</th>
                            <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Số lượng</th>
                            <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider rounded-tr-xl">Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-8 text-slate-500">Đang tải dữ liệu...</td></tr>
                        ) : filteredHistory.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-slate-500">Chưa có lịch sử kho nào.</td></tr>
                        ) : (
                            filteredHistory.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-4 text-sm text-slate-500 whitespace-nowrap">
                                        {new Date(item.created_at).toLocaleString('vi-VN')}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                                            item.type === 'import' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                        }`}>
                                            {item.type === 'import' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                                            {item.type === 'import' ? 'NHẬP' : 'XUẤT'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="font-semibold text-slate-800 line-clamp-1">{item.productName}</div>
                                        <div className="text-xs text-slate-400 font-mono mt-0.5">{item.productId}</div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex gap-1.5">
                                            {item.color && item.color !== 'N/A' && (
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">{item.color}</span>
                                            )}
                                            {item.size && item.size !== 'N/A' && (
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">{item.size}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <span className={`font-bold ${item.type === 'import' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {item.type === 'import' ? '+' : '-'}{item.quantity}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-slate-600">
                                        {item.note || '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
