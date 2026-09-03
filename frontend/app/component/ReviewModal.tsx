'use client';
/**
 * ============================================================
 * REVIEW MODAL - QUY TRÌNH ĐÁNH GIÁ CHUẨN TIKTOK SHOP & SHOPEE
 * Mô tả: Quy trình đánh giá sản phẩm đa tiêu chí:
 *        - Đánh giá chất lượng sản phẩm (1 - 5 sao)
 *        - Thẻ nhận xét nhanh (Quick Tag Suggestions)
 *        - Đánh giá dịch vụ người bán & vận chuyển
 *        - Chế độ đánh giá ẩn danh (Anonymous name protection)
 *        - Thưởng điểm tích lũy / Gamification
 * ============================================================
 */

import React, { useState, useEffect } from 'react';
import { X, Star, Loader2, Send, CheckCircle2, ChevronRight, ArrowLeft, ShieldCheck, Sparkles, ThumbsUp, PackageCheck, Truck, Store } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface ReviewModalProps {
    order: any;
    onClose: () => void;
    user: any;
}

const QUICK_TAGS = [
    'Đúng với mô tả',
    'Chất vải xịn sò',
    'Đóng gói cẩn thận',
    'Giao hàng siêu nhanh',
    'Form dáng chuẩn đẹp',
    'Rất đáng tiền',
    'Tư vấn nhiệt tình',
    'Sẽ ủng hộ shop tiếp'
];

const STAR_LABELS: Record<number, string> = {
    1: 'Rất tệ',
    2: 'Không hài lòng',
    3: 'Bình thường',
    4: 'Hài lòng',
    5: 'Tuyệt vời'
};

export default function ReviewModal({ order, onClose, user }: ReviewModalProps) {
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [content, setContent] = useState('');
    const [sellerRating, setSellerRating] = useState(5);
    const [shippingRating, setShippingRating] = useState(5);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Trạng thái đã đánh giá
    const [alreadyReviewedIds, setAlreadyReviewedIds] = useState<string[]>([]);
    const [loadingReviewed, setLoadingReviewed] = useState(true);

    // Load danh sách sản phẩm đã đánh giá
    useEffect(() => {
        if (!user?.id) {
            setLoadingReviewed(false);
            return;
        }
        const fetchMyReviews = async () => {
            try {
                const res = await fetch(`/api/reviews/my-reviews?user_id=${user.id}`);
                const data = await res.json();
                if (data.success) {
                    setAlreadyReviewedIds(data.reviewedProductIds || []);
                }
            } catch {
                // Fallback
            } finally {
                setLoadingReviewed(false);
            }
        };
        fetchMyReviews();
    }, [user?.id]);

    // Tự động mở sản phẩm chưa đánh giá đầu tiên nếu có 1 sản phẩm
    useEffect(() => {
        if (!loadingReviewed && order?.items?.length === 1) {
            const firstItem = order.items[0];
            if (!alreadyReviewedIds.includes(firstItem.product.id)) {
                setSelectedItem(firstItem);
            }
        }
    }, [loadingReviewed, order, alreadyReviewedIds]);

    // Bật/tắt thẻ nhận xét nhanh
    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(prev => prev.filter(t => t !== tag));
        } else {
            setSelectedTags(prev => [...prev, tag]);
            // Tự động thêm vào nội dung text nếu chưa có
            if (!content.includes(tag)) {
                setContent(prev => (prev.trim() ? `${prev.trim()}, ${tag.toLowerCase()}` : tag));
            }
        }
    };

    const handleSelectProduct = (item: any) => {
        setSelectedItem(item);
        setRating(5);
        setHoverRating(0);
        setSelectedTags([]);
        setContent('');
        setSellerRating(5);
        setShippingRating(5);
    };

    const handleSubmitReview = async () => {
        if (!selectedItem) return;

        let finalContent = content.trim();
        if (!finalContent && selectedTags.length > 0) {
            finalContent = selectedTags.join(', ');
        }

        if (finalContent.length < 5) {
            toast.error('Vui lòng nhập nhận xét ít nhất 5 ký tự hoặc chọn thẻ gợi ý');
            return;
        }

        setIsSubmitting(true);
        try {
            // Tên hiển thị (ẩn danh dạng p***1 nếu bật isAnonymous)
            let displayName = user?.name || 'Khách hàng';
            if (isAnonymous && displayName.length > 2) {
                displayName = `${displayName[0]}***${displayName[displayName.length - 1]}`;
            }

            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_id: selectedItem.product.id,
                    rating,
                    content: finalContent,
                    user_id: user?.id,
                    userName: displayName,
                    userEmail: isAnonymous ? '' : user?.email,
                    sellerRating,
                    shippingRating,
                    tags: selectedTags,
                    orderId: order.id
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('🎉 Đánh giá thành công! Bạn nhận được +50 Điểm Thưởng HAVEN.');
                setAlreadyReviewedIds(prev => [...prev, selectedItem.product.id]);
                setSelectedItem(null);
            } else if (data.alreadyReviewed) {
                toast.error('⚠️ Bạn đã đánh giá sản phẩm này rồi!');
                setAlreadyReviewedIds(prev => [...prev, selectedItem.product.id]);
                setSelectedItem(null);
            } else {
                toast.error(data.message || 'Lỗi khi gửi đánh giá');
            }
        } catch {
            toast.error('Lỗi kết nối khi gửi đánh giá');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isAlreadyReviewed = (productId: string) => alreadyReviewedIds.includes(productId);
    const unreviewedItems = (order.items || []).filter((item: any) => !isAlreadyReviewed(item.product.id));

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-slate-100">
                
                {/* ── HEADER MODAL ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
                    <div className="flex items-center gap-3">
                        {selectedItem && order.items.length > 1 && (
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="p-1.5 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            >
                                <ArrowLeft size={18} />
                            </button>
                        )}
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                                <span>Đánh giá đơn hàng</span>
                                <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                    #{order.id}
                                </span>
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Chuẩn quy trình đánh giá TikTok Shop & Shopee
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* ── REWARD BANNER (SHOPEE / TIKTOK STYLE) ── */}
                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white px-6 py-2.5 flex items-center justify-between text-xs font-bold shadow-xs">
                    <div className="flex items-center gap-2">
                        <Sparkles size={16} className="animate-bounce" />
                        <span>Đánh giá nhận ngay +50 Điểm Thưởng HAVEN vào ví!</span>
                    </div>
                    <span className="hidden sm:inline-block bg-white/20 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                        Ưu đãi đánh giá
                    </span>
                </div>

                {/* ── MODAL BODY ── */}
                <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50 space-y-6">
                    {loadingReviewed ? (
                        <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                            <Loader2 className="animate-spin" size={22} />
                            <span className="text-sm font-medium">Đang kiểm tra trạng thái đơn hàng...</span>
                        </div>
                    ) : selectedItem ? (
                        
                        /* ── VIEW 2: FORM ĐÁNH GIÁ CHI TIẾT TỪNG SẢN PHẨM ── */
                        <div className="space-y-6 animate-fadeIn">
                            
                            {/* Thông tin sản phẩm đang đánh giá */}
                            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 relative shrink-0 border border-slate-100">
                                    <Image
                                        src={selectedItem.product.images?.[0] || '/placeholder.png'}
                                        alt={selectedItem.product.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-slate-900 truncate">
                                        {selectedItem.product.name}
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-600">
                                            Size: {selectedItem.selectedSize}
                                        </span>
                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-600">
                                            Màu: {selectedItem.selectedColor?.name || 'Mặc định'}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* Tiêu chí 1: Chất lượng sản phẩm (1-5 sao) */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Chất lượng sản phẩm
                                </label>
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            className="p-1 focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                                        >
                                            <Star
                                                size={28}
                                                className={`transition-colors ${
                                                    star <= (hoverRating || rating)
                                                        ? 'text-amber-400 fill-amber-400 filter drop-shadow-xs'
                                                        : 'text-slate-200'
                                                }`}
                                            />
                                        </button>
                                    ))}
                                    <span className="ml-3 text-sm font-bold text-amber-600">
                                        {STAR_LABELS[hoverRating || rating]}
                                    </span>
                                </div>
                            </div>

                            {/* Tiêu chí 2: Thẻ gợi ý nhận xét nhanh (Quick Tags) */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Gợi ý nhận xét nhanh
                                    </label>
                                    <span className="text-[11px] text-slate-400">Chọn để điền nhanh</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {QUICK_TAGS.map((tag) => {
                                        const isSelected = selectedTags.includes(tag);
                                        return (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => toggleTag(tag)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                                                    isSelected
                                                        ? 'bg-amber-50 border-amber-400 text-amber-800 shadow-2xs'
                                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                                                }`}
                                            >
                                                {isSelected ? '✓ ' : '+ '}
                                                {tag}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Tiêu chí 3: Nội dung nhận xét chi tiết */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Chia sẻ chi tiết về trải nghiệm
                                </label>
                                <textarea
                                    rows={3}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Hãy chia sẻ cảm nhận về chất lượng sản phẩm, form dáng, độ vừa vặn để nhận thưởng nhé..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none resize-none transition-all"
                                />
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">Tối thiểu 5 ký tự</span>
                                    <span className={`font-bold ${content.trim().length >= 5 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                        {content.trim().length}/500 ký tự
                                    </span>
                                </div>
                            </div>

                            {/* Tiêu chí 4: Dịch vụ Người bán & Vận chuyển (TikTok / Shopee Style) */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
                                    Đánh giá Dịch vụ & Vận chuyển
                                </h4>
                                
                                <div className="flex items-center justify-between text-xs sm:text-sm">
                                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                                        <Store size={16} className="text-slate-400" />
                                        <span>Dịch vụ Người bán</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setSellerRating(s)}
                                                className="p-0.5 focus:outline-none cursor-pointer"
                                            >
                                                <Star
                                                    size={18}
                                                    className={s <= sellerRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs sm:text-sm">
                                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                                        <Truck size={16} className="text-slate-400" />
                                        <span>Tốc độ Giao hàng</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setShippingRating(s)}
                                                className="p-0.5 focus:outline-none cursor-pointer"
                                            >
                                                <Star
                                                    size={18}
                                                    className={s <= shippingRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Tiêu chí 5: Toggle Đánh giá ẩn danh */}
                            <div className="flex items-center justify-between bg-white px-5 py-4 rounded-2xl border border-slate-200/80 shadow-xs">
                                <div className="flex items-center gap-2.5">
                                    <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">Đánh giá ẩn danh</p>
                                        <p className="text-[11px] text-slate-400">Tên của bạn sẽ hiển thị dưới dạng p***1</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isAnonymous}
                                        onChange={e => setIsAnonymous(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>

                            {/* Nút gửi đánh giá */}
                            <div className="flex items-center gap-3 pt-2">
                                {order.items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedItem(null)}
                                        className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
                                    >
                                        Quay lại
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handleSubmitReview}
                                    disabled={isSubmitting || (content.trim().length < 5 && selectedTags.length === 0)}
                                    className="flex-1 py-3.5 px-6 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-amber-200 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Đang gửi đánh giá...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send size={16} />
                                            <span>Hoàn tất & Nhận 50 Điểm</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        
                        /* ── VIEW 1: DANH SÁCH SẢN PHẨM TRONG ĐƠN HÀNG ── */
                        <div className="space-y-3">
                            <div className="flex items-center justify-between pb-1">
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Danh sách sản phẩm trong đơn ({order.items?.length || 0})
                                </p>
                                {unreviewedItems.length > 0 ? (
                                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                                        {unreviewedItems.length} sản phẩm chờ đánh giá
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                        ✓ Đã đánh giá tất cả
                                    </span>
                                )}
                            </div>

                            {order.items.map((item: any, index: number) => {
                                const reviewed = isAlreadyReviewed(item.product.id);
                                return (
                                    <div
                                        key={index}
                                        className={`bg-white p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 shadow-2xs ${
                                            reviewed ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-200 hover:border-amber-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-50 relative shrink-0 border border-slate-100">
                                                <Image
                                                    src={item.product.images?.[0] || '/placeholder.png'}
                                                    alt={item.product.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                                    {item.product.name}
                                                </h4>
                                                <p className="text-[11px] text-slate-500 mt-0.5">
                                                    Phân loại: {item.selectedSize}, {item.selectedColor?.name || 'Mặc định'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="shrink-0">
                                            {reviewed ? (
                                                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                                                    <CheckCircle2 size={13} className="text-emerald-500" />
                                                    Đã đánh giá
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleSelectProduct(item)}
                                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                                                >
                                                    <Star size={13} className="fill-white" />
                                                    <span>Đánh giá</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── FOOTER ── */}
                <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                        <ShieldCheck size={14} className="text-emerald-600" />
                        Đánh giá xác thực từ người mua hàng thực tế
                    </span>
                    <button
                        onClick={onClose}
                        className="font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}

