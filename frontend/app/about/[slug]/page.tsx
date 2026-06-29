'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, Eye, Tag, Loader2, ArrowLeft, Clock } from 'lucide-react';

interface Article {
    _id: string;
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    thumbnail: string;
    category: string;
    tags: string[];
    views: number;
    createdAt: string;
}

const CATEGORIES = [
    { value: 'xu-huong', label: 'Xu hướng' },
    { value: 'tips', label: 'Tips & Tricks' },
    { value: 'tin-tuc', label: 'Tin tức' },
    { value: 'phong-cach', label: 'Phong cách' },
    { value: 'khac', label: 'Khác' }
];

export default function ArticleDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!slug) return;
        const fetchArticle = async () => {
            setLoading(true);
            try {
                // Fetch by slug (The backend controller supports _id, id, and slug)
                const res = await fetch(`/api/articles/${slug}`);
                const data = await res.json();
                if (data.success && data.data) {
                    setArticle(data.data);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchArticle();
    }, [slug]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50/50">
                <Loader2 className="w-10 h-10 animate-spin text-black mb-4" />
                <p className="text-gray-500 font-light tracking-wide">Đang tải nội dung...</p>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50/50 px-4 text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-gray-500 mb-8 font-light">Bài viết không tồn tại hoặc đã bị xóa.</p>
                <button onClick={() => router.push('/about')} className="bg-black text-white px-8 py-3 rounded-full hover:bg-gray-800 transition-colors">
                    Trở về Trang Thông Tin
                </button>
            </div>
        );
    }

    return (
        <article className="min-h-screen bg-white pb-20">
            {/* Header / Hero */}
            <header className="relative bg-gray-50/50 pt-16 pb-20 lg:pt-20 lg:pb-24 border-b border-gray-100">
                <div className="container-torano max-w-4xl mx-auto px-4">
                    <button 
                        onClick={() => router.push('/about')}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-8 transition-colors group w-fit"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Trở lại danh sách
                    </button>

                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <span className="bg-black text-white px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider">
                            {CATEGORIES.find(c => c.value === article.category)?.label || article.category}
                        </span>
                        <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {formatDate(article.createdAt)}</span>
                            <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {article.views.toLocaleString()} lượt xem</span>
                            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> 5 phút đọc</span>
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.15] tracking-tight mb-6">
                        {article.title}
                    </h1>
                    
                    <p className="text-lg md:text-xl text-gray-500 font-light leading-relaxed max-w-3xl">
                        {article.excerpt}
                    </p>
                </div>
            </header>

            {/* Thumbnail */}
            {article.thumbnail && (
                <div className="container-torano max-w-5xl mx-auto px-4 -mt-12 md:-mt-16 relative z-10 mb-16">
                    <div className="aspect-[16/9] md:aspect-[21/9] relative rounded-2xl overflow-hidden shadow-2xl bg-gray-100">
                        <Image
                            src={article.thumbnail}
                            alt={article.title}
                            fill
                            priority
                            sizes="100vw"
                            className="object-cover"
                        />
                    </div>
                </div>
            )}

            {/* Content */}
            <div className={`container-torano max-w-3xl mx-auto px-4 ${!article.thumbnail ? 'mt-16' : ''}`}>
                <div 
                    className="article-content max-w-none"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                />

                {/* Footer / Tags */}
                {article.tags && article.tags.length > 0 && (
                    <div className="mt-16 pt-8 border-t border-gray-100 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 mr-2">Tags:</span>
                        {article.tags.map(tag => (
                            <Link 
                                href={`/about?search=${tag}`}
                                key={tag} 
                                className="text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                            >
                                <Tag className="w-3.5 h-3.5" /> {tag}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </article>
    );
}
