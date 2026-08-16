'use client';
// ===== PREMIUM FLASH SALE POPUP BANNER MODAL =====
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function FlashSalePopup() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Show popup only once per session to avoid annoying users
        const hasSeenPopup = sessionStorage.getItem('hasSeenFlashSalePopup');
        if (!hasSeenPopup) {
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 1200); // 1.2s delay for a premium loading experience
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        sessionStorage.setItem('hasSeenFlashSalePopup', 'true');
    };

    const handleRedirect = () => {
        handleClose();
        router.push('/#flash-sale');
        
        // Scroll to the flash sale section after a small timeout if on the same page
        setTimeout(() => {
            const el = document.getElementById('flash-sale');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop with premium blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Floating Promo Banner */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.88, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.88, y: 30 }}
                        transition={{ type: 'spring', damping: 24, stiffness: 260 }}
                        className="relative w-[92vw] max-w-[560px] md:max-w-[600px] aspect-square z-10 select-none bg-transparent cursor-pointer filter drop-shadow-[0_25px_50px_rgba(0,0,0,0.65)]"
                    >
                        {/* Close button with circular background blur */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClose();
                            }}
                            className="absolute top-2 right-2 sm:-top-2 sm:-right-2 z-20 flex items-center justify-center w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all border border-white/20 backdrop-blur-md shadow-xl hover:scale-110 active:scale-95"
                            aria-label="Đóng quảng cáo"
                        >
                            <X size={18} />
                        </button>

                        {/* Clickable Banner Image */}
                        <div onClick={handleRedirect} className="relative w-full h-full group">
                            <Image
                                src="/flash-sale-popup.png"
                                alt="Flash Sale Deal Hot Giờ Vàng"
                                fill
                                className="object-contain group-hover:scale-[1.05] transition-transform duration-500 ease-out"
                                priority
                            />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
