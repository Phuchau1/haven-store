import type { Metadata } from 'next';
import './globals.css';
import LayoutShell from '@/app/component/LayoutShell';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/app/component/AuthContext';

export const metadata: Metadata = {
  title: 'PH Store - Thời trang cao cấp | Quần áo & Giày dép',
  description: 'PH Store cung cấp các sản phẩm thời trang cao cấp, tối giản và tinh tế. Khám phá bộ sưu tập mới nhất ngay hôm nay.',
  keywords: 'ph store, thời trang, quần áo, giày dép, túi xách, cao cấp',
  openGraph: {
    title: 'PH Store - Thời trang cao cấp',
    description: 'Khám phá bộ sưu tập thời trang cao cấp mới nhất',
    type: 'website',
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
      </head>
      <body className="antialiased">
        <GoogleOAuthProvider clientId="70678187265-22i4v8strfakkvhvh7clrc3atks3i8g7.apps.googleusercontent.com">
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
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
