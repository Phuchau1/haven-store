'use client';
// ===== HAVEN JOURNAL - CHI TIẾT BÀI VIẾT TẠP CHÍ THỜI TRANG =====
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
    Calendar, Eye, Tag, Loader2, ArrowLeft, Clock, 
    Share2, Check, Sparkles, BookOpen, ChevronRight, User
} from 'lucide-react';

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
    { value: 'xu-huong', label: 'Xu hướng 2026' },
    { value: 'tips', label: 'Tips & Tricks' },
    { value: 'tin-tuc', label: 'Tin tức HAVEN' },
    { value: 'phong-cach', label: 'Phong cách sống' },
    { value: 'khac', label: 'Khác' }
];

const FALLBACK_THUMBNAILS = [
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80',
    'https://images.unsplash.com/photo-1594938298603-c8148c4b9d42?w=1200&q=80',
    'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1200&q=80',
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1200&q=80',
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&q=80',
];

function getValidThumbnail(thumb: string): string {
    if (!thumb) return FALLBACK_THUMBNAILS[0];
    if (thumb.startsWith('http://') || thumb.startsWith('https://') || thumb.startsWith('/')) {
        return thumb;
    }
    return FALLBACK_THUMBNAILS[0];
}

export default function ArticleDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [article, setArticle] = useState<Article | null>(null);
    const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!slug) return;
        const fetchArticle = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/articles/${slug}`);
                const data = await res.json();
                if (data.success && data.data) {
                    setArticle(data.data);
                    
                    // Fetch related articles
                    const relRes = await fetch(`/api/articles?limit=4`);
                    const relData = await relRes.json();
                    if (relData.success) {
                        setRelatedArticles((relData.data || []).filter((a: Article) => a.slug !== slug).slice(0, 3));
                    }
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
        if (!dateString) return 'Mới cập nhật';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    const handleCopyLink = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#f8fafc]">
                <Loader2 className="w-8 h-8 animate-spin text-slate-800 mb-3" />
                <p className="text-xs text-slate-500 font-medium tracking-wide">Đang tải bài viết...</p>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#f8fafc] px-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-4 shadow-xs">
                    <BookOpen size={28} />
                </div>
                <h1 className="text-xl font-bold text-slate-900 mb-2">Bài viết không tồn tại</h1>
                <p className="text-xs text-slate-500 mb-6 max-w-sm">
                    Bài viết bạn tìm kiếm có thể đã được gỡ hoặc đường dẫn không chính xác.
                </p>
                <button 
                    onClick={() => router.push('/about')} 
                    className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
                >
                    Trở về Tạp chí HAVEN
                </button>
            </div>
        );
    }

    return (
        <article className="min-h-screen bg-white pb-24">
            {/* ── BREADCRUMB & HEADER ── */}
            <header className="bg-[#f8fafc] border-b border-slate-200/80 pt-10 pb-16 sm:pb-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    {/* Navigation Back */}
                    <div className="flex items-center justify-between gap-4 mb-6">
                        <Link 
                            href="/about"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-950 transition-colors group"
                        >
                            <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
                            <span>Tất cả bài viết</span>
                        </Link>

                        <button
                            type="button"
                            onClick={handleCopyLink}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                        >
                            {copied ? <Check size={13} className="text-emerald-600" /> : <Share2 size={13} />}
                            <span>{copied ? 'Đã sao chép link' : 'Chia sẻ'}</span>
                        </button>
                    </div>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="bg-slate-900 text-white px-3 py-1 text-[11px] font-extrabold rounded-full uppercase tracking-wider">
                            {CATEGORIES.find(c => c.value === article.category)?.label || article.category}
                        </span>
                        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-1"><Calendar size={13} /> {formatDate(article.createdAt)}</span>
                            <span className="flex items-center gap-1"><Eye size={13} /> {article.views.toLocaleString()} lượt đọc</span>
                            <span className="flex items-center gap-1"><Clock size={13} /> 5 phút đọc</span>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-950 leading-tight tracking-tight mb-4">
                        {article.title}
                    </h1>
                    
                    {/* Excerpt */}
                    <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
                        {article.excerpt}
                    </p>

                    {/* Author Signature */}
                    <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-200/80">
                        <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                            H
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-900">Ban biên tập HAVEN Journal</p>
                            <p className="text-[10.5px] text-slate-500">Chuyên gia phong cách & tư vấn thời trang</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── COVER THUMBNAIL (CINEMATIC) ── */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8 sm:-mt-12 relative z-10 mb-12">
                <div className="aspect-[16/9] sm:aspect-[21/9] relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-slate-200 bg-slate-100">
                    <Image
                        src={getValidThumbnail(article.thumbnail)}
                        alt={article.title}
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 900px"
                        className="object-cover"
                    />
                </div>
            </div>

            {/* ── BÀI VIẾT NỘI DUNG (RICH CONTENT) ── */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
                <div 
                    className="prose prose-slate prose-headings:font-bold prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-p:text-slate-700 prose-p:leading-relaxed prose-p:text-sm sm:prose-p:text-base prose-li:text-slate-700 prose-li:text-sm sm:prose-li:text-base prose-strong:text-slate-950 max-w-none"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                />

                {/* Footer Tags */}
                {article.tags && article.tags.length > 0 && (
                    <div className="mt-12 pt-6 border-t border-slate-200 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 mr-2 flex items-center gap-1">
                            <Tag size={13} /> Tags:
                        </span>
                        {article.tags.map(tag => (
                            <Link 
                                href={`/about`}
                                key={tag} 
                                className="text-xs text-slate-600 bg-slate-100 hover:bg-slate-900 hover:text-white px-3 py-1 rounded-lg transition-all font-medium"
                            >
                                #{tag}
                            </Link>
                        ))}
                    </div>
                )}

                {/* ── BÀI VIẾT LIÊN QUAN (RELATED ARTICLES) ── */}
                {relatedArticles.length > 0 && (
                    <div className="mt-16 pt-10 border-t border-slate-200">
                        <h3 className="text-base font-black text-slate-950 uppercase tracking-wide mb-6 flex items-center gap-2">
                            <Sparkles size={16} className="text-amber-500" />
                            Bài viết liên quan
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            {relatedArticles.map((rel) => (
                                <Link
                                    key={rel._id || rel.slug}
                                    href={`/about/${rel.slug}`}
                                    className="group block bg-slate-50 hover:bg-white rounded-2xl overflow-hidden border border-slate-200/80 hover:shadow-md transition-all"
                                >
                                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                                        <Image
                                            src={getValidThumbnail(rel.thumbnail)}
                                            alt={rel.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                            className="object-cover group-hover:scale-105 transition-transform"
                                        />
                                    </div>
                                    <div className="p-3.5">
                                        <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-[#1e40af] transition-colors mb-1">
                                            {rel.title}
                                        </h4>
                                        <p className="text-[10.5px] text-slate-400 font-medium">
                                            {formatDate(rel.createdAt)}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </article>
    );
}
