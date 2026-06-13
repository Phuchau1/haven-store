'use client';
// ===== CHECKOUT FORM COMPONENT =====
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Banknote, Loader2, MapPin, Phone, Mail, User, FileText } from 'lucide-react';
import { useCart } from '@/app/component/CartContext';
import { useAuth } from '@/app/component/AuthContext';
import { formatPrice } from '@/lib/format';
import { OrderData } from '@/types';

interface CheckoutFormProps {
    onSuccess: (orderId: string, email: string) => void;
}

export default function CheckoutForm({ onSuccess }: CheckoutFormProps) {
    const { items, totalAmount, clearCart } = useCart();
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

    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

    React.useEffect(() => {
        const fetchPaymentMethods = async () => {
            try {
                const res = await fetch('/api/admin/extra/payment-methods');
                const data = await res.json();
                if (data.success) {
                    const activeMethods = data.data.filter((pm: any) => pm.is_active);
                    setPaymentMethods(activeMethods);
                    if (activeMethods.length > 0 && !activeMethods.find((m:any) => m.id === formData.paymentMethod)) {
                        setFormData(prev => ({ ...prev, paymentMethod: activeMethods[0].id }));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch payment methods", err);
            }
        };
        fetchPaymentMethods();
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
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
        if (!formData.phone.trim()) {
            setError('Vui lòng nhập số điện thoại.');
            return;
        }
        if (!formData.email.trim()) {
            setError('Vui lòng nhập email.');
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
                throw new Error(result.message || 'Có lỗi xảy ra khi đặt hàng');
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
                        amount: totalAmount,
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
        } catch (err: any) {
            console.error('Checkout error:', err);
            setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
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
                                <img 
                                    src={paymentMethods.find(pm => pm.id === formData.paymentMethod)?.qr_code_url} 
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

                    <div className="border-t border-gray-100 pt-3 mt-3">
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Tạm tính</span>
                            <span>{formatPrice(totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-emerald-600 mt-1">
                            <span>Phí vận chuyển</span>
                            <span>Miễn phí</span>
                        </div>
                        <div className="flex justify-between text-lg font-semibold text-black mt-3 pt-3 border-t border-gray-100">
                            <span>Tổng cộng</span>
                            <span>{formatPrice(totalAmount)}</span>
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
                    `Đặt hàng • ${formatPrice(totalAmount)}`
                )}
            </motion.button>
        </form>
    );
}
