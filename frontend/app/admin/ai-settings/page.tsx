'use client';
import React, { useState, useEffect } from 'react';
import { Save, Bot, Sparkles, Camera, Loader2, Key } from 'lucide-react';
import { useAuth } from '@/app/component/AuthContext';

interface AISetting {
    type: 'chat' | 'style' | 'tryon';
    apiKey: string;
    systemPrompt: string;
    isActive: boolean;
}

export default function AISettingsPage() {
    const { token } = useAuth();
    const [settings, setSettings] = useState<AISetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null); // lưu type đang save

    useEffect(() => {
        if (token) fetchSettings();
    }, [token]);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/settings`, {
                headers: { 'x-user-id': token || '' }
            });
            const data = await res.json();
            if (data.success) {
                setSettings(data.settings);
            }
        } catch (err) {
            console.error('Fetch settings failed', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (setting: AISetting) => {
        setSaving(setting.type);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/settings/${setting.type}`, {
                method: 'PUT',
                headers: { 
                    'x-user-id': token || '',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    apiKey: setting.apiKey,
                    systemPrompt: setting.systemPrompt,
                    isActive: setting.isActive
                })
            });
            const data = await res.json();
            if (data.success) {
                alert('Lưu thành công!');
            } else {
                alert('Lỗi: ' + data.message);
            }
        } catch (err) {
            alert('Lỗi kết nối!');
        } finally {
            setSaving(null);
        }
    };

    const updateSettingField = (type: string, field: keyof AISetting, value: any) => {
        setSettings(prev => prev.map(s => s.type === type ? { ...s, [field]: value } : s));
    };

    if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline-block" /> Đang tải cấu hình...</div>;

    const getIcon = (type: string) => {
        if (type === 'chat') return <Bot size={24} className="text-blue-500" />;
        if (type === 'style') return <Sparkles size={24} className="text-purple-500" />;
        if (type === 'tryon') return <Camera size={24} className="text-amber-500" />;
        return <Bot size={24} />;
    };

    const getTitle = (type: string) => {
        if (type === 'chat') return 'AI Chatbot Hỗ Trợ';
        if (type === 'style') return 'AI Stylist Gợi Ý';
        if (type === 'tryon') return 'AI Thử Đồ (Phân Tích Ảnh)';
        return type;
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Cấu Hình AI (Gemini)</h1>
                <p className="text-slate-500 text-sm mt-1">Quản lý API Key và câu lệnh System Prompts cho từng tính năng AI.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {settings.map(setting => (
                    <div key={setting.type} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
                                    {getIcon(setting.type)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">{getTitle(setting.type)}</h3>
                                    <label className="flex items-center gap-2 mt-1 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={setting.isActive}
                                            onChange={(e) => updateSettingField(setting.type, 'isActive', e.target.checked)}
                                            className="w-4 h-4 text-indigo-600 rounded"
                                        />
                                        <span className="text-sm text-slate-600">Bật tính năng này</span>
                                    </label>
                                </div>
                            </div>
                            <button
                                onClick={() => handleSave(setting)}
                                disabled={saving === setting.type}
                                className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                                {saving === setting.type ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Lưu cấu hình
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <Key size={16} className="text-slate-400" />
                                    Gemini API Key riêng (Tùy chọn)
                                </label>
                                <input
                                    type="text"
                                    value={setting.apiKey || ''}
                                    onChange={(e) => updateSettingField(setting.type, 'apiKey', e.target.value)}
                                    placeholder="Bỏ trống để dùng chung KEY mặc định trong .env..."
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    System Prompt (Tính cách & Hướng dẫn)
                                </label>
                                <textarea
                                    value={setting.systemPrompt || ''}
                                    onChange={(e) => updateSettingField(setting.type, 'systemPrompt', e.target.value)}
                                    rows={4}
                                    placeholder="Bạn là..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
