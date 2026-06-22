'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Eye, CheckCircle, XCircle } from 'lucide-react';

interface PurchaseOrder {
    id: string;
    supplier_id: string;
    expected_date?: string;
    total_amount?: number;
    status: string;
}

export default function PurchaseOrdersPage() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = () => {
        fetch('/api/purchase-orders')
            .then(res => res.json())
            .then(data => {
                if (data.success) setOrders(data.data);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const updateStatus = async (id: string, status: string) => {
        if (!confirm(`Xác nhận chuyển trạng thái thành: ${status}?`)) return;
        try {
            const res = await fetch(`/api/purchase-orders/status?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
                fetchOrders();
            } else {
                alert('Lỗi: ' + data.message);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Đơn mua hàng (PO)</h3>
                <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700">
                    <Plus size={16} /> Tạo Đơn Mua
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Mã Đơn</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Nhà Cung Cấp</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Ngày dự kiến</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Tổng tiền</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Trạng thái</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-4 text-slate-500">Đang tải...</td></tr>
                        ) : orders.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-4 text-slate-500">Chưa có đơn mua hàng nào.</td></tr>
                        ) : (
                            orders.map(po => (
                                <tr key={po.id} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-3 font-semibold text-slate-700">{po.id}</td>
                                    <td className="px-4 py-3 text-slate-900">{po.supplier_id}</td>
                                    <td className="px-4 py-3 text-slate-600">{po.expected_date || 'N/A'}</td>
                                    <td className="px-4 py-3 font-bold text-indigo-600">{po.total_amount?.toLocaleString('vi-VN')} đ</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                            po.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-700' :
                                            po.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                                            po.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                            {po.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
                                            <>
                                                {po.status === 'DRAFT' || po.status === 'PENDING' ? (
                                                    <button onClick={() => updateStatus(po.id, 'APPROVED')} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg mr-1" title="Duyệt đơn"><CheckCircle size={16} /></button>
                                                ) : po.status === 'APPROVED' ? (
                                                    <button onClick={() => updateStatus(po.id, 'RECEIVED')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg mr-1" title="Đã nhận hàng (Tạo phiếu nhập)"><CheckCircle size={16} /></button>
                                                ) : null}
                                                <button onClick={() => updateStatus(po.id, 'CANCELLED')} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg mr-2" title="Hủy đơn"><XCircle size={16} /></button>
                                            </>
                                        )}
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
