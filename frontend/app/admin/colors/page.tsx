'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Save, Palette } from 'lucide-react';
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
            setFormData({ id: '', name: '', code: '#000000' });
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
                console.error('API error:', data.message);
            }
        } catch (error) {
            console.error('Có lỗi xảy ra khi lưu:', error);
            setErrorMsg('Không thể kết nối đến máy chủ');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa?')) return;
        try {
            const res = await fetch(`/api/admin/extra/colors?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) setColors(colors.filter(c => c.id !== id));
            else console.error('Lỗi xóa dữ liệu:', data.message);
        } catch (error) {
            console.error('Có lỗi xảy ra khi xóa:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--adm-text)' }}>
                        Quản lý Màu sắc
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                        {colors.length} màu sắc
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="adm-btn-primary flex items-center gap-2 self-start sm:self-auto"
                    style={{ minHeight: 44 }}
                >
                    <Plus size={18} /> Thêm màu
                </button>
            </div>

            {/* Table card */}
            <div className="adm-card overflow-hidden">
                {loading ? (
                    <SkeletonTable rows={6} cols={4} />
                ) : colors.length === 0 ? (
                    <EmptyState
                        icon={<Palette size={40} />}
                        title="Chưa có màu sắc"
                        description="Thêm màu sắc đầu tiên để bắt đầu."
                        actionLabel="Thêm màu"
                        onAction={() => openModal()}
                    />
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden md:block adm-table-scroll">
                            <table className="adm-table">
                                <thead>
                                    <tr>
                                        <th>Màu</th>
                                        <th>ID</th>
                                        <th>Tên màu</th>
                                        <th>Mã HEX</th>
                                        <th className="text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {colors.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <div
                                                    className="w-9 h-9 rounded-full shadow-inner border"
                                                    style={{ backgroundColor: item.code, borderColor: 'var(--adm-border)' }}
                                                />
                                            </td>
                                            <td className="font-mono text-sm" style={{ color: 'var(--adm-text-muted)' }}>
                                                {item.id}
                                            </td>
                                            <td className="font-semibold" style={{ color: 'var(--adm-text)' }}>
                                                {item.name}
                                            </td>
                                            <td>
                                                <span className="font-mono text-xs px-2 py-1 rounded-md" style={{ background: 'var(--adm-surface-2)', color: 'var(--adm-text-muted)' }}>
                                                    {item.code}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => openModal(item)}
                                                        className="p-2 rounded-lg transition-colors"
                                                        style={{ color: 'var(--adm-primary)' }}
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2 rounded-lg transition-colors"
                                                        style={{ color: 'var(--adm-danger)' }}
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile card list */}
                        <div className="md:hidden divide-y" style={{ borderColor: 'var(--adm-border)' }}>
                            {colors.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 p-4">
                                    {/* Color swatch */}
                                    <div
                                        className="w-11 h-11 rounded-full shadow-inner border shrink-0"
                                        style={{ backgroundColor: item.code, borderColor: 'var(--adm-border)' }}
                                    />
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--adm-text)' }}>
                                            {item.name}
                                        </p>
                                        <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                                            {item.code} · {item.id}
                                        </p>
                                    </div>
                                    {/* Actions */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => openModal(item)}
                                            className="p-2 rounded-lg"
                                            style={{ color: 'var(--adm-primary)', background: 'var(--adm-primary-light)', minHeight: 44, minWidth: 44 }}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 rounded-lg"
                                            style={{ color: 'var(--adm-danger)', background: 'var(--adm-danger-light)', minHeight: 44, minWidth: 44 }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
                            style={{ background: 'var(--adm-surface)', maxHeight: '90dvh', display: 'flex', flexDirection: 'column' }}
                        >
                            {/* Modal header */}
                            <div className="flex items-center justify-between p-5 border-b shrink-0" style={{ borderColor: 'var(--adm-border)' }}>
                                <h3 className="text-lg font-bold" style={{ color: 'var(--adm-text)' }}>
                                    {editingItem ? 'Chỉnh sửa màu sắc' : 'Thêm màu sắc mới'}
                                </h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 rounded-xl transition-colors"
                                    style={{ background: 'var(--adm-surface-2)', color: 'var(--adm-text-muted)', minHeight: 44, minWidth: 44 }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal body */}
                            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
                                {errorMsg && (
                                    <div className="p-3 rounded-xl text-sm font-medium" style={{ background: 'var(--adm-danger-light)', color: 'var(--adm-danger)' }}>
                                        {errorMsg}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--adm-text-muted)' }}>ID</label>
                                    <input
                                        required
                                        disabled={!!editingItem}
                                        value={formData.id}
                                        onChange={e => setFormData({ ...formData, id: e.target.value })}
                                        className="adm-input w-full disabled:opacity-60"
                                        style={{ minHeight: 44 }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--adm-text-muted)' }}>Tên màu</label>
                                    <input
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="adm-input w-full"
                                        style={{ minHeight: 44 }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--adm-text-muted)' }}>Mã HEX</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            required
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                                            className="rounded-xl border cursor-pointer shrink-0"
                                            style={{ width: 56, height: 44, borderColor: 'var(--adm-border)' }}
                                        />
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                                            className="adm-input w-full font-mono"
                                            style={{ minHeight: 44 }}
                                            placeholder="#000000"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2 pb-safe">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="adm-btn-secondary flex-1"
                                        style={{ minHeight: 44 }}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="adm-btn-primary flex-1 flex items-center justify-center gap-2"
                                        style={{ minHeight: 44 }}
                                    >
                                        <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
