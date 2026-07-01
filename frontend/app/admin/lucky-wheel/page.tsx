'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Save, Gift, Loader2, Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/app/component/AuthContext';

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
    // Admin display helpers
    color?: string;
}

interface Config {
    isActive: boolean;
    spinsPerDay: number;
    prizes: Prize[];
}

const TYPE_LABELS: Record<string, string> = {
    none: 'Không trúng',
    fixed: 'Giảm tiền mặt (VND)',
    percent: 'Giảm phần trăm (%)',
    shipping: 'Miễn phí ship',
};

const DEFAULT_COLORS = ['#FFB300', '#FF8F00', '#E65100', '#BF360C', '#FFB300', '#FF8F00', '#E65100', '#BF360C'];

export default function LuckyWheelAdminPage() {
    const { token } = useAuth();
    const [config, setConfig] = useState<Config | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const showToast = (type: 'success' | 'error', msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchConfig = useCallback(async () => {
        try {
            const res = await fetch(`/api/lucky-wheel/config`);
            const data = await res.json();
            if (data.success && data.config) {
                setConfig(data.config);
            } else if (data.success && data.prizes) {
                // Fallback: map raw prizes
                setConfig({
                    isActive: true,
                    spinsPerDay: 1,
                    prizes: data.prizes.map((r: any, i: number) => ({
                        _id: r._id || r.id,
                        id: r._id || r.id,
                        reward: r.reward,
                        type: r.type,
                        coupon_code: r.coupon_code || '',
                        discount_value: r.discount_value || 0,
                        probability: r.probability || 0,
                        valid_hours: r.valid_hours || 24,
                        active: r.active !== false,
                        color: DEFAULT_COLORS[i % 8],
                    }))
                });
            }
        } catch (err) {
            console.error('Fetch config failed', err);
            showToast('error', 'Không thể tải cấu hình vòng quay!');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    const handleSave = async () => {
        if (!config) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/lucky-wheel/config`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prizes: config.prizes })
            });
            const data = await res.json();
            if (data.success) {
                showToast('success', 'Đã lưu cấu hình vòng quay thành công!');
                fetchConfig(); // Reload lại để có _id mới nhất
            } else {
                showToast('error', 'Lỗi: ' + data.message);
            }
        } catch (err) {
            console.error(err);
            showToast('error', 'Lỗi kết nối!');
        } finally {
            setSaving(false);
        }
    };

    const updatePrize = (index: number, field: keyof Prize, value: any) => {
        if (!config) return;
        const newPrizes = [...config.prizes];
        newPrizes[index] = { ...newPrizes[index], [field]: value };
        setConfig({ ...config, prizes: newPrizes });
    };

    const addPrize = () => {
        if (!config) return;
        setConfig({
            ...config,
            prizes: [...config.prizes, {
                reward: 'Phần thưởng mới',
                type: 'none',
                coupon_code: '',
                discount_value: 0,
                probability: 1,
                valid_hours: 24,
                active: true,
                color: DEFAULT_COLORS[config.prizes.length % 8],
            }]
        });
    };

    const removePrize = (index: number) => {
        if (!config) return;
        const newPrizes = config.prizes.filter((_, i) => i !== index);
        setConfig({ ...config, prizes: newPrizes });
    };

    if (loading) return (
        <div className="p-8 flex items-center justify-center min-h-[400px]">
            <Loader2 className="animate-spin text-indigo-500 w-10 h-10" />
        </div>
    );

    if (!config) return (
        <div className="p-8 text-center text-red-500">
            <AlertCircle className="mx-auto mb-2" size={32} />
            Không thể tải dữ liệu vòng quay. Vui lòng thử lại.
        </div>
    );

    const totalProbability = config.prizes.reduce((sum, p) => sum + Number(p.probability || 0), 0);
    const probOk = Math.abs(totalProbability - 100) < 0.01;

    return (
        <div className="p-6 pb-24 max-w-6xl mx-auto">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-white text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-500'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Gift className="text-amber-500" size={24} />
                        Vòng Quay May Mắn
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Cài đặt ô phần thưởng, xác suất và mã coupon tương ứng.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`text-sm font-bold px-3 py-2 rounded-lg ${probOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        Tổng XS: {totalProbability.toFixed(1)}% {!probOk && '≠ 100%'}
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving || !probOk}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Lưu cấu hình
                    </button>
                </div>
            </div>

            {!probOk && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    Tổng xác suất các ô phải bằng <strong>100%</strong> trước khi có thể lưu (hiện tại: {totalProbability.toFixed(1)}%).
                </div>
            )}

            {/* Prizes Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800">Danh sách ô phần thưởng ({config.prizes.length} ô)</h3>
                    <button
                        onClick={addPrize}
                        className="flex items-center gap-1.5 text-sm text-indigo-600 font-semibold bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                        <Plus size={15} /> Thêm ô
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 min-w-[900px]">
                        <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-4 py-3 w-8">#</th>
                                <th className="px-4 py-3">Tên hiển thị</th>
                                <th className="px-4 py-3">Loại thưởng</th>
                                <th className="px-4 py-3">Giá trị</th>
                                <th className="px-4 py-3">Mã Coupon</th>
                                <th className="px-4 py-3">Hạn dùng (giờ)</th>
                                <th className="px-4 py-3">Xác suất (%)</th>
                                <th className="px-4 py-3">Kích hoạt</th>
                                <th className="px-4 py-3 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {config.prizes.map((prize, index) => (
                                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div
                                            className="w-6 h-6 rounded-full border-2 border-white shadow"
                                            style={{ backgroundColor: DEFAULT_COLORS[index % 8] }}
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="text"
                                            value={prize.reward}
                                            onChange={(e) => updatePrize(index, 'reward', e.target.value)}
                                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={prize.type}
                                            onChange={(e) => updatePrize(index, 'type', e.target.value)}
                                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-indigo-200 outline-none"
                                        >
                                            {Object.entries(TYPE_LABELS).map(([v, l]) => (
                                                <option key={v} value={v}>{l}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            value={prize.discount_value}
                                            onChange={(e) => updatePrize(index, 'discount_value', Number(e.target.value))}
                                            disabled={prize.type === 'none' || prize.type === 'shipping'}
                                            className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-sm text-center focus:ring-2 focus:ring-indigo-200 outline-none disabled:opacity-40"
                                            min="0"
                                            placeholder={prize.type === 'none' || prize.type === 'shipping' ? '-' : '0'}
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="text"
                                            value={prize.coupon_code}
                                            onChange={(e) => updatePrize(index, 'coupon_code', e.target.value)}
                                            disabled={prize.type === 'none'}
                                            className="w-32 px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-sm font-mono uppercase focus:ring-2 focus:ring-indigo-200 outline-none disabled:opacity-40"
                                            placeholder="SPIN20"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            value={prize.valid_hours}
                                            onChange={(e) => updatePrize(index, 'valid_hours', Number(e.target.value))}
                                            disabled={prize.type === 'none'}
                                            className="w-20 px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-sm text-center focus:ring-2 focus:ring-indigo-200 outline-none disabled:opacity-40"
                                            min="0"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            value={prize.probability}
                                            onChange={(e) => updatePrize(index, 'probability', Number(e.target.value))}
                                            className="w-20 px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-sm text-center font-bold focus:ring-2 focus:ring-indigo-200 outline-none"
                                            min="0"
                                            max="100"
                                            step="0.5"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <input
                                            type="checkbox"
                                            checked={prize.active !== false}
                                            onChange={(e) => updatePrize(index, 'active', e.target.checked)}
                                            className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => removePrize(index)}
                                            className="text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 text-sm text-blue-700">
                <p className="font-semibold mb-1">💡 Hướng dẫn:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-600">
                    <li>Tổng xác suất tất cả các ô phải đúng bằng <strong>100%</strong>.</li>
                    <li>Ô loại <strong>Không trúng</strong> nên có xác suất cao (vd: 50-60%).</li>
                    <li>Mã Coupon sẽ được tự động sinh unique cho mỗi user khi trúng.</li>
                    <li>Hạn dùng = 0 nghĩa là không hết hạn.</li>
                </ul>
            </div>
        </div>
    );
}
