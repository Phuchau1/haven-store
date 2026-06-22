'use client';
// ===== SIDE-PANEL IMAGE ZOOM =====
// Hover vào ảnh trái → panel FIXED đè lên toàn bộ cột phải (kể cả nút)
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageZoomProps {
    images: string[];
    alt: string;
    badge?: string;
    discount?: number;
    zoomLevel?: number;
    selectedIndex?: number;
    onSelectIndex?: (i: number) => void;
}

export default function ImageZoom({
    images, alt, badge, discount = 0, zoomLevel = 3,
    selectedIndex: externalIndex, onSelectIndex
}: ImageZoomProps) {
    const [internalIndex, setInternalIndex] = useState(0);
    const selectedIndex = externalIndex !== undefined ? externalIndex : internalIndex;
    const setSelectedIndex = (i: number) => {
        setInternalIndex(i);
        onSelectIndex?.(i);
    };

    // Đồng bộ khi chọn màu từ bên ngoài
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (externalIndex !== undefined) setInternalIndex(externalIndex);
    }, [externalIndex]);

    const [isHovering, setIsHovering] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
    const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
    const [panelRect, setPanelRect] = useState({ top: 0, left: 0, width: 0, height: 0 });

    const containerRef = useRef<HTMLDivElement>(null);
    const LENS_W = 110;
    const LENS_H = 110;

    const updatePanelRect = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const GAP = 16;
        setPanelRect({
            top: rect.top,
            left: rect.right + GAP,
            width: Math.max(280, window.innerWidth - rect.right - GAP - 20),
            height: rect.height,
        });
    }, []);

    useEffect(() => {
        updatePanelRect();
        window.addEventListener('resize', updatePanelRect);
        window.addEventListener('scroll', updatePanelRect, { passive: true });
        return () => {
            window.removeEventListener('resize', updatePanelRect);
            window.removeEventListener('scroll', updatePanelRect);
        };
    }, [updatePanelRect]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const rawX = e.clientX - rect.left;
        const rawY = e.clientY - rect.top;
        const cx = Math.max(LENS_W / 2, Math.min(rect.width - LENS_W / 2, rawX));
        const cy = Math.max(LENS_H / 2, Math.min(rect.height - LENS_H / 2, rawY));
        setLensPos({ x: cx - LENS_W / 2, y: cy - LENS_H / 2 });
        setMousePos({ x: (cx / rect.width) * 100, y: (cy / rect.height) * 100 });
        updatePanelRect();
    }, [updatePanelRect]);

    const prev = () => setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
    const next = () => setSelectedIndex((selectedIndex + 1) % images.length);
    const currentSrc = images[selectedIndex] || '';

    return (
        <div className="flex gap-3 relative">
            {/* Thumbnails dọc */}
            {images.length > 1 && (
                <div className="hidden md:flex flex-col gap-2 shrink-0">
                    {images.map((img, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedIndex(i)}
                            className={`relative w-16 h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                                i === selectedIndex
                                    ? 'border-black shadow-md'
                                    : 'border-gray-200 hover:border-gray-400'
                            }`}
                        >
                            <Image src={img} alt={`${alt} ${i + 1}`} fill className="object-cover" sizes="64px" />
                        </button>
                    ))}
                </div>
            )}

            {/* Ảnh chính */}
            <div
                ref={containerRef}
                className={`relative flex-1 aspect-[3/4] rounded-2xl overflow-hidden bg-gray-50 select-none shadow-[0_8px_30px_rgba(0,0,0,0.08)] ${
                    isHovering ? 'cursor-crosshair' : 'cursor-zoom-in'
                }`}
                onMouseEnter={() => { setIsHovering(true); updatePanelRect(); }}
                onMouseLeave={() => setIsHovering(false)}
                onMouseMove={handleMouseMove}
            >
                <Image
                    src={currentSrc}
                    alt={alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 45vw"
                    priority
                    draggable={false}
                />

                {/* Badge */}
                {badge ? (
                    <div className="absolute top-3 left-3 z-10">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full shadow ${
                            badge === 'Sale' ? 'bg-red-500 text-white' :
                            badge === 'Mới' || badge === 'NEW' ? 'bg-emerald-500 text-white' :
                            badge === 'Hot' || badge === 'HOT' ? 'bg-orange-500 text-white' :
                            'bg-black text-white'
                        }`}>
                            {badge}{badge === 'Sale' && discount > 0 ? ` -${discount}%` : ''}
                        </span>
                    </div>
                ) : discount > 0 ? (
                    <div className="absolute top-3 left-3 z-10">
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-500 text-white shadow">
                            -{discount}%
                        </span>
                    </div>
                ) : null}

                {/* Lens box */}
                <AnimatePresence>
                    {isHovering && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.1 }}
                            className="absolute z-20 pointer-events-none border-2 border-white"
                            style={{
                                width: LENS_W, height: LENS_H,
                                left: lensPos.x, top: lensPos.y,
                                background: 'rgba(255,255,255,0.15)',
                                boxShadow: '0 0 0 1px rgba(0,0,0,0.18)',
                            }}
                        />
                    )}
                </AnimatePresence>

                {/* Hint */}
                <AnimatePresence>
                    {!isHovering && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-black/55 backdrop-blur-md text-white rounded-full text-[11px] font-medium whitespace-nowrap"
                        >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                                <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                            </svg>
                            Di chuột để phóng to
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mobile arrows */}
                {images.length > 1 && (
                    <>
                        <button onClick={prev} className="md:hidden absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center">
                            <ChevronLeft size={18} />
                        </button>
                        <button onClick={next} className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center">
                            <ChevronRight size={18} />
                        </button>
                    </>
                )}
            </div>

            {/* ── PANEL ZOOM — fixed, đè lên toàn bộ cột phải kể cả nút ── */}
            <AnimatePresence>
                {isHovering && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="hidden lg:block fixed z-[9999] pointer-events-none overflow-hidden rounded-2xl border border-gray-100 bg-gray-50"
                        style={{
                            top: panelRect.top,
                            left: panelRect.left,
                            width: panelRect.width,
                            height: panelRect.height,
                            boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
                        }}
                    >
                        {/* Ảnh phóng to */}
                        <div
                            className="absolute"
                            style={{
                                width: `${zoomLevel * 100}%`,
                                height: `${zoomLevel * 100}%`,
                                left: `${50 - mousePos.x * zoomLevel}%`,
                                top: `${50 - mousePos.y * zoomLevel}%`,
                                transition: 'left 0.04s linear, top 0.04s linear',
                                willChange: 'left, top',
                            }}
                        >
                            <Image
                                src={currentSrc}
                                alt={alt}
                                fill
                                className="object-cover"
                                sizes="900px"
                                draggable={false}
                            />
                        </div>
                        {/* Vignette nhẹ */}
                        <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 40px rgba(0,0,0,0.04)' }} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
