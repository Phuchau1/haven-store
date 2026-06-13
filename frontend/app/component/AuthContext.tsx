'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';

interface AuthContextType {
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
    updateProfile: (data: Partial<User>) => Promise<boolean>;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('phstore-user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem('phstore-user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('phstore-user');
        // Xóa cả key cũ nếu có
        localStorage.removeItem('luxe-user');
    };

    const updateProfile = async (data: Partial<User>) => {
        if (!user) return false;

        try {
            const res = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: user.id, ...data })
            });
            const result = await res.json();

            if (result.success) {
                const updatedUser = result.user;
                setUser(updatedUser);
                localStorage.setItem('phstore-user', JSON.stringify(updatedUser));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Update profile error:', error);
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === 'admin', updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
