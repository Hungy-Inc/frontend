import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

export const userKeys = {
    all: ['user'] as const,
    modules: () => [...userKeys.all, 'modules'] as const,
};

export const useUserModules = () => {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: userKeys.modules(),
        queryFn: () => api.getUserModules(),
        enabled: isAuthenticated, // Only fetch if authenticated
    });
};
