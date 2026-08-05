'use client';
// ===== CATEGORY SECTION (NOW VERTICAL SLIDER BANNER) =====
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

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
    const [isMobile, setIsMobile] = useState(false);
    
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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

    // Autoplay logic - Only auto slide on Mobile, Laptop/Desktop uses interactive scroll
    useEffect(() => {
        if (loading || slides.length <= 1) return;

        if (!isMobile || isHovered) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        timerRef.current = setInterval(() => {
            setDirection('up');
            setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
        }, 5000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [slides, loading, isMobile, isHovered]);

    const handleNext = () => {
        setDirection('up');
        setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    };

    const handlePrev = () => {
        setDirection('down');
        setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (wheelTimeoutRef.current) return;
        
        if (e.deltaY > 0) {
            // Scroll down -> slide up (Next)
            handleNext();
        } else if (e.deltaY < 0) {
            // Scroll up -> slide down (Prev)
            handlePrev();
        }

        wheelTimeoutRef.current = setTimeout(() => {
            wheelTimeoutRef.current = null;
        }, 600); // 600ms transition lock
    };

    if (loading) {
        return (
            <section className="py-6 px-4 container-torano mx-auto">
                <div className="h-[350px] md:h-[500px] lg:h-[600px] w-full flex justify-center items-center bg-slate-50 rounded-[24px] border border-slate-100">
                    <Loader2 className="animate-spin text-slate-400" size={32} />
                </div>
            </section>
        );
    }

    const currentSlide = slides[currentIndex];

    // Variants for vertical slide transition
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
        <section className="py-6 px-4 container-torano mx-auto">
            <div 
                className="relative w-full h-[350px] md:h-[500px] lg:h-[600px] overflow-hidden bg-black rounded-[24px] shadow-lg"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onWheel={(e) => {
                    if (!isMobile) {
                        handleWheel(e);
                    }
                }}
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

                        {/* Content Overlay - Bottom-left aligned to avoid overlapping visual elements and cursive text */}
                        <div className="absolute inset-0 flex flex-col items-start justify-end text-left px-8 md:px-16 lg:px-24 pb-12 md:pb-16 lg:pb-20">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.6 }}
                                className="max-w-md md:max-w-lg lg:max-w-2xl space-y-4 md:space-y-6"
                            >
                                {/* Brand Header */}
                                <span 
                                    className="text-white text-xs md:text-sm tracking-[0.3em] font-light uppercase block"
                                    style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
                                >
                                    HAVEN JOURNAL
                                </span>

                                {/* Button */}
                                <div className="pt-4 md:pt-6">
                                    <Link 
                                        href={currentSlide.link}
                                        className="inline-block px-6 py-3 md:px-8 md:py-3.5 border border-white text-white text-[10px] md:text-xs font-semibold tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all duration-300 shadow-md"
                                        style={{ textShadow: 'none' }}
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
                            className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all duration-300 ${
                                idx === currentIndex 
                                    ? 'bg-white scale-125 shadow-lg' 
                                    : 'bg-white/40 hover:bg-white/70'
                            }`}
                            aria-label={`Slide ${idx + 1}`}
                        />
                    ))}
                </div>

                {/* Vertical Arrow Buttons */}
                <div className="absolute left-6 md:left-10 bottom-6 md:bottom-10 z-20 flex flex-col gap-2">
                    <button
                        onClick={handlePrev}
                        className="p-2 md:p-2.5 rounded-full bg-black/35 hover:bg-white hover:text-black text-white border border-white/20 transition-all duration-300 backdrop-blur-md"
                        aria-label="Previous Slide"
                    >
                        <ChevronUp size={16} />
                    </button>
                    <button
                        onClick={handleNext}
                        className="p-2 md:p-2.5 rounded-full bg-black/35 hover:bg-white hover:text-black text-white border border-white/20 transition-all duration-300 backdrop-blur-md"
                        aria-label="Next Slide"
                    >
                        <ChevronDown size={16} />
                    </button>
                </div>

                {/* Slide Index Counter */}
                <div className="absolute right-6 md:right-10 bottom-6 md:bottom-10 z-20 text-white font-mono text-xs md:text-sm tracking-widest select-none font-light">
                    <span className="text-white font-bold">{(currentIndex + 1).toString().padStart(2, '0')}</span>
                    <span className="text-white/40"> / </span>
                    <span>{slides.length.toString().padStart(2, '0')}</span>
                </div>
            </div>
        </section>
    );
}
