'use client';
/**
 * ============================================================
 * TRANG ADMIN: QUẢN LÝ BANNERS DOANH NGHIỆP — /admin/banners
 *
 * Hỗ trợ:
 * 1. Banner Chính (Hero Slider)
 * 2. Banner Giữa (Middle Catalog Banner)
 * 3. Banner Bộ Sưu Tập (Collection Banner / BST Xuân Hè)
 * ============================================================
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Edit2, Trash2, X, Save, Image as ImageIcon, 
    Loader2, Eye, Link as LinkIcon, Video, Tag, 
    Upload, Sparkles, Layers, CheckCircle2, ArrowRight
} from 'lucide-react';

interface Banner {
    id: string;
    title: string;
    subtitle?: string;
    image: string;
    video?: string;
    link: string;
    link_text?: string;
    type: 'hero' | 'middle' | 'collection';
    status: string;
    order?: number;
}

export default function AdminBannersPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Banner | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedTab, setSelectedTab] = useState<'all' | 'hero' | 'middle' | 'collection'>('all');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<Banner>({
        id: '',
        title: '',
        subtitle: '',
        image: '',
        video: '',
        link: '/products',
        link_text: 'Xem chi tiết',
        type: 'collection',
        status: 'active',
        order: 0
    });

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/extra/banners');
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                setBanners(data.data);
            }
        } catch (error) {
            console.error('Error fetching banners:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchItems(); }, []);

    const openModal = (item?: Banner) => {
        if (item) {
            setEditingItem(item);
            setFormData({ 
                ...item, 
                subtitle: item.subtitle || '',
                link_text: item.link_text || 'Xem chi tiết',
                video: item.video || '', 
                order: item.order || 0 
            });
        } else {
            setEditingItem(null);
            setFormData({
                id: `banner-${Date.now().toString().slice(-6)}`,
                title: selectedTab === 'collection' ? 'BST XUÂN HÈ 2026: EASY DAILY | BẮT NHỊP SỐNG - HÒA NHỊP SỐNG' : '',
                subtitle: selectedTab === 'collection' ? '✨ BST Xuân Hè cập bến mang theo tinh thần "Easy" thoải mái trải nghiệm cùng những trang phục "Daily" tiện dụng mỗi ngày. HAVEN tin rằng, khi trang phục đủ nhẹ tênh, tâm trí sẽ tự khắc rộng mở để bạn bắt trọn nhịp điệu cuộc sống. Sẵn sàng cho một diện mạo rạng rỡ và trải nghiệm đầy năng lượng cùng HAVEN ngay hôm nay!' : '',
                image: selectedTab === 'collection' ? '/bst-xuan-he-2026.png' : '',
                video: '',
                link: '/products',
                link_text: 'Xem chi tiết',
                type: selectedTab === 'all' ? 'collection' : selectedTab,
                status: 'active',
                order: banners.length
            });
        }
        setIsModalOpen(true);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const body = new FormData();
        body.append('image', file);
        setUploading(true);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body
            });
            const data = await res.json();
            if (data.success && data.url) {
                setFormData(prev => ({ ...prev, image: data.url }));
            } else {
                alert(data.message || 'Tải ảnh lên thất bại');
            }
        } catch (err) {
            console.error('Upload error:', err);
            alert('Lỗi kết nối khi tải ảnh lên');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
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
                await fetchItems();
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

    const filteredBanners = banners.filter(b => selectedTab === 'all' || b.type === selectedTab);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <ImageIcon size={24} className="text-indigo-600" /> Quản lý Banners & Bộ Sưu Tập
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        {banners.length} banner &bull; Quản lý Banner Slider chính, Banner danh mục và Banner Bộ Sưu Tập Trang Chủ
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                >
                    <Plus size={16} /> Thêm Banner Mới
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
                <button
                    onClick={() => setSelectedTab('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        selectedTab === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    Tất cả ({banners.length})
                </button>
                <button
                    onClick={() => setSelectedTab('collection')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        selectedTab === 'collection' ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    <Sparkles size={14} /> Banner Bộ Sưu Tập (Trang Chủ) ({banners.filter(b => b.type === 'collection').length})
                </button>
                <button
                    onClick={() => setSelectedTab('hero')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        selectedTab === 'hero' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    Banner Chính (Hero Slider) ({banners.filter(b => b.type === 'hero').length})
                </button>
                <button
                    onClick={() => setSelectedTab('middle')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        selectedTab === 'middle' ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    Banner Giữa Trang ({banners.filter(b => b.type === 'middle').length})
                </button>
            </div>

            {/* List Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-black tracking-wider">
                                <th className="p-4">Hình ảnh</th>
                                <th className="p-4">Tiêu đề & Nội dung</th>
                                <th className="p-4">Phân loại</th>
                                <th className="p-4">Liên kết (Link)</th>
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
                            ) : filteredBanners.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-500">
                                        <p className="font-bold text-slate-700 dark:text-slate-300">Chưa có banner nào trong mục này.</p>
                                        <button onClick={() => openModal()} className="mt-3 px-4 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl text-xs hover:bg-indigo-100 transition-colors cursor-pointer">
                                            + Tạo banner ngay
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                filteredBanners.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4">
                                            <div className="w-28 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-2xs">
                                                {item.image ? (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="w-full h-full p-3 text-slate-300" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 max-w-sm">
                                            <p className="font-bold text-sm text-slate-900 dark:text-white leading-snug">{item.title}</p>
                                            {item.subtitle && (
                                                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{item.subtitle}</p>
                                            )}
                                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{item.id}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                                item.type === 'collection' 
                                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                                    : item.type === 'middle' 
                                                        ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                                                        : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                            }`}>
                                                {item.type === 'collection' ? '✨ Banner BST (Trang chủ)' : item.type === 'middle' ? 'Banner Giữa' : 'Banner Slider Chính'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-xs text-slate-700 font-semibold truncate max-w-[180px]">{item.link}</p>
                                            {item.link_text && (
                                                <span className="text-[10px] text-slate-400">Nút: {item.link_text}</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${item.status === 'active' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                                {item.status === 'active' ? 'Hoạt động' : 'Tạm ẩn'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button onClick={() => openModal(item)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer">
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

            {/* ─── ENTERPRISE BANNER WORKSPACE MODAL ─── */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0, y: 16 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.96, opacity: 0, y: 16 }}
                            className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col"
                        >
                            {/* Top Header */}
                            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 shrink-0">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                        {editingItem ? `Chỉnh sửa Banner: ${editingItem.title}` : 'Thêm Banner Mới'}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Cấu hình hình ảnh, tiêu đề, mô tả và liên kết hiển thị trên trang web</p>
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
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Phân loại Banner *</label>
                                            <select
                                                value={formData.type}
                                                onChange={e => setFormData({ ...formData, type: e.target.value as 'hero' | 'middle' | 'collection' })}
                                                className="adm-select w-full font-bold"
                                            >
                                                <option value="collection">✨ Banner Bộ Sưu Tập (Trang chủ)</option>
                                                <option value="hero">Banner chính (Top Hero Slider)</option>
                                                <option value="middle">Banner giữa (Danh mục)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Trạng thái *</label>
                                            <select
                                                value={formData.status}
                                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                                className="adm-select w-full font-bold"
                                            >
                                                <option value="active">Hoạt động (Hiển thị)</option>
                                                <option value="inactive">Tạm ẩn</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Tiêu đề Banner *</label>
                                        <input
                                            required
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            className="adm-input w-full font-bold text-sm"
                                            placeholder="VD: BST XUÂN HÈ 2026: EASY DAILY | BẮT NHỊP SỐNG - HÒA NHỊP SỐNG"
                                        />
                                    </div>

                                    {/* Subtitle/Description (Especially for Collection Banner) */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                            Mô tả / Nội dung chi tiết {formData.type === 'collection' ? '(Hiển thị trên Trang chủ)' : '(Tùy chọn)'}
                                        </label>
                                        <textarea
                                            rows={4}
                                            value={formData.subtitle || ''}
                                            onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                                            className="adm-input w-full text-xs leading-relaxed"
                                            placeholder="✨ BST Xuân Hè cập bến mang theo tinh thần Easy thoải mái trải nghiệm..."
                                        />
                                    </div>

                                    {/* Image URL & Upload */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Hình Ảnh Banner *</label>
                                        <div className="flex gap-2">
                                            <input
                                                required
                                                value={formData.image}
                                                onChange={e => setFormData({ ...formData, image: e.target.value })}
                                                className="adm-input flex-1 text-xs font-mono"
                                                placeholder="/bst-xuan-he-2026.png hoặc https://..."
                                            />
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                            />
                                            <button
                                                type="button"
                                                disabled={uploading}
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                                            >
                                                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                                <span>{uploading ? 'Đang tải...' : 'Tải ảnh lên'}</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                                                <LinkIcon size={12} /> Link chuyển hướng (URL) *
                                            </label>
                                            <input
                                                required
                                                value={formData.link}
                                                onChange={e => setFormData({ ...formData, link: e.target.value })}
                                                className="adm-input w-full font-medium"
                                                placeholder="/products hoặc /collections/sale"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Chữ trên nút (Link Text)</label>
                                            <input
                                                value={formData.link_text || ''}
                                                onChange={e => setFormData({ ...formData, link_text: e.target.value })}
                                                className="adm-input w-full font-medium"
                                                placeholder="Xem chi tiết / Mua ngay"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Live High-Res Banner Preview (5 Cols) */}
                                <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                        <Eye size={14} /> Xem trước hiển thị thực tế
                                    </h4>

                                    {formData.type === 'collection' ? (
                                        /* Preview for Collection Banner */
                                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-md space-y-3">
                                            <div className="aspect-[16/9] bg-slate-100 rounded-xl overflow-hidden relative">
                                                {formData.image ? (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-1.5">
                                                        <ImageIcon size={32} />
                                                        <span className="text-xs">Chưa có ảnh</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-1.5">
                                                <h5 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2 uppercase">
                                                    {formData.title || 'BST XUÂN HÈ 2026: EASY DAILY'}
                                                </h5>
                                                <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed">
                                                    {formData.subtitle || '✨ BST Xuân Hè cập bến mang theo tinh thần Easy thoải mái...'}
                                                </p>
                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-900 underline pt-1">
                                                    {formData.link_text || 'Xem chi tiết'} <ArrowRight size={12} />
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Preview for Hero / Middle Banner */
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
                                                <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{formData.title || 'Tiêu đề Banner'}</p>
                                                <p className="text-[10px] text-slate-400 truncate">Link: {formData.link}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </form>

                            {/* Bottom Footer */}
                            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-end gap-3 shrink-0">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
                                    Hủy bỏ
                                </button>
                                <button type="button" onClick={handleSubmit} disabled={saving} className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-md hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer">
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
