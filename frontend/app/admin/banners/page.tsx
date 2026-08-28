'use client';
/**
 * ============================================================
 * TRANG ADMIN: QUẢN LÝ BANNERS DOANH NGHIỆP — /admin/banners
 *
 * Giao diện Enterprise Workspace (Large 2-Column Editor):
 * - Hỗ trợ xem trước Banner Banner Desktop & Mobile trực tiếp
 * - Cấu hình URL đích, phân loại Hero / Middle banner bài bản
 * ============================================================
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Save, Image as ImageIcon, Loader2, Eye, Link as LinkIcon, Video, Tag } from 'lucide-react';

interface Banner {
    id: string;
    title: string;
    image: string;
    video?: string;
    link: string;
    type: 'hero' | 'middle';
    status: string;
    order?: number;
}

export default function AdminBannersPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Banner | null>(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState<Banner>({
        id: '',
        title: '',
        image: '',
        video: '',
        link: '',
        type: 'hero',
        status: 'active',
        order: 0
    });

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/extra/banners');
            const data = await res.json();
            if (data.success) setBanners(data.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchItems(); }, []);

    const openModal = (item?: Banner) => {
        if (item) {
            setEditingItem(item);
            setFormData({ ...item, video: item.video || '', order: item.order || 0 });
        } else {
            setEditingItem(null);
            setFormData({
                id: `banner-${Date.now().toString().slice(-6)}`,
                title: '',
                image: '',
                video: '',
                link: '/products',
                type: 'hero',
                status: 'active',
                order: banners.length
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingItem ? `/api/admin/extra/banners?id=${editingItem.id}` : '/api/admin/extra/banners';
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
                alert(data.message || 'Có lỗi xảy ra khi lưu banner');
            }
        } catch (error) {
            console.error('Lỗi API:', error);
            alert('Có lỗi xảy ra khi kết nối máy chủ');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa banner này?')) return;
        try {
            const res = await fetch(`/api/admin/extra/banners?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setBanners(banners.filter(c => c.id !== id));
            } else {
                alert(data.message || 'Lỗi xóa dữ liệu');
            }
        } catch (error) {
            console.error('Lỗi API:', error);
            alert('Có lỗi xảy ra khi xóa');
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <ImageIcon size={24} className="text-indigo-600" /> Quản lý Banners Quảng Cáo
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        {banners.length} banner &bull; Quản lý Banner Slider chính và Banner danh mục giữa trang
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                >
                    <Plus size={16} /> Thêm Banner Mới
                </button>
            </div>

            {/* List Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-black tracking-wider">
                                <th className="p-4">Hình ảnh Xem Trước</th>
                                <th className="p-4">ID</th>
                                <th className="p-4">Tiêu đề Banner</th>
                                <th className="p-4">Phân loại</th>
                                <th className="p-4">Trạng thái</th>
                                <th className="p-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-400">
                                        <Loader2 className="animate-spin text-slate-400 mx-auto mb-2" size={24} />
                                        Đang tải danh sách banner...
                                    </td>
                                </tr>
                            ) : banners.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-500">
                                        <p className="font-bold text-slate-700 dark:text-slate-300">Chưa có banner nào.</p>
                                    </td>
                                </tr>
                            ) : (
                                banners.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4">
                                            <div className="w-28 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                                {item.image ? (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="w-full h-full p-3 text-slate-300" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono font-bold text-slate-400">{item.id}</td>
                                        <td className="p-4">
                                            <p className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{item.title}</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">{item.link}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${item.type === 'middle' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-indigo-100 text-indigo-700 border border-indigo-200'}`}>
                                                {item.type === 'middle' ? 'Banner Giữa (Danh Mục)' : 'Banner Chính (Hero Slider)'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${item.status === 'active' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                                {item.status === 'active' ? 'Hoạt động' : 'Tạm ẩn'}
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
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── ENTERPRISE BANNER WORKSPACE MODAL (MAX-W-5XL 2-COLUMN) ─── */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0, y: 16 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.96, opacity: 0, y: 16 }}
                            className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            {/* Top Header */}
                            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 shrink-0">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                        {editingItem ? `Chỉnh sửa Banner: ${editingItem.title}` : 'Thêm Banner Quảng Cáo Mới'}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Cấu hình liên kết đính kèm, đường dẫn hình ảnh/video và vị trí hiển thị</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Form Grid 2 Columns */}
                            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Left Column: Inputs (7 Cols) */}
                                <div className="lg:col-span-7 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">ID Banner *</label>
                                            <input
                                                required
                                                disabled={!!editingItem}
                                                value={formData.id}
                                                onChange={e => setFormData({ ...formData, id: e.target.value })}
                                                className="adm-input w-full font-mono font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Tiêu đề Banner *</label>
                                            <input
                                                required
                                                value={formData.title}
                                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                className="adm-input w-full font-bold"
                                                placeholder="VD: BỘ SƯU TẬP MỚI / NEW COLLECTION"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">URL Hình Ảnh Banner *</label>
                                        <input
                                            required
                                            value={formData.image}
                                            onChange={e => setFormData({ ...formData, image: e.target.value })}
                                            className="adm-input w-full text-xs font-mono"
                                            placeholder="https://media.routine.vn/.../banner.jpg"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">URL Video Banner (Nếu có)</label>
                                        <input
                                            value={formData.video || ''}
                                            onChange={e => setFormData({ ...formData, video: e.target.value })}
                                            className="adm-input w-full text-xs font-mono"
                                            placeholder="https://domain.com/banner-video.mp4"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                                            <LinkIcon size={12} /> Link chuyển hướng (URL Đích)
                                        </label>
                                        <input
                                            required
                                            value={formData.link}
                                            onChange={e => setFormData({ ...formData, link: e.target.value })}
                                            className="adm-input w-full font-medium"
                                            placeholder="/products hoặc /collections/nam"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Vị Trí Phân Loại</label>
                                            <select
                                                value={formData.type}
                                                onChange={e => setFormData({ ...formData, type: e.target.value as 'hero' | 'middle' })}
                                                className="adm-select w-full font-bold"
                                            >
                                                <option value="hero">Banner chính (Top Hero Slider)</option>
                                                <option value="middle">Banner giữa (Danh mục)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Trạng thái</label>
                                            <select
                                                value={formData.status}
                                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                                className="adm-select w-full font-bold"
                                            >
                                                <option value="active">Hoạt động</option>
                                                <option value="inactive">Tạm ẩn</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Live High-Res Banner Preview (5 Cols) */}
                                <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                        <Eye size={14} /> Xem trước hiển thị Banner
                                    </h4>

                                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-md space-y-2 p-3">
                                        <div className="aspect-[21/9] bg-slate-100 rounded-xl overflow-hidden relative">
                                            {formData.video ? (
                                                <video src={formData.video} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                                            ) : formData.image ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-1.5">
                                                    <ImageIcon size={32} />
                                                    <span className="text-xs">Chưa có ảnh banner</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="px-1">
                                            <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{formData.title || 'Tiêu đề Banner mẫu'}</p>
                                            <p className="text-[10px] text-slate-400 truncate">Link: {formData.link}</p>
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
                                    <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu Banner'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
