'use client';
import React, { useState, useEffect } from 'react';
import { Save, Gift, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/component/AuthContext';

interface Prize {
    id: number;
    label: string;
    type: string;
    value: string;
    color: string;
    probability: number;
}

interface Config {
    isActive: boolean;
    spinsPerDay: number;
    prizes: Prize[];
}

export default function LuckyWheelAdminPage() {
    const { token } = useAuth();
    const [config, setConfig] = useState<Config | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (token) fetchConfig();
    }, [token]);

    const fetchConfig = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lucky-wheel/config`, {
                headers: { 'x-user-id': token || '' }
            });
            const data = await res.json();
            if (data.success) {
                setConfig(data.config);
            }
        } catch (err) {
            console.error('Fetch config failed', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!config) return;
        setSaving(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lucky-wheel/config`, {
                method: 'PUT',
                headers: { 
                    'x-user-id': token || '',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });
            const data = await res.json();
            if (data.success) {
                alert('Lưu cấu hình thành công!');
            } else {
                alert('Lỗi: ' + data.message);
            }
        } catch (err) {
            alert('Lỗi kết nối!');
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

    if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline-block" /> Đang tải...</div>;
    if (!config) return <div className="p-8 text-center text-red-500">Lỗi tải dữ liệu</div>;

    const totalProbability = config.prizes.reduce((sum, p) => sum + Number(p.probability || 0), 0);

    return (
        <div className="p-8 pb-24">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Vòng Quay May Mắn</h1>
                    <p className="text-slate-500 text-sm mt-1">Cấu hình 8 ô phần thưởng và xác suất trúng.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || totalProbability !== 100}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Lưu Vòng Quay
                </button>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Gift size={18} /> Cài Đặt Chung</h3>
                <div className="flex items-center gap-8">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={config.isActive}
                            onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
                            className="w-5 h-5 text-indigo-600 rounded"
                        />
                        <span className="font-medium text-slate-700">Kích hoạt Vòng Quay</span>
                    </label>
                    <div className="flex items-center gap-3">
                        <span className="font-medium text-slate-700">Số lượt quay/ngày/user:</span>
                        <input 
                            type="number" 
                            value={config.spinsPerDay}
                            onChange={(e) => setConfig({ ...config, spinsPerDay: Number(e.target.value) })}
                            className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center"
                            min="1"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800">8 Ô Phần Thưởng</h3>
                    <div className={`text-sm font-bold px-3 py-1 rounded-lg ${totalProbability === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        Tổng xác suất: {totalProbability}% {totalProbability !== 100 && '(Phải = 100%)'}
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="text-xs uppercase bg-slate-50 text-slate-500">
                            <tr>
                                <th className="px-6 py-3">Ô</th>
                                <th className="px-6 py-3">Tên hiển thị (Label)</th>
                                <th className="px-6 py-3">Loại thưởng (Type)</th>
                                <th className="px-6 py-3">Giá trị (Value)</th>
                                <th className="px-6 py-3">Màu nền</th>
                                <th className="px-6 py-3">Xác suất (%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {config.prizes.map((prize, index) => (
                                <tr key={prize.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                    <td className="px-6 py-4 font-bold text-slate-900">#{prize.id}</td>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="text" 
                                            value={prize.label}
                                            onChange={(e) => updatePrize(index, 'label', e.target.value)}
                                            className="w-full px-3 py-1.5 border border-slate-200 rounded bg-white"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <select 
                                            value={prize.type}
                                            onChange={(e) => updatePrize(index, 'type', e.target.value)}
                                            className="w-full px-3 py-1.5 border border-slate-200 rounded bg-white"
                                        >
                                            <option value="discount">Giảm giá (%)</option>
                                            <option value="discount_cash">Giảm tiền mặt (VND)</option>
                                            <option value="freeship">Freeship</option>
                                            <option value="retry">Thử lại (Không trúng)</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="text" 
                                            value={prize.value}
                                            onChange={(e) => updatePrize(index, 'value', e.target.value)}
                                            className="w-24 px-3 py-1.5 border border-slate-200 rounded bg-white"
                                            placeholder="VD: 10%"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="color" 
                                                value={prize.color}
                                                onChange={(e) => updatePrize(index, 'color', e.target.value)}
                                                className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                            />
                                            <span className="text-xs font-mono">{prize.color}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="number" 
                                            value={prize.probability}
                                            onChange={(e) => updatePrize(index, 'probability', Number(e.target.value))}
                                            className="w-20 px-3 py-1.5 border border-slate-200 rounded bg-white text-center font-bold"
                                            min="0" max="100"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
