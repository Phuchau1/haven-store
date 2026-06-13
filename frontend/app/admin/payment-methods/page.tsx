'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Save, CreditCard } from 'lucide-react';
import { SkeletonList } from '../components/SkeletonLoaders';
import { EmptyState } from '../components/EmptyState';

interface PaymentMethod {
    id: string;
    name_methond: string;
    description: string;
    bank_info?: string;
    qr_code_url?: string;
    is_active: boolean;
}

function FormModal({
    open,
    onClose,
    editingItem,
    formData,
    setFormData,
    onSubmit,
}: {
    open: boolean;
    onClose: () => void;
    editingItem: PaymentMethod | null;
    formData: { id: string; name_methond: string; description: string; bank_info?: string; qr_code_url?: string; is_active: boolean };
    setFormData: (d: any) => void;
    onSubmit: (e: React.FormEvent) => void;
}) {
    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 backdrop-blur-sm"
                        style={{ backgroundColor: 'var(--adm-overlay)' }}
                    />
                    <motion.div
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'tween', duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                        style={{ backgroundColor: 'var(--adm-surface)' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--adm-border)' }}>
                            <h3 className="text-base font-bold" style={{ color: 'var(--adm-text)' }}>
                                {editingItem ? 'Chỉnh sửa phương thức' : 'Thêm phương thức mới'}
                            </h3>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
                                style={{ color: 'var(--adm-text-muted)', backgroundColor: 'var(--adm-surface-2)' }}
                                aria-label="Đóng"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={onSubmit} className="p-5 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--adm-text-muted)' }}>
                                    ID (không thay đổi được)
                                </label>
                                <input
                                    required
                                    disabled={!!editingItem}
                                    value={formData.id}
                                    onChange={e => setFormData({ ...formData, id: e.target.value })}
                                    placeholder="vd: cod, bank_transfer..."
                                    className="adm-input disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--adm-text-muted)' }}>
                                    Tên phương thức
                                </label>
                                <input
                                    required
                                    value={formData.name_methond}
                                    onChange={e => setFormData({ ...formData, name_methond: e.target.value })}
                                    placeholder="Nhập tên phương thức..."
                                    className="adm-input"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--adm-text-muted)' }}>
                                    Mô tả
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Mô tả ngắn gọn..."
                                    className="adm-input resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--adm-text-muted)' }}>
                                    Thông tin ngân hàng (Tùy chọn)
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.bank_info || ''}
                                    onChange={e => setFormData({ ...formData, bank_info: e.target.value })}
                                    placeholder="Số tài khoản, tên ngân hàng, chủ tài khoản..."
                                    className="adm-input resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--adm-text-muted)' }}>
                                    Mã QR Thanh Toán (Tùy chọn)
                                </label>
                                <div className="flex items-center gap-4">
                                    {formData.qr_code_url && (
                                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                                            <img src={formData.qr_code_url} alt="QR Code" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, qr_code_url: '' })}
                                                className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm hover:bg-gray-100"
                                            >
                                                <X size={12} className="text-red-500" />
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const fd = new FormData();
                                                fd.append('image', file);
                                                try {
                                                    const res = await fetch('/api/upload', { method: 'POST', body: fd });
                                                    const data = await res.json();
                                                    if (data.success) setFormData({ ...formData, qr_code_url: data.url });
                                                } catch (error) {
                                                    console.error('Lỗi upload ảnh:', error);
                                                }
                                            }}
                                            className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                    </div>
                                </div>
                            </div>
                            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-colors hover:opacity-80" style={{ backgroundColor: 'var(--adm-surface-2)' }}>
                                <div
                                    className={`relative w-10 h-6 rounded-full transition-colors ${formData.is_active ? '' : ''}`}
                                    style={{ backgroundColor: formData.is_active ? 'var(--adm-success)' : 'var(--adm-border)' }}
                                >
                                    <div
                                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
                                        style={{ left: formData.is_active ? '22px' : '4px' }}
                                    />
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="sr-only"
                                    />
                                </div>
                                <span className="text-sm font-medium" style={{ color: 'var(--adm-text)' }}>
                                    {formData.is_active ? 'Đang hoạt động' : 'Tạm ẩn'}
                                </span>
                            </label>

                            {/* Footer */}
                            <div className="flex gap-3 pt-2 pb-2">
                                <button type="button" onClick={onClose} className="adm-btn-secondary flex-1 justify-center">
                                    Hủy
                                </button>
                                <button type="submit" className="adm-btn-primary flex-1 justify-center">
                                    <Save size={15} /> Lưu
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

export default function AdminPaymentMethodsPage() {
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PaymentMethod | null>(null);
    const [formData, setFormData] = useState<{ id: string; name_methond: string; description: string; bank_info?: string; qr_code_url?: string; is_active: boolean }>({ id: '', name_methond: '', description: '', bank_info: '', qr_code_url: '', is_active: true });

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/extra/payment-methods');
            const data = await res.json();
            if (data.success) setMethods(data.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchItems(); }, []);

    const openModal = (item?: PaymentMethod) => {
        if (item) {
            setEditingItem(item);
            setFormData({ ...item, bank_info: item.bank_info || '', qr_code_url: item.qr_code_url || '' });
        } else {
            setEditingItem(null);
            setFormData({ id: '', name_methond: '', description: '', bank_info: '', qr_code_url: '', is_active: true });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingItem ? `/api/admin/extra/payment-methods?id=${editingItem.id}` : '/api/admin/extra/payment-methods';
            const method = editingItem ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
            const data = await res.json();
            if (data.success) { fetchItems(); setIsModalOpen(false); }
        } catch (error) {
            console.error('Error saving:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa?')) return;
        try {
            const res = await fetch(`/api/admin/extra/payment-methods?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) setMethods(methods.filter(c => c.id !== id));
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--adm-text)' }}>
                        Phương thức thanh toán
                    </h2>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                        Quản lý các hình thức thanh toán cho cửa hàng
                    </p>
                </div>
                <button onClick={() => openModal()} className="adm-btn-primary self-start sm:self-auto">
                    <Plus size={16} /> Thêm phương thức
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <SkeletonList rows={4} />
            ) : methods.length === 0 ? (
                <div className="adm-card">
                    <EmptyState
                        icon={CreditCard}
                        title="Chưa có phương thức thanh toán"
                        description="Thêm phương thức thanh toán để khách hàng có thể thanh toán đơn hàng"
                        actionLabel="Thêm phương thức"
                        onAction={() => openModal()}
                    />
                </div>
            ) : (
                <>
                    {/* Desktop table */}
                    <div className="hidden md:block adm-table-wrapper">
                        <div className="adm-table-scroll">
                            <table className="adm-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Tên phương thức</th>
                                        <th>Mô tả</th>
                                        <th>Trạng thái</th>
                                        <th className="text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {methods.map(item => (
                                        <tr key={item.id}>
                                            <td>
                                                <span className="font-mono text-xs" style={{ color: 'var(--adm-text-muted)' }}>{item.id}</span>
                                            </td>
                                            <td>
                                                <span className="font-bold text-sm" style={{ color: 'var(--adm-text)' }}>{item.name_methond}</span>
                                            </td>
                                            <td>
                                                <span className="text-sm max-w-xs truncate block" style={{ color: 'var(--adm-text-muted)' }}>{item.description}</span>
                                            </td>
                                            <td>
                                                <span className={item.is_active ? 'adm-badge adm-badge-success' : 'adm-badge adm-badge-neutral'}>
                                                    {item.is_active ? 'Hoạt động' : 'Tạm ẩn'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => openModal(item)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                                                        style={{ color: 'var(--adm-primary)' }}
                                                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--adm-primary-light)')}
                                                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                                        aria-label="Chỉnh sửa"
                                                    >
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                                                        style={{ color: 'var(--adm-danger)' }}
                                                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--adm-danger-light)')}
                                                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                                        aria-label="Xóa"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden space-y-3">
                        {methods.map(item => (
                            <div key={item.id} className="adm-card p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <p className="text-sm font-bold" style={{ color: 'var(--adm-text)' }}>
                                                {item.name_methond}
                                            </p>
                                            <span className={item.is_active ? 'adm-badge adm-badge-success' : 'adm-badge adm-badge-neutral'}>
                                                {item.is_active ? 'Hoạt động' : 'Tạm ẩn'}
                                            </span>
                                        </div>
                                        <p className="text-xs font-mono mb-1" style={{ color: 'var(--adm-text-subtle)' }}>{item.id}</p>
                                        <p className="text-xs line-clamp-2" style={{ color: 'var(--adm-text-muted)' }}>{item.description}</p>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button
                                            onClick={() => openModal(item)}
                                            className="w-9 h-9 flex items-center justify-center rounded-xl"
                                            style={{ color: 'var(--adm-primary)', backgroundColor: 'var(--adm-primary-light)' }}
                                            aria-label="Chỉnh sửa"
                                        >
                                            <Edit2 size={15} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="w-9 h-9 flex items-center justify-center rounded-xl"
                                            style={{ color: 'var(--adm-danger)', backgroundColor: 'var(--adm-danger-light)' }}
                                            aria-label="Xóa"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Modal */}
            <FormModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editingItem={editingItem}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
            />
        </div>
    );
}
