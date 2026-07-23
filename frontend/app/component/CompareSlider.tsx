'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface CompareSliderProps {
    beforeImage: string;
    afterImage: string;
    beforeLabel?: string;
    afterLabel?: string;
}

export default function CompareSlider({
    beforeImage,
    afterImage,
    beforeLabel = 'Ảnh gốc',
    afterLabel = 'AI Thử đồ'
}: CompareSliderProps) {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);

    const handleMove = (clientX: number, rect: DOMRect) => {
        const x = clientX - rect.left;
        let pos = (x / rect.width) * 100;
        if (pos < 0) pos = 0;
        if (pos > 100) pos = 100;
        setSliderPosition(pos);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        handleMove(e.touches[0].clientX, rect);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        const rect = e.currentTarget.getBoundingClientRect();
        handleMove(e.clientX, rect);
    };

    return (
        <div
            className="relative w-full h-[450px] md:h-[550px] rounded-2xl overflow-hidden select-none cursor-ew-resize bg-black/5 border border-gray-200 shadow-2xl"
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
        >
            {/* After Image (Full Size background) */}
            <img
                src={afterImage}
                alt="AI Try-On Result"
                className="absolute inset-0 w-full h-full object-contain bg-neutral-900"
            />
            <span className="absolute top-4 right-4 z-10 bg-amber-500/90 text-white font-bold text-xs px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg">
                ✨ {afterLabel}
            </span>

            {/* Before Image (Clipped) */}
            <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
            >
                <img
                    src={beforeImage}
                    alt="Original User Photo"
                    className="absolute inset-0 w-full h-full object-contain bg-neutral-900 max-w-none"
                    style={{ width: '100%', height: '100%' }}
                />
                <span className="absolute top-4 left-4 z-10 bg-black/60 text-white font-medium text-xs px-3 py-1.5 rounded-full backdrop-blur-md">
                    📷 {beforeLabel}
                </span>
            </div>

            {/* Divider Line & Handle */}
            <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20"
                style={{ left: `${sliderPosition}%` }}
            >
                <motion.div
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white text-gray-900 shadow-xl border-2 border-amber-400 flex items-center justify-center font-bold text-xs"
                >
                    ↔
                </motion.div>
            </div>
        </div>
    );
}
