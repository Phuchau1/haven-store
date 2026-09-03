'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Star, MessageSquare, Send, X, User, CheckCircle2, Sparkles } from 'lucide-react';
import { ProductReview } from '@/types';

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<ProductReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [ratingFilter, setRatingFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');
    const [replyFilter, setReplyFilter] = useState<'all' | 'replied' | 'not_replied'>('all');

    // State cho Modal Trả lời Đánh giá
    const [selectedReview, setSelectedReview] = useState<ProductReview | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/reviews');
            const data = await res.json();
            if (data.success) {
                setReviews(data.reviews);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleOpenReply = (review: ProductReview) => {
        setSelectedReview(review);
        setReplyText(review.reply || '');
    };

    const handleSendReply = async () => {
        if (!selectedReview) return;
        if (!replyText.trim()) {
            alert('Vui lòng nhập nội dung phản hồi');
            return;
        }

        setIsSubmittingReply(true);
        try {
            const res = await fetch('/api/admin/reviews/reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedReview.id,
                    reply: replyText.trim()
                })
            });
            const data = await res.json();
            if (data.success) {
                setReviews(reviews.map(r => r.id === selectedReview.id ? { ...r, reply: replyText.trim(), replyCreatedAt: new Date().toISOString() } : r));
                showToast('Đã gửi câu trả lời đánh giá thành công! 🎉');
                setSelectedReview(null);
                setReplyText('');
            } else {
                alert(data.message || 'Lỗi gửi phản hồi');
            }
        } catch (error) {
            console.error('Lỗi API reply:', error);
            alert('Có lỗi xảy ra khi gửi phản hồi');
        } finally {
            setIsSubmittingReply(false);
        }
    };

    const quickTemplates = [
        'Cảm ơn bạn đã tin tưởng và ủng hộ HAVEN STORE! Chúc bạn luôn có trải nghiệm tuyệt vời cùng sản phẩm ❤️',
        'HAVEN STORE xin chân thành cảm ơn đánh giá của bạn! Sự hài lòng của bạn là niềm vui và động lực lớn nhất của Shop.',
        'Cảm ơn phản hồi quý báu của bạn. Shop sẽ luôn cố gắng hoàn thiện dịch vụ và chất lượng sản phẩm tốt hơn nữa!',
        'Dạ Shop cảm ơn bạn nhiều ạ! Chúc bạn luôn rạng rỡ và tự tin trong trang phục của HAVEN STORE nhé 🥰'
    ];

    const filteredReviews = reviews.filter(review => {
        const matchesSearch = 
            (review.userName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (review.productName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (review.content?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        
        const matchesRating = ratingFilter === 'all' || review.rating === Number(ratingFilter);
        const matchesReply = 
            replyFilter === 'all' ||
            (replyFilter === 'replied' && !!review.reply) ||
            (replyFilter === 'not_replied' && !review.reply);
        
        return matchesSearch && matchesRating && matchesReply;
    });

    return (
        <div className="space-y-6">
            {/* Toast Notification */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="fixed top-6 right-6 z-[9999] flex items-center gap-2.5 px-5 py-3.5 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 text-sm font-medium"
                    >
                        <CheckCircle2 size={18} className="text-emerald-400" />
                        <span>{toastMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý & Trả lời Đánh giá</h1>
                    <p className="text-xs text-gray-500 mt-1">Xem đánh giá từ khách hàng và gửi phản hồi chính thức từ HAVEN STORE</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên khách hàng, tên sản phẩm, nội dung..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    />
                </div>
                
                {/* Lọc theo trạng thái phản hồi */}
                <div className="flex flex-wrap gap-2">
                    {[
                        { value: 'all', label: 'Tất cả' },
                        { value: 'not_replied', label: '⏳ Chưa trả lời' },
                        { value: 'replied', label: '✅ Đã trả lời' }
                    ].map(option => (
                        <button
                            key={option.value}
                            onClick={() => setReplyFilter(option.value as any)}
                            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                                replyFilter === option.value
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                {/* Lọc theo sao */}
                <div className="flex flex-wrap gap-1.5 border-t lg:border-t-0 lg:border-l border-gray-100 pt-2 lg:pt-0 lg:pl-3">
                    {[
                        { value: 'all', label: 'Tất cả sao' },
                        { value: '5', label: '5 ⭐' },
                        { value: '4', label: '4 ⭐' },
                        { value: '3', label: '3 ⭐' },
                        { value: '2', label: '2 ⭐' },
                        { value: '1', label: '1 ⭐' }
                    ].map(option => (
                        <button
                            key={option.value}
                            onClick={() => setRatingFilter(option.value as any)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                ratingFilter === option.value
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Khách hàng</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Đánh giá & Phản hồi</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <Loader2 className="animate-spin text-gray-400 mx-auto mb-2" size={24} />
                                        <p className="text-gray-500 text-sm">Đang tải dữ liệu đánh giá...</p>
                                    </td>
                                </tr>
                            ) : filteredReviews.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <p className="text-gray-500 text-sm">Không tìm thấy đánh giá nào phù hợp.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredReviews.map((review) => (
                                    <motion.tr
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        key={review.id}
                                        className="hover:bg-slate-50/70 transition-colors"
                                    >
                                        {/* Khách hàng */}
                                        <td className="px-6 py-4 align-top">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                                                    {review.userName ? review.userName.charAt(0).toUpperCase() : <User size={16} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{review.userName}</p>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">{new Date(review.created_at).toLocaleDateString('vi-VN')}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Sản phẩm */}
                                        <td className="px-6 py-4 align-top">
                                            <p className="text-sm font-medium text-gray-900 line-clamp-2 max-w-[220px]">{review.productName}</p>
                                            <p className="text-[11px] font-mono text-gray-400 mt-1">ID: {review.product_id}</p>
                                        </td>

                                        {/* Đánh giá & Phản hồi của Shop */}
                                        <td className="px-6 py-4 align-top max-w-[380px]">
                                            <div className="space-y-2">
                                                {/* Sao & Tags */}
                                                <div className="flex items-center gap-2">
                                                    <div className="flex gap-0.5">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={13} className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs font-bold text-amber-600">{review.rating} / 5</span>
                                                </div>

                                                {/* Quick Tags */}
                                                {review.tags && review.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {review.tags.map((tag, tIdx) => (
                                                            <span key={tIdx} className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded text-[10px] font-medium border border-amber-200/60">
                                                                ✓ {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Nội dung khách viết */}
                                                <p className="text-xs text-gray-700 leading-relaxed bg-gray-50/80 p-2.5 rounded-lg border border-gray-100">
                                                    "{review.content}"
                                                </p>

                                                {/* Phản hồi của Shop (Nếu có) */}
                                                {review.reply ? (
                                                    <div className="p-2.5 bg-indigo-50/70 border-l-3 border-indigo-600 rounded-r-lg space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[11px] font-bold text-indigo-700 flex items-center gap-1">
                                                                🏪 Phản hồi của Shop:
                                                            </span>
                                                            {review.replyCreatedAt && (
                                                                <span className="text-[10px] text-slate-400">
                                                                    {new Date(review.replyCreatedAt).toLocaleDateString('vi-VN')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-700 italic leading-snug">
                                                            "{review.reply}"
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="text-[11px] text-slate-400 italic">Chưa có phản hồi từ người bán</p>
                                                )}
                                            </div>
                                        </td>

                                        {/* Trạng thái Phản hồi */}
                                        <td className="px-6 py-4 align-top text-center">
                                            {review.reply ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <CheckCircle2 size={12} /> Đã trả lời
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                                    Chờ trả lời
                                                </span>
                                            )}
                                        </td>

                                        {/* THAO TÁC: THAY THẾ TOÀN BỘ BẰNG NÚT TRẢ LỜI ĐÁNH GIÁ */}
                                        <td className="px-6 py-4 align-top text-right">
                                            <button
                                                onClick={() => handleOpenReply(review)}
                                                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 ${
                                                    review.reply
                                                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                                }`}
                                            >
                                                <MessageSquare size={14} />
                                                <span>{review.reply ? 'Sửa trả lời' : 'Trả lời đánh giá'}</span>
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL TRẢ LỜI ĐÁNH GIÁ (PHIÊN BẢN RỘNG RÃI & THOÁNG MẮT) */}
            <AnimatePresence>
                {selectedReview && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-100 my-8"
                        >
                            {/* Modal Header */}
                            <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                                        <MessageSquare size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Trả lời Đánh giá Khách hàng</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">Phản hồi chính thức sẽ được hiển thị công khai ngay dưới đánh giá trên trang sản phẩm</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedReview(null)}
                                    className="p-2 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
                                {/* Tóm tắt đánh giá khách hàng */}
                                <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                                                {selectedReview.userName ? selectedReview.userName.charAt(0).toUpperCase() : 'K'}
                                            </div>
                                            <div>
                                                <span className="text-sm font-bold text-slate-900 block">
                                                    {selectedReview.userName}
                                                </span>
                                                <span className="text-[11px] text-slate-400">
                                                    {new Date(selectedReview.created_at).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={13} className={i < selectedReview.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                                                ))}
                                            </div>
                                            <span className="text-xs font-bold text-amber-700">{selectedReview.rating} / 5</span>
                                        </div>
                                    </div>

                                    <div className="text-xs text-slate-600 font-medium">
                                        <span className="text-slate-400">Sản phẩm:</span> <strong className="text-slate-900">{selectedReview.productName}</strong>
                                    </div>

                                    {/* Tags */}
                                    {selectedReview.tags && selectedReview.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {selectedReview.tags.map((tag, tIdx) => (
                                                <span key={tIdx} className="px-2.5 py-0.5 bg-amber-100/70 text-amber-900 rounded-md text-[11px] font-medium border border-amber-200">
                                                    ✓ {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Review text */}
                                    <div className="text-sm text-slate-800 bg-white p-3.5 rounded-xl border border-slate-200/80 leading-relaxed font-normal">
                                        "{selectedReview.content}"
                                    </div>
                                </div>

                                {/* Gợi ý mẫu câu trả lời nhanh (Grid 2 Cột hiển thị trọn vẹn chữ) */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <Sparkles size={14} className="text-indigo-600" /> Chọn nhanh mẫu câu phản hồi chuyên nghiệp:
                                        </label>
                                        <span className="text-[11px] text-slate-400">Bấm để tự động điền</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {quickTemplates.map((template, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setReplyText(template)}
                                                className="text-left p-3 rounded-2xl text-xs text-slate-700 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-900 border border-slate-200 transition-all leading-relaxed cursor-pointer active:scale-98 group flex items-start gap-2"
                                            >
                                                <span className="text-sm shrink-0">💬</span>
                                                <span className="font-medium group-hover:font-semibold">{template}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Textarea Nhập phản hồi */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Nội dung phản hồi của HAVEN STORE <span className="text-rose-500">*</span>
                                        </label>
                                        <span className="text-xs font-mono font-medium text-slate-400">{replyText.length} / 1000 ký tự</span>
                                    </div>
                                    <textarea
                                        rows={5}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Nhập lời cảm ơn, giải đáp hoặc phản hồi chính thức từ HAVEN STORE tới khách hàng..."
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all resize-y leading-relaxed font-normal shadow-2xs"
                                        maxLength={1000}
                                    />
                                    <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                                        💡 <span>Khách hàng sẽ nhận được phản hồi này công khai ngay tại trang sản phẩm và trong đơn mua.</span>
                                    </p>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 sm:px-8 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedReview(null)}
                                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="button"
                                    disabled={isSubmittingReply || !replyText.trim()}
                                    onClick={handleSendReply}
                                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer active:scale-95"
                                >
                                    {isSubmittingReply ? (
                                        <>
                                            <Loader2 size={15} className="animate-spin" />
                                            <span>Đang gửi phản hồi...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send size={15} />
                                            <span>Gửi phản hồi cho khách</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
