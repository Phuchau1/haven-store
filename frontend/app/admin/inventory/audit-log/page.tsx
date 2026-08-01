'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, User, ShieldAlert, FileText, Search, RefreshCw, Lock } from 'lucide-react';
import Link from 'next/link';

interface AuditLogItem {
    _id: string;
    userName: string;
    action: string;
    module: string;
    ipAddress: string;
    userAgent: string;
    oldValue: any;
    newValue: any;
    createdAt: string;
}

export default function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchAuditLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/wms/audit-logs');
            const data = await res.json();
            if (data.success) {
                setLogs(data.logs || []);
            }
        } catch (err) {
            console.error('Failed to fetch audit logs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuditLogs();
    }, []);

    const filteredLogs = logs.filter(l =>
        (l.userName || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.action || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border shadow-sm"
                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/admin/inventory/wms-dashboard"
                            className="text-xs transition-colors hover:underline"
                            style={{ color: 'var(--adm-text-muted)' }}>
                            ← Về WMS Dashboard
                        </Link>
                        <span style={{ color: 'var(--adm-border)' }}>|</span>
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider flex items-center gap-1">
                            <Lock size={12} /> Unalterable Audit Trail
                        </span>
                    </div>
                    <h1 className="text-xl font-black" style={{ color: 'var(--adm-text)' }}>Nhật Ký Thao Tác Hệ Thống Audit Log</h1>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>Ghi lại toàn bộ thao tác Who, What, When, IP, Device, Old/New Values không thể chỉnh sửa</p>
                </div>

                <button
                    onClick={fetchAuditLogs}
                    className="px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all"
                    style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Làm Mới
                </button>
            </div>

            {/* Filter */}
            <div className="p-4 rounded-2xl border flex items-center gap-3"
                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <Search size={16} style={{ color: 'var(--adm-text-muted)' }} />
                <input
                    type="text"
                    placeholder="Tìm kiếm theo Người thực hiện, Thao tác..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-transparent text-xs focus:outline-none"
                    style={{ color: 'var(--adm-text)' }}
                />
            </div>

            {/* Logs Table */}
            <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="text-[10px] font-bold uppercase tracking-wider border-b"
                            style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' }}>
                            <tr>
                                <th className="p-4">Thời Gian</th>
                                <th className="p-4">Người Thực Hiện</th>
                                <th className="p-4">Thao Tác</th>
                                <th className="p-4">Địa Chỉ IP</th>
                                <th className="p-4">Giá Trị Cũ → Mới</th>
                            </tr>
                        </thead>
                        <tbody className="font-mono text-[11px]">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center" style={{ color: 'var(--adm-text-muted)' }}>
                                        <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-amber-500" />
                                        Đang tải Audit Logs...
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center font-sans" style={{ color: 'var(--adm-text-muted)' }}>
                                        Chưa có bản ghi Audit Log nào
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map(log => (
                                    <tr key={log._id} className="border-b last:border-0 transition-colors hover:bg-black/[0.02]"
                                        style={{ borderColor: 'var(--adm-border)' }}>
                                        <td className="p-4 whitespace-nowrap" style={{ color: 'var(--adm-text-muted)' }}>
                                            {new Date(log.createdAt).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="p-4 font-bold text-amber-600">{log.userName || 'Admin'}</td>
                                        <td className="p-4 font-semibold" style={{ color: 'var(--adm-text)' }}>{log.action}</td>
                                        <td className="p-4" style={{ color: 'var(--adm-text-muted)' }}>{log.ipAddress || '127.0.0.1'}</td>
                                        <td className="p-4 max-w-xs truncate" style={{ color: 'var(--adm-text)' }}>
                                            {JSON.stringify(log.oldValue || {})} → {JSON.stringify(log.newValue || {})}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
