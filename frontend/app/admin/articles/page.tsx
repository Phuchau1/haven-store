'use client';
/**
 * ============================================================
 * TRANG ADMIN: QUẢN LÝ BÀI VIẾT — /admin/articles
 *
 * API sử dụng:
 *   GET    /api/admin/articles          — Lấy danh sách
 *   POST   /api/admin/articles          — Tạo bài viết
 *   PUT    /api/admin/articles/:id      — Cập nhật
 *   DELETE /api/admin/articles/:id      — Xóa
 *
 * ⭐ Không cần gửi token — route admin đã có auditMiddleware
 * ============================================================
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Pencil, Trash2, Search, Eye, EyeOff,
    FileText, Tag, Calendar, X, Check,
    AlertTriangle, Loader2, ChevronDown, RefreshCw
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
// ⭐ QUAN TRỌNG: Dùng /api/admin/articles cho CRUD (không cần token)
const ADMIN_API = '/api/admin/articles';
const PUBLIC_API = '/api/articles';

// ════════════════════════════════════════════════════════════
// COMPONENT CHÍNH
// ════════════════════════════════════════════════════════════
export default function AdminArticlesPage() {
    // ─── State ─────────────────────────────────────────────
    const [articles,      setArticles]      = useState<Article[]>([]);
    const [loading,       setLoading]       = useState(true);
    const [search,        setSearch]        = useState('');
    const [filterStatus,  setFilterStatus]  = useState<'all' | 'published' | 'draft'>('all');
    const [modalOpen,     setModalOpen]     = useState(false);
    const [editingId,     setEditingId]     = useState<string | null>(null); // _id của bài đang sửa
    const [form,          setForm]          = useState(EMPTY_FORM);
    const [saving,        setSaving]        = useState(false);
    const [deleteId,      setDeleteId]      = useState<string | null>(null);
    const [toast,         setToast]         = useState<{ ok: boolean; msg: string } | null>(null);

    // ─── Toast (tự ẩn sau 3 giây) ──────────────────────────
    const notify = (ok: boolean, msg: string) => {
        setToast({ ok, msg });
        setTimeout(() => setToast(null), 3000);
    };

    // ─── Lấy danh sách bài viết ────────────────────────────
    // ⭐ Dùng ADMIN_API để lấy cả bài draft
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

    // ─── Mở modal tạo mới ──────────────────────────────────
    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setModalOpen(true);
    };

    // ─── Mở modal chỉnh sửa ────────────────────────────────
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
        setModalOpen(true);
    };

    // ─── Lưu (tạo mới hoặc cập nhật) ──────────────────────
    const save = async () => {
        if (!form.title.trim())   { notify(false, 'Vui lòng nhập tiêu đề'); return; }
        if (!form.content.trim()) { notify(false, 'Vui lòng nhập nội dung'); return; }

        setSaving(true);
        try {
            // Chuẩn bị payload — tags: string → string[]
            const payload = {
                ...form,
                tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
            };

            // ⭐ Nếu có editingId → PUT, không → POST
            const url    = editingId ? `${ADMIN_API}/${editingId}` : ADMIN_API;
            const method = editingId ? 'PUT' : 'POST';

            const r = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload)
            });

            const d = await r.json();

            if (d.success) {
                notify(true, editingId ? 'Đã cập nhật bài viết' : 'Đã thêm bài viết mới');
                setModalOpen(false);
                load(); // Reload danh sách
            } else {
                notify(false, d.message || 'Có lỗi xảy ra');
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
                notify(true, 'Đã xóa bài viết');
            } else {
                notify(false, d.message || 'Xóa thất bại');
            }
        } catch {
            notify(false, 'Lỗi kết nối máy chủ');
        } finally {
            setDeleteId(null);
        }
    };

    // ─── Lọc bài viết theo search + status ────────────────
    const filtered = articles.filter(a => {
        const q = search.toLowerCase();
        const matchSearch = !q
            || a.title.toLowerCase().includes(q)
            || (a.excerpt ?? '').toLowerCase().includes(q)
            || (a.tags ?? []).some(t => t.toLowerCase().includes(q));
        const matchStatus = filterStatus === 'all' || a.status === filterStatus;
        return matchSearch && matchStatus;
    });

    // ─── Helpers ───────────────────────────────────────────
    const fmtDate = (d: string) =>
        new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const catLabel = (v: string) =>
        CATEGORIES.find(c => c.value === v)?.label ?? v;

    // ════════════════════════════════════════════════════════
    // RENDER
    // ════════════════════════════════════════════════════════
    return (
        <div className="space-y-6">

            {/* ── Toast ── */}
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

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--adm-text)' }}>
                        Quản lý Bài viết
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--adm-text-muted)' }}>
                        {articles.length} bài &bull;&nbsp;
                        {articles.filter(a => a.status === 'published').length} xuất bản &bull;&nbsp;
                        {articles.filter(a => a.status === 'draft').length} bản nháp
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={load}
                        className="p-2 rounded-xl transition-colors"
                        style={{ background: 'var(--adm-surface-2)', color: 'var(--adm-text-muted)' }}
                        title="Tải lại"
                    >
                        <RefreshCw size={16} />
                    </button>
                    <button onClick={openCreate} className="adm-btn-primary flex items-center gap-2">
                        <Plus size={16} /> Thêm bài viết
                    </button>
                </div>
            </div>

            {/* ── Tìm kiếm + Lọc ── */}
            <div className="adm-card p-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--adm-text-subtle)' }} />
                    <input
                        type="text"
                        placeholder="Tìm theo tiêu đề, tag, tóm tắt..."
                        className="adm-input pl-9 w-full"
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
                    <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--adm-text-subtle)' }} />
                </div>
            </div>

            {/* ── Bảng danh sách ── */}
            <div className="adm-card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin" size={30} style={{ color: 'var(--adm-text-subtle)' }} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 space-y-3">
                        <FileText size={40} className="mx-auto" style={{ color: 'var(--adm-text-subtle)' }} />
                        <p style={{ color: 'var(--adm-text-muted)' }}>
                            {search || filterStatus !== 'all' ? 'Không tìm thấy bài viết nào' : 'Chưa có bài viết nào'}
                        </p>
                        {!search && filterStatus === 'all' && (
                            <button onClick={openCreate} className="adm-btn-primary">
                                Tạo bài đầu tiên
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
                                    <tr key={a._id}>
                                        {/* Thumbnail + Tiêu đề */}
                                        <td style={{ maxWidth: 280 }}>
                                            <div className="flex items-center gap-3">
                                                {a.thumbnail ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={a.thumbnail}
                                                        alt=""
                                                        className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                                                        style={{ border: '1px solid var(--adm-border)' }}
                                                        onError={e => { e.currentTarget.style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <div className="w-11 h-11 rounded-lg flex-shrink-0 flex items-center justify-center"
                                                        style={{ background: 'var(--adm-surface-2)' }}>
                                                        <FileText size={18} style={{ color: 'var(--adm-text-subtle)' }} />
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--adm-text)' }}>
                                                        {a.title}
                                                    </p>
                                                    <p className="text-xs truncate mt-0.5 font-mono" style={{ color: 'var(--adm-text-subtle)' }}>
                                                        /{a.slug}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Danh mục */}
                                        <td>
                                            <span className="text-xs" style={{ color: 'var(--adm-text-muted)' }}>
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

                                        {/* Trạng thái */}
                                        <td>
                                            {a.status === 'published' ? (
                                                <span className="adm-badge adm-badge-success flex items-center gap-1 w-fit">
                                                    <Eye size={9} /> Xuất bản
                                                </span>
                                            ) : (
                                                <span className="adm-badge adm-badge-neutral flex items-center gap-1 w-fit">
                                                    <EyeOff size={9} /> Nháp
                                                </span>
                                            )}
                                        </td>

                                        {/* Views */}
                                        <td>
                                            <span className="text-sm font-medium" style={{ color: 'var(--adm-text)' }}>
                                                {(a.views ?? 0).toLocaleString('vi-VN')}
                                            </span>
                                        </td>

                                        {/* Ngày tạo */}
                                        <td>
                                            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--adm-text-muted)' }}>
                                                <Calendar size={11} />
                                                {fmtDate(a.createdAt)}
                                            </span>
                                        </td>

                                        {/* Thao tác */}
                                        <td>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEdit(a)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg"
                                                    style={{ color: 'var(--adm-primary)', background: 'var(--adm-primary-light)' }}
                                                    title="Sửa"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(a._id)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg"
                                                    style={{ color: 'var(--adm-danger)', background: 'var(--adm-danger-light)' }}
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

            {/* ══════════════════════════════════════════════
                MODAL: THÊM / SỬA BÀI VIẾT
            ══════════════════════════════════════════════ */}
            <AnimatePresence>
                {modalOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            key="overlay"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                            onClick={() => !saving && setModalOpen(false)}
                        />

                        {/* Modal */}
                        <motion.div
                            key="modal"
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            transition={{ duration: 0.18 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div
                                className="w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col pointer-events-auto"
                                style={{
                                    background:  'var(--adm-surface)',
                                    border:      '1px solid var(--adm-border)',
                                    maxHeight:   '92dvh'
                                }}
                            >
                                {/* Header modal */}
                                <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
                                    style={{ borderColor: 'var(--adm-border)' }}>
                                    <h2 className="text-lg font-bold" style={{ color: 'var(--adm-text)' }}>
                                        {editingId ? '✏️ Chỉnh sửa bài viết' : '➕ Thêm bài viết mới'}
                                    </h2>
                                    <button
                                        onClick={() => !saving && setModalOpen(false)}
                                        className="w-8 h-8 flex items-center justify-center rounded-xl"
                                        style={{ background: 'var(--adm-surface-2)', color: 'var(--adm-text-muted)' }}
                                    >
                                        <X size={15} />
                                    </button>
                                </div>

                                {/* Body modal — có scroll */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4">

                                    {/* Tiêu đề * */}
                                    <div>
                                        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text-muted)' }}>
                                            Tiêu đề <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            className="adm-input w-full"
                                            placeholder="Nhập tiêu đề bài viết..."
                                            value={form.title}
                                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                        />
                                    </div>

                                    {/* Slug */}
                                    <div>
                                        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text-muted)' }}>
                                            Slug <span className="font-normal opacity-60">— để trống sẽ tự tạo từ tiêu đề</span>
                                        </label>
                                        <input
                                            className="adm-input w-full font-mono text-sm"
                                            placeholder="vi-du-tieu-de"
                                            value={form.slug}
                                            onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))}
                                        />
                                    </div>

                                    {/* Tóm tắt */}
                                    <div>
                                        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text-muted)' }}>
                                            Tóm tắt <span className="font-normal opacity-60">— để trống sẽ tự tạo từ nội dung</span>
                                        </label>
                                        <textarea
                                            className="adm-input w-full resize-none"
                                            rows={2}
                                            placeholder="Mô tả ngắn về bài viết..."
                                            value={form.excerpt}
                                            onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                                        />
                                    </div>

                                    {/* URL ảnh */}
                                    <div>
                                        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text-muted)' }}>
                                            URL Ảnh đại diện
                                        </label>
                                        <input
                                            className="adm-input w-full"
                                            placeholder="https://..."
                                            value={form.thumbnail}
                                            onChange={e => setForm(f => ({ ...f, thumbnail: e.target.value }))}
                                        />
                                        {form.thumbnail && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={form.thumbnail}
                                                alt="preview"
                                                className="mt-2 h-32 w-full object-cover rounded-xl"
                                                onError={e => { e.currentTarget.style.display = 'none'; }}
                                            />
                                        )}
                                    </div>

                                    {/* Nội dung * */}
                                    <div>
                                        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text-muted)' }}>
                                            Nội dung (HTML) <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            className="adm-input w-full resize-y font-mono text-xs"
                                            rows={10}
                                            placeholder={'<p>Nội dung bài viết...</p>'}
                                            value={form.content}
                                            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                                        />
                                    </div>

                                    {/* Danh mục + Trạng thái */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text-muted)' }}>
                                                Danh mục
                                            </label>
                                            <select
                                                className="adm-select w-full"
                                                value={form.category}
                                                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                            >
                                                {CATEGORIES.map(c => (
                                                    <option key={c.value} value={c.value}>{c.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text-muted)' }}>
                                                Trạng thái
                                            </label>
                                            <select
                                                className="adm-select w-full"
                                                value={form.status}
                                                onChange={e => setForm(f => ({ ...f, status: e.target.value as 'draft' | 'published' }))}
                                            >
                                                <option value="published">✅ Xuất bản ngay</option>
                                                <option value="draft">📝 Lưu bản nháp</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    <div>
                                        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text-muted)' }}>
                                            Tags <span className="font-normal opacity-60">— phân cách bởi dấu phẩy</span>
                                        </label>
                                        <input
                                            className="adm-input w-full"
                                            placeholder="Xu hướng, Thời trang, Tips..."
                                            value={form.tags}
                                            onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                {/* Footer modal */}
                                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t flex-shrink-0"
                                    style={{ borderColor: 'var(--adm-border)' }}>
                                    <button
                                        onClick={() => setModalOpen(false)}
                                        disabled={saving}
                                        className="adm-btn-secondary"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={save}
                                        disabled={saving}
                                        className="adm-btn-primary flex items-center gap-2 min-w-[120px] justify-center"
                                    >
                                        {saving
                                            ? <><Loader2 size={14} className="animate-spin" /> Đang lưu...</>
                                            : <><Check size={14} /> {editingId ? 'Cập nhật' : 'Thêm bài viết'}</>
                                        }
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════
                MODAL: XÁC NHẬN XÓA
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
                                    Hành động này không thể hoàn tác.
                                </p>
                                <div className="flex gap-3">
                                    <button onClick={() => setDeleteId(null)} className="adm-btn-secondary flex-1">
                                        Hủy
                                    </button>
                                    <button
                                        onClick={() => remove(deleteId)}
                                        className="flex-1 h-[44px] rounded-[10px] font-semibold text-sm text-white flex items-center justify-center gap-2"
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
