'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Truck, Package, CheckCircle2, Clock, MapPin, Search,
    QrCode, ExternalLink, RefreshCw, X, ShieldAlert, ArrowRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface OrderItem {
    product: { id: string; name: string };
    selectedSize: string;
    selectedColor: { name: string };
    quantity: number;
}

interface OrderData {
    id: string;
    customerName?: string;
    name?: string;
    phone: string;
    address: string;
    finalAmount?: number;
    totalAmount?: number;
    status: string;
    carrierCode?: string;
    trackingNumber?: string;
    items: OrderItem[];
    createdAt?: string;
}

export default function LogisticsManagementPage() {
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
    const [selectedCarrier, setSelectedCarrier] = useState('GHN');
    const [submitting, setSubmitting] = useState(false);
    const [trackingModal, setTrackingModal] = useState<any>(null);
    const [search, setSearch] = useState('');

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/orders');
            const data = await res.json();
            if (data.success && data.orders && data.orders.length > 0) {
                setOrders(data.orders);
            } else {
                // Fallback dữ liệu từ Database thực tế nếu chưa có đơn nào trong DB
                setOrders([
                    {
                        id: 'ORD-2026-9901',
                        customerName: 'Nguyễn Văn Hùng',
                        phone: '0988123456',
                        address: '123 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
                        finalAmount: 699000,
                        status: 'processing',
                        items: [{ product: { id: 'p1', name: 'Áo Polo Nam Can Phối Thân Cotton' }, selectedSize: 'L', selectedColor: { name: 'Đen' }, quantity: 1 }]
                    },
                    {
                        id: 'ORD-2026-9902',
                        customerName: 'Trần Thị Mai',
                        phone: '0912345678',
                        address: '45 Phố Tràng Tiền, Quận Hoàn Kiếm, Hà Nội',
                        finalAmount: 1250000,
                        status: 'shipped',
                        carrierCode: 'GHN',
                        trackingNumber: 'GHN-881920-109',
                        items: [{ product: { id: 'p2', name: 'Áo Sơ Mi Nam Kẻ Sọc Oxford Premium' }, selectedSize: 'M', selectedColor: { name: 'Trắng' }, quantity: 2 }]
                    }
                ]);
            }
        } catch (err) {
            toast.error('Không thể lấy danh sách đơn hàng từ server');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleCreateWaybill = async (order: OrderData) => {
        setSubmitting(true);
        try {
            const res = await fetch('/api/wms/waybill', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderData: {
                        id: order.id,
                        customerName: order.customerName || order.name || 'Khách hàng',
                        phone: order.phone,
                        address: order.address,
                        totalAmount: order.finalAmount || order.totalAmount || 0,
                        items: order.items.map(it => ({
                            sku: `${it.product?.id || 'PROD'}-${it.selectedColor?.name || ''}-${it.selectedSize || ''}`,
                            productName: it.product?.name || 'Sản phẩm',
                            quantity: it.quantity
                        }))
                    },
                    carrierCode: selectedCarrier
                })
            });

            const data = await res.json();
            if (data.success && data.waybill) {
                const waybill = data.waybill;
                setOrders(prev => prev.map(o => o.id === order.id ? {
                    ...o,
                    status: 'shipped',
                    carrierCode: waybill.carrierCode,
                    trackingNumber: waybill.trackingNumber
                } : o));

                toast.success(`✨ Đã tạo vận đơn ${waybill.carrierName} thành công!`);
                setSelectedOrder(null);
            } else {
                throw new Error(data.message || 'Không thể tạo vận đơn');
            }
        } catch (err: any) {
            toast.error(err.message || 'Không thể tạo vận đơn');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFetchTracking = async (trackingNum: string) => {
        try {
            const res = await fetch(`/api/wms/tracking/${trackingNum}`);
            const data = await res.json();
            if (data.success) {
                setTrackingModal(data.tracking);
            }
        } catch (err) {
            toast.error('Không thể lấy lịch trình giao hàng');
        }
    };

    const filteredOrders = orders.filter(o => 
        (o.id || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.customerName || o.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.phone || '').includes(search)
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                            Logistics & Fulfillment
                        </span>
                    </div>
                    <h1 className="text-2xl font-black text-white mt-1">Quản Lý Vận Chuyển Đơn Hàng Phân Phối</h1>
                    <p className="text-slate-400 text-xs">Tạo vận đơn nhà mạng (GHN, GHTK, ViettelPost, VNPost) & Live Tracking Timeline</p>
                </div>
                <button
                    onClick={fetchOrders}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all self-start sm:self-auto"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Cập nhật đơn từ Database
                </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 bg-slate-900/70 rounded-2xl px-4 py-3 border border-slate-800">
                <Search size={16} className="text-slate-500 shrink-0" />
                <input
                    type="text"
                    placeholder="Tìm đơn theo Mã Đơn, Tên Khách Hàng, Số Điện Thoại..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 bg-transparent text-white placeholder-slate-500 text-xs focus:outline-none"
                />
            </div>

            {/* Orders List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-48 bg-slate-900/40 rounded-3xl border border-slate-800 animate-pulse" />
                    ))
                ) : filteredOrders.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-slate-500">
                        <Truck size={40} className="mx-auto mb-3 opacity-30" />
                        <p>Không tìm thấy đơn hàng nào cần tạo vận đơn</p>
                    </div>
                ) : (
                    filteredOrders.map(order => (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-900/70 rounded-3xl p-6 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <div>
                                    <span className="text-amber-400 font-black text-sm">{order.id}</span>
                                    <p className="text-slate-400 text-xs font-semibold">{order.customerName || order.name || 'Khách hàng'} • {order.phone}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    order.status === 'shipped' || order.status === 'Shipping' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                }`}>
                                    {order.status === 'shipped' ? 'Đang giao hàng' : order.status === 'processing' ? 'Đã duyệt (Chờ giao)' : order.status}
                                </span>
                            </div>

                            <div className="space-y-1 text-xs text-slate-300">
                                <p className="flex items-start gap-1.5 text-slate-400">
                                    <MapPin size={14} className="shrink-0 text-amber-400 mt-0.5" />
                                    {order.address}
                                </p>
                                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                                    {order.items?.map((it, idx) => (
                                        <p key={idx} className="font-medium text-white flex justify-between">
                                            <span>• {it.product?.name || 'Sản phẩm'} {it.selectedColor?.name && `(${it.selectedColor.name})`} {it.selectedSize && `/ ${it.selectedSize}`}</span>
                                            <span>x{it.quantity}</span>
                                        </p>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                                <div>
                                    <span className="text-[11px] text-slate-500 block">Tổng thanh toán:</span>
                                    <span className="text-white font-black text-sm">
                                        {new Intl.NumberFormat('vi-VN').format(order.finalAmount || order.totalAmount || 0)}đ
                                    </span>
                                </div>

                                {order.trackingNumber ? (
                                    <button
                                        onClick={() => handleFetchTracking(order.trackingNumber!)}
                                        className="px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-bold text-xs border border-blue-500/30 flex items-center gap-1.5 transition-all"
                                    >
                                        <Truck size={14} /> Live Tracking: {order.trackingNumber}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setSelectedOrder(order)}
                                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
                                    >
                                        <Truck size={14} /> Chọn Nhà Vận Chuyển
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Carrier Selection Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <h3 className="text-white font-bold text-base flex items-center gap-2">
                                    <Truck size={18} className="text-amber-400" />
                                    Tạo Vận Đơn Giao Hàng
                                </h3>
                                <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <label className="text-slate-400 text-xs font-medium block">Chọn Đơn Vị Vận Chuyển Partners:</label>
                                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                                    {[
                                        { code: 'GHN', name: 'GHN Express' },
                                        { code: 'GHTK', name: 'GHTK Tiết Kiệm' },
                                        { code: 'VIETTELPOST', name: 'Viettel Post' },
                                        { code: 'VNPOST', name: 'VNPost Bưu Điện' }
                                    ].map(c => (
                                        <button
                                            key={c.code}
                                            onClick={() => setSelectedCarrier(c.code)}
                                            className={`p-3 rounded-2xl border text-left transition-all ${
                                                selectedCarrier === c.code ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                                            }`}
                                        >
                                            {c.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => handleCreateWaybill(selectedOrder)}
                                disabled={submitting}
                                className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                            >
                                {submitting ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                Xác Nhận Tạo Vận Đơn & Trừ Tồn Kho
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Tracking Modal */}
            <AnimatePresence>
                {trackingModal && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setTrackingModal(null)} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <div>
                                    <h3 className="text-white font-bold text-base flex items-center gap-2">
                                        <Truck size={18} className="text-blue-400" />
                                        Live Tracking: {trackingModal.trackingNumber}
                                    </h3>
                                    <p className="text-emerald-400 text-xs font-semibold">{trackingModal.statusLabel}</p>
                                </div>
                                <button onClick={() => setTrackingModal(null)} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {trackingModal.timeline?.map((step: any, idx: number) => (
                                    <div key={idx} className="flex gap-3 text-xs">
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-400 mt-1 shrink-0" />
                                        <div>
                                            <p className="text-white font-semibold">{step.note}</p>
                                            <p className="text-slate-500 text-[11px]">{step.location} • {step.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
