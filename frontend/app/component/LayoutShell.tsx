"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/app/component/Header';
import Footer from '@/app/component/Footer';
import CartDrawer from '@/app/component/CartDrawer';
import ChatSupport from '@/app/component/ChatSupport';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isAdmin = pathname.startsWith('/admin');

  return (
    <>
      {!isAdmin && <Header />}
      <CartDrawer />
      <main className="min-h-screen">{children}</main>
      {!isAdmin && <Footer />}
      <ChatSupport />
    </>
  );
}
