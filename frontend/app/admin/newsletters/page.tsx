'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mail, Search, Download, Trash2, Loader2, RefreshCw, Calendar, Ticket, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/app/component/AuthContext';
import { toast } from 'react-hot-toast';

interface Subscriber {
    _id: string;
    email: string;
    status: string;
    coupon_code?: string;
    discount_percent?: number;
    source?: string;
    ip_address?: string;
    createdAt: string;
}

export default function AdminNewslettersPage() {
    const { token, user } = useAuth();
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [exporting, setExporting] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const fetchSubscribers = useCallback(async (p = 1, q = '') => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: p.toString(),
                limit: '15',
                search: q
            });
            const res = await fetch(`/api/newsletter/subscribers?${query.toString()}`, {
                headers: { 'Authorization': `Bearer ${token || user?.id}` }
            });
            const data = await res.json();
            if (data.success) {
                setSubscribers(data.subscribers || []);
                setTotalPages(data.pagination?.totalPages || 1);
                setTotalItems(data.pagination?.total || 0);
            }
        } catch {
            toast.error('Không thể tải danh sách email đăng ký!');
        } finally {
            setLoading(false);
        }
    }, [token, user?.id]);

    useEffect(() => {
        fetchSubscribers(page, search);
    }, [page, fetchSubscribers]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchSubscribers(1, search);
    };

    const handleExportCSV = async () => {
        setExporting(true);
        try {
            const res = await fetch('/api/newsletter/export', {
                headers: { 'Authorization': `Bearer ${token || user?.id}` }
            });
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `newsletter_subscribers_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            toast.success('Đã xuất file CSV danh sách email thành công!');
        } catch {
            toast.error('Lỗi khi xuất file CSV!');
        } finally {
            setExporting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/newsletter/subscribers/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token || user?.id}` }
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Đã xóa email khỏi danh sách');
                fetchSubscribers(page, search);
            }
        } catch {
            toast.error('Lỗi khi xóa email');
        } finally {
            setDeleteId(null);
        }
    };

    const inputStyle = { backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border shadow-sm"
                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider flex items-center gap-1">
                            <Mail size={12} /> Email Marketing
                        </span>
                        <span className="text-xs" style={{ color: 'var(--adm-text-subtle)' }}>• Tổng cộng {totalItems} email</span>
                    </div>
                    <h1 className="text-xl font-black tracking-tight mt-1 flex items-center gap-2" style={{ color: 'var(--adm-text)' }}>
                        Quản Lý Email Đăng Ký Nhận Tin
                    </h1>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>Theo dõi danh sách khách hàng đăng ký nhận thông tin ưu đãi & xuất file CSV cho chiến dịch Marketing</p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => fetchSubscribers(page, search)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all"
                        style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Làm mới
                    </button>

                    <button
                        onClick={handleExportCSV}
                        disabled={exporting || subscribers.length === 0}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition-all cursor-pointer"
                    >
                        {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        Xuất File CSV
                    </button>
                </div>
            </div>

            {/* Filter & Search */}
            <div className="p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3"
                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" size={15} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm kiếm địa chỉ email..."
                        className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border focus:outline-none"
                        style={inputStyle}
                    />
                </form>

                <p className="text-xs font-medium" style={{ color: 'var(--adm-text-muted)' }}>
                    Hiển thị <strong>{subscribers.length}</strong> / <strong>{totalItems}</strong> kết quả
                </p>
            </div>

            {/* Table */}
            <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b uppercase tracking-wider font-bold" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' }}>
                                <th className="px-5 py-3.5">STT</th>
                                <th className="px-5 py-3.5">Địa chỉ Email</th>
                                <th className="px-5 py-3.5 text-center">Mã Ưu Đãi Đã Cấp</th>
                                <th className="px-5 py-3.5 text-center">Trạng Thái</th>
                                <th className="px-5 py-3.5">Thời Gian Đăng Ký</th>
                                <th className="px-5 py-3.5 text-center">Địa Chỉ IP</th>
                                <th className="px-5 py-3.5 text-right">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b" style={{ borderColor: 'var(--adm-border)' }}>
                                        {Array.from({ length: 7 }).map((__, j) => (
                                            <td key={j} className="px-5 py-4">
                                                <div className="h-4 rounded animate-pulse" style={{ backgroundColor: 'var(--adm-surface-2)' }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : subscribers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center" style={{ color: 'var(--adm-text-muted)' }}>
                                        <Mail size={40} className="mx-auto mb-2 opacity-30" />
                                        <p className="font-semibold">Chưa có khách hàng nào đăng ký email nhận tin.</p>
                                    </td>
                                </tr>
                            ) : (
                                subscribers.map((sub, idx) => (
                                    <tr key={sub._id} className="border-b last:border-0 hover:bg-black/[0.02] transition-colors" style={{ borderColor: 'var(--adm-border)' }}>
                                        <td className="px-5 py-4 font-mono text-slate-400">
                                            {(page - 1) * 15 + idx + 1}
                                        </td>
                                        <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-200">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                                                    {sub.email.charAt(0).toUpperCase()}
                                                </div>
                                                <span>{sub.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-mono font-bold text-[11px] border border-amber-200 inline-flex items-center gap-1">
                                                <Ticket size={12} /> {sub.coupon_code || 'WELCOME10'} (-{sub.discount_percent || 10}%)
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${sub.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                                                {sub.status === 'active' ? '🟢 Hoạt động' : '🔴 Hủy nhận tin'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 font-mono text-slate-500 text-[11px]">
                                            {new Date(sub.createdAt).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-5 py-4 text-center font-mono text-slate-400 text-[11px]">
                                            {sub.ip_address || '---'}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button
                                                onClick={() => setDeleteId(sub._id)}
                                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                title="Xóa email này"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--adm-border)' }}>
                        <span className="text-xs text-slate-500">Trang {page} / {totalPages}</span>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40"
                                style={inputStyle}
                            >
                                Trước
                            </button>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                                className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40"
                                style={inputStyle}
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirm Delete Modal */}
            {deleteId && (
                <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl">
                        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                            <ShieldAlert size={24} />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">Xác nhận xóa email?</h3>
                        <p className="text-xs text-slate-500">Email này sẽ bị xóa khỏi danh sách đăng ký nhận tin của hệ thống.</p>
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="w-full py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => handleDelete(deleteId)}
                                className="w-full py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
                            >
                                Xóa ngay
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
