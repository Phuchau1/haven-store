'use client';
// ===== HAVEN STORE - HỆ THỐNG CỬA HÀNG & SHOWROOM TOÀN QUỐC =====
import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    MapPin, Phone, Clock, Navigation, Search, Check, 
    Sparkles, ShieldCheck, Shirt, Car, Coffee, 
    CreditCard, ExternalLink, ArrowRight, Store
} from 'lucide-react';

interface StoreLocation {
    id: string;
    name: string;
    city: 'all' | 'hcm' | 'hanoi' | 'danang' | 'longan';
    cityName: string;
    type: 'Flagship Showroom' | 'Concept Store' | 'Premium Boutique';
    address: string;
    phone: string;
    openingHours: string;
    image: string;
    mapUrl: string;
    directionsUrl: string;
    amenities: string[];
    isFlagship?: boolean;
}

const STORES: StoreLocation[] = [
    {
        id: 'store-hcm-1',
        name: 'HAVEN Flagship Store - TP. Hồ Chí Minh',
        city: 'hcm',
        cityName: 'TP. Hồ Chí Minh',
        type: 'Flagship Showroom',
        address: '456 Nguyễn Trãi, Phường 8, Quận 1, TP. Hồ Chí Minh',
        phone: '028 8765 4321',
        openingHours: '09:00 - 22:30 (Mở cửa cả tuần)',
        image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=900&q=80',
        mapUrl: 'https://maps.google.com/maps?q=456%20Nguy%E1%BB%85n%20Tr%C3%A3i,%20Qu%E1%BA%ADn%201,%20TP.%20H%E1%BB%93%20Ch%C3%AD%20Minh&t=&z=15&ie=UTF8&iwloc=&output=embed',
        directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=456+Nguyen+Trai+Quan+1+TP+Ho+Chi+Minh',
        amenities: ['Chỗ đỗ ô tô miễn phí', 'Phòng thử đồ VIP Lounge', 'Tư vấn Styling 1-1', 'Thanh toán thẻ / QR'],
        isFlagship: true
    },
    {
        id: 'store-hanoi-1',
        name: 'HAVEN Concept Store - Hà Nội',
        city: 'hanoi',
        cityName: 'Hà Nội',
        type: 'Concept Store',
        address: '88 Phố Huế, Phường Hàng Bài, Quận Hoàn Kiếm, Hà Nội',
        phone: '024 3987 6543',
        openingHours: '09:00 - 22:00 (Mở cửa cả tuần)',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=80',
        mapUrl: 'https://maps.google.com/maps?q=88%20Ph%E1%BB%91%20Hu%E1%BA%BF,%20Ho%C3%A0n%20Ki%E1%BA%BFm,%20H%C3%A0%20N%E1%BB%99i&t=&z=15&ie=UTF8&iwloc=&output=embed',
        directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=88+Pho+Hue+Hoan+Kiem+Ha+Noi',
        amenities: ['Chỗ đỗ xe máy & ô tô', 'Tư vấn phối đồ chuyên sâu', 'Giao hàng hỏa tốc', 'Thanh toán thẻ / QR']
    },
    {
        id: 'store-danang-1',
        name: 'HAVEN Premium Boutique - Đà Nẵng',
        city: 'danang',
        cityName: 'Đà Nẵng',
        type: 'Premium Boutique',
        address: '120 Nguyễn Văn Linh, Quận Hải Châu, TP. Đà Nẵng',
        phone: '0236 388 9999',
        openingHours: '09:00 - 22:00 (Mở cửa cả tuần)',
        image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&q=80',
        mapUrl: 'https://maps.google.com/maps?q=120%20Nguy%E1%BB%85n%20V%C4%83n%20Linh,%20H%E1%BA%A3i%20Ch%C3%A2u,%20%C4%90%C3%A0%20N%E1%BA%B5ng&t=&z=15&ie=UTF8&iwloc=&output=embed',
        directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=120+Nguyen+Van+Linh+Hai+Chau+Da+Nang',
        amenities: ['Chỗ đỗ xe thuận tiện', 'Đầy đủ BST mới nhất', 'Thanh toán linh hoạt', 'Đổi trả tại chỗ']
    },
    {
        id: 'store-longan-1',
        name: 'HAVEN Store - Long An',
        city: 'longan',
        cityName: 'Long An',
        type: 'Premium Boutique',
        address: '256 ấp Long Khánh, Cần Giuộc, Long An, Việt Nam',
        phone: '0838 484 885',
        openingHours: '09:00 - 22:00 (Tất cả các ngày trong tuần)',
        image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=900&q=80',
        mapUrl: 'https://maps.google.com/maps?q=256%20%E1%BA%A5p%20Long%20Kh%C3%A1nh,%20C%E1%BA%A7n%20Gi%E1%BB%99c,%20Long%20An,%20Vi%E1%BB%87t%20Nam&t=&z=15&ie=UTF8&iwloc=&output=embed',
        directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=256+ap+Long+Khanh+Can+Giuoc+Long+An',
        amenities: ['Bãi giữ xe rộng rãi', 'Không gian trải nghiệm thoáng mát', 'Hỗ trợ bảo hành nhanh', 'Thanh toán thẻ / QR']
    }
];

const CITY_TABS = [
    { value: 'all', label: 'Tất cả cửa hàng' },
    { value: 'hcm', label: 'Hồ Chí Minh' },
    { value: 'hanoi', label: 'Hà Nội' },
    { value: 'danang', label: 'Đà Nẵng' },
    { value: 'longan', label: 'Long An' }
];

export default function LocationsPage() {
    const [selectedCity, setSelectedCity] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedStoreId, setSelectedStoreId] = useState<string>(STORES[0].id);

    // Lọc cửa hàng
    const filteredStores = useMemo(() => {
        return STORES.filter(store => {
            const matchesCity = selectedCity === 'all' || store.city === selectedCity;
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = !q || 
                store.name.toLowerCase().includes(q) || 
                store.address.toLowerCase().includes(q) ||
                store.cityName.toLowerCase().includes(q);
            return matchesCity && matchesSearch;
        });
    }, [selectedCity, searchQuery]);

    // Cửa hàng đang được chọn để hiển thị map
    const activeStore = useMemo(() => {
        return STORES.find(s => s.id === selectedStoreId) || filteredStores[0] || STORES[0];
    }, [selectedStoreId, filteredStores]);

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20">
            {/* ── HERO BANNER: HỆ THỐNG SHOWROOM ── */}
            <div className="bg-white border-b border-slate-200/80 pt-12 pb-14 sm:pt-16 sm:pb-18">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2.5">
                                <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                                    <Sparkles size={11} className="text-amber-400" />
                                    HAVEN SHOWROOMS
                                </span>
                                <span className="text-xs text-slate-400 font-medium">
                                    {STORES.length} Điểm đến mua sắm
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                                Hệ Thống Cửa Hàng & Showroom
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-2 font-medium leading-relaxed">
                                Khám phá không gian mua sắm thời trang chuẩn quốc tế, tận hưởng dịch vụ tư vấn phong cách riêng biệt và trải nghiệm chất liệu thực tế.
                            </p>
                        </div>

                        {/* Ô tìm kiếm cửa hàng */}
                        <div className="w-full md:w-80 relative flex-shrink-0">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm theo đường, quận, thành phố..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* ── BỘ LỌC TỈNH THÀNH (TABS) ── */}
                    <div className="flex items-center gap-2 overflow-x-auto pt-8 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
                        {CITY_TABS.map(tab => {
                            const isActive = selectedCity === tab.value;
                            return (
                                <button
                                    key={tab.value}
                                    onClick={() => setSelectedCity(tab.value)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                                        isActive
                                            ? 'bg-slate-900 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── BỐ CỤC CHÍNH: 2 CỘT (DANH SÁCH CỬA HÀNG + BẢN ĐỒ LIVE) ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* ── CỘT TRÁI: DANH SÁCH THẺ CỬA HÀNG (5 PHẦN) ── */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                                <Store size={16} />
                                Danh sách địa điểm ({filteredStores.length})
                            </h3>
                            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Mở cửa 09:00 - 22:00
                            </span>
                        </div>

                        {filteredStores.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-6">
                                <MapPin size={32} className="mx-auto text-slate-400 mb-2" />
                                <p className="text-sm font-bold text-slate-800">Không tìm thấy cửa hàng phù hợp</p>
                                <p className="text-xs text-slate-500 mt-1">Vui lòng thử tìm với từ khóa khác</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredStores.map(store => {
                                    const isSelected = activeStore.id === store.id;
                                    return (
                                        <div
                                            key={store.id}
                                            onClick={() => setSelectedStoreId(store.id)}
                                            className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 cursor-pointer bg-white ${
                                                isSelected
                                                    ? 'border-slate-950 shadow-md ring-1 ring-slate-950/10'
                                                    : 'border-slate-200/90 hover:border-slate-300 shadow-2xs'
                                            }`}
                                        >
                                            {/* Store Thumbnail & Type Badge */}
                                            <div className="flex gap-4">
                                                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                                    <Image
                                                        src={store.image}
                                                        alt={store.name}
                                                        fill
                                                        sizes="120px"
                                                        className="object-cover"
                                                    />
                                                    {store.isFlagship && (
                                                        <span className="absolute top-1 left-1 bg-amber-400 text-slate-950 font-black text-[8.5px] px-1.5 py-0.2 rounded shadow-xs uppercase">
                                                            Flagship
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                                            {store.type}
                                                        </span>
                                                    </div>

                                                    <h4 className="text-sm font-bold text-slate-900 leading-snug mb-1.5 line-clamp-1">
                                                        {store.name}
                                                    </h4>

                                                    <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed flex items-start gap-1 mb-1.5">
                                                        <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                                                        <span>{store.address}</span>
                                                    </p>

                                                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                                                        <span className="flex items-center gap-1">
                                                            <Phone size={11} className="text-slate-400" />
                                                            {store.phone}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={11} className="text-slate-400" />
                                                            {store.openingHours.split('(')[0]}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tiện ích cửa hàng */}
                                            <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                                                {store.amenities.map(amenity => (
                                                    <span 
                                                        key={amenity}
                                                        className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/60 font-medium"
                                                    >
                                                        {amenity}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Nút tác vụ */}
                                            <div className="mt-3 flex items-center justify-between gap-2">
                                                <a
                                                    href={`tel:${store.phone.replace(/\s/g, '')}`}
                                                    onClick={e => e.stopPropagation()}
                                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Phone size={12} />
                                                    Gọi điện
                                                </a>

                                                <a
                                                    href={store.directionsUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={e => e.stopPropagation()}
                                                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                                >
                                                    <Navigation size={12} />
                                                    Chỉ đường Google Maps
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── CỘT PHẢI: BẢN ĐỒ GOOGLE MAPS TƯƠNG TÁC (7 PHẦN) ── */}
                    <div className="lg:col-span-7 lg:sticky lg:top-24">
                        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-md">
                            {/* Header bản đồ */}
                            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                        Đang hiển thị trên bản đồ:
                                    </span>
                                    <h3 className="text-sm sm:text-base font-black text-slate-900">
                                        {activeStore.name}
                                    </h3>
                                </div>

                                <a
                                    href={activeStore.directionsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs shrink-0"
                                >
                                    <Navigation size={13} />
                                    <span>Mở Maps lớn</span>
                                    <ExternalLink size={11} />
                                </a>
                            </div>

                            {/* Khung iframe bản đồ vệ tinh / giao thông */}
                            <div className="w-full h-[400px] sm:h-[500px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 relative shadow-inner">
                                <iframe
                                    key={activeStore.id}
                                    src={activeStore.mapUrl}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen={false}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title={activeStore.name}
                                    className="w-full h-full"
                                />

                                {/* Chip thông tin nhanh góc dưới bản đồ */}
                                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/80 shadow-lg flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-900 truncate">
                                            📍 {activeStore.address}
                                        </p>
                                        <p className="text-[11px] text-slate-500 font-medium">
                                            ⏰ Giờ mở cửa: {activeStore.openingHours}
                                        </p>
                                    </div>
                                    <a
                                        href={activeStore.directionsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs shrink-0 transition-colors"
                                    >
                                        Chỉ đường ngay
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── PHẦN TRẢI NGHIỆM ĐẶC QUYỀN TẠI CỬA HÀNG (4 PILLARS) ── */}
                <div className="mt-16 pt-12 border-t border-slate-200">
                    <div className="text-center max-w-2xl mx-auto mb-10">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                            DỊCH VỤ TẠI CỬA HÀNG
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-950 mt-2.5 tracking-tight">
                            Đặc Quyền Khi Mua Sắm Tại Showroom HAVEN
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium">
                            Mang đến cho bạn hành trình trải nghiệm thời trang sang trọng, thoải mái và chu đáo nhất.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1e40af] flex items-center justify-center mb-4">
                                <Shirt size={24} />
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 mb-1.5">Tư vấn Styling 1:1</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Đội ngũ Fashion Stylist luôn sẵn sàng hỗ trợ tư vấn chọn size và phối đồ hoàn hảo cho từng vóc dáng.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                                <Coffee size={24} />
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 mb-1.5">Phòng Thử Đồ & Lounge</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Không gian fitting room rộng rãi, gương ánh sáng chuẩn studio và khu vực sofa thư giãn tiện nghi.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                                <Car size={24} />
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 mb-1.5">Bãi Đỗ Xe Tiện Lợi</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Chỗ giữ xe máy và bãi đỗ ô tô miễn phí ngay trước cửa hàng với nhân viên bảo vệ đón tiếp tận tâm.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                                <ShieldCheck size={24} />
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 mb-1.5">Đổi Trả Trực Tiếp 30 Ngày</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Hỗ trợ đổi size và mẫu mã linh hoạt trên toàn bộ hệ thống showroom toàn quốc chỉ trong 30 giây.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
