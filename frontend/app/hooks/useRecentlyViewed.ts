import { useState, useEffect } from 'react';
import { Product } from '@/types';

const STORAGE_KEY = 'torano_recently_viewed';
const MAX_ITEMS = 10;

export function useRecentlyViewed() {
    const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setRecentlyViewed(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse recently viewed items', e);
            }
        }
    }, []);

    const addProduct = (product: Product) => {
        setRecentlyViewed((prev) => {
            // Loại bỏ sản phẩm nếu đã có trong danh sách (để đưa lên đầu)
            const filtered = prev.filter(p => p.id !== product.id);
            
            // Thêm vào đầu danh sách
            const updated = [product, ...filtered].slice(0, MAX_ITEMS);
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    return { recentlyViewed, addProduct };
}
