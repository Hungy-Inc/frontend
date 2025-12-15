import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export const dashboardKeys = {
    all: ['dashboard'] as const,
    incoming: (month: number, year: string) => [...dashboardKeys.all, 'incoming', month, year] as const,
    volunteer: (month: number, year: string) => [...dashboardKeys.all, 'volunteer', month, year] as const,
    outgoing: (month: number, year: string) => [...dashboardKeys.all, 'outgoing', month, year] as const,
    foodbox: (month: number, year: string) => [...dashboardKeys.all, 'foodbox', month, year] as const,
    outreach: (month: number, year: string) => [...dashboardKeys.all, 'outreach', month, year] as const,
    inventory: (month: number, year: string) => [...dashboardKeys.all, 'inventory', month, year] as const,
    weighingCategories: () => [...dashboardKeys.all, 'weighing-categories'] as const,
    recurringShifts: () => [...dashboardKeys.all, 'recurring-shifts'] as const,
    stats: () => [...dashboardKeys.all, 'stats'] as const,
};

export const useIncomingStats = (month: number, year: string) => {
    return useQuery({
        queryKey: dashboardKeys.incoming(month, year),
        queryFn: () => api.getIncomingStats(month, year),
    });
};

export const useVolunteerSummary = (month: number, year: string) => {
    return useQuery({
        queryKey: dashboardKeys.volunteer(month, year),
        queryFn: () => api.getVolunteerSummary(month, year),
    });
};

export const useOutgoingStats = (month: number, year: string) => {
    return useQuery({
        queryKey: dashboardKeys.outgoing(month, year),
        queryFn: () => api.getOutgoingStats(month, year),
    });
};

export const useFoodBoxSummary = (month: number, year: string) => {
    return useQuery({
        queryKey: dashboardKeys.foodbox(month, year),
        queryFn: () => api.getFoodBoxSummary(month, year),
    });
};

export const useOutreachSummary = (month: number, year: string) => {
    return useQuery({
        queryKey: dashboardKeys.outreach(month, year),
        queryFn: () => api.getOutreachSummary(month, year),
    });
};

export const useInventoryStats = (month: number, year: string) => {
    return useQuery({
        queryKey: dashboardKeys.inventory(month, year),
        queryFn: () => api.getInventoryStats(month, year),
    });
};

export const useWeighingCategories = () => {
    return useQuery({
        queryKey: dashboardKeys.weighingCategories(),
        queryFn: () => api.getWeighingCategories(),
    });
};

export const useRecurringShifts = () => {
    return useQuery({
        queryKey: dashboardKeys.recurringShifts(),
        queryFn: () => api.getRecurringShifts(),
    });
};

export const useDashboardStats = () => {
    return useQuery({
        queryKey: dashboardKeys.stats(),
        queryFn: () => api.getDashboardStats(),
    });
};
