'use client';
import React, { ReactNode } from 'react';
import { useAuthStore, User } from '@/app/store/useAuthStore';

export function AuthProvider({ children }: { children: ReactNode }) {
    // Không cần Provider vì Zustand là global state
    return <>{children}</>;
}

export const useAuth = () => {
    const store = useAuthStore();

    const updateProfile = async (data: Partial<User>) => {
        if (!store.user) return false;
        try {
            const res = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: store.user.id, ...data })
            });
            const result = await res.json();
            if (result.success) {
                store.updateUserLocally(result.user);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Update profile error:', error);
            return false;
        }
    };

    return {
        user: store.user,
        login: store.login,
        logout: store.logout,
        updateProfile,
        isAdmin: store.user?.role === 'admin'
    };
};
