'use client';
// ===== SMART HEADER — Hide on scroll down, show on scroll up =====
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingBag, Search, Menu, X, Heart, User,
    LayoutDashboard, LogOut, ChevronDown,
} from 'lucide-react';
import { useCart } from '@/app/component/CartContext';
import { useAuth } from '@/app/component/AuthContext';
import { useFavoritesStore } from '@/app/store/useFavoritesStore';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────
interface MenuNode {
    id: string;
    title: string;
    link: string;
    order: number;
    isActive: boolean;
    children?: MenuNode[];
}

// ─── Desktop Dropdown Item ─────────────────────────────────────────────────────
function DesktopMenuItem({ menu }: { menu: MenuNode }) {
    const hasSubs = menu.children && menu.children.length > 0;
    const isMegaMenu = menu.children?.some(child => child.children && child.children.length > 0);
    const [open, setOpen] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleEnter = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setOpen(true);
    };
    const handleLeave = () => {
        timerRef.current = setTimeout(() => setOpen(false), 120);
    };

    if (!hasSubs) {
        return (
            <Link
                href={menu.link}
                className="relative text-[18px] font-semibold tracking-wide text-gray-800 hover:text-[#C9A227] transition-colors group px-4 py-1 whitespace-nowrap"
            >
                {menu.title}
                <span className="absolute bottom-0 left-2 right-2 h-[1.5px] bg-[#C9A227] scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
        );
    }

    return (
        <div
            className="relative"
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
        >
            <Link
                href={menu.link}
                className={`relative flex items-center gap-1 text-[18px] font-semibold tracking-wide transition-colors px-4 py-1 whitespace-nowrap group ${open ? 'text-[#C9A227]' : 'text-gray-800 hover:text-[#C9A227]'}`}
            >
                {menu.title}
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={16} />
                </motion.span>
                <span className={`absolute bottom-0 left-2 right-2 h-[1.5px] bg-[#C9A227] transition-transform duration-300 ${open ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
            </Link>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className={`absolute top-full pt-4 z-50 ${isMegaMenu ? 'w-[750px] -translate-x-1/4' : 'min-w-[200px] left-0'}`}
                        onMouseEnter={handleEnter}
                        onMouseLeave={handleLeave}
                    >
                        <div className={`bg-white shadow-2xl py-2 overflow-hidden border border-gray-100 ${isMegaMenu ? 'p-8 flex flex-row gap-8' : ''}`}>
                            {isMegaMenu ? (
                                [...(menu.children || [])]
                                    .filter(s => s.isActive)
                                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                                    .map(col => (
                                        <div key={col.id} className="flex-1">
                                            <h3 className="font-bold text-[15px] text-black mb-4 pb-2 border-b border-gray-100">
                                                <Link href={col.link} onClick={() => setOpen(false)} className="hover:text-[#C9A227] transition-colors">
                                                    {col.title}
                                                </Link>
                                            </h3>
                                            <div className="flex flex-col gap-2.5">
                                                {[...(col.children || [])]
                                                    .filter(s => s.isActive)
                                                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                                                    .map(item => (
                                                        <Link
                                                            key={item.id}
                                                            href={item.link}
                                                            className="text-[14px] text-gray-600 hover:text-[#C9A227] transition-colors"
                                                            onClick={() => setOpen(false)}
                                                        >
                                                            {item.title}
                                                        </Link>
                                                    ))}
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                [...(menu.children || [])]
                                    .filter(s => s.isActive)
                                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                                    .map(sub => (
                                        <Link
                                            key={sub.id}
                                            href={sub.link}
                                            className="block px-6 py-2.5 text-[15px] text-gray-600 hover:text-[#C9A227] hover:bg-gray-50 transition-colors"
                                            onClick={() => setOpen(false)}
                                        >
                                            {sub.title}
                                        </Link>
                                    ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Mobile Category Accordion ─────────────────────────────────────────────────
function MobileMenuItem({ menu, onClose, level = 1 }: { menu: MenuNode; onClose: () => void, level?: number }) {
    const hasSubs = menu.children && menu.children.length > 0;
    const [open, setOpen] = useState(false);

    if (!hasSubs) {
        return (
            <Link
                href={menu.link}
                className={`block py-3 px-5 text-base font-medium text-gray-800 hover:text-black hover:bg-gray-50 rounded-xl transition-colors ${level > 1 ? 'pl-10 text-sm' : ''} ${level > 2 ? 'pl-14 text-[13px] text-gray-600' : ''}`}
                onClick={onClose}
            >
                {menu.title}
            </Link>
        );
    }

    return (
        <div className={`rounded-xl overflow-hidden ${level === 1 ? 'mb-1' : ''}`}>
            <button
                onClick={() => setOpen(p => !p)}
                className={`w-full flex items-center justify-between py-3 px-5 text-base font-medium text-gray-800 hover:bg-gray-50 transition-colors ${level > 1 ? 'pl-10 text-sm bg-gray-50 font-semibold text-black' : ''} ${level > 2 ? 'pl-14 text-[13px] font-medium text-gray-700' : ''}`}
            >
                <span>{menu.title}</span>
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={16} />
                </motion.span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        className={`overflow-hidden ${level === 1 ? 'bg-gray-50' : 'bg-gray-100'} rounded-b-xl`}
                    >
                        {[...(menu.children || [])]
                            .filter(s => s.isActive)
                            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                            .map(sub => (
                                <MobileMenuItem key={sub.id} menu={sub} onClose={onClose} level={level + 1} />
                            ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Main Header ──────────────────────────────────────────────────────────────
export default function Header() {
    const { totalItems, toggleCart } = useCart();
    const { user, logout, isAdmin } = useAuth();
    const { favorites } = useFavoritesStore();
    const router = useRouter();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [navMenus, setNavMenus] = useState<MenuNode[]>([]);

    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Close user menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // ── Smart scroll state ──────────────────────────────────────────────────
    const [isScrolled, setIsScrolled] = useState(false);   // nền mờ khi cuộn
    const [isVisible, setIsVisible] = useState(true);       // ẩn/hiện header

    const lastScrollY = useRef(0);
    const rafId = useRef<number | null>(null);
    const SCROLL_THRESHOLD = 80; // kích hoạt sau 80px đầu
    const SCROLL_DELTA = 4;      // độ nhạy: cần cuộn ít nhất 4px

    const handleScroll = useCallback(() => {
        if (rafId.current !== null) return; // throttle bằng rAF
        rafId.current = requestAnimationFrame(() => {
            const currentY = window.scrollY;
            const delta = currentY - lastScrollY.current;

            // Luôn hiện khi ở đầu trang
            if (currentY <= SCROLL_THRESHOLD) {
                setIsVisible(true);
                setIsScrolled(false);
            } else {
                setIsScrolled(true);
                if (delta > SCROLL_DELTA) {
                    // Cuộn xuống → ẩn header
                    setIsVisible(false);
                    // Đóng mobile menu khi ẩn
                    setIsMobileMenuOpen(false);
                } else if (delta < -SCROLL_DELTA) {
                    // Cuộn lên → hiện header
                    setIsVisible(true);
                }
            }

            lastScrollY.current = currentY;
            rafId.current = null;
        });
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (rafId.current !== null) cancelAnimationFrame(rafId.current);
        };
    }, [handleScroll]);

    // ── Fetch menus ────────────────────────────────────────────────────────
    useEffect(() => {
        const sanitizeMenuLink = (link: string) => {
            if (!link) return '';
            if (link.startsWith('/products?discount=')) {
                const val = link.replace('/products?discount=', '');
                if (val === 'true') return '/khuyen-mai/giam-gia';
                return `/khuyen-mai/giam-gia-${val}`;
            }
            if (link === '/products?discounted=true' || link === '/collections/sale') {
                return '/khuyen-mai/giam-gia';
            }
            return link;
        };

        const sanitizeNodes = (nodes: MenuNode[]): MenuNode[] => {
            return nodes.map(node => ({
                ...node,
                link: sanitizeMenuLink(node.link),
                children: node.children ? sanitizeNodes(node.children) : undefined
            }));
        };

        const fetchMenus = async () => {
            try {
                const res = await fetch('/api/menus?active=true');
                const data = await res.json();
                if (data.success && data.menus) {
                    setNavMenus(sanitizeNodes(data.menus));
                }
            } catch {
                // Fallback — nav still works
            }
        };
        fetchMenus();
    }, []);

    return (
        <>
            {/* ── Fixed smart header ────────────────────────────────────────── */}
            <header
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    zIndex: 9999,
                    transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
                    transition: 'transform 0.32s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease, box-shadow 0.3s ease',
                    willChange: 'transform',
                    backgroundColor: isScrolled ? 'rgba(255,255,255,0.97)' : '#ffffff',
                    backdropFilter: isScrolled ? 'blur(12px)' : 'none',
                    WebkitBackdropFilter: isScrolled ? 'blur(12px)' : 'none',
                    boxShadow: isScrolled
                        ? '0 4px 24px rgba(0,0,0,0.09)'
                        : '0 1px 0 rgba(0,0,0,0.06)',
                }}
            >
                {/* Top announcement bar */}
                <div className="bg-black text-white text-center py-2.5 text-xs tracking-[3px] uppercase font-light">
                    Miễn phí vận chuyển cho đơn hàng từ 500.000đ 🚚
                </div>

                {/* Main nav */}
                <div className="container-torano">
                    <div
                        className="grid items-center"
                        style={{
                            gridTemplateColumns: '1fr auto 1fr',
                            height: 'var(--header-nav-height, 80px)',
                            transition: 'height 0.3s ease',
                        }}
                    >
                        {/* ── Left: Logo + Mobile button ─────────────────── */}
                        <div className="flex items-center gap-2" style={{ gridColumn: 1 }}>
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-all"
                                aria-label="Menu"
                            >
                                {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                            </button>
                            <Link href="/" className="flex items-center overflow-visible" style={{ height: 'var(--header-logo-height, 72px)', padding: '6px 0' }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="/logo-new.png"
                                    alt="HAVEN"
                                    className="max-h-full h-auto w-auto object-contain hover:opacity-80 transition-opacity duration-300 drop-shadow-sm"
                                />
                            </Link>
                        </div>

                        {/* ── Center: Desktop Navigation ────────────────── */}
                        <nav className="hidden lg:flex items-center justify-center gap-1">
                            {navMenus.map(menu => (
                                <DesktopMenuItem key={menu.id} menu={menu} />
                            ))}
                        </nav>

                        {/* ── Right: Action Icons ───────────────────────── */}
                        <div className="flex items-center justify-end gap-1 lg:gap-2 header-actions-group" style={{ gridColumn: 3 }}>
                            {/* Search */}
                            <button
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className={`flex items-center justify-center p-2 rounded-full transition-all duration-200 ${isSearchOpen ? 'bg-[#111111] text-white' : 'hover:bg-gray-100 text-black hover:text-[#C9A227]'}`}
                                aria-label="Tìm kiếm"
                            >
                                <Search size={22} strokeWidth={2} />
                            </button>

                            {/* Wishlist */}
                            <Link href="/yeu-thich" className="relative flex items-center justify-center p-2 hover:bg-gray-100 rounded-full transition-all duration-200 text-black hover:text-[#C9A227]" aria-label="Yêu thích">
                                <Heart size={22} strokeWidth={2} />
                                <AnimatePresence>
                                    {favorites.length > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="absolute -top-1 -right-1 bg-rose-600 text-white text-[11px] min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full font-bold border-2 border-white box-content shadow-sm leading-none"
                                        >
                                            {favorites.length}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </Link>

                            {/* User */}
                            <div ref={userMenuRef} className="relative group/user flex items-center justify-center">
                                {user ? (
                                    <>
                                        <button 
                                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                            aria-label="Tài khoản" 
                                            className="flex items-center justify-center p-2 hover:bg-gray-100 rounded-full transition-all text-black hover:text-[#C9A227]"
                                        >
                                            <User size={22} strokeWidth={2} />
                                        </button>
                                        <div 
                                            className={`absolute right-0 top-full pt-2 transition-all duration-300 z-50 ${
                                                isUserMenuOpen 
                                                    ? 'opacity-100 translate-y-0 pointer-events-auto' 
                                                    : 'opacity-0 translate-y-2 pointer-events-none lg:group-hover/user:opacity-100 lg:group-hover/user:translate-y-0 lg:group-hover/user:pointer-events-auto'
                                            }`}
                                        >
                                            <div className="w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2">
                                                <div className="px-4 py-2 border-b border-gray-100 mb-1">
                                                    <p className="text-xs text-gray-500">Xin chào,</p>
                                                    <p className="text-sm font-bold truncate">{user.name}</p>
                                                </div>
                                                {isAdmin && (
                                                    <Link 
                                                        href="/admin" 
                                                        onClick={() => setIsUserMenuOpen(false)}
                                                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#C9A227] hover:bg-[#C9A227]/10 rounded-xl transition-all"
                                                    >
                                                        <LayoutDashboard size={18} /> Trang Quản Trị
                                                    </Link>
                                                )}
                                                <Link 
                                                    href="/nguoidung" 
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                                                >
                                                    <User size={18} /> Tài khoản
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        logout();
                                                        setIsUserMenuOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-all border-t border-gray-50 mt-1"
                                                >
                                                    <LogOut size={18} /> Đăng xuất
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <Link href="/login" className="flex items-center justify-center p-2 hover:bg-gray-100 rounded-full transition-all text-black hover:text-[#C9A227]" aria-label="Tài khoản">
                                        <User size={22} strokeWidth={2} />
                                    </Link>
                                )}
                            </div>

                            {/* Cart */}
                            <motion.button
                                onClick={toggleCart}
                                className="relative flex items-center justify-center p-2 hover:bg-gray-100 rounded-full transition-colors text-black hover:text-[#C9A227]"
                                whileTap={{ scale: 0.9 }}
                                aria-label="Giỏ hàng"
                            >
                                <ShoppingBag size={22} strokeWidth={2} />
                                <AnimatePresence>
                                    {totalItems > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="absolute -top-1 -right-1 bg-[#C9A227] text-white text-[10px] min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full font-bold border-2 border-white box-content shadow-sm leading-none"
                                        >
                                            {totalItems}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* ── Search Bar ─────────────────────────────────────────── */}
                <AnimatePresence>
                    {isSearchOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.28 }}
                            className="border-t border-gray-100 overflow-hidden bg-white"
                        >
                            <div className="max-w-2xl mx-auto px-4 py-4">
                                <div className="relative">
                                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Bạn đang tìm kiếm gì hôm nay?"
                                        className="w-full pl-12 pr-4 py-4 bg-gray-100/80 border-0 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-black/5 transition-all font-medium shadow-inner"
                                        autoFocus
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                const q = (e.target as HTMLInputElement).value.trim();
                                                if (q) { router.push(`/products?search=${encodeURIComponent(q)}`); setIsSearchOpen(false); }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Mobile Menu ───────────────────────────────────────── */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="lg:hidden border-t border-gray-100 overflow-hidden bg-white"
                        >
                            <nav className="px-4 py-4 space-y-1 max-h-[70vh] overflow-y-auto">
                                {navMenus.map(menu => (
                                    <MobileMenuItem key={menu.id} menu={menu} onClose={() => setIsMobileMenuOpen(false)} />
                                ))}
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* ── Spacer: chừa khoảng trống đúng bằng chiều cao header ── */}
            <div
                aria-hidden="true"
                style={{ height: 'var(--header-total-height, 120px)', flexShrink: 0 }}
            />
        </>
    );
}
