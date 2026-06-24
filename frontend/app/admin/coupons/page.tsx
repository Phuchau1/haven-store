'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Save, Tag, Calendar, Percent, Hash } from 'lucide-react';
import { SkeletonTable } from '../components/SkeletonLoaders';
import { EmptyState } from '../components/EmptyState';

interface Coupon {
    id: string;
    code: string;
    discount_type: string;
    discount_value: number;
    start_date: string;
    end_date: string;
    usage_limit: number;
    usage_limit_per_user: number;
}

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Coupon | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        id: '', code: '', discount_type: 'percent', discount_value: 0, start_date: '', end_date: '', usage_limit: 100, usage_limit_per_user: 1
    });

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/extra/coupons');
            const data = await res.json();
            if (data.success) setCoupons(data.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchItems(); }, []);

    const openModal = (item?: Coupon) => {
        setErrorMsg('');
        if (item) {
            setEditingItem(item);
            setFormData({ ...item, usage_limit_per_user: item.usage_limit_per_user ?? 1 });
        } else {
            setEditingItem(null);
            setFormData({ id: '', code: '', discount_type: 'percent', discount_value: 0, start_date: '', end_date: '', usage_limit: 100, usage_limit_per_user: 1 });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg('');
        try {
            const url = editingItem ? `/api/admin/extra/coupons?id=${editingItem.id}` : '/api/admin/extra/coupons';
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
            const res = await fetch(`/api/admin/extra/coupons?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) setCoupons(coupons.filter(c => c.id !== id));
            else console.error('Lỗi xóa dữ liệu:', data.message);
        } catch (error) {
            console.error('Có lỗi xảy ra khi xóa:', error);
        }
    };

    const formatDate = (d: string) => {
        try { return new Date(d).toLocaleDateString('vi-VN'); } catch { return d; }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--adm-text)' }}>
                        Quản lý Mã giảm giá
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                        {coupons.length} mã giảm giá
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="adm-btn-primary flex items-center gap-2 self-start sm:self-auto"
                    style={{ minHeight: 44 }}
                >
                    <Plus size={18} /> Thêm mã
                </button>
            </div>

            {/* Table card */}
            <div className="adm-card overflow-hidden">
                {loading ? (
                    <SkeletonTable rows={5} cols={5} />
                ) : coupons.length === 0 ? (
                    <EmptyState
                        icon={<Tag size={40} />}
                        title="Chưa có mã giảm giá"
                        description="Thêm mã giảm giá đầu tiên để bắt đầu."
                        actionLabel="Thêm mã"
                        onAction={() => openModal()}
                    />
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden md:block adm-table-scroll">
                            <table className="adm-table">
                                <thead>
                                    <tr>
                                        <th>Mã (Code)</th>
                                        <th>Loại</th>
                                        <th>Giá trị</th>
                                        <th>Thời gian</th>
                                        <th>Giới hạn tổng</th>
                                        <th>Giới hạn/User</th>
                                        <th className="text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {coupons.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <span className="font-mono font-bold text-sm px-2 py-1 rounded-md" style={{ background: 'var(--adm-primary-light)', color: 'var(--adm-primary)' }}>
                                                    {item.code}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`adm-badge ${item.discount_type === 'percent' ? 'adm-badge-info' : 'adm-badge-warning'}`}>
                                                    {item.discount_type === 'percent' ? 'Phần trăm' : 'Tiền mặt'}
                                                </span>
                                            </td>
                                            <td className="font-bold" style={{ color: 'var(--adm-text)' }}>
                                                {item.discount_value}{item.discount_type === 'percent' ? '%' : ' VNĐ'}
                                            </td>
                                            <td style={{ color: 'var(--adm-text-muted)' }}>
                                                {formatDate(item.start_date)} → {formatDate(item.end_date)}
                                            </td>
                                            <td style={{ color: 'var(--adm-text-muted)' }}>{item.usage_limit} lần</td>
                                            <td style={{ color: 'var(--adm-text-muted)' }}>{item.usage_limit_per_user ?? 1} lần</td>
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
                            {coupons.map((item) => (
                                <div key={item.id} className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <span
                                            className="font-mono font-bold text-base px-2.5 py-1 rounded-md"
                                            style={{ background: 'var(--adm-primary-light)', color: 'var(--adm-primary)' }}
                                        >
                                            {item.code}
                                        </span>
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
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="flex items-center gap-1.5" style={{ color: 'var(--adm-text-muted)' }}>
                                            <Percent size={13} />
                                            <span>{item.discount_type === 'percent' ? 'Phần trăm' : 'Tiền mặt'}</span>
                                        </div>
                                        <div className="font-bold" style={{ color: 'var(--adm-text)' }}>
                                            {item.discount_value}{item.discount_type === 'percent' ? '%' : ' VNĐ'}
                                        </div>
                                        <div className="flex items-center gap-1.5 col-span-2" style={{ color: 'var(--adm-text-muted)' }}>
                                            <Calendar size={13} />
                                            <span>{formatDate(item.start_date)} → {formatDate(item.end_date)}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5" style={{ color: 'var(--adm-text-muted)' }}>
                                            <Hash size={13} />
                                            <span>Giới hạn: {item.usage_limit} lần</span>
                                        </div>
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
                            className="relative w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
                            style={{ background: 'var(--adm-surface)', maxHeight: '95dvh', display: 'flex', flexDirection: 'column' }}
                        >
                            {/* Modal header */}
                            <div className="flex items-center justify-between p-5 border-b shrink-0" style={{ borderColor: 'var(--adm-border)' }}>
                                <h3 className="text-lg font-bold" style={{ color: 'var(--adm-text)' }}>
                                    {editingItem ? 'Chỉnh sửa mã giảm giá' : 'Thêm mã giảm giá mới'}
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

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                        <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--adm-text-muted)' }}>Mã Code</label>
                                        <input
                                            required
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            className="adm-input w-full uppercase"
                                            style={{ minHeight: 44 }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--adm-text-muted)' }}>Loại giảm giá</label>
                                        <select
                                            value={formData.discount_type}
                                            onChange={e => setFormData({ ...formData, discount_type: e.target.value })}
                                            className="adm-select w-full"
                                            style={{ minHeight: 44 }}
                                        >
                                            <option value="percent">Phần trăm (%)</option>
                                            <option value="fixed">Tiền mặt (VNĐ)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--adm-text-muted)' }}>Giá trị giảm</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.discount_value}
                                            onChange={e => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                                            className="adm-input w-full"
                                            style={{ minHeight: 44 }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--adm-text-muted)' }}>Ngày bắt đầu</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.start_date.split('T')[0]}
                                            onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                            className="adm-input w-full"
                                            style={{ minHeight: 44 }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--adm-text-muted)' }}>Ngày kết thúc</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.end_date.split('T')[0]}
                                            onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                            className="adm-input w-full"
                                            style={{ minHeight: 44 }}
                                        />
                                    </div>
                                    <div className="sm:col-span-1">
                                        <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--adm-text-muted)' }}>Giới hạn sử dụng (Tổng)</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.usage_limit}
                                            onChange={e => setFormData({ ...formData, usage_limit: Number(e.target.value) })}
                                            className="adm-input w-full"
                                            style={{ minHeight: 44 }}
                                        />
                                    </div>
                                    <div className="sm:col-span-1">
                                        <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--adm-text-muted)' }}>Giới hạn mỗi User</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.usage_limit_per_user}
                                            onChange={e => setFormData({ ...formData, usage_limit_per_user: Number(e.target.value) })}
                                            className="adm-input w-full"
                                            style={{ minHeight: 44 }}
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
