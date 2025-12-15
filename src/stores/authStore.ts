import { create } from 'zustand';

export interface User {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    organizationId?: number;
    [key: string]: any; // Allow other properties
}

import { auth } from '@/services/api/auth';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    login: (user: User) => void;
    logout: () => Promise<void>;
    setUser: (user: User) => void;
    checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
    user: null,
    isAuthenticated: false,
    login: (user) => set({ user, isAuthenticated: true }),
    logout: async () => {
        try {
            // Optional: call backend logout if implemented
            await auth.logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
        set({ user: null, isAuthenticated: false });
    },
    setUser: (user) => set({ user }),
    checkSession: async () => {
        try {
            const user = await auth.me();
            set({ user, isAuthenticated: true });
        } catch (error) {
            set({ user: null, isAuthenticated: false });
        }
    },
}));
