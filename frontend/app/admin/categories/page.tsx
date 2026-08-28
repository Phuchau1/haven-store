'use client';
/**
 * ============================================================
 * TRANG ADMIN: QUẢN LÝ DANH MỤC SẢN PHẨM DOANH NGHIỆP — /admin/categories
 *
 * Giao diện Enterprise Workspace (Large 2-Column Editor):
 * - Hỗ trợ xem trước Ảnh/Video trực tiếp 
 * - Quản lý Danh mục con (Subcategories) bài bản
 * ============================================================
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Edit2, Trash2, X, Save, ChevronRight,
    Loader2, Grid3X3,
    Image as ImageIcon, AlertTriangle, CheckCircle, FolderOpen,
    Eye, EyeOff, ArrowUp, ArrowDown, Video, Layers
} from 'lucide-react';

interface Subcategory {
    id: string;
    name: string;
    description?: string;
    image?: string;
    order: number;
    isActive: boolean;
}

interface Category {
    _id?: string;
    id: string;
    name: string;
    description?: string;
    image: string;
    video?: string;
    count?: number;
    order: number;
    isActive: boolean;
    subcategories: Subcategory[];
}

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
    return (
        <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl max-w-sm"
            style={{
                background: type === 'success' ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#ef4444,#dc2626)',
                color: '#fff'
            }}
        >
            {type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span className="text-sm font-semibold">{msg}</span>
            <button onClick={onClose} className="ml-2 hover:opacity-70"><X size={14} /></button>
        </motion.div>
    );
}

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    // Category modal state
    const [catModal, setCatModal] = useState(false);
    const [editingCat, setEditingCat] = useState<Category | null>(null);
    const [catForm, setCatForm] = useState({ id: '', name: '', description: '', image: '', video: '', order: 0, isActive: true });

    // Subcategory modal state
    const [subModal, setSubModal] = useState(false);
    const [editingSub, setEditingSub] = useState<Subcategory | null>(null);
    const [activeCatId, setActiveCatId] = useState('');
    const [subForm, setSubForm] = useState({ id: '', name: '', description: '', image: '', order: 0 });

    // Delete confirmation
    const [deleteModal, setDeleteModal] = useState<{ type: 'cat' | 'sub'; catId: string; subId?: string; name: string } | null>(null);

    const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
    }, []);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            if (data.success) {
                const sorted = [...(data.categories || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                setCategories(sorted);
            } else {
                showToast(data.message || 'Lỗi tải danh mục', 'error');
            }
        } catch {
            showToast('Không thể kết nối máy chủ', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    // Category CRUD
    const openCatModal = (cat?: Category) => {
        if (cat) {
            setEditingCat(cat);
            setCatForm({
                id: cat.id, name: cat.name, description: cat.description || '',
                image: cat.image || '', video: cat.video || '', order: cat.order ?? 0,
                isActive: cat.isActive ?? true
            });
        } else {
            setEditingCat(null);
            setCatForm({ id: '', name: '', description: '', image: '', video: '', order: categories.length, isActive: true });
        }
        setCatModal(true);
    };

    const handleSaveCat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!catForm.id.trim() || !catForm.name.trim()) {
            showToast('Vui lòng điền ID và Tên danh mục', 'error');
            return;
        }
        setSaving(true);
        try {
            const url = editingCat ? `/api/categories?id=${editingCat.id}` : '/api/categories';
            const method = editingCat ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: catForm.id,
                    name: catForm.name,
                    description: catForm.description,
                    image: catForm.image,
                    video: catForm.video,
                    order: Number(catForm.order),
                    isActive: catForm.isActive
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast(editingCat ? 'Cập nhật danh mục thành công' : 'Tạo danh mục mới thành công');
                setCatModal(false);
                fetchCategories();
            } else {
                showToast(data.message || 'Lỗi lưu danh mục', 'error');
            }
        } catch {
            showToast('Không thể kết nối máy chủ', 'error');
        } finally {
            setSaving(false);
        }
    };

    const confirmDeleteCat = (cat: Category) => {
        setDeleteModal({ type: 'cat', catId: cat.id, name: cat.name });
    };

    // Subcategory CRUD
    const openSubModal = (catId: string, sub?: Subcategory) => {
        setActiveCatId(catId);
        if (sub) {
            setEditingSub(sub);
            setSubForm({ id: sub.id, name: sub.name, description: sub.description || '', image: sub.image || '', order: sub.order ?? 0 });
        } else {
            const targetCat = categories.find(c => c.id === catId);
            setEditingSub(null);
            setSubForm({ id: '', name: '', description: '', image: '', order: targetCat?.subcategories?.length || 0 });
        }
        setSubModal(true);
    };

    const handleSaveSub = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subForm.id.trim() || !subForm.name.trim()) {
            showToast('Vui lòng điền ID và Tên danh mục con', 'error');
            return;
        }
        setSaving(true);
        try {
            const url = editingSub
                ? `/api/categories/subcategories?catId=${activeCatId}&subId=${editingSub.id}`
                : `/api/categories/subcategories?catId=${activeCatId}`;
            const method = editingSub ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: subForm.id,
                    name: subForm.name,
                    description: subForm.description,
                    image: subForm.image,
                    order: Number(subForm.order)
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast(editingSub ? 'Cập nhật danh mục con thành công' : 'Thêm danh mục con thành công');
                setSubModal(false);
                fetchCategories();
            } else {
                showToast(data.message || 'Lỗi lưu danh mục con', 'error');
            }
        } catch {
            showToast('Không thể kết nối máy chủ', 'error');
        } finally {
            setSaving(false);
        }
    };

    const confirmDeleteSub = (catId: string, sub: Subcategory) => {
        setDeleteModal({ type: 'sub', catId, subId: sub.id, name: sub.name });
    };

    const executeDelete = async () => {
        if (!deleteModal) return;
        setSaving(true);
        try {
            let url = '';
            if (deleteModal.type === 'cat') {
                url = `/api/categories?id=${deleteModal.catId}`;
            } else {
                url = `/api/categories/subcategories?catId=${deleteModal.catId}&subId=${deleteModal.subId}`;
            }
            const res = await fetch(url, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                showToast('Đã xóa thành công');
                setDeleteModal(null);
                fetchCategories();
            } else {
                showToast(data.message || 'Lỗi xóa dữ liệu', 'error');
            }
        } catch {
            showToast('Không thể kết nối máy chủ', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                        <FolderOpen size={24} className="text-indigo-600" /> Quản lý Danh Mục Sản Phẩm
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        {categories.length} danh mục cấp cao · Quản lý ảnh đại diện, video banner và danh mục con
                    </p>
                </div>
                <button
                    onClick={() => openCatModal()}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                >
                    <Plus size={16} /> Thêm Danh Mục Mới
                </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                {loading ? (
                    <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2 font-medium">
                        <Loader2 className="animate-spin" size={20} /> Đang tải danh mục...
                    </div>
                ) : categories.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 space-y-3">
                        <Grid3X3 size={40} className="mx-auto text-slate-300" />
                        <p className="font-bold text-slate-700 dark:text-slate-300">Chưa có danh mục sản phẩm nào.</p>
                        <button onClick={() => openCatModal()} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs">
                            Thêm danh mục đầu tiên
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-black tracking-wider">
                                    <th className="p-4 w-12 text-center">STT</th>
                                    <th className="p-4">Danh mục</th>
                                    <th className="p-4">Media</th>
                                    <th className="p-4">Mô tả</th>
                                    <th className="p-4 text-center">Danh mục con</th>
                                    <th className="p-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                {categories.map((cat, idx) => {
                                    const isExpanded = expandedIds.has(cat.id);
                                    const subCount = cat.subcategories?.length || 0;
                                    return (
                                        <React.Fragment key={cat.id}>
                                            <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="p-4 text-center font-mono font-bold text-slate-400">{cat.order ?? idx}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                                            {cat.image ? (
                                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <ImageIcon className="w-5 h-5 text-slate-300 m-2.5" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{cat.name}</p>
                                                            <p className="text-[11px] font-mono text-slate-400 mt-0.5">ID: {cat.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-1.5">
                                                        {cat.image && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded text-[10px]">Ảnh</span>}
                                                        {cat.video && <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-bold rounded text-[10px]">Video</span>}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-slate-500 max-w-xs truncate">{cat.description || '—'}</td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => toggleExpand(cat.id)}
                                                        className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                                                    >
                                                        <Layers size={14} /> {subCount} con
                                                        <ChevronRight size={14} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                    </button>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button onClick={() => openSubModal(cat.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Thêm danh mục con">
                                                            <Plus size={16} />
                                                        </button>
                                                        <button onClick={() => openCatModal(cat)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Sửa danh mục">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button onClick={() => confirmDeleteCat(cat)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg" title="Xóa danh mục">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Expanded Subcategories Table */}
                                            {isExpanded && subCount > 0 && (
                                                <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                                                    <td colSpan={6} className="p-4 pl-12">
                                                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Danh mục con của &ldquo;{cat.name}&rdquo;</h4>
                                                                <button onClick={() => openSubModal(cat.id)} className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer">
                                                                    <Plus size={12} /> Thêm sub
                                                                </button>
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                                {cat.subcategories.map(sub => (
                                                                    <div key={sub.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                                                        <div>
                                                                            <p className="font-bold text-xs text-slate-900 dark:text-white">{sub.name}</p>
                                                                            <p className="text-[10px] font-mono text-slate-400">{sub.id}</p>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <button onClick={() => openSubModal(cat.id, sub)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"><Edit2 size={14} /></button>
                                                                            <button onClick={() => confirmDeleteSub(cat.id, sub)} className="p-1 text-rose-600 hover:bg-rose-50 rounded"><Trash2 size={14} /></button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ─── ENTERPRISE CATEGORY WORKSPACE MODAL (MAX-W-5XL 2-COLUMN) ─── */}
            <AnimatePresence>
                {catModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCatModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0, y: 16 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.96, opacity: 0, y: 16 }}
                            className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            {/* Top Bar */}
                            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 shrink-0">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                        {editingCat ? `Chỉnh sửa Danh Mục: ${editingCat.name}` : 'Thêm Danh Mục Mới'}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Cấu hình thông tin chi tiết, liên kết media hình ảnh/video và vị trí hiển thị</p>
                                </div>
                                <button onClick={() => setCatModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Form Grid 2 Columns */}
                            <form onSubmit={handleSaveCat} className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Left Column: Inputs (7 Cols) */}
                                <div className="lg:col-span-7 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">ID Danh Mục *</label>
                                            <input
                                                required
                                                disabled={!!editingCat}
                                                value={catForm.id}
                                                onChange={e => setCatForm({ ...catForm, id: e.target.value })}
                                                className="adm-input w-full font-mono font-bold"
                                                placeholder="VD: cat-clothing"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Tên Danh Mục *</label>
                                            <input
                                                required
                                                value={catForm.name}
                                                onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                                                className="adm-input w-full font-bold"
                                                placeholder="VD: Thời Trang Nam"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Mô tả ngắn</label>
                                        <textarea
                                            rows={3}
                                            value={catForm.description}
                                            onChange={e => setCatForm({ ...catForm, description: e.target.value })}
                                            className="adm-input w-full py-2.5 font-medium resize-none"
                                            placeholder="Mô tả chi tiết danh mục dành cho SEO và trang chủ..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">URL Hình Ảnh *</label>
                                        <input
                                            required
                                            value={catForm.image}
                                            onChange={e => setCatForm({ ...catForm, image: e.target.value })}
                                            className="adm-input w-full text-xs font-mono"
                                            placeholder="https://domain.com/image.jpg"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">URL Video (Tùy chọn banner chuyển động)</label>
                                        <input
                                            value={catForm.video}
                                            onChange={e => setCatForm({ ...catForm, video: e.target.value })}
                                            className="adm-input w-full text-xs font-mono"
                                            placeholder="https://domain.com/banner.mp4"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-1">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Thứ tự ưu tiên</label>
                                            <input
                                                type="number"
                                                value={catForm.order}
                                                onChange={e => setCatForm({ ...catForm, order: Number(e.target.value) })}
                                                className="adm-input w-full font-bold"
                                            />
                                        </div>
                                        <div className="flex items-center">
                                            <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 w-full">
                                                <input
                                                    type="checkbox"
                                                    checked={catForm.isActive}
                                                    onChange={e => setCatForm({ ...catForm, isActive: e.target.checked })}
                                                    className="w-4 h-4 rounded border-slate-300 text-slate-900"
                                                />
                                                <span className="text-xs font-bold text-slate-900 dark:text-white">Kích hoạt hiển thị</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Live Media Preview (5 Cols) */}
                                <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                        <Eye size={14} /> Xem trước hiển thị thực tế
                                    </h4>

                                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-md">
                                        <div className="aspect-video relative bg-slate-100 overflow-hidden">
                                            {catForm.video ? (
                                                <video src={catForm.video} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                                            ) : catForm.image ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img src={catForm.image} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                                    <ImageIcon size={36} />
                                                    <span className="text-xs font-medium">Chưa có đường dẫn ảnh/video</span>
                                                </div>
                                            )}
                                            {catForm.video && (
                                                <span className="absolute top-3 right-3 bg-purple-600 text-white font-black text-[10px] uppercase px-2.5 py-1 rounded-md shadow-md flex items-center gap-1">
                                                    <Video size={10} /> Video Active
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-4 space-y-1">
                                            <h5 className="font-black text-sm text-slate-900 dark:text-white leading-tight">{catForm.name || 'Tên danh mục mẫu'}</h5>
                                            <p className="text-xs text-slate-500 line-clamp-2">{catForm.description || 'Chưa có mô tả danh mục'}</p>
                                        </div>
                                    </div>
                                </div>
                            </form>

                            {/* Bottom Bar */}
                            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-end gap-3 shrink-0">
                                <button type="button" onClick={() => setCatModal(false)} className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100 transition-colors">
                                    Hủy bỏ
                                </button>
                                <button type="button" onClick={handleSaveCat} disabled={saving} className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-md hover:bg-slate-800 transition-all flex items-center gap-2">
                                    <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu Danh Mục'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Modal */}
            <AnimatePresence>
                {deleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteModal(null)} />
                        <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full space-y-4 text-center border border-slate-200 dark:border-slate-800">
                            <AlertTriangle size={36} className="mx-auto text-rose-600" />
                            <h4 className="font-bold text-base text-slate-900 dark:text-white">Xác nhận xóa {deleteModal.name}?</h4>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteModal(null)} className="flex-1 py-2.5 border rounded-xl font-bold text-xs">Hủy</button>
                                <button onClick={executeDelete} disabled={saving} className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-xs">Xóa</button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
