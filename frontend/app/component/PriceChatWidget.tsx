'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Loader2, Tag } from 'lucide-react';

interface Message {
    role: 'user' | 'ai';
    text: string;
    time: string;
}

const QUICK_QUESTIONS = [
    'Áo polo giá bao nhiêu?',
    'Sản phẩm nào đang Flash Sale?',
    'Áo sơ mi giá rẻ nhất là bao nhiêu?',
    'Quần jean có giá bao nhiêu?',
];

export default function PriceChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'ai',
            text: 'Xin chào! 👋 Mình là trợ lý HAVEN AI. Bạn muốn hỏi giá sản phẩm nào? Mình sẽ tư vấn ngay!',
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasUnread, setHasUnread] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen) setHasUnread(false);
    }, [isOpen]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || loading) return;
        const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        setMessages(prev => [...prev, { role: 'user', text, time: now }]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            const data = await res.json();
            setMessages(prev => [...prev, {
                role: 'ai',
                text: data.reply || 'Xin lỗi, mình chưa tìm được thông tin. Bạn thử hỏi cách khác nhé!',
                time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            }]);
        } catch {
            setMessages(prev => [...prev, {
                role: 'ai',
                text: 'Có lỗi xảy ra, bạn vui lòng thử lại sau nhé!',
                time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Nút mở chat */}
            <motion.button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 z-[9998] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-white font-bold text-sm cursor-pointer transition-all ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                aria-label="Hỏi giá sản phẩm"
            >
                <div className="relative">
                    <MessageCircle size={20} />
                    {hasUnread && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    )}
                </div>
                <span>Hỏi giá AI</span>
                <Tag size={14} className="opacity-60" />
            </motion.button>

            {/* Cửa sổ chat */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-6 right-6 z-[9999] w-[360px] max-h-[560px] flex flex-col rounded-2xl overflow-hidden shadow-[0_20px_60px_-10px_rgba(0,0,0,0.4)]"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        {/* Header */}
                        <div className="px-4 py-3.5 flex items-center justify-between shrink-0"
                             style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                                    <Bot size={18} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm leading-tight">HAVEN AI</p>
                                    <p className="text-white/50 text-[10px]">Tư vấn giá sản phẩm</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Trực tuyến
                                </span>
                                <button onClick={() => setIsOpen(false)}
                                    className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all cursor-pointer">
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0f1117]" style={{ maxHeight: '340px' }}>
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                    {/* Avatar */}
                                    <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white ${msg.role === 'ai' ? 'bg-slate-700' : 'bg-slate-600'}`}>
                                        {msg.role === 'ai' ? <Bot size={14} /> : <User size={14} />}
                                    </div>
                                    <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                                            msg.role === 'ai'
                                                ? 'bg-slate-800 text-slate-100 rounded-tl-sm'
                                                : 'bg-white text-slate-900 rounded-tr-sm'
                                        }`}>
                                            {msg.text}
                                        </div>
                                        <span className="text-[10px] text-slate-600 px-1">{msg.time}</span>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Loading indicator */}
                            {loading && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-2">
                                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center">
                                        <Bot size={14} className="text-white" />
                                    </div>
                                    <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-slate-800 flex items-center gap-1.5">
                                        {[0, 1, 2].map(d => (
                                            <span key={d} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                                                style={{ animationDelay: `${d * 0.15}s` }} />
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Quick questions */}
                        {messages.length <= 1 && (
                            <div className="px-3 py-2 bg-[#0f1117] border-t border-white/5 flex gap-1.5 flex-wrap">
                                {QUICK_QUESTIONS.map((q, i) => (
                                    <button key={i} onClick={() => sendMessage(q)}
                                        className="text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-all cursor-pointer">
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        <div className="p-3 bg-[#0f1117] border-t border-white/5 shrink-0">
                            <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-2 border border-slate-700/60">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                                    placeholder="Hỏi về giá sản phẩm..."
                                    className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
                                />
                                <button
                                    onClick={() => sendMessage(input)}
                                    disabled={!input.trim() || loading}
                                    className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {loading ? <Loader2 size={14} className="animate-spin text-slate-900" /> : <Send size={14} className="text-slate-900" />}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
