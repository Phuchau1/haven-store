'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Send, Bot, User, Loader2,
    ChevronDown, Sparkles, RotateCcw, Copy, Check
} from 'lucide-react';
import Image from 'next/image';

// ────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────
interface Message {
    role: 'user' | 'ai';
    text: string;
    time: string;
    id: string;
}

// ────────────────────────────────────────────────────────────
// GỢI Ý CÂU HỎI NHANH
// ────────────────────────────────────────────────────────────
const QUICK_QUESTIONS = [
    { icon: '⚡', label: 'Flash Sale đang có gì?' },
    { icon: '👔', label: 'Áo polo giá bao nhiêu?' },
    { icon: '👖', label: 'Quần jean có loại nào?' },
    { icon: '🎨', label: 'Gợi ý phối đồ đi làm' },
    { icon: '💸', label: 'Sản phẩm rẻ nhất là gì?' },
    { icon: '📏', label: 'Chọn size như thế nào?' },
];

// ────────────────────────────────────────────────────────────
// UTILS
// ────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const getTime = () => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

// Parse **bold** và links trong text AI
function parseMarkdown(text: string) {
    const parts: React.ReactNode[] = [];
    const lines = text.split('\n');
    lines.forEach((line, li) => {
        const tokens = line.split(/(\*\*[^*]+\*\*|https?:\/\/\S+)/g);
        tokens.forEach((tok, ti) => {
            if (tok.startsWith('**') && tok.endsWith('**')) {
                parts.push(<strong key={`${li}-${ti}`} className="font-semibold text-white">{tok.slice(2, -2)}</strong>);
            } else if (tok.startsWith('http')) {
                const display = tok.replace('https://havenstore.io.vn', 'havenstore.io.vn');
                parts.push(
                    <a key={`${li}-${ti}`} href={tok} target="_blank" rel="noopener noreferrer"
                        className="text-amber-400 underline underline-offset-2 hover:text-amber-300 transition-colors break-all">
                        {display}
                    </a>
                );
            } else {
                parts.push(<span key={`${li}-${ti}`}>{tok}</span>);
            }
        });
        if (li < lines.length - 1) parts.push(<br key={`br-${li}`} />);
    });
    return parts;
}

// ────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────
export default function HavenAIChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'ai',
            text: 'Xin chào! 👋 Mình là **HAVEN AI** — trợ lý thời trang của bạn.\n\nMình có thể giúp bạn:\n• Tra giá & tìm sản phẩm phù hợp\n• Gợi ý cách phối đồ\n• Thông tin Flash Sale & ưu đãi\n\nBạn muốn hỏi gì nào?',
            time: getTime(),
            id: uid()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasUnread, setHasUnread] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [showScrollBtn, setShowScrollBtn] = useState(false);

    const bottomRef = useRef<HTMLDivElement>(null);
    const messagesRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // ── Scroll behaviour ───────────────────────────────────
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    useEffect(() => {
        const el = messagesRef.current;
        if (!el) return;
        const onScroll = () => {
            setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
        };
        el.addEventListener('scroll', onScroll);
        return () => el.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        if (isOpen) { setHasUnread(false); inputRef.current?.focus(); }
    }, [isOpen]);

    // ── Send message ───────────────────────────────────────
    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || loading) return;
        const userMsg: Message = { role: 'user', text: text.trim(), time: getTime(), id: uid() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        // Build history for multi-turn
        const history = messages.map(m => ({ role: m.role, text: m.text }));

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text.trim(), history })
            });
            const data = await res.json();
            setMessages(prev => [...prev, {
                role: 'ai',
                text: data.reply || 'Xin lỗi, mình chưa tìm được thông tin phù hợp. Bạn thử hỏi cách khác nhé!',
                time: getTime(),
                id: uid()
            }]);
        } catch {
            setMessages(prev => [...prev, {
                role: 'ai',
                text: 'Có lỗi kết nối, bạn vui lòng thử lại sau nhé! 🙏',
                time: getTime(),
                id: uid()
            }]);
        } finally {
            setLoading(false);
        }
    }, [loading, messages]);

    // ── Copy message ───────────────────────────────────────
    const copyMessage = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // ── Reset ──────────────────────────────────────────────
    const resetChat = () => {
        setMessages([{
            role: 'ai',
            text: 'Xin chào! 👋 Mình là **HAVEN AI** — trợ lý thời trang của bạn.\n\nMình có thể giúp bạn:\n• Tra giá & tìm sản phẩm phù hợp\n• Gợi ý cách phối đồ\n• Thông tin Flash Sale & ưu đãi\n\nBạn muốn hỏi gì nào?',
            time: getTime(),
            id: uid()
        }]);
    };

    // ── Auto-resize textarea ───────────────────────────────
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    return (
        <>
            {/* ══════════════════════════════════════════════
                NÚT MỞ CHAT (Floating)
            ══════════════════════════════════════════════ */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-[9998] flex items-center gap-3 pl-2 pr-5 py-2 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.45)] cursor-pointer"
                        style={{
                            background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a30 100%)',
                            border: '1px solid rgba(255,255,255,0.10)'
                        }}
                        whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(0,0,0,0.55)' }}
                        whileTap={{ scale: 0.96 }}
                        aria-label="Mở chat AI HAVEN"
                    >
                        {/* Logo nhỏ */}
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center shrink-0">
                            <Image src="/haven-logo.png" alt="HAVEN" width={36} height={36} className="object-contain" />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-white font-bold text-[13px] leading-tight">HAVEN AI</span>
                            <span className="text-white/45 text-[10px] leading-tight">Tư vấn thời trang</span>
                        </div>
                        {hasUnread && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#0f0f1a] animate-pulse" />
                        )}
                    </motion.button>
                )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════
                CỬA SỔ CHAT
            ══════════════════════════════════════════════ */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.96 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                        className="fixed bottom-6 right-6 z-[9999] flex flex-col rounded-2xl overflow-hidden"
                        style={{
                            width: 'clamp(340px, 90vw, 420px)',
                            height: isMinimized ? 'auto' : 'clamp(520px, 80vh, 660px)',
                            background: '#0d0d1a',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: '0 24px 80px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)'
                        }}
                    >
                        {/* ── HEADER ─────────────────────────────── */}
                        <div
                            className="px-4 py-3 flex items-center justify-between shrink-0 cursor-pointer select-none"
                            style={{ background: 'linear-gradient(135deg, #0f0f20 0%, #1a1535 100%)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                            onClick={() => setIsMinimized(m => !m)}
                        >
                            <div className="flex items-center gap-3">
                                {/* Logo lớn */}
                                <div className="w-11 h-11 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                                    <Image src="/haven-logo.png" alt="HAVEN" width={40} height={40} className="object-contain" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-bold text-[15px] leading-tight tracking-tight">HAVEN AI</span>
                                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
                                            <Sparkles size={9} className="text-amber-400" />
                                            <span className="text-[9px] font-semibold text-amber-400 uppercase tracking-wider">Gemini</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-emerald-400 text-[10px] font-medium">Trực tuyến · Phản hồi ngay</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                <button onClick={resetChat}
                                    title="Cuộc hội thoại mới"
                                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/80 transition-all cursor-pointer">
                                    <RotateCcw size={14} />
                                </button>
                                <button onClick={() => setIsMinimized(m => !m)}
                                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/80 transition-all cursor-pointer">
                                    <ChevronDown size={15} className={`transition-transform duration-300 ${isMinimized ? 'rotate-180' : ''}`} />
                                </button>
                                <button onClick={() => setIsOpen(false)}
                                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-white/40 hover:text-red-400 transition-all cursor-pointer">
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        {/* ── BODY (ẩn khi minimized) ─────────────── */}
                        <AnimatePresence>
                            {!isMinimized && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.22 }}
                                    className="flex flex-col flex-1 min-h-0"
                                >
                                    {/* ── MESSAGES ──────────────────────── */}
                                    <div
                                        ref={messagesRef}
                                        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin"
                                        style={{
                                            background: 'radial-gradient(ellipse at top, #12122a 0%, #0d0d1a 60%)',
                                            scrollbarWidth: 'thin',
                                            scrollbarColor: 'rgba(255,255,255,0.08) transparent'
                                        }}
                                    >
                                        {messages.map((msg) => (
                                            <motion.div
                                                key={msg.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className={`flex items-end gap-2.5 group ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                            >
                                                {/* Avatar */}
                                                {msg.role === 'ai' ? (
                                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mb-5">
                                                        <Image src="/haven-logo.png" alt="AI" width={28} height={28} className="object-contain" />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-slate-700 border border-white/10 flex items-center justify-center shrink-0 mb-5">
                                                        <User size={15} className="text-white/70" />
                                                    </div>
                                                )}

                                                <div className={`flex flex-col gap-1 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                                    {/* Bubble */}
                                                    <div
                                                        className={`relative px-4 py-3 text-sm leading-relaxed ${
                                                            msg.role === 'ai'
                                                                ? 'bg-[#1c1c32] text-slate-200 rounded-2xl rounded-bl-sm border border-white/6'
                                                                : 'text-slate-900 font-medium rounded-2xl rounded-br-sm'
                                                        }`}
                                                        style={msg.role === 'user' ? {
                                                            background: 'linear-gradient(135deg, #e8e0d0 0%, #f5f0ea 100%)'
                                                        } : {}}
                                                    >
                                                        {msg.role === 'ai' ? parseMarkdown(msg.text) : msg.text}
                                                    </div>

                                                    {/* Thời gian + Copy */}
                                                    <div className={`flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                                        <span className="text-[10px] text-white/25">{msg.time}</span>
                                                        {msg.role === 'ai' && (
                                                            <button onClick={() => copyMessage(msg.id, msg.text)}
                                                                className="text-white/25 hover:text-white/60 transition-colors cursor-pointer">
                                                                {copiedId === msg.id
                                                                    ? <Check size={11} className="text-emerald-400" />
                                                                    : <Copy size={11} />}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}

                                        {/* Typing indicator */}
                                        <AnimatePresence>
                                            {loading && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex items-end gap-2.5"
                                                >
                                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                                        <Image src="/haven-logo.png" alt="AI" width={28} height={28} className="object-contain" />
                                                    </div>
                                                    <div className="px-4 py-3.5 rounded-2xl rounded-bl-sm bg-[#1c1c32] border border-white/6 flex items-center gap-1.5">
                                                        {[0, 1, 2].map(d => (
                                                            <span key={d} className="w-2 h-2 rounded-full bg-white/30 animate-bounce"
                                                                style={{ animationDelay: `${d * 0.15}s`, animationDuration: '0.8s' }} />
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div ref={bottomRef} />
                                    </div>

                                    {/* Scroll to bottom button */}
                                    <AnimatePresence>
                                        {showScrollBtn && (
                                            <motion.button
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
                                                className="absolute bottom-24 right-6 w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all cursor-pointer z-10"
                                            >
                                                <ChevronDown size={16} />
                                            </motion.button>
                                        )}
                                    </AnimatePresence>

                                    {/* ── GỢI Ý NHANH ─────────────────────── */}
                                    {messages.length <= 1 && (
                                        <div className="px-4 pt-1 pb-3" style={{ background: 'radial-gradient(ellipse at bottom, #12122a 0%, #0d0d1a 80%)' }}>
                                            <p className="text-[10px] text-white/25 uppercase tracking-widest mb-2 font-medium">Hỏi nhanh</p>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                {QUICK_QUESTIONS.map((q, i) => (
                                                    <motion.button
                                                        key={i}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => sendMessage(q.label)}
                                                        className="flex items-center gap-2 text-left px-3 py-2.5 rounded-xl bg-white/4 hover:bg-white/8 border border-white/6 hover:border-white/12 transition-all cursor-pointer"
                                                    >
                                                        <span className="text-base leading-none">{q.icon}</span>
                                                        <span className="text-[11px] text-white/60 leading-snug">{q.label}</span>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* ── INPUT AREA ──────────────────────── */}
                                    <div className="px-4 pb-4 pt-3 shrink-0"
                                        style={{ background: '#0d0d1a', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div
                                            className="flex items-end gap-3 rounded-2xl px-4 py-3"
                                            style={{
                                                background: '#1a1a2e',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                boxShadow: input ? '0 0 0 1px rgba(255,255,255,0.12)' : 'none',
                                                transition: 'box-shadow 0.2s'
                                            }}
                                        >
                                            <textarea
                                                ref={inputRef}
                                                rows={1}
                                                value={input}
                                                onChange={handleInput}
                                                onKeyDown={handleKeyDown}
                                                placeholder="Hỏi về giá, sản phẩm, phong cách..."
                                                className="flex-1 bg-transparent text-[13px] text-slate-100 placeholder-white/25 outline-none resize-none leading-relaxed"
                                                style={{ maxHeight: '120px', minHeight: '22px' }}
                                                disabled={loading}
                                            />
                                            <button
                                                onClick={() => sendMessage(input)}
                                                disabled={!input.trim() || loading}
                                                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                style={{
                                                    background: input.trim() && !loading
                                                        ? 'linear-gradient(135deg, #c8aa80 0%, #e8d0a0 100%)'
                                                        : 'rgba(255,255,255,0.08)'
                                                }}
                                            >
                                                {loading
                                                    ? <Loader2 size={16} className="animate-spin text-white/50" />
                                                    : <Send size={15} className={input.trim() ? 'text-slate-900' : 'text-white/40'} />
                                                }
                                            </button>
                                        </div>
                                        <p className="text-center text-[10px] text-white/18 mt-2">
                                            Powered by Gemini AI · HAVEN Fashion
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
