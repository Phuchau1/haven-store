'use client';
// ===== CATEGORY SECTION (NOW VERTICAL SLIDER BANNER) =====
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface Banner {
    id: string;
    title: string;
    image: string;
    video?: string;
    link: string;
    status: string;
}

const DEFAULT_SLIDES: Banner[] = [
    {
        id: 'default-middle-1',
        title: 'NEW JOURNAL / NEW COLLECTION',
        image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80',
        link: '/products',
        status: 'active'
    },
    {
        id: 'default-middle-2',
        title: 'ELEGANT STYLE / MINIMAL DESIGN',
        image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&auto=format&fit=crop&q=80',
        link: '/products',
        status: 'active'
    },
    {
        id: 'default-middle-3',
        title: 'SUMMER VIBE / URBAN COMFORT',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1600&auto=format&fit=crop&q=80',
        link: '/products',
        status: 'active'
    }
];

export default function CategorySection() {
    const [slides, setSlides] = useState<Banner[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [direction, setDirection] = useState<'up' | 'down'>('up'); // 'up' = bottom to top, 'down' = top to bottom
    const [isHovered, setIsHovered] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const fetchMiddleBanners = async () => {
            try {
                const res = await fetch('/api/banners?type=middle');
                const data = await res.json();
                if (data.success && data.banners && data.banners.length > 0) {
                    setSlides(data.banners);
                } else {
                    setSlides(DEFAULT_SLIDES);
                }
            } catch (error) {
                console.error('Error fetching middle banners:', error);
                setSlides(DEFAULT_SLIDES);
            } finally {
                setLoading(false);
            }
        };
        fetchMiddleBanners();
    }, []);

    // Autoplay logic
    useEffect(() => {
        if (loading || slides.length <= 1 || isHovered) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        timerRef.current = setInterval(() => {
            setDirection('up');
            setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
        }, 5000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [slides, loading, isHovered]);

    const handleNext = () => {
        setDirection('up');
        setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    };

    const handlePrev = () => {
        setDirection('down');
        setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
    };

    if (loading) {
        return (
            <section className="h-[450px] md:h-[600px] lg:h-[700px] w-full flex justify-center items-center bg-gray-50">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </section>
        );
    }

    const currentSlide = slides[currentIndex];

    // Variants for vertical slide transition from bottom to top
    const slideVariants: any = {
        enter: (dir: 'up' | 'down') => ({
            y: dir === 'up' ? '100%' : '-100%',
            opacity: 0,
            scale: 1.05
        }),
        center: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: {
                y: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.5 },
                scale: { duration: 0.8, ease: 'easeOut' }
            }
        },
        exit: (dir: 'up' | 'down') => ({
            y: dir === 'up' ? '-100%' : '100%',
            opacity: 0,
            scale: 0.95,
            transition: {
                y: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.5 },
                scale: { duration: 0.8, ease: 'easeIn' }
            }
        })
    };

    return (
        <section 
            className="relative w-full h-[450px] md:h-[650px] lg:h-[800px] overflow-hidden bg-black"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <AnimatePresence initial={false} custom={direction}>
                <motion.div
                    key={currentIndex}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="absolute inset-0 w-full h-full"
                >
                    {/* Background Image */}
                    <div className="relative w-full h-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                            src={currentSlide.image} 
                            alt={currentSlide.title} 
                            className="w-full h-full object-cover object-center select-none pointer-events-none"
                        />
                        <div className="absolute inset-0 bg-black/35" />
                    </div>

                    {/* Content Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 md:px-8">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="max-w-4xl space-y-4 md:space-y-6"
                        >
                            {/* Brand Header */}
                            <span className="text-white text-sm md:text-base tracking-[0.3em] font-light uppercase block">
                                HAVEN JOURNAL
                            </span>

                            {/* Main Title (Elegant serif style) */}
                            <h2 className="text-4xl md:text-6xl lg:text-7xl font-light text-white tracking-wide uppercase font-serif leading-tight">
                                {currentSlide.title.split('/').map((line, idx) => (
                                    <span key={idx} className="block first:font-normal first:tracking-wider">
                                        {line.trim()}
                                    </span>
                                ))}
                            </h2>

                            {/* Subtitle / Button */}
                            <div className="pt-6">
                                <Link 
                                    href={currentSlide.link}
                                    className="inline-block px-8 py-3.5 border border-white text-white text-xs md:text-sm font-semibold tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all duration-300"
                                >
                                    Khám phá bộ sưu tập
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Vertical Navigation Indicators */}
            <div className="absolute right-6 md:right-10 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-3">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            setDirection(idx > currentIndex ? 'up' : 'down');
                            setCurrentIndex(idx);
                        }}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                            idx === currentIndex 
                                ? 'bg-white scale-125 shadow-lg' 
                                : 'bg-white/40 hover:bg-white/70'
                        }`}
                        aria-label={`Slide ${idx + 1}`}
                    />
                ))}
            </div>

            {/* Vertical Arrow Buttons (Top Left / Right) */}
            <div className="absolute left-6 md:left-10 bottom-6 md:bottom-10 z-20 flex flex-col gap-2">
                <button
                    onClick={handlePrev}
                    className="p-2.5 rounded-full bg-black/35 hover:bg-white hover:text-black text-white border border-white/20 transition-all duration-300 backdrop-blur-md"
                    aria-label="Previous Slide"
                >
                    <ChevronUp size={18} />
                </button>
                <button
                    onClick={handleNext}
                    className="p-2.5 rounded-full bg-black/35 hover:bg-white hover:text-black text-white border border-white/20 transition-all duration-300 backdrop-blur-md"
                    aria-label="Next Slide"
                >
                    <ChevronDown size={18} />
                </button>
            </div>

            {/* Slide Index Counter */}
            <div className="absolute right-6 md:right-10 bottom-6 md:bottom-10 z-20 text-white font-mono text-sm tracking-widest select-none font-light">
                <span className="text-white font-bold">{(currentIndex + 1).toString().padStart(2, '0')}</span>
                <span className="text-white/40"> / </span>
                <span>{slides.length.toString().padStart(2, '0')}</span>
            </div>
        </section>
    );
}
