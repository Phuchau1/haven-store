'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Eye, Tag, Loader2, ChevronRight } from 'lucide-react';

interface Article {
    _id: string;
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    thumbnail: string;
    category: string;
    tags: string[];
    views: number;
    createdAt: string;
}

const CATEGORIES = [
    { value: 'all', label: 'Tất cả' },
    { value: 'xu-huong', label: 'Xu hướng' },
    { value: 'tips', label: 'Tips & Tricks' },
    { value: 'tin-tuc', label: 'Tin tức' },
    { value: 'phong-cach', label: 'Phong cách' }
];

export default function AboutPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCat, setActiveCat] = useState('all');

    useEffect(() => {
        const fetchArticles = async () => {
            setLoading(true);
            try {
                // Public route /api/articles chỉ lấy các bài viết đã published
                const url = activeCat === 'all' 
                    ? '/api/articles?limit=50' 
                    : `/api/articles?limit=50&category=${activeCat}`;
                const res = await fetch(url);
                const data = await res.json();
                if (data.success) {
                    setArticles(data.data || []);
                }
            } catch (error) {
                console.error('Lỗi tải bài viết:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchArticles();
    }, [activeCat]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50/30">
            {/* Hero Section */}
            <div className="bg-white py-16 lg:py-24 border-b border-gray-100">
                <div className="container-torano text-center px-4">
                    <h1 className="text-4xl lg:text-5xl font-light text-black tracking-tight mb-4">Thông tin & Tin tức</h1>
                    <p className="text-gray-500 max-w-2xl mx-auto font-light leading-relaxed">
                        Cập nhật những xu hướng thời trang mới nhất, các tips phối đồ thanh lịch và tin tức từ PH Store. 
                        Khơi nguồn cảm hứng cho phong cách cá nhân của bạn mỗi ngày.
                    </p>
                </div>
            </div>

            {/* Articles Section */}
            <div className="container-torano py-12 px-4">
                {/* Categories Filter */}
                <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.value}
                            onClick={() => setActiveCat(cat.value)}
                            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                                activeCat === cat.value
                                    ? 'bg-black text-white shadow-md'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Loader2 className="animate-spin w-8 h-8 mb-4" />
                        <p className="font-light">Đang tải bài viết...</p>
                    </div>
                ) : articles.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-500 font-light">Chưa có bài viết nào trong danh mục này.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {articles.map((article) => (
                            <Link 
                                href={`/about/${article.slug}`} 
                                key={article._id}
                                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col"
                            >
                                {/* Thumbnail */}
                                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                                    {article.thumbnail ? (
                                        <Image
                                            src={article.thumbnail}
                                            alt={article.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            No Image
                                        </div>
                                    )}
                                    {/* Category Badge */}
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-black shadow-sm">
                                        {CATEGORIES.find(c => c.value === article.category)?.label || article.category}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-3 font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {formatDate(article.createdAt)}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Eye className="w-3.5 h-3.5" />
                                            {article.views.toLocaleString()} lượt xem
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-black/70 transition-colors">
                                        {article.title}
                                    </h3>
                                    
                                    <p className="text-sm text-gray-500 font-light line-clamp-3 mb-6 flex-1">
                                        {article.excerpt}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-2 max-w-[70%] overflow-hidden">
                                            {article.tags?.slice(0, 2).map(tag => (
                                                <span key={tag} className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md flex items-center gap-1 truncate">
                                                    <Tag className="w-3 h-3" /> {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <span className="text-sm font-semibold text-black flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                            Đọc tiếp <ChevronRight className="w-4 h-4" />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
