'use client';
/**
 * ============================================================
 * TRANG ADMIN: QUẢN LÝ KÍCH THƯỚC SẢN PHẨM DOANH NGHIỆP — /admin/sizes
 *
 * Giao diện Enterprise Workspace (Spacious 2-Column Editor):
 * - Hỗ trợ thông số đo chi tiết (Áo/Quần) & Bảng quy đổi Size
 * ============================================================
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Save, Ruler, Eye, Check } from 'lucide-react';
import { SkeletonTable } from '../components/SkeletonLoaders';
import { EmptyState } from '../components/EmptyState';

interface Size {
    id: string;
    name: string;
    category?: string;
    description?: string;
    order?: number;
}

export default function AdminSizesPage() {
    const [sizes, setSizes] = useState<Size[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Size | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState<Size>({
        id: '',
        name: '',
        category: 'ao-nam',
        description: '',
        order: 0
    });

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
        setErrorMsg('');
        if (item) {
            setEditingItem(item);
            setFormData({ ...item, category: item.category || 'ao-nam', description: item.description || '', order: item.order || 0 });
        } else {
            setEditingItem(null);
            setFormData({ id: `size-${Date.now().toString().slice(-4)}`, name: '', category: 'ao-nam', description: '', order: sizes.length });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg('');
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
            } else {
                setErrorMsg(data.message || 'Có lỗi xảy ra');
            }
        } catch {
            setErrorMsg('Có lỗi xảy ra khi kết nối máy chủ');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa kích thước này?')) return;
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
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Ruler size={24} className="text-indigo-600" /> Quản lý Kích Thước (Sizes)
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        {sizes.length} kích thước &bull; Cấu hình bảng size chuẩn cho Áo, Quần và Phụ kiện
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                >
                    <Plus size={16} /> Thêm Kích Thước Mới
                </button>
            </div>

            {/* List Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                {loading ? (
                    <SkeletonTable rows={6} cols={3} />
                ) : sizes.length === 0 ? (
                    <EmptyState
                        icon={<Ruler size={40} />}
                        title="Chưa có kích thước"
                        description="Thêm kích thước đầu tiên để bắt đầu."
                        actionLabel="Thêm kích thước"
                        onAction={() => openModal()}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-black tracking-wider">
                                    <th className="p-4">Biểu tượng Size</th>
                                    <th className="p-4">ID</th>
                                    <th className="p-4">Tên Kích Thước</th>
                                    <th className="p-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                {sizes.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shadow-xs">
                                                {item.name}
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono font-bold text-slate-400">{item.id}</td>
                                        <td className="p-4 font-black text-slate-900 dark:text-white text-sm">{item.name}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button onClick={() => openModal(item)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ─── ENTERPRISE SIZE WORKSPACE MODAL (MAX-W-4XL 2-COLUMN) ─── */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0, y: 16 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.96, opacity: 0, y: 16 }}
                            className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            {/* Top Header */}
                            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 shrink-0">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                        {editingItem ? `Chỉnh sửa Kích Thước: ${editingItem.name}` : 'Thêm Kích Thước Mới'}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Cấu hình mã size, nhóm danh mục áp dụng và mô tả hướng dẫn chọn size</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Form Grid 2 Columns */}
                            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Left Column: Inputs (7 Cols) */}
                                <div className="lg:col-span-7 space-y-4">
                                    {errorMsg && (
                                        <div className="p-3.5 rounded-xl text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700">
                                            ⚠️ {errorMsg}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">ID Kích Thước *</label>
                                        <input
                                            required
                                            disabled={!!editingItem}
                                            value={formData.id}
                                            onChange={e => setFormData({ ...formData, id: e.target.value })}
                                            className="adm-input w-full font-mono font-bold"
                                            placeholder="VD: size-xl"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Tên Kích Thước (Mã Size) *</label>
                                        <input
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="adm-input w-full font-black text-lg"
                                            placeholder="VD: S, M, L, XL, 2XL, 29, 30..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Mô tả hướng dẫn chọn size (Cân nặng / Chiều cao đề xuất)</label>
                                        <input
                                            value={formData.description || ''}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="adm-input w-full font-medium"
                                            placeholder="VD: Dành cho chiều cao 1m70 - 1m80, cân nặng 65kg - 75kg"
                                        />
                                    </div>
                                </div>

                                {/* Right Column: Preview Badge (5 Cols) */}
                                <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                        <Eye size={14} /> Xem trước Nút chọn Size
                                    </h4>

                                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 text-center shadow-md">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white font-black text-xl flex items-center justify-center mx-auto shadow-md">
                                            {formData.name || 'XL'}
                                        </div>
                                        <div>
                                            <h5 className="font-black text-base text-slate-900 dark:text-white">Size {formData.name || 'XL'}</h5>
                                            <p className="text-xs text-slate-500 mt-1">{formData.description || 'Chưa có thông số mô tả'}</p>
                                        </div>
                                    </div>
                                </div>
                            </form>

                            {/* Bottom Footer */}
                            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-end gap-3 shrink-0">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100 transition-colors">
                                    Hủy bỏ
                                </button>
                                <button type="button" onClick={handleSubmit} disabled={saving} className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-md hover:bg-slate-800 transition-all flex items-center gap-2">
                                    <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu Kích Thước'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
