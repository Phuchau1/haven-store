'use client';
import React from 'react';
import { useRecentlyViewed } from '@/app/hooks/useRecentlyViewed';
import ProductCard from './ProductCard';

interface RecentlyViewedProps {
    currentProductId?: string;
}

export default function RecentlyViewed({ currentProductId }: RecentlyViewedProps) {
    const { recentlyViewed } = useRecentlyViewed();

    // Loại bỏ sản phẩm hiện tại đang xem khỏi danh sách
    const displayProducts = recentlyViewed.filter(p => p.id !== currentProductId).slice(0, 4);

    if (displayProducts.length === 0) return null;

    return (
        <div className="mt-20 lg:mt-28 border-t border-gray-100 pt-16">
            <h2 className="text-2xl lg:text-3xl font-light text-black tracking-tight mb-8">Sản phẩm bạn vừa xem</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                {displayProducts.map((p, index) => (
                    <ProductCard key={p.id} product={p} index={index} />
                ))}
            </div>
        </div>
    );
}
