/* eslint-disable */
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut,
    Menu, X, Bell, User, Star, Palette, Ruler,
    ChevronRight, Search, MoreHorizontal, Zap, Home,
    Bot, Gift, MessageSquare, History, Ticket, CreditCard, Truck, Sun, Moon,
    Boxes, FileDown, Tag, Grid, Box, Image as ImageIcon, CheckCircle, Store, Database, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/app/component/AuthContext';
import { AdminToastProvider } from './components/AdminToast';

// ─── Menu Definition ──────────────────────────────────────────────────────────
const MENU_ITEMS = [
    { icon: LayoutDashboard, label: 'Dashboard',     href: '/admin',                   group: 'main' },
    { icon: Package,         label: 'Sản phẩm',      href: '/admin/products',          group: 'main' },
    { icon: ShoppingCart,    label: 'Đơn hàng',      href: '/admin/orders',            group: 'main' },
    { icon: Users,           label: 'Người dùng',    href: '/admin/users',             group: 'main' },
    
    // Kho hàng (WMS)
    { icon: LayoutDashboard, label: 'Tổng quan Kho', href: '/admin/inventory',         group: 'inventory' },
    { icon: Boxes,           label: 'Tồn kho',       href: '/admin/inventory/stock',   group: 'inventory' },
    { icon: FileDown,        label: 'Phiếu Kho',     href: '/admin/inventory/receipts',group: 'inventory' },
    { icon: History,         label: 'Nhật ký kho',   href: '/admin/inventory/transactions',group: 'inventory' },
    { icon: Truck,           label: 'Nhà cung cấp',  href: '/admin/inventory/suppliers',group: 'inventory' },
    
    { icon: Star,            label: 'Đánh giá',      href: '/admin/reviews',           group: 'catalog' },
    { icon: MessageSquare,   label: 'Live Chat',     href: '/admin/chats',             group: 'catalog' },
    { icon: Package,         label: 'Danh mục',      href: '/admin/categories',        group: 'catalog' },
    { icon: ImageIcon,       label: 'Banners',       href: '/admin/banners',           group: 'catalog' },
    { icon: Palette,         label: 'Màu sắc',       href: '/admin/colors',            group: 'catalog' },
    { icon: Ruler,           label: 'Kích thước',    href: '/admin/sizes',             group: 'catalog' },
    { icon: Zap,             label: 'Flash Sale',    href: '/admin/flash-sales',       group: 'store' },
    { icon: Ticket,          label: 'Mã giảm giá',  href: '/admin/coupons',           group: 'store' },
    { icon: Gift,            label: 'Vòng quay',     href: '/admin/lucky-wheel',       group: 'store' },
    { icon: Bot,             label: 'Cấu hình AI',   href: '/admin/ai-settings',       group: 'store' },
    { icon: CreditCard,      label: 'Thanh toán',    href: '/admin/payment-methods',   group: 'store' },
    { icon: Truck,           label: 'Vận chuyển',    href: '/admin/shipping-methods',  group: 'store' },
    { icon: Settings,        label: 'Cài đặt',       href: '/admin/settings',          group: 'store' },
];

const GROUPS = [
    { key: 'main',    label: 'Chính' },
    { key: 'inventory', label: 'Quản lý kho (WMS)' },
    { key: 'catalog', label: 'Sản phẩm' },
    { key: 'store',   label: 'Cửa hàng' },
];

// Bottom nav items for mobile
const BOTTOM_NAV = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
    { icon: ShoppingCart,    label: 'Đơn hàng',  href: '/admin/orders' },
    { icon: Package,         label: 'Sản phẩm',  href: '/admin/products' },
    { icon: History,         label: 'Kho',        href: '/admin/inventory' },
    { icon: MoreHorizontal,  label: 'Thêm',       href: '#more' },
];

// ─── Sidebar NavItem ──────────────────────────────────────────────────────────
function NavItem({
    item,
    isActive,
    collapsed,
    onClick,
}: {
    item: typeof MENU_ITEMS[0];
    isActive: boolean;
    collapsed: boolean;
    onClick?: () => void;
}) {
    return (
        <Link
            href={item.href}
            onClick={onClick}
            title={collapsed ? item.label : undefined}
            className={`
                relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                transition-all duration-200 group select-none
                ${isActive
                    ? 'text-white font-semibold'
                    : 'font-medium'
                }
            `}
            style={{
                color: isActive ? '#fff' : 'var(--adm-sidebar-text)',
                backgroundColor: isActive ? 'var(--adm-primary)' : 'transparent',
            }}
            onMouseEnter={e => {
                if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--adm-sidebar-hover)';
            }}
            onMouseLeave={e => {
                if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            }}
        >
            {/* Active indicator */}
            {isActive && (
                <span
                    className="absolute left-0 inset-y-0 w-0.5 rounded-r-full"
                    style={{ background: 'rgba(255,255,255,0.5)' }}
                />
            )}

            <item.icon
                size={18}
                className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
            />

            <AnimatePresence>
                {!collapsed && (
                    <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm truncate overflow-hidden whitespace-nowrap"
                    >
                        {item.label}
                    </motion.span>
                )}
            </AnimatePresence>

            {/* Tooltip for collapsed sidebar */}
            {collapsed && (
                <div
                    className="
                        absolute left-full ml-3 top-1/2 -translate-y-1/2
                        px-3 py-1.5 rounded-lg text-xs font-semibold
                        whitespace-nowrap pointer-events-none
                        opacity-0 group-hover:opacity-100
                        transition-all duration-200 translate-x-1 group-hover:translate-x-0
                        z-50 shadow-xl
                    "
                    style={{ background: 'var(--adm-text)', color: 'var(--adm-surface)' }}
                >
                    {item.label}
                    <span
                        className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent"
                        style={{ borderRightColor: 'var(--adm-text)' }}
                    />
                </div>
            )}
        </Link>
    );
}

// ─── Sidebar Content ──────────────────────────────────────────────────────────
function SidebarContent({
    collapsed,
    pathname,
    onNavigate,
    onLogout,
}: {
    collapsed: boolean;
    pathname: string;
    onNavigate?: () => void;
    onLogout: () => void;
}) {
    return (
        <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--adm-sidebar-bg)' }}>
            {/* Logo */}
            <div
                className="flex items-center gap-3 px-4 h-16 flex-shrink-0 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
            >
                <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
                    <Store size={16} className="text-white" />
                </div>
                <AnimatePresence>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <p className="text-white font-bold text-sm tracking-widest uppercase leading-none">
                                PH Store
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--adm-sidebar-text)' }}>
                                Admin Panel
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto adm-sidebar-scroll py-4 px-2">
                {GROUPS.map(group => {
                    const items = MENU_ITEMS.filter(m => m.group === group.key);
                    return (
                        <div key={group.key} className="mb-5">
                            {!collapsed && (
                                <p
                                    className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest"
                                    style={{ color: 'rgba(255,255,255,0.25)' }}
                                >
                                    {group.label}
                                </p>
                            )}
                            <div className="space-y-0.5">
                                {items.map(item => (
                                    <NavItem
                                        key={item.href}
                                        item={item}
                                        isActive={pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))}
                                        collapsed={collapsed}
                                        onClick={onNavigate}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Bottom: User + Logout */}
            <div
                className="flex-shrink-0 border-t p-3 space-y-1"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
            >
                <Link
                    href="/"
                    onClick={onNavigate}
                    title={collapsed ? 'Về trang chủ' : undefined}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium"
                    style={{ color: 'var(--adm-sidebar-text)' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--adm-sidebar-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                    <Home size={18} className="flex-shrink-0" />
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-sm truncate"
                            >
                                Về trang chủ
                            </motion.span>
                        )}
                    </AnimatePresence>
                </Link>

                <button
                    onClick={onLogout}
                    title={collapsed ? 'Đăng xuất' : undefined}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-rose-400 hover:text-rose-300"
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.12)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                    <LogOut size={18} className="flex-shrink-0" />
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-sm truncate"
                            >
                                Đăng xuất
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </div>
    );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();

    // States
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [moreMenuOpen, setMoreMenuOpen] = useState(false);

    // Auth guard
    React.useEffect(() => {
        const storedStr = localStorage.getItem('phstore-user');
        if (!storedStr) {
            router.push('/login');
            return;
        }
        try {
            const parsed = JSON.parse(storedStr);
            // Zustand bọc data trong `state`, còn code cũ thì lưu trực tiếp
            const userObj = parsed?.state?.user || parsed;
            if (!userObj || userObj.role !== 'admin') {
                router.push('/login');
            }
        } catch {
            router.push('/login');
        }
    }, [router]);

    // Dark mode init from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('admin-dark-mode');
        const isDark = saved === 'true';
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDarkMode(isDark);
        if (isDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, []);

    // Dark mode toggle
    const toggleDarkMode = useCallback(() => {
        setDarkMode(prev => {
            const next = !prev;
            localStorage.setItem('admin-dark-mode', String(next));
            if (next) document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');
            return next;
        });
    }, []);

    // Responsive detection
    useEffect(() => {
        const checkBreakpoint = () => {
            const w = window.innerWidth;
            setIsMobile(w < 768);
            setIsTablet(w >= 768 && w < 1024);
            if (w >= 1024) {
                setDrawerOpen(false);
                setSidebarCollapsed(w < 1280);
            }
        };
        checkBreakpoint();
        window.addEventListener('resize', checkBreakpoint);
        return () => window.removeEventListener('resize', checkBreakpoint);
    }, []);
    // Close drawer on route change
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDrawerOpen(false);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMoreMenuOpen(false);
    }, [pathname]);
    // Prevent body scroll when drawer open
    useEffect(() => {
        if (drawerOpen || moreMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [drawerOpen, moreMenuOpen]);

    const handleLogout = useCallback(() => {
        logout();
        router.push('/login');
    }, [logout, router]);

    const currentPageLabel = MENU_ITEMS.find(item =>
        item.href === pathname || (item.href !== '/admin' && pathname.startsWith(item.href))
    )?.label || 'Dashboard';

    if (!user || user.role !== 'admin') return null;

    // Sidebar width for desktop/tablet
    const sidebarWidth = (isMobile || isTablet) ? 0 : (sidebarCollapsed ? 72 : 260);

    return (
        <AdminToastProvider>
            <div
                className="min-h-screen adm-main-scroll"
                style={{ backgroundColor: 'var(--adm-bg)', color: 'var(--adm-text)' }}
            >
                {/* ─ DESKTOP/TABLET SIDEBAR ─ */}
                {!isMobile && (
                    <aside
                        className="fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out overflow-hidden"
                        style={{ width: sidebarWidth, minWidth: sidebarWidth }}
                    >
                        <SidebarContent
                            collapsed={sidebarCollapsed && !isTablet ? false : (isTablet ? true : sidebarCollapsed)}
                            pathname={pathname}
                            onLogout={handleLogout}
                        />
                    </aside>
                )}

                {/* ─ MOBILE DRAWER ─ */}
                <AnimatePresence>
                    {isMobile && drawerOpen && (
                        <>
                            {/* Overlay */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="adm-drawer-overlay"
                                onClick={() => setDrawerOpen(false)}
                            />
                            {/* Drawer */}
                            <motion.aside
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'tween', duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                className="fixed inset-y-0 left-0 z-50 overflow-hidden"
                                style={{ width: 280 }}
                            >
                                {/* Close button */}
                                <button
                                    onClick={() => setDrawerOpen(false)}
                                    className="absolute top-4 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
                                    style={{ color: 'var(--adm-sidebar-text)', backgroundColor: 'rgba(255,255,255,0.08)' }}
                                    aria-label="Đóng menu"
                                >
                                    <X size={16} />
                                </button>
                                <SidebarContent
                                    collapsed={false}
                                    pathname={pathname}
                                    onNavigate={() => setDrawerOpen(false)}
                                    onLogout={handleLogout}
                                />
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>

                {/* ─ MORE MENU OVERLAY (Mobile bottom nav) ─ */}
                <AnimatePresence>
                    {isMobile && moreMenuOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="adm-drawer-overlay"
                                onClick={() => setMoreMenuOpen(false)}
                            />
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'tween', duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                className="fixed bottom-16 left-0 right-0 z-50 rounded-t-3xl overflow-hidden shadow-2xl"
                                style={{ backgroundColor: 'var(--adm-surface)', borderTop: '1px solid var(--adm-border)' }}
                            >
                                <div className="p-4">
                                    <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: 'var(--adm-border)' }} />
                                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--adm-text-muted)' }}>
                                        Danh mục khác
                                    </p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {MENU_ITEMS.filter(m => !BOTTOM_NAV.slice(0,4).map(b => b.href).includes(m.href)).map(item => (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setMoreMenuOpen(false)}
                                                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-95"
                                                style={{
                                                    backgroundColor: pathname === item.href || pathname.startsWith(item.href) ? 'var(--adm-primary-light)' : 'var(--adm-surface-2)',
                                                    color: pathname === item.href || pathname.startsWith(item.href) ? 'var(--adm-primary)' : 'var(--adm-text-muted)',
                                                }}
                                            >
                                                <item.icon size={20} />
                                                <span className="text-[10px] font-semibold text-center leading-tight">{item.label}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* ─ MAIN CONTENT ─ */}
                <div
                    className="flex flex-col min-h-screen transition-all duration-300"
                    style={{ marginLeft: !isMobile ? sidebarWidth : 0 }}
                >
                    {/* ─ STICKY HEADER ─ */}
                    <header
                        className="sticky top-0 z-20 h-16 flex items-center justify-between px-4 md:px-6 gap-3 backdrop-blur-xl"
                        style={{
                            backgroundColor: 'var(--adm-header-bg)',
                            borderBottom: '1px solid var(--adm-header-border)',
                        }}
                    >
                        {/* Left: hamburger (mobile) / toggle (desktop) + breadcrumb */}
                        <div className="flex items-center gap-3 min-w-0">
                            {isMobile ? (
                                <button
                                    onClick={() => setDrawerOpen(true)}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors flex-shrink-0"
                                    style={{ color: 'var(--adm-text-muted)', backgroundColor: 'var(--adm-surface-2)' }}
                                    aria-label="Mở menu"
                                >
                                    <Menu size={20} />
                                </button>
                            ) : (
                                <button
                                    onClick={() => setSidebarCollapsed(p => !p)}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors flex-shrink-0"
                                    style={{ color: 'var(--adm-text-muted)', backgroundColor: 'var(--adm-surface-2)' }}
                                    aria-label="Thu/Mở sidebar"
                                >
                                    <Menu size={18} />
                                </button>
                            )}

                            {/* Breadcrumb */}
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-xs hidden sm:block flex-shrink-0" style={{ color: 'var(--adm-text-subtle)' }}>
                                    Admin
                                </span>
                                <ChevronRight size={12} className="hidden sm:block flex-shrink-0" style={{ color: 'var(--adm-text-subtle)' }} />
                                <h1 className="text-sm font-bold truncate" style={{ color: 'var(--adm-text)' }}>
                                    {currentPageLabel}
                                </h1>
                            </div>
                        </div>

                        {/* Right: actions */}
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                            {/* Dark mode toggle */}
                            <button
                                onClick={toggleDarkMode}
                                className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:scale-105"
                                style={{ color: 'var(--adm-text-muted)', backgroundColor: 'var(--adm-surface-2)' }}
                                aria-label={darkMode ? 'Chế độ sáng' : 'Chế độ tối'}
                                title={darkMode ? 'Chế độ sáng' : 'Chế độ tối'}
                            >
                                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                            </button>

                            {/* Notification bell */}
                            <div className="relative">
                                <button
                                    onClick={() => setNotifOpen(p => !p)}
                                    className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
                                    style={{ color: 'var(--adm-text-muted)', backgroundColor: 'var(--adm-surface-2)' }}
                                    aria-label="Thông báo"
                                >
                                    <Bell size={16} />
                                    <span
                                        className="absolute top-2 right-2 w-2 h-2 rounded-full border-2"
                                        style={{ backgroundColor: 'var(--adm-primary)', borderColor: 'var(--adm-surface)' }}
                                    />
                                </button>
                                <AnimatePresence>
                                    {notifOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 top-full mt-2 w-72 rounded-2xl shadow-2xl overflow-hidden z-50"
                                            style={{ backgroundColor: 'var(--adm-surface)', border: '1px solid var(--adm-border)' }}
                                        >
                                            <div className="p-4 border-b" style={{ borderColor: 'var(--adm-border)' }}>
                                                <p className="text-sm font-bold" style={{ color: 'var(--adm-text)' }}>Thông báo</p>
                                            </div>
                                            <div className="py-6 text-center">
                                                <Bell size={24} className="mx-auto mb-2" style={{ color: 'var(--adm-text-subtle)' }} />
                                                <p className="text-xs" style={{ color: 'var(--adm-text-muted)' }}>Chưa có thông báo mới</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                {notifOpen && (
                                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                                )}
                            </div>

                            {/* User avatar */}
                            <div
                                className="flex items-center gap-2 pl-2 sm:pl-3 ml-1 sm:ml-2 border-l"
                                style={{ borderColor: 'var(--adm-border)' }}
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs font-bold leading-none" style={{ color: 'var(--adm-text)' }}>
                                        {user?.name || 'Admin'}
                                    </p>
                                    <p className="text-[10px] mt-0.5 font-semibold uppercase tracking-wider" style={{ color: 'var(--adm-text-subtle)' }}>
                                        Manager
                                    </p>
                                </div>
                                <div
                                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: 'var(--adm-primary)', color: '#fff' }}
                                >
                                    <User size={14} />
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* ─ PAGE BODY ─ */}
                    <main
                        className="flex-1 p-4 md:p-6 lg:p-7"
                        style={{ paddingBottom: isMobile ? '80px' : undefined }}
                    >
                        {children}
                    </main>
                </div>

                {/* ─ STICKY BOTTOM NAVIGATION (mobile only) ─ */}
                {isMobile && (
                    <nav className="adm-bottom-nav">
                        <div className="flex items-center">
                            {BOTTOM_NAV.map((item) => {
                                const isMore = item.href === '#more';
                                const isActive = isMore
                                    ? moreMenuOpen
                                    : (item.href === '/admin'
                                        ? pathname === item.href
                                        : pathname.startsWith(item.href));
                                return (
                                    <button
                                        key={item.href}
                                        onClick={() => {
                                            if (isMore) {
                                                setMoreMenuOpen(p => !p);
                                            }
                                        }}
                                        className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-all active:scale-90"
                                        aria-label={item.label}
                                        aria-current={isActive ? 'page' : undefined}
                                    >
                                        {isMore ? (
                                            <>
                                                <item.icon
                                                    size={20}
                                                    style={{ color: isActive ? 'var(--adm-primary)' : 'var(--adm-text-muted)' }}
                                                />
                                                <span
                                                    className="text-[10px] font-semibold"
                                                    style={{ color: isActive ? 'var(--adm-primary)' : 'var(--adm-text-muted)' }}
                                                >
                                                    {item.label}
                                                </span>
                                            </>
                                        ) : (
                                            <Link
                                                href={item.href}
                                                className="flex flex-col items-center gap-1 w-full"
                                                onClick={() => setMoreMenuOpen(false)}
                                            >
                                                <div className="relative">
                                                    <item.icon
                                                        size={20}
                                                        style={{ color: isActive ? 'var(--adm-primary)' : 'var(--adm-text-muted)' }}
                                                    />
                                                    {isActive && (
                                                        <motion.span
                                                            layoutId="bottom-nav-indicator"
                                                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                                                            style={{ backgroundColor: 'var(--adm-primary)' }}
                                                        />
                                                    )}
                                                </div>
                                                <span
                                                    className="text-[10px] font-semibold"
                                                    style={{ color: isActive ? 'var(--adm-primary)' : 'var(--adm-text-muted)' }}
                                                >
                                                    {item.label}
                                                </span>
                                            </Link>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </nav>
                )}
            </div>
        </AdminToastProvider>
    );
}
