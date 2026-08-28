'use client';
/**
 * ============================================================
 * TRANG ADMIN: QUẢN LÝ MÀU SẮC SẢN PHẨM DOANH NGHIỆP — /admin/colors
 *
 * Giao diện Enterprise Workspace (Spacious 2-Column Editor):
 * - Hỗ trợ Color Swatch Picker thực tế & kiểm tra độ tương phản
 * ============================================================
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Save, Palette, Eye, Check } from 'lucide-react';
import { SkeletonTable } from '../components/SkeletonLoaders';
import { EmptyState } from '../components/EmptyState';

interface Color {
    id: string;
    name: string;
    code: string;
}

export default function AdminColorsPage() {
    const [colors, setColors] = useState<Color[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Color | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({ id: '', name: '', code: '#000000' });

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/extra/colors');
            const data = await res.json();
            if (data.success) setColors(data.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchItems(); }, []);

    const openModal = (item?: Color) => {
        setErrorMsg('');
        if (item) {
            setEditingItem(item);
            setFormData({ ...item });
        } else {
            setEditingItem(null);
            setFormData({ id: `color-${Date.now().toString().slice(-4)}`, name: '', code: '#3b82f6' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg('');
        try {
            const url = editingItem ? `/api/admin/extra/colors?id=${editingItem.id}` : '/api/admin/extra/colors';
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
            setErrorMsg('Không thể kết nối đến máy chủ');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa màu sắc này?')) return;
        try {
            const res = await fetch(`/api/admin/extra/colors?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) setColors(colors.filter(c => c.id !== id));
            else alert(data.message);
        } catch (error) {
            console.error('Có lỗi xảy ra khi xóa:', error);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Palette size={24} className="text-indigo-600" /> Quản lý Bảng Màu Sắc
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        {colors.length} màu sắc &bull; Cấu hình mã HEX và Swatches swatch hiển thị trên sản phẩm
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                >
                    <Plus size={16} /> Thêm Màu Sắc Mới
                </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                {loading ? (
                    <SkeletonTable rows={6} cols={4} />
                ) : colors.length === 0 ? (
                    <EmptyState
                        icon={<Palette size={40} />}
                        title="Chưa có màu sắc"
                        description="Thêm màu sắc đầu tiên để bắt đầu gán vào các sản phẩm."
                        actionLabel="Thêm màu"
                        onAction={() => openModal()}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-black tracking-wider">
                                    <th className="p-4">Mẫu Màu (Swatch)</th>
                                    <th className="p-4">ID</th>
                                    <th className="p-4">Tên Màu</th>
                                    <th className="p-4">Mã HEX</th>
                                    <th className="p-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                {colors.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-8 h-8 rounded-full shadow-inner border border-slate-300 dark:border-slate-700 shrink-0"
                                                    style={{ backgroundColor: item.code }}
                                                />
                                                <div
                                                    className="w-10 h-6 rounded-md border border-slate-300 shrink-0 shadow-2xs"
                                                    style={{ backgroundColor: item.code }}
                                                />
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono font-bold text-slate-400">{item.id}</td>
                                        <td className="p-4 font-bold text-slate-900 dark:text-white text-sm">{item.name}</td>
                                        <td className="p-4">
                                            <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                {item.code}
                                            </span>
                                        </td>
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

            {/* ─── ENTERPRISE COLOR WORKSPACE MODAL (MAX-W-4XL 2-COLUMN) ─── */}
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
                                        {editingItem ? `Chỉnh sửa Màu Sắc: ${editingItem.name}` : 'Thêm Màu Sắc Mới'}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Cấu hình mã màu HEX, tên tiếng Việt và kiểm tra mẫu Swatches xem trước</p>
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
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">ID Màu Sắc *</label>
                                        <input
                                            required
                                            disabled={!!editingItem}
                                            value={formData.id}
                                            onChange={e => setFormData({ ...formData, id: e.target.value })}
                                            className="adm-input w-full font-mono font-bold"
                                            placeholder="VD: color-red"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Tên Màu Sắc (Tiếng Việt) *</label>
                                        <input
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="adm-input w-full font-bold"
                                            placeholder="VD: Đỏ Thạch Anh, Xanh Navy, Đen Tuyền..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Mã Màu HEX *</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                required
                                                value={formData.code}
                                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                                className="w-14 h-12 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer shrink-0 bg-white p-1"
                                            />
                                            <input
                                                type="text"
                                                required
                                                value={formData.code}
                                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                                className="adm-input w-full font-mono font-bold text-slate-900 dark:text-white"
                                                placeholder="#b91c1c"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Swatch & Fabric Preview (5 Cols) */}
                                <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                        <Eye size={14} /> Xem trước Mẫu Swatch Sản phẩm
                                    </h4>

                                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 text-center shadow-md">
                                        {/* Large Swatch Circle */}
                                        <div className="w-20 h-20 rounded-full mx-auto shadow-lg border-2 border-white dark:border-slate-800 ring-2 ring-slate-200 dark:ring-slate-700 transition-all flex items-center justify-center" style={{ backgroundColor: formData.code }}>
                                            <Check size={24} className="text-white drop-shadow-md" />
                                        </div>

                                        <div>
                                            <h5 className="font-black text-base text-slate-900 dark:text-white">{formData.name || 'Màu sắc mẫu'}</h5>
                                            <p className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{formData.code}</p>
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
                                    <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu Màu Sắc'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
