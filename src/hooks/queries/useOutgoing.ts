import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-toastify';

export const outgoingKeys = {
    all: ['outgoing'] as const,
    consolidated: (month: number, year: number) => [...outgoingKeys.all, 'consolidated', month, year] as const,
    shiftCategories: (month: number, year: number) => [...outgoingKeys.all, 'shiftCategories', month, year] as const,
    foodBox: (month: number, year: number) => [...outgoingKeys.all, 'foodBox', month, year] as const,
    backpack: (month: number, year: number) => [...outgoingKeys.all, 'backpack', month, year] as const,
    outreach: (month: number, year: number) => [...outgoingKeys.all, 'outreach', month, year] as const,
    outreachLocations: () => [...outgoingKeys.all, 'outreachLocations'] as const,
};

export function useConsolidatedOutgoing(month: number, year: number, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: outgoingKeys.consolidated(month, year),
        queryFn: () => api.getConsolidatedOutgoing(month, year),
        staleTime: 5 * 60 * 1000,
        ...options
    });
}

export function useShiftCategoriesOutgoing(month: number, year: number, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: outgoingKeys.shiftCategories(month, year),
        queryFn: () => api.getShiftCategoriesOutgoing(month, year),
        staleTime: 5 * 60 * 1000,
        ...options
    });
}

export function useFoodBoxOutgoing(month: number, year: number, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: outgoingKeys.foodBox(month, year),
        queryFn: () => api.getFoodBoxOutgoing(month, year),
        staleTime: 5 * 60 * 1000,
        ...options
    });
}

export function useBackpackOutgoing(month: number, year: number, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: outgoingKeys.backpack(month, year),
        queryFn: () => api.getBackpackOutgoing(month, year),
        staleTime: 5 * 60 * 1000,
        ...options
    });
}

export function useOutreachOutgoing(month: number, year: number, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: outgoingKeys.outreach(month, year),
        queryFn: () => api.getOutreachOutgoing(month, year),
        staleTime: 5 * 60 * 1000,
        ...options
    });
}

export function useOutreachLocations(options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: outgoingKeys.outreachLocations(),
        queryFn: () => api.getOutreachLocations(),
        staleTime: 10 * 60 * 1000,
        ...options
    });
}

export function useOutreachLocationMutations() {
    const queryClient = useQueryClient();

    const addLocation = useMutation({
        mutationFn: (data: any) => api.createOutreachLocation(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: outgoingKeys.outreachLocations() });
            toast.success('Location created successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create location');
        },
    });

    const updateLocation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => api.updateOutreachLocation(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: outgoingKeys.outreachLocations() });
            toast.success('Location updated successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update location');
        },
    });

    const deleteLocation = useMutation({
        mutationFn: (id: number) => api.deleteOutreachLocation(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: outgoingKeys.outreachLocations() });
            toast.success('Location deleted successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete location');
        },
    });

    return { addLocation, updateLocation, deleteLocation };
}

export function useExportOutgoing() {
    return useMutation({
        mutationFn: ({ endpoint, month, year }: { endpoint: string; month: number; year: number }) =>
            api.exportOutgoing(endpoint, month, year),
        onSuccess: (blob, variables) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `outgoing-stats-${variables.endpoint}-${variables.year}-${variables.month}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Export completed successfully!');
        },
        onError: () => {
            toast.error('Failed to export Excel.');
        },
    });
}

export function useExportConsolidatedOutgoing() {
    return useMutation({
        mutationFn: ({ month, year }: { month: number; year: number }) =>
            api.exportConsolidatedOutgoing(month, year),
        onSuccess: (blob, variables) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `outgoing-stats-consolidated-${variables.year}-${variables.month}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Consolidated export completed successfully!');
        },
        onError: () => {
            toast.error('Failed to export consolidated Excel.');
        },
    });
}
