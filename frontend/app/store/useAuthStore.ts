import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    address?: string;
}

interface AuthStore {
    user: User | null;
    token: string | null;
    login: (user: User, token?: string) => void;
    logout: () => void;
    updateUserLocally: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            login: (user, token) => set((state) => ({ user, token: token || state.token })),
            logout: () => set({ token: null, user: null }),
            updateUserLocally: (data) => set((state) => ({
                user: state.user ? { ...state.user, ...data } : null
            }))
        }),
        {
            name: 'phstore-user', // Match the existing localStorage key if possible, but Zustand wraps it in JSON
        }
    )
);
