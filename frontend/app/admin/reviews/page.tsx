'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, Star, CheckCircle, XCircle, Trash2, User } from 'lucide-react';
import { ProductReview } from '@/types';

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<ProductReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

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

    const updateReviewStatus = async (id: string, newStatus: string) => {
        try {
            const res = await fetch('/api/admin/reviews/status', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                setReviews(reviews.map(r => r.id === id ? { ...r, status: newStatus as 'pending' | 'approved' | 'rejected' } : r));
            } else {
                alert(data.message || 'Lỗi cập nhật trạng thái');
            }
        } catch (error) {
            console.error('Lỗi API:', error);
            alert('Có lỗi xảy ra khi cập nhật');
        }
    };

    const deleteReview = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá này?')) return;
        
        try {
            const res = await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setReviews(reviews.filter(r => r.id !== id));
            } else {
                alert(data.message || 'Lỗi xóa đánh giá');
            }
        } catch (error) {
            console.error('Lỗi API:', error);
            alert('Có lỗi xảy ra khi xóa');
        }
    };

    const filteredReviews = reviews.filter(review => {
        const matchesSearch = 
            (review.userName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (review.productName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (review.content?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600">Đã duyệt</span>;
            case 'rejected': return <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600">Đã ẩn</span>;
            default: return <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600">Chờ duyệt</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Quản lý Đánh giá</h1>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên KH, sản phẩm, nội dung..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    {[
                        { value: 'all', label: 'Tất cả' },
                        { value: 'pending', label: 'Chờ duyệt' },
                        { value: 'approved', label: 'Đã duyệt' },
                        { value: 'rejected', label: 'Đã ẩn' }
                    ].map(option => (
                        <button
                            key={option.value}
                            onClick={() => setStatusFilter(option.value as 'all' | 'pending' | 'approved' | 'rejected')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                statusFilter === option.value
                                    ? 'bg-black text-white'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đánh giá</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <Loader2 className="animate-spin text-gray-400 mx-auto mb-2" size={24} />
                                        <p className="text-gray-500 text-sm">Đang tải dữ liệu...</p>
                                    </td>
                                </tr>
                            ) : filteredReviews.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <p className="text-gray-500 text-sm">Không tìm thấy đánh giá nào.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredReviews.map((review) => (
                                    <motion.tr
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        key={review.id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                    <User size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{review.userName}</p>
                                                    <p className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString('vi-VN')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-900 line-clamp-2 max-w-[200px]">{review.productName}</p>
                                            <p className="text-xs text-gray-500 mt-1">ID: {review.product_id}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1 mb-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={12} className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                                                ))}
                                            </div>
                                            <p className="text-sm text-gray-600 line-clamp-2 max-w-[300px]">{review.content}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(review.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {review.status !== 'approved' && (
                                                    <button
                                                        onClick={() => updateReviewStatus(review.id, 'approved')}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                        title="Duyệt đánh giá"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}
                                                {review.status !== 'rejected' && (
                                                    <button
                                                        onClick={() => updateReviewStatus(review.id, 'rejected')}
                                                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                        title="Ẩn đánh giá"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteReview(review.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Xóa vĩnh viễn"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
