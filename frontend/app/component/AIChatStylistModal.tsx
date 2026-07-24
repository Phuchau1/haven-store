'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Sparkles, X, Loader2, ShoppingBag, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Product {
    id: string;
    name: string;
    price: number;
    images?: string[];
}

interface Message {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    products?: Product[];
}

export default function AIChatStylistModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            sender: 'ai',
            text: 'Xin chào! Tôi là AI Stylist cá nhân của bạn ✨ Bạn cần tư vấn phối đồ cho dịp gì hôm nay? (Ví dụ: đi phỏng vấn, đi chơi, hẹn hò...)'
        }
    ]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleSend = async (textToSend?: string) => {
        const query = textToSend || input;
        if (!query.trim() || loading) return;

        const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: query };
        setMessages(prev => [...prev, userMsg]);
        if (!textToSend) setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/ai-stylist/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: query })
            });

            const data = await res.json();
            if (data.success) {
                setMessages(prev => [
                    ...prev,
                    {
                        id: (Date.now() + 1).toString(),
                        sender: 'ai',
                        text: data.reply,
                        products: data.recommendedProducts
                    }
                ]);
            } else {
                throw new Error('Server error');
            }
        } catch (err) {
            setMessages(prev => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    sender: 'ai',
                    text: 'Dạ, hiện tại kết nối AI đang bận một chút. Bạn thử chọn một số sản phẩm gợi ý trong bộ sưu tập mới của Haven Store xem nhé! ✨'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const quickQuestions = [
        'Mặc gì đi phỏng vấn?',
        'Phối áo Polo đen với quần gì?',
        'Trang phục hẹn hò lịch sự',
        'Mặc gì đi cafe cuối tuần?'
    ];

    return (
        <>
            {/* Floating Button */}
            <motion.button
                onClick={() => setIsOpen(true)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className="fixed bottom-[110px] right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 text-white shadow-2xl flex items-center justify-center group"
                title="Tư Vấn AI Stylist"
            >
                <Sparkles size={24} className="animate-pulse" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-900 animate-ping" />
            </motion.button>

            {/* Chat Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.95 }}
                        className="fixed bottom-6 right-6 z-50 w-[380px] sm:w-[420px] h-[580px] bg-slate-950/95 border border-slate-800/80 rounded-3xl shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-slate-800/80 bg-gradient-to-r from-slate-900 to-slate-950 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-amber-400 flex items-center justify-center text-white shadow-lg">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-sm">Haven Personal AI Stylist</h3>
                                    <p className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online • Tư vấn 24/7
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-full bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${
                                        msg.sender === 'user'
                                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-br-none'
                                            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                                    }`}>
                                        {msg.text}
                                    </div>

                                    {/* Products suggestion card if available */}
                                    {msg.products && msg.products.length > 0 && (
                                        <div className="mt-2 grid grid-cols-2 gap-2 w-full max-w-[90%]">
                                            {msg.products.slice(0, 2).map(p => (
                                                <Link key={p.id} href={`/product/${p.id}`} className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex flex-col items-center hover:border-amber-400 transition-colors group">
                                                    <div className="w-full aspect-square relative rounded-lg overflow-hidden bg-slate-800 mb-1">
                                                        {p.images?.[0] && <Image src={p.images[0]} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform" />}
                                                    </div>
                                                    <p className="text-[11px] font-semibold text-white line-clamp-1 w-full text-center">{p.name}</p>
                                                    <p className="text-[10px] text-amber-400 font-bold">{new Intl.NumberFormat('vi-VN').format(p.price)}đ</p>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {loading && (
                                <div className="flex items-center gap-2 text-slate-400 bg-slate-900 p-3 rounded-2xl border border-slate-800 w-fit">
                                    <Loader2 size={14} className="animate-spin text-amber-400" />
                                    <span>AI đang phân tích tủ đồ...</span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Suggestions */}
                        <div className="px-4 py-2 flex gap-1.5 overflow-x-auto no-scrollbar border-t border-slate-900">
                            {quickQuestions.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSend(q)}
                                    className="text-[11px] whitespace-nowrap bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-full border border-slate-800 transition-colors shrink-0"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t border-slate-800/80 bg-slate-950 flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Hỏi AI Stylist về thời trang..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                                className="flex-1 bg-slate-900 text-white placeholder-slate-500 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500/50"
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || loading}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all ${
                                    input.trim() && !loading ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-md' : 'bg-slate-800 text-slate-600'
                                }`}
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
