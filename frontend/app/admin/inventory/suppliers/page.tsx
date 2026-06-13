'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', tax_code: '' });

    const fetchSuppliers = () => {
        fetch('/api/suppliers')
            .then(res => res.json())
            .then(data => {
                if (data.success) setSuppliers(data.data);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/suppliers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                setShowModal(false);
                setFormData({ name: '', email: '', phone: '', address: '', tax_code: '' });
                fetchSuppliers();
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa?')) return;
        try {
            const res = await fetch(`/api/suppliers?id=${id}`, { method: 'DELETE' });
            if (res.ok) fetchSuppliers();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Danh sách Nhà cung cấp</h3>
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700"
                >
                    <Plus size={16} /> Thêm Nhà cung cấp
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Tên Cty / Nhà cung cấp</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Liên hệ</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Mã Số Thuế</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={4} className="text-center py-4 text-slate-500">Đang tải...</td></tr>
                        ) : suppliers.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-4 text-slate-500">Chưa có dữ liệu.</td></tr>
                        ) : (
                            suppliers.map(sup => (
                                <tr key={sup.id} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-3 font-bold text-slate-900">{sup.name}</td>
                                    <td className="px-4 py-3 text-slate-600 text-sm">
                                        <p>{sup.phone}</p>
                                        <p className="text-xs text-slate-400">{sup.email}</p>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 font-mono text-sm">{sup.tax_code}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg mr-2"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(sup.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Thêm Nhà cung cấp</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold mb-1">Tên công ty</label>
                                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold mb-1">Số điện thoại</label>
                                    <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1">Email</label>
                                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1">Mã Số Thuế</label>
                                <input value={formData.tax_code} onChange={e => setFormData({...formData, tax_code: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1">Địa chỉ</label>
                                <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
                            </div>
                            <div className="flex gap-3 justify-end pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm font-bold">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
