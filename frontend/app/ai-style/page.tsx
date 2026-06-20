'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, RotateCcw, ShoppingBag, Loader2, ChevronRight, Bot, User, Star, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { generateText, buildStylePrompt } from '@/lib/gemini';

interface Product {
    id: string;
    name: string;
    price: number;
    images: string[];
    category?: string;
}

function formatPrice(p: number) {
    return p.toLocaleString('vi-VN') + 'đ';
}

function parseMarkdown(text: string) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br/>');
}

const OCCASIONS = ['Đi làm văn phòng', 'Đi chơi cuối tuần', 'Hẹn hò', 'Tiệc / Sự kiện', 'Đi học', 'Thể thao', 'Du lịch', 'Dạo phố'];
const STYLES = ['Minimalist / Tối giản', 'Streetwear / Năng động', 'Smart Casual', 'Formal / Lịch sự', 'Bohemian', 'Vintage / Cổ điển', 'Sporty', 'Romantic'];
const BUDGETS = ['Dưới 300.000đ', '300.000 - 600.000đ', '600.000 - 1.000.000đ', 'Trên 1.000.000đ'];
const COLORS = ['Trung tính (đen/trắng/be)', 'Màu pastel', 'Màu tối / Đậm', 'Màu sáng / Neon', 'Earth tones', 'Multicolor / Họa tiết'];
const GENDERS = ['Nam', 'Nữ', 'Unisex'];

interface Message {
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
    products?: Product[];
}

export default function AIStylePage() {
    const [messages, setMessages] = useState<Message[]>([{
        role: 'ai',
        content: '👋 Xin chào! Tôi là **AI Stylist** của PH Store.\n\nHãy cho tôi biết phong cách bạn muốn — tôi sẽ tư vấn outfit phù hợp và gợi ý sản phẩm từ bộ sưu tập của chúng tôi! ✨\n\nBạn có thể dùng form bên dưới hoặc gõ trực tiếp câu hỏi.',
        timestamp: new Date(),
    }]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(true);
    const [freeInput, setFreeInput] = useState('');
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Form state
    const [form, setForm] = useState({
        occasion: '',
        style: '',
        budget: '',
        colors: '',
        gender: '',
        additionalInfo: '',
    });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchRelatedProducts = async (keywords: string[]) => {
        try {
            const query = keywords.slice(0, 2).join(' ');
            const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=6`);
            const data = await res.json();
            return data.products || [];
        } catch { return []; }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.gender || !form.style || !form.occasion) return;

        const userMsg = `Tôi muốn tư vấn phong cách cho dịp: **${form.occasion}**, style: **${form.style}**, ngân sách: **${form.budget || 'linh hoạt'}**, màu sắc yêu thích: **${form.colors || 'đa dạng'}**, giới tính: **${form.gender}**.${form.additionalInfo ? ` Thêm: ${form.additionalInfo}` : ''}`;

        const userMessage: Message = { role: 'user', content: userMsg, timestamp: new Date() };
        setMessages(prev => [...prev, userMessage]);
        setShowForm(false);
        setLoading(true);

        const prompt = buildStylePrompt(form);
        const aiText = await generateText(prompt);

        // Extract keywords from response for product search
        const keywords = [form.style, form.occasion].filter(Boolean);
        const products = await fetchRelatedProducts(keywords);
        setRelatedProducts(products);

        const aiMessage: Message = {
            role: 'ai',
            content: aiText,
            timestamp: new Date(),
            products: products.slice(0, 6),
        };
        setMessages(prev => [...prev, aiMessage]);
        setLoading(false);
    };

    const handleFreeInput = async () => {
        if (!freeInput.trim() || loading) return;
        const text = freeInput.trim();
        setFreeInput('');

        const userMessage: Message = { role: 'user', content: text, timestamp: new Date() };
        setMessages(prev => [...prev, userMessage]);
        setLoading(true);
        setShowForm(false);

        const fullPrompt = `Bạn là AI Stylist của PH Store - thương hiệu thời trang cao cấp Việt Nam. Trả lời bằng tiếng Việt, thân thiện, sử dụng emoji, tối đa 300 từ.\n\nKhách hàng hỏi: "${text}"`;
        const aiText = await generateText(fullPrompt);

        const aiMessage: Message = { role: 'ai', content: aiText, timestamp: new Date() };
        setMessages(prev => [...prev, aiMessage]);
        setLoading(false);
    };

    const resetChat = () => {
        setMessages([{
            role: 'ai',
            content: '👋 Xin chào lại! Tôi sẵn sàng tư vấn phong cách cho bạn. Hãy điền form hoặc chat trực tiếp nhé! ✨',
            timestamp: new Date(),
        }]);
        setShowForm(true);
        setForm({ occasion: '', style: '', budget: '', colors: '', gender: '', additionalInfo: '' });
        setRelatedProducts([]);
    };

    const SelectChip = ({ label, value, field }: { label: string; value: string; field: keyof typeof form }) => (
        <button
            type="button"
            onClick={() => setForm(f => ({ ...f, [field]: f[field] === value ? '' : value }))}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${form[field] === value
                ? 'bg-amber-400 text-white border-amber-400 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-600'
                }`}
        >
            {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-white to-purple-50/20">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-40 backdrop-blur-sm bg-white/90">
                <div className="container-torano py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
                                <ChevronRight size={18} className="rotate-180" />
                            </Link>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                    <Sparkles size={16} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="font-black text-gray-900 text-lg leading-tight">AI Gợi Ý Phong Cách</h1>
                                    <p className="text-xs text-gray-400">Powered by Gemini AI</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={resetChat} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100">
                            <RotateCcw size={14} /> Chat mới
                        </button>
                    </div>
                </div>
            </div>

            <div className="container-torano py-6 max-w-5xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Chat area */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        {/* Messages */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="h-[60vh] overflow-y-auto p-5 space-y-4">
                                {messages.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                    >
                                        {/* Avatar */}
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'ai' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gray-900'}`}>
                                            {msg.role === 'ai'
                                                ? <Bot size={14} className="text-white" />
                                                : <User size={14} className="text-white" />
                                            }
                                        </div>

                                        <div className={`flex-1 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                                            {/* Bubble */}
                                            <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'ai'
                                                ? 'bg-gray-50 text-gray-800 rounded-tl-sm'
                                                : 'bg-gray-900 text-white rounded-tr-sm'
                                                }`}>
                                                <div
                                                    dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
                                                />
                                            </div>

                                            {/* Product suggestions */}
                                            {msg.products && msg.products.length > 0 && (
                                                <div className="w-full">
                                                    <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                                                        <ShoppingBag size={12} /> Sản phẩm gợi ý từ PH Store
                                                    </p>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {msg.products.map(p => (
                                                            <Link key={p.id} href={`/product/${p.id}`}
                                                                className="group rounded-xl overflow-hidden border border-gray-100 hover:border-amber-300 hover:shadow-md transition-all bg-white"
                                                            >
                                                                <div className="relative h-20 bg-gray-50">
                                                                    <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
                                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                                        <ExternalLink size={16} className="text-white" />
                                                                    </div>
                                                                </div>
                                                                <div className="p-1.5">
                                                                    <p className="text-[10px] font-semibold text-gray-700 line-clamp-2">{p.name}</p>
                                                                    <p className="text-[10px] text-amber-600 font-bold">{formatPrice(p.price)}</p>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}

                                {loading && (
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                            <Bot size={14} className="text-white" />
                                        </div>
                                        <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3">
                                            <div className="flex gap-1 items-center h-5">
                                                {[0, 1, 2].map(i => (
                                                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400"
                                                        animate={{ y: [0, -4, 0] }}
                                                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Free text input */}
                            <div className="border-t border-gray-100 p-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Hỏi thêm về phong cách, phối đồ..."
                                        value={freeInput}
                                        onChange={e => setFreeInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleFreeInput()}
                                        disabled={loading}
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-400 transition-colors disabled:bg-gray-50"
                                    />
                                    <motion.button
                                        onClick={handleFreeInput}
                                        disabled={!freeInput.trim() || loading}
                                        whileTap={{ scale: 0.92 }}
                                        className="px-4 py-2.5 rounded-xl bg-purple-500 text-white flex items-center gap-1.5 text-sm font-bold hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right panel: Form + Quick tips */}
                    <div className="space-y-4">
                        {/* Style Form */}
                        <AnimatePresence>
                            {showForm && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
                                >
                                    <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                                        <Sparkles size={16} className="text-purple-500" />
                                        Tư vấn phong cách
                                    </h3>

                                    <form onSubmit={handleFormSubmit} className="space-y-4">
                                        {/* Gender */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Giới tính *</label>
                                            <div className="flex flex-wrap gap-2">
                                                {GENDERS.map(g => <SelectChip key={g} label={g} value={g} field="gender" />)}
                                            </div>
                                        </div>

                                        {/* Occasion */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Dịp mặc *</label>
                                            <div className="flex flex-wrap gap-2">
                                                {OCCASIONS.map(o => <SelectChip key={o} label={o} value={o} field="occasion" />)}
                                            </div>
                                        </div>

                                        {/* Style */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Phong cách *</label>
                                            <div className="flex flex-wrap gap-2">
                                                {STYLES.map(s => <SelectChip key={s} label={s} value={s} field="style" />)}
                                            </div>
                                        </div>

                                        {/* Budget */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Ngân sách</label>
                                            <div className="flex flex-wrap gap-2">
                                                {BUDGETS.map(b => <SelectChip key={b} label={b} value={b} field="budget" />)}
                                            </div>
                                        </div>

                                        {/* Colors */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Màu sắc yêu thích</label>
                                            <div className="flex flex-wrap gap-2">
                                                {COLORS.map(c => <SelectChip key={c} label={c} value={c} field="colors" />)}
                                            </div>
                                        </div>

                                        {/* Additional info */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Ghi chú thêm</label>
                                            <textarea
                                                placeholder="VD: Tôi cao 1m65, thích phong cách minimalist..."
                                                value={form.additionalInfo}
                                                onChange={e => setForm(f => ({ ...f, additionalInfo: e.target.value }))}
                                                rows={2}
                                                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-400 resize-none transition-colors"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={!form.gender || !form.style || !form.occasion || loading}
                                            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 shadow-lg shadow-purple-200"
                                        >
                                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                            Nhận gợi ý AI
                                        </button>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!showForm && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="w-full py-2.5 rounded-xl border-2 border-dashed border-purple-200 text-purple-500 text-sm font-bold hover:bg-purple-50 transition-colors"
                            >
                                + Tư vấn mới
                            </button>
                        )}

                        {/* Quick suggestions */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                                <Star size={14} className="text-amber-400" /> Hỏi nhanh
                            </h3>
                            <div className="space-y-2">
                                {[
                                    'Outfit đi làm văn phòng mùa hè?',
                                    'Phối đồ đi chơi cuối tuần nam tính?',
                                    'Màu sắc nào hợp với da ngăm?',
                                    'Cách phối đồ để trông cao hơn?',
                                    'Outfit hẹn hò cho nữ thanh lịch?',
                                ].map(q => (
                                    <button
                                        key={q}
                                        onClick={() => { setFreeInput(q); }}
                                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors border border-transparent hover:border-purple-100"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* AI Try-On CTA */}
                        <Link href="/ai-tryon" className="block bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl p-5 text-white hover:shadow-lg transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className="text-3xl">👗</div>
                                <div>
                                    <p className="font-black text-sm">AI Thử Đồ</p>
                                    <p className="text-white/80 text-xs mt-0.5">Upload ảnh và thử đồ với AI</p>
                                </div>
                                <ChevronRight size={18} className="ml-auto opacity-70" />
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Related products from chat */}
                {relatedProducts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <ShoppingBag size={18} className="text-purple-500" />
                                Sản phẩm phù hợp với phong cách của bạn
                            </h3>
                            <Link href="/products" className="text-sm text-purple-500 hover:underline font-medium">Xem tất cả →</Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                            {relatedProducts.map(p => (
                                <Link key={p.id} href={`/product/${p.id}`}
                                    className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all"
                                >
                                    <div className="relative h-28 bg-gray-50">
                                        <Image src={p.images[0]} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                    </div>
                                    <div className="p-2">
                                        <p className="text-xs font-semibold text-gray-700 line-clamp-2">{p.name}</p>
                                        <p className="text-xs text-amber-600 font-bold mt-1">{formatPrice(p.price)}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
