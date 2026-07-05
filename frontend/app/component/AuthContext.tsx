'use client';
/**
 * ============================================================
 * AUTH CONTEXT — Quản lý trạng thái xác thực người dùng toàn cục
 * Mô tả: Cung cấp hook `useAuth` để truy cập thông tin đăng nhập
 *        và các action liên quan đến tài khoản từ bất kỳ component nào.
 *
 * Trạng thái được lưu trong Zustand Store (useAuthStore) kết hợp
 * với localStorage để duy trì đăng nhập sau khi reload trang.
 * ============================================================
 */
import React, { ReactNode, useEffect, useState } from 'react';
import { useAuthStore, User } from '@/app/store/useAuthStore';
import { useCartStore } from '@/app/store/useCartStore';
import { useFavoritesStore } from '@/app/store/useFavoritesStore';

/**
 * AuthProvider — Đồng bộ dữ liệu Cart & Wishlist từ DB mỗi khi user thay đổi.
 * Sử dụng cờ `hydrated` để đảm bảo Zustand persist đã rehydrate xong
 * từ localStorage TRƯỚC khi gọi API sync — tránh sync với user=null.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
    const user = useAuthStore((state) => state.user);
    const syncFavorites = useFavoritesStore((state) => state.syncFavorites);
    const syncCart = useCartStore((state) => state.syncCart);

    // Đảm bảo Zustand persist đã rehydrate xong trước khi sync
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => {
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (!hydrated) return; // Chờ rehydrate xong
        if (user) {
            syncFavorites(user.id);
            syncCart(user.id);
        }
    }, [user, hydrated, syncFavorites, syncCart]);

    // Zustand là global state → chỉ cần render children trực tiếp
    return <>{children}</>;
}

/**
 * Hook `useAuth` — Giao diện truy cập thông tin xác thực
 * Trả về: thông tin user, token, và các action: login, logout, updateProfile
 */
export const useAuth = () => {
    const store = useAuthStore(); // Lấy store xác thực từ Zustand

    /**
     * Cập nhật hồ sơ cá nhân của người dùng
     * Gọi API PUT /api/auth/profile và cập nhật state local nếu thành công
     * @param data - Các trường cần cập nhật (tên, SĐT, địa chỉ...)
     * @returns true nếu thành công, false nếu thất bại
     */
    const updateProfile = async (data: Partial<User>) => {
        if (!store.user) return false; // Chưa đăng nhập → bỏ qua

        try {
            const res = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: store.user.id, ...data }) // Gửi id để backend xác định user
            });
            const result = await res.json();

            if (result.success) {
                store.updateUserLocally(result.user); // Cập nhật state local không cần reload
                return true;
            }
            return false;
        } catch (error) {
            console.error('Lỗi khi cập nhật hồ sơ:', error);
            return false;
        }
    };

    const clearCartLocal = useCartStore((state) => state.clearCartLocal);
    const clearFavorites = useFavoritesStore((state) => state.clearFavorites);

    const handleLogout = () => {
        store.logout();
        clearCartLocal();      // Chỉ xóa giao diện, KHÔNG xóa DB
        clearFavorites();      // Chỉ xóa giao diện (không có userId → không gọi API)
    };

    return {
        user:          store.user,                          // Thông tin user hiện tại (null nếu chưa đăng nhập)
        token:         store.user?.id || null,             // Dùng user.id làm token gửi lên backend headers
        login:         store.login,                        // Action đăng nhập (lưu user vào store + localStorage)
        logout:        handleLogout,                       // Action đăng xuất (xóa user khỏi store + localStorage + xóa giỏ hàng)
        updateProfile,                                     // Action cập nhật hồ sơ cá nhân
        isAdmin:       store.user?.role === 'admin'        // Kiểm tra nhanh có phải quản trị viên không
    };
};
