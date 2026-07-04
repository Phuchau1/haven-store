'use client';
import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/types';

export function useRecentlyViewed(userId?: string) {
    const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

    // Load từ DB khi có userId
    useEffect(() => {
        if (!userId) {
            setRecentlyViewed([]);
            return;
        }
        fetch(`/api/recently-viewed?user_id=${userId}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.items) {
                    setRecentlyViewed(data.items);
                }
            })
            .catch(err => console.error('Lỗi khi tải sản phẩm đã xem:', err));
    }, [userId]);

    const addProduct = useCallback((product: Product) => {
        // Cập nhật local state ngay lập tức để UI mượt
        setRecentlyViewed(prev => {
            const filtered = prev.filter(p => p.id !== product.id);
            return [product, ...filtered].slice(0, 10);
        });

        // Lưu lên DB nếu đã đăng nhập
        if (userId) {
            fetch('/api/recently-viewed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, product_id: product.id })
            }).catch(err => console.error('Lỗi khi lưu sản phẩm đã xem:', err));
        }
    }, [userId]);

    return { recentlyViewed, addProduct };
}
