'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, Edit2, Trash2, X, Save } from 'lucide-react';

interface Size {
    id: string;
    name: string;
}

export default function AdminSizesPage() {
    const [sizes, setSizes] = useState<Size[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Size | null>(null);

    const [formData, setFormData] = useState({ id: '', name: '' });

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/extra/sizes');
            const data = await res.json();
            if (data.success) setSizes(data.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchItems(); }, []);

    const openModal = (item?: Size) => {
        if (item) {
            setEditingItem(item);
            setFormData({ ...item });
        } else {
            setEditingItem(null);
            setFormData({ id: '', name: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingItem ? `/api/admin/extra/sizes?id=${editingItem.id}` : '/api/admin/extra/sizes';
            const method = editingItem ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            
            if (data.success) {
                fetchItems();
                setIsModalOpen(false);
            } else alert(data.message || 'Có lỗi xảy ra');
        } catch (err) {
            console.error(err);
            alert('Có lỗi xảy ra khi lưu');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa?')) return;
        try {
            const res = await fetch(`/api/admin/extra/sizes?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) setSizes(sizes.filter(c => c.id !== id));
            else alert(data.message || 'Lỗi xóa dữ liệu');
        } catch (err) {
            console.error(err);
            alert('Có lỗi xảy ra khi xóa');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Quản lý Kích thước</h1>
                <button onClick={() => openModal()} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                    <Plus size={18} /> Thêm kích thước
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Kích thước</th>
                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={3} className="px-6 py-12 text-center"><Loader2 className="animate-spin text-gray-400 mx-auto mb-2" size={24} /></td></tr>
                        ) : sizes.length === 0 ? (
                            <tr><td colSpan={3} className="px-6 py-12 text-center"><p className="text-gray-500 text-sm">Chưa có dữ liệu.</p></td></tr>
                        ) : (
                            sizes.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{item.id}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.name}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openModal(item)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={18} /></button>
                                            <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900">{editingItem ? 'Chỉnh sửa' : 'Thêm mới'}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">ID</label>
                                    <input required disabled={!!editingItem} value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 disabled:bg-gray-100" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tên kích thước</label>
                                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20" />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">Hủy</button>
                                    <button type="submit" className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-black hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"><Save size={18} /> Lưu</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
