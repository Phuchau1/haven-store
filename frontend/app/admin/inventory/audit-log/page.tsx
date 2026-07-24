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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
                <div>
                    <div className="flex items-center gap-2">
                        <Link href="/admin/inventory/wms-dashboard" className="text-slate-400 hover:text-white text-xs transition-colors">
                            ← Về WMS Dashboard
                        </Link>
                        <span className="text-slate-700">|</span>
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wider flex items-center gap-1">
                            <Lock size={12} /> Unalterable Audit Trail
                        </span>
                    </div>
                    <h1 className="text-2xl font-black text-white mt-1">Nhật Ký Thao Tác Hệ Thống Audit Log</h1>
                    <p className="text-slate-400 text-xs">Ghi lại toàn bộ thao tác Who, What, When, IP, Device, Old/New Values không thể chỉnh sửa</p>
                </div>

                <button
                    onClick={fetchAuditLogs}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Làm Mới
                </button>
            </div>

            {/* Filter */}
            <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
                <Search size={16} className="text-slate-500" />
                <input
                    type="text"
                    placeholder="Tìm kiếm theo Người thực hiện, Thao tác..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-transparent text-white placeholder-slate-500 text-xs focus:outline-none"
                />
            </div>

            {/* Logs Table */}
            <div className="bg-slate-900/70 rounded-3xl border border-slate-800 backdrop-blur-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                            <tr>
                                <th className="p-4">Thời Gian</th>
                                <th className="p-4">Người Thực Hiện</th>
                                <th className="p-4">Thao Tác</th>
                                <th className="p-4">Địa Chỉ IP</th>
                                <th className="p-4">Giá Trị Cũ → Mới</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-amber-400" />
                                        Đang tải Audit Logs...
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                                        Chưa có bản ghi Audit Log nào
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map(log => (
                                    <tr key={log._id} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="p-4 text-slate-400 whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="p-4 font-bold text-amber-400">{log.userName || 'Admin'}</td>
                                        <td className="p-4 font-semibold text-white">{log.action}</td>
                                        <td className="p-4 text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                                        <td className="p-4 text-slate-300 max-w-xs truncate">
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
