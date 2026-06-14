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

// Component Chi tiết đơn hàng mới
const OrderDetailView = ({ order, onBack, onCancel, onRebuy, onRate }: { order: OrderData, onBack: () => void, onCancel: (id: string) => void, onRebuy: (order: OrderData) => void, onRate: (id: string) => void }) => {
    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return 'Chờ xử lý';
            case 'processing': return 'Đang chuẩn bị';
            case 'shipped': return 'Đang giao hàng';
            case 'delivered': return 'Hoàn thành';
            case 'cancelled': return 'Đã hủy';
            default: return status;
        }
    };
    
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'shipped': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'delivered': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getTimelineIndex = (status: string) => {
        if (status === 'cancelled') return -1;
        const mapping: Record<string, number> = { 'pending': 0, 'processing': 1, 'shipped': 2, 'delivered': 3 };
        return mapping[status] ?? 0;
    };

    const timelineIndex = getTimelineIndex(order.status);
    const steps = [
        { key: 'pending', title: 'Đã đặt hàng' },
        { key: 'processing', title: 'Đang xử lý' },
        { key: 'shipped', title: 'Đang giao hàng' },
        { key: 'delivered', title: 'Đã giao hàng' }
    ];

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <h3 className="text-2xl font-bold text-slate-900">Chi tiết đơn hàng #{order.id}</h3>
                <button 
                    onClick={onBack}
                    className="px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                >
                    Quay lại danh sách
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Info Block */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h4 className="font-bold text-slate-900 text-lg">Thông tin đơn hàng</h4>
                            <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase border ${getStatusStyle(order.status)}`}>
                                {getStatusText(order.status)}
                            </span>
                        </div>
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-5">
                                <div>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Ngày đặt hàng</p>
                                    <p className="text-sm font-medium text-slate-800">{new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Phương thức thanh toán</p>
                                    <p className="text-sm font-medium text-slate-800">
                                        {order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 
                                         order.paymentMethod === 'momo' ? 'Ví điện tử MoMo' : 
                                         order.paymentMethod === 'vnpay' ? 'Ví VNPAY' : 'Chuyển khoản'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Tổng tiền</p>
                                    <p className="text-sm font-bold text-rose-600">{formatPrice(order.totalAmount)}</p>
                                </div>
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Địa chỉ giao hàng</p>
                                    <p className="text-sm font-medium text-slate-800">{order.address}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Số điện thoại</p>
                                    <p className="text-sm font-medium text-slate-800">{order.phone}</p>
                                </div>
                                {order.status === 'pending' && (
                                    <div className="pt-2">
                                        <button 
                                            onClick={() => onCancel(order.id ?? '')}
                                            className="px-4 py-2 bg-rose-500 text-white rounded-lg text-xs font-bold hover:bg-rose-600 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                                        >
                                            Hủy đơn hàng
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Products Block */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h4 className="font-bold text-slate-900 text-lg">Sản phẩm</h4>
                        </div>
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-slate-100 text-xs text-slate-900 font-bold">
                                            <th className="pb-3 min-w-[200px]">Sản phẩm</th>
                                            <th className="pb-3">Giá</th>
                                            <th className="pb-3">Số lượng</th>
                                            <th className="pb-3 text-right">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {order.items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 pr-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-16 h-16 relative rounded-xl bg-slate-50 flex-shrink-0 border border-slate-100 overflow-hidden shadow-sm">
                                                            <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800 hover:text-indigo-600 transition-colors cursor-pointer line-clamp-2">{item.product.name}</p>
                                                            <p className="text-xs text-slate-500 mt-1">{item.selectedSize} | {item.selectedColor.name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-sm font-medium text-slate-600">{formatPrice(item.product.price)}</td>
                                                <td className="py-4 text-sm font-medium text-slate-600">{item.quantity}</td>
                                                <td className="py-4 text-sm font-bold text-slate-800 text-right">{formatPrice(item.product.price * item.quantity)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 border-slate-100 bg-slate-50/30">
                                            <td colSpan={3} className="py-4 text-right font-bold text-sm text-slate-900">Tổng cộng:</td>
                                            <td className="py-4 text-right font-bold text-base text-rose-600">{formatPrice(order.totalAmount)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Timeline */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h4 className="font-bold text-slate-900 text-lg">Theo dõi đơn hàng</h4>
                        </div>
                        <div className="p-6">
                            {order.status === 'cancelled' ? (
                                <div className="flex flex-col items-center justify-center py-6 text-center">
                                    <XCircle size={48} className="text-rose-400 mb-3" />
                                    <p className="text-lg font-bold text-rose-600">Đơn hàng đã bị hủy</p>
                                    <p className="text-sm text-slate-500 mt-1">Đơn hàng này không còn hiệu lực.</p>
                                </div>
                            ) : (
                                <div className="relative pl-6 space-y-10 py-2">
                                    {/* Vertical Line */}
                                    <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-slate-100"></div>
                                    
                                    {steps.map((step, idx) => {
                                        const isCompleted = timelineIndex >= idx;
                                        return (
                                            <div key={step.key} className="relative group">
                                                {/* Node */}
                                                <div className={`absolute -left-[30px] w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow-sm transition-colors duration-300
                                                    ${isCompleted ? 'bg-emerald-500 scale-110' : 'bg-slate-200'}`}
                                                ></div>
                                                
                                                <div className="pl-4">
                                                    <p className={`text-sm font-bold transition-colors ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>{step.title}</p>
                                                    {isCompleted && (
                                                        <motion.p 
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            className="text-[11px] font-medium text-slate-500 mt-1"
                                                        >
                                                            {idx === 0 ? new Date(order.createdAt).toLocaleString('vi-VN') : 'Cập nhật hệ thống'}
                                                        </motion.p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Support Block */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h4 className="font-bold text-slate-900 text-lg">Hỗ trợ</h4>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-slate-600 leading-relaxed mb-4">
                                Nếu bạn có thắc mắc về đơn hàng, vui lòng liên hệ với chúng tôi:
                            </p>
                            <div className="space-y-3">
                                <p className="text-sm text-slate-900 flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <span className="text-slate-500 text-xs uppercase font-bold tracking-wider w-16">Hotline:</span> 
                                    <span className="font-bold text-indigo-600">1900 1234</span>
                                </p>
                                <p className="text-sm text-slate-900 flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <span className="text-slate-500 text-xs uppercase font-bold tracking-wider w-16">Email:</span> 
                                    <span className="font-bold text-indigo-600">support@phstore.vn</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default function NguoiDungPage() {
    const { user, logout, updateProfile } = useAuth();
    const { addItem } = useCart();
    const router = useRouter();
    const [activeMainTab, setActiveMainTab] = useState('orders');
    const [activeOrderTab, setActiveOrderTab] = useState('all');
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // State cho Chi tiết đơn hàng
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    // Form settings state
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || ''
    });

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

    const selectedOrder = orders.find(o => o.id === selectedOrderId);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50/50 pt-28 pb-20">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Nav */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-center">
                            <div className="relative inline-block">
                                <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-xl">
                                    {user.avatar ? (
                                        <Image src={user.avatar} alt={user.name} fill className="rounded-full object-cover" />
                                    ) : user.name?.[0].toUpperCase()}
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
                                    onClick={() => {
                                        setActiveMainTab(tab.id);
                                        setSelectedOrderId(null); // Reset detail view khi chuyển tab
                                    }}
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
                                <div key="orders" className="space-y-6">
                                    {selectedOrderId && selectedOrder ? (
                                        // VIEW: Chi tiết đơn hàng
                                        <OrderDetailView 
                                            order={selectedOrder} 
                                            onBack={() => setSelectedOrderId(null)}
                                            onCancel={handleCancelOrder}
                                            onRebuy={handleRebuy}
                                            onRate={handleRateOrder}
                                        />
                                    ) : (
                                        // VIEW: Danh sách đơn hàng
                                        <motion.div
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
                                                        <div key={order.id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all group">
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
                                                                {order.items.slice(0, 2).map((item, idx) => (
                                                                    <div key={idx} className="flex items-center gap-4">
                                                                        <div className="w-12 h-12 relative rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100">
                                                                            <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
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
                                                                {order.items.length > 2 && (
                                                                    <p className="text-[10px] text-slate-400 italic pl-16">+ {order.items.length - 2} sản phẩm khác</p>
                                                                )}
                                                            </div>

                                                            <div className="mt-6 pt-6 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                                                                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                                                                    {order.status === 'pending' && (
                                                                        <button onClick={() => handleCancelOrder(order.id ?? '')} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors flex-1 sm:flex-none">
                                                                            Hủy đơn
                                                                        </button>
                                                                    )}
                                                                    {(order.status === 'delivered' || order.status === 'cancelled') && (
                                                                        <button onClick={() => handleRebuy(order)} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors flex-1 sm:flex-none">
                                                                            Mua lại
                                                                        </button>
                                                                    )}
                                                                    {order.status === 'delivered' && (
                                                                        <button onClick={() => handleRateOrder(order.id ?? '')} className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors flex-1 sm:flex-none">
                                                                            Đánh giá
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                                                                    <p className="text-sm font-bold text-indigo-600">{formatPrice(order.totalAmount)}</p>
                                                                    <button 
                                                                        onClick={() => setSelectedOrderId(order.id ?? '')}
                                                                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-md hover:shadow-lg"
                                                                    >
                                                                        Chi tiết đơn hàng <ChevronRight size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </div>
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
