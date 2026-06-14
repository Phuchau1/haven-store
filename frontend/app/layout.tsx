import type { Metadata } from 'next';
import './globals.css';
import LayoutShell from '@/app/component/LayoutShell';
import { GoogleOAuthProvider } from '@react-oauth/google';

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
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600&family=Inter:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <GoogleOAuthProvider clientId="1059982947365-mmvo47jgvdo3o5ipvl2nkk53s5hmm115.apps.googleusercontent.com">
          <LayoutShell>{children}</LayoutShell>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
