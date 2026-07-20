'use client';

import { useState } from 'react';
import { MessageCircle, Phone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LiveChat() {
    const [isOpen, setIsOpen] = useState(false);

    // Bạn có thể thay đổi link bên dưới thành link Zalo, Messenger của bạn
    const zaloLink = 'https://zalo.me/0838484885'; // Thay bằng sdt zalo của shop
    const phone = '0838484885'; 

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
                        {/* Zalo Button */}
                        <a
                            href={zaloLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 bg-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all group border border-gray-100"
                        >
                            <span className="font-medium text-gray-700 group-hover:text-blue-600">Chat Zalo</span>
                            <div className="bg-blue-500 text-white p-2 rounded-full">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                                </svg>
                            </div>
                        </a>

                        {/* Phone Button */}
                        <a
                            href={`tel:${phone}`}
                            className="flex items-center gap-3 bg-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all group border border-gray-100"
                        >
                            <span className="font-medium text-gray-700 group-hover:text-green-600">Gọi điện</span>
                            <div className="bg-green-500 text-white p-2 rounded-full">
                                <Phone size={20} />
                            </div>
                        </a>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-all duration-300 ${isOpen ? 'bg-gray-800 rotate-90 hover:bg-gray-700' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-110'}`}
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
            </button>
        </div>
    );
}
