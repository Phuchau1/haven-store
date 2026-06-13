'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Package,
    Truck,
    CheckCircle2,
    XCircle,
    Clock,
    RefreshCcw,
    ChevronRight,
    Search,
    ShoppingBag,
    Settings,
    LogOut,
    Bell,
    Shield,
    CreditCard,
    MapPin,
    Save,
    Loader2
} from 'lucide-react';
import { useAuth } from '@/app/component/AuthContext';
import { useCart } from '@/app/component/CartContext';
import { useRouter } from 'next/navigation';
import { OrderData } from '@/types';
import { formatPrice } from '@/lib/format';
import Image from 'next/image';

// Helper: kiểm tra src hợp lệ trước khi dùng với Next.js Image
const isValidImageSrc = (src?: string | null): src is string => {
    if (!src || src.trim() === '') return false;
    if (src.startsWith('/')) return true;
    try {
        const url = new URL(src);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

const TABS = [
    { id: 'orders', label: 'Đơn hàng', icon: ShoppingBag },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
    { id: 'notifications', label: 'Thông báo', icon: Bell },
];

const ORDER_STATUS_TABS = [
    { id: 'all', label: 'Tất cả' },
    { id: 'pending', label: 'Chờ xử lý' },
    { id: 'processing', label: 'Đang chuẩn bị' },
    { id: 'shipped', label: 'Đang giao' },
    { id: 'delivered', label: 'Hoàn thành' },
];

export default function AccountPage() {
    const { user, logout, updateProfile } = useAuth();
    const { addItem } = useCart();
    const router = useRouter();
    const [activeMainTab, setActiveMainTab] = useState('orders');
    const [activeOrderTab, setActiveOrderTab] = useState('all');
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form settings state
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || ''
    });

    const [expandedOrders, setExpandedOrders] = useState<string[]>([]);

    const handleCancelOrder = async (orderId: string) => {
        if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;
        try {
            const res = await fetch('/api/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: orderId, status: 'cancelled' })
            });
            const data = await res.json();
            if (data.success) {
                setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
                alert('Đã hủy đơn hàng thành công');
            } else {
                alert('Lỗi: ' + data.message);
            }
        } catch (error) {
            alert('Đã có lỗi xảy ra');
        }
    };

    const handleRebuy = (order: OrderData) => {
        order.items.forEach(item => {
            for (let i = 0; i < item.quantity; i++) {
                addItem(item.product, item.selectedSize, item.selectedColor);
            }
        });
        alert('Đã thêm sản phẩm vào giỏ hàng!');
    };

    const handleRateOrder = (orderId: string) => {
        alert('Cảm ơn bạn đã đánh giá đơn hàng #' + orderId + '!');
    };

    const toggleOrderDetails = (orderId: string) => {
        setExpandedOrders(prev => prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]);
    };

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        const fetchOrders = async () => {
            try {
                const res = await fetch(`/api/orders?email=${user.email}`);
                const data = await res.json();
                if (data.success) {
                    setOrders(data.orders);
                }
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user, router]);

    const filteredOrders = activeOrderTab === 'all'
        ? orders
        : orders.filter(order => order.status === activeOrderTab);

    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setTimeout(() => {
            updateProfile(formData);
            setIsSaving(false);
            alert('Cập nhật hồ sơ thành công!');
        }, 800);
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'processing': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'shipped': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50/50 pt-28 pb-20">
            <div className="max-w-6xl mx-auto px-4">

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Sidebar Nav */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-center">
                            <div className="relative inline-block">
                                <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-xl">
                                    {user.name?.[0].toUpperCase()}
                                </div>
                                <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white" />
                            </div>
                            <h2 className="mt-4 font-bold text-slate-900 text-lg">{user.name}</h2>
                            <p className="text-xs text-slate-400 font-medium">Thành viên từ 2026</p>
                        </div>

                        <div className="bg-white rounded-3xl p-2 border border-slate-100 shadow-sm">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveMainTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeMainTab === tab.id
                                        ? 'bg-slate-900 text-white shadow-lg'
                                        : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            ))}
                            <div className="h-px bg-slate-50 my-2 mx-4" />
                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all"
                            >
                                <LogOut size={18} />
                                Đăng xuất
                            </button>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3">
                        <AnimatePresence mode="wait">
                            {activeMainTab === 'orders' && (
                                <motion.div
                                    key="orders"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <h3 className="text-xl font-bold text-slate-900">Lịch sử đơn hàng</h3>
                                        <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
                                            {ORDER_STATUS_TABS.map(tab => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setActiveOrderTab(tab.id)}
                                                    className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeOrderTab === tab.id
                                                        ? 'bg-indigo-600 text-white shadow-md'
                                                        : 'text-slate-500 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {tab.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {loading ? (
                                        <div className="space-y-4">
                                            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-3xl animate-pulse" />)}
                                        </div>
                                    ) : filteredOrders.length === 0 ? (
                                        <div className="bg-white rounded-3xl p-20 text-center border border-slate-100 shadow-sm">
                                            <ShoppingBag className="mx-auto text-slate-200 mb-4" size={48} />
                                            <p className="text-slate-500 font-medium">Bạn chưa có đơn hàng nào trong mục này</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {filteredOrders.map(order => (
                                                <div key={order.id || ''} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all group">
                                                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2.5 bg-slate-900 text-white rounded-xl">
                                                                <Package size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-900">#{order.id}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Đặt ngày {new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                                                            </div>
                                                        </div>
                                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase border ${getStatusStyle(order.status)}`}>
                                                            {order.status}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {(expandedOrders.includes(order.id || '') ? order.items : order.items.slice(0, 2)).map((item, idx) => (
                                                            <div key={idx} className="flex items-center gap-4">
                                                                <div className="w-12 h-12 relative rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100">
                                                                    {isValidImageSrc(item.product.images[0]) && (
                                                                        <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-bold text-slate-800 truncate">{item.product.name}</p>
                                                                    <p className="text-[10px] text-slate-400 mt-1">{item.selectedSize} | {item.selectedColor.name} | x{item.quantity}</p>
                                                                </div>
                                                                <div className="text-xs font-bold text-slate-900">
                                                                    {formatPrice(item.product.price * item.quantity)}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {!expandedOrders.includes(order.id || '') && order.items.length > 2 && (
                                                            <p className="text-[10px] text-slate-400 italic pl-16">+ {order.items.length - 2} sản phẩm khác</p>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Expanded details */}
                                                    {expandedOrders.includes(order.id || '') && (
                                                        <div className="mt-4 pt-4 border-t border-slate-50 space-y-2 text-xs text-slate-600">
                                                            <div className="flex justify-between">
                                                                <span>Tên người nhận:</span>
                                                                <span className="font-medium text-slate-900">{order.customerName}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Số điện thoại:</span>
                                                                <span className="font-medium text-slate-900">{order.phone}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Địa chỉ giao hàng:</span>
                                                                <span className="font-medium text-slate-900 text-right w-2/3">{order.address}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Phương thức thanh toán:</span>
                                                                <span className="font-medium text-slate-900">{order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng'}</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="mt-6 pt-6 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                                                        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                                                            {order.status === 'pending' && (
                                                                <button onClick={() => handleCancelOrder(order.id || '')} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors flex-1 sm:flex-none">
                                                                    Hủy đơn
                                                                </button>
                                                            )}
                                                            {(order.status === 'delivered' || order.status === 'cancelled') && (
                                                                <button onClick={() => handleRebuy(order)} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors flex-1 sm:flex-none">
                                                                    Mua lại
                                                                </button>
                                                            )}
                                                            {order.status === 'delivered' && (
                                                                <button onClick={() => handleRateOrder(order.id || '')} className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors flex-1 sm:flex-none">
                                                                    Đánh giá
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                                                            <p className="text-sm font-bold text-indigo-600">{formatPrice(order.totalAmount)}</p>
                                                            <button 
                                                                onClick={() => toggleOrderDetails(order.id || '')}
                                                                className="flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                                                            >
                                                                {expandedOrders.includes(order.id || '') ? 'Thu gọn' : 'Chi tiết đơn hàng'} <ChevronRight size={14} className={`transform transition-transform ${expandedOrders.includes(order.id || '') ? 'rotate-90' : ''}`} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeMainTab === 'settings' && (
                                <motion.div
                                    key="settings"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8"
                                >
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                            <Settings size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900">Cấu hình hồ sơ</h3>
                                            <p className="text-xs text-slate-400 mt-1">Cập nhật thông tin cá nhân và địa chỉ giao hàng của bạn.</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Họ và tên</label>
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full px-5 py-4 bg-slate-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium"
                                                    placeholder="Nhập họ tên..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                                                <input
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    className="w-full px-5 py-4 bg-slate-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium"
                                                    placeholder="09xx xxx xxx"
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Địa chỉ giao hàng</label>
                                                <textarea
                                                    rows={3}
                                                    value={formData.address}
                                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                    className="w-full px-5 py-4 bg-slate-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium resize-none"
                                                    placeholder="Nhập địa chỉ nhận hàng chi tiết..."
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-6 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={isSaving}
                                                className="flex items-center gap-2 px-10 py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                                            >
                                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                                Lưu thay đổi
                                            </button>
                                        </div>
                                    </form>

                                    <div className="mt-12 pt-8 border-t border-slate-50 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                            <Shield className="text-emerald-500" size={20} />
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-900 uppercase">Bảo mật</p>
                                                <p className="text-[9px] text-slate-400">Đã xác thực 2FA</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                            <CreditCard className="text-indigo-500" size={20} />
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-900 uppercase">Phương thức</p>
                                                <p className="text-[9px] text-slate-400">1 thẻ đang liên kết</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                            <MapPin className="text-rose-500" size={20} />
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-900 uppercase">Địa chỉ</p>
                                                <p className="text-[9px] text-slate-400">2 địa chỉ đã lưu</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeMainTab === 'notifications' && (
                                <motion.div
                                    key="notifications"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center py-20"
                                >
                                    <Bell className="mx-auto text-slate-200 mb-4" size={48} />
                                    <p className="text-slate-500 font-medium">Bạn không có thông báo mới nào</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
