'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Save, Gift, Loader2, Plus, Trash2, AlertCircle, CheckCircle2,
    History, RefreshCw, X, ShieldAlert, Sparkles, Layers, Check, Calculator, AlertTriangle,
    User, Mail, Phone, Ticket, ChevronLeft, ChevronRight, RotateCcw, Settings
} from 'lucide-react';
import { useAuth } from '@/app/component/AuthContext';
import { toast } from 'react-hot-toast';

interface Prize {
    _id?: string;
    id?: string;
    reward: string;
    type: 'none' | 'fixed' | 'percent' | 'shipping';
    coupon_code: string;
    discount_value: number;
    probability: number;
    valid_hours: number;
    active: boolean;
    color?: string;
}

interface Config {
    isActive: boolean;
    startDate?: string | null;
    endDate?: string | null;
    resetInterval?: 'daily' | 'weekly' | 'monthly';
    spinsPerPeriod?: number;
    maxSpinsPerAccount?: number;
    maxSpinsPerIP?: number;
    maxSpinsPerDevice?: number;
    onlyNewMembers?: boolean;
    requireLogin?: boolean;
    showProbability?: boolean;
    prizes: Prize[];
}

interface SpinHistoryItem {
    _id: string;
    user_id: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    spin_date: string;
    reward_text: string;
    voucherCode: string | null;
    voucherType: string | null;
    voucherValue: number;
    voucherExpiry: string | null;
    voucherStatus: 'none' | 'unused' | 'used' | 'expired';
    remainingSpins: number;
    ip?: string;
    device?: string;
}

interface WheelStats {
    totalSpins: number;
    totalVouchers: number;
    usedVouchers: number;
    expiredVouchers: number;
    unusedVouchers: number;
}

interface RewardBreakdown {
    reward: string;
    count: number;
}

const TYPE_LABELS: Record<string, string> = {
    none: 'Không trúng',
    fixed: 'Giảm tiền mặt (VNĐ)',
    percent: 'Giảm phần trăm (%)',
    shipping: 'Miễn phí vận chuyển',
};

const DEFAULT_COLORS = [
    '#FFB300', '#FF8F00', '#E65100', '#BF360C',
    '#059669', '#2563EB', '#7C3AED', '#DB2777'
];

export default function LuckyWheelAdminPage() {
    const { token, user } = useAuth();
    const [activeTab, setActiveTab] = useState<'config' | 'history' | 'stats'>('config');

    // Config state
    const [config, setConfig] = useState<Config | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Delete Modal state
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

    // History state
    const [history, setHistory] = useState<SpinHistoryItem[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotalPages, setHistoryTotalPages] = useState(1);
    const [historySearch, setHistorySearch] = useState('');

    // Stats state
    const [stats, setStats] = useState<WheelStats | null>(null);
    const [rewardBreakdown, setRewardBreakdown] = useState<RewardBreakdown[]>([]);
    const [loadingStats, setLoadingStats] = useState(false);

    // Fetch config
    const fetchConfig = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/lucky-wheel/config');
            const data = await res.json();

            const sanitizeAdminPrize = (p: any, i: number): Prize => {
                let type: any = p.type || 'fixed';
                if (type === 'discount' || type === 'voucher') type = 'fixed';
                if (type === 'freeship') type = 'shipping';
                if (type === 'retry') type = 'none';

                let reward = p.reward || p.label || '';
                if (!reward || reward.trim() === '') {
                    if (type === 'none') reward = 'Chúc bạn may mắn lần sau';
                    else if (type === 'shipping') reward = 'Freeship';
                    else if (type === 'percent') reward = `Giảm ${p.discount_value || 10}%`;
                    else reward = `Giảm ${(p.discount_value || 20000) / 1000}k`;
                }

                return {
                    _id: p._id || p.id || `prize_${i + 1}`,
                    id: p.id || p._id || `prize_${i + 1}`,
                    reward,
                    type,
                    coupon_code: p.coupon_code || '',
                    discount_value: Number(p.discount_value) || 0,
                    probability: Number(p.probability) || 0,
                    valid_hours: Number(p.valid_hours) || 24,
                    active: p.active !== false,
                    color: p.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
                };
            };

            if (data.success && data.config) {
                const prizes = (data.config.prizes || data.prizes || []).map((r: any, i: number) => sanitizeAdminPrize(r, i));
                setConfig({
                    ...data.config,
                    prizes,
                });
            } else if (data.success && data.prizes) {
                const prizes = data.prizes.map((r: any, i: number) => sanitizeAdminPrize(r, i));
                setConfig({
                    isActive: true,
                    startDate: null,
                    endDate: null,
                    resetInterval: 'daily',
                    spinsPerPeriod: 1,
                    maxSpinsPerAccount: 30,
                    maxSpinsPerIP: 3,
                    maxSpinsPerDevice: 3,
                    onlyNewMembers: false,
                    requireLogin: true,
                    showProbability: true,
                    prizes,
                });
            }
        } catch {
            toast.error('Không thể tải cấu hình vòng quay!');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch history
    const fetchHistory = useCallback(async (page = 1, search = '') => {
        setLoadingHistory(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '20' });
            if (search) params.set('search', search);
            const res = await fetch(`/api/lucky-wheel/history?${params}`, {
                headers: { 'Authorization': `Bearer ${token || user?.id}` }
            });
            const data = await res.json();
            if (data.success) {
                setHistory(data.history || []);
                setHistoryTotalPages(data.pagination?.totalPages || 1);
            }
        } catch {
            toast.error('Không thể tải lịch sử lượt quay!');
        } finally {
            setLoadingHistory(false);
        }
    }, [token]);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        setLoadingStats(true);
        try {
            const res = await fetch('/api/lucky-wheel/stats', {
                headers: { 'Authorization': `Bearer ${token || user?.id}` }
            });
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
                setRewardBreakdown(data.rewardBreakdown || []);
            }
        } catch {
            toast.error('Không thể tải thống kê!');
        } finally {
            setLoadingStats(false);
        }
    }, [token]);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory(historyPage, historySearch);
        }
        if (activeTab === 'stats') {
            fetchStats();
        }
    }, [activeTab, historyPage, fetchHistory, fetchStats]);

    // Save Config to Backend
    const handleSave = async () => {
        if (!config) return;

        let finalConfig = { ...config };
        const totalProb = finalConfig.prizes.reduce((sum, p) => sum + Number(p.probability || 0), 0);

        // Nếu tổng % chưa bằng 100 → Tự động cân bằng giúp admin không bị kẹt
        if (Math.abs(totalProb - 100) >= 0.1 && finalConfig.prizes.length > 0) {
            const count = finalConfig.prizes.length;
            const equalShare = Number((100 / count).toFixed(1));
            let remainder = Number((100 - (equalShare * count)).toFixed(1));

            const balanced = finalConfig.prizes.map((p, i) => ({
                ...p,
                probability: i === 0 ? Number((equalShare + remainder).toFixed(1)) : equalShare
            }));

            finalConfig.prizes = balanced;
            setConfig(finalConfig);
            toast.success(`✨ Đã tự động điều chỉnh tổng xác suất các ô về 100%!`);
        }

        setSaving(true);
        try {
            const res = await fetch('/api/lucky-wheel/config', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token || user?.id}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(finalConfig)
            });
            const data = await res.json();
            if (data.success) {
                toast.success('🎉 Đã lưu toàn bộ Cấu hình Vòng quay thành công!');
                fetchConfig();
            } else {
                throw new Error(data.message);
            }
        } catch (err: any) {
            toast.error(err.message || 'Lỗi kết nối khi lưu cấu hình');
        } finally {
            setSaving(false);
        }
    };

    // Update individual prize field
    const updatePrize = (index: number, field: keyof Prize, value: any) => {
        if (!config) return;
        const newPrizes = [...config.prizes];
        newPrizes[index] = { ...newPrizes[index], [field]: value };
        setConfig({ ...config, prizes: newPrizes });
    };

    // Add prize
    const addPrize = () => {
        if (!config) return;
        setConfig({
            ...config,
            prizes: [...config.prizes, {
                reward: 'Phần thưởng mới',
                type: 'fixed',
                coupon_code: 'SPIN' + Math.floor(10 + Math.random() * 90),
                discount_value: 20000,
                probability: 5,
                valid_hours: 24,
                active: true,
                color: DEFAULT_COLORS[config.prizes.length % DEFAULT_COLORS.length],
            }]
        });
        toast.success('Đã thêm ô phần thưởng mới. Hãy điều chỉnh % xác suất!');
    };

    // Confirm & delete prize
    const confirmDeletePrize = () => {
        if (deleteIndex === null || !config) return;
        const deletedPrize = config.prizes[deleteIndex];
        const newPrizes = config.prizes.filter((_, i) => i !== deleteIndex);
        setConfig({ ...config, prizes: newPrizes });

        // If prize has DB ID, call delete API immediately
        const prizeId = deletedPrize._id || deletedPrize.id;
        if (prizeId && prizeId.length === 24) {
            fetch(`/api/lucky-wheel/prize/${prizeId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token || user?.id}` }
            }).then(r => r.json()).then(data => {
                if (data.success) {
                    toast.success(`Đã xóa ô "${deletedPrize.reward}" khỏi Database!`);
                }
            }).catch(() => {});
        } else {
            toast.success(`Đã xóa ô "${deletedPrize.reward}"! Nhấn Lưu để cập nhật.`);
        }

        setDeleteIndex(null);
    };

    // Auto balance probabilities to equal 100%
    const autoBalanceProbabilities = () => {
        if (!config || config.prizes.length === 0) return;
        const count = config.prizes.length;
        const equalShare = Number((100 / count).toFixed(1));
        let remainder = Number((100 - (equalShare * count)).toFixed(1));

        const balanced = config.prizes.map((p, i) => ({
            ...p,
            probability: i === 0 ? Number((equalShare + remainder).toFixed(1)) : equalShare
        }));

        setConfig({ ...config, prizes: balanced });
        toast.success(`✨ Đã tự động cân bằng xác suất (${count} ô x ~${equalShare}%)!`);
    };

    const totalProbability = config?.prizes.reduce((sum, p) => sum + Number(p.probability || 0), 0) || 0;
    const probOk = Math.abs(totalProbability - 100) < 0.1;

    const inputStyle = { backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border shadow-sm"
                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider flex items-center gap-1">
                            <Gift size={12} /> Gamification Marketing
                        </span>
                        <span className="text-xs" style={{ color: 'var(--adm-text-subtle)' }}>• Tự động cấp Voucher vào Ví</span>
                    </div>
                    <h1 className="text-xl font-black tracking-tight mt-1 flex items-center gap-2" style={{ color: 'var(--adm-text)' }}>
                        Quản Lý Vòng Quay May Mắn
                    </h1>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>Cấu hình phần thưởng, xác suất %, mã giảm giá và theo dõi nhật ký quay</p>
                </div>

                <div className="flex items-center gap-2.5">
                    {activeTab === 'config' && (
                        <>
                            <button
                                onClick={autoBalanceProbabilities}
                                className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all"
                                style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                                title="Tự động chia đều 100% xác suất cho các ô"
                            >
                                <Calculator size={14} className="text-amber-600" /> Cân bằng %
                            </button>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer transition-all"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Lưu Cấu Hình
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: 'var(--adm-border)' }}>
                <button
                    onClick={() => setActiveTab('config')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                        activeTab === 'config'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'border'
                    }`}
                    style={activeTab !== 'config' ? { backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' } : {}}
                >
                    <Layers size={14} /> Cấu Hình Ô Phần Thưởng ({config?.prizes.length || 0})
                </button>

                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                        activeTab === 'history'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'border'
                    }`}
                    style={activeTab !== 'history' ? { backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' } : {}}
                >
                    <History size={14} /> Nhật Ký Lượt Quay
                </button>

                <button
                    onClick={() => setActiveTab('stats')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                        activeTab === 'stats'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'border'
                    }`}
                    style={activeTab !== 'stats' ? { backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' } : {}}
                >
                    <Sparkles size={14} /> Thống Kê
                </button>
            </div>

            {/* TAB 1: CONFIG */}
            {activeTab === 'config' && (
                <div className="space-y-6">
                    {/* ── CẤU HÌNH CHUNG VÒNG QUAY ── */}
                    <div className="p-6 rounded-2xl border space-y-6 shadow-sm" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--adm-border)' }}>
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--adm-text)' }}>
                                    <Settings size={16} className="text-blue-600" /> Cấu Hình Chung Vòng Quay May Mắn
                                </h2>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                                    Thiết lập trạng thái hoạt động, thời gian diễn ra sự kiện, giới hạn chống spam IP/thiết bị, và hiển thị xác suất
                                </p>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer transition-all"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Lưu Cấu Hình Chung
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            {/* 1. Bật/Tắt vòng quay */}
                            <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold" style={{ color: 'var(--adm-text)' }}>Bật/Tắt Vòng Quay</label>
                                    <input
                                        type="checkbox"
                                        checked={config?.isActive ?? true}
                                        onChange={e => setConfig(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                                        className="w-4 h-4 rounded cursor-pointer accent-blue-600"
                                    />
                                </div>
                                <p className="text-[11px]" style={{ color: 'var(--adm-text-muted)' }}>
                                    {config?.isActive ? '🟢 Đang hoạt động trên Website' : '🔴 Đang tạm ngưng (Bảo trì)'}
                                </p>
                            </div>

                            {/* 2. Ngày bắt đầu */}
                            <div className="p-4 rounded-xl border space-y-1.5" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                                <label className="text-xs font-bold block" style={{ color: 'var(--adm-text)' }}>Ngày Bắt Đầu Sự Kiện</label>
                                <input
                                    type="datetime-local"
                                    value={config?.startDate ? new Date(config.startDate).toISOString().slice(0, 16) : ''}
                                    onChange={e => setConfig(prev => prev ? { ...prev, startDate: e.target.value ? new Date(e.target.value).toISOString() : null } : null)}
                                    className="w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none"
                                    style={inputStyle}
                                />
                                <p className="text-[10px]" style={{ color: 'var(--adm-text-muted)' }}>Để trống nếu không giới hạn bắt đầu</p>
                            </div>

                            {/* 3. Ngày kết thúc */}
                            <div className="p-4 rounded-xl border space-y-1.5" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                                <label className="text-xs font-bold block" style={{ color: 'var(--adm-text)' }}>Ngày Kết Thúc Sự Kiện</label>
                                <input
                                    type="datetime-local"
                                    value={config?.endDate ? new Date(config.endDate).toISOString().slice(0, 16) : ''}
                                    onChange={e => setConfig(prev => prev ? { ...prev, endDate: e.target.value ? new Date(e.target.value).toISOString() : null } : null)}
                                    className="w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none"
                                    style={inputStyle}
                                />
                                <p className="text-[10px]" style={{ color: 'var(--adm-text-muted)' }}>Để trống nếu chạy vô thời hạn</p>
                            </div>

                            {/* 4. Thời gian reset lượt quay */}
                            <div className="p-4 rounded-xl border space-y-1.5" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                                <label className="text-xs font-bold block" style={{ color: 'var(--adm-text)' }}>Chu Kỳ Reset Lượt Quay</label>
                                <select
                                    value={config?.resetInterval || 'daily'}
                                    onChange={e => setConfig(prev => prev ? { ...prev, resetInterval: e.target.value as any } : null)}
                                    className="w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none"
                                    style={inputStyle}
                                >
                                    <option value="daily">Theo ngày (Hàng ngày 00:00)</option>
                                    <option value="weekly">Theo tuần (Thứ Hai hàng tuần)</option>
                                    <option value="monthly">Theo tháng (Ngày 1 hàng tháng)</option>
                                </select>
                                <p className="text-[10px]" style={{ color: 'var(--adm-text-muted)' }}>Thời điểm làm mới số lượt quay</p>
                            </div>

                            {/* 5. Tổng lượt quay mặc định */}
                            <div className="p-4 rounded-xl border space-y-1.5" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                                <label className="text-xs font-bold block" style={{ color: 'var(--adm-text)' }}>Lượt Quay Mặc Định / Chu Kỳ</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={config?.spinsPerPeriod ?? 1}
                                    onChange={e => setConfig(prev => prev ? { ...prev, spinsPerPeriod: Math.max(1, Number(e.target.value)) } : null)}
                                    className="w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none"
                                    style={inputStyle}
                                />
                                <p className="text-[10px]" style={{ color: 'var(--adm-text-muted)' }}>Ví dụ: 1 lượt / ngày (hoặc / tuần / tháng)</p>
                            </div>

                            {/* 6. Giới hạn mỗi tài khoản */}
                            <div className="p-4 rounded-xl border space-y-1.5" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                                <label className="text-xs font-bold block" style={{ color: 'var(--adm-text)' }}>Tối Đa / Tài Khoản (Tháng)</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={config?.maxSpinsPerAccount ?? 30}
                                    onChange={e => setConfig(prev => prev ? { ...prev, maxSpinsPerAccount: Math.max(0, Number(e.target.value)) } : null)}
                                    className="w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none"
                                    style={inputStyle}
                                />
                                <p className="text-[10px]" style={{ color: 'var(--adm-text-muted)' }}>0 = Không giới hạn tối đa tháng</p>
                            </div>

                            {/* 7. Giới hạn mỗi IP */}
                            <div className="p-4 rounded-xl border space-y-1.5" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                                <label className="text-xs font-bold block" style={{ color: 'var(--adm-text)' }}>Giới Hạn Tối Đa / IP (Anti-Spam)</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={config?.maxSpinsPerIP ?? 3}
                                    onChange={e => setConfig(prev => prev ? { ...prev, maxSpinsPerIP: Math.max(0, Number(e.target.value)) } : null)}
                                    className="w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none"
                                    style={inputStyle}
                                />
                                <p className="text-[10px]" style={{ color: 'var(--adm-text-muted)' }}>0 = Không giới hạn IP</p>
                            </div>

                            {/* 8. Giới hạn mỗi thiết bị */}
                            <div className="p-4 rounded-xl border space-y-1.5" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                                <label className="text-xs font-bold block" style={{ color: 'var(--adm-text)' }}>Giới Hạn / Thiết Bị (Device ID)</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={config?.maxSpinsPerDevice ?? 3}
                                    onChange={e => setConfig(prev => prev ? { ...prev, maxSpinsPerDevice: Math.max(0, Number(e.target.value)) } : null)}
                                    className="w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none"
                                    style={inputStyle}
                                />
                                <p className="text-[10px]" style={{ color: 'var(--adm-text-muted)' }}>0 = Không giới hạn Thiết bị</p>
                            </div>

                            {/* 9. Yêu cầu đăng nhập */}
                            <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold" style={{ color: 'var(--adm-text)' }}>Yêu Cầu Đăng Nhập</label>
                                    <input
                                        type="checkbox"
                                        checked={config?.requireLogin ?? true}
                                        onChange={e => setConfig(prev => prev ? { ...prev, requireLogin: e.target.checked } : null)}
                                        className="w-4 h-4 rounded cursor-pointer accent-blue-600"
                                    />
                                </div>
                                <p className="text-[11px]" style={{ color: 'var(--adm-text-muted)' }}>
                                    {config?.requireLogin ? 'Bắt buộc đăng nhập tài khoản' : 'Cho phép cả khách vãng lai'}
                                </p>
                            </div>

                            {/* 10. Chỉ thành viên mới */}
                            <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold" style={{ color: 'var(--adm-text)' }}>Chỉ Dành Cho Thành Viên Mới</label>
                                    <input
                                        type="checkbox"
                                        checked={config?.onlyNewMembers ?? false}
                                        onChange={e => setConfig(prev => prev ? { ...prev, onlyNewMembers: e.target.checked } : null)}
                                        className="w-4 h-4 rounded cursor-pointer accent-blue-600"
                                    />
                                </div>
                                <p className="text-[11px]" style={{ color: 'var(--adm-text-muted)' }}>
                                    {config?.onlyNewMembers ? 'Chỉ áp dụng tài khoản mới tạo (<= 30 ngày)' : 'Áp dụng tất cả thành viên'}
                                </p>
                            </div>

                            {/* 11. Hiển thị xác suất */}
                            <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold" style={{ color: 'var(--adm-text)' }}>Hiển Thị Xác Suất Trúng (%)</label>
                                    <input
                                        type="checkbox"
                                        checked={config?.showProbability ?? true}
                                        onChange={e => setConfig(prev => prev ? { ...prev, showProbability: e.target.checked } : null)}
                                        className="w-4 h-4 rounded cursor-pointer accent-blue-600"
                                    />
                                </div>
                                <p className="text-[11px]" style={{ color: 'var(--adm-text-muted)' }}>
                                    {config?.showProbability ? 'Công khai tỷ lệ % trúng thưởng cho người dùng' : 'Ẩn tỷ lệ % với người dùng'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Probability Meter Card */}
                    <div className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                        style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl border ${probOk ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                                {probOk ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                            </div>
                            <div>
                                <p className="text-xs font-bold flex items-center gap-2" style={{ color: 'var(--adm-text)' }}>
                                    Tổng Xác Suất Hiện Tại:
                                    <span className={`font-mono text-sm ${probOk ? 'text-emerald-600 font-black' : 'text-rose-600 font-black'}`}>
                                        {totalProbability.toFixed(1)}%
                                    </span>
                                </p>
                                <p className="text-[11px]" style={{ color: 'var(--adm-text-muted)' }}>
                                    {probOk ? '✅ Xác suất hoàn hảo = 100%, sẵn sàng lưu cấu hình' : '⚠️ Tổng % phải đạt đúng 100% trước khi lưu (nhấn "Cân bằng %" để tự động chia)'}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={addPrize}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
                        >
                            <Plus size={14} /> Thêm Ô Phần Thưởng
                        </button>
                    </div>

                    {/* Prizes Table */}
                    <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs min-w-[950px]">
                                <thead className="text-[10px] font-bold uppercase tracking-wider border-b"
                                    style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' }}>
                                    <tr>
                                        <th className="px-4 py-3.5 w-10 text-center">Màu</th>
                                        <th className="px-4 py-3.5">Tên Hiển Thị Ô</th>
                                        <th className="px-4 py-3.5">Loại Giải Thưởng</th>
                                        <th className="px-4 py-3.5 text-center">Giá Trị</th>
                                        <th className="px-4 py-3.5">Mã Coupon Thưởng</th>
                                        <th className="px-4 py-3.5 text-center">Hạn Dùng (Giờ)</th>
                                        <th className="px-4 py-3.5 text-center">Xác Suất (%)</th>
                                        <th className="px-4 py-3.5 text-center">Kích Hoạt</th>
                                        <th className="px-4 py-3.5 text-right">Xóa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="border-b" style={{ borderColor: 'var(--adm-border)' }}>
                                                {Array.from({ length: 9 }).map((__, j) => (
                                                    <td key={j} className="px-4 py-3">
                                                        <div className="h-4 rounded animate-pulse" style={{ backgroundColor: 'var(--adm-surface-2)' }} />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : config?.prizes.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-4 py-12 text-center" style={{ color: 'var(--adm-text-muted)' }}>
                                                <Gift size={36} className="mx-auto mb-2 opacity-30" />
                                                <p>Chưa có phần thưởng nào. Nhấn "+ Thêm Ô Phần Thưởng" để bắt đầu.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        config?.prizes.map((prize, index) => (
                                            <tr key={index} className="border-b last:border-0 transition-colors hover:bg-black/[0.02]"
                                                style={{ borderColor: 'var(--adm-border)' }}>
                                                <td className="px-4 py-3 text-center">
                                                    <input
                                                        type="color"
                                                        value={prize.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                                                        onChange={e => updatePrize(index, 'color', e.target.value)}
                                                        className="w-7 h-7 rounded-lg cursor-pointer border p-0.5 bg-transparent"
                                                        title="Chọn màu sắc cho ô phần thưởng này"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="text"
                                                        value={prize.reward}
                                                        onChange={e => updatePrize(index, 'reward', e.target.value)}
                                                        className="w-full border rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
                                                        style={inputStyle}
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        value={prize.type}
                                                        onChange={e => updatePrize(index, 'type', e.target.value)}
                                                        className="w-full border rounded-xl px-3 py-1.5 text-xs focus:outline-none cursor-pointer"
                                                        style={inputStyle}
                                                    >
                                                        {Object.entries(TYPE_LABELS).map(([v, l]) => (
                                                            <option key={v} value={v}>{l}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={prize.discount_value}
                                                        onChange={e => updatePrize(index, 'discount_value', Number(e.target.value))}
                                                        disabled={prize.type === 'none' || prize.type === 'shipping'}
                                                        className="w-24 text-center border rounded-xl px-2 py-1.5 text-xs font-bold focus:outline-none disabled:opacity-30"
                                                        style={inputStyle}
                                                        placeholder="0"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="text"
                                                        value={prize.coupon_code}
                                                        onChange={e => updatePrize(index, 'coupon_code', e.target.value.toUpperCase())}
                                                        disabled={prize.type === 'none'}
                                                        className="w-32 border rounded-xl px-3 py-1.5 text-xs font-mono font-bold uppercase focus:outline-none disabled:opacity-30"
                                                        style={inputStyle}
                                                        placeholder="SPIN20"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={prize.valid_hours}
                                                        onChange={e => updatePrize(index, 'valid_hours', Number(e.target.value))}
                                                        disabled={prize.type === 'none'}
                                                        className="w-20 text-center border rounded-xl px-2 py-1.5 text-xs font-semibold focus:outline-none disabled:opacity-30"
                                                        style={inputStyle}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        step={0.5}
                                                        value={prize.probability}
                                                        onChange={e => updatePrize(index, 'probability', Number(e.target.value))}
                                                        className="w-20 text-center border rounded-xl px-2 py-1.5 font-bold font-mono text-amber-600 text-xs focus:outline-none"
                                                        style={inputStyle}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={prize.active !== false}
                                                        onChange={e => updatePrize(index, 'active', e.target.checked)}
                                                        className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => setDeleteIndex(index)}
                                                        className="p-1.5 rounded-lg border text-rose-500 hover:bg-rose-50 transition-colors"
                                                        style={{ borderColor: 'var(--adm-border)' }}
                                                        title="Xóa ô này"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: STATS */}
            {activeTab === 'stats' && (
                <div className="space-y-5">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {[
                            { label: 'Tổng lượt quay',   value: stats?.totalSpins     ?? '—', color: 'bg-blue-50 text-blue-700   border-blue-200',    icon: '🎯' },
                            { label: 'Voucher đã phát',  value: stats?.totalVouchers  ?? '—', color: 'bg-amber-50 text-amber-700 border-amber-200',   icon: '🎁' },
                            { label: 'Chưa sử dụng',     value: stats?.unusedVouchers ?? '—', color: 'bg-sky-50 text-sky-700    border-sky-200',      icon: '⏳' },
                            { label: 'Đã sử dụng',       value: stats?.usedVouchers   ?? '—', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '✅' },
                            { label: 'Hết hạn',          value: stats?.expiredVouchers?? '—', color: 'bg-rose-50 text-rose-700   border-rose-200',     icon: '❌' },
                        ].map(card => (
                            <div key={card.label}
                                className={`p-4 rounded-2xl border ${card.color} flex flex-col items-center text-center gap-1`}
                            >
                                <span className="text-2xl">{card.icon}</span>
                                <span className="text-2xl font-black">
                                    {loadingStats ? <span className="animate-pulse">…</span> : card.value}
                                </span>
                                <span className="text-[11px] font-semibold opacity-80">{card.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Top phần thưởng */}
                    <div className="rounded-2xl border overflow-hidden shadow-sm"
                        style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                        <div className="px-5 py-3.5 border-b flex items-center justify-between"
                            style={{ borderColor: 'var(--adm-border)', backgroundColor: 'var(--adm-surface-2)' }}>
                            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--adm-text)' }}>
                                🏆 Top Phần Thưởng Được Trúng Nhiều Nhất
                            </h3>
                            <button onClick={fetchStats}
                                className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg border"
                                style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)', backgroundColor: 'var(--adm-surface)' }}>
                                <RefreshCw size={12} className={loadingStats ? 'animate-spin' : ''} /> Làm mới
                            </button>
                        </div>
                        <div className="p-4 space-y-2.5">
                            {rewardBreakdown.length === 0 ? (
                                <p className="text-center py-8 text-sm" style={{ color: 'var(--adm-text-muted)' }}>
                                    Chưa có dữ liệu thống kê
                                </p>
                            ) : rewardBreakdown.map((r, i) => {
                                const maxCount = rewardBreakdown[0]?.count || 1;
                                const pct = Math.round((r.count / maxCount) * 100);
                                const medals = ['🥇','🥈','🥉'];
                                return (
                                    <div key={r.reward} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--adm-text)' }}>
                                                {medals[i] || `${i + 1}.`} {r.reward}
                                            </span>
                                            <span className="text-xs font-bold" style={{ color: 'var(--adm-text-muted)' }}>{r.count} lượt</span>
                                        </div>
                                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--adm-surface-2)' }}>
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: HISTORY */}
            {activeTab === 'history' && (
                <div className="space-y-4">
                    {/* Header with Search */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border shadow-sm"
                        style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                        <div>
                            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--adm-text)' }}>
                                <History size={15} className="text-amber-500" />
                                Lịch Sử Lượt Quay Thưởng Khách Hàng
                            </h3>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                                Trang {historyPage}/{historyTotalPages}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Tìm User ID hoặc phần thưởng…"
                                value={historySearch}
                                onChange={e => setHistorySearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && fetchHistory(1, historySearch)}
                                className="px-3 py-1.5 rounded-xl border text-xs w-52 focus:outline-none"
                                style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                            />
                            <button
                                onClick={() => { setHistoryPage(1); fetchHistory(1, historySearch); }}
                                className="px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5"
                                style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                            >
                                <RefreshCw size={13} className={loadingHistory ? 'animate-spin' : ''} /> Làm Mới
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left" style={{ fontSize: '11.5px' }}>
                                <thead className="text-[10px] font-bold uppercase tracking-wider border-b"
                                    style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' }}>
                                    <tr>
                                        <th className="px-3 py-3 whitespace-nowrap">User ID</th>
                                        <th className="px-3 py-3 whitespace-nowrap">Họ tên</th>
                                        <th className="px-3 py-3 whitespace-nowrap">Email</th>
                                        <th className="px-3 py-3 whitespace-nowrap">Số điện thoại</th>
                                        <th className="px-3 py-3 whitespace-nowrap">Thời gian quay</th>
                                        <th className="px-3 py-3 whitespace-nowrap">Kết quả quay</th>
                                        <th className="px-3 py-3 whitespace-nowrap">Mã voucher</th>
                                        <th className="px-3 py-3 whitespace-nowrap">Trạng thái voucher</th>
                                        <th className="px-3 py-3 whitespace-nowrap text-center">Lượt còn lại</th>
                                    </tr>
                                </thead>
                                <tbody style={{ borderColor: 'var(--adm-border)' }}>
                                    {loadingHistory ? (
                                        Array.from({ length: 8 }).map((_, i) => (
                                            <tr key={i} className="border-b" style={{ borderColor: 'var(--adm-border)' }}>
                                                {Array.from({ length: 9 }).map((__, j) => (
                                                    <td key={j} className="px-3 py-3">
                                                        <div className="h-3 rounded animate-pulse" style={{ backgroundColor: 'var(--adm-surface-2)' }} />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : history.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-4 py-12 text-center" style={{ color: 'var(--adm-text-muted)' }}>
                                                <History size={32} className="mx-auto mb-2 opacity-30" />
                                                <p>Chưa có lượt quay nào được ghi nhận</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        history.map(item => {
                                            const isWin = !item.reward_text.toLowerCase().includes('chúc') && !item.reward_text.toLowerCase().includes('may mắn');
                                            const voucherStatusConfig: Record<string, { label: string; cls: string }> = {
                                                none:    { label: '—',            cls: 'bg-gray-100 text-gray-400' },
                                                unused:  { label: 'Chưa sử dụng', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
                                                used:    { label: 'Đã sử dụng',   cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
                                                expired: { label: 'Hết hạn',       cls: 'bg-rose-50 text-rose-600 border border-rose-200' },
                                            };
                                            const vs = voucherStatusConfig[item.voucherStatus] || voucherStatusConfig.none;

                                            return (
                                                <tr key={item._id}
                                                    className="border-b last:border-0 transition-colors hover:bg-black/[0.02]"
                                                    style={{ borderColor: 'var(--adm-border)' }}>

                                                    {/* User ID */}
                                                    <td className="px-3 py-3">
                                                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                                            {item.user_id.slice(0, 8)}…
                                                        </span>
                                                    </td>

                                                    {/* Họ tên */}
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                                                <User size={11} className="text-amber-600" />
                                                            </div>
                                                            <span className="font-semibold whitespace-nowrap" style={{ color: 'var(--adm-text)' }}>
                                                                {item.userName}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Email */}
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-center gap-1" style={{ color: 'var(--adm-text-muted)' }}>
                                                            <Mail size={10} className="flex-shrink-0" />
                                                            <span className="whitespace-nowrap">{item.userEmail || '—'}</span>
                                                        </div>
                                                    </td>

                                                    {/* SĐT */}
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-center gap-1" style={{ color: 'var(--adm-text-muted)' }}>
                                                            <Phone size={10} className="flex-shrink-0" />
                                                            <span>{item.userPhone || '—'}</span>
                                                        </div>
                                                    </td>

                                                    {/* Thời gian quay */}
                                                    <td className="px-3 py-3 whitespace-nowrap" style={{ color: 'var(--adm-text-muted)' }}>
                                                        {new Date(item.spin_date).toLocaleString('vi-VN', {
                                                            day: '2-digit', month: '2-digit', year: 'numeric',
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </td>

                                                    {/* Kết quả quay */}
                                                    <td className="px-3 py-3">
                                                        {isWin ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                🎁 {item.reward_text}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">
                                                                😔 {item.reward_text}
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Mã voucher */}
                                                    <td className="px-3 py-3">
                                                        {item.voucherCode ? (
                                                            <div className="space-y-0.5">
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg font-mono text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                                                    <Ticket size={9} />
                                                                    {item.voucherCode}
                                                                </span>
                                                                {item.voucherExpiry && (
                                                                    <p className="text-[9px]" style={{ color: 'var(--adm-text-muted)' }}>
                                                                        HSD: {new Date(item.voucherExpiry).toLocaleDateString('vi-VN')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span style={{ color: 'var(--adm-text-muted)' }}>—</span>
                                                        )}
                                                    </td>

                                                    {/* Trạng thái voucher */}
                                                    <td className="px-3 py-3">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold ${vs.cls}`}>
                                                            {vs.label}
                                                        </span>
                                                    </td>

                                                    {/* Lượt quay còn lại */}
                                                    <td className="px-3 py-3 text-center">
                                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ${
                                                            item.remainingSpins > 0
                                                                ? 'bg-sky-100 text-sky-700'
                                                                : 'bg-gray-100 text-gray-400'
                                                        }`}>
                                                            {item.remainingSpins}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {historyTotalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t"
                                style={{ borderColor: 'var(--adm-border)', backgroundColor: 'var(--adm-surface-2)' }}>
                                <p className="text-[11px]" style={{ color: 'var(--adm-text-muted)' }}>
                                    Trang {historyPage} / {historyTotalPages}
                                </p>
                                <div className="flex gap-1.5">
                                    <button
                                        disabled={historyPage <= 1}
                                        onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                        className="p-1.5 rounded-lg border disabled:opacity-40 hover:bg-gray-50 transition-colors"
                                        style={{ borderColor: 'var(--adm-border)' }}
                                    >
                                        <ChevronLeft size={13} style={{ color: 'var(--adm-text)' }} />
                                    </button>
                                    <button
                                        disabled={historyPage >= historyTotalPages}
                                        onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))}
                                        className="p-1.5 rounded-lg border disabled:opacity-40 hover:bg-gray-50 transition-colors"
                                        style={{ borderColor: 'var(--adm-border)' }}
                                    >
                                        <ChevronRight size={13} style={{ color: 'var(--adm-text)' }} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            <AnimatePresence>
                {deleteIndex !== null && config && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setDeleteIndex(null)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm border rounded-2xl p-6 space-y-4 shadow-2xl"
                            style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm" style={{ color: 'var(--adm-text)' }}>Xác Nhận Xóa Ô Phần Thưởng</h3>
                                    <p className="text-xs" style={{ color: 'var(--adm-text-muted)' }}>Bạn có chắc muốn xóa ô này khỏi Vòng Quay?</p>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl border text-xs" style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)' }}>
                                <p className="font-bold text-amber-600">{config.prizes[deleteIndex]?.reward}</p>
                                <p style={{ color: 'var(--adm-text-muted)' }}>Loại: {TYPE_LABELS[config.prizes[deleteIndex]?.type]} | Xác suất: {config.prizes[deleteIndex]?.probability}%</p>
                            </div>

                            <div className="flex gap-2.5 pt-2">
                                <button
                                    onClick={() => setDeleteIndex(null)}
                                    className="flex-1 py-2.5 rounded-xl border text-xs font-bold"
                                    style={{ backgroundColor: 'var(--adm-surface-2)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={confirmDeletePrize}
                                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
                                >
                                    Xác Nhận Xóa
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
