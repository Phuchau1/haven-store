'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeftRight, CheckCircle2, XCircle, Clock, Search, 
    Filter, RefreshCw, QrCode, AlertCircle, Building2, User,
    Phone, Mail, Calendar, CreditCard, ChevronRight, ExternalLink,
    DollarSign, Check, X, ShieldAlert, ArrowUpRight, Eye, EyeOff, ShieldCheck, Copy
} from 'lucide-react';
import Image from 'next/image';
import { formatPrice, maskPhone, maskEmail, maskBankAccount } from '@/lib/format';
import { useAuth } from '@/app/component/AuthContext';

interface Withdrawal {
    _id?: string;
    id: string;
    userId: string;
    userEmail: string;
    userName: string;
    userPhone: string;
    amount: number;
    fee: number;
    netAmount: number;
    bankInfo: {
        bankCode: string;
        bankName: string;
        accountNumber: string;
        accountHolder: string;
    };
    status: 'pending' | 'completed' | 'rejected' | 'approved';
    note?: string;
    adminNote?: string;
    processedBy?: string;
    processedAt?: string;
    createdAt: string;
}

export default function AdminWithdrawalsPage() {
    const { token } = useAuth();
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [summary, setSummary] = useState({
        pending: { count: 0, amount: 0 },
        completed: { count: 0, amount: 0 },
        rejected: { count: 0, amount: 0 }
    });

    // Privacy Masking State (Mặc định BẬT bảo mật che thông tin)
    const [privacyMode, setPrivacyMode] = useState(true);
    const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

    const toggleReveal = (id: string) => {
        setRevealedIds(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Modals
    const [selectedQR, setSelectedQR] = useState<Withdrawal | null>(null);
    const [rejectTarget, setRejectTarget] = useState<Withdrawal | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 4000);
    };

    const fetchWithdrawals = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (searchQuery.trim()) params.append('search', searchQuery.trim());

            const res = await fetch(`/api/admin/withdrawals?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token || ''}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();
            if (data.success) {
                setWithdrawals(data.withdrawals || []);
                if (data.summary) {
                    setSummary(data.summary);
                }
            } else {
                showToast(data.message || 'Lỗi tải danh sách', 'error');
            }
        } catch (err: any) {
            console.error('Fetch withdrawals error:', err);
            showToast('Không thể kết nối máy chủ', 'error');
        } finally {
            setLoading(false);
        }
    }, [token, statusFilter, searchQuery]);

    useEffect(() => {
        fetchWithdrawals();
    }, [fetchWithdrawals]);

    // Duyệt yêu cầu rút tiền
    const handleApprove = async (withdrawal: Withdrawal) => {
        if (!confirm(`Xác nhận bạn ĐÃ CHUYỂN KHOẢN thành công ${formatPrice(withdrawal.amount)} cho ${withdrawal.bankInfo.accountHolder}?`)) {
            return;
        }

        try {
            setActionLoading(true);
            const res = await fetch(`/api/admin/withdrawals/${withdrawal.id}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token || ''}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    adminNote: 'Admin đã chuyển tiền thành công qua ngân hàng'
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast(data.message || 'Đã duyệt yêu cầu thành công!');
                fetchWithdrawals();
                if (selectedQR?.id === withdrawal.id) {
                    setSelectedQR(null);
                }
            } else {
                showToast(data.message || 'Lỗi khi duyệt', 'error');
            }
        } catch (err: any) {
            showToast(err.message || 'Lỗi hệ thống', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Từ chối và hoàn tiền lại ví
    const handleRejectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectTarget) return;
        if (!rejectReason.trim()) {
            alert('Vui lòng nhập lý do từ chối');
            return;
        }

        try {
            setActionLoading(true);
            const res = await fetch(`/api/admin/withdrawals/${rejectTarget.id}/reject`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token || ''}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    adminNote: rejectReason.trim()
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast(data.message || 'Đã từ chối và hoàn trả tiền vào ví user!');
                setRejectTarget(null);
                setRejectReason('');
                fetchWithdrawals();
            } else {
                showToast(data.message || 'Lỗi khi từ chối', 'error');
            }
        } catch (err: any) {
            showToast(err.message || 'Lỗi hệ thống', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Toast Notification */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-sm font-bold ${
                            toastMessage.type === 'success' 
                                ? 'bg-emerald-900 text-white border-emerald-700' 
                                : 'bg-rose-900 text-white border-rose-700'
                        }`}
                    >
                        {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        <span>{toastMessage.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                            <ArrowLeftRight size={24} />
                        </div>
                        Quản lý Duyệt Rút Tiền Ví
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                        Xem danh sách yêu cầu rút tiền từ Ví HAVEN về tài khoản ngân hàng của khách hàng & quét mã VietQR chuyển khoản 1 chạm.
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    {/* Nút bật/tắt bảo mật thông tin khách hàng */}
                    <button
                        onClick={() => setPrivacyMode(!privacyMode)}
                        className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer border ${
                            privacyMode
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                        }`}
                        title={privacyMode ? 'Đang ẩn thông tin nhạy cảm (STK/Email/SĐT)' : 'Đang hiện đầy đủ thông tin'}
                    >
                        {privacyMode ? <EyeOff size={14} className="text-emerald-600" /> : <Eye size={14} className="text-amber-600" />}
                        <span>{privacyMode ? 'Bảo mật dữ liệu: BẬT' : 'Bảo mật dữ liệu: TẮT'}</span>
                    </button>

                    <button
                        onClick={fetchWithdrawals}
                        disabled={loading}
                        className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-5 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Chờ duyệt chi trả</span>
                            <h3 className="text-2xl sm:text-3xl font-black font-mono text-amber-900 mt-1">
                                {summary.pending.count} lệnh
                            </h3>
                            <p className="text-xs font-bold text-amber-700 mt-1">
                                Tổng: {formatPrice(summary.pending.amount)}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-700">
                            <Clock size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-5 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Đã chuyển thành công</span>
                            <h3 className="text-2xl sm:text-3xl font-black font-mono text-emerald-900 mt-1">
                                {summary.completed.count} lệnh
                            </h3>
                            <p className="text-xs font-bold text-emerald-700 mt-1">
                                Tổng: {formatPrice(summary.completed.amount)}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-700">
                            <CheckCircle2 size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-5 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Đã từ chối & hoàn ví</span>
                            <h3 className="text-2xl sm:text-3xl font-black font-mono text-rose-900 mt-1">
                                {summary.rejected.count} lệnh
                            </h3>
                            <p className="text-xs font-bold text-rose-700 mt-1">
                                Tổng: {formatPrice(summary.rejected.amount)}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-700">
                            <XCircle size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
                    {[
                        { key: 'all', label: 'Tất cả' },
                        { key: 'pending', label: `Chờ duyệt (${summary.pending.count})` },
                        { key: 'completed', label: 'Đã chuyển tiền' },
                        { key: 'rejected', label: 'Bị từ chối' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setStatusFilter(tab.key)}
                            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                                statusFilter === tab.key
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-80">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm mã WDR, email, STK, tên..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Withdrawals Table */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-bold uppercase tracking-wider">
                                <th className="p-4 pl-6">Mã Lệnh</th>
                                <th className="p-4">Khách Hàng</th>
                                <th className="p-4">Số Tiền Rút</th>
                                <th className="p-4">Tài Khoản Thụ Hưởng</th>
                                <th className="p-4">Thời Gian</th>
                                <th className="p-4">Trạng Thái</th>
                                <th className="p-4 pr-6 text-right">Tác Vụ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400">
                                        <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-slate-300" />
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : withdrawals.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-400">
                                        <ArrowLeftRight size={32} className="mx-auto mb-2 text-slate-300" />
                                        Không tìm thấy yêu cầu rút tiền nào
                                    </td>
                                </tr>
                            ) : (
                                withdrawals.map((w) => {
                                    const isRevealed = !privacyMode || !!revealedIds[w.id];
                                    const displayEmail = isRevealed ? w.userEmail : maskEmail(w.userEmail);
                                    const displayPhone = isRevealed ? w.userPhone : maskPhone(w.userPhone);
                                    const displayAccount = isRevealed ? w.bankInfo.accountNumber : maskBankAccount(w.bankInfo.accountNumber);

                                    return (
                                        <tr key={w.id || w._id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="p-4 pl-6">
                                                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-lg">
                                                    {w.id}
                                                </span>
                                                {w.note && (
                                                    <p className="text-[11px] text-slate-400 mt-1 italic max-w-xs truncate">
                                                        &quot;{w.note}&quot;
                                                    </p>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <p className="font-bold text-slate-900">{w.userName || 'Chưa cập nhật'}</p>
                                                <p className="text-[11px] text-slate-500 font-mono">{displayEmail}</p>
                                                {w.userPhone && <p className="text-[11px] text-slate-500 font-mono">{displayPhone}</p>}
                                            </td>
                                            <td className="p-4">
                                                <span className="font-mono font-black text-sm text-emerald-600">
                                                    {formatPrice(w.amount)}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-start gap-2.5">
                                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0 mt-0.5">
                                                        <Building2 size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 uppercase">{w.bankInfo.bankCode} - {w.bankInfo.bankName}</p>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="font-mono font-bold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-100">
                                                                {displayAccount}
                                                            </span>
                                                            <button
                                                                onClick={() => toggleReveal(w.id)}
                                                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                                                                title={isRevealed ? "Ẩn số tài khoản" : "Hiện số tài khoản"}
                                                            >
                                                                {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                                                            </button>
                                                        </div>
                                                        <p className="text-[11px] font-bold text-slate-500 uppercase mt-0.5">{w.bankInfo.accountHolder}</p>
                                                    </div>
                                                </div>
                                            </td>
                                        <td className="p-4 text-slate-500 whitespace-nowrap">
                                            <p>{new Date(w.createdAt).toLocaleDateString('vi-VN')}</p>
                                            <p className="text-[11px] text-slate-400">{new Date(w.createdAt).toLocaleTimeString('vi-VN')}</p>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            {w.status === 'pending' && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                    <Clock size={12} />
                                                    Chờ duyệt
                                                </span>
                                            )}
                                            {w.status === 'completed' && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <CheckCircle2 size={12} />
                                                    Đã chuyển tiền
                                                </span>
                                            )}
                                            {w.status === 'rejected' && (
                                                <div>
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                        <XCircle size={12} />
                                                        Đã từ chối
                                                    </span>
                                                    {w.adminNote && (
                                                        <p className="text-[10px] text-rose-600 mt-1 max-w-xs truncate" title={w.adminNote}>
                                                            {w.adminNote}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 pr-6 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Nút VietQR chuyển khoản nhanh */}
                                                <button
                                                    onClick={() => setSelectedQR(w)}
                                                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                                    title="Quét VietQR chuyển tiền nhanh"
                                                >
                                                    <QrCode size={14} />
                                                    <span>Mã VietQR</span>
                                                </button>

                                                {w.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(w)}
                                                            disabled={actionLoading}
                                                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                                                            title="Duyệt chuyển tiền thành công"
                                                        >
                                                            <Check size={14} />
                                                            <span>Duyệt</span>
                                                        </button>

                                                        <button
                                                            onClick={() => setRejectTarget(w)}
                                                            disabled={actionLoading}
                                                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                            title="Từ chối & hoàn tiền lại ví"
                                                        >
                                                            <X size={14} />
                                                            <span>Từ chối</span>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Quét mã VietQR chuyển khoản 1 chạm cho Admin */}
            <AnimatePresence>
                {selectedQR && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-slate-100"
                        >
                            <button
                                onClick={() => setSelectedQR(null)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="text-center mb-5">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                    <QrCode size={24} />
                                </div>
                                <h3 className="text-lg font-black text-slate-900">Quét VietQR Chuyển Tiền Nhanh</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Mở ứng dụng Ngân hàng trên điện thoại quét mã này để chuyển tiền tự động đúng số tiền và STK.
                                </p>
                            </div>

                            {/* VietQR Image Generator */}
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center mb-5">
                                <div className="relative w-64 h-64 mx-auto rounded-xl overflow-hidden bg-white p-2 shadow-inner">
                                    <img
                                        src={`https://img.vietqr.io/image/${selectedQR.bankInfo.bankCode}-${selectedQR.bankInfo.accountNumber}-compact2.png?amount=${selectedQR.amount}&addInfo=${encodeURIComponent(selectedQR.id)}&accountName=${encodeURIComponent(selectedQR.bankInfo.accountHolder)}`}
                                        alt="VietQR Transfer"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="mt-3 text-left text-xs space-y-1.5 text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                                    <div className="flex justify-between items-center">
                                        <span>Ngân hàng:</span>
                                        <strong className="text-slate-900 uppercase">{selectedQR.bankInfo.bankCode} ({selectedQR.bankInfo.bankName})</strong>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Số tài khoản:</span>
                                        <div className="flex items-center gap-1.5">
                                            <strong className="font-mono text-indigo-600 font-bold">{selectedQR.bankInfo.accountNumber}</strong>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(selectedQR.bankInfo.accountNumber);
                                                    showToast(`Đã sao chép STK: ${selectedQR.bankInfo.accountNumber}`);
                                                }}
                                                className="p-1 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                                                title="Sao chép số tài khoản"
                                            >
                                                <Copy size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Chủ tài khoản:</span>
                                        <strong className="text-slate-900 font-bold uppercase">{selectedQR.bankInfo.accountHolder}</strong>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Số tiền:</span>
                                        <strong className="text-emerald-600 font-bold font-mono text-sm">{formatPrice(selectedQR.amount)}</strong>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Nội dung CK:</span>
                                        <strong className="font-mono text-slate-900">{selectedQR.id}</strong>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedQR(null)}
                                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                                >
                                    Đóng
                                </button>
                                {selectedQR.status === 'pending' && (
                                    <button
                                        onClick={() => handleApprove(selectedQR)}
                                        disabled={actionLoading}
                                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                                    >
                                        <Check size={16} />
                                        Xác nhận đã chuyển
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Từ chối yêu cầu & Hoàn tiền lại ví */}
            <AnimatePresence>
                {rejectTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-slate-100"
                        >
                            <button
                                onClick={() => { setRejectTarget(null); setRejectReason(''); }}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                                    <ShieldAlert size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">Từ Chối Yêu Cầu Rút Tiền</h3>
                                    <p className="text-xs text-slate-500">Mã: {rejectTarget.id} · {formatPrice(rejectTarget.amount)}</p>
                                </div>
                            </div>

                            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs mb-4">
                                <strong>Lưu ý:</strong> Khi từ chối, hệ thống sẽ <strong>tự động hoàn trả {formatPrice(rejectTarget.amount)}</strong> vào Ví HAVEN của người dùng kèm lý do bạn nhập dưới đây.
                            </div>

                            <form onSubmit={handleRejectSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Lý do từ chối <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        rows={3}
                                        required
                                        placeholder="Ví dụ: Sai số tài khoản ngân hàng, Tên chủ thẻ không khớp với tài khoản..."
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => { setRejectTarget(null); setRejectReason(''); }}
                                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading || !rejectReason.trim()}
                                        className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                                    >
                                        <XCircle size={16} />
                                        Xác nhận từ chối
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
