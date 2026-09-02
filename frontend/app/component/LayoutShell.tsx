"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/app/component/Header';
import Footer from '@/app/component/Footer';
import CartDrawer from '@/app/component/CartDrawer';
import ChatSupport from '@/app/component/ChatSupport';
import LuckyWheel from '@/app/component/LuckyWheel';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isAdmin = pathname.startsWith('/admin');
  const isCheckout = pathname.startsWith('/checkout');

  return (
    <>
      {!isAdmin && !isCheckout && <Header />}
      <CartDrawer />
      <main className="min-h-screen">{children}</main>
      {!isAdmin && !isCheckout && <Footer />}
      {!isAdmin && !isCheckout && <LuckyWheel />}
      {!isAdmin && <ChatSupport />}
    </>
  );
}
