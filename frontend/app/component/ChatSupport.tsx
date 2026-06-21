'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, User, Bot, Loader2, Sparkles, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/component/AuthContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  categoryLabel: string;
  images: string[];
  rating: number;
  reviews: number;
  inStock: boolean;
  soldQuantity: number;
  badge?: string;
  description: string;
}

interface SuggestedProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
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
  'Sản phẩm mới nhất?',
  'Sản phẩm rẻ nhất?',
  'Đánh giá cao nhất?',
  'Hàng đang sale?',
];

export default function ChatSupport() {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi là trợ lý AI của PH Store 🛍️\nTôi có thể tư vấn sản phẩm, tìm hàng giảm giá, hoặc trả lời bất kỳ câu hỏi nào về cửa hàng. Bạn cần giúp gì?',
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
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => !!p && p.inStock)
      .slice(0, 3)
      .map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.images?.[0] || '',
        category: p.category,
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
        // Vẫn cho chat dù không load được sản phẩm
        setIsReady(true);
      }
    };
    loadProducts();
  }, []);

  // ── Load chat session from local storage on mount ──
  useEffect(() => {
    const storedSessionId = localStorage.getItem('phstore-chat-session-id');
    if (storedSessionId && isReady) {
      setSessionId(storedSessionId);
      const fetchHistory = async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/api/chats/sessions/${storedSessionId}/messages`);
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
      fetchHistory();
    }
  }, [isReady, parseSuggestedProducts]);

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
  }, [messages, isOpen]);

  // ── Focus input khi mở ──
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setHasUnread(false);
    }
  }, [isOpen]);

  // ── Dynamic Suggestion Chips ──
  const dynamicChips = React.useMemo(() => {
    if (!products || products.length === 0) return DEFAULT_SUGGESTION_CHIPS;
    
    const categories = Array.from(new Set(products.map(p => p.categoryLabel))).filter(Boolean);
    const categoryChips = categories.slice(0, 3).map(c => `Bạn có ${c.toLowerCase()} không?`);
    
    return [
      ...categoryChips,
      'Đánh giá cao nhất?',
      'Hàng đang sale?'
    ];
  }, [products]);

  // ── Build prompt cho Gemini ──
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const buildPrompt = (userMessage: string): string => {
    const productList = products
      .slice(0, 80) // giới hạn context
      .map(
        (p) =>
          `ID:${p.id} | ${p.name} | ${p.categoryLabel} | ${p.price.toLocaleString('vi-VN')}đ${
            p.originalPrice && p.originalPrice > p.price
              ? ` (gốc: ${p.originalPrice.toLocaleString('vi-VN')}đ)`
              : ''
          } | ★${p.rating} (${p.reviews} đánh giá) | Đã bán:${p.soldQuantity}${
            !p.inStock ? ' | HẾT HÀNG' : ''
          }${p.badge ? ` | ${p.badge}` : ''}`
      )
      .join('\n');

    const systemCtx = `Bạn là trợ lý tư vấn bán hàng thân thiện của PH Store - cửa hàng thời trang cao cấp.
Danh sách sản phẩm hiện có:
${productList || 'Chưa tải được dữ liệu sản phẩm.'}

QUY TẮC:
- Trả lời bằng TIẾNG VIỆT, thân thiện và ngắn gọn (tối đa 3-4 câu).
- Hiển thị giá bằng định dạng "đ" (ví dụ: 250.000đ).
- Nếu tư vấn sản phẩm, hãy liệt kê TỐI ĐA 3 sản phẩm phù hợp nhất kèm ID.
- Với câu hỏi không liên quan đến cửa hàng, hãy lịch sự từ chối và hướng dẫn về sản phẩm.
- Khi đề xuất sản phẩm, kết thúc bằng dòng: SUGGEST_IDS: id1,id2,id3`;

    let historyText = '';
    for (const turn of chatHistory) {
      const role = turn.role === 'user' ? 'Khách' : 'Trợ lý';
      historyText += `${role}: ${turn.parts[0].text}\n`;
    }

    return `${systemCtx}\n\n${historyText ? 'Lịch sử hội thoại:\n' + historyText + '\n' : ''}Khách: ${userMessage}\nTrợ lý:`;
  };

  // ── Call AI via Backend (secure) ──
  const callGemini = async (userMessage: string): Promise<string> => {
    // 1. Try Backend AI API (uses server-side API Key & system prompt)
    try {
      const productList = products
        .filter(p => p.inStock)
        .map(p => `ID:${p.id} | ${p.name} | ${p.categoryLabel} | ${p.price.toLocaleString('vi-VN')}đ${p.originalPrice ? ` (gốc: ${p.originalPrice.toLocaleString('vi-VN')}đ)` : ''}${p.badge ? ` | ${p.badge}` : ''}`)
        .join('\n');

      const res = await fetch(`${BACKEND_URL}/api/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'chat',
          messages: [...chatHistory, { role: 'user', parts: [{ text: userMessage }] }],
          productContext: productList || null
        })
      });
      const data = await res.json();
      if (data.success && data.text) return data.text;
    } catch (err) {
      console.error('Backend AI error, using fallback:', err);
    }

    // 2. Fallback Logic cục bộ (nếu API lỗi hoặc hết hạn ngạch)
    const msg = userMessage.toLowerCase();
    
    // Nếu hỏi về danh mục
    if (msg.includes('danh mục') || msg.includes('loại')) {
      const categories = Array.from(new Set(products.map(p => p.categoryLabel)));
      return `Hiện tại shop đang có các danh mục: ${categories.join(', ')}. Bạn đang tìm sản phẩm nào ạ?`;
    }

    // Nếu hỏi về giá rẻ / rẻ nhất
    if (msg.includes('rẻ') || msg.includes('sale') || msg.includes('giảm giá')) {
      const cheapProducts = [...products].sort((a, b) => a.price - b.price).filter(p => p.inStock).slice(0, 3);
      if (cheapProducts.length > 0) {
        const ids = cheapProducts.map(p => p.id).join(',');
        return `Dạ đây là các sản phẩm đang có giá tốt nhất tại shop ạ:\nSUGGEST_IDS: ${ids}`;
      }
    }

    // Nếu hỏi đánh giá cao
    if (msg.includes('đánh giá') || msg.includes('tốt nhất') || msg.includes('hot')) {
      const topProducts = [...products].sort((a, b) => b.rating - a.rating).filter(p => p.inStock).slice(0, 3);
      if (topProducts.length > 0) {
        const ids = topProducts.map(p => p.id).join(',');
        return `Dạ đây là những mẫu đang được khách hàng yêu thích và đánh giá cao nhất ạ:\nSUGGEST_IDS: ${ids}`;
      }
    }

    // Tìm kiếm sản phẩm theo từ khóa (tính điểm mức độ phù hợp)
    const keywords = msg.replace(/[?.,!]/g, '').split(/\s+/).filter(w => w.length > 0 && !['tìm', 'cho', 'mình', 'tôi', 'bạn', 'có', 'không', 'ạ', 'nhé', 'xem'].includes(w));
    
    const scoredMatches = products.filter(p => p.inStock).map(p => {
      const pName = p.name.toLowerCase();
      const cLabel = p.categoryLabel.toLowerCase();
      let score = 0;
      
      // Nếu cụm từ tìm kiếm xuất hiện nguyên vẹn trong tên thì điểm rất cao
      const searchPhrase = keywords.join(' ');
      if (pName.includes(searchPhrase)) score += 10;
      if (cLabel.includes(searchPhrase)) score += 10;

      // Tính điểm theo từng từ khóa
      keywords.forEach(k => {
        if (pName.includes(k) || cLabel.includes(k)) {
          score += 1;
        }
      });
      return { product: p, score };
    }).filter(p => p.score > 0).sort((a, b) => b.score - a.score);

    if (scoredMatches.length > 0) {
      const top3 = scoredMatches.slice(0, 3);
      const ids = top3.map(p => p.product.id).join(',');
      return `Dạ mình tìm thấy một số sản phẩm phù hợp với yêu cầu của bạn đây ạ:\nSUGGEST_IDS: ${ids}`;
    }

    // Trả lời chung chung nếu không tìm thấy
    return 'Dạ xin lỗi bạn, mình chưa tìm thấy sản phẩm phù hợp với từ khóa này. Bạn có thể nói rõ hơn bạn đang tìm áo, quần hay phụ kiện không ạ?';
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
      // 1. Tạo hoặc lấy session từ DB
      if (!activeSessionId) {
        const sessionRes = await fetch(`${BACKEND_URL}/api/chats/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: user?.name || 'Khách vãng lai',
            phone: user?.phone || '0900000000'
          })
        });
        const sessionData = await sessionRes.json();
        if (sessionData.success && sessionData.session) {
          activeSessionId = sessionData.session.id;
          setSessionId(activeSessionId);
          localStorage.setItem('phstore-chat-session-id', activeSessionId!);
        } else {
          throw new Error(sessionData.message || 'Không thể tạo phiên chat');
        }
      }

      // 2. Lưu tin nhắn user lên DB
      await fetch(`${BACKEND_URL}/api/chats/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSessionId,
          sender_type: 'user',
          message: userMessage
        })
      });

      // 3. Gọi Gemini AI
      const rawReply = await callGemini(userMessage);
      const { cleanReply, suggested } = parseSuggestedProducts(rawReply);

      // Cập nhật history cho Gemini
      setChatHistory((prev) => [
        ...prev,
        { role: 'user', parts: [{ text: userMessage }] },
        { role: 'model', parts: [{ text: cleanReply }] },
      ]);

      // 4. Lưu tin nhắn bot lên DB
      await fetch(`${BACKEND_URL}/api/chats/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSessionId,
          sender_type: 'bot',
          message: rawReply // lưu raw để sau này parse được gợi ý sản phẩm
        })
      });

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: cleanReply,
        sender: 'bot',
        timestamp: new Date(),
        suggestedProducts: suggested,
      };

      setMessages((prev) => [...prev, botMsg]);

      // Hiện badge nếu panel đang đóng
      if (!isOpen) setHasUnread(true);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định';
      
      // Fallback message if API fails (e.g., project denied, invalid key)
      const friendlyError = "Xin lỗi, hiện tại trợ lý AI đang được bảo trì hoặc kết nối API chưa ổn định. Vui lòng thử lại sau hoặc liên hệ trực tiếp qua số điện thoại cửa hàng nhé!";
      
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: friendlyError,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.22 }}
            className="mb-4 w-[350px] sm:w-[400px] h-[560px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
          >
            {/* ── Header ── */}
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Bot size={22} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold tracking-wide">PH Assistant</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isReady ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'
                      }`}
                    />
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                      {isReady ? 'AI Agent Online' : 'Đang tải...'}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                aria-label="Đóng chat"
              >
                <X size={20} />
              </button>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: msg.sender === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`flex gap-2 max-w-[88%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 ${
                        msg.sender === 'user'
                          ? 'bg-indigo-100 text-indigo-600'
                          : msg.sender === 'admin'
                            ? 'bg-amber-100 text-amber-600 border border-amber-200'
                            : 'bg-white border border-slate-100 shadow-sm text-slate-400'
                      }`}
                    >
                      {msg.sender === 'user' ? <User size={14} /> : msg.sender === 'admin' ? <Sparkles size={14} className="text-amber-500" /> : <Bot size={14} />}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                        msg.sender === 'user'
                          ? 'bg-slate-900 text-white rounded-tr-none'
                          : msg.sender === 'admin'
                            ? 'bg-indigo-50 text-indigo-900 border border-indigo-100 rounded-tl-none'
                            : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                      <p className="text-[9px] mt-1.5 text-slate-400">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* ── Suggested Products ── */}
                  {msg.sender === 'bot' && msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                    <div className="ml-9 mt-2 flex flex-col gap-2 w-full max-w-[300px]">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Gợi ý dành cho bạn:
                      </p>
                      {msg.suggestedProducts.map((p) => (
                        <Link
                          key={p.id}
                          href={`/product/${p.id}`}
                          className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-100 hover:border-indigo-400 hover:shadow-md transition-all group"
                          onClick={() => setIsOpen(false)}
                        >
                          {p.image && (
                            <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                              <Image
                                src={p.image}
                                alt={p.name}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                            <p className="text-[11px] font-semibold text-indigo-600">
                              {p.price.toLocaleString('vi-VN')}đ
                            </p>
                          </div>
                          <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-500 flex-shrink-0" />
                        </Link>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white border border-slate-100 shadow-sm text-slate-400 flex-shrink-0 mt-1">
                      <Bot size={14} />
                    </div>
                    <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none shadow-sm">
                      <div className="flex gap-1 items-center h-4">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Suggestion Chips ── */}
            <div className="px-4 py-2 bg-white border-t border-slate-50 flex gap-2 overflow-x-auto flex-shrink-0 scrollbar-hide">
              {dynamicChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSend(chip)}
                  disabled={isLoading}
                  className="flex-shrink-0 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[11px] font-medium rounded-full transition-colors disabled:opacity-50"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* ── Input ── */}
            <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0">
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
                  placeholder="Hỏi về sản phẩm, size, giá..."
                  disabled={isLoading}
                  className="flex-1 pl-4 pr-4 py-3 bg-slate-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400 disabled:opacity-60"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isLoading}
                  className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all disabled:opacity-40 disabled:bg-slate-300 disabled:cursor-not-allowed flex-shrink-0"
                  aria-label="Gửi"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
              <p className="text-[10px] text-center text-slate-400 mt-2.5 font-medium uppercase tracking-widest flex items-center justify-center gap-1.5">
                <Sparkles size={10} className="text-indigo-400" />
                Powered by Gemini AI · PH Store
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Float Toggle Button ── */}
      <motion.button
        onClick={() => {
          setIsOpen(!isOpen);
          setHasUnread(false);
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 ${
          isOpen ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
        aria-label={isOpen ? 'Đóng chat' : 'Mở chat'}
      >
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        </motion.div>

        {/* Unread badge */}
        {hasUnread && !isOpen && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"
          />
        )}
      </motion.button>
    </div>
  );
}
