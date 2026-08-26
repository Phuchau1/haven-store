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
    X
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface UserData {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
    phone?: string;
    isLocked?: boolean;
    createdAt?: string;
}

export default function AdminUsers() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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
                toast.success(data.message || (nextState ? '🔒 Đã khóa tài khoản thành công!' : '🔓 Đã mở khóa tài khoản thành công!'));
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

    const handleUpdateRole = async (id: string, newRole: 'admin' | 'user') => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, role: newRole })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Cập nhật quyền người dùng thành công');
                setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
            } else {
                toast.error(data.message || 'Lỗi cập nhật quyền');
            }
        } catch (err) {
            console.error(err);
            toast.error('Lỗi cập nhật quyền');
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-slate-900">Quản lý người dùng & Khóa tài khoản</h3>
                    <p className="text-slate-500 text-sm mt-1">Quản lý tài khoản khách hàng, khóa/mở khóa truy cập và phân quyền.</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Tìm theo tên hoặc email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50 bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Người dùng</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Liên hệ</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Trạng thái</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Vai trò</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Ngày tạo</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse h-20 bg-slate-50/20">
                                        <td colSpan={6} className="px-6 py-6"></td>
                                    </tr>
                                ))
                            ) : (
                                filteredUsers.map((user) => {
                                    const isSystemAdmin = user.email?.toLowerCase().trim() === 'ntphau21@gmail.com';
                                    return (
                                        <tr key={user.id} className={`hover:bg-slate-50/80 transition-colors group ${user.isLocked ? 'bg-rose-50/20' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border ${
                                                        user.isLocked 
                                                            ? 'bg-rose-100 text-rose-700 border-rose-200' 
                                                            : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                                    }`}>
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 line-clamp-1">{user.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{user.id}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                                        <Mail size={12} className="text-slate-400" />
                                                        {user.email}
                                                    </div>
                                                    {user.phone && (
                                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                                            <Phone size={12} className="text-slate-400" />
                                                            {user.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-6 py-4">
                                                {user.isLocked ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                        <Lock size={10} /> ĐÃ KHÓA
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        ● HOẠT ĐỘNG
                                                    </span>
                                                )}
                                            </td>

                                            {/* Role */}
                                            <td className="px-6 py-4">
                                                {isSystemAdmin ? (
                                                    <span className="px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200">
                                                        ADMIN MẶC ĐỊNH
                                                    </span>
                                                ) : (
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleUpdateRole(user.id, e.target.value as 'admin' | 'user')}
                                                        className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border-none focus:ring-2 focus:ring-indigo-500/20 ${user.role === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}
                                                    >
                                                        <option value="user">USER</option>
                                                        <option value="admin">ADMIN</option>
                                                    </select>
                                                )}
                                            </td>

                                            {/* Created At */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Calendar size={14} className="text-slate-400" />
                                                    {user.createdAt ? format(new Date(user.createdAt), 'dd/MM/yyyy') : '---'}
                                                </div>
                                            </td>

                                            {/* Actions: Lock & Policy Delete Modal */}
                                            <td className="px-6 py-4 text-center">
                                                {!isSystemAdmin && (
                                                    <div className="flex items-center justify-center gap-2">
                                                        {/* Lock/Unlock Button */}
                                                        <button
                                                            onClick={() => handleToggleLock(user)}
                                                            className={`p-2 rounded-xl transition-all font-bold text-xs flex items-center gap-1 ${
                                                                user.isLocked
                                                                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                                                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                                            }`}
                                                            title={user.isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                                                        >
                                                            {user.isLocked ? (
                                                                <>
                                                                    <Unlock size={14} /> Mở khóa
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Lock size={14} /> Khóa
                                                                </>
                                                            )}
                                                        </button>

                                                        {/* Deletion Warning Trigger */}
                                                        <button
                                                            onClick={() => setPolicyModalUser(user)}
                                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                            title="Thao tác xóa (Chính sách Bảo vệ Data)"
                                                        >
                                                            <Trash2 size={16} />
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

            {/* Data Protection Policy Modal */}
            {policyModalUser && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
                                <ShieldAlert size={22} />
                                <span>Chính Sách Bảo Vệ Dữ Liệu</span>
                            </div>
                            <button
                                onClick={() => setPolicyModalUser(null)}
                                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs text-slate-600 leading-relaxed bg-amber-50 p-3.5 rounded-2xl border border-amber-200/70 text-amber-900 font-medium">
                                ⚠️ Để bảo vệ tính toàn vẹn của báo cáo doanh thu & lịch sử đơn hàng, hệ thống <strong>KHÔNG CHO PHÉP XÓA VĨNH VIỄN</strong> tài khoản người dùng.
                            </p>
                            <p className="text-xs text-slate-500">
                                Bạn có muốn chuyển tài khoản <strong className="text-slate-900">{policyModalUser.name} ({policyModalUser.email})</strong> sang trạng thái <strong>KHÓA TRUY CẬP</strong> ngay bây giờ không?
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setPolicyModalUser(null)}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={() => handleToggleLock(policyModalUser)}
                                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                            >
                                <Lock size={14} /> Khóa tài khoản ngay
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
