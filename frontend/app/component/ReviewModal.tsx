'use client';
import React, { useState, useEffect } from 'react';
import { X, Star, Loader2, Send, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface ReviewModalProps {
    order: any;
    onClose: () => void;
    user: any;
}

export default function ReviewModal({ order, onClose, user }: ReviewModalProps) {
    const [reviewingItemId, setReviewingItemId] = useState<string | null>(null);
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ─── Trạng thái đã đánh giá: load từ server + theo dõi trong phiên ──────────
    const [alreadyReviewedIds, setAlreadyReviewedIds] = useState<string[]>([]);
    const [loadingReviewed, setLoadingReviewed] = useState(true);

    const starLabels = ['Tệ', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Tuyệt vời'];

    // Load danh sách sản phẩm user đã đánh giá từ server ngay khi mở modal
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
                // Nếu lỗi mạng, để trống — server vẫn guard bằng 409
            } finally {
                setLoadingReviewed(false);
            }
        };
        fetchMyReviews();
    }, [user?.id]);

    const handleSubmit = async (item: any) => {
        if (!rating || content.trim().length < 5) {
            toast.error('Vui lòng chọn số sao và nhập ít nhất 5 ký tự');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_id: item.product.id,
                    rating,
                    content,
                    user_id: user?.id,
                    userName: user?.name,
                    userEmail: user?.email
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('✅ Đã gửi đánh giá thành công!');
                // Thêm vào danh sách đã đánh giá (cả server-confirmed)
                setAlreadyReviewedIds(prev => [...prev, item.product.id]);
                setReviewingItemId(null);
                setRating(5);
                setContent('');
            } else if (data.alreadyReviewed) {
                // Trường hợp hiếm: server trả 409 (đã đánh giá rồi)
                toast.error('⚠️ Bạn đã đánh giá sản phẩm này rồi!');
                setAlreadyReviewedIds(prev => [...prev, item.product.id]);
                setReviewingItemId(null);
            } else {
                toast.error(data.message || 'Lỗi khi gửi đánh giá');
            }
        } catch {
            toast.error('Lỗi kết nối khi gửi đánh giá');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Kiểm tra 1 sản phẩm đã được đánh giá chưa
    const isAlreadyReviewed = (productId: string) => alreadyReviewedIds.includes(productId);

    // Số sản phẩm chưa đánh giá
    const remainingCount = order.items.filter((item: any) => !isAlreadyReviewed(item.product.id)).length;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Đánh giá đơn hàng</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Mã đơn: #{order.id}
                            {!loadingReviewed && remainingCount > 0 && (
                                <span className="ml-2 text-amber-600 font-semibold">
                                    · {remainingCount} sản phẩm chưa đánh giá
                                </span>
                            )}
                            {!loadingReviewed && remainingCount === 0 && (
                                <span className="ml-2 text-emerald-600 font-semibold">· Đã đánh giá tất cả</span>
                            )}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                    {loadingReviewed ? (
                        <div className="flex items-center justify-center py-10 gap-3 text-gray-400">
                            <Loader2 className="animate-spin" size={20} />
                            <span className="text-sm">Đang kiểm tra trạng thái đánh giá...</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {order.items.map((item: any, index: number) => {
                                const reviewed = isAlreadyReviewed(item.product.id);
                                const isReviewing = reviewingItemId === item.product.id;

                                return (
                                    <div key={index} className={`bg-white p-5 rounded-2xl border shadow-sm transition-all ${reviewed ? 'border-emerald-100 bg-emerald-50/30' : 'border-gray-100'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 relative shrink-0">
                                                <Image src={item.product.images[0] || '/placeholder.png'} alt={item.product.name} fill className="object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-semibold text-gray-900 truncate">{item.product.name}</h4>
                                                <p className="text-xs text-gray-500 mt-1">Phân loại: {item.selectedSize}, {item.selectedColor.name}</p>
                                            </div>
                                            <div className="shrink-0">
                                                {reviewed ? (
                                                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                                                        <CheckCircle2 size={13} className="fill-emerald-100 stroke-emerald-500" />
                                                        Đã đánh giá
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setReviewingItemId(isReviewing ? null : item.product.id);
                                                            setRating(5);
                                                            setContent('');
                                                        }}
                                                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${isReviewing ? 'bg-gray-100 text-gray-600' : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200'}`}
                                                    >
                                                        {isReviewing ? 'Hủy' : '⭐ Đánh giá'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Form đánh giá — chỉ hiện khi chưa review và đang click */}
                                        {isReviewing && !reviewed && (
                                            <div className="mt-5 pt-5 border-t border-gray-100">
                                                {/* Sao đánh giá */}
                                                <div className="mb-4">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Chất lượng sản phẩm</label>
                                                    <div className="flex items-center gap-1">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <button
                                                                key={star}
                                                                type="button"
                                                                onClick={() => setRating(star)}
                                                                onMouseEnter={() => setHoverRating(star)}
                                                                onMouseLeave={() => setHoverRating(0)}
                                                                className="p-1 focus:outline-none transition-transform hover:scale-125"
                                                            >
                                                                <Star size={24} className={star <= (hoverRating || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                                                            </button>
                                                        ))}
                                                        <span className="ml-2 text-xs font-medium text-gray-500">{starLabels[(hoverRating || rating) - 1]}</span>
                                                    </div>
                                                </div>
                                                {/* Nội dung đánh giá */}
                                                <div className="mb-4">
                                                    <textarea
                                                        rows={3}
                                                        value={content}
                                                        onChange={(e) => setContent(e.target.value)}
                                                        placeholder="Hãy chia sẻ nhận xét của bạn về sản phẩm này nhé (tối thiểu 5 ký tự)..."
                                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 outline-none resize-none"
                                                    />
                                                    <p className={`text-xs mt-1 text-right ${content.trim().length < 5 ? 'text-rose-400' : 'text-emerald-500'}`}>
                                                        {content.trim().length} ký tự {content.trim().length < 5 ? `(cần thêm ${5 - content.trim().length} ký tự)` : '✓'}
                                                    </p>
                                                </div>
                                                <div className="flex justify-end">
                                                    <button
                                                        onClick={() => handleSubmit(item)}
                                                        disabled={isSubmitting || content.trim().length < 5}
                                                        className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm shadow-amber-200"
                                                    >
                                                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                                                        Gửi đánh giá
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer hint */}
                {!loadingReviewed && remainingCount === 0 && (
                    <div className="px-6 py-4 border-t border-emerald-100 bg-emerald-50/60 text-center">
                        <p className="text-sm text-emerald-700 font-medium">🎉 Bạn đã đánh giá tất cả sản phẩm trong đơn hàng này!</p>
                        <button onClick={onClose} className="mt-2 text-xs text-gray-500 underline hover:text-gray-700">Đóng cửa sổ</button>
                    </div>
                )}
            </div>
        </div>
    );
}
