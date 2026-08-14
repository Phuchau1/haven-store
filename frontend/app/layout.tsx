import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import './responsive.css';
import LayoutShell from '@/app/component/LayoutShell';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/app/component/AuthContext';
import { ToastProvider } from '@/app/component/ToastProvider';

export const metadata: Metadata = {
  title: 'HAVEN STORE - Thời Trang Cao Cấp | Quần Áo & Giày Dép Nam Nữ',
  description: 'HAVEN STORE cung cấp các sản phẩm thời trang nam nữ cao cấp, tối giản và tinh tế. Mua sắm quần áo, giày dép chính hãng online ngay hôm nay.',
  keywords: 'haven store, haven store thời trang, thời trang haven store, quần áo haven store, shop quần áo haven',
  openGraph: {
    title: 'HAVEN STORE - Thời Trang Cao Cấp',
    description: 'Khám phá bộ sưu tập thời trang cao cấp mới nhất tại HAVEN STORE',
    type: 'website',
  },
  verification: {
    google: 'google5769b7fee58b2a81',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600&family=Inter:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Google Analytics 4 */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX'}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX'}');
          `}
        </Script>
      </head>
      <body className="antialiased">
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "70678187265-22i4v8strfakkvhvh7clrc3atks3i8g7.apps.googleusercontent.com"}>
          <ToastProvider>
            <AuthProvider>
              <LayoutShell>{children}</LayoutShell>
            </AuthProvider>
            <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#111',
                color: '#fff',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                iconTheme: { primary: '#4ade80', secondary: '#111' },
              },
              error: {
                iconTheme: { primary: '#f87171', secondary: '#111' },
              },
            }}
          />
          </ToastProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
