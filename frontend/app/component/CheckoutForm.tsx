'use client';
// ===== CHECKOUT FORM COMPONENT - CHUẨN DOANH NGHIỆP HIỆN ĐẠI =====
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CreditCard, Banknote, Loader2, MapPin, Phone, Mail, User, 
    FileText, Tag, ChevronDown, Check, X, Gift, Ticket, 
    Percent, ShieldCheck, Truck, Building2, Copy, ArrowRight,
    ShoppingBag, ChevronRight
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/app/component/CartContext';
import { useAuth } from '@/app/component/AuthContext';
import { formatPrice } from '@/lib/format';
import { OrderData } from '@/types';
import { useVoucherStore } from '@/app/store/useVoucherStore';
import { useCheckoutStore } from '@/app/store/useCheckoutStore';
import { useCartStore } from '@/app/store/useCartStore';

interface CheckoutFormProps {
    onSuccess: (orderId: string, email: string) => void;
}

interface Coupon {
    id: string;
    code: string;
    discount_type: 'percent' | 'fixed' | 'shipping';
    discount_value: number;
    start_date: string;
    end_date: string;
    usage_limit?: number;
    name?: string;
    isPersonal?: boolean;
}

interface PaymentMethod {
    id: string;
    name_methond: string;
    description?: string;
    bank_info?: string;
    qr_code_url?: string;
    is_active?: boolean;
}

interface ShippingMethod {
    id: string;
    name_methond: string;
    description: string;
    is_active?: boolean;
    cost: number;
    free_shipping_threshold?: number;
    estimated_time: string;
    logo?: string;
    original_cost?: number;
    freeship_applied?: boolean;
}

interface SavedAddress {
    id: string;
    full_name: string;
    phone: string;
    city: string;
    district: string;
    ward: string;
    street: string;
    is_default: boolean;
}

export default function CheckoutForm({ onSuccess }: CheckoutFormProps) {
    const { items: cartItems, totalAmount: cartTotalAmount } = useCart();
    const buyNowItem = useCartStore(s => s.buyNowItem);
    
    // Ưu tiên mua ngay nếu có
    const items = buyNowItem ? [buyNowItem] : cartItems;
    const totalAmount = buyNowItem ? (buyNowItem.product.price * buyNowItem.quantity) : cartTotalAmount;
    
    const { user, token, updateProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [orderId] = useState(`HV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`);
    const setStoreShippingFee = useCheckoutStore(state => state.setShippingFee);
    const router = useRouter();

    const [formData, setFormData] = useState(() => {
        let initialData = {
            customerName: user?.name || '',
            phone: '',
            email: user?.email || '',
            address: '',
            paymentMethod: 'cod',
            note: '',
            wantVAT: false,
            companyName: '',
            companyTaxId: '',
            companyAddress: ''
        };
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('phstore-checkout-temp');
            if (saved) {
                try {
                    initialData = { ...initialData, ...JSON.parse(saved) };
                } catch (e) {
                    console.error('Lỗi khi đọc temp checkout:', e);
                }
            }
        }
        return initialData;
    });

    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
    const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string>('');

    // ── Voucher states ──
    const [voucherInput, setVoucherInput] = useState('');
    const { appliedVoucher, setVoucher, removeVoucher: removeVoucherStore } = useVoucherStore();
    const appliedCoupon = appliedVoucher;
    const [voucherError, setVoucherError] = useState('');
    const [voucherLoading, setVoucherLoading] = useState(false);
    const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
    const [showVoucherList, setShowVoucherList] = useState(false);
    const [couponsLoading, setCouponsLoading] = useState(false);
    const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // ── Saved Addresses ──
    const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
    const [loadingAddresses, setLoadingAddresses] = useState(false);
    const [selectedAddressId, setSelectedAddressId] = useState<string>('');
    const [isManualAddress, setIsManualAddress] = useState(false);

    // ── Address Dropdowns ──
    const [provinces, setProvinces] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [wards, setWards] = useState<any[]>([]);
    const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(null);
    const [selectedDistrictCode, setSelectedDistrictCode] = useState<number | null>(null);
    const [localAddress, setLocalAddress] = useState({ city: '', district: '', ward: '', street: '' });

    // Tính phí vận chuyển
    const selectedShippingMethod = shippingMethods.find(sm => sm.id === selectedShippingMethodId);
    let shippingFee = 0;
    if (selectedShippingMethod) {
        const isFree = selectedShippingMethod.freeship_applied || ((selectedShippingMethod.free_shipping_threshold ?? 0) > 0 && totalAmount >= (selectedShippingMethod.free_shipping_threshold ?? 0));
        shippingFee = isFree ? 0 : selectedShippingMethod.cost;
    }
    
    useEffect(() => {
        setStoreShippingFee(shippingFee);
    }, [shippingFee, setStoreShippingFee]);

    const finalTotal = Math.max(0, (appliedCoupon ? appliedCoupon.finalAmount : totalAmount) + shippingFee);

    // Tải danh mục Tỉnh / Thành phố
    useEffect(() => {
        fetch('https://provinces.open-api.vn/api/?depth=1')
            .then(res => res.json())
            .then(data => setProvinces(data))
            .catch(console.error);
    }, []);

    const fetchDistricts = async (provinceCode: number) => {
        try {
            const res = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
            const data = await res.json();
            setDistricts(data.districts || []);
        } catch (error) { console.error(error); }
    };

    const fetchWards = async (districtCode: number) => {
        try {
            const res = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
            const data = await res.json();
            setWards(data.wards || []);
        } catch (error) { console.error(error); }
    };

    const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = Number(e.target.value);
        const name = e.target.options[e.target.selectedIndex].text;
        setSelectedProvinceCode(code);
        setLocalAddress({ ...localAddress, city: name, district: '', ward: '' });
        setDistricts([]);
        setWards([]);
        setFormData(p => ({ ...p, address: '' }));
        if (code) fetchDistricts(code);
    };

    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = Number(e.target.value);
        const name = e.target.options[e.target.selectedIndex].text;
        setSelectedDistrictCode(code);
        setLocalAddress({ ...localAddress, district: name, ward: '' });
        setWards([]);
        setFormData(p => ({ ...p, address: '' }));
        if (code) fetchWards(code);
    };

    const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const name = e.target.options[e.target.selectedIndex].text;
        setLocalAddress({ ...localAddress, ward: name });
    };

    useEffect(() => {
        if ((!selectedAddressId || isManualAddress) && localAddress.city && localAddress.district && localAddress.ward && localAddress.street) {
            setFormData(prev => ({
                ...prev,
                address: `${localAddress.street}, ${localAddress.ward}, ${localAddress.district}, ${localAddress.city}`
            }));
        }
    }, [localAddress, selectedAddressId, isManualAddress]);

    // Tải phương thức thanh toán
    useEffect(() => {
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

    // Tải đơn vị vận chuyển theo địa phương
    useEffect(() => {
        const fetchShippingMethods = async () => {
            const province = localAddress.city;
            const district = localAddress.district;
            
            if (!province) {
                setShippingMethods([]);
                setSelectedShippingMethodId('');
                return;
            }

            setIsCalculatingShipping(true);
            try {
                const totalWeight = 200 * items.reduce((sum, i) => sum + i.quantity, 0);
                const res = await fetch('/api/shipping/calculate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ province, district, totalWeight, totalAmount })
                });
                const data = await res.json();
                if (data.success) {
                    setShippingMethods(data.data);
                    if (data.data.length > 0) {
                        setSelectedShippingMethodId(data.data[0].id);
                    }
                }
            } catch (err) {
                console.error("Failed to calculate shipping", err);
            } finally {
                setIsCalculatingShipping(false);
            }
        };
        fetchShippingMethods();
    }, [localAddress.city, localAddress.district, items, totalAmount]);

    // Đồng bộ user info & sổ địa chỉ
    useEffect(() => {
        const savedInfoStr = localStorage.getItem('phstore-checkout-info');
        const savedInfo = savedInfoStr ? JSON.parse(savedInfoStr) : null;

        setFormData(prev => ({
            ...prev,
            customerName: user?.name || savedInfo?.customerName || prev.customerName,
            email: user?.email || savedInfo?.email || prev.email,
            phone: user?.phone || savedInfo?.phone || prev.phone,
            address: user?.address || savedInfo?.address || prev.address
        }));

        if (user) {
            setLoadingAddresses(true);
            fetch(`/api/addresses?user_id=${user.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.addresses.length > 0) {
                        setSavedAddresses(data.addresses);
                        const defAddr = data.addresses.find((a: SavedAddress) => a.is_default) || data.addresses[0];
                        if (defAddr && !isManualAddress) {
                            handleSelectAddress(defAddr);
                        }
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setLoadingAddresses(false));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleSelectAddress = (addr: SavedAddress) => {
        setSelectedAddressId(addr.id);
        setIsManualAddress(false);
        const fullAddressStr = `${addr.street}, ${addr.ward}, ${addr.district}, ${addr.city}`;
        setFormData(prev => ({
            ...prev,
            customerName: addr.full_name,
            phone: addr.phone,
            address: fullAddressStr
        }));
        setLocalAddress({
            city: addr.city,
            district: addr.district,
            ward: addr.ward,
            street: addr.street
        });
    };

    // Tải danh sách Voucher
    const handleToggleVoucherList = async () => {
        const next = !showVoucherList;
        setShowVoucherList(next);
        if (next && availableCoupons.length === 0) {
            setCouponsLoading(true);
            try {
                const res = await fetch('/api/coupons/available');
                const data = await res.json();
                let combinedCoupons: any[] = [];
                if (data.success) {
                    combinedCoupons = [...data.coupons];
                }

                if (user && token) {
                    try {
                        const resMy = await fetch('/api/coupons/my-coupons', {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const dataMy = await resMy.json();
                        if (dataMy.success && dataMy.coupons) {
                            const now = new Date();
                            const activeMyCoupons = dataMy.coupons
                                .filter((c: any) => !c.is_used && new Date(c.expires_at) >= now)
                                .map((c: any) => {
                                    const valueText = c.type === 'percent' 
                                        ? `${c.discount_value}%` 
                                        : c.type === 'shipping' 
                                            ? 'Miễn phí vận chuyển' 
                                            : `${c.discount_value.toLocaleString('vi-VN')}đ`;
                                    return {
                                        id: c.id,
                                        code: c.code,
                                        discount_type: c.type,
                                        discount_value: c.discount_value,
                                        start_date: new Date().toISOString().slice(0, 10),
                                        end_date: new Date(c.expires_at).toISOString().slice(0, 10),
                                        name: `Voucher Vòng quay - Giảm ${valueText}`,
                                        isPersonal: true
                                    };
                                });
                            combinedCoupons = [...activeMyCoupons, ...combinedCoupons];
                        }
                    } catch (err) {
                        console.error('Error fetching personal coupons:', err);
                    }
                }
                setAvailableCoupons(combinedCoupons);
            } catch { /* ignore */ }
            setCouponsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData((prev) => ({ ...prev, [name]: val }));
        setError('');
    };

    const applyVoucher = async (code: string) => {
        const trimmed = code.trim().toUpperCase();
        if (!trimmed) { setVoucherError('Vui lòng nhập mã voucher.'); return; }

        setVoucherLoading(true);
        setVoucherError('');

        try {
            const res = await fetch('/api/coupons/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: trimmed, totalAmount, email: formData.email })
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
                setVoucherError(data.message || 'Mã voucher không hợp lệ hoặc đã hết hạn.');
                removeVoucherStore();
            }
        } catch {
            setVoucherError('Không thể kết nối máy chủ. Vui lòng thử lại sau.');
        }
        setVoucherLoading(false);
    };

    const removeVoucher = () => {
        removeVoucherStore();
        setVoucherInput('');
        setVoucherError('');
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    // ===== GỬI ĐẶT HÀNG =====
    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!items || items.length === 0) {
            setError('Giỏ hàng của bạn đang trống.');
            return;
        }
        
        if (!formData.customerName.trim()) {
            setError('Vui lòng nhập họ và tên người nhận.');
            return;
        }

        const phoneRegex = /^0[0-9]{9}$/;
        if (!phoneRegex.test(formData.phone.trim())) {
            setError('Số điện thoại không hợp lệ (phải gồm đúng 10 chữ số, bắt đầu bằng số 0).');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) {
            setError('Email không đúng định dạng.');
            return;
        }

        if (!formData.address.trim()) {
            setError('Vui lòng chọn hoặc nhập đầy đủ địa chỉ giao hàng.');
            return;
        }

        if (!user) {
            localStorage.setItem('phstore-checkout-temp', JSON.stringify(formData));
            router.push('/login?redirect=/checkout');
            return;
        }

        setIsLoading(true);

        try {
            // 1. Validate tồn kho & voucher
            const validateRes = await fetch('/api/orders/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items,
                    couponCode: appliedCoupon?.code || ''
                })
            });
            const validateData = await validateRes.json();
            if (!validateRes.ok || !validateData.success) {
                const errorMsg = validateData.errors ? validateData.errors.join('\n') : (validateData.message || 'Không thể tạo đơn do vấn đề tồn kho.');
                throw new Error(errorMsg);
            }

            // 2. Tạo đơn hàng
            const orderData: OrderData = {
                id: orderId,
                ...formData,
                items,
                totalAmount,
                couponCode: appliedCoupon ? appliedCoupon.code : '',
                discountAmount: appliedCoupon ? appliedCoupon.discountAmount : 0,
                finalAmount: finalTotal,
                shippingFee,
                shippingMethodId: selectedShippingMethodId,
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });

            const contentType = response.headers.get('content-type');
            let result;
            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
            } else {
                const text = await response.text();
                throw new Error(`Server response error: ${text || response.statusText}`);
            }

            if (!response.ok) {
                throw new Error(result.error || result.message || 'Có lỗi xảy ra khi đặt hàng');
            }

            // Lưu cache
            localStorage.setItem('phstore-checkout-info', JSON.stringify({
                customerName: formData.customerName,
                email: formData.email,
                phone: formData.phone,
                address: formData.address
            }));

            if (user && updateProfile) {
                updateProfile({
                    phone: formData.phone,
                    address: formData.address
                }).catch(e => console.error(e));
            }

            // Cổng thanh toán Online (VNPay / MoMo)
            if (formData.paymentMethod === 'vnpay' || formData.paymentMethod === 'momo') {
                const payRes = await fetch('/api/payment/create-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId: result.orderId,
                        amount: result.finalAmount || finalTotal,
                        paymentMethod: formData.paymentMethod
                    })
                });
                const payData = await payRes.json();
                if (payData.success && payData.url) {
                    window.location.href = payData.url;
                    return;
                } else {
                    throw new Error('Lỗi khởi tạo cổng thanh toán: ' + (payData.message || ''));
                }
            }

            localStorage.removeItem('phstore-checkout-temp');
            onSuccess(result.orderId, formData.email);
        } catch (err: unknown) {
            console.error('Checkout error:', err);
            setError((err as Error).message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ════════════ CỘT TRÁI: MASTER CONTAINER GIAO HÀNG & THANH TOÁN (7 PHẦN) ════════════ */}
            <div className="lg:col-span-7">
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
                    
                    {/* ── BƯỚC 1: THÔNG TIN GIAO HÀNG ── */}
                    <div className="p-6 sm:p-8">
                        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <span className="w-2 h-6 bg-[#0f172a] rounded-full" />
                                <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-slate-950">
                                    1. Thông tin giao hàng
                                </h2>
                            </div>

                            {user && savedAddresses.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setIsManualAddress(!isManualAddress)}
                                    className="text-sm font-bold text-[#1e40af] hover:underline cursor-pointer"
                                >
                                    {isManualAddress ? '← Chọn từ sổ địa chỉ' : '+ Thêm địa chỉ mới'}
                                </button>
                            )}
                        </div>

                        {/* Sổ địa chỉ đã lưu */}
                        {user && savedAddresses.length > 0 && !isManualAddress && (
                            <div className="mb-6">
                                <p className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <MapPin size={16} className="text-slate-900" />
                                    Địa chỉ nhận hàng đã lưu
                                </p>
                                {loadingAddresses ? (
                                    <div className="animate-pulse h-20 bg-slate-100 rounded-xl" />
                                ) : (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {savedAddresses.map(addr => {
                                            const isSelected = selectedAddressId === addr.id;
                                            return (
                                                <div 
                                                    key={addr.id}
                                                    onClick={() => handleSelectAddress(addr)}
                                                    className={`p-4 rounded-xl cursor-pointer border transition-all relative ${
                                                        isSelected 
                                                            ? 'border-slate-950 bg-slate-50/80 shadow-xs' 
                                                            : 'border-slate-200 bg-white hover:border-slate-400'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                        <span className="font-bold text-slate-950 text-base truncate">
                                                            {addr.full_name}
                                                        </span>
                                                        {addr.is_default && (
                                                            <span className="text-xs font-bold bg-[#0f172a] text-white px-2.5 py-0.5 rounded-md">
                                                                Mặc định
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-800 font-semibold mb-1">
                                                        {addr.phone}
                                                    </p>
                                                    <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                                                        {addr.street}, {addr.ward}, {addr.district}, {addr.city}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Form nhập thông tin chi tiết */}
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {/* Họ tên */}
                                <div>
                                    <label className="block text-sm sm:text-[15px] font-bold text-slate-900 mb-2">
                                        Họ và tên người nhận <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="customerName"
                                        value={formData.customerName}
                                        onChange={handleChange}
                                        placeholder="Ví dụ: Nguyễn Văn A"
                                        required
                                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm sm:text-base font-medium text-slate-900 focus:border-slate-950 focus:ring-1 focus:ring-slate-950 outline-none transition-all placeholder:text-slate-400"
                                    />
                                </div>

                                {/* Số điện thoại */}
                                <div>
                                    <label className="block text-sm sm:text-[15px] font-bold text-slate-900 mb-2">
                                        Số điện thoại <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="0987 654 321"
                                        required
                                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm sm:text-base font-medium text-slate-900 focus:border-slate-950 focus:ring-1 focus:ring-slate-950 outline-none transition-all placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            {/* Email nhận xác nhận đơn */}
                            <div>
                                <label className="block text-sm sm:text-[15px] font-bold text-slate-900 mb-2">
                                    Email nhận thông báo đơn hàng <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="name@example.com"
                                    required
                                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm sm:text-base font-medium text-slate-900 focus:border-slate-950 focus:ring-1 focus:ring-slate-950 outline-none transition-all placeholder:text-slate-400"
                                />
                            </div>

                            {/* 3 Dropdowns Tỉnh / Quận / Phường khi nhập mới hoặc sửa */}
                            {(!selectedAddressId || isManualAddress) && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="space-y-4 pt-1"
                                >
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {/* Tỉnh / Thành */}
                                        <div>
                                            <label className="block text-sm sm:text-[15px] font-bold text-slate-900 mb-2">
                                                Tỉnh / Thành phố <span className="text-rose-500">*</span>
                                            </label>
                                            <select 
                                                required 
                                                value={selectedProvinceCode || ''} 
                                                onChange={handleProvinceChange}
                                                className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-sm sm:text-base font-medium text-slate-800 focus:border-slate-950 outline-none"
                                            >
                                                <option value="" disabled>Chọn Tỉnh/Thành</option>
                                                {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                                            </select>
                                        </div>

                                        {/* Quận / Huyện */}
                                        <div>
                                            <label className="block text-sm sm:text-[15px] font-bold text-slate-900 mb-2">
                                                Quận / Huyện <span className="text-rose-500">*</span>
                                            </label>
                                            <select 
                                                required 
                                                disabled={!selectedProvinceCode} 
                                                value={selectedDistrictCode || ''} 
                                                onChange={handleDistrictChange}
                                                className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-sm sm:text-base font-medium text-slate-800 focus:border-slate-950 outline-none disabled:bg-slate-50 disabled:opacity-50"
                                            >
                                                <option value="" disabled>Chọn Quận/Huyện</option>
                                                {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                                            </select>
                                        </div>

                                        {/* Phường / Xã */}
                                        <div>
                                            <label className="block text-sm sm:text-[15px] font-bold text-slate-900 mb-2">
                                                Phường / Xã <span className="text-rose-500">*</span>
                                            </label>
                                            <select 
                                                required 
                                                disabled={!selectedDistrictCode} 
                                                value={localAddress.ward ? wards.find(w=>w.name===localAddress.ward)?.code || '' : ''} 
                                                onChange={handleWardChange}
                                                className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-sm sm:text-base font-medium text-slate-800 focus:border-slate-950 outline-none disabled:bg-slate-50 disabled:opacity-50"
                                            >
                                                <option value="" disabled>Chọn Phường/Xã</option>
                                                {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Số nhà, tên đường */}
                                    <div>
                                        <label className="block text-sm sm:text-[15px] font-bold text-slate-900 mb-2">
                                            Địa chỉ cụ thể (Số nhà, tên đường, tòa nhà) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={localAddress.street}
                                            onChange={e => setLocalAddress({...localAddress, street: e.target.value})}
                                            placeholder="Ví dụ: Tầng 4, Số 123 Đường Nguyễn Trãi..."
                                            required
                                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm sm:text-base font-medium text-slate-900 focus:border-slate-950 focus:ring-1 focus:ring-slate-950 outline-none transition-all placeholder:text-slate-400"
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {/* Ghi chú đơn hàng */}
                            <div>
                                <label className="block text-sm sm:text-[15px] font-bold text-slate-900 mb-2">
                                    Ghi chú đơn hàng (Tùy chọn)
                                </label>
                                <textarea
                                    name="note"
                                    value={formData.note}
                                    onChange={handleChange}
                                    placeholder="Ghi chú thêm về thời gian nhận hàng hoặc hướng dẫn giao..."
                                    rows={2}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm sm:text-base font-medium text-slate-900 focus:border-slate-950 focus:ring-1 focus:ring-slate-950 outline-none transition-all resize-none placeholder:text-slate-400"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── BƯỚC 2: PHƯƠNG THỨC VẬN CHUYỂN ── */}
                    <div className="p-6 sm:p-8">
                        <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
                            <span className="w-2 h-6 bg-[#0f172a] rounded-full" />
                            <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-slate-950">
                                2. Phương thức vận chuyển
                            </h2>
                        </div>

                        {isCalculatingShipping ? (
                            <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                                <Loader2 className="w-6 h-6 animate-spin mb-2 text-slate-700" />
                                <p className="text-sm font-medium">Đang tính toán cước phí vận chuyển...</p>
                            </div>
                        ) : shippingMethods.length === 0 ? (
                            <div className="text-center py-5 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-600 text-sm">
                                📍 Vui lòng chọn Tỉnh/Thành phố ở bước 1 để hiển thị các đơn vị vận chuyển khả dụng.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {shippingMethods.map(sm => {
                                    const isFree = sm.freeship_applied || ((sm.free_shipping_threshold ?? 0) > 0 && totalAmount >= (sm.free_shipping_threshold ?? 0));
                                    const isSelected = selectedShippingMethodId === sm.id;
                                    return (
                                        <label
                                            key={sm.id}
                                            className={`flex items-center justify-between gap-4 py-4 px-4.5 rounded-xl border transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'border-slate-950 bg-slate-50/80 shadow-2xs'
                                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <input
                                                    type="radio"
                                                    name="shippingMethod"
                                                    value={sm.id}
                                                    checked={isSelected}
                                                    onChange={(e) => setSelectedShippingMethodId(e.target.value)}
                                                    className="sr-only"
                                                />
                                                
                                                {/* Minimalist Radio Indicator */}
                                                <div className={`w-5 h-5 rounded-full border transition-all flex items-center justify-center shrink-0 ${
                                                    isSelected ? 'border-slate-950 bg-white ring-2 ring-slate-950' : 'border-slate-300 bg-white'
                                                }`}>
                                                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-slate-950" />}
                                                </div>

                                                {/* Info */}
                                                <div className="min-w-0">
                                                    <p className="text-base font-bold text-slate-950">
                                                        {sm.name_methond}
                                                    </p>
                                                    <p className="text-sm text-slate-600 font-medium mt-1">
                                                        Dự kiến giao hàng: {sm.estimated_time || '2 - 3 ngày làm việc'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Price / Free Badge */}
                                            <div className="text-right shrink-0">
                                                {isFree ? (
                                                    <span className="text-xs sm:text-sm font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-md">
                                                        MIỄN PHÍ
                                                    </span>
                                                ) : (
                                                    <span className="text-base sm:text-lg font-bold text-slate-950">
                                                        {formatPrice(sm.cost)}
                                                    </span>
                                                )}
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── BƯỚC 3: PHƯƠNG THỨC THANH TOÁN ── */}
                    <div className="p-6 sm:p-8">
                        <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
                            <span className="w-2 h-6 bg-[#0f172a] rounded-full" />
                            <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-slate-950">
                                3. Phương thức thanh toán
                            </h2>
                        </div>

                        <div className="space-y-3">
                            {paymentMethods.length > 0 ? (
                                paymentMethods.map(pm => {
                                    const isSelected = formData.paymentMethod === pm.id;
                                    const isVNPay = pm.id === 'vnpay' || pm.id.includes('vnpay');
                                    const isMoMo = pm.id === 'momo' || pm.id.includes('momo');
                                    const isCOD = pm.id === 'cod' || pm.id.includes('cod');
                                    return (
                                        <label
                                            key={pm.id}
                                            className={`flex items-center gap-4 py-4 px-4.5 rounded-xl border transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'border-slate-950 bg-slate-50/80 shadow-2xs'
                                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value={pm.id}
                                                checked={isSelected}
                                                onChange={handleChange}
                                                className="sr-only"
                                            />

                                            {/* Delicate Radio Indicator */}
                                            <div className={`w-5 h-5 rounded-full border transition-all flex items-center justify-center shrink-0 ${
                                                isSelected ? 'border-slate-950 bg-white ring-2 ring-slate-950' : 'border-slate-300 bg-white'
                                            }`}>
                                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-slate-950" />}
                                            </div>

                                            {/* Payment Method Badge */}
                                            {isVNPay ? (
                                                <div className="w-11 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-2xs">
                                                    <span className="text-white text-[10px] font-black tracking-tight leading-tight text-center">VN<br/>PAY</span>
                                                </div>
                                            ) : isMoMo ? (
                                                <div className="w-11 h-8 bg-[#ae2070] rounded-lg flex items-center justify-center shrink-0 shadow-2xs">
                                                    <span className="text-white text-[11px] font-black">MoMo</span>
                                                </div>
                                            ) : isCOD ? (
                                                <div className="w-11 h-8 bg-amber-500 rounded-lg flex items-center justify-center shrink-0 shadow-2xs">
                                                    <Banknote size={19} className="text-white" />
                                                </div>
                                            ) : (
                                                <div className="w-11 h-8 bg-slate-800 rounded-lg flex items-center justify-center shrink-0 shadow-2xs">
                                                    <CreditCard size={19} className="text-white" />
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0">
                                                <p className="text-base font-bold text-slate-950">
                                                    {pm.name_methond}
                                                </p>
                                                <p className="text-sm text-slate-600 font-medium truncate mt-0.5">
                                                    {pm.description || 'Thanh toán an toàn và tiện lợi.'}
                                                </p>
                                            </div>
                                        </label>
                                    );
                                })
                            ) : null}
                        </div>

                        {/* Hướng dẫn chuyển khoản chi tiết nếu chọn Chuyển khoản */}
                        {paymentMethods.find(pm => pm.id === formData.paymentMethod)?.bank_info && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="mt-5 p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row gap-5 items-center"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold uppercase text-slate-900 tracking-wider mb-2">
                                        Thông tin tài khoản nhận thanh toán:
                                    </p>
                                    <div className="text-sm text-slate-800 font-medium space-y-1.5 whitespace-pre-line leading-relaxed">
                                        {paymentMethods.find(pm => pm.id === formData.paymentMethod)?.bank_info}
                                    </div>
                                    
                                    {/* Khung cú pháp chuyển khoản có nút Copy */}
                                    <div className="mt-4 p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                                        <div>
                                            <p className="text-xs uppercase font-bold text-slate-500">
                                                Cú pháp chuyển khoản:
                                            </p>
                                            <p className="text-base font-mono font-black text-[#0f172a]">
                                                {orderId}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(orderId, 'orderId')}
                                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-bold rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                                        >
                                            {copiedField === 'orderId' ? <Check size={16} /> : <Copy size={16} />}
                                            {copiedField === 'orderId' ? 'Đã sao chép' : 'Sao chép'}
                                        </button>
                                    </div>
                                </div>

                                {paymentMethods.find(pm => pm.id === formData.paymentMethod)?.qr_code_url && (
                                    <div className="flex flex-col items-center shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img 
                                            src={paymentMethods.find(pm => pm.id === formData.paymentMethod)?.qr_code_url as string} 
                                            alt="VietQR Chuyển khoản" 
                                            className="w-36 h-36 object-contain bg-white p-1 rounded-xl shadow-2xs border border-slate-200" 
                                        />
                                        <span className="text-xs font-bold text-slate-800 mt-2">
                                            Quét VietQR tự động
                                        </span>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>

                    {/* ── BƯỚC 4: XUẤT HÓA ĐƠN VAT DOANH NGHIỆP (TÙY CHỌN) ── */}
                    <div className="p-6 sm:p-8">
                        <label className="flex items-center gap-3.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                name="wantVAT"
                                checked={formData.wantVAT}
                                onChange={handleChange}
                                className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                            />
                            <span className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Building2 size={18} className="text-slate-700" />
                                Yêu cầu xuất hóa đơn điện tử VAT (Doanh nghiệp)
                            </span>
                        </label>

                        {formData.wantVAT && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-5 space-y-4 pt-4 border-t border-slate-100"
                            >
                                <div>
                                    <label className="block text-sm sm:text-[15px] font-bold text-slate-900 mb-2">Tên công ty *</label>
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        placeholder="Công ty TNHH / Cổ phần..."
                                        required={formData.wantVAT}
                                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm sm:text-base font-medium text-slate-900 focus:border-slate-950 focus:ring-1 focus:ring-slate-950 outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm sm:text-[15px] font-bold text-slate-900 mb-2">Mã số thuế *</label>
                                        <input
                                            type="text"
                                            name="companyTaxId"
                                            value={formData.companyTaxId}
                                            onChange={handleChange}
                                            placeholder="0123456789..."
                                            required={formData.wantVAT}
                                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm sm:text-base font-medium text-slate-900 focus:border-slate-950 focus:ring-1 focus:ring-slate-950 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm sm:text-[15px] font-bold text-slate-900 mb-2">Địa chỉ công ty *</label>
                                        <input
                                            type="text"
                                            name="companyAddress"
                                            value={formData.companyAddress}
                                            onChange={handleChange}
                                            placeholder="Địa chỉ trụ sở chính..."
                                            required={formData.wantVAT}
                                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm sm:text-base font-medium text-slate-900 focus:border-slate-950 focus:ring-1 focus:ring-slate-950 outline-none"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4.5 bg-red-50 border border-red-200 text-red-700 text-sm sm:text-base font-bold rounded-2xl flex items-center gap-2"
                    >
                        <span>⚠️ {error}</span>
                    </motion.div>
                )}
            </div>

            {/* ════════════ CỘT PHẢI: TÓM TẮT ĐƠN HÀNG & NÚT ĐẶT HÀNG ════════════ */}
            <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
                <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs">
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-6 bg-[#0f172a] rounded-full" />
                            <h3 className="text-lg sm:text-xl font-black uppercase tracking-wider text-slate-950">
                                Đơn hàng ({items.reduce((s, i) => s + i.quantity, 0)})
                            </h3>
                        </div>
                    </div>

                    {/* Danh sách sản phẩm trong giỏ */}
                    <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
                        {items.map((item) => (
                            <div
                                key={`${item.product.id}-${item.selectedSize}-${item.selectedColor.name}`}
                                className="flex items-center gap-4 py-2"
                            >
                                {/* Wrapper ảnh có badge số lượng */}
                                <div className="relative w-18 h-20 flex-shrink-0">
                                    <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                                        <Image
                                            src={item.product.images[0]}
                                            alt={item.product.name}
                                            fill
                                            className="object-cover"
                                            sizes="80px"
                                        />
                                    </div>
                                    <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-5.5 px-1.5 bg-[#0f172a] text-white text-xs rounded-full flex items-center justify-center font-bold border-2 border-white shadow-2xs z-10">
                                        {item.quantity}
                                    </span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm sm:text-base font-bold text-slate-950 line-clamp-1">
                                        {item.product.name}
                                    </h4>
                                    <p className="text-sm text-slate-600 font-medium mt-0.5">
                                        Phân loại: {item.selectedSize} · {item.selectedColor.name}
                                    </p>
                                    <p className="text-base font-bold text-slate-950 mt-1">
                                        {formatPrice(item.product.price * item.quantity)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── MÃ GIẢM GIÁ / VOUCHER ── */}
                    <div className="pt-4 mt-4 border-t border-slate-100">
                        {/* Khi đã áp voucher */}
                        <AnimatePresence>
                            {appliedCoupon && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    className="mb-3.5 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0">
                                            <Check size={15} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-emerald-950">{appliedCoupon.code}</p>
                                            <p className="text-xs sm:text-sm text-emerald-800 font-semibold">
                                                Tiết kiệm {formatPrice(appliedCoupon.discountAmount)}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={removeVoucher}
                                        className="text-slate-400 hover:text-rose-600 p-1.5 cursor-pointer transition-colors"
                                        title="Gỡ mã giảm giá"
                                    >
                                        <X size={18} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Ô nhập mã Voucher */}
                        {!appliedCoupon && (
                            <div className="flex gap-2.5 mb-3">
                                <input
                                    type="text"
                                    value={voucherInput}
                                    onChange={e => { setVoucherInput(e.target.value); setVoucherError(''); }}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyVoucher(voucherInput); } }}
                                    placeholder="Nhập mã ưu đãi / voucher..."
                                    className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm sm:text-base font-bold uppercase text-slate-900 placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 focus:border-slate-950 focus:ring-1 focus:ring-slate-950 outline-none"
                                />
                                <button
                                    type="button"
                                    disabled={voucherLoading || !voucherInput.trim()}
                                    onClick={() => applyVoucher(voucherInput)}
                                    className="px-5 py-3 bg-[#0f172a] hover:bg-[#1e293b] text-white text-sm font-bold uppercase rounded-xl disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                                >
                                    {voucherLoading ? <Loader2 size={15} className="animate-spin" /> : 'Áp dụng'}
                                </button>
                            </div>
                        )}

                        {voucherError && (
                            <p className="text-sm text-rose-600 mb-2.5 flex items-center gap-1 font-semibold">
                                <X size={14} /> {voucherError}
                            </p>
                        )}

                        {/* Nút xem voucher có sẵn */}
                        <button
                            type="button"
                            onClick={handleToggleVoucherList}
                            className="text-sm font-bold text-[#1e40af] hover:underline flex items-center gap-1.5 cursor-pointer mt-1"
                        >
                            <Gift size={16} />
                            <span>{showVoucherList ? 'Thu gọn voucher' : 'Xem voucher & ưu đãi có sẵn'}</span>
                            <ChevronDown size={15} className={`transition-transform duration-200 ${showVoucherList ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Danh sách voucher có sẵn */}
                        <AnimatePresence>
                            {showVoucherList && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-3.5 space-y-2.5 max-h-[260px] overflow-y-auto pr-0.5 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
                                        {couponsLoading ? (
                                            <div className="py-4 text-center text-sm text-slate-400">Đang tải mã giảm giá...</div>
                                        ) : availableCoupons.length === 0 ? (
                                            <div className="py-3 text-center text-sm text-slate-400">Chưa có voucher khả dụng.</div>
                                        ) : (
                                            availableCoupons.map(coupon => {
                                                const isApplied = appliedCoupon?.code === coupon.code;
                                                return (
                                                    <div
                                                        key={coupon.id}
                                                        onClick={() => !isApplied && applyVoucher(coupon.code)}
                                                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                                            isApplied ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50/80 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono font-bold text-sm sm:text-base text-slate-900 tracking-wide">{coupon.code}</span>
                                                                {coupon.isPersonal && (
                                                                    <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded font-bold">Vòng quay</span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-slate-600 font-medium mt-0.5">
                                                                {coupon.name || `Giảm ${coupon.discount_type === 'percent' ? `${coupon.discount_value}%` : formatPrice(coupon.discount_value)}`}
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold shrink-0 transition-colors ${
                                                                isApplied ? 'bg-emerald-600 text-white' : 'bg-[#0f172a] hover:bg-[#1e293b] text-white'
                                                            }`}
                                                        >
                                                            {isApplied ? 'Đang dùng' : 'Dùng mã'}
                                                        </button>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ── BẢNG TỔNG KẾT CHI PHÍ ── */}
                    <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                        <div className="flex justify-between text-sm sm:text-base text-slate-700 font-medium">
                            <span>Tạm tính tiền hàng</span>
                            <span className="text-slate-950 font-bold">{formatPrice(totalAmount)}</span>
                        </div>

                        <div className="flex justify-between text-sm sm:text-base text-slate-700 font-medium">
                            <span>Phí vận chuyển</span>
                            <span className={shippingFee === 0 ? 'text-emerald-700 font-bold' : 'text-slate-950 font-bold'}>
                                {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
                            </span>
                        </div>

                        {appliedCoupon && (
                            <div className="flex justify-between text-sm sm:text-base text-rose-600 font-bold">
                                <span>Giảm giá Voucher</span>
                                <span>-{formatPrice(appliedCoupon.discountAmount)}</span>
                            </div>
                        )}

                        <div className="pt-4 mt-4 border-t border-slate-200 flex justify-between items-baseline">
                            <div>
                                <span className="text-sm font-bold uppercase tracking-wider text-slate-600 block">
                                    Tổng thanh toán
                                </span>
                                <span className="text-xs text-slate-400 font-normal">
                                    (Đã bao gồm VAT)
                                </span>
                            </div>
                            <div className="text-right">
                                {appliedCoupon && (
                                    <span className="text-sm text-slate-400 line-through block font-mono">
                                        {formatPrice(totalAmount + shippingFee)}
                                    </span>
                                )}
                                <span className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">
                                    {formatPrice(finalTotal)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ── NÚT ĐẶT HÀNG NGAY ── */}
                    <div className="pt-5 mt-4 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={isLoading || items.length === 0}
                            className="w-full py-4.5 px-6 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl text-base sm:text-lg font-bold uppercase tracking-wider shadow-md active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 cursor-pointer"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Đang xử lý đơn hàng...</span>
                                </>
                            ) : (
                                <>
                                    <span>XÁC NHẬN ĐẶT HÀNG · {formatPrice(finalTotal)}</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </div>

                    {/* ── CAM KẾT CHÍNH HÃNG ── */}
                    <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 gap-3 text-sm text-slate-700 font-medium">
                        <div className="flex items-center gap-3">
                            <Truck size={18} className="text-[#0f172a] shrink-0" />
                            <span>Kiểm tra hàng trước khi thanh toán</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Check size={18} className="text-amber-600 shrink-0" />
                            <span>Đổi trả chính hãng trong vòng 30 ngày</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── STICKY BAR ĐẶT HÀNG TRÊN MOBILE ── */}
            <div className="fixed bottom-0 left-0 right-0 z-50 p-3.5 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl lg:hidden flex items-center justify-between gap-3.5">
                <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-bold uppercase">Tổng tiền:</p>
                    <p className="text-base sm:text-lg font-black text-slate-950 truncate">
                        {formatPrice(finalTotal)}
                    </p>
                </div>
                <button
                    type="submit"
                    disabled={isLoading || items.length === 0}
                    className="flex-1 py-3.5 px-4 bg-[#0f172a] text-white rounded-xl text-sm font-bold uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <><span>ĐẶT HÀNG NGAY</span><ChevronRight size={16} /></>}
                </button>
            </div>
        </form>
    );
}
