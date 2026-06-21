'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/component/AuthContext';
import {
    User, Mail, Lock, Phone, MapPin, Save, Loader2,
    Key, Shield, Globe, CheckCircle, AlertCircle,
    Clock, MessageSquare, Plus, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Toast-like inline message ──────────────────────────────────────────────
function InlineAlert({ type, content }: { type: string; content: string }) {
    const isSuccess = type === 'success';
    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-3 p-4 rounded-xl border text-sm font-medium mb-6"
            style={{
                background: isSuccess ? 'var(--adm-success-light)' : 'var(--adm-danger-light)',
                borderColor: isSuccess ? 'var(--adm-success)' : 'var(--adm-danger)',
                color: isSuccess ? 'var(--adm-success)' : 'var(--adm-danger)',
            }}
        >
            {isSuccess
                ? <CheckCircle size={18} className="shrink-0 mt-0.5" />
                : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
            {content}
        </motion.div>
    );
}

// ── Reusable section card wrapper ──────────────────────────────────────────
function SectionCard({
    icon,
    iconBg,
    iconColor,
    title,
    subtitle,
    children,
}: {
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className="adm-card rounded-2xl overflow-hidden"
            style={{ background: 'var(--adm-surface)' }}
        >
            {/* Card header */}
            <div
                className="flex items-center gap-3 px-5 py-4 border-b"
                style={{ borderColor: 'var(--adm-border)' }}
            >
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: iconBg, color: iconColor }}
                >
                    {icon}
                </div>
                <div>
                    <h4 className="font-bold text-sm" style={{ color: 'var(--adm-text)' }}>
                        {title}
                    </h4>
                    {subtitle && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            {/* Card body */}
            <div className="p-5">{children}</div>
        </div>
    );
}

// ── Labelled input helper ──────────────────────────────────────────────────
function FormField({
    label,
    icon,
    children,
}: {
    label: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label
                className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
                style={{ color: 'var(--adm-text-muted)' }}
            >
                {label}
            </label>
            {icon ? (
                <div className="relative">
                    <span
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: 'var(--adm-text-subtle)' }}
                    >
                        {icon}
                    </span>
                    {children}
                </div>
            ) : (
                children
            )}
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function AdminSettings() {
    const { user, updateProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', content: '' });
    const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'site' | 'flashSale' | 'reviews'>('profile');

    const [profileData, setProfileData] = useState({
        name: '',
        phone: '',
        address: '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [siteSettings, setSiteSettings] = useState({
        heroHeading: '',
        heroSubtitle: '',
        heroVideoUrl: '',
        heroImage: '',
    });

    const [flashSale, setFlashSale] = useState({
        active: false,
        endTime: '',
    });

    interface HomepageReview {
        id: string;
        name: string;
        role: string;
        content: string;
        rating: number;
        avatar: string;
    }
    const [homepageReviews, setHomepageReviews] = useState<HomepageReview[]>([]);

    // ── Helpers ──
    const showMsg = (type: string, content: string) => {
        setMessage({ type, content });
        setTimeout(() => setMessage({ type: '', content: '' }), 4000);
    };

    // ── Fetch ──
    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name || '',
                phone: (user as {phone?: string}).phone || '',
                address: (user as {address?: string}).address || '',
            });
        }
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data.success && data.settings) {
                    setSiteSettings({
                        heroHeading: data.settings.heroHeading || '',
                        heroSubtitle: data.settings.heroSubtitle || '',
                        heroVideoUrl: data.settings.heroVideoUrl || '',
                        heroImage: data.settings.heroImage || '',
                    });
                    
                    setFlashSale({
                        active: data.settings.flashSaleActive === true || data.settings.flashSaleActive === 'true',
                        endTime: data.settings.flashSaleEndTime || '',
                    });

                    if (data.settings.homepageReviews && Array.isArray(data.settings.homepageReviews)) {
                        setHomepageReviews(data.settings.homepageReviews);
                    }
                }
            } catch (error) {
                console.error('Error fetching site settings:', error);
            }
        };
        fetchSettings();
    }, [user]);

    // ── Handlers ──
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const success = await updateProfile(profileData);
        showMsg(success ? 'success' : 'error', success ? 'Cập nhật thông tự thành công!' : 'Có lỗi xảy ra, vui lòng thử lại.');
        setLoading(false);
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showMsg('error', 'Mật khẩu xác nhận không khớp!');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user?.id,
                    password: passwordData.newPassword,
                    currentPassword: passwordData.currentPassword,
                }),
            });
            const data = await res.json();
            if (data.success) {
                showMsg('success', 'Đổi mật khẩu thành công!');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                showMsg('error', data.message || 'Lỗi đổi mật khẩu');
            }
        } catch {
            showMsg('error', 'Lỗi kết nối server');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSiteSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(siteSettings),
            });
            const data = await res.json();
            showMsg(data.success ? 'success' : 'error', data.success ? 'Cập nhật cấu hình trang chủ thành công!' : (data.message || 'Lỗi cập nhật cấu hình'));
        } catch {
            showMsg('error', 'Lỗi kết nối server');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateFlashSale = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    flashSaleActive: flashSale.active,
                    flashSaleEndTime: flashSale.endTime
                }),
            });
            const data = await res.json();
            showMsg(data.success ? 'success' : 'error', data.success ? 'Lưu cấu hình Flash Sale thành công!' : 'Lỗi cập nhật Flash Sale');
        } catch {
            showMsg('error', 'Lỗi kết nối server');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateHomepageReviews = async (e?: React.FormEvent) => {
        if(e) e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    homepageReviews: homepageReviews
                }),
            });
            const data = await res.json();
            showMsg(data.success ? 'success' : 'error', data.success ? 'Lưu Đánh giá Trang chủ thành công!' : 'Lỗi cập nhật Đánh giá');
        } catch {
            showMsg('error', 'Lỗi kết nối server');
        } finally {
            setLoading(false);
        }
    };

    const addReview = () => {
        setHomepageReviews([
            ...homepageReviews,
            { id: Date.now().toString(), name: '', role: 'Khách hàng', content: '', rating: 5, avatar: '' }
        ]);
    };

    const updateReview = (id: string, field: keyof HomepageReview, value: string | number) => {
        setHomepageReviews(homepageReviews.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const removeReview = (id: string) => {
        setHomepageReviews(homepageReviews.filter(r => r.id !== id));
    };

    // ── Input class ──
    const inputCls = (withIcon = false) =>
        `w-full ${withIcon ? 'pl-10' : 'px-4'} pr-4 py-3 rounded-xl text-sm font-medium transition-all outline-none focus:ring-2`
        + ` bg-[var(--adm-surface-2)] text-[var(--adm-text)] placeholder:text-[var(--adm-text-subtle)]`
        + ` border border-[var(--adm-border)] focus:ring-[var(--adm-primary)]/20 focus:border-[var(--adm-primary)]`;

    const disabledInputCls = `w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium opacity-60 cursor-not-allowed`
        + ` bg-[var(--adm-surface-2)] text-[var(--adm-text-muted)] border border-[var(--adm-border)]`;

    // ── Nav tabs ──
    const tabs = [
        { id: 'profile' as const, label: 'Tài khoản', icon: <User size={16} /> },
        { id: 'security' as const, label: 'Bảo mật', icon: <Shield size={16} /> },
        { id: 'site' as const, label: 'Hero Banner', icon: <Globe size={16} /> },
        { id: 'flashSale' as const, label: 'Flash Sale', icon: <Clock size={16} /> },
        { id: 'reviews' as const, label: 'Review Trang Chủ', icon: <MessageSquare size={16} /> },
    ];

    return (
        <div className="space-y-6 pb-24">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--adm-text)' }}>
                    Cài đặt
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--adm-text-muted)' }}>
                    Quản lý thông tin tài khoản, bảo mật và các cấu hình trang chủ.
                </p>
            </div>

            {/* Global alert */}
            <AnimatePresence>
                {message.content && (
                    <InlineAlert type={message.type} content={message.content} />
                )}
            </AnimatePresence>

            {/* Section nav tabs */}
            <div
                className="flex gap-1 p-1 rounded-xl overflow-x-auto scrollbar-none"
                style={{ background: 'var(--adm-surface-2)' }}
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSection(tab.id)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all min-h-[44px] flex-1 justify-center"
                        style={
                            activeSection === tab.id
                                ? {
                                    background: 'var(--adm-surface)',
                                    color: 'var(--adm-primary)',
                                    boxShadow: '0 1px 4px rgba(0,0,0,.08)',
                                }
                                : { color: 'var(--adm-text-muted)' }
                        }
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* ── PROFILE SECTION ── */}
            <AnimatePresence mode="wait">
                {activeSection === 'profile' && (
                    <motion.div
                        key="profile"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                    >
                        <SectionCard
                            icon={<User size={20} />}
                            iconBg="var(--adm-primary-light)"
                            iconColor="var(--adm-primary)"
                            title="Thông tin chung"
                            subtitle="Cập nhật họ tên, số điện thoại và địa chỉ"
                        >
                            <form data-form="profile" onSubmit={handleUpdateProfile} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <FormField label="Họ và tên" icon={<User size={16} />}>
                                        <input
                                            type="text"
                                            value={profileData.name}
                                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                            className={inputCls(true)}
                                            placeholder="Nguyễn Văn A"
                                        />
                                    </FormField>

                                    <FormField label="Email" icon={<Mail size={16} />}>
                                        <input
                                            type="email"
                                            value={user?.email || ''}
                                            disabled
                                            className={disabledInputCls}
                                        />
                                    </FormField>

                                    <FormField label="Số điện thoại" icon={<Phone size={16} />}>
                                        <input
                                            type="text"
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                            className={inputCls(true)}
                                            placeholder="Chưa cập nhật"
                                        />
                                    </FormField>

                                    <FormField label="Địa chỉ" icon={<MapPin size={16} />}>
                                        <input
                                            type="text"
                                            value={profileData.address}
                                            onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                            className={inputCls(true)}
                                            placeholder="Chưa cập nhật"
                                        />
                                    </FormField>
                                </div>

                                <div className="flex justify-end pt-2 hidden md:flex">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="adm-btn-primary flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold min-h-[44px] disabled:opacity-60"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                        Lưu thông tin
                                    </button>
                                </div>
                            </form>
                        </SectionCard>
                    </motion.div>
                )}

                {/* ── SECURITY SECTION ── */}
                {activeSection === 'security' && (
                    <motion.div
                        key="security"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                    >
                        <SectionCard
                            icon={<Lock size={20} />}
                            iconBg="var(--adm-danger-light)"
                            iconColor="var(--adm-danger)"
                            title="Bảo mật"
                            subtitle="Thay đổi mật khẩu tài khoản"
                        >
                            <form data-form="security" onSubmit={handleUpdatePassword} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <FormField label="Mật khẩu hiện tại" icon={<Key size={16} />}>
                                        <input
                                            type="password"
                                            required
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className={inputCls(true)}
                                            placeholder="••••••••"
                                        />
                                    </FormField>

                                    <div className="hidden md:block" />

                                    <FormField label="Mật khẩu mới" icon={<Lock size={16} />}>
                                        <input
                                            type="password"
                                            required
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className={inputCls(true)}
                                            placeholder="••••••••"
                                        />
                                    </FormField>

                                    <FormField label="Xác nhận mật khẩu" icon={<Lock size={16} />}>
                                        <input
                                            type="password"
                                            required
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className={inputCls(true)}
                                            placeholder="••••••••"
                                        />
                                    </FormField>
                                </div>

                                {passwordData.newPassword && passwordData.confirmPassword && (
                                    <p
                                        className="text-xs"
                                        style={{
                                            color: passwordData.newPassword === passwordData.confirmPassword
                                                ? 'var(--adm-success)'
                                                : 'var(--adm-danger)',
                                        }}
                                    >
                                        {passwordData.newPassword === passwordData.confirmPassword
                                            ? '✓ Mật khẩu khớp'
                                            : '✗ Mật khẩu không khớp'}
                                    </p>
                                )}

                                <div className="flex justify-end pt-2 hidden md:flex">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold min-h-[44px] border disabled:opacity-60 transition-all hover:opacity-90"
                                        style={{
                                            background: 'var(--adm-danger)',
                                            color: '#fff',
                                            borderColor: 'var(--adm-danger)',
                                        }}
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Shield size={16} />}
                                        Đổi mật khẩu
                                    </button>
                                </div>
                            </form>
                        </SectionCard>
                    </motion.div>
                )}

                {/* ── SITE SETTINGS SECTION ── */}
                {activeSection === 'site' && (
                    <motion.div
                        key="site"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                    >
                        <SectionCard
                            icon={<Globe size={20} />}
                            iconBg="rgba(59,130,246,.12)"
                            iconColor="#3b82f6"
                            title="Cấu hình Hero Banner"
                            subtitle="Tiêu đề, phụ đề, video và hình nền cho banner"
                        >
                            <form data-form="site" onSubmit={handleUpdateSiteSettings} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <FormField label="Tiêu đề chính">
                                        <input
                                            type="text"
                                            value={siteSettings.heroHeading}
                                            onChange={(e) => setSiteSettings({ ...siteSettings, heroHeading: e.target.value })}
                                            className={inputCls()}
                                            placeholder="Ví dụ: PHONG CÁCH vượt thời gian"
                                        />
                                    </FormField>

                                    <FormField label="Phụ đề">
                                        <textarea
                                            rows={2}
                                            value={siteSettings.heroSubtitle}
                                            onChange={(e) => setSiteSettings({ ...siteSettings, heroSubtitle: e.target.value })}
                                            className={`${inputCls()} resize-none`}
                                            placeholder="Ví dụ: Hãy để bản thân tỏa sáng..."
                                        />
                                    </FormField>

                                    <FormField label="URL Video Nền (Ưu tiên)">
                                        <input
                                            type="text"
                                            value={siteSettings.heroVideoUrl}
                                            onChange={(e) => setSiteSettings({ ...siteSettings, heroVideoUrl: e.target.value })}
                                            className={inputCls()}
                                            placeholder="Link file .mp4"
                                        />
                                        {siteSettings.heroVideoUrl && (
                                            <div className="mt-3 rounded-xl overflow-hidden bg-black aspect-video">
                                                <video
                                                    src={siteSettings.heroVideoUrl}
                                                    autoPlay
                                                    muted
                                                    loop
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                    </FormField>

                                    <FormField label="URL Hình nền (Dự phòng)">
                                        <input
                                            type="text"
                                            value={siteSettings.heroImage}
                                            onChange={(e) => setSiteSettings({ ...siteSettings, heroImage: e.target.value })}
                                            className={inputCls()}
                                            placeholder="Link hình ảnh"
                                        />
                                        {siteSettings.heroImage && !siteSettings.heroVideoUrl && (
                                            <div className="mt-3 rounded-xl overflow-hidden bg-[var(--adm-surface-2)] aspect-video">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={siteSettings.heroImage}
                                                    alt="Hero"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                    </FormField>
                                </div>

                                <div className="flex justify-end pt-2 hidden md:flex">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="adm-btn-primary flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold min-h-[44px] disabled:opacity-60"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                        Lưu cấu hình
                                    </button>
                                </div>
                            </form>
                        </SectionCard>
                    </motion.div>
                )}

                {/* ── FLASH SALE SECTION ── */}
                {activeSection === 'flashSale' && (
                    <motion.div
                        key="flashSale"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                    >
                        <SectionCard
                            icon={<Clock size={20} />}
                            iconBg="rgba(239, 68, 68, 0.12)"
                            iconColor="#ef4444"
                            title="Cấu hình Flash Sale"
                            subtitle="Bật tắt và thiết lập thời gian hiển thị đếm ngược trên trang chủ"
                        >
                            <form data-form="flashSale" onSubmit={handleUpdateFlashSale} className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-[var(--adm-surface-2)] rounded-xl border border-[var(--adm-border)]">
                                    <div>
                                        <h5 className="font-bold text-sm" style={{ color: 'var(--adm-text)' }}>Trạng thái hoạt động</h5>
                                        <p className="text-xs text-gray-500 mt-1">Bật để hiển thị Flash Sale trên trang chủ</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={flashSale.active}
                                            onChange={(e) => setFlashSale({ ...flashSale, active: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                                    </label>
                                </div>

                                <div className="w-full md:w-1/2">
                                    <FormField label="Thời gian kết thúc (End Time)">
                                        <input
                                            type="datetime-local"
                                            value={flashSale.endTime}
                                            onChange={(e) => setFlashSale({ ...flashSale, endTime: e.target.value })}
                                            className={inputCls()}
                                        />
                                    </FormField>
                                </div>

                                <div className="flex justify-end pt-2 hidden md:flex">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="adm-btn-primary flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold min-h-[44px] disabled:opacity-60"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                        Lưu Flash Sale
                                    </button>
                                </div>
                            </form>
                        </SectionCard>
                    </motion.div>
                )}

                {/* ── REVIEWS SECTION ── */}
                {activeSection === 'reviews' && (
                    <motion.div
                        key="reviews"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                    >
                        <SectionCard
                            icon={<MessageSquare size={20} />}
                            iconBg="rgba(245, 158, 11, 0.12)"
                            iconColor="#f59e0b"
                            title="Quản lý Review Trang Chủ"
                            subtitle="Thêm và chỉnh sửa phản hồi nổi bật của khách hàng"
                        >
                            <form data-form="reviews" onSubmit={handleUpdateHomepageReviews} className="space-y-6">
                                {homepageReviews.map((review, index) => (
                                    <div key={review.id} className="p-5 bg-[var(--adm-surface-2)] border border-[var(--adm-border)] rounded-xl relative group">
                                        <button
                                            type="button"
                                            onClick={() => removeReview(review.id)}
                                            className="absolute top-3 right-3 p-2 bg-white rounded-lg text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity border border-gray-100 shadow-sm"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <h5 className="font-bold text-sm mb-4">Review #{index + 1}</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField label="Tên khách hàng">
                                                <input
                                                    type="text"
                                                    value={review.name}
                                                    onChange={(e) => updateReview(review.id, 'name', e.target.value)}
                                                    className={inputCls()}
                                                />
                                            </FormField>
                                            <FormField label="Chức danh / Nhóm">
                                                <input
                                                    type="text"
                                                    value={review.role}
                                                    onChange={(e) => updateReview(review.id, 'role', e.target.value)}
                                                    className={inputCls()}
                                                />
                                            </FormField>
                                            <FormField label="URL Avatar">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={review.avatar}
                                                        onChange={(e) => updateReview(review.id, 'avatar', e.target.value)}
                                                        className={inputCls()}
                                                    />
                                                    {review.avatar && (
                                                        <>
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={review.avatar} className="w-11 h-11 rounded-lg border object-cover shrink-0" alt="avatar" />
                                                        </>
                                                    )}
                                                </div>
                                            </FormField>
                                            <FormField label="Số sao (1-5)">
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={5}
                                                    value={review.rating}
                                                    onChange={(e) => updateReview(review.id, 'rating', Number(e.target.value))}
                                                    className={inputCls()}
                                                />
                                            </FormField>
                                            <div className="md:col-span-2">
                                                <FormField label="Nội dung">
                                                    <textarea
                                                        rows={2}
                                                        value={review.content}
                                                        onChange={(e) => updateReview(review.id, 'content', e.target.value)}
                                                        className={inputCls()}
                                                    />
                                                </FormField>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={addReview}
                                    className="w-full py-4 rounded-xl border-2 border-dashed border-[var(--adm-primary)] text-[var(--adm-primary)] font-bold flex flex-col items-center justify-center gap-1 hover:bg-[var(--adm-primary-light)] transition-colors"
                                >
                                    <Plus size={20} />
                                    <span>Thêm Review Mới</span>
                                </button>

                                <div className="flex justify-end pt-2 hidden md:flex">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="adm-btn-primary flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold min-h-[44px] disabled:opacity-60"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                        Lưu danh sách Review
                                    </button>
                                </div>
                            </form>
                        </SectionCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Sticky save hint footer (mobile) ── */}
            <div
                className="fixed bottom-0 left-0 right-0 md:hidden border-t px-4 py-3 flex items-center justify-between z-30"
                style={{
                    background: 'var(--adm-surface)',
                    borderColor: 'var(--adm-border)',
                }}
            >
                <div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--adm-text)' }}>
                        {activeSection === 'profile' && 'Thông tin chung'}
                        {activeSection === 'security' && 'Bảo mật'}
                        {activeSection === 'site' && 'Hero Banner'}
                        {activeSection === 'flashSale' && 'Flash Sale'}
                        {activeSection === 'reviews' && 'Review Trang Chủ'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--adm-text-muted)' }}>
                        Nhấn Lưu để áp dụng thay đổi
                    </p>
                </div>
                <button
                    type="button"
                    disabled={loading}
                    className="adm-btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold min-h-[44px] disabled:opacity-60"
                    onClick={() => {
                        const formSelector = `form[data-form="${activeSection}"] button[type="submit"]`;
                        (document.querySelector(formSelector) as HTMLButtonElement | null)?.click();
                    }}
                >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    Lưu
                </button>
            </div>
        </div>
    );
}
