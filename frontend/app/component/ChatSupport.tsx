'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Loader2, Sparkles, ChevronRight, RotateCcw, ArrowDownCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/component/AuthContext';
import { getProductSlug } from '@/lib/format';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fashion-backend-93lh.onrender.com';

interface Product {
  id: string;
  _id?: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  categoryLabel?: string;
  images: string[];
  rating?: number;
  reviews?: number;
  inStock?: boolean;
  soldQuantity?: number;
  badge?: string;
  description?: string;
  flashSale?: boolean;
  flashSalePrice?: number;
}

interface SuggestedProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  flashSale?: boolean;
  flashSalePrice?: number;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'admin';
  timestamp: Date;
  suggestedProducts?: SuggestedProduct[];
}

interface ChatTurn {
  role: 'user' | 'model';
  parts: { text: string }[];
}

const DEFAULT_SUGGESTION_CHIPS = [
  '🔥 Flash Sale hôm nay?',
  '💰 Sản phẩm dưới 300k',
  '👕 Áo Polo hot nhất',
  '👔 Gợi ý phối đồ đi làm',
  '⭐ Đánh giá cao nhất',
];

// Helper render text with simple markdown (bold + links + high contrast)
function FormattedText({ text }: { text: string }) {
  const parts = text.split('\n');
  return (
    <div className="space-y-2 text-[14.5px] leading-relaxed text-slate-900 font-normal">
      {parts.map((line, lIdx) => {
        if (!line.trim()) return <div key={lIdx} className="h-1.5" />;

        // Bold formatting **text**
        const formattedTokens = line.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s]+)/g).map((token, tIdx) => {
          if (token.startsWith('**') && token.endsWith('**')) {
            return (
              <strong key={tIdx} className="font-black text-slate-950">
                {token.slice(2, -2)}
              </strong>
            );
          }
          if (token.startsWith('http://') || token.startsWith('https://')) {
            return (
              <a
                key={tIdx}
                href={token}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1e40af] underline font-bold hover:text-blue-800 transition-colors break-all"
              >
                {token.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            );
          }
          return token;
        });

        return <p key={lIdx} className="leading-relaxed">{formattedTokens}</p>;
      })}
    </div>
  );
}

export default function ChatSupport() {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào bạn! Mình là **HAVEN AI** — Trợ lý thời trang thông minh 👋\n\nMình có thể hỗ trợ bạn tra cứu giá, tìm đồ theo ngân sách, gợi ý cách phối đồ hoặc các ưu đãi **Flash Sale** hot nhất hôm nay. Bạn đang quan tâm sản phẩm nào?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Parse suggested product IDs từ reply ──
  const parseSuggestedProducts = useCallback((reply: string): { cleanReply: string; suggested: SuggestedProduct[] } => {
    const match = reply.match(/SUGGEST_IDS:\s*([\w\-,\s]+)/i);
    if (!match) return { cleanReply: reply, suggested: [] };

    const ids = match[1].split(',').map((s) => s.trim()).filter(Boolean);
    const cleanReply = reply.replace(/SUGGEST_IDS:[\w\-,\s]+/i, '').trim();

    const suggested: SuggestedProduct[] = ids
      .map((id) => products.find((p) => (p.id === id || (p as any)._id === id || (p as any)._id?.toString() === id)))
      .filter((p): p is Product => !!p && (p.inStock !== false))
      .slice(0, 3)
      .map((p) => ({
        id: p.id || (p as any)._id?.toString() || '',
        name: p.name,
        price: p.price,
        originalPrice: p.originalPrice,
        image: p.images?.[0] || '',
        category: p.category,
        flashSale: p.flashSale,
        flashSalePrice: p.flashSalePrice,
      }));

    return { cleanReply, suggested };
  }, [products]);

  // ── Load sản phẩm từ backend ──
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/products`);
        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
          setProducts(data.products);
          setIsReady(true);
        }
      } catch (err) {
        console.error('Không thể tải sản phẩm:', err);
        setIsReady(true);
      }
    };
    loadProducts();
  }, []);

  // ── Load chat session from local storage on mount ──
  useEffect(() => {
    if (!isReady) return;

    const storedSessionId = localStorage.getItem('phstore-chat-session-id');

    const fetchHistory = async (sessionId: string) => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/chats/sessions/${sessionId}/messages`);
        const data = await res.json();
        if (data.success && Array.isArray(data.messages) && data.messages.length > 0) {
          const formattedMessages: Message[] = data.messages.map((m: {id: string; message: string; sender_type: string; createdAt: string}) => {
            const { cleanReply, suggested } = parseSuggestedProducts(m.message);
            return {
              id: m.id,
              text: cleanReply,
              sender: m.sender_type as Message['sender'],
              timestamp: new Date(m.createdAt),
              suggestedProducts: suggested
            };
          });
          setMessages(formattedMessages);
        }
      } catch (err) {
        console.error('Lỗi khi tải lịch sử chat:', err);
      }
    };

    const restoreSession = async () => {
      if (user?.id) {
        try {
          const res = await fetch(`${BACKEND_URL}/api/chats/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              customer_name: user.name,
              phone: user.phone || '0900000000'
            })
          });
          const data = await res.json();
          if (data.success && data.session) {
            setSessionId(data.session.id);
            localStorage.setItem('phstore-chat-session-id', data.session.id);
            await fetchHistory(data.session.id);
            return;
          }
        } catch (err) {
          console.error('Lỗi khi khôi phục session theo user:', err);
        }
      }

      if (!user?.id && storedSessionId) {
        setSessionId(storedSessionId);
        fetchHistory(storedSessionId);
      }
    };

    restoreSession();
  }, [isReady, user, parseSuggestedProducts]);

  // ── Poll for admin responses ──
  useEffect(() => {
    if (!isOpen || !sessionId) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/chats/sessions/${sessionId}/messages`);
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
          if (data.messages.length !== messages.length) {
            const formattedMessages: Message[] = data.messages.map((m: {id: string; message: string; sender_type: string; createdAt: string}) => {
              const { cleanReply, suggested } = parseSuggestedProducts(m.message);
              return {
                id: m.id,
                text: cleanReply,
                sender: m.sender_type as Message['sender'],
                timestamp: new Date(m.createdAt),
                suggestedProducts: suggested
              };
            });
            setMessages(formattedMessages);
          }
        }
      } catch (err) {
        console.error('Lỗi khi cập nhật tin nhắn:', err);
      }
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [isOpen, sessionId, messages.length, parseSuggestedProducts]);

  // ── Scroll to bottom ──
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // ── Focus input khi mở ──
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setHasUnread(false);
    }
  }, [isOpen]);

  // ── Call AI via Backend (Gemini RAG) ──
  const callGemini = async (userMessage: string): Promise<string> => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: chatHistory.map(turn => ({
            role: turn.role === 'user' ? 'user' : 'ai',
            text: turn.parts?.[0]?.text || ''
          }))
        })
      });
      const data = await res.json();
      if (data.success && data.reply) return data.reply;
    } catch (err) {
      console.error('Backend AI error, using fallback:', err);
    }

    // 2. Fallback Logic cục bộ
    const msg = userMessage.toLowerCase();
    
    if (msg.includes('danh mục') || msg.includes('loại')) {
      const categories = Array.from(new Set(products.map(p => p.categoryLabel || p.category)));
      return `Hiện tại HAVEN đang có các danh mục: **${categories.join(', ')}**. Bạn đang quan tâm mẫu nào ạ?`;
    }

    if (msg.includes('rẻ') || msg.includes('sale') || msg.includes('giảm giá') || msg.includes('flash')) {
      const cheapProducts = [...products].sort((a, b) => a.price - b.price).filter(p => p.inStock !== false).slice(0, 3);
      if (cheapProducts.length > 0) {
        const ids = cheapProducts.map(p => p.id || (p as any)._id).join(',');
        return `Dưới đây là các mẫu đang có mức giá ưu đãi tốt nhất tại HAVEN bạn nhé:\n\nSUGGEST_IDS: ${ids}`;
      }
    }

    const keywords = msg.replace(/[?.,!]/g, '').split(/\s+/).filter(w => w.length > 0 && !['tìm', 'cho', 'mình', 'tôi', 'bạn', 'có', 'không', 'ạ', 'nhé', 'xem'].includes(w));
    
    const scoredMatches = products.filter(p => p.inStock !== false).map(p => {
      const pName = p.name.toLowerCase();
      const cLabel = (p.categoryLabel || p.category || '').toLowerCase();
      let score = 0;
      const searchPhrase = keywords.join(' ');
      if (pName.includes(searchPhrase)) score += 10;
      if (cLabel.includes(searchPhrase)) score += 10;

      keywords.forEach(k => {
        if (pName.includes(k) || cLabel.includes(k)) score += 1;
      });
      return { product: p, score };
    }).filter(p => p.score > 0).sort((a, b) => b.score - a.score);

    if (scoredMatches.length > 0) {
      const top3 = scoredMatches.slice(0, 3);
      const ids = top3.map(p => p.product.id || (p.product as any)._id).join(',');
      return `Gợi ý cho bạn các mẫu phù hợp nhất tại HAVEN đây ạ:\n\nSUGGEST_IDS: ${ids}`;
    }

    return 'Dạ xin lỗi bạn, mình chưa tìm thấy sản phẩm phù hợp. Bạn có thể xem toàn bộ bộ sưu tập tại https://havenstore.io.vn/products nhé!';
  };

  // ── Xử lý gửi tin nhắn ──
  const handleSend = async (text?: string) => {
    const userMessage = (text ?? inputValue).trim();
    if (!userMessage || isLoading) return;
    if (!isReady) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    let activeSessionId = sessionId;

    try {
      if (!activeSessionId) {
        const sessionRes = await fetch(`${BACKEND_URL}/api/chats/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: user?.name || 'Khách hàng HAVEN',
            phone: user?.phone || '0900000000',
            userId: user?.id || null
          })
        });
        const sessionData = await sessionRes.json();
        if (sessionData.success && sessionData.session) {
          activeSessionId = sessionData.session.id;
          setSessionId(activeSessionId);
          localStorage.setItem('phstore-chat-session-id', activeSessionId!);
        }
      }

      if (activeSessionId) {
        fetch(`${BACKEND_URL}/api/chats/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: activeSessionId,
            sender_type: 'user',
            message: userMessage
          })
        }).catch(() => {});
      }

      const rawReply = await callGemini(userMessage);
      const { cleanReply, suggested } = parseSuggestedProducts(rawReply);

      setChatHistory((prev) => [
        ...prev,
        { role: 'user', parts: [{ text: userMessage }] },
        { role: 'model', parts: [{ text: cleanReply }] },
      ]);

      if (activeSessionId) {
        fetch(`${BACKEND_URL}/api/chats/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: activeSessionId,
            sender_type: 'bot',
            message: rawReply
          })
        }).catch(() => {});
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: cleanReply,
        sender: 'bot',
        timestamp: new Date(),
        suggestedProducts: suggested,
      };

      setMessages((prev) => [...prev, botMsg]);
      if (!isOpen) setHasUnread(true);
    } catch (err: unknown) {
      console.error('Lỗi gửi tin nhắn:', err);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        text: 'Cuộc trò chuyện đã được làm mới ✨ Bạn cần HAVEN AI tư vấn sản phẩm hay mức giá nào ạ?',
        sender: 'bot',
        timestamp: new Date(),
      }
    ]);
    setChatHistory([]);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[999990] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-[calc(100vw-32px)] sm:w-[440px] md:w-[460px] h-[580px] max-h-[calc(100dvh-100px)] bg-white text-slate-900 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] border border-slate-200/90 flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* ── HEADER NỀN TRẮNG SANG TRỌNG ── */}
            <div className="bg-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 flex-shrink-0 shadow-2xs">
              <div className="flex items-center gap-3.5">
                {/* Logo Store Avatar */}
                <div className="relative w-12 h-12 rounded-2xl bg-black border border-slate-900 p-1 flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0">
                  <Image
                    src="/haven-logo.png"
                    alt="HAVEN Logo"
                    width={40}
                    height={40}
                    className="object-contain"
                    priority
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-950">
                    HAVEN AI
                  </h3>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Trực tuyến · Trợ lý thời trang cao cấp
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 text-slate-500">
                <button
                  onClick={handleResetChat}
                  title="Làm mới đoạn chat"
                  className="p-2 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
                  aria-label="Làm mới"
                >
                  <RotateCcw size={18} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Đóng chat"
                  className="p-2 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
                  aria-label="Đóng"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* ── KHUNG TIN NHẮN NỀN TRẮNG / OFF-WHITE ── */}
            <div 
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-[#f8fafc] hide-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`flex gap-2.5 max-w-[92%] sm:max-w-[88%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar Bubble */}
                    <div className="w-8.5 h-8.5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden shadow-xs border border-slate-200">
                      {msg.sender === 'user' ? (
                        <div className="w-full h-full bg-[#0f172a] text-white font-bold flex items-center justify-center">
                          <User size={15} />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-black p-0.5 flex items-center justify-center">
                          <Image
                            src="/haven-logo.png"
                            alt="HAVEN"
                            width={24}
                            height={24}
                            className="object-contain"
                          />
                        </div>
                      )}
                    </div>

                    {/* Bubble Content */}
                    <div
                      className={`p-4 rounded-2xl shadow-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#0f172a] text-white font-medium rounded-tr-none'
                          : 'bg-white text-slate-900 border border-slate-200/90 rounded-tl-none'
                      }`}
                    >
                      <FormattedText text={msg.text} />
                      <p className={`text-[10.5px] mt-2.5 font-mono font-medium ${msg.sender === 'user' ? 'text-white/60 text-right' : 'text-slate-400'}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* ── THẺ GỢI Ý SẢN PHẨM NỀN TRẮNG ── */}
                  {msg.sender === 'bot' && msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                    <div className="ml-11 mt-3 flex flex-col gap-2.5 w-full max-w-[340px]">
                      <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Gợi ý sản phẩm phù hợp:
                      </p>
                      {msg.suggestedProducts.map((p) => (
                        <Link
                          key={p.id}
                          href={`/product/${getProductSlug(p)}`}
                          className="flex items-center gap-3.5 p-2.5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-400 shadow-2xs transition-all group"
                          onClick={() => setIsOpen(false)}
                        >
                          {p.image ? (
                            <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200">
                              <Image
                                src={p.image}
                                alt={p.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                              Ảnh
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-[#1e40af] transition-colors">
                              {p.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs sm:text-sm font-black text-[#1e40af]">
                                {p.price.toLocaleString('vi-VN')}đ
                              </span>
                              {Boolean(p.originalPrice && p.originalPrice > p.price) && (
                                <span className="text-[10px] text-slate-400 line-through">
                                  {p.originalPrice?.toLocaleString('vi-VN')}đ
                                </span>
                              )}
                            </div>
                            {p.flashSale && (
                              <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.2 bg-red-100 text-red-600 border border-red-200 rounded font-bold">
                                ⚡ FLASH SALE
                              </span>
                            )}
                          </div>
                          <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-[#0f172a] group-hover:text-white text-slate-500 flex items-center justify-center transition-all flex-shrink-0">
                            <ChevronRight size={16} />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-black p-0.5 flex items-center justify-center flex-shrink-0">
                    <Image
                      src="/haven-logo.png"
                      alt="HAVEN"
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  </div>
                  <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-slate-800 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-slate-800 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-slate-800 rounded-full animate-bounce [animation-delay:300ms]" />
                    <span className="text-xs text-slate-500 ml-2 font-medium">HAVEN AI đang soạn câu trả lời...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── GỢI Ý CÂU HỎI NHANH ── */}
            <div 
              className="px-4 py-2.5 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto flex-shrink-0 hide-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {DEFAULT_SUGGESTION_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSend(chip)}
                  disabled={isLoading}
                  className="flex-shrink-0 px-3.5 py-1.5 bg-slate-100 hover:bg-[#0f172a] hover:text-white text-slate-700 text-xs font-semibold rounded-full border border-slate-200 transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* ── KHUNG NHẬP TIN NHẮN NỀN TRẮNG ── */}
            <div className="p-3.5 sm:p-4 bg-white border-t border-slate-100 flex-shrink-0">
              <div className="relative flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Hỏi về giá, kích thước, phối đồ..."
                  disabled={isLoading}
                  className="flex-1 pl-4 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm sm:text-base text-slate-900 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all placeholder:text-slate-400 disabled:opacity-60"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isLoading}
                  className="p-3.5 bg-[#0f172a] hover:bg-[#1e40af] text-white font-bold rounded-2xl active:scale-95 transition-all disabled:opacity-40 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed flex-shrink-0 shadow-md cursor-pointer"
                  aria-label="Gửi tin nhắn"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>

              <div className="flex items-center justify-between mt-2.5 px-1 text-[11px] text-slate-400 font-medium">
                <span>HAVEN Fashion</span>
                <span>Trợ lý thời trang trực tuyến</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NÚT BẤM NỔI ĐỒNG BỘ ĐẸP MẮT (CHỈ HIỆN KHI ĐANG ĐÓNG) ── */}
      {!isOpen && (
        <motion.button
          onClick={() => {
            setIsOpen(true);
            setHasUnread(false);
          }}
          className="fixed bottom-3 sm:bottom-4 right-4 sm:right-6 z-40 flex flex-col items-center gap-1 group cursor-pointer"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ type: 'spring', bounce: 0.5, delay: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          title="HAVEN AI - Trợ lý thời trang"
        >
          {/* Logo Avatar Circle */}
          <div className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-black border-2 border-slate-900 shadow-lg flex items-center justify-center p-1.5 flex-shrink-0">
            <Image
              src="/haven-logo.png"
              alt="HAVEN Logo"
              width={30}
              height={30}
              className="object-contain"
            />
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
          </div>

          {/* Label Badge below */}
          <span className="text-[9.5px] font-bold text-slate-800 bg-white px-2 py-0.5 rounded-full shadow-xs border border-slate-200/90 whitespace-nowrap">
            HAVEN AI
          </span>

          {/* Unread badge */}
          {hasUnread && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
            </span>
          )}
        </motion.button>
      )}
    </div>
  );
}
