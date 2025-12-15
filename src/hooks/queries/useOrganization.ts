
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

export const organizationKeys = {
    all: ['organization'] as const,
    detail: (id: string | number) => [...organizationKeys.all, 'detail', id] as const,
};

export const useOrganization = (id: string | number | undefined) => {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: organizationKeys.detail(id!),
        queryFn: () => api.getOrganization(id!),
        enabled: isAuthenticated && !!id,
        staleTime: 1000 * 60 * 60, // 1 hour (org name rarely changes)
    });
};
