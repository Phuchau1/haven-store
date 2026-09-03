/* eslint-disable */
'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Search,
    Eye,
    Package,
    Truck,
    CheckCircle2,
    XCircle,
    Clock,
    RotateCcw,
    ChevronDown,
    MapPin,
    Phone,
    Mail,
    Calendar,
    X,
    PackageCheck,
    ArrowRight,
    Lock,
    ShieldCheck,
    Check,
    Sparkles,
    AlertCircle,
} from 'lucide-react';
import { OrderData } from '@/types';
import { formatPrice } from '@/lib/format';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { SkeletonTable, SkeletonList } from '../components/SkeletonLoaders';
import { EmptyState } from '../components/EmptyState';
import { AdminPagination } from '../components/AdminPagination';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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

const ITEMS_PER_PAGE = 10;

// ---------------------------------------------------------------------------
// Main Workflow Step Definitions (Chỉ được tiến, không được lùi)
// ---------------------------------------------------------------------------
const WORKFLOW_STEPS = [
    { 
        id: 'pending',    
        label: 'Chờ xử lý', 
        sublabel: 'Tiếp nhận đơn hàng', 
        icon: Clock,         
        color: 'text-amber-600',   
        bg: 'bg-amber-50',   
        border: 'border-amber-200',
        activeBg: 'bg-amber-500',
    },
    { 
        id: 'processing', 
        label: 'Xác nhận & Đóng gói', 
        sublabel: 'Chuẩn bị kiện hàng', 
        icon: Package,       
        color: 'text-blue-600',    
        bg: 'bg-blue-50',    
        border: 'border-blue-200',
        activeBg: 'bg-blue-600',
    },
    { 
        id: 'shipped',    
        label: 'Đang vận chuyển', 
        sublabel: 'Bàn giao ĐVVC', 
        icon: Truck,         
        color: 'text-indigo-600',  
        bg: 'bg-indigo-50',  
        border: 'border-indigo-200',
        activeBg: 'bg-indigo-600',
    },
    { 
        id: 'delivered',  
        label: 'Giao hàng thành công', 
        sublabel: 'Khách đã nhận hàng', 
        icon: CheckCircle2,  
        color: 'text-emerald-600', 
        bg: 'bg-emerald-50', 
        border: 'border-emerald-200',
        activeBg: 'bg-emerald-600',
    },
];

const STATUS_OPTIONS = [
    ...WORKFLOW_STEPS,
    { 
        id: 'cancelled',  
        label: 'Hủy đơn hàng',       
        sublabel: 'Đơn hàng bị hủy',
        icon: XCircle,       
        color: 'text-rose-600',    
        bg: 'bg-rose-50',    
        border: 'border-rose-200',
        activeBg: 'bg-rose-600',
    },
];

// Normalize sub-statuses from carrier/system into core workflow status
const normalizeWorkflowStatus = (status?: string): 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'return' | 'unknown' => {
    if (!status) return 'pending';
    if (['pending'].includes(status)) return 'pending';
    if (['processing', 'confirmed', 'packing'].includes(status)) return 'processing';
    if (['shipped', 'shipping', 'waiting_pickup', 'picked_up', 'in_transit', 'out_for_delivery', 'delivering'].includes(status)) return 'shipped';
    if (['delivered', 'completed'].includes(status)) return 'delivered';
    if (['cancelled'].includes(status)) return 'cancelled';
    if (['return_requested', 'returning', 'return_received', 'refunded'].includes(status)) return 'return';
    return 'unknown';
};

// Get numerical step index (0: pending, 1: processing, 2: shipped, 3: delivered)
const getWorkflowStepIndex = (status?: string): number => {
    const norm = normalizeWorkflowStatus(status);
    switch (norm) {
        case 'pending': return 0;
        case 'processing': return 1;
        case 'shipped': return 2;
        case 'delivered': return 3;
        default: return -1;
    }
};

// Check if a transition is valid following the strict "CHỈ ĐƯỢC TIẾN KHÔNG ĐƯỢC LÙI" rule
const checkWorkflowTransition = (currentStatus?: string, targetStatus?: string) => {
    const currentNorm = normalizeWorkflowStatus(currentStatus);
    const targetNorm = normalizeWorkflowStatus(targetStatus);

    if (currentStatus === 'cancelled') {
        return { allowed: false, reason: 'Đơn hàng đã bị hủy, không thể thay đổi trạng thái.' };
    }
    if (currentNorm === 'delivered') {
        return { allowed: false, reason: 'Đơn hàng đã giao thành công (hoàn tất), không thể chuyển lùi.' };
    }

    // Cancel logic: Only allowed when order is pending or processing (not yet shipped)
    if (targetStatus === 'cancelled') {
        if (currentNorm === 'pending' || currentNorm === 'processing') {
            return { allowed: true };
        }
        return { allowed: false, reason: 'Đơn hàng đã bàn giao vận chuyển, không thể hủy trực tiếp.' };
    }

    const currentIdx = getWorkflowStepIndex(currentStatus);
    const targetIdx = getWorkflowStepIndex(targetStatus);

    if (targetIdx === -1) {
        return { allowed: false, reason: 'Trạng thái không hợp lệ.' };
    }

    if (targetIdx < currentIdx) {
        return { allowed: false, reason: 'Quy trình chỉ được tiến lên, không thể lùi về bước trước.' };
    }

    if (targetIdx === currentIdx) {
        return { allowed: false, reason: 'Đơn hàng đang ở bước này.' };
    }

    return { allowed: true };
};

// Status tabs config for Sales Orders
const FILTER_TABS = [
    { id: 'all', label: 'Tất cả đơn bán' },
    { id: 'pending', label: 'Chờ xử lý' },
    { id: 'processing', label: 'Xác nhận & Đóng gói' },
    { id: 'shipped', label: 'Đang vận chuyển' },
    { id: 'delivered', label: 'Giao thành công' },
    { id: 'cancelled', label: 'Đã hủy' },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function AdminOrders() {
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [liveSync, setLiveSync] = useState(false);
    
    // Shipping Modal State
    const [shippingModalOpen, setShippingModalOpen] = useState(false);
    const [orderToApprove, setOrderToApprove] = useState<string | null>(null);
    const [selectedShippingProvider, setSelectedShippingProvider] = useState<string>('GHN');
    const [isSimulating, setIsSimulating] = useState(false);

    const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Close dropdown on outside click
    const handleOutsideClick = useCallback((e: MouseEvent) => {
        if (openDropdownId) {
            const ref = dropdownRefs.current[openDropdownId];
            if (ref && !ref.contains(e.target as Node)) {
                setOpenDropdownId(null);
            }
        }
    }, [openDropdownId]);

    useEffect(() => {
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [handleOutsideClick]);

    // Fetch orders (silent = tránh loading spinner khi auto-poll)
    const fetchOrders = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await fetch(`/api/orders?t=${Date.now()}`);
            if (!res.ok) throw new Error(`Lỗi server (${res.status})`);
            const data = await res.json();
            if (data.success) {
                setOrders(prev => {
                    const prevSig = prev.map(o => `${o.id}-${o.status}`).join(',');
                    const newSig  = (data.orders || []).map((o: OrderData) => `${o.id}-${o.status}`).join(',');
                    return prevSig !== newSig ? data.orders : prev;
                });
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
        // Auto-poll mỗi 10 giây — đồng bộ 2 chiều với khách hàng
        const interval = setInterval(async () => {
            setLiveSync(true);
            await fetchOrders(true);
            setTimeout(() => setLiveSync(false), 700);
        }, 10000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    // Đồng bộ URL parameters (id, status, search) từ Dashboard
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const orderIdParam = params.get('id') || params.get('search');
            const statusParam = params.get('status');

            if (orderIdParam) {
                setSearchQuery(orderIdParam);
                setFilterStatus('all');
            } else if (statusParam) {
                setFilterStatus(statusParam);
            }
        }
    }, []);

    // Tự động mở Modal Chi Tiết Đơn Hàng nếu URL có tham số 'id'
    useEffect(() => {
        if (typeof window !== 'undefined' && orders.length > 0) {
            const params = new URLSearchParams(window.location.search);
            const targetId = params.get('id') || params.get('search');
            if (targetId) {
                const targetLower = targetId.toLowerCase();
                const matchedOrder = orders.find(o => 
                    o.id?.toLowerCase() === targetLower || 
                    (o.id && o.id.substring(0, 8).toLowerCase() === targetLower.substring(0, 8))
                );
                if (matchedOrder) {
                    setSelectedOrder(matchedOrder);
                }
            }
        }
    }, [orders]);

    // Khi mở order chi tiết, fetch luôn shipping timeline nếu có
    useEffect(() => {
        if (selectedOrder?.id) {
            fetch(`/api/carrier/timeline/${selectedOrder.id}`)
                .then(r => r.json())
                .then(data => {
                    if (data.success && data.timeline) {
                        setSelectedOrder((prev: any) => prev && prev.id === selectedOrder.id ? { ...prev, ...data.order, shippingTimeline: data.timeline } : prev);
                    }
                })
                .catch(() => {});
        }
    }, [selectedOrder?.id]);

    // Update status
    const handleUpdateStatus = async (orderId: string, newStatus: string, shippingProvider?: string) => {
        const order = orders.find(o => o.id === orderId) || selectedOrder;
        if (order) {
            const check = checkWorkflowTransition(order.status, newStatus);
            if (!check.allowed) {
                alert(check.reason || 'Thao tác không hợp lệ theo quy trình!');
                return;
            }
        }

        setIsSubmitting(true);
        setOpenDropdownId(null);
        try {
            const bodyData: any = { id: orderId, status: newStatus };
            if (shippingProvider) {
                bodyData.shippingProvider = shippingProvider;
            }
            const res = await fetch('/api/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData),
            });
            const data = await res.json();
            if (data.success) {
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any, shippingProvider: shippingProvider || o.shippingProvider } : o));
                if (selectedOrder?.id === orderId) {
                    setSelectedOrder(prev => prev ? { ...prev, status: newStatus as any, shippingProvider: shippingProvider || prev.shippingProvider } : prev);
                }
            } else {
                alert(data.message || 'Lỗi cập nhật trạng thái');
            }
        } catch {
            alert('Lỗi kết nối máy chủ');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApproveOrder = (orderId: string) => {
        setOrderToApprove(orderId);
        setShippingModalOpen(true);
    };

    const confirmApproveOrder = async () => {
        if (orderToApprove) {
            const carrierCode = selectedShippingProvider || 'GHN';
            setShippingModalOpen(false);
            await handleInitCarrier(orderToApprove, carrierCode);
            setOrderToApprove(null);
        }
    };

    // ─── CARRIER SIMULATION HANDLERS ──────────────────────────────────────────
    const handleInitCarrier = async (orderId: string, carrierCode: string) => {
        setIsSimulating(true);
        try {
            const res = await fetch('/api/carrier/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, carrierCode })
            });
            const data = await res.json();
            if (data.success) {
                await fetchOrders(true);
                const timelineRes = await fetch(`/api/carrier/timeline/${orderId}`);
                const timelineData = await timelineRes.json();
                if (timelineData.success) {
                    setSelectedOrder((prev: any) => ({ ...prev, ...timelineData.order, shippingTimeline: timelineData.timeline, status: 'shipped', shippingProvider: carrierCode }));
                }
            } else {
                alert(data.message || 'Lỗi khi khởi tạo giao hàng');
            }
        } catch {
            alert('Lỗi kết nối server');
        } finally {
            setIsSimulating(false);
        }
    };

    const handleAdvanceCarrier = async (orderId: string) => {
        setIsSimulating(true);
        try {
            const res = await fetch('/api/carrier/advance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId })
            });
            const data = await res.json();
            if (data.success) {
                await fetchOrders(true);
                const timelineRes = await fetch(`/api/carrier/timeline/${orderId}`);
                const timelineData = await timelineRes.json();
                if (timelineData.success) {
                    setSelectedOrder((prev: any) => ({ ...prev, ...timelineData.order, shippingTimeline: timelineData.timeline, status: data.newStatus || (data.done ? 'delivered' : prev.status) }));
                }
            } else {
                alert(data.message || 'Không thể tiến bước giao hàng');
            }
        } catch {
            alert('Lỗi kết nối server');
        } finally {
            setIsSimulating(false);
        }
    };

    const getStatusInfo = (status: string) => {
        const ALL_STATUSES: Record<string, { id: string; label: string; icon: any; color: string; bg: string; border: string }> = {
            pending:          { id: 'pending',          label: 'Chờ xử lý',            icon: Clock,         color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200'  },
            processing:       { id: 'processing',       label: 'Xác nhận & Đóng gói',  icon: Package,       color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200'   },
            confirmed:        { id: 'confirmed',        label: 'Đã xác nhận',          icon: Package,       color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200'   },
            packing:          { id: 'packing',          label: 'Đang đóng gói',        icon: Package,       color: 'text-purple-600',  bg: 'bg-purple-50',  border: 'border-purple-200' },
            shipped:          { id: 'shipped',          label: 'Đang vận chuyển',      icon: Truck,         color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-200' },
            shipping:         { id: 'shipping',         label: 'Đang vận chuyển',      icon: Truck,         color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-200' },
            waiting_pickup:   { id: 'waiting_pickup',   label: 'Chờ lấy hàng',         icon: Clock,         color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-200' },
            picked_up:        { id: 'picked_up',        label: 'Đã lấy hàng',          icon: Truck,         color: 'text-cyan-600',    bg: 'bg-cyan-50',    border: 'border-cyan-200'   },
            in_transit:       { id: 'in_transit',       label: 'Đang luân chuyển',     icon: Truck,         color: 'text-sky-600',     bg: 'bg-sky-50',     border: 'border-sky-200'    },
            out_for_delivery: { id: 'out_for_delivery', label: 'Đang phát hàng',       icon: Truck,         color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-200' },
            delivering:       { id: 'delivering',       label: 'Đang giao hàng',       icon: Truck,         color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-200' },
            delivered:        { id: 'delivered',        label: 'Giao hàng thành công', icon: CheckCircle2,  color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200'},
            completed:        { id: 'completed',        label: 'Giao hàng thành công', icon: CheckCircle2,  color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200'},
            return_requested: { id: 'return_requested', label: 'Yêu cầu hoàn hàng',    icon: RotateCcw,     color: 'text-amber-700',   bg: 'bg-amber-100',  border: 'border-amber-200'  },
            returning:        { id: 'returning',        label: 'Đang hoàn về shop',    icon: RotateCcw,     color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-200' },
            return_received:  { id: 'return_received',  label: 'Shop đã nhận hàng',    icon: PackageCheck,  color: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-200'   },
            returned:         { id: 'returned',         label: 'Hoàn hàng thành công', icon: RotateCcw,     color: 'text-pink-600',    bg: 'bg-pink-50',    border: 'border-pink-200'   },
            refunded:         { id: 'refunded',         label: 'Đã hoàn tiền',         icon: CheckCircle2,  color: 'text-teal-600',    bg: 'bg-teal-50',    border: 'border-teal-200'   },
            cancelled:        { id: 'cancelled',        label: 'Đã hủy đơn hàng',      icon: XCircle,       color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-200'   },
        };
        return ALL_STATUSES[status] || STATUS_OPTIONS.find(s => s.id === status) || {
            id: status,
            label: status,
            icon: Clock,
            color: 'text-slate-600',
            bg: 'bg-slate-50',
            border: 'border-slate-200'
        };
    };

    const getProgressLineWidth = (status: string) => {
        const isReturn = ['return_requested', 'returning', 'return_received', 'refunded'].includes(status);
        if (isReturn) {
            const returnMap: Record<string, string> = {
                return_requested: 'w-1/4',
                returning: 'w-1/2',
                return_received: 'w-3/4',
                refunded: 'w-full'
            };
            return returnMap[status] || 'w-1/4';
        }
        const idx = getWorkflowStepIndex(status);
        if (idx === 0) return 'w-[12%]';
        if (idx === 1) return 'w-[38%]';
        if (idx === 2) return 'w-[68%]';
        if (idx === 3) return 'w-full';
        return 'w-0';
    };

    const getColorSwatchClass = (colorName: string) => {
        const map: Record<string, string> = {
            'Đen': 'bg-black', 'Trắng': 'bg-white', 'Xanh': 'bg-blue-500',
            'Xanh dương': 'bg-blue-500', 'Xanh navy': 'bg-slate-900',
            'Đỏ': 'bg-red-600', 'Hồng': 'bg-pink-400', 'Vàng': 'bg-yellow-400',
            'Nâu': 'bg-amber-700', 'Be': 'bg-amber-100', 'Ghi': 'bg-slate-400',
            'Xám': 'bg-slate-400', 'Kem': 'bg-amber-100', 'Tím': 'bg-violet-500',
        };
        return map[colorName] ?? 'bg-slate-200';
    };

    // Derived: filter + search
    const filteredOrders = orders.filter(o => {
        const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            (o.id?.toLowerCase().includes(q)) ||
            o.customerName.toLowerCase().includes(q) ||
            o.email.toLowerCase().includes(q);
        return matchesStatus && matchesSearch;
    });

    // Reset page when filter/search changes
    useEffect(() => { setCurrentPage(1); }, [filterStatus, searchQuery]);

    // Pagination
    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
    );

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
        <div className="space-y-6">

            {/* ── Page Header ─────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h3 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--adm-text)' }}>
                            Quản lý đơn hàng
                        </h3>
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border transition-all duration-500 ${liveSync ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500' : 'bg-slate-500/10 border-slate-600/20 text-slate-500'}`}>
                            <span className={`w-2 h-2 rounded-full ${liveSync ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                            {liveSync ? 'Đang đồng bộ...' : 'Đồng bộ Realtime 10s'}
                        </div>
                    </div>
                    <p className="text-sm font-medium mt-1.5" style={{ color: 'var(--adm-text-muted)' }}>
                        Quy trình đồng bộ chuẩn TMĐT • <strong className="text-emerald-600 dark:text-emerald-400">Chỉ tiến không lùi</strong> • Quản lý vận chuyển & đơn hàng
                    </p>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-80">
                    <Search
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10"
                        size={18}
                        style={{ color: 'var(--adm-text-subtle)' }}
                    />
                    <input
                        type="text"
                        placeholder="Tìm mã đơn, tên khách, email..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="adm-input w-full !pl-11 pr-4 py-2.5 text-sm font-medium"
                        style={{ paddingLeft: '2.75rem' }}
                    />
                </div>
            </div>

            {/* ── Status Filter Tabs & Separate Return Management Access ─── */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div
                    className="overflow-x-auto pb-1 md:pb-0 flex-1"
                    style={{ scrollbarWidth: 'none' }}
                >
                    <div className="flex gap-2 min-w-max">
                        {FILTER_TABS.map(tab => {
                            const isActive = filterStatus === tab.id;
                            const statusInfo = tab.id !== 'all' ? STATUS_OPTIONS.find(s => s.id === tab.id) : null;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setFilterStatus(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap border transition-all min-h-[40px] ${
                                        isActive
                                            ? 'bg-[var(--adm-primary)] text-white border-[var(--adm-primary)] shadow-md scale-102'
                                            : 'bg-[var(--adm-surface)] text-[var(--adm-text-muted)] border-[var(--adm-border)] hover:border-[var(--adm-primary)] hover:text-[var(--adm-primary)]'
                                    }`}
                                >
                                    {statusInfo && <statusInfo.icon size={15} />}
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Separate Link to Return Logistics & Refund Management */}
                <Link
                    href="/admin/returns"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-all shadow-sm shrink-0"
                >
                    <RotateCcw size={15} className="text-amber-700" />
                    <span>Quản lý Hoàn Hàng & Trả Tiền</span>
                    <ArrowRight size={14} className="text-amber-700" />
                </Link>
            </div>

            {/* ── Table Card Wrapper ────────────────────────────────────────── */}
            <div className="adm-card overflow-visible">

                {/* ── DESKTOP TABLE (md+) ── */}
                <div className="hidden md:block">
                    <div className="adm-table-scroll">
                        <table className="adm-table w-full text-left border-collapse">
                            <thead>
                                <tr style={{ backgroundColor: 'var(--adm-surface-2)', borderBottom: '1px solid var(--adm-border)' }}>
                                    <th className="px-5 py-4 text-xs font-black uppercase tracking-wider" style={{ color: 'var(--adm-text-subtle)' }}>
                                        Thông tin đơn hàng
                                    </th>
                                    <th className="px-5 py-4 text-xs font-black uppercase tracking-wider" style={{ color: 'var(--adm-text-subtle)' }}>
                                        Hình thức &amp; Ngày
                                    </th>
                                    <th className="px-5 py-4 text-xs font-black uppercase tracking-wider" style={{ color: 'var(--adm-text-subtle)' }}>
                                        Tổng thanh toán
                                    </th>
                                    <th className="px-5 py-4 text-xs font-black uppercase tracking-wider" style={{ color: 'var(--adm-text-subtle)' }}>
                                        Tiến độ trạng thái (Chỉ tiến)
                                    </th>
                                    <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-center" style={{ color: 'var(--adm-text-subtle)' }}>
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody style={{ borderTop: '1px solid var(--adm-border)' }}>
                                {loading ? (
                                    <SkeletonTable rows={ITEMS_PER_PAGE} cols={5} />
                                ) : paginatedOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={5}>
                                            <EmptyState
                                                icon={Package}
                                                title="Không tìm thấy đơn hàng nào"
                                                description={searchQuery ? `Không có kết quả khớp với "${searchQuery}"` : 'Chưa có đơn hàng nào trong trạng thái này.'}
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedOrders.map(order => {
                                        const statusInfo = getStatusInfo(order.status);
                                        const currentStepIdx = getWorkflowStepIndex(order.status);
                                        return (
                                            <tr
                                                key={order.id}
                                                className="transition-colors duration-200"
                                                style={{ borderBottom: '1px solid var(--adm-border)' }}
                                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--adm-surface-2)')}
                                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                                            >
                                                {/* Order ID / Customer */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-sm"
                                                            style={{ backgroundColor: 'var(--adm-primary)' }}
                                                        >
                                                            #{order.id?.substring(0, 2).toUpperCase() || 'HV'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black tracking-tight" style={{ color: 'var(--adm-text)' }}>
                                                                #{order.id}
                                                            </p>
                                                            <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                                                                {order.customerName}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Date / Payment */}
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--adm-text)' }}>
                                                            <Calendar size={13} style={{ color: 'var(--adm-text-subtle)' }} />
                                                            {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                                        </div>
                                                        <span className="text-[11px] font-bold uppercase tracking-tight text-slate-500">
                                                            {order.paymentMethod === 'pay-cod' || order.paymentMethod === 'cod' ? 'Thanh toán COD' : order.paymentMethod === 'momo' ? 'Ví MoMo' : order.paymentMethod === 'vnpay' ? 'Ví VNPAY' : 'Chuyển khoản'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Total */}
                                                <td className="px-5 py-4">
                                                    <p className="text-base font-black" style={{ color: 'var(--adm-primary)' }}>
                                                        {formatPrice(order.finalAmount || order.totalAmount)}
                                                    </p>
                                                </td>

                                                {/* Status Dropdown */}
                                                <td className="px-5 py-4">
                                                    <div
                                                        className="relative inline-block"
                                                        ref={el => { dropdownRefs.current[order.id!] = el; }}
                                                    >
                                                        <button
                                                            onClick={() => setOpenDropdownId(openDropdownId === order.id ? null : order.id!)}
                                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black border shadow-sm transition-all hover:shadow-md min-h-[40px] ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}
                                                        >
                                                            <statusInfo.icon size={15} />
                                                            <span>{statusInfo.label}</span>
                                                            <ChevronDown
                                                                size={14}
                                                                className={`ml-1 opacity-60 transition-transform duration-200 ${openDropdownId === order.id ? 'rotate-180' : ''}`}
                                                            />
                                                        </button>

                                                        <AnimatePresence>
                                                            {openDropdownId === order.id && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                                                    transition={{ duration: 0.15, ease: 'easeOut' }}
                                                                    className="absolute left-0 top-full mt-2 z-[200] w-72 rounded-2xl shadow-2xl border p-3"
                                                                    style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                                                                >
                                                                    <div className="flex items-center justify-between px-2 py-1 mb-2 border-b" style={{ borderColor: 'var(--adm-border)' }}>
                                                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                                                                            Tiến độ (Chỉ được tiến):
                                                                        </span>
                                                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                                                            Bước {currentStepIdx >= 0 ? `${currentStepIdx + 1}/4` : 'Đặc biệt'}
                                                                        </span>
                                                                    </div>

                                                                    <div className="space-y-1">
                                                                        {STATUS_OPTIONS.map((opt) => {
                                                                            const transitionCheck = checkWorkflowTransition(order.status, opt.id);
                                                                            const isCurrent = normalizeWorkflowStatus(order.status) === opt.id || order.status === opt.id;
                                                                            const isAllowed = transitionCheck.allowed;

                                                                            return (
                                                                                <button
                                                                                    key={opt.id}
                                                                                    onClick={() => {
                                                                                        if (order.status === 'pending' && opt.id === 'processing') {
                                                                                            handleApproveOrder(order.id!);
                                                                                        } else {
                                                                                            handleUpdateStatus(order.id!, opt.id);
                                                                                        }
                                                                                    }}
                                                                                    disabled={!isAllowed || isSubmitting}
                                                                                    title={!isAllowed ? (transitionCheck.reason || 'Không thể chọn') : 'Chuyển trạng thái'}
                                                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition-all min-h-[42px] ${
                                                                                        isCurrent
                                                                                            ? 'bg-slate-900 text-white shadow-md dark:bg-slate-100 dark:text-slate-900'
                                                                                            : isAllowed
                                                                                            ? 'hover:bg-[var(--adm-surface-2)] text-[var(--adm-text)] hover:border hover:border-indigo-200 cursor-pointer'
                                                                                            : 'opacity-35 cursor-not-allowed text-slate-400 bg-slate-50 dark:bg-slate-900/30'
                                                                                    }`}
                                                                                >
                                                                                    <div className={`p-1.5 rounded-lg ${isCurrent ? 'bg-white/20' : opt.bg}`}>
                                                                                        <opt.icon size={14} className={isCurrent ? 'text-white dark:text-slate-900' : opt.color} />
                                                                                    </div>
                                                                                    <div className="flex-1 text-left">
                                                                                        <p className="leading-tight">{opt.label}</p>
                                                                                        <p className="text-[10px] font-normal opacity-70">{opt.sublabel}</p>
                                                                                    </div>
                                                                                    {isCurrent && (
                                                                                        <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">
                                                                                            Hiện tại
                                                                                        </span>
                                                                                    )}
                                                                                    {!isAllowed && !isCurrent && (
                                                                                        <Lock size={12} className="text-slate-400" />
                                                                                    )}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </td>

                                                {/* View Button */}
                                                <td className="px-5 py-4 text-center">
                                                    <button
                                                        onClick={() => setSelectedOrder(order)}
                                                        className="px-4 py-2 flex items-center gap-2 border rounded-xl mx-auto text-xs font-bold transition-all hover:shadow-md hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 active:scale-95"
                                                        style={{
                                                            backgroundColor: 'var(--adm-surface)',
                                                            borderColor: 'var(--adm-border)',
                                                            color: 'var(--adm-text)',
                                                        }}
                                                    >
                                                        <Eye size={15} />
                                                        <span>Xem chi tiết</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── MOBILE CARD LIST (< md) ── */}
                <div className="md:hidden">
                    {loading ? (
                        <div className="p-4">
                            <SkeletonList rows={5} />
                        </div>
                    ) : paginatedOrders.length === 0 ? (
                        <EmptyState
                            icon={Package}
                            title="Không tìm thấy đơn hàng nào"
                            description={searchQuery ? `Không có kết quả khớp với "${searchQuery}"` : 'Chưa có đơn hàng nào trong trạng thái này.'}
                        />
                    ) : (
                        <div className="divide-y" style={{ borderColor: 'var(--adm-border)' }}>
                            {paginatedOrders.map(order => {
                                const statusInfo = getStatusInfo(order.status);
                                return (
                                    <motion.div
                                        key={order.id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 flex flex-col gap-3"
                                        style={{ backgroundColor: 'var(--adm-surface)' }}
                                    >
                                        {/* Row 1: ID + Status badge */}
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                                                    style={{ backgroundColor: 'var(--adm-primary)' }}
                                                >
                                                    #{order.id?.substring(0, 2).toUpperCase() || 'HV'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black leading-tight" style={{ color: 'var(--adm-text)' }}>
                                                        #{order.id}
                                                    </p>
                                                    <p className="text-xs font-semibold" style={{ color: 'var(--adm-text-muted)' }}>
                                                        {order.customerName}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                                                <statusInfo.icon size={13} />
                                                {statusInfo.label}
                                            </span>
                                        </div>

                                        {/* Row 2: Date, Payment, Total */}
                                        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--adm-text-muted)' }}>
                                            <div className="flex items-center gap-1.5 font-bold">
                                                <Calendar size={13} />
                                                <span>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                            <span className="text-base font-black" style={{ color: 'var(--adm-primary)' }}>
                                                {formatPrice(order.finalAmount || order.totalAmount)}
                                            </span>
                                        </div>

                                        {/* Row 3: View button */}
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="w-full flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-xl border bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 transition-all active:scale-95"
                                        >
                                            <Eye size={15} />
                                            Xem chi tiết đơn hàng
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {!loading && filteredOrders.length > ITEMS_PER_PAGE && (
                    <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--adm-border)' }}>
                        <AdminPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredOrders.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            {/* ── TO RÕ & ĐỒNG BỘ: ORDER DETAIL MODAL ──────────────────────── */}
            <AnimatePresence>
                {selectedOrder && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedOrder(null)}
                            className="fixed inset-0 z-[110] bg-slate-950/70 backdrop-blur-md"
                        />

                        {/* Modal Container */}
                        <motion.div
                            key="modal"
                            initial={{ opacity: 0, scale: 0.96, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 15 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="fixed inset-0 z-[111] flex items-center justify-center p-2 sm:p-4 md:p-6 pointer-events-none"
                        >
                            <div
                                className="pointer-events-auto flex flex-col w-full max-w-5xl xl:max-w-6xl max-h-[94vh] rounded-[28px] shadow-2xl overflow-hidden border"
                                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                            >

                                {/* Modal Header */}
                                <div
                                    className="px-6 py-5 flex items-center justify-between shrink-0 border-b"
                                    style={{ borderColor: 'var(--adm-border)', backgroundColor: 'var(--adm-surface)' }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg text-white" style={{ backgroundColor: 'var(--adm-primary)' }}>
                                            <Package size={24} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h3 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--adm-text)' }}>
                                                    Đơn hàng #{selectedOrder.id}
                                                </h3>
                                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border ${getStatusInfo(selectedOrder.status).bg} ${getStatusInfo(selectedOrder.status).color} ${getStatusInfo(selectedOrder.status).border}`}>
                                                    {getStatusInfo(selectedOrder.status).label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <p className="text-xs font-bold text-slate-500">
                                                    Khởi tạo lúc: {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        aria-label="Đóng chi tiết đơn hàng"
                                        className="w-10 h-10 rounded-2xl transition-all flex items-center justify-center border hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                                        style={{
                                            backgroundColor: 'var(--adm-surface-2)',
                                            borderColor: 'var(--adm-border)',
                                            color: 'var(--adm-text-muted)',
                                        }}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Modal Body (Scrollable) */}
                                <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6" style={{ backgroundColor: 'var(--adm-bg)' }}>

                                    {/* ── STEPPER: QUY TRÌNH TIẾN ĐỘ ĐỒNG BỘ (CHỈ ĐƯỢC TIẾN) ── */}
                                    <div
                                        className="p-6 sm:p-7 rounded-3xl border shadow-sm"
                                        style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                                    >
                                        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                                            <div className="flex items-center gap-2">
                                                <ShieldCheck className="text-emerald-500" size={20} />
                                                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                                                    Tiến độ vòng đời đơn hàng (Chỉ được tiến • Không được lùi)
                                                </h4>
                                            </div>
                                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-full border border-indigo-200">
                                                {selectedOrder.status === 'cancelled' ? '❌ Đơn hàng đã hủy' : `Giai đoạn ${Math.max(1, getWorkflowStepIndex(selectedOrder.status) + 1)}/4`}
                                            </span>
                                        </div>

                                        {/* Stepper Line & Nodes */}
                                        <div className="relative px-4 sm:px-8 py-2">
                                            {/* Background Line */}
                                            <div className="absolute top-8 left-8 right-8 h-2 rounded-full bg-slate-200 dark:bg-slate-800 -z-0">
                                                {/* Filled Progress Line */}
                                                <div
                                                    className={`h-full transition-all duration-700 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 ${getProgressLineWidth(selectedOrder.status)}`}
                                                />
                                            </div>

                                            {/* Step Nodes */}
                                            <div className="flex items-start justify-between relative z-10">
                                                {WORKFLOW_STEPS.map((step, idx) => {
                                                    const currentIdx = getWorkflowStepIndex(selectedOrder.status);
                                                    const isCompleted = selectedOrder.status !== 'cancelled' && currentIdx >= idx;
                                                    const isActive = selectedOrder.status !== 'cancelled' && currentIdx === idx;
                                                    const isPending = !isCompleted;

                                                    return (
                                                        <div key={step.id} className="flex flex-col items-center text-center w-28 sm:w-36">
                                                            {/* Node Circle */}
                                                            <div
                                                                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border-4 ${
                                                                    isActive
                                                                        ? 'bg-indigo-600 text-white border-indigo-200 shadow-xl scale-110 ring-4 ring-indigo-400/20'
                                                                        : isCompleted
                                                                        ? 'bg-emerald-600 text-white border-emerald-100 shadow-md'
                                                                        : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                                                                }`}
                                                            >
                                                                {isCompleted && !isActive ? (
                                                                    <Check size={22} className="stroke-[3]" />
                                                                ) : (
                                                                    <step.icon size={22} />
                                                                )}
                                                            </div>

                                                            {/* Node Label */}
                                                            <p className={`mt-3 text-xs sm:text-sm font-extrabold tracking-tight leading-tight ${
                                                                isActive
                                                                    ? 'text-indigo-600 dark:text-indigo-400'
                                                                    : isCompleted
                                                                    ? 'text-emerald-700 dark:text-emerald-400'
                                                                    : 'text-slate-400 dark:text-slate-500'
                                                            }`}>
                                                                {step.label}
                                                            </p>
                                                            <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden sm:block">
                                                                {isActive ? '● Đang thực hiện' : isCompleted ? '✓ Đã hoàn tất' : '○ Chờ tới'}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main Content Grid: Left (Carrier + Products), Right (Customer + Payment) */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                                        {/* Left Column (7 cols) */}
                                        <div className="lg:col-span-7 space-y-6">

                                            {/* ── CARRIER SIMULATION PANEL ── */}
                                            <div className="p-6 rounded-3xl border bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl">
                                                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4 flex-wrap gap-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
                                                            <Truck size={20} />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-black uppercase tracking-wider text-indigo-200">
                                                                Mô phỏng Đơn vị Vận chuyển (Carrier Simulator)
                                                            </h4>
                                                            <p className="text-xs text-slate-300 mt-0.5">
                                                                Tiến trình giao hàng tự động đồng bộ theo từng trạm
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {((selectedOrder as any).trackingNumber || (selectedOrder as any).shippingProvider) && (
                                                        <span className="text-xs font-mono bg-indigo-500/30 text-indigo-200 px-3 py-1 rounded-full border border-indigo-400/40 font-bold">
                                                            {(selectedOrder as any).trackingNumber || (selectedOrder as any).shippingProvider}
                                                        </span>
                                                    )}
                                                </div>

                                                {!(selectedOrder as any).trackingNumber && !(selectedOrder as any).shippingProvider && selectedOrder.status === 'pending' ? (
                                                    <div className="space-y-3">
                                                        <p className="text-xs font-medium text-slate-300">
                                                            Chọn một đơn vị vận chuyển để bắt đầu bàn giao hàng và tiến trình giao:
                                                        </p>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                            {[
                                                                { code: 'GHN', label: '🔴 Giao Hàng Nhanh' },
                                                                { code: 'GHTK', label: '🟢 GH Tiết Kiệm' },
                                                                { code: 'JNT', label: '🔴 J&T Express' },
                                                                { code: 'VTP', label: '🔴 Viettel Post' },
                                                                { code: 'BEST', label: '🟡 BEST Express' },
                                                                { code: 'NJV', label: '🔴 Ninja Van' }
                                                            ].map(c => (
                                                                <button
                                                                    key={c.code}
                                                                    disabled={isSimulating}
                                                                    onClick={() => handleInitCarrier(selectedOrder.id!, c.code)}
                                                                    className="px-3 py-2.5 bg-white/10 hover:bg-indigo-600 border border-white/20 hover:border-indigo-400 rounded-xl text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50 text-left"
                                                                >
                                                                    {c.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between text-xs bg-white/5 p-3 rounded-2xl border border-white/10">
                                                            <span>Đơn vị vận chuyển: <strong className="text-indigo-300 font-bold">{(selectedOrder as any).shippingProvider || (selectedOrder as any).carrierCode || 'Giao Hàng Nhanh (GHN)'}</strong></span>
                                                            <span>Trạng thái hiện tại: <strong className="text-emerald-400 font-bold uppercase">{selectedOrder.status}</strong></span>
                                                        </div>

                                                        {selectedOrder.status === 'cancelled' ? (
                                                            <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-xs font-bold text-rose-300 flex items-center gap-2">
                                                                <XCircle size={18} />
                                                                <span>Đơn hàng này đã bị hủy. Quy trình vận chuyển đã dừng.</span>
                                                            </div>
                                                        ) : selectedOrder.status === 'delivered' || selectedOrder.status === 'completed' ? (
                                                            <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-xs font-bold text-emerald-300 flex items-center justify-between gap-3">
                                                                <div className="flex items-center gap-2.5">
                                                                    <CheckCircle2 size={20} className="text-emerald-400" />
                                                                    <span>Đơn hàng đã được giao thành công đến tay khách hàng!</span>
                                                                </div>
                                                                <span className="text-[10px] bg-emerald-400/20 px-2.5 py-1 rounded-lg border border-emerald-400/40 uppercase">
                                                                    Hoàn tất 100%
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                disabled={isSimulating}
                                                                onClick={() => handleAdvanceCarrier(selectedOrder.id!)}
                                                                className="w-full py-3.5 px-5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-2xl text-sm font-black transition-all shadow-lg hover:shadow-indigo-500/30 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
                                                            >
                                                                <Truck size={18} />
                                                                <span>{isSimulating ? 'Đang cập nhật mốc tiếp theo...' : '⏩ Tiến 1 bước giao hàng (Cập nhật lộ trình)'}</span>
                                                            </button>
                                                        )}

                                                        {/* Timeline log */}
                                                        {(selectedOrder as any).shippingTimeline?.length > 0 && (
                                                            <div className="pt-3 border-t border-white/10 space-y-2">
                                                                <p className="text-[11px] uppercase font-bold text-slate-300">
                                                                    Các mốc lộ trình đã qua ({(selectedOrder as any).shippingTimeline.length}):
                                                                </p>
                                                                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                                                                    {[(selectedOrder as any).shippingTimeline].flat().reverse().map((evt: any, i: number) => (
                                                                        <div key={i} className="text-xs text-slate-200 flex items-center justify-between bg-white/10 px-3 py-2 rounded-xl border border-white/5">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                                                                <span className="font-bold">{evt.title}</span>
                                                                            </div>
                                                                            <span className="text-[11px] text-slate-400 font-medium">{evt.location || ''}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* ── PRODUCTS LIST ── */}
                                            <div
                                                className="p-6 rounded-3xl border"
                                                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                                                        Danh sách sản phẩm ({selectedOrder.items?.length || 0})
                                                    </h4>
                                                </div>

                                                <div className="space-y-3">
                                                    {(selectedOrder.items || []).map((item, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex items-center gap-4 p-3.5 rounded-2xl border transition-all hover:shadow-sm"
                                                            style={{ backgroundColor: 'var(--adm-bg)', borderColor: 'var(--adm-border)' }}
                                                        >
                                                            <div
                                                                className="w-16 h-16 rounded-2xl overflow-hidden relative flex-shrink-0 border"
                                                                style={{ borderColor: 'var(--adm-border)', backgroundColor: 'var(--adm-surface-2)' }}
                                                            >
                                                                {isValidImageSrc(item.product?.images?.[0]) ? (
                                                                    <Image src={item.product.images[0]} alt={item.product?.name || 'Product'} fill className="object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                                        <Package size={24} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold truncate" style={{ color: 'var(--adm-text)' }}>
                                                                    {item.product?.name || 'Sản phẩm'}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                                    <span
                                                                        className="px-2.5 py-0.5 rounded-lg text-xs font-bold border"
                                                                        style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)', color: 'var(--adm-text-muted)' }}
                                                                    >
                                                                        Size: {item.selectedSize || 'F'}
                                                                    </span>
                                                                    <div
                                                                        className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border"
                                                                        style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                                                                    >
                                                                        <div className={`w-2.5 h-2.5 rounded-full border border-slate-300 ${getColorSwatchClass(item.selectedColor?.name || '')}`} />
                                                                        <span className="text-xs font-bold" style={{ color: 'var(--adm-text-muted)' }}>
                                                                            {item.selectedColor?.name || 'Mặc định'}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                                                                        SL: x{item.quantity}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="text-right pl-3 flex-shrink-0">
                                                                <p className="text-base font-black" style={{ color: 'var(--adm-text)' }}>
                                                                    {formatPrice((item.product?.price || 0) * item.quantity)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                        </div>

                                        {/* Right Column (5 cols) */}
                                        <div className="lg:col-span-5 space-y-6">

                                            {/* ── CUSTOMER INFO ── */}
                                            <div
                                                className="p-6 rounded-3xl border space-y-4"
                                                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                                            >
                                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                                                    Thông tin khách hàng
                                                </h4>
                                                
                                                <div className="flex items-center gap-3.5 pb-4 border-b" style={{ borderColor: 'var(--adm-border)' }}>
                                                    <div
                                                        className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base border flex-shrink-0"
                                                        style={{ backgroundColor: 'var(--adm-surface-2)', color: 'var(--adm-primary)', borderColor: 'var(--adm-border)' }}
                                                    >
                                                        {(selectedOrder.customerName || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-black" style={{ color: 'var(--adm-text)' }}>
                                                            {selectedOrder.customerName}
                                                        </p>
                                                        <p className="text-xs font-bold text-slate-400">
                                                            Mã KH: {selectedOrder.id?.split('-')[1] || 'KH-VIP'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    {[
                                                        { Icon: Phone, label: 'Điện thoại', text: selectedOrder.phone },
                                                        { Icon: Mail, label: 'Email', text: selectedOrder.email },
                                                        { Icon: MapPin, label: 'Địa chỉ nhận hàng', text: selectedOrder.address },
                                                    ].map(({ Icon, label, text }) => (
                                                        <div key={label} className="flex items-start gap-3 text-xs" style={{ color: 'var(--adm-text)' }}>
                                                            <div
                                                                className="w-7 h-7 flex items-center justify-center rounded-xl flex-shrink-0"
                                                                style={{ backgroundColor: 'var(--adm-surface-2)', color: 'var(--adm-text-subtle)' }}
                                                            >
                                                                <Icon size={14} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
                                                                <p className="font-bold leading-relaxed break-words text-slate-700 dark:text-slate-200 mt-0.5">{text || '—'}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* ── PAYMENT & TOTAL ── */}
                                            <div className="bg-slate-900 p-6 rounded-3xl shadow-xl text-white dark:bg-slate-950 border border-slate-800">
                                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">
                                                    Chi tiết thanh toán
                                                </h4>
                                                
                                                <div className="space-y-3 text-sm">
                                                    <div className="flex justify-between font-medium text-slate-300">
                                                        <span>Tạm tính tiền hàng:</span>
                                                        <span className="font-bold">{formatPrice(selectedOrder.totalAmount)}</span>
                                                    </div>
                                                    <div className="flex justify-between font-medium text-slate-300">
                                                        <span>Phí vận chuyển:</span>
                                                        <span className="text-emerald-400 font-bold">Miễn phí 100%</span>
                                                    </div>
                                                    <div className="flex justify-between font-medium text-slate-300">
                                                        <span>Hình thức thanh toán:</span>
                                                        <span className="text-indigo-300 font-bold uppercase">
                                                            {selectedOrder.paymentMethod === 'pay-cod' || selectedOrder.paymentMethod === 'cod' ? 'Thanh toán COD' : selectedOrder.paymentMethod === 'momo' ? 'Ví MoMo' : selectedOrder.paymentMethod === 'vnpay' ? 'Ví VNPAY' : 'Chuyển khoản'}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="h-px my-3 bg-white/10" />

                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <span className="text-xs font-bold uppercase text-slate-400 block">
                                                                Tổng thanh toán
                                                            </span>
                                                            <span className="text-[10px] text-emerald-400 font-semibold">
                                                                Đã bao gồm VAT &amp; Phí VC
                                                            </span>
                                                        </div>
                                                        <p className="text-2xl font-black text-white">
                                                            {formatPrice(selectedOrder.finalAmount || selectedOrder.totalAmount)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>

                                    </div>
                                </div>

                                {/* ── MODAL FOOTER: QUICK ADVANCE CONTROLS (CHỈ ĐƯỢC TIẾN) ── */}
                                <div
                                    className="shrink-0 border-t p-4 sm:px-7 sm:py-4"
                                    style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                                >
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="text-amber-500 hidden sm:block" size={18} />
                                            <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                                Cập nhật tiến độ:
                                            </span>
                                            <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200">
                                                Quy trình 1 chiều
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            {STATUS_OPTIONS.map(opt => {
                                                const check = checkWorkflowTransition(selectedOrder.status, opt.id);
                                                const isCurrent = normalizeWorkflowStatus(selectedOrder.status) === opt.id || selectedOrder.status === opt.id;
                                                const isAllowed = check.allowed;

                                                return (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => {
                                                            if (selectedOrder.status === 'pending' && opt.id === 'processing') {
                                                                handleApproveOrder(selectedOrder.id!);
                                                            } else {
                                                                handleUpdateStatus(selectedOrder.id!, opt.id);
                                                            }
                                                        }}
                                                        disabled={!isAllowed || isSubmitting}
                                                        title={!isAllowed ? (check.reason || 'Không thể chọn') : `Tiến sang ${opt.label}`}
                                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all border whitespace-nowrap min-h-[42px] ${
                                                            isCurrent
                                                                ? 'bg-slate-900 text-white shadow-lg dark:bg-slate-100 dark:text-slate-900 ring-2 ring-indigo-500'
                                                                : isAllowed
                                                                ? 'bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border-indigo-200 hover:border-indigo-600 cursor-pointer shadow-sm active:scale-95'
                                                                : 'opacity-35 cursor-not-allowed bg-slate-100 dark:bg-slate-900/40 text-slate-400 border-slate-200 dark:border-slate-800'
                                                        }`}
                                                    >
                                                        <opt.icon size={15} />
                                                        <span>{opt.label}</span>
                                                        {isCurrent && (
                                                            <span className="w-2 h-2 rounded-full bg-emerald-400 ml-0.5" />
                                                        )}
                                                        {!isAllowed && !isCurrent && (
                                                            <Lock size={12} className="opacity-60" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── SHIPPING PROVIDER APPROVAL MODAL ── */}
            <AnimatePresence>
                {shippingModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[200]"
                            onClick={() => setShippingModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-[201] p-7 rounded-3xl shadow-2xl border"
                            style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-100">
                                    <Truck size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black" style={{ color: 'var(--adm-text)' }}>
                                        Duyệt & Bàn giao Đơn vị Vận chuyển
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium">
                                        Đơn hàng sẽ chuyển sang trạng thái Xác nhận &amp; Đóng gói
                                    </p>
                                </div>
                            </div>
                            
                            <div className="space-y-2.5 my-6 max-h-[320px] overflow-y-auto pr-1">
                                {[
                                    { code: 'GHN',  name: 'Giao Hàng Nhanh (GHN)', color: '#E83B34', tag: 'Chuyển phát nhanh' },
                                    { code: 'GHTK', name: 'Giao Hàng Tiết Kiệm (GHTK)', color: '#009B57', tag: 'Tiết kiệm' },
                                    { code: 'JNT',  name: 'J&T Express', color: '#E30613', tag: 'Toàn quốc' },
                                    { code: 'VTP',  name: 'Viettel Post', color: '#C9272B', tag: 'Bưu điện Viettel' },
                                    { code: 'BEST', name: 'BEST Express', color: '#F5A623', tag: 'Giao hỏa tốc' },
                                    { code: 'NJV',  name: 'Ninja Van', color: '#E60B17', tag: 'Dịch vụ cao cấp' },
                                ].map(c => (
                                    <label key={c.code} className={`flex items-center gap-3.5 p-3.5 rounded-2xl border cursor-pointer transition-all ${selectedShippingProvider === c.code ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 shadow-sm ring-2 ring-indigo-200' : 'border-[var(--adm-border)] hover:border-indigo-300'}`}>
                                        <input
                                            type="radio"
                                            name="shippingProvider"
                                            value={c.code}
                                            checked={selectedShippingProvider === c.code}
                                            onChange={(e) => setSelectedShippingProvider(e.target.value)}
                                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <div className="flex-1 flex items-center justify-between">
                                            <span className="font-bold text-sm" style={{ color: 'var(--adm-text)' }}>{c.name}</span>
                                            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg border" style={{ color: c.color, borderColor: `${c.color}40`, backgroundColor: `${c.color}15` }}>
                                                {c.tag}
                                            </span>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div className="flex gap-3 justify-end pt-2 border-t" style={{ borderColor: 'var(--adm-border)' }}>
                                <button
                                    onClick={() => setShippingModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
                                    style={{ color: 'var(--adm-text-muted)' }}
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={confirmApproveOrder}
                                    className="px-6 py-2.5 rounded-xl font-black text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95"
                                >
                                    Xác nhận &amp; Bắt đầu giao hàng
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
