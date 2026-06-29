'use client';
/**
 * ============================================================
 * CART CONTEXT — Quản lý trạng thái giỏ hàng toàn cục
 * Mô tả: Wrapper tiện lợi bình thường hoá việc truy cập giỏ hàng.
 * Trạng thái được quản lý bởng Zustand Store (useCartStore),
 * không cần React Context Provider truyền thống.
 * ============================================================
 */
import React, { ReactNode } from 'react';
import { useCartStore } from '@/app/store/useCartStore';

/**
 * CartProvider — giữ nguyên cấu trúc cây component nhưng
 * không cần cung cấp context vì Zustand là global state
 */
export function CartProvider({ children }: { children: ReactNode }) {
    // Không cần Provider nữa vì Zustand là global state
    return <>{children}</>;
}

/**
 * Hook `useCart` — giao diện đơn giản hóa việc sử dụng giỏ hàng
 * Tính toán thêm các giá trị dẫn xuất (derived state) tiện dụng:
 *  - totalItems:  tổng số sản phẩm trong giỏ
 *  - totalAmount: tổng tiền cần thanh toán
 */
export function useCart() {
    const store = useCartStore(); // Lấy toàn bộ store giỏ hàng từ Zustand

    // Tính tổng số lượng sản phẩm (cộng quantity của từng mục)
    const totalItems = store.items.reduce((sum, item) => sum + item.quantity, 0);

    // Tính tổng tiền (giá x số lượng của từng mục, dùng Number() để tránh NaN)
    const totalAmount = store.items.reduce(
        (sum, item) => sum + (Number(item.product.price) || 0) * item.quantity,
        0
    );

    return {
        ...store,   // Trải toàn bộ actions và state từ store
        totalItems,
        totalAmount
    };
}
