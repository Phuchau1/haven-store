'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Home, Users, FileText, ShoppingCart, History } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
    { name: 'Dashboard',      href: '/admin/inventory',                    icon: LayoutDashboard },
    { name: 'Quản lý Kho',   href: '/admin/inventory/warehouses',         icon: Home            },
    { name: 'Nhà cung cấp',  href: '/admin/inventory/suppliers',          icon: Users           },
    { name: 'Đơn mua hàng',  href: '/admin/inventory/purchase-orders',    icon: ShoppingCart    },
    { name: 'Phiếu kho',     href: '/admin/inventory/receipts',           icon: FileText        },
    { name: 'Lịch sử kho',   href: '/admin/inventory/transactions',       icon: History         },
];

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [tooltip, setTooltip] = useState<string | null>(null);

    return (
        <div className="space-y-6">
            {/* ── Tab Bar ── */}
            <nav
                role="tablist"
                aria-label="Inventory navigation"
                style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
                className="flex items-center gap-1 overflow-x-auto rounded-2xl border p-1.5 shadow-sm scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {tabs.map((tab) => {
                    const isActive =
                        tab.href === '/admin/inventory'
                            ? pathname === tab.href
                            : pathname.startsWith(tab.href);

                    return (
                        <div
                            key={tab.href}
                            className="relative flex-shrink-0"
                            onMouseEnter={() => setTooltip(tab.href)}
                            onMouseLeave={() => setTooltip(null)}
                        >
                            <Link
                                href={tab.href}
                                role="tab"
                                aria-selected={isActive}
                                className={[
                                    'relative flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-150 outline-none focus-visible:ring-2',
                                    'min-h-[44px]',
                                    isActive
                                        ? 'text-[var(--adm-primary)]'
                                        : 'text-[var(--adm-text-muted)] hover:text-[var(--adm-text)] hover:bg-[var(--adm-surface-2)]',
                                ].join(' ')}
                            >
                                {/* Active background pill */}
                                {isActive && (
                                    <motion.span
                                        layoutId="inventory-tab-bg"
                                        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                                        className="absolute inset-0 rounded-xl"
                                        style={{ backgroundColor: 'var(--adm-primary-light)' }}
                                    />
                                )}

                                {/* Icon — always visible */}
                                <tab.icon
                                    size={16}
                                    className="relative z-10 flex-shrink-0"
                                    aria-hidden="true"
                                />

                                {/* Label — hidden on mobile, shown md+ */}
                                <span className="relative z-10 hidden md:inline whitespace-nowrap">
                                    {tab.name}
                                </span>

                                {/* Active bottom dot indicator (mobile) */}
                                {isActive && (
                                    <motion.span
                                        layoutId="inventory-tab-dot"
                                        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                                        className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full md:hidden"
                                        style={{ backgroundColor: 'var(--adm-primary)' }}
                                    />
                                )}
                            </Link>

                            {/* Tooltip — mobile only (md:hidden), shown on hover */}
                            {tooltip === tab.href && (
                                <div
                                    role="tooltip"
                                    className="md:hidden absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap pointer-events-none shadow-lg"
                                    style={{
                                        backgroundColor: 'var(--adm-text)',
                                        color: 'var(--adm-surface)',
                                    }}
                                >
                                    {tab.name}
                                    {/* Arrow */}
                                    <span
                                        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent"
                                        style={{ borderBottomColor: 'var(--adm-text)' }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* ── Page Content ── */}
            <div>{children}</div>
        </div>
    );
}
