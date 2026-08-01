'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Home } from 'lucide-react';

export default function WarehousesPage() {
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', code: '', address: '' });

    const fetchWarehouses = () => {
        fetch('/api/warehouses')
            .then(res => res.json())
            .then(data => {
                if (data.success) setWarehouses(data.data);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchWarehouses();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/warehouses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                setShowModal(false);
                setFormData({ name: '', code: '', address: '' });
                fetchWarehouses();
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa kho này?')) return;
        try {
            const res = await fetch(`/api/warehouses?id=${id}`, { method: 'DELETE' });
            if (res.ok) fetchWarehouses();
        } catch (err) {
            console.error(err);
        }
    };

    const inputStyle = { backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex justify-between items-center p-5 rounded-2xl border shadow-sm"
                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--adm-text)' }}>
                        <Home size={20} className="text-blue-500" />
                        Danh Sách Kho Hàng
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>Quản lý mạng lưới địa điểm và chi nhánh kho</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                    <Plus size={15} /> Thêm Kho Mới
                </button>
            </div>

            {/* Table */}
            <div className="rounded-2xl border shadow-sm overflow-hidden"
                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b uppercase text-[10px] font-bold tracking-wider"
                                style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' }}>
                                <th className="px-4 py-3">Mã Kho</th>
                                <th className="px-4 py-3">Tên Kho</th>
                                <th className="px-4 py-3">Địa Chỉ</th>
                                <th className="px-4 py-3">Trạng Thái</th>
                                <th className="px-4 py-3 text-right">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: 'var(--adm-border)' }}>
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 5 }).map((__, j) => (
                                            <td key={j} className="px-4 py-3">
                                                <div className="h-3 rounded animate-pulse" style={{ backgroundColor: 'var(--adm-surface-2)' }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : warehouses.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-12" style={{ color: 'var(--adm-text-muted)' }}>Chưa có kho nào.</td></tr>
                            ) : (
                                warehouses.map(wh => (
                                    <tr key={wh.id} className="transition-colors hover:bg-black/[0.02]">
                                        <td className="px-4 py-3 font-bold font-mono text-amber-600">{wh.code}</td>
                                        <td className="px-4 py-3 font-bold" style={{ color: 'var(--adm-text)' }}>{wh.name}</td>
                                        <td className="px-4 py-3" style={{ color: 'var(--adm-text-muted)' }}>{wh.address}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                                                {wh.status === 'active' ? '🟢 Hoạt động' : '🔴 Đóng cửa'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => handleDelete(wh.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl"
                        style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                        <h3 className="text-base font-bold" style={{ color: 'var(--adm-text)' }}>Thêm Kho Mới</h3>
                        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                            <div className="space-y-1">
                                <label className="font-bold" style={{ color: 'var(--adm-text-muted)' }}>Mã Kho *</label>
                                <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})}
                                    className="w-full border rounded-xl px-3 py-2 focus:outline-none" style={inputStyle} placeholder="VD: WH-HN" />
                            </div>
                            <div className="space-y-1">
                                <label className="font-bold" style={{ color: 'var(--adm-text-muted)' }}>Tên Kho *</label>
                                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full border rounded-xl px-3 py-2 focus:outline-none" style={inputStyle} placeholder="VD: Kho Tổng Hà Nội" />
                            </div>
                            <div className="space-y-1">
                                <label className="font-bold" style={{ color: 'var(--adm-text-muted)' }}>Địa Chỉ *</label>
                                <input required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                                    className="w-full border rounded-xl px-3 py-2 focus:outline-none" style={inputStyle} placeholder="Địa chỉ chi tiết..." />
                            </div>
                            <div className="flex gap-3 justify-end pt-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-xl font-bold"
                                    style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}>Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm">Lưu Kho</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
