'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Loader2, Sparkles, ChevronRight, RotateCcw, Trash2, Bot, Phone, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/component/AuthContext';
import { getProductSlug, formatPrice, cleanProductTitle } from '@/lib/format';

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
  'Flash Sale hôm nay?',
  'Sản phẩm dưới 300k',
  'Áo Polo hot nhất',
  'Gợi ý phối đồ đi làm',
  'Chính sách đổi trả',
];

// Helper render text with simple markdown (bold + links + high contrast)
function FormattedText({ text, isUser = false }: { text: string; isUser?: boolean }) {
  const parts = text.split('\n');
  return (
    <div className={`space-y-1.5 text-[13px] leading-relaxed font-normal ${isUser ? 'text-white' : 'text-slate-800'}`}>
      {parts.map((line, lIdx) => {
        if (!line.trim()) return <div key={lIdx} className="h-1" />;

        // Bold formatting **text**
        const formattedTokens = line.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s]+)/g).map((token, tIdx) => {
          if (token.startsWith('**') && token.endsWith('**')) {
            return (
              <strong key={tIdx} className={`font-bold ${isUser ? 'text-white' : 'text-slate-950'}`}>
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
                className={`underline font-bold transition-colors break-all ${isUser ? 'text-blue-200 hover:text-white' : 'text-[#1e40af] hover:text-blue-800'}`}
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
      .slice(0, 8)
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

  // ── Poll for admin responses without overwriting active conversation ──
  useEffect(() => {
    if (!isOpen || !sessionId) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/chats/sessions/${sessionId}/messages`);
        const data = await res.json();
        if (data.success && Array.isArray(data.messages) && data.messages.length > 0) {
          const hasNewAdminMsg = data.messages.some((m: any) => m.sender_type === 'admin' && !messages.some(curr => curr.id === m.id));
          if (hasNewAdminMsg) {
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
        // Silently handle polling error
      }
    }, 6000);

    return () => clearInterval(pollInterval);
  }, [isOpen, sessionId, messages, parseSuggestedProducts]);

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

  // ── Call AI via Backend (Gemini RAG) with Fast Fallback (<1s response) ──
  const callGemini = async (userMessage: string): Promise<string> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout for fast response

    try {
      const res = await fetch(`${BACKEND_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: userMessage,
          history: chatHistory.map(turn => ({
            role: turn.role === 'user' ? 'user' : 'ai',
            text: turn.parts?.[0]?.text || ''
          }))
        })
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.success && data.reply) return data.reply;
    } catch {
      clearTimeout(timeoutId);
    }

    // 2. Siêu Tốc: Smart Fallback Logic cục bộ chạy dưới 50ms
    const msg = userMessage.toLowerCase();
    
    if (msg.includes('danh mục') || msg.includes('loại')) {
      const categories = Array.from(new Set(products.map(p => p.categoryLabel || p.category)));
      return `Hiện tại HAVEN đang có các danh mục: **${categories.join(', ')}**. Bạn đang quan tâm mẫu nào ạ?`;
    }

    if (msg.includes('rẻ') || msg.includes('sale') || msg.includes('giảm giá') || msg.includes('flash')) {
      const saleProducts = [...products]
        .filter(p => p.inStock !== false && (p.flashSale || (p.originalPrice && p.originalPrice > p.price)))
        .sort((a, b) => a.price - b.price)
        .slice(0, 5);

      const fallbackList = saleProducts.length > 0 ? saleProducts : [...products].sort((a, b) => a.price - b.price).slice(0, 5);
      if (fallbackList.length > 0) {
        const ids = fallbackList.map(p => p.id || (p as any)._id).join(',');
        return `Dưới đây là các mẫu đang có mức giá ưu đãi Flash Sale tốt nhất tại HAVEN bạn nhé:\n\nSUGGEST_IDS: ${ids}`;
      }
    }

    // Lọc theo ngân sách (vd: dưới 300k, dưới 500k)
    const priceUnderMatch = msg.match(/dưới\s*(\d+)\s*k?/i);
    if (priceUnderMatch) {
      const numStr = priceUnderMatch[1];
      const maxP = (parseInt(numStr, 10) < 1000 ? parseInt(numStr, 10) * 1000 : parseInt(numStr, 10));
      const underProducts = products.filter(p => p.inStock !== false && p.price <= maxP).slice(0, 5);
      if (underProducts.length > 0) {
        const ids = underProducts.map(p => p.id || (p as any)._id).join(',');
        return `Gợi ý các sản phẩm phù hợp với mức giá dưới ${maxP.toLocaleString('vi-VN')}đ tại HAVEN:\n\nSUGGEST_IDS: ${ids}`;
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
      const topMatches = scoredMatches.slice(0, 5);
      const ids = topMatches.map(p => p.product.id || (p.product as any)._id).join(',');
      return `Gợi ý cho bạn các mẫu phù hợp nhất tại HAVEN đây ạ:\n\nSUGGEST_IDS: ${ids}`;
    }

    return 'Dạ HAVEN có rất nhiều bộ sưu tập mới và ưu đãi. Bạn có thể xem toàn bộ sản phẩm tại https://havenstore.io.vn/products nhé!';
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

  // ── Thêm gợi ý sản phẩm nổi bật vào tin nhắn chào mừng ban đầu ──
  useEffect(() => {
    if (products.length > 0) {
      const topPicks = [...products]
        .filter((p) => p.inStock !== false)
        .slice(0, 5)
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

      setMessages((prev) => {
        if (prev.length === 1 && prev[0].id === '1' && (!prev[0].suggestedProducts || prev[0].suggestedProducts.length === 0)) {
          return [
            {
              ...prev[0],
              suggestedProducts: topPicks,
            },
          ];
        }
        return prev;
      });
    }
  }, [products]);

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[999990] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.94 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-[calc(100vw-32px)] sm:w-[380px] md:w-[410px] lg:w-[25vw] lg:min-w-[360px] lg:max-w-[430px] h-[570px] sm:h-[610px] lg:h-[640px] max-h-[calc(100dvh-32px)] bg-white text-slate-900 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.22)] border border-slate-200 flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* ── HEADER DEEP NAVY SANG TRỌNG ── */}
            <div className="bg-[#0a192f] text-white px-4 py-3.5 flex items-center justify-between flex-shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                {/* Bot Avatar */}
                <div className="relative w-10 h-10 rounded-2xl bg-white text-[#0a192f] flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0 p-1">
                  <Image
                    src="/haven-logo.png"
                    alt="HAVEN Logo"
                    width={32}
                    height={32}
                    className="object-contain"
                    priority
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                </div>

                <div>
                  <h3 className="text-[15px] font-bold tracking-tight text-white flex items-center gap-1.5">
                    Trợ Lý AI HAVEN
                  </h3>
                  <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Sẵn sàng hỗ trợ 24/7
                  </p>
                </div>
              </div>

              {/* Action Buttons: Trash & Close in Circular Glass Pills */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleResetChat}
                  title="Xóa lịch sử chat"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Xóa đoạn chat"
                >
                  <Trash2 size={15} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Đóng cửa sổ"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Đóng"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* ── KHUNG TIN NHẮN NỀN TRẮNG / OFF-WHITE RỘNG RÃI ── */}
            <div 
              className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 bg-[#f8fafc] hide-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`flex gap-2.5 max-w-[94%] sm:max-w-[90%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar Bubble */}
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden shadow-xs border border-slate-200">
                      {msg.sender === 'user' ? (
                        <div className="w-full h-full bg-[#0a192f] text-white font-bold flex items-center justify-center">
                          <User size={14} />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-black p-0.5 flex items-center justify-center">
                          <Image
                            src="/haven-logo.png"
                            alt="HAVEN"
                            width={22}
                            height={22}
                            className="object-contain"
                          />
                        </div>
                      )}
                    </div>

                    {/* Bubble Content */}
                    <div
                      className={`p-3 sm:p-3.5 rounded-2xl shadow-2xs leading-relaxed font-sans ${
                        msg.sender === 'user'
                          ? 'bg-[#0a192f] text-white rounded-tr-none'
                          : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
                      }`}
                    >
                      <FormattedText text={msg.text} isUser={msg.sender === 'user'} />
                      <p className={`text-[10px] mt-1.5 font-sans font-medium tracking-tight ${msg.sender === 'user' ? 'text-white/70 text-right' : 'text-slate-400'}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* ── THẺ GỢI Ý SẢN PHẨM: 1 HÀNG 2 SẢN PHẨM DỄ THAO TÁC ── */}
                  {msg.sender === 'bot' && msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                    <div className="ml-9 sm:ml-10 mt-2 flex flex-col gap-1.5 w-full max-w-[calc(100%-36px)] sm:max-w-[calc(100%-40px)]">
                      <div className="flex items-center gap-1 px-0.5">
                        <Sparkles size={11} className="text-amber-500" />
                        <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          Sản phẩm gợi ý ({msg.suggestedProducts.length}):
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {msg.suggestedProducts.slice(0, 4).map((p) => (
                          <Link
                            key={p.id}
                            href={`/product/${getProductSlug(p)}`}
                            className="bg-white hover:bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-400 p-2 shadow-2xs transition-all flex flex-col group cursor-pointer"
                            onClick={() => setIsOpen(false)}
                          >
                            <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-slate-100 mb-1.5 border border-slate-100">
                              {p.image ? (
                                <Image
                                  src={p.image}
                                  alt={p.name}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                                  HAVEN
                                </div>
                              )}
                              {p.flashSale && (
                                <span className="absolute top-1 left-1 text-[7.5px] font-black px-1.5 py-0.5 bg-red-600 text-white rounded shadow-xs">
                                  FLASH SALE
                                </span>
                              )}
                            </div>
                            <p className="text-[11.5px] font-medium text-slate-800 line-clamp-1 group-hover:text-slate-950 transition-colors">
                              {cleanProductTitle(p.name)}
                            </p>
                            <div className="flex items-baseline gap-1 mt-0.5 flex-wrap">
                              <span className={`text-[11.5px] font-bold ${p.flashSale || (p.originalPrice && p.originalPrice > p.price) ? 'text-[#dc2626]' : 'text-slate-900'}`}>
                                {formatPrice(p.price)}
                              </span>
                              {Boolean(p.originalPrice && p.originalPrice > p.price) && (
                                <span className="text-[9px] text-slate-400 font-normal line-through">
                                  {formatPrice(p.originalPrice || 0)}
                                </span>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-black p-0.5 flex items-center justify-center flex-shrink-0">
                    <Image
                      src="/haven-logo.png"
                      alt="HAVEN"
                      width={22}
                      height={22}
                      className="object-contain"
                    />
                  </div>
                  <div className="bg-white border border-slate-200 px-3.5 py-2.5 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-slate-800 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-slate-800 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-slate-800 rounded-full animate-bounce [animation-delay:300ms]" />
                    <span className="text-xs text-slate-500 ml-1.5 font-medium">HAVEN AI đang phản hồi...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── GỢI Ý CÂU HỎI NHANH (TINH GỌN, KHÔNG ICON RỐI MẮT) ── */}
            <div 
              className="px-3.5 py-2.5 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto flex-shrink-0 hide-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {DEFAULT_SUGGESTION_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSend(chip)}
                  disabled={isLoading}
                  className="flex-shrink-0 px-3 py-1.5 bg-slate-50 hover:bg-[#0a192f] hover:text-white text-slate-700 text-xs font-semibold rounded-full border border-slate-200 transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* ── KHUNG NHẬP TIN NHẮN DẠNG PILL HIỆN ĐẠI ── */}
            <div className="p-3 sm:p-3.5 bg-white border-t border-slate-100 flex-shrink-0">
              <div className="relative flex items-center gap-2 bg-slate-100/90 border border-slate-200 rounded-full p-1.5 pl-4 focus-within:border-slate-900 focus-within:bg-white focus-within:ring-1 focus-within:ring-slate-900 transition-all shadow-inner">
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
                  placeholder="Nhập câu hỏi (giá, size, phối đồ...)"
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 disabled:opacity-60 font-medium"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isLoading}
                  className="w-9 h-9 rounded-full bg-[#0a192f] hover:bg-[#1e40af] text-white flex items-center justify-center active:scale-95 transition-all disabled:opacity-40 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed flex-shrink-0 shadow-md cursor-pointer"
                  aria-label="Gửi tin nhắn"
                >
                  {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                </button>
              </div>

              <div className="text-center mt-2 text-[10.5px] text-slate-400 font-medium">
                Cung cấp bởi <span className="font-semibold text-slate-600">⚡ HAVEN AI Assistant</span>
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
