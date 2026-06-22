'use client';
/**
 * Hero.tsx — Fashion Store Landing Hero
 *
 * Cách hoạt động:
 * ─────────────────────────────────────────────────────────
 * 1. VIDEO / ẢNH nền: phát tự động, opacity 55%
 * 2. GRADIENT OVERLAY: phủ lên trên video, tạo không khí
 *    và giúp chữ dễ đọc. Gradient thay đổi theo THEME màu.
 * 3. BỘ CHỌN MÀU (Color Mood):
 *    - Mỗi theme là 1 tông màu khác nhau (vàng, xanh, đỏ hồng, trắng...)
 *    - Khi click vào chấm màu → gradient overlay + các accent
 *      (sparkle icon, gạch trang trí, đốm sáng) đổi màu tức thì
 *    - Dùng CSS transition 700ms → chuyển màu mượt mà
 * 4. TYPOGRAPHY: Inter 900 Black cho cả 2 dòng tiêu đề
 * ─────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

// ── Tông màu cố định Premium ─────────────────────────────────
const PREMIUM_THEME = {
    overlayLeft: 'rgba(0,0,0,0.60)',
    overlayMid:  'rgba(0,0,0,0.20)',
    overlayBottom: 'rgba(0,0,0,0.50)',
    accent: '#C9A227', // Gold
};

export default function Hero() {
    const [settings, setSettings] = useState({
        heroHeading:  'ĐỊNH NGHĨA\nLẠI PHONG CÁCH',
        heroSubtitle: 'Mỗi bộ trang phục là một tuyên ngôn.\nMỗi lần diện đồ là một câu chuyện riêng của bạn.',
        heroVideoUrl: 'https://videos.pexels.com/video-files/3753716/3753716-uhd_2560_1440_25fps.mp4',
        heroImage:    'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920&h=1080&fit=crop',
        bannerLink:   '/products'
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Settings
                const resSettings  = await fetch('/api/settings');
                const dataSettings = await resSettings.json();
                
                const newSettings = { ...settings };
                
                if (dataSettings.success && dataSettings.settings) {
                    newSettings.heroSubtitle = dataSettings.settings.heroSubtitle || newSettings.heroSubtitle;
                    newSettings.heroVideoUrl = dataSettings.settings.heroVideoUrl || newSettings.heroVideoUrl;
                }

                // Fetch Banners
                const resBanners = await fetch('/api/banners');
                const dataBanners = await resBanners.json();
                
                if (dataBanners.success && dataBanners.banners && dataBanners.banners.length > 0) {
                    const banner = dataBanners.banners[0];
                    newSettings.heroHeading = banner.title;
                    newSettings.heroImage = banner.image;
                    if (banner.video) {
                        newSettings.heroVideoUrl = banner.video;
                    }
                    newSettings.bannerLink = banner.link;
                }

                setSettings(newSettings);
            } catch (err) {
                console.error("Error fetching hero data", err);
            }
        };
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const headingLines = settings.heroHeading.split('\n');
    const t = PREMIUM_THEME; // shorthand

    return (
        <section className="relative h-[500px] lg:h-[720px] overflow-hidden bg-black">

            {/* ── Background Video / Image ── */}
            <div className="absolute inset-0">
                {settings.heroVideoUrl ? (
                    <video
                        autoPlay muted loop playsInline
                        poster={settings.heroImage}
                        className="w-full h-full object-cover"
                        style={{ opacity: 0.60 }}
                    >
                        <source src={settings.heroVideoUrl} type="video/mp4" />
                    </video>
                ) : (
                    <div
                        className="w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${settings.heroImage})`, opacity: 0.85 }}
                    />
                )}

                {/*
                  GRADIENT OVERLAY — lớp màu phủ lên video.
                  Dùng inline style để transition màu mượt theo theme.
                  - from-left: tối đậm → che phần nội dung, tạo độ tương phản cho chữ
                  - to-right: trong suốt → video nhìn thấy rõ bên phải
                  - bottom: tối đậm → tạo viền dưới, giúp footer/scroll indicator nổi bật
                */}
                <div
                    className="absolute inset-0 transition-all duration-700"
                    style={{
                        background: `linear-gradient(to right, ${t.overlayLeft} 0%, ${t.overlayMid} 55%, transparent 100%)`
                    }}
                />
                <div
                    className="absolute inset-0 transition-all duration-700"
                    style={{
                        background: `linear-gradient(to top, ${t.overlayBottom} 0%, transparent 50%, rgba(0,0,0,0.25) 100%)`
                    }}
                />
            </div>

            {/* ── Main Content ── */}
            <div className="relative z-10 flex flex-col justify-center h-full px-6 sm:px-12 lg:px-24 xl:px-32">

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-8 flex items-center gap-3"
                >
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/15"
                         style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(12px)' }}>
                        {/* Accent icon đổi màu theo theme */}
                        <Sparkles size={12} style={{ color: t.accent, transition: 'color 0.7s' }} />
                        <span className="text-white/75 text-[10px] uppercase"
                              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.3em' }}>
                            Bộ Sưu Tập Mới · 2027
                        </span>
                    </div>
                    <div className="h-px w-12 bg-white/20" />
                </motion.div>

                {/* ── Heading — cả 2 dòng cùng phông Inter 900 ── */}
                <div className="overflow-visible">
                    {headingLines.map((line, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 60 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.9, delay: 0.35 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <h1
                                className="font-black text-white leading-[1] tracking-[-0.02em] uppercase"
                                style={{
                                    fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif",
                                    fontWeight: 800,
                                    fontSize: 'clamp(2.8rem, 6vw, 6rem)',
                                }}
                            >
                                {line}
                            </h1>
                        </motion.div>
                    ))}
                </div>

                {/* Decorative divider — accent đổi màu */}
                <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.75 }}
                    className="mt-7 mb-5 flex items-center gap-4"
                    style={{ transformOrigin: 'left' }}
                >
                    <div className="h-px w-16 bg-white/35" />
                    {/* Accent dot */}
                    <div
                        className="w-1.5 h-1.5 rounded-full transition-all duration-700"
                        style={{ backgroundColor: t.accent }}
                    />
                    <div className="h-px w-6 bg-white/15" />
                </motion.div>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.85 }}
                    className="text-white/85 max-w-md leading-[1.7] whitespace-pre-line mt-1"
                    style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif", fontSize: 'clamp(0.9rem, 1.1vw, 1.05rem)', fontWeight: 400 }}
                >
                    {settings.heroSubtitle}
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 1.05 }}
                    className="flex flex-col sm:flex-row items-start gap-3 mt-8"
                >
                    {/* Primary CTA: MUA NGAY */}
                    <Link href={settings.bannerLink || "/products"}>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative flex items-center justify-center gap-2.5 px-8 py-4 bg-[#C9A227] text-white rounded-full overflow-hidden transition-all duration-300 shadow-md hover:shadow-lg"
                            style={{
                                fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif",
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                letterSpacing: '0.05em',
                            }}
                        >
                            <span className="uppercase relative z-10">Mua Ngay</span>
                            <ArrowRight size={16} className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                            <div className="absolute inset-0 bg-black/10 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                        </motion.button>
                    </Link>

                    {/* Secondary CTA: XEM BỘ SƯU TẬP */}
                    <Link href={settings.bannerLink || "/products"}>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group flex items-center justify-center gap-2.5 px-8 py-4 rounded-full border border-white text-white hover:bg-white hover:text-black transition-all duration-300"
                            style={{
                                fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif",
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                letterSpacing: '0.05em',
                            }}
                        >
                            <span className="uppercase">Xem Bộ Sưu Tập</span>
                        </motion.button>
                    </Link>
                </motion.div>

                {/* Stats row */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1.3 }}
                    className="flex items-center gap-8 mt-12"
                >
                    {[
                        { value: '500+',  label: 'Mẫu độc quyền' },
                        { value: '12K+',  label: 'Khách hàng tin yêu' },
                        { value: '4.9★',  label: 'Đánh giá trung bình' },
                    ].map((stat, i) => (
                        <div key={i} className="flex flex-col">
                            <span className="text-white font-bold transition-colors duration-700"
                                  style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(1rem, 1.6vw, 1.3rem)',
                                           color: i === 0 ? t.accent : 'white' }}>
                                {stat.value}
                            </span>
                            <span className="text-white/40 uppercase"
                                  style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.6rem', letterSpacing: '0.18em' }}>
                                {stat.label}
                            </span>
                        </div>
                    ))}
                </motion.div>
            </div>


            {/* ── Scroll indicator ── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex flex-col items-center gap-2"
                >
                    <span className="text-white/35 uppercase"
                          style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.6rem', letterSpacing: '0.35em' }}>
                        Cuộn xuống
                    </span>
                    <div className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent" />
                </motion.div>
            </motion.div>

            {/* ── Side label ── */}
            <div className="absolute top-1/2 left-6 -translate-y-1/2 hidden lg:flex flex-col items-center gap-3">
                <div className="w-px h-12 bg-white/15" />
                <span className="text-white/25 uppercase rotate-[-90deg] whitespace-nowrap"
                      style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.58rem', letterSpacing: '0.35em' }}>
                    HAVEN STORE · Fashion 2027
                </span>
                <div className="w-px h-12 bg-white/15" />
            </div>

            {/* ── Right accent line ── */}
            <div className="absolute top-1/2 right-20 -translate-y-1/2 hidden xl:flex flex-col items-center gap-2">
                <div className="w-px h-20 bg-white/10" />
                <div className="w-1 h-1 rounded-full transition-all duration-700"
                     style={{ backgroundColor: `${t.accent}99` }} />
                <div className="w-px h-20 bg-white/10" />
            </div>
        </section>
    );
}
