import { create } from 'zustand';
import { CartItem, Product, Color } from '@/types';
import { useAuthStore } from '@/app/store/useAuthStore';

interface CartStore {
    items: CartItem[];
    isOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
    toggleCart: () => void;
    addItem: (product: Product, size: string, color: Color, quantity?: number, openDrawer?: boolean) => void;
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

        addItem: (product, size, color, quantity = 1, openDrawer = true) => {
            // Tính toán newItems TRƯỚC rồi set — tránh race condition
            const state = get();
            const existingIndex = state.items.findIndex(
                item =>
                    item.product.id === product.id &&
                    item.selectedSize === size &&
                    item.selectedColor.name === color.name
            );

            let newItems: CartItem[];
            if (existingIndex > -1) {
                newItems = [...state.items];
                const newQuantity = newItems[existingIndex].quantity + quantity;
                
                // Fetch max stock for the selected variant
                const getMaxStock = () => {
                    if (!product || !color || !size) return 999;
                    const variants = product.variants || [];
                    const match = variants.find((v: any) => 
                        (v.color === color.name || v.color === 'Mặc định' || (!v.color && color.name === 'Mặc định')) 
                        && 
                        (v.size === size || v.size === 'One Size' || (!v.size && size === 'One Size'))
                    );
                    
                    let stock = 999;
                    if (match && match.stock !== undefined) {
                        stock = Number(match.stock) || 0;
                    } else if (variants.length === 0) {
                        stock = product.inStock ? 50 : 0;
                    }

                    if (product.isFlashSale) {
                        const fsVariant = product.flashSaleVariants?.find((v: any) => 
                            (v.color === color.name || v.color === 'Mặc định' || (!v.color && color.name === 'Mặc định')) 
                            && 
                            (v.size === size || v.size === 'One Size' || (!v.size && size === 'One Size'))
                        );
                        if (fsVariant) {
                            const fsStock = fsVariant.stockQuantity !== undefined ? Number(fsVariant.stockQuantity) : (Number(fsVariant.stock) || 0);
                            const fsSold = Number(fsVariant.soldQuantity) || 0;
                            stock = Math.min(stock, fsStock - fsSold);
                        } else if (product.flashSaleStock !== undefined && product.flashSaleStock !== null) {
                            const totalFsStock = Number(product.flashSaleStock) || 0;
                            stock = Math.min(stock, totalFsStock);
                        }
                    }
                    return Math.max(0, stock);
                };
                const maxStock = getMaxStock();
                
                newItems[existingIndex] = {
                    ...newItems[existingIndex],
                    quantity: newQuantity > maxStock ? maxStock : newQuantity,
                };
                
                // Show a quick warning if it exceeded stock
                if (newQuantity > maxStock) {
                    console.warn(`Cannot add more than stock. Limited to ${maxStock}`);
                    // Optionally, trigger a custom event here if you want to show a toast from outside
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('cart-stock-exceeded', { detail: { maxStock } }));
                    }
                }
            } else {
                newItems = [...state.items, { product, quantity, selectedSize: size, selectedColor: color }];
            }

            set({ items: newItems, isOpen: openDrawer });

            // Lưu DB với newItems đã tính sẵn (không dùng get().items — tránh race condition)
            const user = useAuthStore.getState().user;
            if (user) get().saveCart(user.id, newItems);
        },

        removeItem: (productId, size, colorName) => {
            const newItems = get().items.filter(
                item =>
                    !(item.product.id === productId && item.selectedSize === size && item.selectedColor.name === colorName)
            );
            set({ items: newItems });
            const user = useAuthStore.getState().user;
            if (user) get().saveCart(user.id, newItems);
        },

        updateQuantity: (productId, size, colorName, quantity) => {
            if (quantity <= 0) {
                get().removeItem(productId, size, colorName);
                return;
            }
            const newItems = get().items.map(item =>
                item.product.id === productId && item.selectedSize === size && item.selectedColor.name === colorName
                    ? { ...item, quantity }
                    : item
            );
            set({ items: newItems });
            const user = useAuthStore.getState().user;
            if (user) get().saveCart(user.id, newItems);
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
