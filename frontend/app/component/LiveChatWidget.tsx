'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import Image from 'next/image';

export default function LiveChatWidget() {
    const [isOpen, setIsOpen] = useState(false);

    // Thay thế bằng ID thực tế của bạn
    const zaloUrl = "https://zalo.me/0123456789"; 
    const messengerUrl = "https://m.me/yourfacebookpage";

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col gap-3"
                    >
                        {/* Messenger Button */}
                        <a
                            href={messengerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 border border-gray-100 group"
                        >
                            <span className="font-medium text-sm text-gray-700 group-hover:text-blue-600">Messenger</span>
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center p-1.5 text-blue-600">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                                    <path d="M12 2C6.477 2 2 6.145 2 11.26c0 2.915 1.503 5.513 3.86 7.185v3.42l3.498-1.922c.834.237 1.718.366 2.642.366 5.523 0 10-4.145 10-9.26S17.523 2 12 2zm1.09 12.67-2.92-3.13-5.69 3.13 6.25-6.65 3.01 3.13 5.59-3.13-6.24 6.65z"/>
                                </svg>
                            </div>
                        </a>

                        {/* Zalo Button */}
                        <a
                            href={zaloUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 border border-gray-100 group"
                        >
                            <span className="font-medium text-sm text-gray-700 group-hover:text-blue-500">Chat Zalo</span>
                            <div className="w-8 h-8 rounded-full bg-[#0068FF] text-white flex items-center justify-center font-bold text-xs p-1">
                                Zalo
                            </div>
                        </a>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform hover:shadow-black/30"
                aria-label="Hỗ trợ trực tuyến"
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                        >
                            <X size={24} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="chat"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                        >
                            <MessageCircle size={24} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </button>
        </div>
    );
}
