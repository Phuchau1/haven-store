'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Eye, FileDown } from 'lucide-react';

export default function StockReceiptsPage() {
    const [receipts, setReceipts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReceipts = () => {
        fetch('/api/stock-receipts')
            .then(res => res.json())
            .then(data => {
                if (data.success) setReceipts(data.data);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchReceipts();
    }, []);

    const printReceipt = (id: string) => {
        window.open(`/api/export/pdf/receipt?id=${id}`, '_blank');
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Phiếu Xuất / Nhập Kho</h3>
                <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700">
                    <Plus size={16} /> Tạo Phiếu Kho
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Mã Phiếu</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Loại</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Kho thao tác</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Lý do</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Tổng SL</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Thời gian</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={7} className="text-center py-4 text-slate-500">Đang tải...</td></tr>
                        ) : receipts.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-4 text-slate-500">Chưa có phiếu kho nào.</td></tr>
                        ) : (
                            receipts.map(rec => (
                                <tr key={rec.id} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-3 font-semibold text-slate-700">{rec.id}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                                            rec.type === 'IMPORT' ? 'bg-emerald-50 text-emerald-600' :
                                            rec.type === 'EXPORT' ? 'bg-rose-50 text-rose-600' :
                                            rec.type === 'TRANSFER' ? 'bg-blue-50 text-blue-600' :
                                            'bg-amber-50 text-amber-600'
                                        }`}>
                                            {rec.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-900">
                                        {rec.warehouse_id} 
                                        {rec.dest_warehouse_id ? ` ➔ ${rec.dest_warehouse_id}` : ''}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[200px] truncate">{rec.reason || 'N/A'}</td>
                                    <td className="px-4 py-3 font-bold text-slate-700">{rec.total_quantity}</td>
                                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(rec.createdAt).toLocaleString('vi-VN')}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => printReceipt(rec.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg mr-2" title="In Phiếu PDF"><FileDown size={16} /></button>
                                        <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg" title="Xem chi tiết"><Eye size={16} /></button>
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
