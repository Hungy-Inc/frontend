import { create } from 'zustand';
import { superadminApi } from '@/services/api/superadmin';

export interface SuperAdmin {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: 'SUPER_ADMIN';
    lastLoginAt?: string;
    createdAt?: string;
    isActive?: boolean;
}

interface SuperAdminState {
    superAdmin: SuperAdmin | null;
    isAuthenticated: boolean;
    login: (superAdmin: SuperAdmin) => void;
    logout: () => Promise<void>;
    setSuperAdmin: (superAdmin: SuperAdmin) => void;
    checkSession: () => Promise<void>;
}

export const useSuperAdminStore = create<SuperAdminState>()((set) => ({
    superAdmin: null,
    isAuthenticated: false,
    login: (superAdmin) => set({ superAdmin, isAuthenticated: true }),
    logout: async () => {
        try {
            // Call backend logout endpoint
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/auth/logout`, {
                method: 'POST',
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
        set({ superAdmin: null, isAuthenticated: false });
    },
    setSuperAdmin: (superAdmin) => set({ superAdmin }),
    checkSession: async () => {
        try {
            const superAdmin = await superadminApi.getProfile();
            set({ superAdmin, isAuthenticated: true });
        } catch (error) {
            set({ superAdmin: null, isAuthenticated: false });
            throw error; // Re-throw to let caller handle redirect
        }
    },
}));
