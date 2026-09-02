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
    const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string>('GHN');

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

    // ── HAVEN Wallet balance ──
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [loadingWallet, setLoadingWallet] = useState(false);

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

    const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
        { id: 'cod', name_methond: 'Thanh toán khi nhận hàng (COD)', description: 'Thanh toán tiền mặt trực tiếp khi nhận hàng tận nơi.', is_active: true },
        { id: 'vnpay', name_methond: 'Thanh toán qua Cổng VNPay', description: 'Hỗ trợ thẻ ATM nội địa, QR Pay, Visa/Mastercard.', is_active: true },
        { id: 'momo', name_methond: 'Thanh toán qua Ví MoMo', description: 'Quét mã MoMo hoặc liên kết tài khoản tiện lợi.', is_active: true },
        { id: 'bank-transfer', name_methond: 'Chuyển khoản Ngân hàng (VietQR 247)', description: 'Quét mã VietQR chuyển khoản nhanh 24/7 tự động.', is_active: true }
    ];

    // Tính phí vận chuyển tức thì (Instant Zero-Latency Calculation)
    const computeInstantShippingMethods = (province: string, totalWeight: number, totalAmt: number): ShippingMethod[] => {
        const isHCM = province ? (province.toLowerCase().includes('hồ chí minh') || province.toLowerCase().includes('hcm')) : false;
        const isHN = province ? (province.toLowerCase().includes('hà nội') || province.toLowerCase().includes('ha noi')) : false;
        const isMajor = isHCM || isHN;

        const baseGHN = isMajor ? 20000 : 35000;
        const baseGHTK = isMajor ? 18000 : 32000;
        const baseViettel = isMajor ? 22000 : 38000;
        const baseJT = isMajor ? 15000 : 30000;

        let weightSurcharge = 0;
        if (totalWeight > 500) {
            const extraWeight = totalWeight - 500;
            weightSurcharge = Math.ceil(extraWeight / 500) * 5000;
        }

        const isFreeship = totalAmt >= 500000;

        return [
            {
                id: 'GHN',
                name_methond: 'Giao Hàng Nhanh (GHN Express)',
                description: 'Giao hàng tiêu chuẩn toàn quốc',
                cost: isFreeship ? 0 : baseGHN + weightSurcharge,
                original_cost: baseGHN + weightSurcharge,
                estimated_time: isMajor ? '1-2 ngày' : '2-3 ngày',
                freeship_applied: isFreeship,
                is_active: true
            },
            {
                id: 'GHTK',
                name_methond: 'Giao Hàng Tiết Kiệm (GHTK)',
                description: 'Giao hàng tiết kiệm',
                cost: isFreeship ? 0 : baseGHTK + weightSurcharge,
                original_cost: baseGHTK + weightSurcharge,
                estimated_time: isMajor ? '1-2 ngày' : '3-4 ngày',
                freeship_applied: isFreeship,
                is_active: true
            },
            {
                id: 'VIETTEL',
                name_methond: 'Viettel Post',
                description: 'Chuyển phát tiêu chuẩn',
                cost: isFreeship ? 0 : baseViettel + weightSurcharge,
                original_cost: baseViettel + weightSurcharge,
                estimated_time: isMajor ? '1-2 ngày' : '3-5 ngày',
                freeship_applied: isFreeship,
                is_active: true
            },
            {
                id: 'JT',
                name_methond: 'J&T Express',
                description: 'Giao hàng tiêu chuẩn',
                cost: isFreeship ? 0 : baseJT + weightSurcharge,
                original_cost: baseJT + weightSurcharge,
                estimated_time: isMajor ? '1-2 ngày' : '3-4 ngày',
                freeship_applied: isFreeship,
                is_active: true
            }
        ];
    };

    // Tải đơn vị vận chuyển theo địa phương tức thì (Zero Latency)
    useEffect(() => {
        const province = localAddress.city;
        const totalWeight = 200 * items.reduce((sum, i) => sum + i.quantity, 0);
        
        // Cập nhật tức thì không độ trễ
        const instantMethods = computeInstantShippingMethods(province, totalWeight, totalAmount);
        setShippingMethods(instantMethods);
        if (!selectedShippingMethodId || !instantMethods.find(m => m.id === selectedShippingMethodId)) {
            setSelectedShippingMethodId(instantMethods[0].id);
        }

        // Đồng bộ ngầm với backend nếu có địa chỉ
        if (province) {
            fetch('/api/shipping/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ province, district: localAddress.district, totalWeight, totalAmount })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                    setShippingMethods(data.data);
                }
            })
            .catch(() => {});
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localAddress.city, localAddress.district, totalAmount]);

    // Đồng bộ user info & sổ địa chỉ
    useEffect(() => {
        const savedInfoStr = localStorage.getItem('phstore-checkout-info');
        const savedInfo = savedInfoStr ? JSON.parse(savedInfoStr) : null;

        const initialAddress = user?.address || savedInfo?.address || '';

        setFormData(prev => ({
            ...prev,
            customerName: user?.name || savedInfo?.customerName || prev.customerName,
            email: user?.email || savedInfo?.email || prev.email,
            phone: user?.phone || savedInfo?.phone || prev.phone,
            address: initialAddress || prev.address
        }));

        if (initialAddress && !localAddress.street) {
            setLocalAddress(prev => ({ ...prev, street: initialAddress }));
        }

        if (user) {
            setLoadingAddresses(true);
            fetch(`/api/addresses?user_id=${user.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.addresses && data.addresses.length > 0) {
                        setSavedAddresses(data.addresses);
                        const defAddr = data.addresses.find((a: SavedAddress) => a.is_default) || data.addresses[0];
                        if (defAddr && !isManualAddress) {
                            handleSelectAddress(defAddr);
                        }
                    } else {
                        // Nếu chưa có sổ địa chỉ, kích hoạt chế độ nhập thủ công
                        setIsManualAddress(true);
                    }
                })
                .catch(err => {
                    console.error(err);
                    setIsManualAddress(true);
                })
                .finally(() => setLoadingAddresses(false));
        } else {
            setIsManualAddress(true);
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

                if (user) {
                    try {
                        const headers: Record<string, string> = {};
                        if (token) headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
                        if (user.id) headers['x-user-id'] = user.id;

                        const queryParam = user.id ? `?user_id=${encodeURIComponent(user.id)}` : '';
                        const resMy = await fetch(`/api/coupons/my-coupons${queryParam}`, {
                            headers
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

        let finalAddress = formData.address.trim();
        if (!finalAddress) {
            finalAddress = (localAddress.street || user?.address || '').trim();
            if (finalAddress) {
                setFormData(prev => ({ ...prev, address: finalAddress }));
            }
        }

        if (!finalAddress) {
            setError('Vui lòng nhập đầy đủ địa chỉ giao hàng nhận hàng.');
            return;
        }

        if (!user) {
            localStorage.setItem('phstore-checkout-temp', JSON.stringify(formData));
            router.push('/login?redirect=/checkout');
            return;
        }

        if (formData.paymentMethod === 'wallet' && (walletBalance ?? 0) < finalTotal) {
            setError(`Số dư ví HAVEN không đủ để thanh toán. Số dư hiện có: ${formatPrice(walletBalance ?? 0)}, cần thanh toán: ${formatPrice(finalTotal)}. Vui lòng nạp thêm tiền hoặc chọn phương thức khác.`);
            return;
        }

        setIsLoading(true);

        try {
            // 1. Validate tồn kho & voucher (bỏ qua chặn cứng nếu mạng chập chờn)
            try {
                const validateRes = await fetch('/api/orders/validate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        items,
                        couponCode: appliedCoupon?.code || ''
                    })
                });
                const validateData = await validateRes.json();
                if (validateRes.ok && validateData.success === false && validateData.errors?.length) {
                    throw new Error(validateData.errors.join('\n'));
                }
            } catch (valErr: any) {
                if (valErr.message && !valErr.message.includes('fetch')) {
                    throw valErr;
                }
            }

            // 2. Tạo đơn hàng
            const orderData: OrderData = {
                id: orderId,
                userId: user?.id || '',
                ...formData,
                address: finalAddress,
                items,
                totalAmount,
                couponCode: appliedCoupon ? appliedCoupon.code : '',
                discountAmount: appliedCoupon ? appliedCoupon.discountAmount : 0,
                finalAmount: finalTotal,
                shippingFee,
                shippingMethodId: selectedShippingMethodId || 'GHN',
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
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

            // Cập nhật số dư ví tức thì nếu vừa thanh toán bằng Ví HAVEN
            if (result.newWalletBalance !== undefined) {
                setWalletBalance(result.newWalletBalance);
                try {
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                        const parsed = JSON.parse(storedUser);
                        parsed.walletBalance = result.newWalletBalance;
                        localStorage.setItem('user', JSON.stringify(parsed));
                    }
                } catch (e) {
                    console.error('Lỗi khi cập nhật localStorage user wallet:', e);
                }
            }

            // Lưu cache
            localStorage.setItem('phstore-checkout-info', JSON.stringify({
                customerName: formData.customerName,
                email: formData.email,
                phone: formData.phone,
                address: finalAddress
            }));

            if (user && updateProfile) {
                updateProfile({
                    phone: formData.phone,
                    address: finalAddress
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
        <form onSubmit={handleCheckout} noValidate className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ════════════ CỘT TRÁI: THÔNG TIN GIAO HÀNG & THANH TOÁN (7 PHẦN) ════════════ */}
            <div className="lg:col-span-7 space-y-6">
                
                {/* ── BƯỚC 1: THÔNG TIN GIAO HÀNG ── */}
                <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <span className="w-1.5 h-5 bg-slate-900 rounded-full" />
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                                1. Thông tin người nhận & Địa chỉ
                            </h2>
                        </div>

                        {user && savedAddresses.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setIsManualAddress(!isManualAddress)}
                                className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                            >
                                {isManualAddress ? '← Chọn từ sổ địa chỉ' : '+ Thêm địa chỉ mới'}
                            </button>
                        )}
                    </div>

                    {/* Sổ địa chỉ đã lưu */}
                    {user && savedAddresses.length > 0 && !isManualAddress && (
                        <div className="mb-5">
                            <p className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <MapPin size={16} className="text-slate-900" />
                                Địa chỉ nhận hàng đã lưu
                            </p>
                            {loadingAddresses ? (
                                <div className="animate-pulse h-24 bg-slate-100 rounded-xl" />
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {savedAddresses.map(addr => {
                                        const isSelected = selectedAddressId === addr.id;
                                        return (
                                            <div 
                                                key={addr.id}
                                                onClick={() => handleSelectAddress(addr)}
                                                className={`p-4 rounded-xl cursor-pointer border transition-all text-left relative ${
                                                    isSelected 
                                                        ? 'border-slate-900 bg-slate-50/70 ring-2 ring-slate-900 shadow-2xs' 
                                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                                    <span className="font-bold text-slate-900 text-base truncate">
                                                        {addr.full_name}
                                                    </span>
                                                    {addr.is_default && (
                                                        <span className="text-xs font-semibold bg-slate-900 text-white px-2 py-0.5 rounded">
                                                            Mặc định
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-700 font-semibold mb-1">
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
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Họ tên */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                                    Họ và tên người nhận <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="customerName"
                                    value={formData.customerName}
                                    onChange={handleChange}
                                    placeholder="Ví dụ: Nguyễn Văn A"
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base font-medium text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all placeholder:text-slate-400"
                                />
                            </div>

                            {/* Số điện thoại */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                                    Số điện thoại nhận hàng <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="0987 654 321"
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base font-medium text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        {/* Email nhận xác nhận đơn */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                                Email nhận thông báo đơn hàng <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="name@example.com"
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base font-medium text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all placeholder:text-slate-400"
                            />
                        </div>

                        {/* 3 Dropdowns Tỉnh / Quận / Phường */}
                        {(!selectedAddressId || isManualAddress) && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-4 pt-1"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {/* Tỉnh / Thành */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                                            Tỉnh / Thành phố
                                        </label>
                                        <select 
                                            value={selectedProvinceCode || ''} 
                                            onChange={handleProvinceChange}
                                            className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-sm sm:text-base font-medium text-slate-800 focus:border-slate-900 outline-none"
                                        >
                                            <option value="">Chọn Tỉnh/Thành</option>
                                            {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                                        </select>
                                    </div>

                                    {/* Quận / Huyện */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                                            Quận / Huyện
                                        </label>
                                        <select 
                                            disabled={!selectedProvinceCode} 
                                            value={selectedDistrictCode || ''} 
                                            onChange={handleDistrictChange}
                                            className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-sm sm:text-base font-medium text-slate-800 focus:border-slate-900 outline-none disabled:bg-slate-50 disabled:opacity-50"
                                        >
                                            <option value="">Chọn Quận/Huyện</option>
                                            {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                                        </select>
                                    </div>

                                    {/* Phường / Xã */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                                            Phường / Xã
                                        </label>
                                        <select 
                                            disabled={!selectedDistrictCode} 
                                            value={localAddress.ward ? wards.find(w=>w.name===localAddress.ward)?.code || '' : ''} 
                                            onChange={handleWardChange}
                                            className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-sm sm:text-base font-medium text-slate-800 focus:border-slate-900 outline-none disabled:bg-slate-50 disabled:opacity-50"
                                        >
                                            <option value="">Chọn Phường/Xã</option>
                                            {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Số nhà, tên đường */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                                        Địa chỉ cụ thể (Số nhà, tên đường, căn hộ) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={localAddress.street || formData.address}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setLocalAddress(prev => ({ ...prev, street: val }));
                                            setFormData(prev => ({ ...prev, address: val }));
                                        }}
                                        placeholder="Ví dụ: Tầng 4, Số 123 Đường Nguyễn Trãi..."
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base font-medium text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all placeholder:text-slate-400"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Ghi chú đơn hàng */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                                Ghi chú đơn hàng (Tùy chọn)
                            </label>
                            <textarea
                                name="note"
                                value={formData.note}
                                onChange={handleChange}
                                placeholder="Ghi chú thêm về thời gian nhận hàng hoặc hướng dẫn giao..."
                                rows={2}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-base font-medium text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all resize-none placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                </div>

                {/* ── BƯỚC 2: PHƯƠNG THỨC VẬN CHUYỂN ── */}
                <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
                    <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
                        <span className="w-1.5 h-5 bg-slate-900 rounded-full" />
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                            2. Đơn vị vận chuyển
                        </h2>
                    </div>

                    {shippingMethods.length === 0 ? (
                        <div className="text-center py-4 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm">
                            📍 Vui lòng chọn địa chỉ để hiển thị các đơn vị vận chuyển khả dụng.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {shippingMethods.map(sm => {
                                const isFree = sm.freeship_applied || ((sm.free_shipping_threshold ?? 0) > 0 && totalAmount >= (sm.free_shipping_threshold ?? 0));
                                const isSelected = selectedShippingMethodId === sm.id;
                                return (
                                    <label
                                        key={sm.id}
                                        className={`flex items-center justify-between gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                                            isSelected
                                                ? 'border-slate-900 bg-slate-50/70 ring-2 ring-slate-900 shadow-2xs'
                                                : 'border-slate-200 hover:border-slate-300 bg-white'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <input
                                                type="radio"
                                                name="shippingMethod"
                                                value={sm.id}
                                                checked={isSelected}
                                                onChange={(e) => setSelectedShippingMethodId(e.target.value)}
                                                className="sr-only"
                                            />
                                            
                                            <div className={`w-5 h-5 rounded-full border transition-all flex items-center justify-center shrink-0 ${
                                                isSelected ? 'border-slate-900 bg-white ring-2 ring-slate-900' : 'border-slate-300 bg-white'
                                            }`}>
                                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />}
                                            </div>

                                            <div className="min-w-0">
                                                <p className="text-base font-bold text-slate-900">
                                                    {sm.name_methond}
                                                </p>
                                                <p className="text-sm text-slate-600 font-medium mt-0.5">
                                                    Dự kiến: {sm.estimated_time || '2 - 3 ngày làm việc'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            {isFree ? (
                                                <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded border border-emerald-200/80">
                                                    Miễn phí
                                                </span>
                                            ) : (
                                                <span className="text-base font-bold text-slate-900">
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
                <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
                    <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
                        <span className="w-1.5 h-5 bg-slate-900 rounded-full" />
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                            3. Hình thức thanh toán
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {/* ── PHƯƠNG THỨC 1: VÍ HAVEN PAY ── */}
                        {user && (
                            <label
                                className={`flex items-start sm:items-center gap-3.5 p-4 rounded-xl border transition-all cursor-pointer ${
                                    formData.paymentMethod === 'wallet'
                                        ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600 shadow-2xs'
                                        : 'border-slate-200 hover:border-slate-300 bg-white'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="wallet"
                                    checked={formData.paymentMethod === 'wallet'}
                                    onChange={handleChange}
                                    className="sr-only"
                                />

                                <div className={`w-5 h-5 rounded-full border transition-all flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                                    formData.paymentMethod === 'wallet' ? 'border-indigo-600 bg-white ring-2 ring-indigo-600' : 'border-slate-300 bg-white'
                                }`}>
                                    {formData.paymentMethod === 'wallet' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                                </div>

                                <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shrink-0 text-white">
                                    <CreditCard size={18} className="text-emerald-400" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-base font-bold text-slate-900">
                                            Ví tài khoản HAVEN Pay
                                        </p>
                                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                                            Số dư: {walletBalance !== null ? formatPrice(walletBalance) : (loadingWallet ? '...' : '0 đ')}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 font-medium mt-0.5">
                                        {(walletBalance ?? 0) >= finalTotal ? (
                                            <span className="text-emerald-700 font-semibold">✓ Đủ số dư · Thanh toán 1-chạm</span>
                                        ) : (
                                            <span className="text-rose-600 font-semibold">✕ Số dư không đủ (Thiếu {formatPrice(finalTotal - (walletBalance ?? 0))})</span>
                                        )}
                                    </p>
                                </div>
                            </label>
                        )}

                        {paymentMethods.length > 0 ? (
                            paymentMethods.map(pm => {
                                const isSelected = formData.paymentMethod === pm.id;
                                const isVNPay = pm.id === 'vnpay' || pm.id.includes('vnpay');
                                const isMoMo = pm.id === 'momo' || pm.id.includes('momo');
                                const isCOD = pm.id === 'cod' || pm.id.includes('cod');
                                return (
                                    <label
                                        key={pm.id}
                                        className={`flex items-center gap-3.5 p-4 rounded-xl border transition-all cursor-pointer ${
                                            isSelected
                                                ? 'border-slate-900 bg-slate-50/70 ring-2 ring-slate-900 shadow-2xs'
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

                                        <div className={`w-5 h-5 rounded-full border transition-all flex items-center justify-center shrink-0 ${
                                            isSelected ? 'border-slate-900 bg-white ring-2 ring-slate-900' : 'border-slate-300 bg-white'
                                        }`}>
                                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />}
                                        </div>

                                        {isVNPay ? (
                                            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 text-white text-[10px] font-black leading-tight">
                                                VNPAY
                                            </div>
                                        ) : isMoMo ? (
                                            <div className="w-9 h-9 bg-[#ae2070] rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-black">
                                                MoMo
                                            </div>
                                        ) : isCOD ? (
                                            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center shrink-0 text-white">
                                                <Banknote size={18} />
                                            </div>
                                        ) : (
                                            <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center shrink-0 text-white">
                                                <CreditCard size={18} />
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <p className="text-base font-bold text-slate-900">
                                                {pm.name_methond}
                                            </p>
                                            <p className="text-sm text-slate-600 truncate mt-0.5">
                                                {pm.description || 'Thanh toán bảo mật và tiện lợi.'}
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
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl"
                        >
                            <p className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                                Thông tin tài khoản nhận chuyển khoản:
                            </p>
                            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed font-mono">
                                {paymentMethods.find(pm => pm.id === formData.paymentMethod)?.bank_info}
                            </p>
                        </motion.div>
                    )}

                    {/* Yêu cầu xuất hóa đơn VAT */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-slate-800">
                            <input
                                type="checkbox"
                                name="wantVAT"
                                checked={formData.wantVAT}
                                onChange={e => setFormData(p => ({ ...p, wantVAT: e.target.checked }))}
                                className="w-4.5 h-4.5 rounded border-slate-300 text-slate-900 focus:ring-0"
                            />
                            <span>Yêu cầu xuất hóa đơn điện tử VAT (Doanh nghiệp)</span>
                        </label>

                        {formData.wantVAT && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-3 space-y-3 pt-2"
                            >
                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-1">Tên công ty / Doanh nghiệp</label>
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        placeholder="Công ty TNHH..."
                                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm sm:text-base font-medium text-slate-900 focus:border-slate-900 outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-800 mb-1">Mã số thuế</label>
                                        <input
                                            type="text"
                                            name="companyTaxId"
                                            value={formData.companyTaxId}
                                            onChange={handleChange}
                                            placeholder="0123456789..."
                                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm sm:text-base font-medium text-slate-900 focus:border-slate-900 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-800 mb-1">Địa chỉ công ty</label>
                                        <input
                                            type="text"
                                            name="companyAddress"
                                            value={formData.companyAddress}
                                            onChange={handleChange}
                                            placeholder="Địa chỉ trụ sở chính..."
                                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm sm:text-base font-medium text-slate-900 focus:border-slate-900 outline-none"
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
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium rounded-xl flex items-center gap-2"
                    >
                        <span>⚠️ {error}</span>
                    </motion.div>
                )}
            </div>

            {/* ════════════ CỘT PHẢI: TÓM TẮT ĐƠN HÀNG & NÚT ĐẶT HÀNG ════════════ */}
            <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
                <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                            <span className="w-1.5 h-4 bg-slate-900 rounded-full" />
                            <h3 className="text-base sm:text-lg font-bold text-slate-900">
                                Đơn hàng ({items.reduce((s, i) => s + i.quantity, 0)} sản phẩm)
                            </h3>
                        </div>
                    </div>

                    {/* Danh sách sản phẩm trong giỏ */}
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
                        {items.map((item) => (
                            <div
                                key={`${item.product.id}-${item.selectedSize}-${item.selectedColor.name}`}
                                className="flex items-center gap-3.5 py-1"
                            >
                                <div className="relative w-16 h-18 flex-shrink-0">
                                    <div className="relative w-full h-full rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                                        <Image
                                            src={item.product.images[0]}
                                            alt={item.product.name}
                                            fill
                                            className="object-cover"
                                            sizes="72px"
                                        />
                                    </div>
                                    <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 bg-slate-900 text-white text-xs rounded-full flex items-center justify-center font-bold border-2 border-white z-10">
                                        {item.quantity}
                                    </span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1">
                                        {item.product.name}
                                    </h4>
                                    <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                                        {item.selectedSize} · {item.selectedColor.name}
                                    </p>
                                    <p className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                                        {formatPrice(item.product.price * item.quantity)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── MÃ GIẢM GIÁ / VOUCHER ── */}
                    <div className="pt-4 mt-4 border-t border-slate-100">
                        {appliedCoupon && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                className="mb-3 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0 text-xs">
                                        ✓
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-emerald-950">{appliedCoupon.code}</p>
                                        <p className="text-xs text-emerald-700 font-medium">
                                            Giảm {formatPrice(appliedCoupon.discountAmount)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={removeVoucher}
                                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                                    title="Gỡ mã giảm giá"
                                >
                                    <X size={16} />
                                </button>
                            </motion.div>
                        )}

                        {!appliedCoupon && (
                            <div className="flex gap-2 mb-2.5">
                                <input
                                    type="text"
                                    value={voucherInput}
                                    onChange={e => { setVoucherInput(e.target.value); setVoucherError(''); }}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyVoucher(voucherInput); } }}
                                    placeholder="Nhập mã ưu đãi..."
                                    className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold uppercase text-slate-900 placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 focus:border-slate-900 outline-none"
                                />
                                <button
                                    type="button"
                                    disabled={voucherLoading || !voucherInput.trim()}
                                    onClick={() => applyVoucher(voucherInput)}
                                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                                >
                                    {voucherLoading ? <Loader2 size={14} className="animate-spin" /> : 'Áp dụng'}
                                </button>
                            </div>
                        )}

                        {voucherError && (
                            <p className="text-sm text-rose-600 mb-2 flex items-center gap-1 font-medium">
                                <X size={14} /> {voucherError}
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={handleToggleVoucherList}
                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                        >
                            <Gift size={14} />
                            <span>{showVoucherList ? 'Thu gọn voucher' : 'Xem voucher có sẵn'}</span>
                            <ChevronDown size={14} className={`transition-transform duration-200 ${showVoucherList ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {showVoucherList && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-3 space-y-2 max-h-[220px] overflow-y-auto pr-0.5 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
                                        {couponsLoading ? (
                                            <div className="py-3 text-center text-sm text-slate-400">Đang tải mã giảm giá...</div>
                                        ) : availableCoupons.length === 0 ? (
                                            <div className="py-2 text-center text-sm text-slate-400">Chưa có voucher khả dụng.</div>
                                        ) : (
                                            availableCoupons.map(coupon => {
                                                const isApplied = appliedCoupon?.code === coupon.code;
                                                return (
                                                    <div
                                                        key={coupon.id}
                                                        onClick={() => !isApplied && applyVoucher(coupon.code)}
                                                        className={`p-3 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                                            isApplied ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-mono font-bold text-sm text-slate-900">{coupon.code}</span>
                                                                {coupon.isPersonal && (
                                                                    <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.2 rounded font-bold">Vòng quay</span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-slate-600 font-medium mt-0.5">
                                                                {coupon.name || `Giảm ${coupon.discount_type === 'percent' ? `${coupon.discount_value}%` : formatPrice(coupon.discount_value)}`}
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                                                                isApplied ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                                                            }`}
                                                        >
                                                            {isApplied ? 'Đang dùng' : 'Dùng'}
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
                    <div className="pt-4 mt-4 border-t border-slate-100 space-y-3 text-sm sm:text-base">
                        <div className="flex justify-between text-slate-700">
                            <span>Tạm tính tiền hàng</span>
                            <span className="text-slate-900 font-semibold">{formatPrice(totalAmount)}</span>
                        </div>

                        <div className="flex justify-between text-slate-700">
                            <span>Phí vận chuyển</span>
                            <span className={shippingFee === 0 ? 'text-emerald-700 font-bold' : 'text-slate-900 font-semibold'}>
                                {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
                            </span>
                        </div>

                        {appliedCoupon && (
                            <div className="flex justify-between text-rose-600 font-bold">
                                <span>Giảm giá Voucher</span>
                                <span>-{formatPrice(appliedCoupon.discountAmount)}</span>
                            </div>
                        )}

                        <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex justify-between items-baseline">
                            <div>
                                <span className="text-sm font-bold uppercase tracking-wider text-slate-800 block">
                                    Tổng thanh toán
                                </span>
                                <span className="text-xs text-slate-400 font-normal">
                                    (Đã bao gồm VAT)
                                </span>
                            </div>
                            <div className="text-right">
                                {appliedCoupon && (
                                    <span className="text-xs text-slate-400 line-through block font-mono">
                                        {formatPrice(totalAmount + shippingFee)}
                                    </span>
                                )}
                                <span className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                                    {formatPrice(finalTotal)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ── NÚT ĐẶT HÀNG NGAY ── */}
                    <div className="pt-4 mt-4 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={isLoading || items.length === 0}
                            className="w-full py-4 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-base font-bold tracking-wide shadow-xs active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Đang xử lý đơn hàng...</span>
                                </>
                            ) : (
                                <>
                                    <span>Đặt hàng ngay · {formatPrice(finalTotal)}</span>
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
