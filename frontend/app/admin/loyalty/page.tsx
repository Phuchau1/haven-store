'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
    Award, Gift, Users, TrendingUp, RefreshCw, Search,
    CheckCircle2, AlertCircle, PlusCircle, ArrowUpRight, ArrowDownRight,
    Shield, Sparkles, Filter, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaderboardMember {
    rank: number;
    userId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    userAvatar?: string;
    points: number;
    totalEarned: number;
    totalSpent: number;
    level: string;
    levelBadge: string;
    levelLabel: string;
}

interface LoyaltyTransaction {
    _id: string;
    userId: string;
    type: 'earn' | 'redeem' | 'bonus' | 'expire' | 'admin_adjust';
    points: number;
    orderId?: string;
    description: string;
    balanceBefore: number;
    balanceAfter: number;
    createdAt: string;
}

interface LoyaltyStats {
    totalMembers: number;
    totalCirculated: number;
    totalEarned: number;
    totalSpent: number;
    tierCounts: {
        Bronze: number;
        Silver: number;
        Gold: number;
        Platinum: number;
    };
}

export default function AdminLoyaltyPage() {
    const [stats, setStats] = useState<LoyaltyStats | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardMember[]>([]);
    const [recentTransactions, setRecentTransactions] = useState<LoyaltyTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'leaderboard' | 'transactions' | 'tiers'>('leaderboard');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state for Adjust Points
    const [adjustModalOpen, setAdjustModalOpen] = useState(false);
    const [targetUserId, setTargetUserId] = useState('');
    const [targetUserName, setTargetUserName] = useState('');
    const [adjustPoints, setAdjustPoints] = useState<number | ''>('');
    const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');
    const [adjustReason, setAdjustReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, lbRes] = await Promise.all([
                fetch('/api/loyalty/admin/stats'),
                fetch('/api/loyalty/leaderboard')
            ]);
            const statsData = await statsRes.json();
            const lbData = await lbRes.json();

            if (statsData.success) {
                setStats(statsData.stats);
                setRecentTransactions(statsData.recentTransactions || []);
            }
            if (lbData.success) {
                setLeaderboard(lbData.leaderboard || []);
            }
        } catch (err) {
            console.error('Error loading loyalty data:', err);
            showToast('Không thể tải dữ liệu điểm thưởng', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenAdjust = (member?: LeaderboardMember) => {
        if (member) {
            setTargetUserId(member.userId);
            setTargetUserName(`${member.userName} (${member.userEmail || member.userId})`);
        } else {
            setTargetUserId('');
            setTargetUserName('');
        }
        setAdjustPoints('');
        setAdjustType('add');
        setAdjustReason('');
        setAdjustModalOpen(true);
    };

    const handleAdjustSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetUserId.trim()) {
            showToast('Vui lòng chọn hoặc nhập User ID của khách hàng', 'error');
            return;
        }
        const pts = typeof adjustPoints === 'number' ? adjustPoints : parseInt(adjustPoints, 10);
        if (!pts || isNaN(pts) || pts <= 0) {
            showToast('Vui lòng nhập số điểm hợp lệ lớn hơn 0', 'error');
            return;
        }
        if (!adjustReason.trim()) {
            showToast('Vui lòng nhập lý do điều chỉnh để lưu vào sổ cái kiểm toán', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const finalPts = adjustType === 'add' ? pts : -pts;
            const res = await fetch('/api/loyalty/admin/adjust', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: targetUserId.trim(),
                    points: finalPts,
                    reason: adjustReason.trim(),
                    adminName: 'Admin HAVEN'
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast(data.message || 'Điều chỉnh điểm thành công!', 'success');
                setAdjustModalOpen(false);
                fetchData();
            } else {
                showToast(data.message || 'Xử lý thất bại', 'error');
            }
        } catch (err) {
            console.error('Error adjusting points:', err);
            showToast('Lỗi kết nối máy chủ', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredLeaderboard = leaderboard.filter(m => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (m.userName || '').toLowerCase().includes(q) ||
            (m.userEmail || '').toLowerCase().includes(q) ||
            (m.userPhone || '').includes(q) ||
            m.userId.toLowerCase().includes(q)
        );
    });

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 text-sm font-medium transition-all ${
                    toast.type === 'success' 
                        ? 'bg-emerald-900/90 border-emerald-700 text-emerald-100' 
                        : 'bg-rose-900/90 border-rose-700 text-rose-100'
                }`}>
                    {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
                    {toast.text}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                        <Award className="w-7 h-7 text-indigo-600" />
                        Quản lý Tích Điểm & Khách Hàng Thân Thiết
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Theo dõi điểm lưu hành, phân bổ cấp bậc VIP và quản lý giao dịch điểm thưởng</p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => handleOpenAdjust()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Tặng / Điều chỉnh Điểm
                    </button>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* 4 KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Điểm đang lưu hành</span>
                        <p className="text-2xl font-black text-indigo-600 mt-1.5">{(stats?.totalCirculated || 0).toLocaleString('vi-VN')}</p>
                        <p className="text-[11px] text-slate-400 mt-1">Điểm khách hàng đang nắm giữ</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Sparkles className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Điểm đã quy đổi</span>
                        <p className="text-2xl font-black text-emerald-600 mt-1.5">{(stats?.totalSpent || 0).toLocaleString('vi-VN')}</p>
                        <p className="text-[11px] text-slate-400 mt-1">Tương đương {((stats?.totalSpent || 0) * 100).toLocaleString('vi-VN')}đ voucher</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Gift className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng thành viên</span>
                        <p className="text-2xl font-black text-slate-900 mt-1.5">{stats?.totalMembers || 0}</p>
                        <p className="text-[11px] text-slate-400 mt-1">Khách hàng có tài khoản điểm</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
                        <Users className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phân bổ Cấp bậc</span>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100/70 text-amber-800">🥉 {stats?.tierCounts?.Bronze || 0}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">🥈 {stats?.tierCounts?.Silver || 0}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-yellow-100 text-yellow-800">🥇 {stats?.tierCounts?.Gold || 0}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800">💎 {stats?.tierCounts?.Platinum || 0}</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Navigation Tabs & Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('leaderboard')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                            activeTab === 'leaderboard'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <Award size={14} />
                        Top Khách VIP ({leaderboard.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                            activeTab === 'transactions'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <Filter size={14} />
                        Sổ Cái Biến Động Điểm
                    </button>
                    <button
                        onClick={() => setActiveTab('tiers')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                            activeTab === 'tiers'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <Shield size={14} />
                        Chính Sách & Tỷ Lệ Đổi
                    </button>
                </div>

                {activeTab === 'leaderboard' && (
                    <div className="relative w-full md:w-72">
                        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên, email, SĐT..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>
                )}
            </div>

            {/* TAB CONTENT: LEADERBOARD */}
            {activeTab === 'leaderboard' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                                    <th className="p-4 text-center w-16">Hạng</th>
                                    <th className="p-4">Khách hàng</th>
                                    <th className="p-4">Cấp bậc</th>
                                    <th className="p-4 text-right">Điểm khả dụng</th>
                                    <th className="p-4 text-right">Tổng tích lũy</th>
                                    <th className="p-4 text-right">Đã đổi</th>
                                    <th className="p-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-400">
                                            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                                            Đang tải dữ liệu...
                                        </td>
                                    </tr>
                                ) : filteredLeaderboard.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-400">
                                            Chưa có dữ liệu khách hàng thân thiết
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLeaderboard.map((member) => (
                                        <tr key={member.userId} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="p-4 text-center font-bold">
                                                {member.rank === 1 && <span className="text-xl">🥇</span>}
                                                {member.rank === 2 && <span className="text-xl">🥈</span>}
                                                {member.rank === 3 && <span className="text-xl">🥉</span>}
                                                {member.rank > 3 && <span className="text-slate-500">#{member.rank}</span>}
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-slate-900">{member.userName}</div>
                                                <div className="text-[11px] text-slate-400">{member.userEmail || member.userPhone || member.userId}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                                    member.level === 'Platinum' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                                    member.level === 'Gold' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                                    member.level === 'Silver' ? 'bg-slate-200 text-slate-800 border border-slate-300' :
                                                    'bg-amber-50 text-amber-900 border border-amber-200/60'
                                                }`}>
                                                    {member.levelBadge} {member.levelLabel || member.level}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-black text-indigo-600 text-sm">
                                                {(member.points || 0).toLocaleString('vi-VN')}
                                            </td>
                                            <td className="p-4 text-right font-bold text-slate-800">
                                                {(member.totalEarned || 0).toLocaleString('vi-VN')}
                                            </td>
                                            <td className="p-4 text-right text-slate-500">
                                                {(member.totalSpent || 0).toLocaleString('vi-VN')}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleOpenAdjust(member)}
                                                    className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors cursor-pointer"
                                                >
                                                    Tặng / Sửa điểm
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: TRANSACTION LEDGER */}
            {activeTab === 'transactions' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900">Sổ cái 15 giao dịch biến động gần nhất toàn hệ thống</h3>
                        <span className="text-xs text-slate-400">Ghi nhận số dư trước và sau giao dịch</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                                    <th className="p-4">Thời gian</th>
                                    <th className="p-4">User ID</th>
                                    <th className="p-4">Loại giao dịch</th>
                                    <th className="p-4">Mô tả chi tiết</th>
                                    <th className="p-4 text-right">Biến động</th>
                                    <th className="p-4 text-right">Số dư trước/sau</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recentTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-400">
                                            Chưa có lịch sử giao dịch nào
                                        </td>
                                    </tr>
                                ) : (
                                    recentTransactions.map((tx) => {
                                        const isAdd = tx.points > 0;
                                        return (
                                            <tr key={tx._id} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="p-4 text-slate-500 whitespace-nowrap">
                                                    {new Date(tx.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                </td>
                                                <td className="p-4 font-mono text-[11px] text-slate-600">
                                                    {tx.userId}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                                        tx.type === 'earn' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                        tx.type === 'redeem' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                        tx.type === 'bonus' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                                        tx.type === 'admin_adjust' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                                                        'bg-rose-50 text-rose-700 border border-rose-200'
                                                    }`}>
                                                        {tx.type === 'earn' ? 'Mua hàng' :
                                                         tx.type === 'redeem' ? 'Đổi Voucher' :
                                                         tx.type === 'bonus' ? 'Thưởng sự kiện' :
                                                         tx.type === 'admin_adjust' ? 'Admin điều chỉnh' : 'Thu hồi'}
                                                    </span>
                                                </td>
                                                <td className="p-4 max-w-sm text-slate-800 font-medium">
                                                    {tx.description}
                                                </td>
                                                <td className={`p-4 text-right font-bold text-sm ${isAdd ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    <div className="flex items-center justify-end gap-0.5">
                                                        {isAdd ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                                        <span>{isAdd ? `+${tx.points}` : tx.points}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right text-slate-500 font-mono text-[11px]">
                                                    {tx.balanceBefore} $\rightarrow$ <strong className="text-slate-800">{tx.balanceAfter}</strong>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: TIERS POLICY */}
            {activeTab === 'tiers' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { name: '🥉 Hạng Đồng (Bronze)', threshold: '0 – 999 điểm', benefits: ['Tích 1 điểm / 1.000đ', 'Đổi điểm lấy Voucher 10k-100k', 'Hỗ trợ CSKH 24/7'], color: 'border-amber-200 bg-amber-50/40' },
                        { name: '🥈 Hạng Bạc (Silver)', threshold: '1.000 – 4.999 điểm', benefits: ['Mọi quyền lợi Hạng Đồng', 'Giảm thêm 3% cho mọi đơn', 'Voucher sinh nhật 50.000đ'], color: 'border-slate-300 bg-slate-50' },
                        { name: '🥇 Hạng Vàng (Gold)', threshold: '5.000 – 19.999 điểm', benefits: ['Mọi quyền lợi Hạng Bạc', 'Giảm thêm 5% cho mọi đơn', 'Miễn phí Freeship trọn đời', 'Voucher sinh nhật 100.000đ'], color: 'border-yellow-300 bg-yellow-50/50' },
                        { name: '💎 Hạng Kim Cương (Platinum)', threshold: 'Từ 20.000 điểm trở lên', benefits: ['Mọi quyền lợi Hạng Vàng', 'Giảm thêm 10% cho mọi đơn', 'Quà tri ân VIP cuối năm', 'Chuyên viên CSKH 1-1 riêng'], color: 'border-purple-300 bg-purple-50/50' },
                    ].map((tier, idx) => (
                        <div key={idx} className={`p-5 rounded-2xl border ${tier.color} space-y-3 shadow-xs`}>
                            <h3 className="font-bold text-slate-900 text-sm">{tier.name}</h3>
                            <p className="text-xs text-indigo-700 font-semibold">{tier.threshold}</p>
                            <ul className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                                {tier.benefits.map((b, bIdx) => (
                                    <li key={bIdx} className="flex items-start gap-1.5">
                                        <span className="text-emerald-500 font-bold">✓</span>
                                        <span>{b}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL ĐIỀU CHỈNH ĐIỂM */}
            <AnimatePresence>
                {adjustModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 border border-slate-100"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <Gift className="w-5 h-5 text-indigo-600" />
                                    Tặng / Điều chỉnh Điểm Thưởng
                                </h3>
                                <button
                                    onClick={() => setAdjustModalOpen(false)}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">User ID / Khách hàng <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        value={targetUserId}
                                        onChange={e => setTargetUserId(e.target.value)}
                                        placeholder="Nhập ID khách hàng hoặc email..."
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        required
                                    />
                                    {targetUserName && (
                                        <p className="text-[11px] text-indigo-600 font-semibold mt-1">Đang chọn: {targetUserName}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Loại điều chỉnh</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setAdjustType('add')}
                                            className={`p-2.5 rounded-xl font-bold transition-all border cursor-pointer ${
                                                adjustType === 'add'
                                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            ➕ Tặng thêm điểm
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAdjustType('deduct')}
                                            className={`p-2.5 rounded-xl font-bold transition-all border cursor-pointer ${
                                                adjustType === 'deduct'
                                                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            ➖ Khấu trừ điểm
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Số điểm <span className="text-rose-500">*</span></label>
                                    <input
                                        type="number"
                                        value={adjustPoints}
                                        onChange={e => setAdjustPoints(e.target.value ? Number(e.target.value) : '')}
                                        placeholder="Ví dụ: 100, 200, 500..."
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        min="1"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Lý do điều chỉnh (ghi sổ cái) <span className="text-rose-500">*</span></label>
                                    <textarea
                                        rows={3}
                                        value={adjustReason}
                                        onChange={e => setAdjustReason(e.target.value)}
                                        placeholder="Ví dụ: Thưởng sinh nhật khách hàng VIP, bồi hoàn sự cố đơn hàng..."
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                                        required
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setAdjustModalOpen(false)}
                                        className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                                    >
                                        {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        Xác nhận
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
