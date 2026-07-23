'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Camera } from 'lucide-react';

export default function FloatingAIActions() {
    return (
        <>
            {/* AI Thử đồ */}
            <Link href="/ai-tryon" passHref legacyBehavior>
                <motion.a
                    className="fixed bottom-[190px] right-6 z-40 flex flex-col items-center gap-1 group w-14"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', bounce: 0.5, delay: 1.1 }}
                    title="AI Thử Đồ"
                >
                    <motion.div
                        className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}
                    >
                        <Camera size={24} className="text-white" />
                    </motion.div>
                    <span className="text-[10px] font-bold text-gray-600 bg-white/90 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                        Thử đồ
                    </span>
                </motion.a>
            </Link>

            {/* AI Gợi ý */}
            <Link href="/ai-style" passHref legacyBehavior>
                <motion.a
                    className="fixed bottom-[280px] right-6 z-40 flex flex-col items-center gap-1 group w-14"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', bounce: 0.5, delay: 1.2 }}
                    title="AI Gợi Ý Phong Cách"
                >
                    <motion.div
                        className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)' }}
                    >
                        <Sparkles size={24} className="text-white" />
                    </motion.div>
                    <span className="text-[10px] font-bold text-gray-600 bg-white/90 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                        AI Gợi ý
                    </span>
                </motion.a>
            </Link>
        </>
    );
}
