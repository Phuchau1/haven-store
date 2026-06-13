'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
    Search, 
    Send, 
    User, 
    Bot, 
    Sparkles, 
    Check, 
    Clock, 
    Phone, 
    MessageSquare, 
    Loader2, 
    AlertCircle, 
    Lock,
    Unlock,
    HelpCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface ChatSession {
    id: string;
    customer_name: string;
    phone: string;
    status: 'open' | 'closed';
    createdAt: string;
    updatedAt: string;
}

interface ChatMessage {
    id: string;
    session_id: string;
    sender_type: 'user' | 'bot' | 'admin';
    message: string;
    createdAt: string;
}

const QUICK_REPLIES = [
    'Chào bạn! Mình có thể giúp gì cho bạn ạ? 🛍️',
    'Sản phẩm này hiện đang còn hàng và đủ size bạn nha!',
    'Bạn cho shop xin chiều cao và cân nặng để shop tư vấn size chuẩn nhất nhé!',
    'Dạ shop hỗ trợ đổi trả miễn phí trong 7 ngày nếu không vừa size ạ.'
];

export default function AdminChats() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('open');
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. Fetch sessions
    const fetchSessions = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/chats/sessions`);
            const data = await res.json();
            if (data.success && Array.isArray(data.sessions)) {
                setSessions(data.sessions);
            }
        } catch (error) {
            console.error('Error fetching chat sessions:', error);
        } finally {
            setLoadingSessions(false);
        }
    };

    useEffect(() => {
        fetchSessions();
        const interval = setInterval(fetchSessions, 6000);
        return () => clearInterval(interval);
    }, []);

    // 2. Fetch messages when a session is selected
    const fetchMessages = async (sessionId: string, silent = false) => {
        if (!silent) setLoadingMessages(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/chats/sessions/${sessionId}/messages`);
            const data = await res.json();
            if (data.success && Array.isArray(data.messages)) {
                setMessages(data.messages);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            if (!silent) setLoadingMessages(false);
        }
    };

    useEffect(() => {
        if (selectedSession) {
            fetchMessages(selectedSession.id);
        } else {
            setMessages([]);
        }
    }, [selectedSession?.id]);

    // 3. Poll messages for the active session to see user texts real-time
    useEffect(() => {
        if (!selectedSession) return;

        const pollInterval = setInterval(() => {
            fetchMessages(selectedSession.id, true);
        }, 3000);

        return () => clearInterval(pollInterval);
    }, [selectedSession?.id]);

    // 4. Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 5. Send admin message
    const handleSend = async (textToSend?: string) => {
        const msgText = (textToSend ?? inputValue).trim();
        if (!msgText || !selectedSession || sending) return;

        setSending(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/chats/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: selectedSession.id,
                    sender_type: 'admin',
                    message: msgText
                })
            });
            const data = await res.json();
            if (data.success && data.message) {
                setMessages(prev => [...prev, data.message]);
                setInputValue('');
                // Cập nhật lại session list để đẩy lên đầu
                fetchSessions();
            }
        } catch (error) {
            console.error('Error sending admin message:', error);
        } finally {
            setSending(false);
        }
    };

    // 6. Close/Resolve session
    const handleToggleSessionStatus = async (session: ChatSession) => {
        const newStatus = session.status === 'open' ? 'closed' : 'open';
        try {
            const endpoint = newStatus === 'closed' 
                ? `${BACKEND_URL}/api/chats/sessions/${session.id}/close`
                : `${BACKEND_URL}/api/chats/session`; // Gửi POST để mở lại/lấy session
            
            const method = newStatus === 'closed' ? 'PUT' : 'POST';
            const body = newStatus === 'closed' 
                ? undefined 
                : JSON.stringify({ customer_name: session.customer_name, phone: session.phone });

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body
            });
            const data = await res.json();
            if (data.success) {
                const updatedSession = newStatus === 'closed' ? data.session : data.session;
                setSelectedSession(updatedSession);
                fetchSessions();
            }
        } catch (error) {
            console.error('Error updating session status:', error);
        }
    };

    // Filters & Search
    const filteredSessions = sessions.filter(session => {
        const matchesSearch = 
            session.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            session.phone.includes(searchTerm);
        
        const matchesFilter = 
            filterStatus === 'all' || 
            session.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    // Helper: format distance to now safely
    const formatTime = (isoString: string) => {
        try {
            return formatDistanceToNow(new Date(isoString), { addSuffix: true, locale: vi });
        } catch {
            return 'vừa xong';
        }
    };

    return (
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden h-[76vh] flex">
            {/* Sidebar Sessions List */}
            <div className="w-80 border-r border-slate-100 flex flex-col flex-shrink-0 bg-slate-50/50">
                {/* Search & Filters */}
                <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm khách hàng, sđt..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                    </div>
                    <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
                        {(['open', 'closed', 'all'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${
                                    filterStatus === status 
                                        ? 'bg-slate-900 text-white shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {status === 'open' ? 'Đang mở' : status === 'closed' ? 'Đã đóng' : 'Tất cả'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sessions Scrollable */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100/50">
                    {loadingSessions && sessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-slate-400 gap-2">
                            <Loader2 className="animate-spin" size={20} />
                            <span className="text-xs font-medium">Đang tải danh sách...</span>
                        </div>
                    ) : filteredSessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-slate-400 gap-1.5 text-center">
                            <AlertCircle size={18} />
                            <span className="text-xs font-semibold">Không tìm thấy hội thoại nào</span>
                        </div>
                    ) : (
                        filteredSessions.map((session) => {
                            const isSelected = selectedSession?.id === session.id;
                            return (
                                <button
                                    key={session.id}
                                    onClick={() => setSelectedSession(session)}
                                    className={`w-full text-left p-4 flex gap-3 transition-colors ${
                                        isSelected 
                                            ? 'bg-indigo-50/60 border-l-4 border-indigo-600' 
                                            : 'hover:bg-slate-100/60'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                                        isSelected 
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                                            : 'bg-slate-200 text-slate-600'
                                    }`}>
                                        {session.customer_name.substring(0, 1).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-bold text-slate-800 truncate">{session.customer_name}</p>
                                            <span className="text-[9px] text-slate-400 font-medium">
                                                {formatTime(session.updatedAt)}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                                            <Phone size={10} />
                                            {session.phone}
                                        </p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wide ${
                                                session.status === 'open'
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                    : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                <span className={`w-1 h-1 rounded-full ${session.status === 'open' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                                {session.status === 'open' ? 'Active' : 'Closed'}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Board Details Pane */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedSession ? (
                    <>
                        {/* Selected Session Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-indigo-600/10">
                                    {selectedSession.customer_name.substring(0,1).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900">{selectedSession.customer_name}</p>
                                    <p className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                                        <Phone size={10} /> {selectedSession.phone}
                                    </p>
                                </div>
                            </div>
                            
                            <button
                                onClick={() => handleToggleSessionStatus(selectedSession)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                                    selectedSession.status === 'open'
                                        ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'
                                        : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'
                                }`}
                            >
                                {selectedSession.status === 'open' ? (
                                    <>
                                        <Lock size={12} />
                                        Đóng phiên chat
                                    </>
                                ) : (
                                    <>
                                        <Unlock size={12} />
                                        Mở lại phiên
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Messages Content scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20">
                            {loadingMessages ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                                    <Loader2 className="animate-spin" size={24} />
                                    <span className="text-xs font-medium">Đang tải tin nhắn...</span>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-1.5">
                                    <HelpCircle size={24} />
                                    <span className="text-xs font-semibold">Chưa có tin nhắn nào trong phiên này</span>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isAdmin = msg.sender_type === 'admin';
                                    const isBot = msg.sender_type === 'bot';
                                    
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                                        >
                                            <div className={`flex gap-2.5 max-w-[75%] ${isAdmin ? 'flex-row-reverse' : ''}`}>
                                                {/* Sender Indicator */}
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 border text-sm ${
                                                    isAdmin 
                                                        ? 'bg-indigo-100 text-indigo-600 border-indigo-200' 
                                                        : isBot 
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                            : 'bg-slate-100 text-slate-600 border-slate-200'
                                                }`}>
                                                    {isAdmin ? <User size={14} /> : isBot ? <Bot size={14} /> : <User size={14} />}
                                                </div>

                                                {/* Text bubble */}
                                                <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm whitespace-pre-wrap ${
                                                    isAdmin
                                                        ? 'bg-indigo-600 text-white rounded-tr-none'
                                                        : isBot
                                                            ? 'bg-emerald-50/80 text-emerald-900 border border-emerald-100 rounded-tl-none font-mono'
                                                            : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                                                }`}>
                                                    {isBot && (
                                                        <div className="flex items-center gap-1 mb-1 text-[9px] font-bold text-emerald-700 uppercase tracking-widest">
                                                            <Sparkles size={10} />
                                                            AI Suggestion
                                                        </div>
                                                    )}
                                                    {msg.message}
                                                    <p className={`text-[9px] mt-1.5 ${isAdmin ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Replies Panel */}
                        <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex gap-2 overflow-x-auto flex-shrink-0 scrollbar-hide">
                            {QUICK_REPLIES.map((reply, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(reply)}
                                    disabled={selectedSession.status === 'closed' || sending}
                                    className="flex-shrink-0 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold rounded-full hover:border-indigo-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
                                >
                                    {reply}
                                </button>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0">
                            <div className="relative flex items-center gap-3">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    disabled={selectedSession.status === 'closed' || sending}
                                    placeholder={selectedSession.status === 'closed' ? 'Mở lại phiên chat để tiếp tục trò chuyện' : 'Nhập tin nhắn trả lời khách hàng...'}
                                    className="flex-1 pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all placeholder:text-slate-400 disabled:opacity-60"
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={(!inputValue.trim() && !sending) || selectedSession.status === 'closed' || sending}
                                    className="p-3 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all disabled:opacity-40 disabled:bg-slate-300 disabled:cursor-not-allowed flex-shrink-0"
                                    aria-label="Gửi"
                                >
                                    {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/10">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-md shadow-indigo-600/5 mb-4">
                            <MessageSquare size={32} />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">Trung tâm Hỗ trợ Live Chat</h4>
                        <p className="text-xs text-slate-400 max-w-[280px] mt-1.5 leading-relaxed font-medium">
                            Chọn một phiên trò chuyện từ danh sách bên trái để phản hồi và chăm sóc khách hàng trực tuyến.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
