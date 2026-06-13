'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Star, User, Loader2, Send, Info, Droplets, Wind, ShieldCheck, HelpCircle, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Product, ProductReview } from '@/types';
import Image from 'next/image';
import { useAuth } from './AuthContext';

interface ProductTabsProps {
    product: Product;
}

export default function ProductTabs({ product }: ProductTabsProps) {
    const [activeTab, setActiveTab] = useState('description');
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    // Reviews state
    const [reviews, setReviews] = useState<ProductReview[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewContent, setReviewContent] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const { user } = useAuth();

    const showToast = useCallback((type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    }, []);

    // Fetch reviews khi mở tab đánh giá — dùng API mới /api/reviews
    useEffect(() => {
        if (activeTab === 'reviews') {
            const fetchReviews = async () => {
                setLoadingReviews(true);
                try {
                    const res = await fetch(`/api/reviews?product_id=${product.id}`);
                    const data = await res.json();
                    if (data.success) {
                        setReviews(data.reviews);
                    }
                } catch (error) {
                    console.error('Error fetching reviews:', error);
                } finally {
                    setLoadingReviews(false);
                }
            };
            fetchReviews();
        }
    }, [activeTab, product.id]);

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = reviewContent.trim();
        if (!trimmed || trimmed.length < 5) {
            showToast('error', 'Vui lòng nhập nội dung đánh giá (ít nhất 5 ký tự)');
            return;
        }

        setIsSubmittingReview(true);
        try {
            // Gửi đến API mới — lưu vĩnh viễn vào MongoDB
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_id: product.id,
                    rating,
                    content: trimmed,
                    user_id: user?.id || 'guest',
                    userName: user?.name || 'Khách hàng ẩn danh',
                    userEmail: user?.email || ''
                })
            });
            const data = await res.json();
            if (data.success) {
                setReviews(prev => [data.review, ...prev]);
                setReviewContent('');
                setRating(5);
                showToast('success', 'Đánh giá của bạn đã được lưu thành công! Cảm ơn bạn 🎉');
            } else {
                showToast('error', data.message || 'Có lỗi xảy ra khi gửi đánh giá');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            showToast('error', 'Không thể kết nối server. Vui lòng thử lại.');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const starLabels = ['Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Rất tuyệt!'];

    const tabs = [
        { id: 'description', label: 'Mô tả chi tiết' },
        { id: 'reviews', label: `Đánh giá (${product.reviews || 0})` },
        { id: 'policy', label: 'Chính sách đổi trả' },
        { id: 'faq', label: 'Hỏi đáp (FAQ)' },
    ];

    return (
        <div className="mt-16 lg:mt-24 w-full container-torano">
            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.25 }}
                        className={`fixed top-6 right-6 z-[9999] flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl max-w-sm ${
                            toast.type === 'success'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-rose-600 text-white'
                        }`}
                    >
                        <div className="mt-0.5 shrink-0">
                            {toast.type === 'success'
                                ? <CheckCircle2 size={18} />
                                : <AlertCircle size={18} />
                            }
                        </div>
                        <p className="text-sm font-medium leading-snug flex-1">{toast.message}</p>
                        <button onClick={() => setToast(null)} className="mt-0.5 shrink-0 opacity-70 hover:opacity-100">
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Tabs Header */}
            <div className="flex overflow-x-auto hide-scrollbar border-b border-gray-200">
                <div className="flex space-x-8 min-w-max pb-px">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-4 text-sm font-medium tracking-wide transition-all relative ${
                                activeTab === tab.id ? 'text-black' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"
                                    initial={false}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabs Content */}
            <div className="py-8 lg:py-12 min-h-[400px]">
                <AnimatePresence mode="wait">
                    {/* ===== TAB DESCRIPTION ===== */}
                    {activeTab === 'description' && (
                        <motion.div
                            key="description"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-12"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                {/* HTML Content */}
                                <div className="lg:col-span-8">
                                    <div className={`relative overflow-hidden transition-all duration-500 ${isDescriptionExpanded ? '' : 'max-h-[600px]'}`}>
                                        <div 
                                            className="prose prose-sm lg:prose-base prose-gray max-w-none prose-headings:font-medium prose-a:text-indigo-600 prose-img:rounded-2xl prose-img:shadow-sm"
                                            dangerouslySetInnerHTML={{ __html: product.content || '<p>Đang cập nhật nội dung chi tiết...</p>' }}
                                        />
                                        {!isDescriptionExpanded && (
                                            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white to-transparent" />
                                        )}
                                    </div>
                                    <div className="mt-6 text-center">
                                        <button 
                                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            {isDescriptionExpanded ? (
                                                <>Thu gọn <ChevronUp size={16} /></>
                                            ) : (
                                                <>Xem thêm <ChevronDown size={16} /></>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Sidebar Instructions & Notes */}
                                <div className="lg:col-span-4 space-y-8">
                                    {/* Care Instructions */}
                                    {(product.instructions && product.instructions.length > 0) && (
                                        <div className="bg-gray-50 rounded-3xl p-8">
                                            <div className="flex items-center gap-3 mb-6">
                                                <Droplets className="text-blue-500" size={24} />
                                                <h3 className="text-lg font-medium text-gray-900">Hướng dẫn bảo quản</h3>
                                            </div>
                                            <ul className="space-y-4">
                                                {product.instructions.map((inst, idx) => (
                                                    <li key={idx} className="flex gap-3 text-sm text-gray-600 leading-relaxed">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-2 shrink-0" />
                                                        {inst}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Notes */}
                                    {(product.notes && product.notes.length > 0) && (
                                        <div className="bg-amber-50 rounded-3xl p-8">
                                            <div className="flex items-center gap-3 mb-6">
                                                <Info className="text-amber-500" size={24} />
                                                <h3 className="text-lg font-medium text-gray-900">Lưu ý nhỏ</h3>
                                            </div>
                                            <ul className="space-y-4">
                                                {product.notes.map((note, idx) => (
                                                    <li key={idx} className="flex gap-3 text-sm text-amber-800 leading-relaxed">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                                                        {note}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Size Chart Image */}
                                    {product.sizeChartImage && (
                                        <div className="bg-gray-50 rounded-3xl p-8">
                                            <div className="flex items-center gap-3 mb-6">
                                                <Wind className="text-gray-900" size={24} />
                                                <h3 className="text-lg font-medium text-gray-900">Bảng kích thước</h3>
                                            </div>
                                            <div className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-zoom-in">
                                                <Image src={product.sizeChartImage} alt="Size chart" fill className="object-contain" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ===== TAB REVIEWS ===== */}
                    {activeTab === 'reviews' && (
                        <motion.div
                            key="reviews"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                {/* Reviews Summary & Form */}
                                <div className="lg:col-span-4 space-y-8">
                                    <div className="bg-gray-50 rounded-3xl p-8 text-center">
                                        <h3 className="text-5xl font-light text-black mb-2">{product.rating || 5} <span className="text-xl text-gray-400">/ 5</span></h3>
                                        <div className="flex justify-center gap-1 mb-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star key={star} size={20} className={star <= Math.round(product.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                                            ))}
                                        </div>
                                        <p className="text-sm text-gray-500">Dựa trên {product.reviews || 0} đánh giá</p>
                                    </div>

                                    {/* Review Form */}
                                    <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                                        <h4 className="text-lg font-medium text-gray-900 mb-6">Viết đánh giá của bạn</h4>
                                        <form onSubmit={handleSubmitReview} className="space-y-5">
                                            {/* Star Rating Picker */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-3">Đánh giá sao</label>
                                                <div className="flex items-center gap-1">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onClick={() => setRating(star)}
                                                            onMouseEnter={() => setHoverRating(star)}
                                                            onMouseLeave={() => setHoverRating(0)}
                                                            className="p-1 focus:outline-none transition-transform hover:scale-125 active:scale-110"
                                                        >
                                                            <Star
                                                                size={28}
                                                                className={`transition-colors ${
                                                                    star <= (hoverRating || rating)
                                                                        ? 'text-yellow-400 fill-yellow-400'
                                                                        : 'text-gray-200'
                                                                }`}
                                                            />
                                                        </button>
                                                    ))}
                                                    <span className="ml-2 text-sm font-medium text-gray-500">
                                                        {starLabels[(hoverRating || rating) - 1]}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Nội dung đánh giá
                                                    <span className="text-gray-400 font-normal ml-1">({reviewContent.trim().length}/2000)</span>
                                                </label>
                                                <textarea
                                                    required
                                                    rows={4}
                                                    value={reviewContent}
                                                    onChange={(e) => setReviewContent(e.target.value)}
                                                    maxLength={2000}
                                                    placeholder="Chia sẻ cảm nhận về chất liệu, size, màu sắc..."
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none transition-all resize-none"
                                                />
                                            </div>

                                            {/* Tên người dùng (nếu chưa đăng nhập) */}
                                            {!user && (
                                                <div className="text-xs text-amber-600 bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
                                                    💡 Bạn đang đánh giá với tư cách <strong>Khách ẩn danh</strong>. Đăng nhập để hiển thị tên của bạn.
                                                </div>
                                            )}

                                            <button
                                                type="submit"
                                                disabled={isSubmittingReview || reviewContent.trim().length < 5}
                                                className="w-full flex items-center justify-center gap-2 py-3.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                                            >
                                                {isSubmittingReview
                                                    ? <><Loader2 className="animate-spin" size={18} /> Đang lưu...</>
                                                    : <><Send size={18} /> Gửi đánh giá</>}
                                            </button>
                                        </form>
                                    </div>
                                </div>

                                {/* Reviews List */}
                                <div className="lg:col-span-8">
                                    <h4 className="text-xl font-medium text-gray-900 mb-8">Tất cả đánh giá</h4>
                                    
                                    {loadingReviews ? (
                                        <div className="flex justify-center py-12">
                                            <Loader2 className="animate-spin text-gray-400" size={32} />
                                        </div>
                                    ) : reviews.length === 0 ? (
                                        <div className="text-center py-12 bg-gray-50 rounded-3xl border border-gray-100 border-dashed">
                                            <Star className="mx-auto text-gray-300 mb-3" size={32} />
                                            <p className="text-gray-500 font-medium">Chưa có đánh giá nào.</p>
                                            <p className="text-sm text-gray-400 mt-1">Hãy là người đầu tiên đánh giá sản phẩm này.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {reviews.map((review) => (
                                                <div key={review.id} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                                                                <User size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">{review.userName}</p>
                                                                <p className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString('vi-VN')}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} size={14} className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-700 text-sm leading-relaxed">{review.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ===== TAB POLICY ===== */}
                    {activeTab === 'policy' && (
                        <motion.div
                            key="policy"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="max-w-3xl space-y-8"
                        >
                            <div className="prose prose-gray">
                                <h3>Chính sách đổi trả trong 7 ngày</h3>
                                <p>Chúng tôi mong muốn mang đến cho bạn trải nghiệm mua sắm tuyệt vời nhất. Nếu bạn không hoàn toàn hài lòng với giao dịch mua hàng của mình, chúng tôi sẵn sàng trợ giúp.</p>
                                
                                <div className="p-6 bg-blue-50 rounded-2xl my-8">
                                    <h4 className="flex items-center gap-2 text-blue-900 mt-0"><ShieldCheck size={20} /> Điều kiện đổi trả</h4>
                                    <ul className="text-blue-800 mb-0">
                                        <li>Sản phẩm chưa qua sử dụng, chưa giặt ủi và không có mùi lạ.</li>
                                        <li>Còn nguyên tem mác, hộp và phụ kiện đi kèm (nếu có).</li>
                                        <li>Yêu cầu đổi trả được thực hiện trong vòng 7 ngày kể từ ngày nhận hàng.</li>
                                        <li>Có video quay quá trình mở hàng để làm bằng chứng (bắt buộc đối với trường hợp hàng lỗi/thiếu).</li>
                                    </ul>
                                </div>

                                <h4>Các bước thực hiện</h4>
                                <ol>
                                    <li>Liên hệ bộ phận CSKH qua Hotline hoặc Fanpage.</li>
                                    <li>Cung cấp mã đơn hàng và hình ảnh/video sản phẩm cần đổi/trả.</li>
                                    <li>Đóng gói sản phẩm cẩn thận và gửi về địa chỉ kho của chúng tôi.</li>
                                    <li>Chúng tôi sẽ xử lý yêu cầu và hoàn tiền/gửi hàng đổi trong vòng 3-5 ngày làm việc.</li>
                                </ol>
                            </div>
                        </motion.div>
                    )}

                    {/* ===== TAB FAQ ===== */}
                    {activeTab === 'faq' && (
                        <motion.div
                            key="faq"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="max-w-3xl space-y-4"
                        >
                            {[
                                { q: 'Thời gian giao hàng là bao lâu?', a: 'Thông thường, đơn hàng nội thành sẽ được giao trong 1-2 ngày. Các tỉnh thành khác sẽ mất khoảng 3-5 ngày làm việc.' },
                                { q: 'Tôi có thể kiểm tra hàng trước khi thanh toán không?', a: 'Có, chúng tôi hỗ trợ hình thức kiểm tra hàng trước khi nhận đối với tất cả các đơn hàng COD.' },
                                { q: 'Làm sao để biết tôi mặc size nào?', a: 'Bạn có thể tham khảo phần "Bảng kích thước" ở tab Mô tả chi tiết. Nếu vẫn chưa chắc chắn, hãy liên hệ với chúng tôi để được tư vấn.' },
                                { q: 'Sản phẩm có giống hình không?', a: '100% hình ảnh sản phẩm là ảnh chụp thật tại studio của chúng tôi. Màu sắc thực tế có thể chênh lệch 3-5% do ánh sáng màn hình.' }
                            ].map((faq, index) => (
                                <details key={index} className="group bg-gray-50 rounded-2xl open:bg-white open:ring-1 open:ring-gray-200 transition-all">
                                    <summary className="flex items-center justify-between cursor-pointer p-6 font-medium text-gray-900 list-none">
                                        <div className="flex items-center gap-3">
                                            <HelpCircle size={18} className="text-gray-400 group-open:text-black" />
                                            {faq.q}
                                        </div>
                                        <span className="transition group-open:rotate-180">
                                            <ChevronDown size={18} className="text-gray-400" />
                                        </span>
                                    </summary>
                                    <div className="px-6 pb-6 text-gray-600 text-sm leading-relaxed">
                                        <p className="pl-7">{faq.a}</p>
                                    </div>
                                </details>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
