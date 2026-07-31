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
    PackageX
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

interface ExtendedOrder extends Omit<OrderData, 'finalAmount'> {
    discountAmount?: number;
    couponCode?: string;
    finalAmount?: number;
}

const TABS = [
    { id: 'orders', label: 'Đơn hàng', icon: ShoppingBag },
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

    // SVG Map: Các điểm mốc vận chuyển
    const MAP_NODES = [
        { id: 'shop',   label: 'Shop', x: 180, y: 320, emoji: '🏪' },
        { id: 'hcm',    label: 'Kho HCM', x: 200, y: 280, emoji: '🏗️' },
        { id: 'transit',label: 'Trung chuyển', x: 230, y: 220, emoji: '📦' },
        { id: 'local',  label: 'Kho địa phương', x: 260, y: 160, emoji: '🏢' },
        { id: 'home',   label: 'Nhà bạn', x: 290, y: 100, emoji: '🏠' },
    ];
    const mapStep = Math.min(
        shippingTimeline.length > 0 ? Math.floor((shippingTimeline.length / 7) * 4) : 0,
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
                                {order.status === 'delivered' && (
                                    <button 
                                        onClick={() => onReturn(order)}
                                        className="px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 hover:border-rose-300 transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                                    >
                                        <RotateCcw size={14} className="text-rose-500" /> Hoàn hàng / Trả hàng
                                    </button>
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

                    {/* ─── SVG MAP SIMULATION ────────────────────────────────── */}
                    {hasCarrier && !isCancelled && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
                                <Navigation size={15} className="text-indigo-500" />
                                <h4 className="font-bold text-slate-800 text-sm">Lộ trình giao hàng</h4>
                            </div>
                            <div className="p-4">
                                <svg viewBox="0 0 400 420" className="w-full h-48" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', borderRadius: '12px' }}>
                                    {/* Route line */}
                                    <polyline points="180,320 200,280 230,220 260,160 290,100" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5,4" />
                                    {/* Active route */}
                                    {mapStep > 0 && (
                                        <polyline
                                            points={MAP_NODES.slice(0, mapStep + 1).map(n => `${n.x},${n.y}`).join(' ')}
                                            fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round"
                                        />
                                    )}
                                    {/* Nodes */}
                                    {MAP_NODES.map((node, i) => (
                                        <g key={node.id}>
                                            <circle cx={node.x} cy={node.y} r={i <= mapStep ? 16 : 12}
                                                fill={i <= mapStep ? '#6366f1' : '#e2e8f0'}
                                                stroke="white" strokeWidth="2"
                                            />
                                            <text x={node.x} y={node.y + 5} textAnchor="middle" fontSize="11" fill={i <= mapStep ? 'white' : '#94a3b8'}>{node.emoji}</text>
                                            <text x={node.x + 20} y={node.y + 5} fontSize="9" fill={i <= mapStep ? '#4f46e5' : '#94a3b8'} fontWeight={i <= mapStep ? 'bold' : 'normal'}>{node.label}</text>
                                            {/* Pulse on current node */}
                                            {i === mapStep && (
                                                <circle cx={node.x} cy={node.y} r="20" fill="none" stroke="#6366f1" strokeWidth="1.5" opacity="0.4">
                                                    <animate attributeName="r" values="16;24;16" dur="2s" repeatCount="indefinite" />
                                                    <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
                                                </circle>
                                            )}
                                        </g>
                                    ))}
                                    {/* Labels */}
                                    <text x="20" y="415" fontSize="8" fill="#94a3b8">📍 Mô phỏng hành trình giao hàng</text>
                                </svg>
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
        if (order.status !== 'delivered') {
            alert('❌ Chỉ các đơn hàng đã giao thành công (Mua hàng thành công) mới được gửi yêu cầu hoàn hàng!');
            return;
        }

        const finalReason = reason === 'Khác' ? customReason : reason;
        if (!finalReason.trim()) {
            alert('Vui lòng chọn hoặc nhập lý do hoàn hàng');
            return;
        }

        if (images.length === 0) {
            alert('📸 BẮT BUỘC: Vui lòng chụp ảnh hoặc tải lên hình ảnh sản phẩm làm bằng chứng để gửi Admin xem xét và duyệt!');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/orders/return-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.id,
                    reason: finalReason,
                    images
                })
            });

            const data = await res.json();
            if (data.success) {
                alert('✅ Yêu cầu hoàn hàng của bạn đã được gửi thành công!\n\nAdmin sẽ xem xét hình ảnh thực tế và tiến hành duyệt hoặc từ chối đơn trong thời gian sớm nhất.');
                onSuccess(order.id ?? '');
                onClose();
            } else {
                alert('Lỗi: ' + (data.message || 'Không thể gửi yêu cầu'));
            }
        } catch {
            alert('Đã xảy ra lỗi khi gửi yêu cầu hoàn hàng');
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
    const { user, logout, updateProfile } = useAuth();
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
        } catch {
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
                                                                        pending: 'Chờ xử lý',
                                                                        processing: 'Đang chuẩn bị',
                                                                        shipped: 'Đang giao',
                                                                        delivered: 'Hoàn thành ✓',
                                                                        cancelled: 'Đã hủy',
                                                                        return_requested: '⏳ Chờ duyệt hoàn',
                                                                        refund_requested: 'Yêu cầu hoàn tiền',
                                                                        refunded: 'Đã hoàn hàng',
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
                                                                    {order.status === 'delivered' && (
                                                                        <button onClick={() => handleReturnOrder(order)} className="px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all flex-1 sm:flex-none flex items-center justify-center gap-1.5 active:scale-95">
                                                                            <RotateCcw size={13} className="text-rose-500" /> Hoàn hàng
                                                                        </button>
                                                                    )}
                                                                    {order.status === 'return_requested' && (
                                                                        <span className="px-3.5 py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-pulse">
                                                                            ⏳ Chờ Admin duyệt hoàn
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
                        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'refunded' } : o));
                    }}
                />
            )}
        </div>
    );
}
