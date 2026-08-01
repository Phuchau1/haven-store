'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';

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

    const inputStyle = { backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex justify-between items-center p-5 rounded-2xl border shadow-sm"
                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--adm-text)' }}>
                        <Users size={20} className="text-blue-500" />
                        Danh sách Nhà Cung Cấp
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>Quản lý thông tin đối tác cung cấp hàng hóa cho kho</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                    <Plus size={15} /> Thêm Nhà Cung Cấp
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
                                <th className="px-4 py-3">Tên Nhà Cung Cấp</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">SĐT</th>
                                <th className="px-4 py-3">Mã Thuế</th>
                                <th className="px-4 py-3">Địa Chỉ</th>
                                <th className="px-4 py-3 text-right">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: 'var(--adm-border)' }}>
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 6 }).map((__, j) => (
                                            <td key={j} className="px-4 py-3">
                                                <div className="h-3 rounded animate-pulse" style={{ backgroundColor: 'var(--adm-surface-2)' }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : suppliers.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-12" style={{ color: 'var(--adm-text-muted)' }}>Chưa có nhà cung cấp nào</td></tr>
                            ) : (
                                suppliers.map(s => (
                                    <tr key={s._id || s.id} className="transition-colors hover:bg-black/[0.02]">
                                        <td className="px-4 py-3 font-bold" style={{ color: 'var(--adm-text)' }}>{s.name}</td>
                                        <td className="px-4 py-3" style={{ color: 'var(--adm-text-muted)' }}>{s.email || '—'}</td>
                                        <td className="px-4 py-3 font-mono" style={{ color: 'var(--adm-text)' }}>{s.phone || '—'}</td>
                                        <td className="px-4 py-3 font-mono" style={{ color: 'var(--adm-text-muted)' }}>{s.tax_code || '—'}</td>
                                        <td className="px-4 py-3" style={{ color: 'var(--adm-text-muted)' }}>{s.address || '—'}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => handleDelete(s._id || s.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
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
                        <h3 className="text-base font-bold" style={{ color: 'var(--adm-text)' }}>Thêm Nhà Cung Cấp Mới</h3>
                        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                            <div className="space-y-1">
                                <label className="font-bold" style={{ color: 'var(--adm-text-muted)' }}>Tên Nhà Cung Cấp *</label>
                                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full border rounded-xl px-3 py-2 focus:outline-none" style={inputStyle} placeholder="Công ty TNHH Thời Trang ABC" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="font-bold" style={{ color: 'var(--adm-text-muted)' }}>SĐT</label>
                                    <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                                        className="w-full border rounded-xl px-3 py-2 focus:outline-none" style={inputStyle} placeholder="0901234567" />
                                </div>
                                <div className="space-y-1">
                                    <label className="font-bold" style={{ color: 'var(--adm-text-muted)' }}>Mã Thuế</label>
                                    <input value={formData.tax_code} onChange={e => setFormData({...formData, tax_code: e.target.value})}
                                        className="w-full border rounded-xl px-3 py-2 focus:outline-none" style={inputStyle} placeholder="0101234567" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="font-bold" style={{ color: 'var(--adm-text-muted)' }}>Email</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                                    className="w-full border rounded-xl px-3 py-2 focus:outline-none" style={inputStyle} placeholder="ncc@gmail.com" />
                            </div>
                            <div className="space-y-1">
                                <label className="font-bold" style={{ color: 'var(--adm-text-muted)' }}>Địa Chỉ</label>
                                <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                                    className="w-full border rounded-xl px-3 py-2 focus:outline-none" style={inputStyle} placeholder="Hà Nội / TP.HCM" />
                            </div>
                            <div className="flex gap-3 justify-end pt-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-xl font-bold"
                                    style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}>Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm">Lưu Nhà Cung Cấp</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
