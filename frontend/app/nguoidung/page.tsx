'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package,
    XCircle,
    ChevronRight,
    ShoppingBag,
    Settings,
    LogOut,
    Bell,
    Shield,
    CreditCard,
    MapPin,
    Save,
    Loader2,
    Star,
    RotateCcw,
    Truck,
    CheckCircle2,
    AlertTriangle,
    Navigation,
    Clock,
    PackageCheck,
    PackageX,
    Ticket,
    Copy,
    Check
} from 'lucide-react';
import { useAuth } from '@/app/component/AuthContext';
import { useCart } from '@/app/component/CartContext';
import { useRouter } from 'next/navigation';
import { OrderData } from '@/types';
import { formatPrice } from '@/lib/format';
import Image from 'next/image';
import AddressManager from './AddressManager';
import ChangePasswordModal from './ChangePasswordModal';
import { useCartStore } from '@/app/store/useCartStore';
import ReviewModal from '@/app/component/ReviewModal';
import { useToast } from '@/app/component/ToastProvider';

interface ExtendedOrder extends Omit<OrderData, 'finalAmount'> {
    discountAmount?: number;
    couponCode?: string;
    finalAmount?: number;
}

const TABS = [
    { id: 'orders', label: 'Đơn hàng', icon: ShoppingBag },
    { id: 'wallet', label: 'Ví HAVEN (Số dư)', icon: CreditCard },
    { id: 'vouchers', label: 'Ví Voucher của tôi', icon: Ticket },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
    { id: 'notifications', label: 'Thông báo', icon: Bell },
];

const ORDER_STATUS_TABS = [
    { id: 'all',        label: 'Tất cả' },
    { id: 'pending',    label: 'Chờ xác nhận' },
    { id: 'processing', label: 'Đang xử lý' },
    { id: 'shipping',   label: 'Đang vận chuyển' },
    { id: 'delivered',  label: 'Hoàn thành' },
    { id: 'return',     label: 'Hoàn hàng' },
    { id: 'cancelled',  label: 'Đã hủy' },
];

// Map combined statuses for filtering
const STATUS_GROUP_MAP: Record<string, string[]> = {
    all:        [],
    pending:    ['pending'],
    processing: ['confirmed', 'processing', 'waiting_pickup', 'picked_up'],
    shipping:   ['in_transit', 'out_for_delivery', 'shipped'],
    delivered:  ['delivered', 'completed', 'awaiting_review', 'reviewed'],
    return:     ['return_requested', 'returning', 'return_received', 'refunded'],
    cancelled:  ['cancelled', 'delivery_failed', 'returned_to_seller'],
};

// Component Chi tiết đơn hàng mới
const OrderDetailView = ({ order, onBack, onCancel, onRebuy, onRate, onReturn }: { order: OrderData, onBack: () => void, onCancel: (id: string) => void, onRebuy: (order: OrderData) => void, onRate: (order: OrderData) => void, onReturn: (order: OrderData) => void }) => {
    const getStatusText = (status: string) => {
        const map: Record<string,string> = {
            pending: 'Chờ xác nhận',
            confirmed: 'Đã xác nhận',
            processing: 'Đang chuẩn bị / Đóng gói',
            waiting_pickup: 'Chờ vận chuyển lấy hàng',
            picked_up: 'Đã lấy hàng',
            in_transit: 'Đang vận chuyển',
            out_for_delivery: 'Đang giao đến bạn',
            delivered: 'Giao hàng thành công ✓',
            completed: 'Hoàn tất',
            awaiting_review: 'Chờ đánh giá',
            reviewed: 'Đã đánh giá',
            return_requested: '⏳ Chờ Admin duyật hoàn',
            returning: 'Đang gửi hàng trả',
            return_received: 'Shop đã nhận hàng trả',
            refunded: 'Đã hoàn tiền',
            cancelled: 'Đã hủy',
            delivery_failed: 'Giao hàng thất bại',
            returned_to_seller: 'Hàng hoàn về shop',
            dispute: 'Đang khiếu nại',
            refund_requested: 'Yêu cầu hoàn tiền',
            shipped: 'Đang vận chuyển',
        };
        return map[status] || status;
    };

    const getStatusStyle = (status: string) => {
        const map: Record<string,string> = {
            pending: 'bg-amber-100 text-amber-700 border-amber-200',
            confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
            processing: 'bg-indigo-100 text-indigo-700 border-indigo-200',
            waiting_pickup: 'bg-violet-100 text-violet-700 border-violet-200',
            picked_up: 'bg-cyan-100 text-cyan-700 border-cyan-200',
            in_transit: 'bg-sky-100 text-sky-700 border-sky-200',
            out_for_delivery: 'bg-orange-100 text-orange-700 border-orange-200',
            delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            awaiting_review: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            reviewed: 'bg-green-100 text-green-700 border-green-200',
            return_requested: 'bg-amber-100 text-amber-800 border-amber-300',
            returning: 'bg-orange-100 text-orange-700 border-orange-200',
            return_received: 'bg-teal-100 text-teal-700 border-teal-200',
            refunded: 'bg-green-100 text-green-700 border-green-200',
            cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
            delivery_failed: 'bg-red-100 text-red-700 border-red-200',
            returned_to_seller: 'bg-slate-100 text-slate-700 border-slate-200',
            dispute: 'bg-purple-100 text-purple-700 border-purple-200',
            refund_requested: 'bg-orange-100 text-orange-700 border-orange-200',
            shipped: 'bg-sky-100 text-sky-700 border-sky-200',
        };
        return map[status] || 'bg-slate-100 text-slate-700 border-slate-200';
    };

    // Timeline 5 mốc chính gọn gàng
    const MAIN_TIMELINE_STEPS = [
        { key: 'pending',    label: 'Đặt hàng thành công', icon: Clock },
        { key: 'processing', label: 'Đang chuẩn bị hàng',  icon: Package },
        { key: 'picked_up',  label: 'Đơn vị đã lấy hàng',  icon: PackageCheck },
        { key: 'in_transit', label: 'Đang vận chuyển',   icon: Truck },
        { key: 'delivered',  label: 'Giao thành công',     icon: CheckCircle2 },
    ];

    const getStepStatusIndex = (status: string) => {
        if (['delivered', 'completed', 'awaiting_review', 'reviewed'].includes(status)) return 4;
        if (['in_transit', 'out_for_delivery', 'shipped'].includes(status)) return 3;
        if (['waiting_pickup', 'picked_up'].includes(status)) return 2;
        if (['confirmed', 'processing'].includes(status)) return 1;
        return 0;
    };
    const currentIdx = getStepStatusIndex(order.status);

    const orderExt = order as any;
    const shippingTimeline: any[] = orderExt.shippingTimeline || [];
    const hasCarrier = !!(orderExt.trackingNumber || orderExt.carrierCode);
    const isCancelled = ['cancelled','delivery_failed','returned_to_seller','dispute'].includes(order.status);
    const isReturn = ['return_requested','returning','return_received','refunded','refund_requested'].includes(order.status);

    // Bản đồ mốc vận chuyển trực quan (Chiều Giao Hàng & Chiều Hoàn Hàng)
    const FORWARD_MAP_NODES = [
        { id: 'shop',    label: 'Kho HAVEN',      desc: 'Xuất kho & Đóng gói',   emoji: '🏬' },
        { id: 'hcm',     label: 'Hub Khai Thác',  desc: 'Phân loại tự động',     emoji: '🏢' },
        { id: 'transit', label: 'Trung Chuyển',   desc: 'Vận chuyển liên tỉnh',  emoji: '🚛' },
        { id: 'local',   label: 'Bưu Cục Phát',   desc: 'Đang giao đến bạn',     emoji: '🛵' },
        { id: 'home',    label: 'Địa Chỉ Nhận',   desc: 'Giao hàng thành công',  emoji: '🏠' },
    ];

    const RETURN_MAP_NODES = [
        { id: 'client',  label: 'Khách Gửi Trả',  desc: 'Tạo yêu cầu hoàn trả',  emoji: '📦' },
        { id: 'courier', label: 'Shipper Lấy',   desc: 'Trung chuyển về shop',  emoji: '🛵' },
        { id: 'hub',     label: 'Hub Phân Loại',  desc: 'Kiểm kê kiện hàng',     emoji: '🏢' },
        { id: 'seller',  label: 'Kho Shop HAVEN', desc: 'Shop nhận hàng về kho', emoji: '🏬' },
        { id: 'wallet',  label: 'Ví HAVEN Pay',   desc: 'Hoàn tiền thành công',  emoji: '💳' },
    ];

    const MAP_NODES = isReturn ? RETURN_MAP_NODES : FORWARD_MAP_NODES;

    const returnStepMap: Record<string, number> = {
        return_requested: 0,
        returning: 1,
        return_received: 3,
        refunded: 4
    };

    const mapStep = isReturn
        ? (returnStepMap[order.status as string] ?? 1)
        : Math.min(
            (order.status as string) === 'delivered' || (order.status as string) === 'completed'
                ? 4
                : shippingTimeline.length > 0
                    ? Math.min(Math.floor((shippingTimeline.length / 5) * 4), 3)
                    : ['shipped', 'in_transit', 'out_for_delivery'].includes(order.status as string)
                        ? 2
                        : ['processing', 'picked_up', 'waiting_pickup'].includes(order.status as string)
                            ? 1
                            : 0,
            4
        );

    const timelineIndex = Math.max(0, MAIN_TIMELINE_STEPS.findIndex(s => s.key === order.status));
    const steps = MAIN_TIMELINE_STEPS;

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
                                        {order.paymentMethod === 'pay-cod' || order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 
                                         order.paymentMethod === 'momo' ? 'Ví điện tử MoMo' : 
                                         order.paymentMethod === 'vnpay' ? 'Ví VNPAY' : 'Chuyển khoản'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Tổng tiền</p>
                                    {((order as ExtendedOrder).discountAmount ?? 0) > 0 && (
                                        <p className="text-xs text-slate-400 line-through">{formatPrice(order.totalAmount)}</p>
                                    )}
                                    <p className="text-sm font-bold text-rose-600">{formatPrice((order as ExtendedOrder).finalAmount || order.totalAmount)}</p>
                                    {(order as ExtendedOrder).couponCode && (
                                        <p className="text-[10px] text-emerald-600 mt-0.5">🎟 {(order as ExtendedOrder).couponCode}</p>
                                    )}
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
                            </div>
                        </div>

                        {/* Full-width Dedicated Action Bar */}
                        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                            <span className="text-xs font-semibold text-slate-500 hidden md:block">
                                Thao tác với đơn hàng #{order.id}:
                            </span>
                            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto ml-auto">
                                {(order.status === 'pending' || order.status === 'processing') && (
                                    <button 
                                        onClick={() => onCancel(order.id ?? '')}
                                        className="px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 hover:border-rose-300 transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                                    >
                                        <XCircle size={14} className="text-rose-500" /> Hủy đơn hàng
                                    </button>
                                )}
                                {order.status === 'delivered' && (!order.returnRequest || order.returnRequest.status === 'none') && (
                                    <button 
                                        onClick={() => onReturn(order)}
                                        className="px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 hover:border-rose-300 transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                                    >
                                        <RotateCcw size={14} className="text-rose-500" /> Hoàn hàng / Trả hàng
                                    </button>
                                )}
                                {order.status === 'returning' && (
                                    <span className="px-4 py-2.5 bg-orange-50 border border-orange-200 text-orange-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                                        🚚 Đang hoàn hàng — Vui lòng gửi hàng về shop
                                    </span>
                                )}
                                {order.status === 'return_received' && (
                                    <span className="px-4 py-2.5 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                                        📦 Shop đã nhận hàng trả — Đang xử lý hoàn tiền
                                    </span>
                                )}
                                {order.status === 'refunded' && (
                                    <span className="px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                                        💰 Đã hoàn tiền thành công!
                                    </span>
                                )}
                                {order.status === 'return_requested' && (
                                    <span className="px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm animate-pulse">
                                        ⏳ Yêu cầu hoàn hàng đang chờ Admin duyệt
                                    </span>
                                )}
                                {order.status === 'delivered' && (
                                    <button 
                                        onClick={() => onRate(order)}
                                        className="px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold hover:bg-amber-100 hover:border-amber-300 transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                                    >
                                        <Star size={14} className="text-amber-500 fill-amber-400" /> Đánh giá sản phẩm
                                    </button>
                                )}
                                {(order.status === 'delivered' || order.status === 'cancelled' || order.status === 'refunded') && (
                                    <button 
                                        onClick={() => onRebuy(order)}
                                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 active:scale-95 flex items-center gap-1.5"
                                    >
                                        <ShoppingBag size={14} /> Mua lại đơn hàng
                                    </button>
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
                                        <tr className="border-t border-slate-100">
                                            <td colSpan={3} className="py-3 text-right text-sm text-slate-500">Tạm tính:</td>
                                            <td className="py-3 text-right text-sm text-slate-500">{formatPrice(order.totalAmount)}</td>
                                        </tr>
                                        {((order as ExtendedOrder).discountAmount ?? 0) > 0 && (
                                            <tr className="text-emerald-600">
                                                <td colSpan={3} className="py-2 text-right text-sm font-medium">🎟 Voucher ({(order as ExtendedOrder).couponCode}):</td>
                                                <td className="py-2 text-right text-sm font-medium">-{formatPrice((order as ExtendedOrder).discountAmount || 0)}</td>
                                            </tr>
                                        )}
                                        <tr className="border-t-2 border-slate-100 bg-slate-50/30">
                                            <td colSpan={3} className="py-4 text-right font-bold text-sm text-slate-900">Tổng cộng:</td>
                                            <td className="py-4 text-right font-bold text-base text-rose-600">{formatPrice((order as ExtendedOrder).finalAmount || order.totalAmount)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-5">

                    {/* ─── CARRIER BADGE + TRACKING NUMBER ──────────────────── */}
                    {hasCarrier && (
                        <div className="bg-gradient-to-r from-indigo-50 to-sky-50 rounded-xl border border-indigo-100 p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-indigo-100 flex items-center justify-center text-xl">🚚</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{orderExt.shippingProvider || orderExt.carrierCode || 'Đơn vị vận chuyển'}</p>
                                <p className="text-sm font-bold text-slate-900 font-mono tracking-wider mt-0.5">{orderExt.trackingNumber || 'Chờ cấp mã...'}</p>
                            </div>
                            {orderExt.estimatedDelivery && (
                                <div className="text-right shrink-0">
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Dự kiến giao</p>
                                    <p className="text-xs font-bold text-indigo-600">{new Date(orderExt.estimatedDelivery).toLocaleDateString('vi-VN')}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── BẢN ĐỒ LỘ TRÌNH GIAO HÀNG TRỰC QUAN (TO & RÕ NÉT) ───────── */}
                    {hasCarrier && !isCancelled && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                                        <Navigation size={18} className="animate-pulse" />
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-white text-sm sm:text-base">Lộ Trình Vận Chuyển Trực Quan</h4>
                                        <p className="text-[11px] text-slate-300 font-medium">Bản đồ điều phối thời gian thực</p>
                                    </div>
                                </div>
                                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-xs">
                                    {MAP_NODES[mapStep]?.label || 'Đang cập nhật'}
                                </span>
                            </div>

                            <div className="p-5 sm:p-7">
                                {/* Route progress track with horizontal scroll wrapper for mobile safety */}
                                <div className="overflow-x-auto pb-4 pt-2 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                                    <div className="relative min-w-[580px] px-4 py-2">
                                        {/* Background connecting bar */}
                                        <div className="absolute top-[32px] sm:top-[38px] left-10 right-10 h-2.5 bg-slate-100 rounded-full" />
                                        {/* Active filled bar */}
                                        <div 
                                            className="absolute top-[32px] sm:top-[38px] left-10 h-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 via-sky-500 to-emerald-500 rounded-full transition-all duration-700 shadow-xs" 
                                            style={{ width: `calc(${(mapStep / 4) * 100}% - 20px)` }}
                                        />

                                        {/* 5 Checkpoint Nodes (Spacious & Big) */}
                                        <div className="relative grid grid-cols-5 gap-2 text-center">
                                            {MAP_NODES.map((node, i) => {
                                                const isPassed = i <= mapStep;
                                                const isCurrent = i === mapStep;
                                                return (
                                                    <div key={node.id} className="flex flex-col items-center">
                                                        <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center text-2xl sm:text-3xl transition-all duration-300 ${
                                                            isCurrent
                                                                ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white ring-4 ring-indigo-200 scale-110 shadow-xl z-20'
                                                                : isPassed
                                                                    ? 'bg-slate-900 text-white shadow-md z-10'
                                                                    : 'bg-slate-50 text-slate-400 border border-slate-200'
                                                        }`}>
                                                            <span>{node.emoji}</span>
                                                            {isCurrent && (
                                                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full animate-ping" />
                                                            )}
                                                        </div>

                                                        <p className={`text-xs sm:text-sm font-extrabold mt-3 max-w-[110px] leading-tight ${
                                                            isCurrent ? 'text-indigo-600' : isPassed ? 'text-slate-900' : 'text-slate-400'
                                                        }`}>
                                                            {node.label}
                                                        </p>
                                                        <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-1 max-w-[110px] leading-tight">
                                                            {node.desc}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Live checkpoint info card */}
                                <div className="mt-2 p-4 bg-gradient-to-r from-indigo-50/90 via-sky-50/80 to-purple-50/90 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-indigo-600 animate-ping shrink-0" />
                                        <div>
                                            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] block">Mốc Hiện Tại</span>
                                            <strong className="text-indigo-950 font-black text-sm">{MAP_NODES[mapStep]?.label} — {MAP_NODES[mapStep]?.desc}</strong>
                                        </div>
                                    </div>
                                    <span className="text-xs font-black text-indigo-700 bg-white px-3.5 py-1.5 rounded-xl border border-indigo-200 shadow-xs shrink-0 self-end sm:self-center">
                                        {mapStep === 4 ? '🎉 ĐÃ HOÀN TẤT (100%)' : `BƯỚC ${mapStep + 1}/5 (${Math.round(((mapStep + 1) / 5) * 100)}%)`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── TIMELINE 8 BƯỚC CHÍNH ─────────────────────────────── */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
                            <Package size={15} className="text-slate-500" />
                            <h4 className="font-bold text-slate-800 text-sm">Theo dõi đơn hàng</h4>
                        </div>
                        <div className="p-5">
                            {isCancelled ? (
                                <div className="flex flex-col items-center justify-center py-5 text-center">
                                    <PackageX size={42} className="text-rose-400 mb-2" />
                                    <p className="text-base font-bold text-rose-600">{getStatusText(order.status)}</p>
                                    <p className="text-xs text-slate-400 mt-1">Đơn hàng này không còn hiệu lực.</p>
                                </div>
                            ) : isReturn ? (
                                <div className="flex flex-col items-center justify-center py-5 text-center">
                                    <RotateCcw size={42} className="text-amber-400 mb-2" />
                                    <p className="text-base font-bold text-amber-700">{getStatusText(order.status)}</p>
                                    <p className="text-xs text-slate-400 mt-1">Đang trong quá trình xử lý hoàn hàng.</p>
                                </div>
                            ) : (
                                <div className="relative pl-6 space-y-3.5 py-1">
                                    <div className="absolute left-[10px] top-3 bottom-3 w-0.5 bg-slate-100" />
                                    {steps.map((step, idx) => {
                                        const StepIcon = step.icon;
                                        const isCompleted = currentIdx >= idx;
                                        const isCurrent = currentIdx === idx;
                                        return (
                                            <div key={step.key} className="relative">
                                                <div className={`absolute -left-[28px] w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm transition-all duration-500
                                                    ${isCompleted ? 'bg-indigo-500' : 'bg-slate-200'}
                                                    ${isCurrent ? 'scale-125 ring-2 ring-indigo-200' : ''}`}>
                                                    <StepIcon size={10} className={isCompleted ? 'text-white' : 'text-slate-400'} />
                                                </div>
                                                <div className="pl-3">
                                                    <p className={`text-xs font-bold ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</p>
                                                    {isCurrent && (
                                                        <p className="text-[10px] text-indigo-500 font-semibold animate-pulse mt-0.5">● Đang ở bước này</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ─── SHIPPING EVENT FEED (Kiểu GHN/GHTK tracking) ─────── */}
                    {shippingTimeline.length > 0 && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
                                <Truck size={15} className="text-sky-500" />
                                <h4 className="font-bold text-slate-800 text-sm">Lịch sử vận chuyển</h4>
                                <span className="ml-auto text-[10px] bg-sky-100 text-sky-600 px-2 py-0.5 rounded-full font-semibold">{shippingTimeline.length} sự kiện</span>
                            </div>
                            <div className="p-4 space-y-0">
                                {[...shippingTimeline].reverse().map((event: any, idx: number) => (
                                    <div key={idx} className={`flex gap-3 pb-4 ${idx < shippingTimeline.length - 1 ? 'border-l-2 border-indigo-100 ml-2.5 pl-3' : 'ml-2.5 pl-3'}`}>
                                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 -ml-4 ${idx === 0 ? 'bg-indigo-500 ring-2 ring-indigo-100' : 'bg-slate-300'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-bold ${idx === 0 ? 'text-slate-900' : 'text-slate-600'}`}>{event.title}</p>
                                            {event.location && <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1"><MapPin size={9} />{event.location}</p>}
                                            {event.note && <p className="text-[10px] text-slate-400 mt-0.5">{event.note}</p>}
                                        </div>
                                        <p className="text-[10px] text-slate-400 shrink-0 mt-0.5">
                                            {event.timestamp ? new Date(event.timestamp).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : ''}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Support Block */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
                            <h4 className="font-bold text-slate-800 text-sm">Hỗ trợ</h4>
                        </div>
                        <div className="p-5">
                            <p className="text-xs text-slate-500 leading-relaxed mb-3">Nếu bạn có thắc mắc về đơn hàng, vui lòng liên hệ:</p>
                            <div className="space-y-2">
                                <p className="text-sm text-slate-900 flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                    <span className="text-slate-400 text-[10px] uppercase font-bold w-14">Hotline:</span>
                                    <span className="font-bold text-indigo-600">1900 1234</span>
                                </p>
                                <p className="text-sm text-slate-900 flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                    <span className="text-slate-400 text-[10px] uppercase font-bold w-14">Email:</span>
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

const CustomerReturnModal = ({
    order,
    onClose,
    onSuccess
}: {
    order: OrderData;
    onClose: () => void;
    onSuccess: (orderId: string) => void;
}) => {
    const { showToast } = useToast();
    const [reason, setReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const REASONS = [
        'Sản phẩm bị lỗi / hư hỏng từ nhà sản xuất',
        'Giao sai sản phẩm / sai màu / sai kích thước',
        'Sản phẩm không đúng hình ảnh & mô tả',
        'Sản phẩm không vừa size / cần đổi trả',
        'Khác'
    ];

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (reader.result) setImages(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddImageUrl = () => {
        if (imageUrlInput.trim()) {
            setImages(prev => [...prev, imageUrlInput.trim()]);
            setImageUrlInput('');
        }
    };

    const handleSubmit = async () => {
        const allowedStatuses = ['delivered', 'completed', 'awaiting_review', 'reviewed'];
        if (!allowedStatuses.includes(order.status)) {
            showToast('Chỉ có thể yêu cầu hoàn hàng với đơn đã giao thành công!', 'error', 'Đơn chưa đủ điều kiện');
            return;
        }

        const finalReason = reason === 'Khác' ? customReason : reason;
        if (!finalReason.trim()) {
            showToast('Vui lòng chọn hoặc nhập lý do hoàn hàng', 'warning', 'Thiếu thông tin');
            return;
        }

        const evidenceImages = images.length > 0 
            ? images 
            : (order.items && order.items[0]?.product?.images ? [order.items[0].product.images[0]] : []);

        setSubmitting(true);
        try {
            const res = await fetch('/api/orders/return-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.id,
                    reason: finalReason,
                    images: evidenceImages
                })
            });

            const data = await res.json();
            if (data.success) {
                showToast('Admin sẽ xem xét và tiến hành duyệt trong thời gian sớm nhất.', 'success', 'Gửi yêu cầu hoàn hàng thành công!');
                onSuccess(order.id ?? '');
                onClose();
            } else {
                showToast(data.message || 'Không thể gửi yêu cầu', 'error', 'Gửi thất bại');
            }
        } catch {
            showToast('Đã xảy ra lỗi khi gửi yêu cầu hoàn hàng', 'error', 'Lỗi kết nối');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <RotateCcw className="text-rose-500" size={18} /> Yêu Cầu Hoàn Hàng (Chờ Admin Duyệt)
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                        <XCircle size={20} />
                    </button>
                </div>

                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-xs space-y-1">
                    <p className="font-bold text-amber-900">Đơn hàng đã mua: #{order.id}</p>
                    <p className="text-amber-700 text-[11px]">
                        ⚠️ Quy định: Ảnh chụp bằng chứng sản phẩm & lý do sẽ được chuyển đến Admin xem xét kỹ trước khi duyệt hoàn tiền/kho.
                    </p>
                </div>

                {/* Reasons */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">1. Chọn lý do hoàn hàng *</label>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {REASONS.map(r => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setReason(r)}
                                className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all border ${reason === r ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                    {reason === 'Khác' && (
                        <textarea
                            rows={2}
                            placeholder="Nhập lý do chi tiết..."
                            value={customReason}
                            onChange={e => setCustomReason(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-400"
                        />
                    )}
                </div>

                {/* Images Proof Upload */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">2. Chụp/Tải ảnh bằng chứng hàng lỗi/hỏng *</label>
                    
                    <div className="flex items-center gap-2">
                        <label className="flex-1 cursor-pointer bg-slate-100 hover:bg-slate-200 border border-dashed border-slate-300 rounded-xl py-3 px-4 text-center text-xs font-semibold text-slate-600 transition-colors flex items-center justify-center gap-2">
                            📸 Chọn ảnh từ thiết bị
                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </label>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Hoặc dán Link URL hình ảnh..."
                            value={imageUrlInput}
                            onChange={e => setImageUrlInput(e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                        />
                        <button type="button" onClick={handleAddImageUrl} className="px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700">
                            Thêm
                        </button>
                    </div>

                    {/* Preview Images */}
                    {images.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                            {images.map((img, idx) => (
                                <div key={idx} className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden group">
                                    <img src={img} alt={`Proof ${idx}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center opacity-90 hover:opacity-100"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex gap-2 pt-2">
                    <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all">
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !reason || images.length === 0}
                        className="flex-1 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                    >
                        {submitting ? 'Đang gửi...' : 'Gửi Yêu Cầu Cho Admin Duyệt'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default function NguoiDungPage() {
    const { showToast, showConfirm } = useToast();
    const { user, token, logout, updateProfile } = useAuth();
    const { addItem } = useCart();
    const clearCart = useCartStore(s => s.clearCart);
    const router = useRouter();
    const [activeMainTab, setActiveMainTab] = useState('orders');
    const [activeOrderTab, setActiveOrderTab] = useState('all');
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [mounted, setMounted] = useState(false);
    const [liveSync, setLiveSync] = useState(false); // live sync indicator
    
    // State cho Review Modal & Return Modal
    const [reviewOrder, setReviewOrder] = useState<OrderData | null>(null);
    const [returnOrder, setReturnOrder] = useState<OrderData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    // State cho Ví Voucher
    const [myCoupons, setMyCoupons] = useState<any[]>([]);
    const [loadingCoupons, setLoadingCoupons] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const fetchMyCoupons = useCallback(async () => {
        if (!user || !token) return;
        setLoadingCoupons(true);
        try {
            // Dùng token đã được destructure từ hook useAuth()
            const res = await fetch('/api/coupons/my-coupons', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setMyCoupons(data.coupons || []);
            }
        } catch {
            console.error('Error fetching user coupons');
        } finally {
            setLoadingCoupons(false);
        }
    }, [user, token]);

    useEffect(() => {
        if (activeMainTab === 'vouchers') {
            fetchMyCoupons();
        }
    }, [activeMainTab, fetchMyCoupons]);

    // State cho Ví HAVEN (Số dư ví & Lịch sử hoàn tiền)
    const [walletInfo, setWalletInfo] = useState<{ walletBalance: number; transactions: any[] }>({ walletBalance: 0, transactions: [] });
    const [loadingWallet, setLoadingWallet] = useState(false);

    const fetchWalletInfo = useCallback(async () => {
        if (!user) return;
        setLoadingWallet(true);
        try {
            const res = await fetch('/api/wallet', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-user-id': user.id || ''
                }
            });
            const data = await res.json();
            if (data.success) {
                setWalletInfo({
                    walletBalance: data.walletBalance || 0,
                    transactions: data.transactions || []
                });
            }
        } catch {
            console.error('Error fetching user wallet info');
        } finally {
            setLoadingWallet(false);
        }
    }, [user, token]);

    useEffect(() => {
        if (activeMainTab === 'wallet') {
            fetchWalletInfo();
        }
    }, [activeMainTab, fetchWalletInfo]);

    // State cho Chi tiết đơn hàng
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    // State cho kết quả thanh toán MoMo/VNPay
    const [paymentResult, setPaymentResult] = useState<{
        status: 'success' | 'failed';
        orderId: string;
        method: string;
    } | null>(null);

    // Form settings state
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || ''
    });

    const handleCancelOrder = async (orderId: string) => {
        const ok = await showConfirm({
            title: 'Hủy đơn hàng?',
            message: 'Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.',
            confirmText: 'Hủy đơn',
            cancelText: 'Giữ lại',
            type: 'danger'
        });
        if (!ok) return;
        try {
            const res = await fetch('/api/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: orderId, status: 'cancelled' })
            });
            const data = await res.json();
            if (data.success) {
                setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
                showToast('Đơn hàng đã được hủy thành công', 'success', 'Hủy đơn thành công');
            } else {
                showToast(data.message || 'Không thể hủy đơn', 'error', 'Lỗi hủy đơn');
            }
        } catch {
            showToast('Đã có lỗi xảy ra', 'error');
        }
    };

    const handleRebuy = (order: OrderData) => {
        order.items.forEach(item => {
            for (let i = 0; i < item.quantity; i++) {
                addItem(item.product, item.selectedSize, item.selectedColor);
            }
        });
        showToast('Đã thêm sản phẩm vào giỏ hàng!', 'success', 'Thêm vào giỏ hàng');
    };

    const handleRateOrder = (order: OrderData) => {
        setReviewOrder(order);
    };

    const handleReturnOrder = (order: OrderData) => {
        setReturnOrder(order);
    };


    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        
        if (!user) {
            router.push('/login');
            return;
        }

        // Kiểm tra kết quả thanh toán từ VNPay / MoMo callback
        const params = new URLSearchParams(window.location.search);
        const status  = params.get('status') as 'success' | 'failed' | null;
        const orderId = params.get('orderId') || '';
        const method  = params.get('method') || 'online';

        if (status === 'success') {
            // Xóa giỏ hàng đúng cách qua Zustand (cập nhật cả state lẫn localStorage)
            clearCart();
            setPaymentResult({ status: 'success', orderId, method });
            window.history.replaceState({}, '', '/nguoidung');
        } else if (status === 'failed') {
            setPaymentResult({ status: 'failed', orderId, method });
            window.history.replaceState({}, '', '/nguoidung');
        }

        const fetchOrders = async (silent = false) => {
            try {
                if (!silent) setLoading(true);
                const res = await fetch(`/api/orders?email=${user.email}&t=${Date.now()}`);
                const data = await res.json();
                if (data.success) {
                    setOrders(prev => {
                        // Chỉ cập nhật nếu có thay đổi thực sự (tránh re-render thừa)
                        const prevIds = prev.map(o => `${o.id}-${o.status}`).join(',');
                        const newIds  = (data.orders || []).map((o: OrderData) => `${o.id}-${o.status}`).join(',');
                        return prevIds !== newIds ? data.orders : prev;
                    });
                }
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                if (!silent) setLoading(false);
            }
        };

        fetchOrders();

        // Auto-poll mỗi 12 giây — đồng bộ status với Admin
        const interval = setInterval(async () => {
            setLiveSync(true);
            await fetchOrders(true);
            setTimeout(() => setLiveSync(false), 800);
        }, 12000);

        return () => clearInterval(interval);
    }, [user, router, mounted, clearCart]);

    const filteredOrders = activeOrderTab === 'all'
        ? orders
        : orders.filter(order => {
            const group = STATUS_GROUP_MAP[activeOrderTab];
            return group ? group.includes(order.status ?? '') : order.status === activeOrderTab;
        });

    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setTimeout(() => {
            updateProfile(formData);
            setIsSaving(false);
            showToast('Thông tin hồ sơ đã được cập nhật thành công!', 'success', 'Cập nhật thành công');
        }, 800);
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'processing': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'shipped': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'return_requested': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'refund_requested': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'refunded': return 'bg-orange-50 text-orange-600 border-orange-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const selectedOrder = orders.find(o => o.id === selectedOrderId);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50/50 pt-28 pb-20">

            {/* ===== PAYMENT RESULT MODAL ===== */}
            <AnimatePresence>
                {paymentResult && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setPaymentResult(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden"
                        >
                            {/* Top accent */}
                            <div className={`h-2 w-full ${
                                paymentResult.status === 'success'
                                    ? paymentResult.method === 'momo' ? 'bg-gradient-to-r from-[#ae2070] to-[#d4357a]'
                                    : 'bg-gradient-to-r from-blue-500 to-blue-700'
                                    : 'bg-gradient-to-r from-rose-400 to-rose-600'
                            }`} />

                            <div className="p-8 text-center">
                                {/* Icon */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.15, type: 'spring', damping: 12 }}
                                    className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${
                                        paymentResult.status === 'success' ? 'bg-emerald-50' : 'bg-rose-50'
                                    }`}
                                >
                                    {paymentResult.status === 'success' ? (
                                        <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-10 h-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    )}
                                </motion.div>

                                {/* Method badge */}
                                <div className="flex justify-center mb-4">
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
                                        paymentResult.method === 'momo' ? 'bg-pink-100 text-[#ae2070]'
                                        : paymentResult.method === 'vnpay' ? 'bg-blue-100 text-blue-700'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {paymentResult.method === 'momo' ? '🟣 MoMo'
                                        : paymentResult.method === 'vnpay' ? '🔵 VNPay'
                                        : '💳 Online'}
                                    </span>
                                </div>

                                {/* Title */}
                                <h2 className={`text-2xl font-bold mb-2 ${
                                    paymentResult.status === 'success' ? 'text-slate-900' : 'text-rose-600'
                                }`}>
                                    {paymentResult.status === 'success' ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
                                </h2>

                                {/* Description */}
                                {paymentResult.status === 'success' ? (
                                    <>
                                        <p className="text-slate-500 text-sm mb-2">
                                            Đơn hàng <span className="font-bold text-slate-800 font-mono">#{paymentResult.orderId}</span> đã được xác nhận.
                                        </p>
                                        <p className="text-slate-400 text-xs mb-6">
                                            Chúng tôi sẽ chuẩn bị và giao hàng trong thời gian sớm nhất. Cảm ơn bạn đã mua sắm! 🎉
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-slate-500 text-sm mb-2">
                                            Giao dịch cho đơn hàng <span className="font-bold text-slate-800 font-mono">#{paymentResult.orderId}</span> không thành công.
                                        </p>
                                        <p className="text-slate-400 text-xs mb-6">
                                            Đơn hàng vẫn được giữ lại. Bạn có thể thử thanh toán lại hoặc chọn phương thức khác.
                                        </p>
                                    </>
                                )}

                                {/* Actions */}
                                <div className="space-y-2">
                                    <button
                                        onClick={() => {
                                            setPaymentResult(null);
                                            if (paymentResult.status === 'success') {
                                                setActiveMainTab('orders');
                                                const paid = orders.find(o => o.id === paymentResult.orderId);
                                                if (paid) setSelectedOrderId(paid.id ?? null);
                                            }
                                        }}
                                        className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all ${
                                            paymentResult.status === 'success'
                                                ? 'bg-slate-900 text-white hover:bg-slate-800'
                                                : 'bg-rose-500 text-white hover:bg-rose-600'
                                        }`}
                                    >
                                        {paymentResult.status === 'success' ? 'Xem đơn hàng của tôi' : 'Đóng'}
                                    </button>
                                    <button
                                        onClick={() => setPaymentResult(null)}
                                        className="w-full py-3 rounded-2xl text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        Đóng thông báo
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
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
                                            onReturn={handleReturnOrder}
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
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-xl font-bold text-slate-900">Lịch sử đơn hàng</h3>
                                                </div>
                                                <div className="flex gap-1.5 flex-wrap">
                                                    {ORDER_STATUS_TABS.map(tab => (
                                                        <button
                                                            key={tab.id}
                                                            onClick={() => setActiveOrderTab(tab.id)}
                                                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap border ${
                                                                activeOrderTab === tab.id
                                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                                : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
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
                                                                    {({
                                                                        pending: 'Chờ xác nhận',
                                                                        processing: 'Đang chuẩn bị',
                                                                        waiting_pickup: 'Chờ lấy hàng',
                                                                        picked_up: 'Đã lấy hàng',
                                                                        in_transit: 'Đang vận chuyển',
                                                                        out_for_delivery: 'Đang giao hàng',
                                                                        shipped: 'Đang giao',
                                                                        delivered: 'Hoàn thành ✓',
                                                                        cancelled: 'Đã hủy',
                                                                        return_requested: '⏳ Chờ Shop xét duyệt',
                                                                        returning: '🚚 Shop đã duyệt (Gửi hàng về)',
                                                                        return_received: '📦 Shop đã nhận hàng',
                                                                        refund_requested: 'Yêu cầu hoàn tiền',
                                                                        refunded: '✅ Đã hoàn tiền',
                                                                    } as Record<string,string>)[order.status] || order.status}
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
                                                                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                                                                    {(order.status === 'pending' || order.status === 'processing') && (
                                                                        <button onClick={() => handleCancelOrder(order.id ?? '')} className="px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all flex-1 sm:flex-none flex items-center justify-center gap-1.5 active:scale-95">
                                                                            <XCircle size={13} className="text-rose-500" /> Hủy đơn
                                                                        </button>
                                                                    )}
                                                                    {order.status === 'delivered' && (!order.returnRequest || order.returnRequest.status === 'none') && (
                                                                        <button onClick={() => handleReturnOrder(order)} className="px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all flex-1 sm:flex-none flex items-center justify-center gap-1.5 active:scale-95">
                                                                            <RotateCcw size={13} className="text-rose-500" /> Hoàn hàng
                                                                        </button>
                                                                    )}
                                                                    {order.status === 'return_requested' && (
                                                                        <span className="px-3.5 py-2 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-pulse">
                                                                            ⏳ Đang chờ Shop xét duyệt yêu cầu hoàn
                                                                        </span>
                                                                    )}
                                                                    {order.status === 'returning' && (
                                                                        <span className="px-3.5 py-2 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
                                                                            🚚 Shop đã duyệt — Vui lòng gửi hàng về shop
                                                                        </span>
                                                                    )}
                                                                    {order.status === 'return_received' && (
                                                                        <span className="px-3.5 py-2 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
                                                                            📦 Shop đã nhận hàng trả — Đang xử lý hoàn tiền
                                                                        </span>
                                                                    )}
                                                                    {order.status === 'refunded' && (
                                                                        <span className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
                                                                            💰 Đã hoàn tiền thành công
                                                                        </span>
                                                                    )}
                                                                    {order.status === 'delivered' && (
                                                                        <button onClick={() => handleRateOrder(order)} className="px-3.5 py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all flex-1 sm:flex-none flex items-center justify-center gap-1.5 active:scale-95">
                                                                            <Star size={13} className="text-amber-500 fill-amber-400" /> Đánh giá
                                                                        </button>
                                                                    )}
                                                                    {(order.status === 'delivered' || order.status === 'cancelled' || order.status === 'refunded') && (
                                                                        <button onClick={() => handleRebuy(order)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-100 flex-1 sm:flex-none flex items-center justify-center gap-1.5 active:scale-95">
                                                                            <ShoppingBag size={13} /> Mua lại
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                                                                    <div className="text-right">
                                                                        {((order as ExtendedOrder).discountAmount ?? 0) > 0 && (
                                                                            <p className="text-xs text-slate-400 line-through">{formatPrice(order.totalAmount)}</p>
                                                                        )}
                                                                        <p className="text-sm font-bold text-indigo-600">{formatPrice((order as ExtendedOrder).finalAmount || order.totalAmount)}</p>
                                                                    </div>
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

                            {activeMainTab === 'wallet' && (
                                <motion.div
                                    key="wallet"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    {/* Wallet Balance Header Card */}
                                    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
                                        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                            <div>
                                                <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1.5">
                                                    <CreditCard size={16} />
                                                    <span>Ví tài khoản HAVEN Pay</span>
                                                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px]">Chính chủ</span>
                                                </div>
                                                <p className="text-xs text-slate-400 font-medium">Số dư khả dụng để mua sắm & hoàn tiền</p>
                                                <h2 className="text-3xl sm:text-4xl font-black font-mono tracking-tight mt-2 text-emerald-400">
                                                    {loadingWallet ? '...' : formatPrice(walletInfo.walletBalance)}
                                                </h2>
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={fetchWalletInfo}
                                                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                                                >
                                                    <RotateCcw size={14} className={loadingWallet ? 'animate-spin' : ''} />
                                                    Cập nhật số dư
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Transaction History Section */}
                                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
                                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                                                    <CreditCard size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-900">Lịch sử biến động số dư ví</h3>
                                                    <p className="text-xs text-slate-400">Lưu lại toàn bộ lịch sử hoàn tiền đơn hủy, trả hàng & thanh toán</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-400 font-bold">{walletInfo.transactions.length} giao dịch</span>
                                        </div>

                                        {loadingWallet ? (
                                            <div className="space-y-3">
                                                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />)}
                                            </div>
                                        ) : walletInfo.transactions.length === 0 ? (
                                            <div className="p-12 text-center">
                                                <CreditCard className="mx-auto text-slate-200 mb-3" size={40} />
                                                <p className="text-slate-500 font-medium text-sm">Chưa có lịch sử giao dịch ví nào</p>
                                                <p className="text-slate-400 text-xs mt-1">Khi bạn hủy đơn trả trước hoặc hoàn hàng, tiền refund sẽ được tự động cộng vào ví này.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {walletInfo.transactions.map((tx: any) => (
                                                    <div key={tx.id || tx._id} className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors flex items-center justify-between gap-4 bg-slate-50/50">
                                                        <div className="flex items-center gap-3.5 min-w-0">
                                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold ${
                                                                tx.amount > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                                                            }`}>
                                                                {tx.amount > 0 ? '+' : '-'}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{tx.description}</p>
                                                                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mt-0.5">
                                                                    <span>Mã GD: <strong className="font-mono text-slate-700">{tx.id}</strong></span>
                                                                    {tx.orderId && <span>· Đơn: <strong className="font-mono text-slate-700">#{tx.orderId}</strong></span>}
                                                                    <span>· {new Date(tx.createdAt).toLocaleString('vi-VN')}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <p className={`text-sm sm:text-base font-black font-mono ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                                {tx.amount > 0 ? `+${formatPrice(tx.amount)}` : `${formatPrice(tx.amount)}`}
                                                            </p>
                                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                Thành công
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {activeMainTab === 'vouchers' && (
                                <motion.div
                                    key="vouchers"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8"
                                >
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="p-3 bg-amber-50 text-[#C9A227] rounded-2xl">
                                            <Ticket size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 font-serif">Ví Voucher của tôi</h3>
                                            <p className="text-xs text-slate-400 mt-1">Các voucher cá nhân bạn đã quay trúng thưởng từ Vòng quay may mắn.</p>
                                        </div>
                                    </div>

                                    {loadingCoupons ? (
                                        <div className="space-y-4">
                                            {[1, 2].map(i => (
                                                <div key={i} className="h-28 bg-slate-50 rounded-2xl animate-pulse" />
                                            ))}
                                        </div>
                                    ) : myCoupons.length === 0 ? (
                                        <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                                            <Ticket size={48} className="mx-auto text-slate-300 mb-4 animate-bounce" />
                                            <p className="text-slate-500 font-medium">Bạn chưa sở hữu voucher nào.</p>
                                            <p className="text-xs text-slate-400 mt-1">Hãy tham gia Vòng quay may mắn để trúng các voucher hấp dẫn!</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {myCoupons.map((coupon: any) => {
                                                const isExpired = new Date(coupon.expires_at) < new Date();
                                                const isUsed = coupon.is_used;
                                                const isInactive = isExpired || isUsed;
                                                
                                                return (
                                                    <div 
                                                        key={coupon._id}
                                                        className={`relative flex border rounded-2xl overflow-hidden transition-all duration-300 bg-white ${
                                                            isInactive 
                                                                ? 'border-slate-100 opacity-60' 
                                                                : 'border-slate-150 hover:shadow-md hover:border-slate-200'
                                                        }`}
                                                    >
                                                        {/* Ticket punch effect */}
                                                        <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-50 border-r border-slate-150 rounded-full z-10" />
                                                        <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-50 border-l border-slate-150 rounded-full z-10" />

                                                        {/* Left column: value */}
                                                        <div className={`w-1/3 flex flex-col justify-center items-center p-3 border-r border-dashed ${
                                                            isInactive ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-slate-50 border-slate-200'
                                                        }`}>
                                                            {coupon.type === 'percent' ? (
                                                                <span className="text-2xl font-black font-sans text-amber-600">{coupon.discount_value}%</span>
                                                            ) : coupon.type === 'shipping' ? (
                                                                <span className="text-xs font-black uppercase text-teal-600 tracking-wider">FREESHIP</span>
                                                            ) : (
                                                                <span className="text-xl font-black font-sans text-indigo-600">-{coupon.discount_value / 1000}K</span>
                                                            )}
                                                            <span className="text-[9px] uppercase tracking-wider text-slate-400 mt-1 font-bold">Voucher</span>
                                                        </div>

                                                        {/* Right column: info & Copy */}
                                                        <div className="w-2/3 p-4 flex flex-col justify-between">
                                                            <div>
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span className="text-xs font-bold text-slate-800 line-clamp-1">{coupon.reward_name}</span>
                                                                    {isInactive && (
                                                                        <span className={`text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded font-black ${
                                                                            isUsed ? 'bg-slate-200 text-slate-500' : 'bg-rose-100 text-rose-600'
                                                                        }`}>
                                                                            {isUsed ? 'Đã dùng' : 'Hết hạn'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 mt-2 bg-slate-50 border border-slate-100 px-2 py-1.5 rounded-lg w-fit">
                                                                    <span className="text-[10px] font-mono font-bold text-slate-700 select-all">{coupon.code}</span>
                                                                    {!isInactive && (
                                                                        <button 
                                                                            type="button"
                                                                            onClick={() => {
                                                                                navigator.clipboard.writeText(coupon.code);
                                                                                setCopiedCode(coupon.code);
                                                                                showToast('Đã sao chép mã giảm giá thành công!', 'success', 'Sao chép');
                                                                                setTimeout(() => setCopiedCode(null), 2000);
                                                                            }}
                                                                            className="text-slate-400 hover:text-[#C9A227] transition-colors"
                                                                            title="Sao chép mã"
                                                                        >
                                                                            {copiedCode === coupon.code ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <p className="text-[9px] text-slate-400 mt-3 font-semibold">
                                                                Hạn dùng: {new Date(coupon.expires_at).toLocaleDateString('vi-VN')} {new Date(coupon.expires_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
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
                                        </div>

                                        <div className="pt-6 mt-6 flex flex-col-reverse sm:flex-row justify-between items-center gap-4 border-t border-slate-100">
                                            <button
                                                type="button"
                                                onClick={() => setIsPasswordModalOpen(true)}
                                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white text-indigo-600 border border-indigo-200 rounded-2xl text-sm font-bold shadow-sm hover:bg-indigo-50 transition-all"
                                            >
                                                <Shield size={18} />
                                                Đổi mật khẩu (Bảo mật)
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSaving}
                                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                                            >
                                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                                Lưu thay đổi hồ sơ
                                            </button>
                                        </div>
                                    </form>

                                    <div className="mt-8 pt-8 border-t border-slate-100">
                                        <AddressManager userId={user.id} />
                                    </div>

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
            
            <ChangePasswordModal 
                isOpen={isPasswordModalOpen} 
                onClose={() => setIsPasswordModalOpen(false)} 
                email={user.email} 
            />
            
            {reviewOrder && user && (
                <ReviewModal 
                    order={reviewOrder} 
                    onClose={() => setReviewOrder(null)} 
                    user={user} 
                />
            )}

            {returnOrder && (
                <CustomerReturnModal 
                    order={returnOrder}
                    onClose={() => setReturnOrder(null)}
                    onSuccess={(orderId) => {
                        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'return_requested' } : o));
                    }}
                />
            )}
        </div>
    );
}
