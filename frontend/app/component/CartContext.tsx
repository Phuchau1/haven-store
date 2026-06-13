'use client';
// ===== CART CONTEXT - Quản lý trạng thái giỏ hàng toàn cục (Đã chuyển sang Zustand) =====
import React, { ReactNode } from 'react';
import { useCartStore } from '@/app/store/useCartStore';

export function CartProvider({ children }: { children: ReactNode }) {
    // Không cần Provider nữa vì Zustand là global state
    return <>{children}</>;
}

export function useCart() {
    const store = useCartStore();
    
    // Tính toán derived state (tổng số lượng, tổng tiền)
    const totalItems = store.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = store.items.reduce((sum, item) => sum + (Number(item.product.price) || 0) * item.quantity, 0);

    return {
        ...store,
        totalItems,
        totalAmount
    };
}
