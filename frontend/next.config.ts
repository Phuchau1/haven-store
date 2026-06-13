import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      // Nam
      { source: '/collections/nam', destination: '/products?category=cat-clothing' },
      { source: '/collections/ao-nam', destination: '/products?category=cat-clothing&subCategory=ao-nam' },
      { source: '/collections/ao-so-mi-nam', destination: '/products?category=cat-clothing&subCategory=ao-so-mi-nam' },
      { source: '/collections/ao-polo-nam', destination: '/products?category=cat-clothing&subCategory=ao-polo-nam' },
      { source: '/collections/ao-thun-nam', destination: '/products?category=cat-clothing&subCategory=ao-thun-nam' },
      { source: '/collections/ao-khoac-nam', destination: '/products?category=cat-clothing&subCategory=ao-khoac-nam' },
      { source: '/collections/quan-nam', destination: '/products?category=cat-clothing&subCategory=quan-nam' },
      { source: '/collections/quan-au-nam', destination: '/products?category=cat-clothing&subCategory=quan-au-nam' },
      { source: '/collections/quan-jean-nam', destination: '/products?category=cat-clothing&subCategory=quan-jean-nam' },
      { source: '/collections/quan-kaki-nam', destination: '/products?category=cat-clothing&subCategory=quan-kaki-nam' },
      { source: '/collections/quan-short-nam', destination: '/products?category=cat-clothing&subCategory=quan-short-nam' },
      { source: '/collections/bo-do-nam', destination: '/products?category=cat-clothing&subCategory=bo-do-nam' },
      { source: '/collections/bo-vest-nam', destination: '/products?category=cat-clothing&subCategory=bo-vest-nam' },
      { source: '/collections/phu-kien-nam', destination: '/products?category=cat-clothing&subCategory=phu-kien-nam' },
      { source: '/collections/giay-da-nam', destination: '/products?category=cat-clothing&subCategory=giay-da-nam' },
      { source: '/collections/vi-da-nam', destination: '/products?category=cat-clothing&subCategory=vi-da-nam' },
      { source: '/collections/day-lung-nam', destination: '/products?category=cat-clothing&subCategory=day-lung-nam' },
      { source: '/collections/dep-nam', destination: '/products?category=cat-clothing&subCategory=dep-nam' },
      // Nữ
      { source: '/collections/do-nu', destination: '/products?category=cat-womens' },
      { source: '/collections/ao-nu', destination: '/products?category=cat-womens&subCategory=ao-nu' },
      { source: '/collections/ao-so-mi-nu', destination: '/products?category=cat-womens&subCategory=ao-so-mi-nu' },
      { source: '/collections/ao-polo-nu', destination: '/products?category=cat-womens&subCategory=ao-polo-nu' },
      { source: '/collections/ao-thun-nu', destination: '/products?category=cat-womens&subCategory=ao-thun-nu' },
      { source: '/collections/ao-khoac-nu', destination: '/products?category=cat-womens&subCategory=ao-khoac-nu' },
      { source: '/collections/quan-nu', destination: '/products?category=cat-womens&subCategory=quan-nu' },
      { source: '/collections/quan-au-nu', destination: '/products?category=cat-womens&subCategory=quan-au-nu' },
      { source: '/collections/quan-jean-nu', destination: '/products?category=cat-womens&subCategory=quan-jean-nu' },
      { source: '/collections/quan-short-nu', destination: '/products?category=cat-womens&subCategory=quan-short-nu' },
      { source: '/collections/vay-dam', destination: '/products?category=cat-womens&subCategory=vay-dam' },
      { source: '/collections/vay-lien-dam', destination: '/products?category=cat-womens&subCategory=vay-lien-dam' },
      { source: '/collections/chan-vay', destination: '/products?category=cat-womens&subCategory=chan-vay' },
      { source: '/collections/phu-kien-nu', destination: '/products?category=cat-womens&subCategory=phu-kien-nu' },
      { source: '/collections/giay-dep-nu', destination: '/products?category=cat-womens&subCategory=giay-dep-nu' },
      { source: '/collections/tui-xach', destination: '/products?category=cat-womens&subCategory=tui-xach' },
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
