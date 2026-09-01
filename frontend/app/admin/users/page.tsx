'use client';

import React, { useState, useEffect } from 'react';
import {
    Search,
    Mail,
    Trash2,
    Calendar,
    Phone,
    Lock,
    Unlock,
    ShieldAlert,
    ShieldCheck,
    UserPlus,
    X,
    Eye,
    EyeOff,
    Check,
    Users,
    KeyRound,
    UserCheck,
    RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

type UserRole = 'admin' | 'user';

interface UserData {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    phone?: string;
    address?: string;
    isLocked?: boolean;
    createdAt?: string;
}

const ROLE_LABELS: Record<UserRole, { label: string; color: string; badge: string }> = {
    admin: {
        label: 'Quản trị viên',
        color: 'text-slate-900 bg-slate-100 border-slate-200',
        badge: 'Admin'
    },
    user: {
        label: 'Khách hàng',
        color: 'text-slate-700 bg-white border-slate-200',
        badge: 'Khách hàng'
    }
};

export default function AdminUsers() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

    // Modal state for creating new admin/user
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'admin' as UserRole,
        address: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [creating, setCreating] = useState(false);

    // Modal state for deletion protection
    const [policyModalUser, setPolicyModalUser] = useState<UserData | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            if (data.success) setUsers(data.users || []);
        } catch (error) {
            console.error('Fetch users error:', error);
            toast.error('Lỗi khi tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Tạo tài khoản quản trị viên / nhân viên mới
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()) {
            toast.error('Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu');
            return;
        }

        try {
            setCreating(true);
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createForm)
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || 'Tạo tài khoản thành công!');
                setShowCreateModal(false);
                setCreateForm({
                    name: '',
                    email: '',
                    password: '',
                    phone: '',
                    role: 'admin',
                    address: ''
                });
                fetchUsers();
            } else {
                toast.error(data.message || 'Lỗi khi tạo tài khoản');
            }
        } catch (err: any) {
            console.error(err);
            toast.error('Không thể kết nối máy chủ');
        } finally {
            setCreating(false);
        }
    };

    const handleToggleLock = async (user: UserData) => {
        const nextState = !user.isLocked;
        try {
            const res = await fetch('/api/admin/users/lock', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: user.id, isLocked: nextState })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || (nextState ? 'Đã khóa tài khoản thành công!' : 'Đã mở khóa tài khoản thành công!'));
                setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isLocked: nextState } : u));
                setPolicyModalUser(null);
            } else {
                toast.error(data.message || 'Lỗi cập nhật trạng thái khóa');
            }
        } catch (err) {
            console.error(err);
            toast.error('Không thể kết nối máy chủ');
        }
    };

    const handleUpdateRole = async (id: string, newRole: UserRole) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, role: newRole })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Cập nhật vai trò người dùng thành công');
                setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
            } else {
                toast.error(data.message || 'Lỗi cập nhật vai trò');
            }
        } catch (err) {
            console.error(err);
            toast.error('Lỗi cập nhật vai trò');
        }
    };

    const filteredUsers = users.filter(u => {
        const matchSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.phone && u.phone.includes(searchTerm));
        const matchRole = roleFilter === 'all' || u.role === roleFilter;
        return matchSearch && matchRole;
    });

    // Thống kê nhanh
    const totalAdmins = users.filter(u => u.role === 'admin').length;
    const totalCustomers = users.filter(u => u.role === 'user').length;
    const totalLocked = users.filter(u => u.isLocked).length;

    return (
        <div className="space-y-6">
            {/* Header & Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                        <div className="p-2 bg-slate-100 text-slate-900 rounded-xl">
                            <Users size={20} />
                        </div>
                        Quản lý Người Dùng & Phân Quyền
                    </h3>
                    <p className="text-slate-500 text-xs sm:text-sm mt-1">
                        Quản lý tài khoản khách hàng, tạo tài khoản Quản trị viên mới, phân quyền vai trò và bảo vệ tài khoản.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={fetchUsers}
                        disabled={loading}
                        className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors shadow-2xs flex items-center justify-center cursor-pointer"
                        title="Làm mới danh sách"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
                    >
                        <UserPlus size={15} />
                        Thêm Quản trị viên
                    </button>
                </div>
            </div>

            {/* Quick Stat Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                    <p className="text-xs text-slate-500 font-medium">Tổng người dùng</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{users.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                    <p className="text-xs text-slate-500 font-medium">Quản trị viên (Admin)</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{totalAdmins}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                    <p className="text-xs text-slate-500 font-medium">Khách hàng (User)</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{totalCustomers}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                    <p className="text-xs text-slate-500 font-medium">Tài khoản bị khóa</p>
                    <p className="text-2xl font-bold text-rose-600 mt-1">{totalLocked}</p>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
                    {[
                        { key: 'all', label: 'Tất cả' },
                        { key: 'admin', label: `Quản trị viên (${totalAdmins})` },
                        { key: 'user', label: `Khách hàng (${totalCustomers})` }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setRoleFilter(tab.key as any)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                                roleFilter === tab.key
                                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-80">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm theo tên, email, SĐT..."
                        className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold">
                                <th className="px-5 py-3.5">Người dùng</th>
                                <th className="px-5 py-3.5">Liên hệ</th>
                                <th className="px-5 py-3.5">Trạng thái</th>
                                <th className="px-5 py-3.5">Vai trò (Phân quyền)</th>
                                <th className="px-5 py-3.5">Ngày tạo</th>
                                <th className="px-5 py-3.5 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse h-16 bg-slate-50/40">
                                        <td colSpan={6} className="px-5 py-3.5"></td>
                                    </tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-10 text-center text-slate-400">
                                        Không tìm thấy người dùng phù hợp
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => {
                                    const isSystemAdmin = user.email?.toLowerCase().trim() === 'ntphau21@gmail.com';

                                    return (
                                        <tr key={user.id} className={`hover:bg-slate-50/80 transition-colors group ${user.isLocked ? 'bg-rose-50/20' : ''}`}>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                                        user.isLocked 
                                                            ? 'bg-rose-100 text-rose-700' 
                                                            : user.role === 'admin'
                                                            ? 'bg-slate-900 text-white'
                                                            : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-1">{user.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-mono uppercase">{user.id}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-700">
                                                        <Mail size={12} className="text-slate-400" />
                                                        {user.email}
                                                    </div>
                                                    {user.phone && (
                                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                                            <Phone size={11} className="text-slate-400" />
                                                            {user.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-5 py-3.5">
                                                {user.isLocked ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                                                        <Lock size={10} /> Đã khóa
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        ● Hoạt động
                                                    </span>
                                                )}
                                            </td>

                                            {/* Role & Role Selector (Clean Enterprise Dropdown) */}
                                            <td className="px-5 py-3.5">
                                                {isSystemAdmin ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 text-white shadow-2xs">
                                                        <ShieldCheck size={13} className="text-amber-400" />
                                                        Quản trị viên cấp cao
                                                    </span>
                                                ) : (
                                                    <select
                                                        value={user.role === 'admin' ? 'admin' : 'user'}
                                                        onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
                                                        className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors cursor-pointer shadow-2xs"
                                                    >
                                                        <option value="admin">Quản trị viên (Admin)</option>
                                                        <option value="user">Khách hàng (User)</option>
                                                    </select>
                                                )}
                                            </td>

                                            {/* Created At */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                    <Calendar size={12} className="text-slate-400" />
                                                    {user.createdAt ? format(new Date(user.createdAt), 'dd/MM/yyyy') : '---'}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-3.5 text-center">
                                                {!isSystemAdmin && (
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        {/* Lock/Unlock Button */}
                                                        <button
                                                            onClick={() => handleToggleLock(user)}
                                                            className={`px-2.5 py-1 rounded-lg transition-colors font-medium text-xs flex items-center gap-1 cursor-pointer ${
                                                                user.isLocked
                                                                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                                                                }`}
                                                            title={user.isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                                                        >
                                                            {user.isLocked ? (
                                                                <>
                                                                    <Unlock size={12} /> Mở khóa
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Lock size={12} /> Khóa
                                                                </>
                                                            )}
                                                        </button>

                                                        {/* Deletion Warning Trigger */}
                                                        <button
                                                            onClick={() => setPolicyModalUser(user)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                            title="Chính sách bảo vệ tài khoản"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── MODAL: THÊM QUẢN TRỊ VIÊN / TÀI KHOẢN MỚI ── */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-xl relative border border-slate-100"
                        >
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>

                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2.5 bg-slate-100 text-slate-900 rounded-xl">
                                    <UserPlus size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-slate-900">Thêm Quản Trị Viên</h3>
                                    <p className="text-xs text-slate-500">Khởi tạo tài khoản quản trị hệ thống mới</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateUser} className="space-y-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Họ và tên <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.name}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Ví dụ: Nguyễn Văn Quản Trị"
                                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-slate-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Email đăng nhập <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={createForm.email}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="admin@havenstore.vn"
                                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-slate-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Mật khẩu khởi tạo <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={createForm.password}
                                            onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                                            placeholder="Tối thiểu 6 ký tự"
                                            className="w-full px-3 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-slate-900"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Số điện thoại
                                    </label>
                                    <input
                                        type="text"
                                        value={createForm.phone}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                                        placeholder="0901234567"
                                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-slate-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Vai trò (Quyền hạn) <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={createForm.role}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
                                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-900"
                                    >
                                        <option value="admin">Quản trị viên (Admin)</option>
                                        <option value="user">Khách hàng (User)</option>
                                    </select>
                                </div>

                                <div className="flex gap-2.5 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                                    >
                                        {creating ? 'Đang tạo...' : 'Tạo tài khoản'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── MODAL: CHÍNH SÁCH BẢO VỆ DỮ LIỆU (THAY VÌ XÓA) ── */}
            {policyModalUser && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-3.5 shadow-xl border border-slate-100">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
                                <ShieldAlert size={20} className="text-rose-600" />
                                <span>Chính Sách Bảo Vệ Dữ Liệu</span>
                            </div>
                            <button
                                onClick={() => setPolicyModalUser(null)}
                                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-2.5">
                            <p className="text-xs text-slate-600 leading-relaxed bg-amber-50 p-3 rounded-xl border border-amber-200/70 text-amber-900 font-medium">
                                Để bảo vệ tính toàn vẹn của báo cáo doanh thu & lịch sử đơn hàng, hệ thống <strong>không xóa vĩnh viễn</strong> tài khoản người dùng.
                            </p>
                            <p className="text-xs text-slate-500">
                                Bạn có muốn chuyển tài khoản <strong className="text-slate-900">{policyModalUser.name} ({policyModalUser.email})</strong> sang trạng thái <strong>Khóa truy cập</strong> không?
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-2">
                            <button
                                onClick={() => setPolicyModalUser(null)}
                                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={() => handleToggleLock(policyModalUser)}
                                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                                <Lock size={13} /> Khóa tài khoản
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
