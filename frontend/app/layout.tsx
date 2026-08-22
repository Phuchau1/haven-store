import type { Metadata } from 'next';
import { Be_Vietnam_Pro, Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import './responsive.css';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-be-vietnam',
  display: 'swap',
});

const inter = Inter({
  subsets: ['vietnamese', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
});
import LayoutShell from '@/app/component/LayoutShell';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/app/component/AuthContext';
import { ToastProvider } from '@/app/component/ToastProvider';

export const metadata: Metadata = {
  metadataBase: new URL('https://havenstore.io.vn'),
  title: {
    default: 'HAVEN STORE - Thời Trang Nam Nữ Cao Cấp | Quần Áo & Giày Dép Chính Hãng',
    template: '%s | HAVEN STORE'
  },
  description: 'HAVEN STORE - Thương hiệu thời trang nam nữ cao cấp, tối giản và tinh tế. Mua sắm áo sơ mi, polo, blazer, quần tây và phụ kiện chính hãng tại TP.HCM & Long An. Giao hàng hỏa tốc toàn quốc.',
  keywords: [
    'haven store', 'havenstore', 'havenstore.io.vn', 'thời trang haven store', 'shop quần áo haven',
    'shop quần áo gần đây', 'cửa hàng thời trang gần nhất', 'shop thời trang quận 1', 'shop quần áo cần giuộc long an',
    'thời trang nam cao cấp', 'thời trang nữ công sở', 'áo sơ mi', 'áo polo', 'áo blazer nam nữ', 'quần tây'
  ],
  authors: [{ name: 'HAVEN STORE' }],
  creator: 'HAVEN STORE',
  publisher: 'HAVEN STORE',
  alternates: {
    canonical: 'https://havenstore.io.vn',
  },
  openGraph: {
    title: 'HAVEN STORE - Thời Trang Nam Nữ Cao Cấp',
    description: 'Khám phá các bộ sưu tập thời trang cao cấp, thanh lịch và tinh tế tại HAVEN STORE. Hệ thống showroom tại TP.HCM & Long An.',
    url: 'https://havenstore.io.vn',
    siteName: 'HAVEN STORE',
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HAVEN STORE - Thời Trang Nam Nữ Cao Cấp',
    description: 'Thương hiệu thời trang cao cấp tối giản và tinh tế tại HAVEN STORE.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  verification: {
    google: ['google5e31d691b45f169a', '5e31d691b45f169a', 'google5769b7fee58b2a81'],
  },
};

// Schema.org Structured Data cho Google Search & Local SEO
const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://havenstore.io.vn/#website',
      'url': 'https://havenstore.io.vn',
      'name': 'HAVEN STORE',
      'description': 'Thương hiệu thời trang nam nữ cao cấp chính hãng',
      'potentialAction': {
        '@type': 'SearchAction',
        'target': 'https://havenstore.io.vn/shop?search={search_term_string}',
        'query-input': 'required name=search_term_string'
      }
    },
    {
      '@type': 'ClothingStore',
      '@id': 'https://havenstore.io.vn/#store-hcm',
      'name': 'HAVEN Flagship Store - TP. Hồ Chí Minh',
      'url': 'https://havenstore.io.vn/locations',
      'telephone': '028 8765 4321',
      'priceRange': '$$',
      'image': 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=900&q=80',
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': '456 Nguyễn Trãi, Phường 8',
        'addressLocality': 'Quận 1',
        'addressRegion': 'Hồ Chí Minh',
        'postalCode': '700000',
        'addressCountry': 'VN'
      },
      'geo': {
        '@type': 'GeoCoordinates',
        'latitude': 10.7588,
        'longitude': 106.6788
      },
      'openingHoursSpecification': [
        {
          '@type': 'OpeningHoursSpecification',
          'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          'opens': '09:00',
          'closes': '22:30'
        }
      ]
    },
    {
      '@type': 'ClothingStore',
      '@id': 'https://havenstore.io.vn/#store-longan',
      'name': 'HAVEN Store - Cần Giuộc Long An',
      'url': 'https://havenstore.io.vn/locations',
      'telephone': '0838 484 885',
      'priceRange': '$$',
      'image': 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=900&q=80',
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': '256 ấp Long Khánh, Cần Giuộc',
        'addressLocality': 'Cần Giuộc',
        'addressRegion': 'Long An',
        'postalCode': '850000',
        'addressCountry': 'VN'
      },
      'openingHoursSpecification': [
        {
          '@type': 'OpeningHoursSpecification',
          'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          'opens': '09:00',
          'closes': '22:00'
        }
      ]
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        {/* Schema.org Structured Data cho Google Index & Local Business */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
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
      <body className={`${beVietnamPro.variable} ${inter.variable} font-sans antialiased`}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "70678187265-22i4v8strfakkvhvh7clrc3atks3i8g7.apps.googleusercontent.com"}>
          <ToastProvider>
            <AuthProvider>
              <LayoutShell>{children}</LayoutShell>
            </AuthProvider>
            <Toaster
              position="top-right"
              containerStyle={{
                zIndex: 9999999,
              }}
              toastOptions={{
                duration: 3500,
                style: {
                  background: '#0f172a',
                  color: '#fff',
                  borderRadius: '16px',
                  padding: '14px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                },
                success: {
                  iconTheme: { primary: '#10b981', secondary: '#fff' },
                },
                error: {
                  iconTheme: { primary: '#ef4444', secondary: '#fff' },
                },
              }}
            />
          </ToastProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
