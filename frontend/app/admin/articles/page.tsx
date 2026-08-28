'use client';
/**
 * ============================================================
 * TRANG ADMIN: QUẢN LÝ BÀI VIẾT — /admin/articles
 *
 * Hỗ trợ 2 Chế độ hiển thị:
 * 1. Chế độ Danh sách (List View): Xem, tìm kiếm, lọc, xóa bài viết
 * 2. Chế độ Trình soạn thảo (Full-Page Editor View): Tạo mới hoặc chỉnh sửa bài viết toàn màn hình
 *
 * API sử dụng:
 *   GET    /api/admin/articles          — Lấy danh sách
 *   POST   /api/admin/articles          — Tạo bài viết
 *   PUT    /api/admin/articles/:id      — Cập nhật
 *   DELETE /api/admin/articles/:id      — Xóa
 * ============================================================
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Pencil, Trash2, Search, Eye, EyeOff,
    FileText, Tag, Calendar, Check, ArrowLeft, Code,
    AlertTriangle, Loader2, ChevronDown, RefreshCw, Save, Image as ImageIcon
} from 'lucide-react';

// ─── Kiểu dữ liệu ──────────────────────────────────────────
interface Article {
    _id:       string;
    id:        string;
    title:     string;
    slug:      string;
    excerpt:   string;
    content:   string;
    thumbnail: string;
    category:  string;
    status:    'draft' | 'published';
    tags:      string[];
    views:     number;
    createdAt: string;
}

// ─── Form mặc định ─────────────────────────────────────────
const EMPTY_FORM = {
    title:     '',
    slug:      '',
    excerpt:   '',
    content:   '',
    thumbnail: '',
    category:  'tin-tuc',
    status:    'published' as 'draft' | 'published',
    tags:      ''
};

// ─── Danh sách danh mục ────────────────────────────────────
const CATEGORIES = [
    { value: 'xu-huong',  label: '🌟 Xu hướng' },
    { value: 'tips',      label: '💡 Tips & Tricks' },
    { value: 'tin-tuc',   label: '📰 Tin tức' },
    { value: 'phong-cach',label: '✨ Phong cách' },
    { value: 'khac',      label: '📌 Khác' }
];

// ─── Hằng số API ────────────────────────────────────────────
const ADMIN_API = '/api/admin/articles';

// ════════════════════════════════════════════════════════════
// COMPONENT CHÍNH
// ════════════════════════════════════════════════════════════
export default function AdminArticlesPage() {
    // ─── State ─────────────────────────────────────────────
    const [articles,      setArticles]      = useState<Article[]>([]);
    const [loading,       setLoading]       = useState(true);
    const [search,        setSearch]        = useState('');
    const [filterStatus,  setFilterStatus]  = useState<'all' | 'published' | 'draft'>('all');
    
    // Switch giữa 'list' (danh sách) và 'editor' (trang chỉnh sửa toàn màn hình)
    const [viewMode,      setViewMode]      = useState<'list' | 'editor'>('list');
    const [editingId,     setEditingId]     = useState<string | null>(null);
    const [form,          setForm]          = useState(EMPTY_FORM);
    const [saving,        setSaving]        = useState(false);
    const [editorTab,     setEditorTab]     = useState<'code' | 'preview'>('code');

    const [deleteId,      setDeleteId]      = useState<string | null>(null);
    const [toast,         setToast]         = useState<{ ok: boolean; msg: string } | null>(null);

    // ─── Toast (tự ẩn sau 3 giây) ──────────────────────────
    const notify = (ok: boolean, msg: string) => {
        setToast({ ok, msg });
        setTimeout(() => setToast(null), 3000);
    };

    // ─── Lấy danh sách bài viết ────────────────────────────
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await fetch(`${ADMIN_API}?limit=200`);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const d = await r.json();
            if (d.success) setArticles(d.data ?? []);
            else throw new Error(d.message);
        } catch (e: unknown) {
            notify(false, 'Không tải được danh sách: ' + (e instanceof Error ? e.message : String(e)));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // ─── Mở trang tạo mới ──────────────────────────────────
    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setEditorTab('code');
        setViewMode('editor');
    };

    // ─── Mở trang chỉnh sửa ────────────────────────────────
    const openEdit = (a: Article) => {
        setEditingId(a._id);
        setForm({
            title:     a.title,
            slug:      a.slug      || '',
            excerpt:   a.excerpt   || '',
            content:   a.content,
            thumbnail: a.thumbnail || '',
            category:  a.category  || 'tin-tuc',
            status:    a.status,
            tags:      (a.tags ?? []).join(', ')
        });
        setEditorTab('code');
        setViewMode('editor');
    };

    // ─── Trở về danh sách ──────────────────────────────────
    const backToList = () => {
        if (saving) return;
        setViewMode('list');
    };

    // ─── Tự động sinh Slug từ Tiêu đề ──────────────────────
    const handleTitleChange = (val: string) => {
        setForm(f => {
            const isAutoSlug = !f.slug || f.slug === generateSlug(f.title);
            const newSlug = isAutoSlug ? generateSlug(val) : f.slug;
            return { ...f, title: val, slug: newSlug };
        });
    };

    const generateSlug = (str: string) => {
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[đĐ]/g, 'd')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');
    };

    // ─── Lưu bài viết ──────────────────────────────────────
    const save = async () => {
        if (!form.title.trim())   { notify(false, 'Vui lòng nhập tiêu đề bài viết'); return; }
        if (!form.content.trim()) { notify(false, 'Vui lòng nhập nội dung bài viết'); return; }

        setSaving(true);
        try {
            const payload = {
                ...form,
                tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
            };

            const url    = editingId ? `${ADMIN_API}/${editingId}` : ADMIN_API;
            const method = editingId ? 'PUT' : 'POST';

            const r = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload)
            });

            const d = await r.json();

            if (d.success) {
                notify(true, editingId ? 'Đã cập nhật bài viết thành công' : 'Đã đăng bài viết mới thành công');
                setViewMode('list');
                load();
            } else {
                notify(false, d.message || 'Có lỗi xảy ra khi lưu');
            }
        } catch (e: unknown) {
            notify(false, 'Lỗi kết nối: ' + (e instanceof Error ? e.message : String(e)));
        } finally {
            setSaving(false);
        }
    };

    // ─── Xóa bài viết ──────────────────────────────────────
    const remove = async (id: string) => {
        try {
            const r = await fetch(`${ADMIN_API}/${id}`, { method: 'DELETE' });
            const d = await r.json();
            if (d.success) {
                setArticles(prev => prev.filter(a => a._id !== id));
                notify(true, 'Đã xóa bài viết thành công');
            } else {
                notify(false, d.message || 'Xóa thất bại');
            }
        } catch {
            notify(false, 'Lỗi kết nối máy chủ');
        } finally {
            setDeleteId(null);
        }
    };

    // ─── Lọc bài viết ──────────────────────────────────────
    const filtered = articles.filter(a => {
        const q = search.toLowerCase();
        const matchSearch = !q
            || a.title.toLowerCase().includes(q)
            || (a.excerpt ?? '').toLowerCase().includes(q)
            || (a.tags ?? []).some(t => t.toLowerCase().includes(q));
        const matchStatus = filterStatus === 'all' || a.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const fmtDate = (d: string) =>
        new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const catLabel = (v: string) =>
        CATEGORIES.find(c => c.value === v)?.label ?? v;

    // ════════════════════════════════════════════════════════
    // RENDER MAIN VIEW
    // ════════════════════════════════════════════════════════
    return (
        <div className="space-y-6">

            {/* ── Notification Toast ── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        key="toast"
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        className={`fixed top-5 right-5 z-[200] flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white pointer-events-none ${toast.ok ? 'bg-emerald-500' : 'bg-red-500'}`}
                    >
                        {toast.ok ? <Check size={15} /> : <AlertTriangle size={15} />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ════════════════════════════════════════════════
                MODE 1: DANH SÁCH BÀI VIẾT (LIST VIEW)
            ════════════════════════════════════════════════ */}
            {viewMode === 'list' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                >
                    {/* Header Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black" style={{ color: 'var(--adm-text)' }}>
                                Quản lý Bài viết
                            </h1>
                            <p className="text-sm mt-1" style={{ color: 'var(--adm-text-muted)' }}>
                                Tổng cộng {articles.length} bài viết &bull;&nbsp;
                                {articles.filter(a => a.status === 'published').length} xuất bản &bull;&nbsp;
                                {articles.filter(a => a.status === 'draft').length} bản nháp
                            </p>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <button
                                onClick={load}
                                className="p-2.5 rounded-xl transition-all border shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-800"
                                style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' }}
                                title="Tải lại danh sách"
                            >
                                <RefreshCw size={16} />
                            </button>
                            <button onClick={openCreate} className="adm-btn-primary flex items-center gap-2 shadow-md">
                                <Plus size={18} /> Thêm bài viết mới
                            </button>
                        </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="adm-card p-4 flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--adm-text-subtle)' }} />
                            <input
                                type="text"
                                placeholder="Tìm theo tiêu đề, từ khóa, tag hoặc tóm tắt..."
                                className="adm-input pl-10 w-full"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <select
                                className="adm-select pr-8"
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="published">✅ Đã xuất bản</option>
                                <option value="draft">📝 Bản nháp</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--adm-text-subtle)' }} />
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="adm-card overflow-hidden shadow-sm">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <Loader2 className="animate-spin text-indigo-600" size={32} />
                                <p className="text-sm font-medium" style={{ color: 'var(--adm-text-muted)' }}>Đang tải danh sách bài viết...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-20 space-y-4">
                                <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
                                    <FileText size={32} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base" style={{ color: 'var(--adm-text)' }}>
                                        {search || filterStatus !== 'all' ? 'Không tìm thấy bài viết phù hợp' : 'Chưa có bài viết nào'}
                                    </h3>
                                    <p className="text-xs mt-1" style={{ color: 'var(--adm-text-muted)' }}>
                                        {search || filterStatus !== 'all' ? 'Thử thay đổi từ khóa hoặc bộ lọc trạng thái.' : 'Hãy tạo bài viết đầu tiên để chia sẻ nội dung đến khách hàng.'}
                                    </p>
                                </div>
                                {!search && filterStatus === 'all' && (
                                    <button onClick={openCreate} className="adm-btn-primary inline-flex items-center gap-2">
                                        <Plus size={16} /> Tạo bài viết đầu tiên
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="adm-table-scroll">
                                <table className="adm-table">
                                    <thead>
                                        <tr>
                                            <th>Bài viết</th>
                                            <th>Danh mục</th>
                                            <th>Tags</th>
                                            <th>Trạng thái</th>
                                            <th>Lượt xem</th>
                                            <th>Ngày tạo</th>
                                            <th style={{ textAlign: 'right' }}>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map(a => (
                                            <tr key={a._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                                {/* Title & Thumbnail */}
                                                <td style={{ maxWidth: 320 }}>
                                                    <div className="flex items-center gap-3.5">
                                                        {a.thumbnail ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={a.thumbnail}
                                                                alt=""
                                                                className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-2xs border border-slate-200/80 dark:border-slate-700"
                                                                onError={e => { e.currentTarget.style.display = 'none'; }}
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 text-indigo-500">
                                                                <FileText size={20} />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-sm truncate hover:text-indigo-600 transition-colors cursor-pointer" 
                                                               onClick={() => openEdit(a)}
                                                               style={{ color: 'var(--adm-text)' }}>
                                                                {a.title}
                                                            </p>
                                                            <p className="text-xs truncate mt-0.5 font-mono text-slate-400">
                                                                /{a.slug}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Category */}
                                                <td>
                                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                        {catLabel(a.category)}
                                                    </span>
                                                </td>

                                                {/* Tags */}
                                                <td>
                                                    <div className="flex flex-wrap gap-1">
                                                        {(a.tags ?? []).slice(0, 2).map(t => (
                                                            <span key={t} className="adm-badge adm-badge-info flex items-center gap-1">
                                                                <Tag size={9} />{t}
                                                            </span>
                                                        ))}
                                                        {(a.tags ?? []).length > 2 && (
                                                            <span className="adm-badge adm-badge-neutral">+{a.tags.length - 2}</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td>
                                                    {a.status === 'published' ? (
                                                        <span className="adm-badge adm-badge-success flex items-center gap-1 w-fit">
                                                            <Eye size={10} /> Đã xuất bản
                                                        </span>
                                                    ) : (
                                                        <span className="adm-badge adm-badge-neutral flex items-center gap-1 w-fit">
                                                            <EyeOff size={10} /> Bản nháp
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Views */}
                                                <td>
                                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                        {(a.views ?? 0).toLocaleString('vi-VN')}
                                                    </span>
                                                </td>

                                                {/* Date */}
                                                <td>
                                                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {fmtDate(a.createdAt)}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td>
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => openEdit(a)}
                                                            className="p-2 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300"
                                                            title="Chỉnh sửa toàn màn hình"
                                                        >
                                                            <Pencil size={14} /> Chỉnh sửa
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteId(a._id)}
                                                            className="p-2 rounded-lg transition-colors bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 size={14} />
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
                </motion.div>
            )}

            {/* ════════════════════════════════════════════════
                MODE 2: TRANG CHỈNH SỬA TOÀN MÀN HÌNH (FULL-PAGE EDITOR VIEW)
            ════════════════════════════════════════════════ */}
            {viewMode === 'editor' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.99 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.99 }}
                    className="space-y-6"
                >
                    {/* Top Header Bar with Navigation & Actions */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-4 z-30">
                        <div className="flex items-center gap-3.5 min-w-0">
                            <button
                                onClick={backToList}
                                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 flex items-center gap-2 font-bold text-xs shrink-0 cursor-pointer"
                            >
                                <ArrowLeft size={16} /> Quay lại danh sách
                            </button>
                            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                            <div className="min-w-0">
                                <h1 className="text-lg sm:text-xl font-black truncate" style={{ color: 'var(--adm-text)' }}>
                                    {editingId ? '✏️ Chỉnh sửa bài viết' : '➕ Thêm bài viết mới'}
                                </h1>
                                <p className="text-xs text-slate-400 truncate mt-0.5">
                                    {editingId ? `ID: ${editingId}` : 'Soạn thảo nội dung bài viết chuẩn SEO'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                            <button
                                onClick={backToList}
                                disabled={saving}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={save}
                                disabled={saving}
                                className="adm-btn-primary flex items-center gap-2 px-5 py-2.5 text-xs font-bold shadow-md cursor-pointer"
                            >
                                {saving ? (
                                    <><Loader2 size={16} className="animate-spin" /> Đang lưu...</>
                                ) : (
                                    <><Save size={16} /> {editingId ? 'Cập nhật thay đổi' : 'Đăng bài viết mới'}</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Main Workspace 2-Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* ─── LEFT COLUMN: MAIN CONTENT EDIT (2 Columns Wide) ─── */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Card 1: Title, Slug & Excerpt */}
                            <div className="adm-card p-6 space-y-5">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-3 border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                    <FileText size={16} className="text-indigo-500" /> Thông tin bài viết
                                </h3>

                                {/* Tiêu đề */}
                                <div>
                                    <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--adm-text)' }}>
                                        Tiêu đề bài viết <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="adm-input w-full text-base font-bold px-4 py-3"
                                        placeholder="Nhập tiêu đề hấp dẫn cho bài viết..."
                                        value={form.title}
                                        onChange={e => handleTitleChange(e.target.value)}
                                    />
                                </div>

                                {/* Slug */}
                                <div>
                                    <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--adm-text)' }}>
                                        Slug Đường Dẫn SEO <span className="font-normal text-slate-400">— Tự động sinh từ tiêu đề</span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono px-3 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 shrink-0">
                                            /tin-tuc/
                                        </span>
                                        <input
                                            type="text"
                                            className="adm-input flex-1 font-mono text-xs"
                                            placeholder="tieu-de-bai-viet"
                                            value={form.slug}
                                            onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))}
                                        />
                                    </div>
                                </div>

                                {/* Tóm tắt */}
                                <div>
                                    <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--adm-text)' }}>
                                        Tóm tắt ngắn (Excerpt) <span className="font-normal text-slate-400">— Hiển thị trên thẻ bài viết</span>
                                    </label>
                                    <textarea
                                        className="adm-input w-full resize-none leading-relaxed text-sm p-3.5"
                                        rows={3}
                                        placeholder="Nhập mô tả tóm tắt ngắn gọn khoảng 2-3 câu về bài viết..."
                                        value={form.excerpt}
                                        onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Card 2: HTML Content Editor with Preview Mode */}
                            <div className="adm-card p-6 space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 border-slate-100 dark:border-slate-800">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                        <Code size={16} className="text-indigo-500" /> Nội dung bài viết <span className="text-red-500">*</span>
                                    </h3>

                                    {/* Editor Mode Switcher */}
                                    <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <button
                                            onClick={() => setEditorTab('code')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                                                editorTab === 'code'
                                                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                            }`}
                                        >
                                            <Code size={14} /> Mã HTML Code
                                        </button>
                                        <button
                                            onClick={() => setEditorTab('preview')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                                                editorTab === 'preview'
                                                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                            }`}
                                        >
                                            <Eye size={14} /> Xem trước bài viết (Preview)
                                        </button>
                                    </div>
                                </div>

                                {editorTab === 'code' ? (
                                    <div>
                                        <textarea
                                            className="adm-input w-full font-mono text-xs sm:text-sm leading-relaxed p-4 border rounded-xl resize-y"
                                            rows={22}
                                            style={{ minHeight: '450px' }}
                                            placeholder="<h2>1. Tiêu đề mục</h2><p>Nội dung chi tiết ở đây...</p>"
                                            value={form.content}
                                            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                                        />
                                        <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                                            💡 Hỗ trợ các thẻ HTML: <code>&lt;h2&gt;</code>, <code>&lt;p&gt;</code>, <code>&lt;strong&gt;</code>, <code>&lt;ul&gt;</code>, <code>&lt;li&gt;</code>, <code>&lt;img&gt;</code>, <code>&lt;blockquote&gt;</code>.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-6 bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl min-h-[450px]">
                                        <div 
                                            className="article-content max-w-none text-slate-800 dark:text-slate-200"
                                            dangerouslySetInnerHTML={{ 
                                                __html: form.content || '<p className="text-slate-400 italic text-center py-10">Chưa có nội dung HTML để xem trước...</p>' 
                                            }} 
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ─── RIGHT COLUMN: SETTINGS, THUMBNAIL & METADATA (1 Column Wide) ─── */}
                        <div className="lg:col-span-1 space-y-6">

                            {/* Card 1: Publish Settings */}
                            <div className="adm-card p-6 space-y-5">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-3 border-slate-100 dark:border-slate-800">
                                    Cấu hình Đăng bài
                                </h3>

                                {/* Trạng thái */}
                                <div>
                                    <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--adm-text)' }}>
                                        Trạng thái hiển thị
                                    </label>
                                    <select
                                        className="adm-select w-full font-bold"
                                        value={form.status}
                                        onChange={e => setForm(f => ({ ...f, status: e.target.value as 'draft' | 'published' }))}
                                    >
                                        <option value="published">✅ Xuất bản công khai</option>
                                        <option value="draft">📝 Lưu bản nháp (Draft)</option>
                                    </select>
                                </div>

                                {/* Danh mục */}
                                <div>
                                    <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--adm-text)' }}>
                                        Danh mục bài viết
                                    </label>
                                    <select
                                        className="adm-select w-full font-medium"
                                        value={form.category}
                                        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                    >
                                        {CATEGORIES.map(c => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Save Button */}
                                <div className="pt-2">
                                    <button
                                        onClick={save}
                                        disabled={saving}
                                        className="adm-btn-primary w-full justify-center py-3 text-sm font-bold shadow-md cursor-pointer"
                                    >
                                        {saving ? (
                                            <><Loader2 size={18} className="animate-spin" /> Đang lưu...</>
                                        ) : (
                                            <><Check size={18} /> {editingId ? 'Cập nhật bài viết' : 'Xuất bản bài viết'}</>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Card 2: Thumbnail Image */}
                            <div className="adm-card p-6 space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-3 border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                    <ImageIcon size={16} className="text-indigo-500" /> Ảnh đại diện (Thumbnail)
                                </h3>

                                <div>
                                    <label className="block text-xs font-bold mb-1.5 text-slate-500">
                                        URL Ảnh đại diện
                                    </label>
                                    <input
                                        type="text"
                                        className="adm-input w-full text-xs"
                                        placeholder="https://images.unsplash.com/..."
                                        value={form.thumbnail}
                                        onChange={e => setForm(f => ({ ...f, thumbnail: e.target.value }))}
                                    />
                                </div>

                                {/* Large Image Preview */}
                                {form.thumbnail ? (
                                    <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 group">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={form.thumbnail}
                                            alt="Preview Thumbnail"
                                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={e => { e.currentTarget.style.display = 'none'; }}
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full h-40 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 gap-2">
                                        <ImageIcon size={32} />
                                        <span className="text-xs font-medium">Chưa có ảnh đại diện</span>
                                    </div>
                                )}
                            </div>

                            {/* Card 3: Tags */}
                            <div className="adm-card p-6 space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-3 border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                    <Tag size={16} className="text-indigo-500" /> Thẻ phân loại (Tags)
                                </h3>

                                <div>
                                    <label className="block text-xs font-bold mb-1.5 text-slate-500">
                                        Tags <span className="font-normal opacity-60">— Phân cách bởi dấu phẩy</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="adm-input w-full text-xs"
                                        placeholder="Xu hướng, Thời trang, Tips..."
                                        value={form.tags}
                                        onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                                    />
                                </div>

                                {/* Tag Badges Preview */}
                                {form.tags && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {form.tags.split(',').map(t => t.trim()).filter(Boolean).map((t, idx) => (
                                            <span key={idx} className="adm-badge adm-badge-info text-xs py-1 px-2.5">
                                                <Tag size={10} /> {t}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </motion.div>
            )}

            {/* ══════════════════════════════════════════════
                MODAL: XÁC NHẬN XÓA BÀI VIẾT
            ══════════════════════════════════════════════ */}
            <AnimatePresence>
                {deleteId && (
                    <>
                        <motion.div
                            key="del-overlay"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                            onClick={() => setDeleteId(null)}
                        />
                        <motion.div
                            key="del-modal"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div
                                className="w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center pointer-events-auto"
                                style={{ background: 'var(--adm-surface)', border: '1px solid var(--adm-border)' }}
                            >
                                <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                                    style={{ background: 'var(--adm-danger-light)' }}>
                                    <Trash2 size={24} style={{ color: 'var(--adm-danger)' }} />
                                </div>
                                <h3 className="font-bold text-base mb-2" style={{ color: 'var(--adm-text)' }}>
                                    Xác nhận xóa bài viết?
                                </h3>
                                <p className="text-sm mb-6" style={{ color: 'var(--adm-text-muted)' }}>
                                    Hành động này không thể hoàn tác. Bài viết sẽ bị gỡ khỏi hệ thống.
                                </p>
                                <div className="flex gap-3">
                                    <button onClick={() => setDeleteId(null)} className="adm-btn-secondary flex-1">
                                        Hủy
                                    </button>
                                    <button
                                        onClick={() => remove(deleteId)}
                                        className="flex-1 h-[44px] rounded-[10px] font-semibold text-sm text-white flex items-center justify-center gap-2 cursor-pointer"
                                        style={{ background: 'var(--adm-danger)' }}
                                    >
                                        <Trash2 size={14} /> Xóa
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

        </div>
    );
}
