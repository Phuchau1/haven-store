import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
    persist(
        (set, get) => ({
            favorites: [],
            
            addFavorite: async (product, userId) => {
                const current = get().favorites;
                if (!current.find(p => p.id === product.id)) {
                    set({ favorites: [...current, product] });
                    if (userId) {
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
                }
            },

            removeFavorite: async (productId, userId) => {
                set((state) => ({
                    favorites: state.favorites.filter(p => p.id !== productId)
                }));
                if (userId) {
                    try {
                        await fetch(`/api/wishlist/${productId}?user_id=${userId}`, {
                            method: 'DELETE'
                        });
                    } catch (error) {
                        console.error('Lỗi khi xóa wishlist server:', error);
                    }
                }
            },

            toggleFavorite: async (product, userId) => {
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
                        const backendFavs = data.wishlist || [];
                        const localFavs = get().favorites;
                        
                        let mergedFavs = [...backendFavs];
                        let changed = false;
                        
                        localFavs.forEach((localItem) => {
                            if (!mergedFavs.find((p: any) => p.id === localItem.id)) {
                                mergedFavs.push(localItem);
                                changed = true;
                            }
                        });

                        set({ favorites: mergedFavs });
                        
                        if (changed) {
                            localFavs.forEach(async (item) => {
                                if (!backendFavs.find((p: any) => p.id === item.id)) {
                                    try {
                                        await fetch('/api/wishlist', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ user_id: userId, product_id: item.id })
                                        });
                                    } catch (err) {
                                        console.error('Lỗi khi merge wishlist server:', err);
                                    }
                                }
                            });
                        }
                    }
                } catch (error) {
                    console.error('Lỗi khi đồng bộ wishlist:', error);
                }
            },

            clearFavorites: async (userId) => {
                set({ favorites: [] });
                if (userId) {
                    try {
                        await fetch(`/api/wishlist/clear?user_id=${userId}`, {
                            method: 'DELETE'
                        });
                    } catch (error) {
                        console.error('Lỗi khi xóa toàn bộ wishlist server:', error);
                    }
                }
            }
        }),
        {
            name: 'phstore-favorites',
        }
    )
);
