'use client';
// ===== HAVEN JOURNAL - TRANG TIN TỨC & XU HƯỚNG THỜI TRANG =====
import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, Eye, Tag, Loader2, ChevronRight, Search, 
    TrendingUp, Sparkles, Clock, ArrowRight, BookOpen, 
    Send, CheckCircle2, Flame
} from 'lucide-react';

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
    { value: 'xu-huong', label: 'Xu hướng 2026' },
    { value: 'tips', label: 'Tips & Tricks' },
    { value: 'tin-tuc', label: 'Tin tức HAVEN' },
    { value: 'phong-cach', label: 'Phong cách sống' }
];

const FALLBACK_THUMBNAILS = [
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&q=80',
    'https://images.unsplash.com/photo-1594938298603-c8148c4b9d42?w=900&q=80',
    'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=900&q=80',
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&q=80',
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=900&q=80',
];

// Helper để đảm bảo ảnh luôn hiển thị đẹp, không bị lỗi text hay đường dẫn hỏng
function getValidThumbnail(thumb: string, index: number = 0): string {
    if (!thumb) return FALLBACK_THUMBNAILS[index % FALLBACK_THUMBNAILS.length];
    if (thumb.startsWith('http://') || thumb.startsWith('https://') || thumb.startsWith('/')) {
        return thumb;
    }
    return FALLBACK_THUMBNAILS[index % FALLBACK_THUMBNAILS.length];
}

export default function AboutPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCat, setActiveCat] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchArticles = async () => {
            setLoading(true);
            try {
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
        if (!dateString) return 'Mới cập nhật';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    // Filter theo tìm kiếm
    const filteredArticles = useMemo(() => {
        if (!searchQuery.trim()) return articles;
        const q = searchQuery.toLowerCase();
        return articles.filter(a => 
            a.title.toLowerCase().includes(q) || 
            a.excerpt?.toLowerCase().includes(q) ||
            a.tags?.some(t => t.toLowerCase().includes(q))
        );
    }, [articles, searchQuery]);

    // Bài viết nổi bật (Featured Cover Story)
    const featuredArticle = useMemo(() => {
        if (filteredArticles.length === 0) return null;
        // Ưu tiên bài có lượt xem cao nhất hoặc bài đầu tiên
        return [...filteredArticles].sort((a, b) => (b.views || 0) - (a.views || 0))[0];
    }, [filteredArticles]);

    // Các bài viết còn lại trong danh sách chính
    const remainingArticles = useMemo(() => {
        if (!featuredArticle) return filteredArticles;
        return filteredArticles.filter(a => a._id !== featuredArticle._id);
    }, [filteredArticles, featuredArticle]);

    // Top bài viết đọc nhiều nhất (Trending Sidebar)
    const trendingArticles = useMemo(() => {
        return [...articles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 4);
    }, [articles]);

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20">
            {/* ── HERO BANNER: HAVEN JOURNAL ── */}
            <div className="bg-white border-b border-slate-200/80 pt-12 pb-14 sm:pt-16 sm:pb-18">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2.5">
                                <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                                    <Sparkles size={11} className="text-amber-400" />
                                    HAVEN JOURNAL
                                </span>
                                <span className="text-xs text-slate-400 font-medium">
                                    Cập nhật hàng tuần
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                                Tin Tức & Xu Hướng Thời Trang
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-2 font-medium leading-relaxed">
                                Khám phá những làn sóng phong cách mới nhất, cẩm nang phối đồ cao cấp và những câu chuyện sáng tạo từ HAVEN Store.
                            </p>
                        </div>

                        {/* Ô tìm kiếm bài viết */}
                        <div className="w-full md:w-80 relative flex-shrink-0">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm xu hướng, mẹo phối đồ..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* ── BỘ LỌC DANH MỤC (TABS) ── */}
                    <div className="flex items-center gap-2 overflow-x-auto pt-8 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
                        {CATEGORIES.map(cat => {
                            const isActive = activeCat === cat.value;
                            return (
                                <button
                                    key={cat.value}
                                    onClick={() => setActiveCat(cat.value)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                                        isActive
                                            ? 'bg-slate-900 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── NỘI DUNG CHÍNH ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-28 text-slate-400">
                        <Loader2 className="animate-spin w-8 h-8 mb-3 text-slate-700" />
                        <p className="text-xs font-medium">Đang cập nhật bài viết mới nhất...</p>
                    </div>
                ) : filteredArticles.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 p-8 max-w-lg mx-auto shadow-xs">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
                            <BookOpen size={28} />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">Không tìm thấy bài viết</h3>
                        <p className="text-xs text-slate-500 mt-1.5">
                            Thử tìm kiếm với từ khóa khác hoặc chọn danh mục "Tất cả".
                        </p>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-800 transition-colors"
                            >
                                Xóa tìm kiếm
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-10">
                        {/* ── BÀI VIẾT NỔI BẬT (FEATURED COVER STORY) ── */}
                        {featuredArticle && !searchQuery && activeCat === 'all' && (
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                <Link
                                    href={`/about/${featuredArticle.slug}`}
                                    className="group block bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300"
                                >
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">
                                        {/* Thumbnail Left */}
                                        <div className="lg:col-span-7 relative aspect-[16/10] lg:aspect-auto w-full min-h-[280px] sm:min-h-[380px] overflow-hidden bg-slate-100">
                                            <Image
                                                src={getValidThumbnail(featuredArticle.thumbnail, 0)}
                                                alt={featuredArticle.title}
                                                fill
                                                priority
                                                sizes="(max-width: 1024px) 100vw, 60vw"
                                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                            {/* Tag Badge on Image */}
                                            <div className="absolute top-4 left-4 flex items-center gap-2">
                                                <span className="bg-slate-950/90 backdrop-blur-md text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1.5">
                                                    <Flame size={12} className="text-amber-400" />
                                                    BÀI VIẾT TIÊU ĐIỂM
                                                </span>
                                            </div>
                                        </div>

                                        {/* Editorial Content Right */}
                                        <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-white">
                                            <div>
                                                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mb-3">
                                                    <span className="text-[#1e40af] font-bold uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200/80">
                                                        {CATEGORIES.find(c => c.value === featuredArticle.category)?.label || featuredArticle.category}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={13} /> {formatDate(featuredArticle.createdAt)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Eye size={13} /> {featuredArticle.views.toLocaleString()} lượt đọc
                                                    </span>
                                                </div>

                                                <h2 className="text-lg sm:text-2xl font-black text-slate-950 tracking-tight leading-snug group-hover:text-[#1e40af] transition-colors mb-3">
                                                    {featuredArticle.title}
                                                </h2>

                                                <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed line-clamp-3 mb-6">
                                                    {featuredArticle.excerpt}
                                                </p>
                                            </div>

                                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-700">Tác giả: HAVEN Editorial</span>
                                                </div>
                                                <span className="text-xs sm:text-sm font-bold text-slate-950 flex items-center gap-1.5 group-hover:translate-x-1.5 transition-transform text-[#1e40af]">
                                                    Đọc bài viết <ArrowRight size={16} />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        )}

                        {/* ── PHẦN CHÍNH: DANH SÁCH BÀI VIẾT & SIDEBAR XU HƯỚNG ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            {/* ── CỘT BÀI VIẾT CHÍNH (8 PHẦN) ── */}
                            <div className="lg:col-span-8 space-y-6">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                                        <BookOpen size={16} />
                                        Tất cả bài viết ({filteredArticles.length})
                                    </h3>
                                    <span className="text-xs text-slate-400 font-medium">
                                        Mới nhất
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {(activeCat === 'all' && !searchQuery ? remainingArticles : filteredArticles).map((article, idx) => (
                                        <Link 
                                            href={`/about/${article.slug}`} 
                                            key={article._id || idx}
                                            className="group bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col"
                                        >
                                            {/* Thumbnail Aspect 16:10 */}
                                            <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                                                <Image
                                                    src={getValidThumbnail(article.thumbnail, idx + 1)}
                                                    alt={article.title}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                                {/* Category Badge */}
                                                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-900 shadow-xs border border-slate-200/80 uppercase tracking-wider">
                                                    {CATEGORIES.find(c => c.value === article.category)?.label || article.category}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-4 sm:p-5 flex flex-col flex-1">
                                                <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-2 font-medium">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={12} /> {formatDate(article.createdAt)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Eye size={12} /> {article.views.toLocaleString()}
                                                    </span>
                                                </div>
                                                
                                                <h4 className="text-sm font-bold text-slate-900 mb-2 line-clamp-2 leading-snug group-hover:text-[#1e40af] transition-colors">
                                                    {article.title}
                                                </h4>
                                                
                                                <p className="text-xs text-slate-500 font-normal line-clamp-2 mb-4 flex-1 leading-relaxed">
                                                    {article.excerpt}
                                                </p>

                                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 text-xs">
                                                    <div className="flex items-center gap-1.5 max-w-[65%] overflow-hidden">
                                                        {article.tags?.slice(0, 2).map(tag => (
                                                            <span key={tag} className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium truncate">
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1 group-hover:translate-x-1 transition-transform group-hover:text-[#1e40af]">
                                                        Đọc tiếp <ChevronRight size={14} />
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* ── CỘT PHẢI: TRENDING & NEWSLETTER (4 PHẦN) ── */}
                            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
                                {/* 🔥 Top bài viết đọc nhiều nhất */}
                                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
                                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 pb-3 mb-4 border-b border-slate-100 flex items-center gap-2">
                                        <TrendingUp size={15} className="text-amber-500" />
                                        Đọc nhiều nhất
                                    </h4>

                                    <div className="space-y-4">
                                        {trendingArticles.map((article, idx) => (
                                            <Link
                                                key={article._id || idx}
                                                href={`/about/${article.slug}`}
                                                className="flex items-center gap-3.5 group"
                                            >
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                                                    idx === 0 ? 'bg-amber-400 text-black' : idx === 1 ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {idx + 1}
                                                </span>

                                                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                                    <Image
                                                        src={getValidThumbnail(article.thumbnail, idx + 2)}
                                                        alt={article.title}
                                                        fill
                                                        sizes="56px"
                                                        className="object-cover group-hover:scale-105 transition-transform"
                                                    />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h5 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-[#1e40af] transition-colors">
                                                        {article.title}
                                                    </h5>
                                                    <p className="text-[10.5px] text-slate-400 font-medium mt-1 flex items-center gap-2">
                                                        <span>{formatDate(article.createdAt)}</span>
                                                        <span>·</span>
                                                        <span>{article.views.toLocaleString()} xem</span>
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                {/* 🏷️ Chủ đề thịnh hành (Tag Cloud) */}
                                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
                                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 pb-3 mb-3.5 border-b border-slate-100 flex items-center gap-2">
                                        <Tag size={14} className="text-slate-600" />
                                        Chủ đề quan tâm
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {['#XuHuong2026', '#TipsPhoiDo', '#Minimalism', '#CongSoThanhLich', '#LinenSummer', '#AoPoloNam', '#ThuDong2026', '#Streetwear'].map(tag => (
                                            <button
                                                key={tag}
                                                onClick={() => setSearchQuery(tag.replace('#', ''))}
                                                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-600 text-xs font-semibold rounded-lg border border-slate-200/80 transition-all cursor-pointer"
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 📞 Tư vấn & CSKH HAVEN */}
                                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
                                    <div className="relative z-10">
                                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                                            Dịch vụ khách hàng
                                        </span>
                                        <h4 className="text-base font-black text-white tracking-tight mb-2">
                                            Tư vấn phong cách 24/7
                                        </h4>
                                        <p className="text-xs text-slate-300 font-normal mb-4 leading-relaxed">
                                            Đội ngũ stylist của HAVEN luôn sẵn sàng hỗ trợ bạn lựa chọn trang phục phù hợp nhất.
                                        </p>
                                        <Link
                                            href="/contact"
                                            className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-black font-extrabold rounded-xl text-xs tracking-wider uppercase transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                                        >
                                            Liên hệ ngay
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
