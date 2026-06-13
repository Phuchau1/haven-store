import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, Color } from '@/types';

interface CartStore {
    items: CartItem[];
    isOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
    toggleCart: () => void;
    addItem: (product: Product, size: string, color: Color, quantity?: number) => void;
    removeItem: (productId: string, size: string, colorName: string) => void;
    updateQuantity: (productId: string, size: string, colorName: string, quantity: number) => void;
    clearCart: () => void;
    totalItems: number;
    totalAmount: number;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,
            openCart: () => set({ isOpen: true }),
            closeCart: () => set({ isOpen: false }),
            toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
            
            addItem: (product, size, color, quantity = 1) => {
                set((state) => {
                    const existingIndex = state.items.findIndex(
                        item =>
                            item.product.id === product.id &&
                            item.selectedSize === size &&
                            item.selectedColor.name === color.name
                    );

                    if (existingIndex > -1) {
                        const updated = [...state.items];
                        updated[existingIndex] = {
                            ...updated[existingIndex],
                            quantity: updated[existingIndex].quantity + quantity,
                        };
                        return { items: updated, isOpen: true, totalItems: get().totalItems + quantity, totalAmount: get().totalAmount + product.price * quantity };
                    }

                    const newItems = [...state.items, { product, quantity, selectedSize: size, selectedColor: color }];
                    return { items: newItems, isOpen: true };
                });
            },
            
            removeItem: (productId, size, colorName) => {
                set((state) => ({
                    items: state.items.filter(
                        item =>
                            !(item.product.id === productId && item.selectedSize === size && item.selectedColor.name === colorName)
                    ),
                }));
            },
            
            updateQuantity: (productId, size, colorName, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(productId, size, colorName);
                    return;
                }
                set((state) => ({
                    items: state.items.map(item =>
                        item.product.id === productId && item.selectedSize === size && item.selectedColor.name === colorName
                            ? { ...item, quantity }
                            : item
                    ),
                }));
            },
            
            clearCart: () => set({ items: [], isOpen: false }),
            
            // Note: with Zustand, totalItems and totalAmount can be derived getters or just computed properties.
            // Zustand state doesn't dynamically evaluate getters within the state object well without external derived state libraries or recalculating it.
            // We'll calculate them correctly below using get().
            get totalItems() {
                return get().items.reduce((sum, item) => sum + item.quantity, 0);
            },
            get totalAmount() {
                return get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
            }
        }),
        {
            name: 'fashion-cart-storage',
            partialize: (state) => ({ items: state.items }), // Only persist items, not isOpen
        }
    )
);
