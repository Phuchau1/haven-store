'use client';
// ===== CHECKOUT FORM COMPONENT =====
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Banknote, Loader2, MapPin, Phone, Mail, User, FileText, Tag, ChevronDown, Check, X, Gift, Ticket, Percent } from 'lucide-react';
import { useCart } from '@/app/component/CartContext';
import { useAuth } from '@/app/component/AuthContext';
import { formatPrice } from '@/lib/format';
import { OrderData } from '@/types';
import { useVoucherStore } from '@/app/store/useVoucherStore';

interface CheckoutFormProps {
    onSuccess: (orderId: string, email: string) => void;
}

interface Coupon {
    id: string;
    code: string;
    discount_type: 'percent' | 'fixed';
    discount_value: number;
    start_date: string;
    end_date: string;
    usage_limit: number;
}

interface PaymentMethod {
    id: string;
    name_methond: string;
    description?: string;
    bank_info?: string;
    qr_code_url?: string;
    is_active?: boolean;
}

export default function CheckoutForm({ onSuccess }: CheckoutFormProps) {
    const { items, totalAmount } = useCart();
    const { user, updateProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [orderId] = useState(`LF-${Math.random().toString(36).substr(2, 6).toUpperCase()}`);

    const [formData, setFormData] = useState({
        customerName: user?.name || '',
        phone: '',
        email: user?.email || '',
        address: '',
        paymentMethod: 'cod',
        note: '',
    });

    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

    // ── Voucher states ──
    const [voucherInput, setVoucherInput] = useState('');
    const { appliedVoucher, setVoucher, removeVoucher: removeVoucherStore } = useVoucherStore();
    const appliedCoupon = appliedVoucher;
    const [voucherError, setVoucherError] = useState('');
    const [voucherLoading, setVoucherLoading] = useState(false);
    const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
    const [showVoucherList, setShowVoucherList] = useState(false);
    const [couponsLoading, setCouponsLoading] = useState(false);

    const finalTotal = appliedCoupon ? appliedCoupon.finalAmount : totalAmount;

    React.useEffect(() => {
        const fetchPaymentMethods = async () => {
            try {
                const res = await fetch('/api/admin/extra/payment-methods');
                const data = await res.json();
                if (data.success) {
                    const activeMethods = data.data.filter((pm: PaymentMethod) => pm.is_active);
                    setPaymentMethods(activeMethods);
                    if (activeMethods.length > 0 && !activeMethods.find((m: PaymentMethod) => m.id === formData.paymentMethod)) {
                        setFormData(prev => ({ ...prev, paymentMethod: activeMethods[0].id }));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch payment methods", err);
            }
        };
        fetchPaymentMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Cập nhật form nếu user đăng nhập hoặc từ thông tin đã lưu
    React.useEffect(() => {
        const savedInfoStr = localStorage.getItem('phstore-checkout-info');
        const savedInfo = savedInfoStr ? JSON.parse(savedInfoStr) : null;

        setFormData(prev => ({
            ...prev,
            customerName: user?.name || savedInfo?.customerName || prev.customerName,
            email: user?.email || savedInfo?.email || prev.email,
            phone: user?.phone || savedInfo?.phone || prev.phone,
            address: user?.address || savedInfo?.address || prev.address
        }));
    }, [user]);

    // Fetch available coupons when panel opens
    const handleToggleVoucherList = async () => {
        const next = !showVoucherList;
        setShowVoucherList(next);
        if (next && availableCoupons.length === 0) {
            setCouponsLoading(true);
            try {
                const res = await fetch('/api/coupons/available');
                const data = await res.json();
                if (data.success) setAvailableCoupons(data.coupons);
            } catch { /* ignore */ }
            setCouponsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    // ── Apply voucher from input or coupon card ──
    const applyVoucher = async (code: string) => {
        const trimmed = code.trim().toUpperCase();
        if (!trimmed) { setVoucherError('Vui lòng nhập mã voucher.'); return; }

        setVoucherLoading(true);
        setVoucherError('');

        try {
            const res = await fetch('/api/coupons/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: trimmed, totalAmount })
            });
            const data = await res.json();

            if (data.success) {
                setVoucher({
                    code: data.coupon.code,
                    discountAmount: data.discountAmount,
                    finalAmount: data.finalAmount,
                    discount_type: data.coupon.discount_type,
                    discount_value: data.coupon.discount_value,
                });
                setVoucherInput(data.coupon.code);
                setVoucherError('');
                setShowVoucherList(false);
            } else {
                setVoucherError(data.message || 'Mã voucher không hợp lệ.');
                removeVoucherStore();
            }
        } catch {
            setVoucherError('Không thể kết nối máy chủ. Thử lại sau.');
        }
        setVoucherLoading(false);
    };

    const removeVoucher = () => {
        removeVoucherStore();
        setVoucherInput('');
        setVoucherError('');
    };

    // ===== GỬI ĐẶT HÀNG LÊN BACKEND =====
    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate phía client
        if (!formData.customerName.trim()) {
            setError('Vui lòng nhập họ tên.');
            return;
        }
        const phoneRegex = /^0[0-9]{9}$/;
        if (!phoneRegex.test(formData.phone.trim())) {
            setError('Số điện thoại không hợp lệ (phải bắt đầu bằng số 0 và dài đúng 10 số).');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) {
            setError('Email không đúng định dạng.');
            return;
        }

        if (!formData.address.trim()) {
            setError('Vui lòng nhập địa chỉ giao hàng.');
            return;
        }

        setIsLoading(true);

        try {
            // Gửi dữ liệu đến API Backend
            const orderData: OrderData = {
                id: orderId,
                ...formData,
                items,
                totalAmount,
                couponCode: appliedCoupon?.code || '',
                discountAmount: appliedCoupon?.discountAmount || 0,
                finalAmount: finalTotal,
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });

            // Kiểm tra content-type trước khi parse JSON
            const contentType = response.headers.get('content-type');
            let result;
            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
            } else {
                const text = await response.text();
                throw new Error(`Server returned non-JSON response: ${text || response.statusText}`);
            }

            if (!response.ok) {
                throw new Error(result.error || result.message || 'Có lỗi xảy ra khi đặt hàng');
            }

            // Lưu thông tin để lần sau không cần nhập lại
            localStorage.setItem('phstore-checkout-info', JSON.stringify({
                customerName: formData.customerName,
                email: formData.email,
                phone: formData.phone,
                address: formData.address
            }));

            // Nếu user đăng nhập, cập nhật luôn profile
            if (user && updateProfile) {
                updateProfile({
                    phone: formData.phone,
                    address: formData.address
                }).catch(e => console.error(e));
            }

            // Nếu thanh toán bằng VNPay hoặc MoMo
            if (formData.paymentMethod === 'vnpay' || formData.paymentMethod === 'momo') {
                const payRes = await fetch('/api/payment/create-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId: result.orderId,
                        amount: finalTotal,
                        paymentMethod: formData.paymentMethod
                    })
                });
                const payData = await payRes.json();
                if (payData.success && payData.url) {
                    window.location.href = payData.url;
                    return; // Dừng tại đây, chờ quay lại từ cổng thanh toán
                } else {
                    throw new Error('Lỗi khởi tạo cổng thanh toán: ' + (payData.message || ''));
                }
            }

            // Thành công (COD hoặc Chuyển khoản thông thường)!
            onSuccess(result.orderId, formData.email);
        } catch (err: unknown) {
            console.error('Checkout error:', err);
            setError((err as Error).message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleCheckout} className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-5">
                    Thông tin giao hàng
                </h3>

                <div className="space-y-4">
                    {/* Name */}
                    <div className="relative">
                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            name="customerName"
                            value={formData.customerName}
                            onChange={handleChange}
                            placeholder="Họ và tên *"
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 transition-all"
                            required
                        />
                    </div>

                    {/* Phone & Email Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative">
                            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Số điện thoại *"
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 transition-all"
                                required
                            />
                        </div>
                        <div className="relative">
                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Email *"
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 transition-all"
                                required
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div className="relative">
                        <MapPin size={16} className="absolute left-4 top-4 text-gray-400" />
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Địa chỉ giao hàng *"
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 transition-all"
                            required
                        />
                    </div>

                    {/* Note */}
                    <div className="relative">
                        <FileText size={16} className="absolute left-4 top-4 text-gray-400" />
                        <textarea
                            name="note"
                            value={formData.note}
                            onChange={handleChange}
                            placeholder="Ghi chú đơn hàng (tuỳ chọn)"
                            rows={3}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 transition-all resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* ─── VOUCHER SECTION ─── */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-5 flex items-center gap-2">
                    <Tag size={14} />
                    Mã giảm giá / Voucher
                </h3>

                {/* Applied badge */}
                <AnimatePresence>
                    {appliedCoupon && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="mb-4 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                                    <Check size={14} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-emerald-800">{appliedCoupon.code}</p>
                                    <p className="text-xs text-emerald-600">
                                        Giảm {appliedCoupon.discount_type === 'percent'
                                            ? `${appliedCoupon.discount_value}%`
                                            : formatPrice(appliedCoupon.discount_value)
                                        } — tiết kiệm {formatPrice(appliedCoupon.discountAmount)}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={removeVoucher}
                                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-emerald-100 text-emerald-500 transition-colors"
                                title="Xóa mã giảm giá"
                                aria-label="Xóa mã giảm giá"
                            >
                                <X size={14} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Input row */}
                {!appliedCoupon && (
                    <div className="flex gap-2 mb-3">
                        <div className="relative flex-1">
                            <Ticket size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                id="voucher-input"
                                type="text"
                                value={voucherInput}
                                onChange={e => { setVoucherInput(e.target.value); setVoucherError(''); }}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyVoucher(voucherInput); } }}
                                placeholder="Nhập mã voucher..."
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-0 rounded-xl text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-black/10 transition-all"
                            />
                        </div>
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            disabled={voucherLoading}
                            onClick={() => applyVoucher(voucherInput)}
                            className="px-5 py-3 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5"
                        >
                            {voucherLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            Áp dụng
                        </motion.button>
                    </div>
                )}

                {voucherError && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-red-500 mb-3 flex items-center gap-1.5"
                    >
                        <X size={12} /> {voucherError}
                    </motion.p>
                )}

                {/* Toggle available vouchers */}
                <button
                    type="button"
                    onClick={handleToggleVoucherList}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors"
                >
                    <Gift size={14} />
                    <span>{showVoucherList ? 'Ẩn' : 'Xem'} voucher có sẵn</span>
                    <motion.span animate={{ rotate: showVoucherList ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown size={14} />
                    </motion.span>
                </button>

                {/* Available vouchers list */}
                <AnimatePresence>
                    {showVoucherList && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-4 space-y-2">
                                {couponsLoading ? (
                                    <div className="flex items-center justify-center py-6 gap-2 text-gray-400 text-sm">
                                        <Loader2 size={16} className="animate-spin" />
                                        Đang tải voucher...
                                    </div>
                                ) : availableCoupons.length === 0 ? (
                                    <div className="text-center py-6 text-sm text-gray-400">
                                        Hiện không có voucher nào khả dụng.
                                    </div>
                                ) : (
                                    availableCoupons.map(coupon => {
                                        const isApplied = appliedCoupon?.code === coupon.code;
                                        return (
                                            <motion.div
                                                key={coupon.id}
                                                whileHover={{ scale: 1.01 }}
                                                onClick={() => !isApplied && applyVoucher(coupon.code)}
                                                className={`relative flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                                                    isApplied
                                                        ? 'border-emerald-400 bg-emerald-50'
                                                        : 'border-dashed border-gray-200 hover:border-gray-400 bg-gray-50'
                                                }`}
                                            >
                                                {/* Notch left */}
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                                    coupon.discount_type === 'percent' ? 'bg-violet-100' : 'bg-amber-100'
                                                }`}>
                                                    {coupon.discount_type === 'percent'
                                                        ? <Percent size={18} className="text-violet-600" />
                                                        : <Tag size={18} className="text-amber-600" />
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-gray-800 font-mono tracking-wider">{coupon.code}</span>
                                                        {isApplied && (
                                                            <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">Đang dùng</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        Giảm {coupon.discount_type === 'percent'
                                                            ? `${coupon.discount_value}%`
                                                            : formatPrice(coupon.discount_value)
                                                        }
                                                        {' '}• HSD: {coupon.end_date}
                                                    </p>
                                                </div>
                                                {!isApplied && (
                                                    <span className="text-xs text-black font-medium bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors shrink-0">
                                                        Dùng
                                                    </span>
                                                )}
                                                {isApplied && (
                                                    <Check size={16} className="text-emerald-500 shrink-0" />
                                                )}
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-5">
                    Phương thức thanh toán
                </h3>

                <div className="space-y-3">
                    {paymentMethods.length > 0 ? (
                        paymentMethods.map(pm => (
                            <label
                                key={pm.id}
                                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.paymentMethod === pm.id
                                    ? 'border-black bg-gray-50'
                                    : 'border-gray-100 hover:border-gray-200'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value={pm.id}
                                    checked={formData.paymentMethod === pm.id}
                                    onChange={handleChange}
                                    className="sr-only"
                                />
                                <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.paymentMethod === pm.id ? 'border-black' : 'border-gray-300'
                                        }`}
                                >
                                    {formData.paymentMethod === pm.id && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="w-2.5 h-2.5 bg-black rounded-full"
                                        />
                                    )}
                                </div>
                                {pm.id.includes('bank') ? <CreditCard size={20} className="text-gray-600" /> : <Banknote size={20} className="text-gray-600" />}
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{pm.name_methond}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{pm.description}</p>
                                </div>
                            </label>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500">Đang tải phương thức thanh toán...</p>
                    )}
                </div>

                {/* Additional info for selected method */}
                {paymentMethods.find(pm => pm.id === formData.paymentMethod)?.bank_info && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-4 p-4 bg-blue-50 rounded-xl overflow-hidden flex flex-col md:flex-row gap-4"
                    >
                        <div className="flex-1">
                            <p className="text-sm font-medium text-blue-800 mb-2">Thông tin thanh toán:</p>
                            <div className="space-y-1 text-xs text-blue-700 whitespace-pre-line">
                                {paymentMethods.find(pm => pm.id === formData.paymentMethod)?.bank_info}
                            </div>
                            
                            {/* TRANSFER CONTENT CODE */}
                            <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200 shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">Nội dung chuyển khoản (Bắt buộc):</p>
                                <div className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded">
                                    <span className="text-lg font-mono font-bold text-blue-800 tracking-wider">
                                        {orderId}
                                    </span>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                                    Vui lòng nhập chính xác nội dung này để đơn hàng được xác nhận nhanh nhất.
                                </p>
                            </div>
                        </div>
                        {paymentMethods.find(pm => pm.id === formData.paymentMethod)?.qr_code_url && (
                            <div className="shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src={paymentMethods.find(pm => pm.id === formData.paymentMethod)?.qr_code_url as string} 
                                    alt="QR Code" 
                                    className="w-32 h-32 object-contain bg-white p-1 rounded-lg shadow-sm border border-blue-100" 
                                />
                                <p className="text-[10px] text-center text-blue-600 mt-1">Quét mã để thanh toán</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-5">
                    Tóm tắt đơn hàng
                </h3>

                <div className="space-y-3">
                    {items.map((item) => (
                        <div
                            key={`${item.product.id}-${item.selectedSize}-${item.selectedColor.name}`}
                            className="flex items-center justify-between py-2"
                        >
                            <div className="flex-1">
                                <p className="text-sm text-gray-800 line-clamp-1">{item.product.name}</p>
                                <p className="text-xs text-gray-400">
                                    {item.selectedSize} • {item.selectedColor.name} • x{item.quantity}
                                </p>
                            </div>
                            <span className="text-sm font-medium text-black ml-4">
                                {formatPrice(item.product.price * item.quantity)}
                            </span>
                        </div>
                    ))}

                    <div className="border-t border-gray-100 pt-3 mt-3 space-y-1.5">
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Tạm tính</span>
                            <span>{formatPrice(totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-emerald-600">
                            <span>Phí vận chuyển</span>
                            <span>Miễn phí</span>
                        </div>

                        {/* Discount row */}
                        <AnimatePresence>
                            {appliedCoupon && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex justify-between text-sm text-rose-500"
                                >
                                    <span className="flex items-center gap-1">
                                        <Tag size={12} />
                                        Voucher ({appliedCoupon.code})
                                    </span>
                                    <span>-{formatPrice(appliedCoupon.discountAmount)}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex justify-between text-lg font-semibold text-black mt-3 pt-3 border-t border-gray-100">
                            <span>Tổng cộng</span>
                            <div className="text-right">
                                {appliedCoupon && (
                                    <p className="text-xs text-gray-400 line-through font-normal">{formatPrice(totalAmount)}</p>
                                )}
                                <span className={appliedCoupon ? 'text-rose-600' : ''}>{formatPrice(finalTotal)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 text-red-600 text-sm rounded-xl"
                >
                    ⚠️ {error}
                </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
                type="submit"
                disabled={isLoading || items.length === 0}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-4 bg-black text-white rounded-xl text-sm font-medium tracking-wide uppercase hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        Đang xử lý...
                    </>
                ) : (
                    `Đặt hàng • ${formatPrice(finalTotal)}`
                )}
            </motion.button>
        </form>
    );
}
