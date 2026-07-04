import { create } from 'zustand';
import { CartItem, Product, Color } from '@/types';
import { useAuthStore } from '@/app/store/useAuthStore';

interface CartStore {
    items: CartItem[];
    isOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
    toggleCart: () => void;
    addItem: (product: Product, size: string, color: Color, quantity?: number) => void;
    removeItem: (productId: string, size: string, colorName: string) => void;
    updateQuantity: (productId: string, size: string, colorName: string, quantity: number) => void;
    clearCart: () => void;         // Xóa local + xóa DB (dùng sau thanh toán)
    clearCartLocal: () => void;   // Chỉ xóa hiển thị local (dùng khi logout)
    totalItems: number;
    totalAmount: number;
    syncCart: (userId: string) => Promise<void>;
    saveCart: (userId: string, items: CartItem[]) => Promise<void>;
}

export const useCartStore = create<CartStore>()(
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
                    return { items: updated, isOpen: true };
                }

                const newItems = [...state.items, { product, quantity, selectedSize: size, selectedColor: color }];
                return { items: newItems, isOpen: true };
            });
            const user = useAuthStore.getState().user;
            if (user) get().saveCart(user.id, get().items);
        },

        removeItem: (productId, size, colorName) => {
            set((state) => ({
                items: state.items.filter(
                    item =>
                        !(item.product.id === productId && item.selectedSize === size && item.selectedColor.name === colorName)
                ),
            }));
            const user = useAuthStore.getState().user;
            if (user) get().saveCart(user.id, get().items);
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
            const user = useAuthStore.getState().user;
            if (user) get().saveCart(user.id, get().items);
        },

        // Xóa hoàn toàn giỏ hàng (local + DB) — dùng sau thanh toán thành công
        clearCart: () => {
            const user = useAuthStore.getState().user;
            set({ items: [], isOpen: false });
            if (user) get().saveCart(user.id, []);
        },

        // Chỉ xóa trên giao diện local, KHÔNG chạm DB — dùng khi logout
        clearCartLocal: () => {
            set({ items: [], isOpen: false });
        },

        syncCart: async (userId) => {
            try {
                const res = await fetch(`/api/cart?user_id=${userId}`);
                const data = await res.json();
                if (data.success && data.cart) {
                    set({ items: data.cart.items || [] });
                }
            } catch (error) {
                console.error('Lỗi khi đồng bộ giỏ hàng:', error);
            }
        },

        saveCart: async (userId, items) => {
            try {
                await fetch('/api/cart', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId, items })
                });
            } catch (error) {
                console.error('Lỗi khi lưu giỏ hàng:', error);
            }
        },

        get totalItems() {
            return get().items.reduce((sum, item) => sum + item.quantity, 0);
        },
        get totalAmount() {
            return get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        }
    })
);
