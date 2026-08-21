'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
    const [settings, setSettings] = useState({
        heroHeading:  'HAVEN STUDIO\nBỘ SƯU TẬP 2026',
        heroSubtitle: 'Định hình phong cách tối giản và thanh lịch. Những thiết kế thủ công được tuyển chọn kỹ lưỡng cho cuộc sống hiện đại.',
        heroVideoUrl: 'https://videos.pexels.com/video-files/3753716/3753716-uhd_2560_1440_25fps.mp4',
        heroImage:    'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920&h=1080&fit=crop',
        bannerLink:   '/products'
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resSettings = await fetch('/api/settings');
                const dataSettings = await resSettings.json();
                
                const newSettings = { ...settings };
                if (dataSettings.success && dataSettings.settings) {
                    if (dataSettings.settings.heroSubtitle) newSettings.heroSubtitle = dataSettings.settings.heroSubtitle;
                    if (dataSettings.settings.heroVideoUrl) newSettings.heroVideoUrl = dataSettings.settings.heroVideoUrl;
                }

                const resBanners = await fetch('/api/banners?type=hero');
                const dataBanners = await resBanners.json();
                
                if (dataBanners.success && dataBanners.banners && dataBanners.banners.length > 0) {
                    const banner = dataBanners.banners[0];
                    if (banner.title) newSettings.heroHeading = banner.title;
                    if (banner.image) newSettings.heroImage = banner.image;
                    if (banner.video) newSettings.heroVideoUrl = banner.video;
                    if (banner.link) newSettings.bannerLink = banner.link;
                }

                setSettings(newSettings);
            } catch (err) {
                console.error("Error fetching hero data", err);
            }
        };
        fetchData();
    }, []);

    const headingLines = settings.heroHeading.split('\n');

    return (
        <section className="relative h-[560px] sm:h-[640px] lg:h-[760px] overflow-hidden bg-[#09090b]">
            {/* Background Media */}
            <div className="absolute inset-0">
                {settings.heroVideoUrl ? (
                    <video
                        autoPlay muted loop playsInline
                        poster={settings.heroImage}
                        className="w-full h-full object-cover scale-105"
                        style={{ opacity: 0.55 }}
                    >
                        <source src={settings.heroVideoUrl} type="video/mp4" />
                    </video>
                ) : (
                    <div
                        className="w-full h-full bg-cover bg-center scale-105"
                        style={{ backgroundImage: `url(${settings.heroImage})`, opacity: 0.65 }}
                    />
                )}
                {/* Enterprise Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
            </div>

            {/* Content Container */}
            <div className="relative h-full container-torano flex flex-col justify-end pb-16 lg:pb-24 z-10">
                <div className="max-w-2xl">
                    {/* Season Tag */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-white/20 bg-white/10 backdrop-blur-md mb-5"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span className="text-[11px] font-bold text-white/90 uppercase tracking-[0.25em]">
                            EDITORIAL LOOKBOOK 2026
                        </span>
                    </motion.div>

                    {/* Main Heading */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="text-4xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-[1.08]"
                    >
                        {headingLines.map((line, idx) => (
                            <span key={idx} className="block">
                                {line}
                            </span>
                        ))}
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="mt-5 text-sm sm:text-base text-gray-300/90 leading-relaxed font-light max-w-lg"
                    >
                        {settings.heroSubtitle}
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                        className="mt-8 flex flex-wrap items-center gap-4"
                    >
                        <Link
                            href={settings.bannerLink || '/products'}
                            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-white text-black text-xs font-bold uppercase tracking-wider rounded-none hover:bg-neutral-200 transition-all duration-300 group shadow-lg"
                        >
                            <span>Khám phá bộ sưu tập</span>
                            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                        </Link>

                        <Link
                            href="/products?category=ao-nam"
                            className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold uppercase tracking-wider rounded-none border border-white/25 backdrop-blur-sm transition-all duration-300"
                        >
                            <span>Nam</span>
                        </Link>

                        <Link
                            href="/products?category=nu"
                            className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold uppercase tracking-wider rounded-none border border-white/25 backdrop-blur-sm transition-all duration-300"
                        >
                            <span>Nữ</span>
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Bottom Subtle Indicator Bar */}
            <div className="absolute bottom-6 right-4 sm:right-8 z-10 hidden sm:flex items-center gap-6 text-[11px] text-white/60 tracking-widest uppercase font-medium">
                <span>01 / 03</span>
                <span className="w-12 h-px bg-white/30" />
                <span>HAVEN STUDIO</span>
            </div>
        </section>
    );
}
