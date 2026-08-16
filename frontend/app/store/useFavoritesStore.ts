import { create } from 'zustand';
import { Product } from '@/types';

interface FavoritesState {
    favorites: Product[];
    addFavorite: (product: Product, userId?: string) => Promise<void>;
    removeFavorite: (productId: string, userId?: string) => Promise<void>;
    toggleFavorite: (product: Product, userId?: string) => Promise<void>;
    isFavorite: (productId: string) => boolean;
    syncFavorites: (userId: string) => Promise<void>;
    clearFavorites: (userId?: string) => Promise<void>;
}

export const useFavoritesStore = create<FavoritesState>()(
    (set, get) => ({
        favorites: [],

        addFavorite: async (product, userId) => {
            if (!userId) return;
            const current = get().favorites;
            if (!current.find(p => p.id === product.id)) {
                set({ favorites: [...current, product] });
                try {
                    await fetch('/api/wishlist', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: userId, product_id: product.id })
                    });
                } catch (error) {
                    console.error('Lỗi khi thêm wishlist server:', error);
                }
            }
        },

        removeFavorite: async (productId, userId) => {
            if (!userId) return;
            set((state) => ({
                favorites: state.favorites.filter(p => p.id !== productId)
            }));
            try {
                await fetch(`/api/wishlist/${productId}?user_id=${userId}`, {
                    method: 'DELETE'
                });
            } catch (error) {
                console.error('Lỗi khi xóa wishlist server:', error);
            }
        },

        toggleFavorite: async (product, userId) => {
            if (!userId) return;
            const isFav = get().favorites.some(p => p.id === product.id);
            if (isFav) {
                await get().removeFavorite(product.id, userId);
            } else {
                await get().addFavorite(product, userId);
            }
        },

        isFavorite: (productId) => {
            return get().favorites.some(p => p.id === productId);
        },

        syncFavorites: async (userId) => {
            try {
                const res = await fetch(`/api/wishlist?user_id=${userId}`);
                const data = await res.json();
                if (data.success && data.wishlist) {
                    set({ favorites: data.wishlist });
                }
            } catch (error) {
                console.error('Lỗi khi đồng bộ wishlist:', error);
            }
        },

        // Xóa local, và nếu có userId thì gọi API xóa DB (dùng khi logout không truyền userId)
        clearFavorites: async (userId?: string) => {
            set({ favorites: [] });
            if (userId) {
                try {
                    await fetch(`/api/wishlist/clear?user_id=${userId}`, {
                        method: 'DELETE'
                    });
                } catch (error) {
                    console.error('Lỗi khi xóa wishlist server:', error);
                }
            }
        }
    })
);
