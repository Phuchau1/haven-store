'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Edit2, Trash2, X, Save, ChevronRight,
    Loader2, Grid3X3,
    Image as ImageIcon, AlertTriangle, CheckCircle, FolderOpen,
    Eye, EyeOff, ArrowUp, ArrowDown
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Toast ────────────────────────────────────────────────────────────────────
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

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }: {
    open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ scale: 0.92, opacity: 0, y: 16 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 16 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
                        style={{ background: 'var(--adm-surface, #fff)', border: '1px solid var(--adm-border, #e5e7eb)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-5 border-b sticky top-0 z-10 rounded-t-3xl"
                            style={{ background: 'var(--adm-surface, #fff)', borderColor: 'var(--adm-border, #e5e7eb)' }}>
                            <h3 className="text-base font-bold" style={{ color: 'var(--adm-text, #111)' }}>{title}</h3>
                            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-6">{children}</div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

// ─── Image Preview ────────────────────────────────────────────────────────────
function ImagePreview({ url, isVideo = false }: { url: string; isVideo?: boolean }) {
    if (!url) return (
        <div className="w-full h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2"
            style={{ borderColor: 'var(--adm-border, #e5e7eb)', color: 'var(--adm-text-muted, #6b7280)' }}>
            <ImageIcon size={28} />
            <span className="text-xs">Chưa có {isVideo ? 'video' : 'ảnh'}</span>
        </div>
    );
    if (isVideo) {
        return (
            <div className="w-full h-36 rounded-xl overflow-hidden border bg-black flex justify-center" style={{ borderColor: 'var(--adm-border, #e5e7eb)' }}>
                <video src={url} autoPlay muted loop playsInline className="h-full object-cover" />
            </div>
        );
    }
    return (
        <div className="w-full h-36 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--adm-border, #e5e7eb)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    // Category modal state
    const [catModal, setCatModal] = useState(false);
    const [editingCat, setEditingCat] = useState<Category | null>(null);
    const [catForm, setCatForm] = useState({ id: '', name: '', description: '', image: '', video: '', order: 0 });

    // Subcategory modal state
    const [subModal, setSubModal] = useState(false);
    const [editingSub, setEditingSub] = useState<Subcategory | null>(null);
    const [activeCatId, setActiveCatId] = useState('');
    const [subForm, setSubForm] = useState({ id: '', name: '', description: '', image: '', order: 0 });

    // Delete confirmation
    const [deleteModal, setDeleteModal] = useState<{ type: 'cat' | 'sub'; catId: string; subId?: string; name: string } | null>(null);

    // ── Helpers ──
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
            }
        } catch { showToast('Không thể tải danh mục', 'error'); }
        finally { setLoading(false); }
    }, [showToast]);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);

    // ── Toggle expand ──
    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // ── Open category modal ──
    const openCatModal = (cat?: Category) => {
        if (cat) {
            setEditingCat(cat);
            setCatForm({ id: cat.id, name: cat.name, description: cat.description || '', image: cat.image, video: cat.video || '', order: cat.order });
        } else {
            setEditingCat(null);
            setCatForm({ id: '', name: '', description: '', image: '', video: '', order: categories.length });
        }
        setCatModal(true);
    };

    // ── Open subcategory modal ──
    const openSubModal = (catId: string, sub?: Subcategory) => {
        setActiveCatId(catId);
        if (sub) {
            setEditingSub(sub);
            setSubForm({ id: sub.id, name: sub.name, description: sub.description || '', image: sub.image || '', order: sub.order });
        } else {
            setEditingSub(null);
            const cat = categories.find(c => c.id === catId);
            setSubForm({ id: '', name: '', description: '', image: '', order: cat?.subcategories?.length ?? 0 });
        }
        setSubModal(true);
    };

    // ── Submit category ──
    const handleCatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!catForm.id.trim() || !catForm.name.trim() || !catForm.image.trim()) {
            showToast('Vui lòng điền đầy đủ ID, Tên và URL Ảnh', 'error');
            return;
        }
        setSaving(true);
        try {
            const method = editingCat ? 'PUT' : 'POST';
            const res = await fetch('/api/admin/categories', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(catForm),
            });
            const data = await res.json();
            if (data.success) {
                showToast(editingCat ? 'Cập nhật danh mục thành công!' : 'Thêm danh mục thành công!');
                setCatModal(false);
                fetchCategories();
            } else {
                showToast(data.message || 'Có lỗi xảy ra', 'error');
            }
        } catch { showToast('Lỗi kết nối server', 'error'); }
        finally { setSaving(false); }
    };

    // ── Submit subcategory ──
    const handleSubSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subForm.id.trim() || !subForm.name.trim()) {
            showToast('Vui lòng điền đầy đủ ID và Tên danh mục con', 'error');
            return;
        }
        setSaving(true);
        try {
            let res;
            if (editingSub) {
                res = await fetch(`/api/admin/categories/${activeCatId}/subcategories/${editingSub.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(subForm),
                });
            } else {
                res = await fetch(`/api/admin/categories/${activeCatId}/subcategories`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(subForm),
                });
            }
            const data = await res.json();
            if (data.success) {
                showToast(editingSub ? 'Cập nhật danh mục con thành công!' : 'Thêm danh mục con thành công!');
                setSubModal(false);
                fetchCategories();
            } else {
                showToast(data.message || 'Có lỗi xảy ra', 'error');
            }
        } catch { showToast('Lỗi kết nối server', 'error'); }
        finally { setSaving(false); }
    };

    // ── Toggle active ──
    const toggleCatActive = async (cat: Category) => {
        try {
            const res = await fetch('/api/admin/categories', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: cat.id, isActive: !cat.isActive }),
            });
            const data = await res.json();
            if (data.success) {
                fetchCategories();
                showToast(!cat.isActive ? 'Đã kích hoạt danh mục' : 'Đã ẩn danh mục');
            }
        } catch { showToast('Lỗi cập nhật', 'error'); }
    };

    const toggleSubActive = async (catId: string, sub: Subcategory) => {
        try {
            const res = await fetch(`/api/admin/categories/${catId}/subcategories/${sub.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !sub.isActive }),
            });
            const data = await res.json();
            if (data.success) {
                fetchCategories();
                showToast(!sub.isActive ? 'Đã kích hoạt' : 'Đã ẩn danh mục con');
            }
        } catch { showToast('Lỗi cập nhật', 'error'); }
    };

    // ── Confirm delete ──
    const confirmDelete = async () => {
        if (!deleteModal) return;
        setSaving(true);
        try {
            let res;
            if (deleteModal.type === 'cat') {
                res = await fetch(`/api/admin/categories?id=${deleteModal.catId}`, { method: 'DELETE' });
            } else {
                res = await fetch(`/api/admin/categories/${deleteModal.catId}/subcategories/${deleteModal.subId}`, { method: 'DELETE' });
            }
            const data = await res.json();
            if (data.success) {
                showToast('Đã xóa thành công!');
                setDeleteModal(null);
                fetchCategories();
            } else {
                showToast(data.message || 'Lỗi xóa', 'error');
            }
        } catch { showToast('Lỗi kết nối server', 'error'); }
        finally { setSaving(false); }
    };

    // ── Move category order ──
    const moveCategory = async (index: number, dir: 'up' | 'down') => {
        const newCats = [...categories];
        const swapIdx = dir === 'up' ? index - 1 : index + 1;
        if (swapIdx < 0 || swapIdx >= newCats.length) return;
        [newCats[index], newCats[swapIdx]] = [newCats[swapIdx], newCats[index]];
        const orders = newCats.map((c, i) => ({ id: c.id, order: i }));
        setCategories(newCats);
        try {
            await fetch('/api/admin/categories/reorder', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orders }),
            });
        } catch { showToast('Lỗi sắp xếp', 'error'); }
    };

    // ─────────────────────────────────────────────────────────────────────────
    const inputCls = "w-full px-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 transition-all";
    const inputStyle = {
        background: 'var(--adm-surface-2, #f9fafb)',
        borderColor: 'var(--adm-border, #e5e7eb)',
        color: 'var(--adm-text, #111)',
    };

    return (
        <div className="space-y-6">
            {/* ─ Header ─ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--adm-text, #111)' }}>
                        Quản lý Danh mục
                    </h2>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--adm-text-muted, #6b7280)' }}>
                        {categories.length} danh mục · {categories.reduce((a, c) => a + (c.subcategories?.length || 0), 0)} danh mục con
                    </p>
                </div>
                <button
                    onClick={() => openCatModal()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                    style={{ background: 'var(--adm-primary, #6366f1)' }}
                >
                    <Plus size={16} /> Thêm danh mục
                </button>
            </div>

            {/* ─ Categories List ─ */}
            {loading ? (
                <div className="flex items-center justify-center py-24 gap-3" style={{ color: 'var(--adm-text-muted, #6b7280)' }}>
                    <Loader2 size={24} className="animate-spin" />
                    <span className="text-sm font-medium">Đang tải dữ liệu...</span>
                </div>
            ) : categories.length === 0 ? (
                <div className="adm-card flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ background: 'var(--adm-primary-light, #eef2ff)' }}>
                        <Grid3X3 size={28} style={{ color: 'var(--adm-primary, #6366f1)' }} />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--adm-text-muted, #6b7280)' }}>
                        Chưa có danh mục nào. Hãy thêm danh mục đầu tiên!
                    </p>
                    <button onClick={() => openCatModal()}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                        style={{ background: 'var(--adm-primary, #6366f1)' }}>
                        <Plus size={14} className="inline mr-1" /> Thêm danh mục
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {categories.map((cat, idx) => {
                        const expanded = expandedIds.has(cat.id);
                        return (
                            <motion.div
                                key={cat.id}
                                layout
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                className="adm-card overflow-hidden"
                                style={{ opacity: cat.isActive ? 1 : 0.6 }}
                            >
                                {/* ── Category Row ── */}
                                <div className="flex items-center gap-3 px-4 py-4">
                                    {/* Order arrows */}
                                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                                        <button onClick={() => moveCategory(idx, 'up')} disabled={idx === 0}
                                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-20 transition-colors">
                                            <ArrowUp size={12} />
                                        </button>
                                        <button onClick={() => moveCategory(idx, 'down')} disabled={idx === categories.length - 1}
                                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-20 transition-colors">
                                            <ArrowDown size={12} />
                                        </button>
                                    </div>

                                    {/* Expand toggle */}
                                    <button onClick={() => toggleExpand(cat.id)}
                                        className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100">
                                        <motion.span animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                                            <ChevronRight size={16} style={{ color: 'var(--adm-text-muted, #6b7280)' }} />
                                        </motion.span>
                                    </button>

                                    {/* Image */}
                                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border"
                                        style={{ borderColor: 'var(--adm-border, #e5e7eb)' }}>
                                        {cat.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                <ImageIcon size={16} className="text-gray-400" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-sm" style={{ color: 'var(--adm-text, #111)' }}>
                                                {cat.name}
                                            </span>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                                                style={{ background: 'var(--adm-surface-2, #f3f4f6)', color: 'var(--adm-text-muted, #6b7280)' }}>
                                                {cat.id}
                                            </span>
                                            {!cat.isActive && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-600">Ẩn</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-xs" style={{ color: 'var(--adm-text-muted, #6b7280)' }}>
                                                {cat.subcategories?.length || 0} danh mục con
                                            </span>
                                            {cat.count !== undefined && (
                                                <span className="text-xs" style={{ color: 'var(--adm-text-muted, #6b7280)' }}>
                                                    · {cat.count} sản phẩm
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button onClick={() => openSubModal(cat.id)}
                                            title="Thêm danh mục con"
                                            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-indigo-50"
                                            style={{ color: 'var(--adm-primary, #6366f1)' }}>
                                            <Plus size={15} />
                                        </button>
                                        <button onClick={() => toggleCatActive(cat)}
                                            title={cat.isActive ? 'Ẩn danh mục' : 'Hiện danh mục'}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-yellow-50"
                                            style={{ color: cat.isActive ? '#10b981' : '#f59e0b' }}>
                                            {cat.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                                        </button>
                                        <button onClick={() => openCatModal(cat)}
                                            title="Chỉnh sửa"
                                            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-indigo-50"
                                            style={{ color: 'var(--adm-primary, #6366f1)' }}>
                                            <Edit2 size={15} />
                                        </button>
                                        <button
                                            onClick={() => setDeleteModal({ type: 'cat', catId: cat.id, name: cat.name })}
                                            title="Xóa"
                                            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-rose-50 text-rose-500">
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>

                                {/* ── Subcategories ── */}
                                <AnimatePresence>
                                    {expanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                                            className="overflow-hidden"
                                        >
                                            <div className="border-t mx-4" style={{ borderColor: 'var(--adm-border, #e5e7eb)' }} />
                                            <div className="px-4 py-3 space-y-2">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-xs font-bold uppercase tracking-widest"
                                                        style={{ color: 'var(--adm-text-muted, #6b7280)' }}>
                                                        Danh mục con ({cat.subcategories?.length || 0})
                                                    </p>
                                                    <button onClick={() => openSubModal(cat.id)}
                                                        className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                                                        style={{ color: 'var(--adm-primary, #6366f1)', background: 'var(--adm-primary-light, #eef2ff)' }}>
                                                        <Plus size={12} /> Thêm con
                                                    </button>
                                                </div>

                                                {(!cat.subcategories || cat.subcategories.length === 0) ? (
                                                    <div className="flex items-center justify-center py-6 rounded-xl"
                                                        style={{ background: 'var(--adm-surface-2, #f9fafb)' }}>
                                                        <p className="text-xs" style={{ color: 'var(--adm-text-muted, #9ca3af)' }}>
                                                            Chưa có danh mục con nào
                                                        </p>
                                                    </div>
                                                ) : (
                                                    [...cat.subcategories]
                                                        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                                                        .map(sub => (
                                                            <motion.div
                                                                key={sub.id}
                                                                layout
                                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                                                                style={{
                                                                    background: 'var(--adm-surface-2, #f9fafb)',
                                                                    opacity: sub.isActive ? 1 : 0.5
                                                                }}
                                                            >
                                                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                                    style={{ background: sub.isActive ? '#10b981' : '#d1d5db' }} />

                                                                {sub.image && (
                                                                    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border"
                                                                        style={{ borderColor: 'var(--adm-border, #e5e7eb)' }}>
                                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                        <img src={sub.image} alt={sub.name} className="w-full h-full object-cover" />
                                                                    </div>
                                                                )}

                                                                <div className="flex-1 min-w-0">
                                                                    <span className="text-sm font-semibold" style={{ color: 'var(--adm-text, #111)' }}>
                                                                        {sub.name}
                                                                    </span>
                                                                    <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded"
                                                                        style={{ background: 'var(--adm-border, #e5e7eb)', color: 'var(--adm-text-muted, #6b7280)' }}>
                                                                        {sub.id}
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                                                    <button onClick={() => toggleSubActive(cat.id, sub)}
                                                                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white"
                                                                        style={{ color: sub.isActive ? '#10b981' : '#f59e0b' }}>
                                                                        {sub.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                                                                    </button>
                                                                    <button onClick={() => openSubModal(cat.id, sub)}
                                                                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white"
                                                                        style={{ color: 'var(--adm-primary, #6366f1)' }}>
                                                                        <Edit2 size={13} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setDeleteModal({ type: 'sub', catId: cat.id, subId: sub.id, name: sub.name })}
                                                                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white text-rose-500">
                                                                        <Trash2 size={13} />
                                                                    </button>
                                                                </div>
                                                            </motion.div>
                                                        ))
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* ══ Category Modal ══ */}
            <Modal open={catModal} onClose={() => setCatModal(false)}
                title={editingCat ? `Chỉnh sửa: ${editingCat.name}` : 'Thêm danh mục mới'}>
                <form onSubmit={handleCatSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-1.5"
                            style={{ color: 'var(--adm-text-muted, #6b7280)' }}>ID Danh mục *</label>
                        <input
                            required
                            disabled={!!editingCat}
                            value={catForm.id}
                            onChange={e => setCatForm({ ...catForm, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                            placeholder="vd: ao-nam, quan-nam, phu-kien"
                            className={inputCls}
                            style={{ ...inputStyle, opacity: editingCat ? 0.6 : 1 }}
                        />
                        {!editingCat && <p className="text-[11px] mt-1" style={{ color: 'var(--adm-text-muted, #9ca3af)' }}>
                            ID không thể thay đổi sau khi tạo. Dùng chữ thường, dấu gạch ngang.
                        </p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-1.5"
                            style={{ color: 'var(--adm-text-muted, #6b7280)' }}>Tên danh mục *</label>
                        <input
                            required
                            value={catForm.name}
                            onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                            placeholder="vd: Áo Nam, Quần Nam, Phụ Kiện"
                            className={inputCls}
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-1.5"
                            style={{ color: 'var(--adm-text-muted, #6b7280)' }}>Mô tả</label>
                        <textarea
                            rows={2}
                            value={catForm.description}
                            onChange={e => setCatForm({ ...catForm, description: e.target.value })}
                            placeholder="Mô tả ngắn về danh mục..."
                            className={inputCls + ' resize-none'}
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-1.5"
                            style={{ color: 'var(--adm-text-muted, #6b7280)' }}>URL Hình ảnh *</label>
                        <input
                            required
                            value={catForm.image}
                            onChange={e => setCatForm({ ...catForm, image: e.target.value })}
                            placeholder="https://..."
                            className={inputCls}
                            style={inputStyle}
                        />
                        <div className="mt-2">
                            <ImagePreview url={catForm.image} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-1.5"
                            style={{ color: 'var(--adm-text-muted, #6b7280)' }}>URL Video (Tùy chọn)</label>
                        <input
                            value={catForm.video}
                            onChange={e => setCatForm({ ...catForm, video: e.target.value })}
                            placeholder="https://... (mp4/webm)"
                            className={inputCls}
                            style={inputStyle}
                        />
                        <div className="mt-2">
                            <ImagePreview url={catForm.video} isVideo />
                        </div>
                        <p className="text-[11px] mt-1" style={{ color: 'var(--adm-text-muted, #9ca3af)' }}>
                            Nếu có video, hệ thống sẽ ưu tiên phát video thay vì ảnh tĩnh trên trang chủ.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-1.5"
                            style={{ color: 'var(--adm-text-muted, #6b7280)' }}>Thứ tự hiển thị</label>
                        <input
                            type="number"
                            min={0}
                            value={catForm.order}
                            onChange={e => setCatForm({ ...catForm, order: Number(e.target.value) })}
                            className={inputCls}
                            style={inputStyle}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setCatModal(false)}
                            className="flex-1 py-3 rounded-xl font-bold text-sm transition-colors"
                            style={{ background: 'var(--adm-surface-2, #f3f4f6)', color: 'var(--adm-text, #374151)' }}>
                            Hủy
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                            style={{ background: 'var(--adm-primary, #6366f1)' }}>
                            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                            {editingCat ? 'Lưu thay đổi' : 'Thêm danh mục'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ══ Subcategory Modal ══ */}
            <Modal open={subModal} onClose={() => setSubModal(false)}
                title={editingSub ? `Sửa danh mục con: ${editingSub.name}` : 'Thêm danh mục con'}>
                <div className="mb-4 px-3 py-2 rounded-xl flex items-center gap-2"
                    style={{ background: 'var(--adm-primary-light, #eef2ff)' }}>
                    <FolderOpen size={14} style={{ color: 'var(--adm-primary, #6366f1)' }} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--adm-primary, #6366f1)' }}>
                        Danh mục cha: {categories.find(c => c.id === activeCatId)?.name}
                    </span>
                </div>

                <form onSubmit={handleSubSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-1.5"
                            style={{ color: 'var(--adm-text-muted, #6b7280)' }}>ID Danh mục con *</label>
                        <input
                            required
                            disabled={!!editingSub}
                            value={subForm.id}
                            onChange={e => setSubForm({ ...subForm, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                            placeholder="vd: ao-polo, ao-thun, ao-so-mi"
                            className={inputCls}
                            style={{ ...inputStyle, opacity: editingSub ? 0.6 : 1 }}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-1.5"
                            style={{ color: 'var(--adm-text-muted, #6b7280)' }}>Tên danh mục con *</label>
                        <input
                            required
                            value={subForm.name}
                            onChange={e => setSubForm({ ...subForm, name: e.target.value })}
                            placeholder="vd: Áo Polo, Áo Thun, Áo Sơ Mi"
                            className={inputCls}
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-1.5"
                            style={{ color: 'var(--adm-text-muted, #6b7280)' }}>Mô tả</label>
                        <input
                            value={subForm.description}
                            onChange={e => setSubForm({ ...subForm, description: e.target.value })}
                            placeholder="Mô tả ngắn..."
                            className={inputCls}
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-1.5"
                            style={{ color: 'var(--adm-text-muted, #6b7280)' }}>URL Hình ảnh</label>
                        <input
                            value={subForm.image}
                            onChange={e => setSubForm({ ...subForm, image: e.target.value })}
                            placeholder="https://... (tùy chọn)"
                            className={inputCls}
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-1.5"
                            style={{ color: 'var(--adm-text-muted, #6b7280)' }}>Thứ tự hiển thị</label>
                        <input
                            type="number"
                            min={0}
                            value={subForm.order}
                            onChange={e => setSubForm({ ...subForm, order: Number(e.target.value) })}
                            className={inputCls}
                            style={inputStyle}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setSubModal(false)}
                            className="flex-1 py-3 rounded-xl font-bold text-sm transition-colors"
                            style={{ background: 'var(--adm-surface-2, #f3f4f6)', color: 'var(--adm-text, #374151)' }}>
                            Hủy
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                            style={{ background: 'var(--adm-primary, #6366f1)' }}>
                            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                            {editingSub ? 'Lưu thay đổi' : 'Thêm danh mục con'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ══ Delete Confirm Modal ══ */}
            <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Xác nhận xóa">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle size={20} className="text-rose-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-rose-800">Xóa &quot;{deleteModal?.name}&quot;?</p>
                            <p className="text-xs text-rose-600 mt-0.5">
                                {deleteModal?.type === 'cat'
                                    ? 'Hành động này sẽ xóa danh mục và tất cả danh mục con. Không thể hoàn tác!'
                                    : 'Danh mục con này sẽ bị xóa vĩnh viễn.'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteModal(null)}
                            className="flex-1 py-3 rounded-xl font-bold text-sm transition-colors"
                            style={{ background: 'var(--adm-surface-2, #f3f4f6)', color: 'var(--adm-text, #374151)' }}>
                            Hủy
                        </button>
                        <button onClick={confirmDelete} disabled={saving}
                            className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-rose-500 hover:bg-rose-600 flex items-center justify-center gap-2 transition-all disabled:opacity-60">
                            {saving ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                            Xóa vĩnh viễn
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ── Toast ── */}
            <AnimatePresence>
                {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
            </AnimatePresence>
        </div>
    );
}
