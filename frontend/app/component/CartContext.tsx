'use client';
// ===== CART CONTEXT - Quản lý trạng thái giỏ hàng toàn cục (có lưu localStorage) =====
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { CartItem, Product, Color } from '@/types';

const CART_STORAGE_KEY = 'haven_store_cart';

interface CartContextType {
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

const CartContext = createContext<CartContextType | undefined>(undefined);

// Đọc giỏ hàng từ localStorage
function loadCartFromStorage(): CartItem[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (err) {
        console.error('Lỗi đọc giỏ hàng từ localStorage:', err);
    }
    return [];
}

// Lưu giỏ hàng vào localStorage
function saveCartToStorage(items: CartItem[]) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
        console.error('Lỗi lưu giỏ hàng vào localStorage:', err);
    }
}

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Lần đầu mount: đọc giỏ hàng từ localStorage
    useEffect(() => {
        const savedItems = loadCartFromStorage();
        if (savedItems.length > 0) {
            setItems(savedItems);
        }
        setIsLoaded(true);
    }, []);

    // Mỗi khi items thay đổi → lưu vào localStorage
    useEffect(() => {
        if (isLoaded) {
            saveCartToStorage(items);
        }
    }, [items, isLoaded]);

    const openCart = useCallback(() => setIsOpen(true), []);
    const closeCart = useCallback(() => setIsOpen(false), []);
    const toggleCart = useCallback(() => setIsOpen(prev => !prev), []);

    // Thêm sản phẩm vào giỏ hàng
    const addItem = useCallback((product: Product, size: string, color: Color, quantity = 1) => {
        setItems(prev => {
            const existingIndex = prev.findIndex(
                item =>
                    item.product.id === product.id &&
                    item.selectedSize === size &&
                    item.selectedColor.name === color.name
            );

            if (existingIndex > -1) {
                // Nếu đã có sản phẩm tương tự -> tăng số lượng
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    quantity: updated[existingIndex].quantity + quantity,
                };
                return updated;
            }

            // Thêm mới
            return [...prev, { product, quantity, selectedSize: size, selectedColor: color }];
        });

        // Mở giỏ hàng khi thêm sản phẩm
        setIsOpen(true);
    }, []);

    // Xóa sản phẩm
    const removeItem = useCallback((productId: string, size: string, colorName: string) => {
        setItems(prev =>
            prev.filter(
                item =>
                    !(item.product.id === productId && item.selectedSize === size && item.selectedColor.name === colorName)
            )
        );
    }, []);

    // Cập nhật số lượng
    const updateQuantity = useCallback((productId: string, size: string, colorName: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(productId, size, colorName);
            return;
        }
        setItems(prev =>
            prev.map(item =>
                item.product.id === productId && item.selectedSize === size && item.selectedColor.name === colorName
                    ? { ...item, quantity }
                    : item
            )
        );
    }, [removeItem]);

    // Xóa toàn bộ giỏ
    const clearCart = useCallback(() => {
        setItems([]);
        setIsOpen(false);
    }, []);

    // Tổng số lượng
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    // Tổng tiền
    const totalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                items,
                isOpen,
                openCart,
                closeCart,
                toggleCart,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                totalItems,
                totalAmount,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart phải được sử dụng trong CartProvider');
    }
    return context;
}
