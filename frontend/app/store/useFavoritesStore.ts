import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';

interface FavoritesState {
    favorites: Product[];
    addFavorite: (product: Product) => void;
    removeFavorite: (productId: string) => void;
    toggleFavorite: (product: Product) => void;
    isFavorite: (productId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
    persist(
        (set, get) => ({
            favorites: [],
            
            addFavorite: (product) => set((state) => {
                if (!state.favorites.find(p => p.id === product.id)) {
                    return { favorites: [...state.favorites, product] };
                }
                return state;
            }),

            removeFavorite: (productId) => set((state) => ({
                favorites: state.favorites.filter(p => p.id !== productId)
            })),

            toggleFavorite: (product) => set((state) => {
                const isFav = state.favorites.some(p => p.id === product.id);
                if (isFav) {
                    return { favorites: state.favorites.filter(p => p.id !== product.id) };
                } else {
                    return { favorites: [...state.favorites, product] };
                }
            }),

            isFavorite: (productId) => {
                return get().favorites.some(p => p.id === productId);
            }
        }),
        {
            name: 'phstore-favorites', // name of the item in the storage (must be unique)
        }
    )
);
