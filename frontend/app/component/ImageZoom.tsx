'use client';
// ===== ADVANCED PREMIUM IMAGE ZOOM & LIGHTBOX GALLERY =====
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2, X, ZoomIn, ZoomOut } from 'lucide-react';

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
    images = [], alt, badge, discount = 0, zoomLevel = 2.5,
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
        if (externalIndex !== undefined) setInternalIndex(externalIndex);
    }, [externalIndex]);

    const [isHovering, setIsHovering] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
    const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
    const [panelRect, setPanelRect] = useState({ top: 0, left: 0, width: 0, height: 0 });
    
    // Lightbox modal state
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxZoom, setLightboxZoom] = useState(1);

    const containerRef = useRef<HTMLDivElement>(null);
    const LENS_W = 120;
    const LENS_H = 120;

    const updatePanelRect = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const GAP = 20;
        
        // Tính toán vị trí side-panel sao cho không tràn màn hình
        const availableWidth = window.innerWidth - rect.right - GAP - 32;
        const panelWidth = Math.min(Math.max(340, availableWidth), 520);
        
        setPanelRect({
            top: rect.top,
            left: rect.right + GAP,
            width: panelWidth,
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
        
        // Giới hạn lens nằm hoàn toàn bên trong khung ảnh
        const cx = Math.max(LENS_W / 2, Math.min(rect.width - LENS_W / 2, rawX));
        const cy = Math.max(LENS_H / 2, Math.min(rect.height - LENS_H / 2, rawY));
        
        setLensPos({ x: cx - LENS_W / 2, y: cy - LENS_H / 2 });
        
        // Tính tỷ lệ vị trí chuột [0 - 100]%
        const px = Math.max(0, Math.min(100, (rawX / rect.width) * 100));
        const py = Math.max(0, Math.min(100, (rawY / rect.height) * 100));
        setMousePos({ x: px, y: py });
        
        updatePanelRect();
    }, [updatePanelRect]);

    const prev = () => setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
    const next = () => setSelectedIndex((selectedIndex + 1) % images.length);
    const currentSrc = images[selectedIndex] || '/haven-logo.png';

    // Keyboard support for Lightbox
    useEffect(() => {
        if (!isLightboxOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsLightboxOpen(false);
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'ArrowRight') next();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLightboxOpen, selectedIndex, images.length]);

    return (
        <>
            <div className="flex flex-col-reverse md:flex-row gap-3 relative">
                {/* Thumbnails dọc */}
                {images.length > 1 && (
                    <div className="flex md:flex-col gap-2 shrink-0 overflow-x-auto md:overflow-y-auto max-h-[500px] hide-scrollbar py-1">
                        {images.map((img, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setSelectedIndex(i)}
                                onMouseEnter={() => setSelectedIndex(i)}
                                className={`relative w-14 h-16 md:w-16 md:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                                    i === selectedIndex
                                        ? 'border-slate-900 shadow-md ring-2 ring-slate-900/20'
                                        : 'border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100'
                                }`}
                            >
                                <Image src={img} alt={`${alt} ${i + 1}`} fill className="object-cover" sizes="64px" />
                            </button>
                        ))}
                    </div>
                )}

                {/* Khung Ảnh chính */}
                <div
                    ref={containerRef}
                    className={`relative flex-1 aspect-square md:aspect-[3/4] rounded-2xl overflow-hidden bg-slate-50 select-none shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-slate-200/80 ${
                        isHovering ? 'cursor-crosshair' : 'cursor-zoom-in'
                    }`}
                    onMouseEnter={() => { setIsHovering(true); updatePanelRect(); }}
                    onMouseLeave={() => setIsHovering(false)}
                    onMouseMove={handleMouseMove}
                    onClick={() => { setIsLightboxOpen(true); setLightboxZoom(1); }}
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
                    {badge && !(discount > 0 && badge.toUpperCase().includes('SALE')) ? (
                        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
                            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md shadow-xs ${
                                badge.toUpperCase() === 'MỚI' || badge.toUpperCase() === 'NEW' ? 'bg-[#0a192f] text-white' :
                                badge.toUpperCase() === 'HOT' ? 'bg-[#d97706] text-white' :
                                'bg-[#1e40af] text-white'
                            }`}>
                                {badge}
                            </span>
                        </div>
                    ) : discount > 0 ? (
                        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
                            <span className="px-3 py-1 text-xs font-black rounded-md bg-[#dc2626] text-white shadow-xs">
                                -{discount}%
                            </span>
                        </div>
                    ) : null}

                    {/* Nút phóng to toàn màn hình */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsLightboxOpen(true);
                            setLightboxZoom(1);
                        }}
                        className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md flex items-center justify-center transition-all hover:scale-105"
                        title="Xem toàn màn hình"
                    >
                        <Maximize2 size={16} />
                    </button>

                    {/* Lens box khi rê chuột */}
                    <AnimatePresence>
                        {isHovering && (
                            <motion.div
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.1 }}
                                className="hidden lg:block absolute z-20 pointer-events-none border-2 border-white rounded-xl"
                                style={{
                                    width: LENS_W, 
                                    height: LENS_H,
                                    left: lensPos.x, 
                                    top: lensPos.y,
                                    background: 'rgba(255,255,255,0.25)',
                                    boxShadow: '0 0 0 1px rgba(0,0,0,0.2), inset 0 0 10px rgba(0,0,0,0.1)',
                                }}
                            />
                        )}
                    </AnimatePresence>

                    {/* Hint hướng dẫn */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/70 backdrop-blur-md text-white rounded-full text-[11px] font-medium whitespace-nowrap pointer-events-none">
                        <ZoomIn size={12} />
                        Di chuột để soi vải · Click xem ảnh lớn
                    </div>

                    {/* Nút chuyển ảnh trên Mobile */}
                    {images.length > 1 && (
                        <>
                            <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); prev(); }} 
                                className="md:hidden absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-slate-800"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); next(); }} 
                                className="md:hidden absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-slate-800"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </>
                    )}
                </div>

                {/* ── PANEL ZOOM NỔI (CHÍNH XÁC 100% THEO VỊ TRÍ CHUỘT) ── */}
                <AnimatePresence>
                    {isHovering && panelRect.width > 200 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.15 }}
                            className="hidden lg:block fixed z-[9999] pointer-events-none overflow-hidden rounded-2xl border border-slate-200 bg-white"
                            style={{
                                top: panelRect.top,
                                left: panelRect.left,
                                width: panelRect.width,
                                height: panelRect.height,
                                boxShadow: '0 25px 60px -15px rgba(0,0,0,0.25)',
                            }}
                        >
                            {/* Ảnh phóng to chính xác theo tỷ lệ */}
                            <div
                                className="absolute"
                                style={{
                                    width: `${zoomLevel * 100}%`,
                                    height: `${zoomLevel * 100}%`,
                                    left: `${- (mousePos.x / 100) * (zoomLevel - 1) * 100}%`,
                                    top: `${- (mousePos.y / 100) * (zoomLevel - 1) * 100}%`,
                                    willChange: 'left, top',
                                }}
                            >
                                <Image
                                    src={currentSrc}
                                    alt={alt}
                                    fill
                                    className="object-cover"
                                    sizes="1200px"
                                    priority
                                    draggable={false}
                                />
                            </div>
                            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_30px_rgba(0,0,0,0.05)]" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── FULL-SCREEN LIGHTBOX MODAL ──────────────────────────────── */}
            <AnimatePresence>
                {isLightboxOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100000] bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        {/* Top Bar */}
                        <div 
                            className="w-full flex items-center justify-between text-white z-10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-sm font-semibold text-slate-300">
                                {selectedIndex + 1} / {images.length || 1} — {alt}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setLightboxZoom(p => Math.min(p + 0.5, 3))}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all cursor-pointer"
                                    title="Phóng to"
                                >
                                    <ZoomIn size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLightboxZoom(p => Math.max(p - 0.5, 1))}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all cursor-pointer"
                                    title="Thu nhỏ"
                                >
                                    <ZoomOut size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsLightboxOpen(false)}
                                    className="p-2 bg-white/10 hover:bg-rose-600 rounded-xl text-white transition-all cursor-pointer ml-2"
                                    title="Đóng (ESC)"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Center Large Image Area */}
                        <div 
                            className="relative flex-1 w-full max-w-5xl flex items-center justify-center my-4 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <motion.div
                                animate={{ scale: lightboxZoom }}
                                transition={{ type: 'spring', damping: 25 }}
                                className="relative w-full h-full max-h-[75vh] flex items-center justify-center"
                            >
                                <Image
                                    src={currentSrc}
                                    alt={alt}
                                    fill
                                    className="object-contain select-none"
                                    sizes="100vw"
                                    priority
                                />
                            </motion.div>

                            {/* Prev/Next Navigation */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); prev(); }}
                                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all cursor-pointer backdrop-blur-sm"
                                        aria-label="Ảnh trước"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); next(); }}
                                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all cursor-pointer backdrop-blur-sm"
                                        aria-label="Ảnh tiếp theo"
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Bottom Thumbnail Strip */}
                        {images.length > 1 && (
                            <div 
                                className="flex items-center gap-2 overflow-x-auto max-w-full p-2 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 z-10"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {images.map((img, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setSelectedIndex(i)}
                                        className={`relative w-12 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                                            i === selectedIndex
                                                ? 'border-white scale-105 shadow-lg'
                                                : 'border-transparent opacity-60 hover:opacity-100'
                                        }`}
                                    >
                                        <Image src={img} alt={`Thumb ${i + 1}`} fill className="object-cover" sizes="48px" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
