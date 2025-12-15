import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-toastify';

export const inventoryKeys = {
    all: ['inventory'] as const,
    table: (month: number | string, year: number, unit: string) => [...inventoryKeys.all, 'table', month, year, unit] as const,
    categories: () => [...inventoryKeys.all, 'categories'] as const,
    locations: () => [...inventoryKeys.all, 'locations'] as const,
};

export function useInventoryTable(month: number | string, year: number, unit: string) {
    return useQuery({
        queryKey: inventoryKeys.table(month, year, unit),
        queryFn: () => api.getInventoryTable(month, year, unit),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function useDonationCategories() {
    return useQuery({
        queryKey: inventoryKeys.categories(),
        queryFn: () => api.getDonationCategories(),
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

export function useDonationCategoryMutations() {
    const queryClient = useQueryClient();

    const addCategory = useMutation({
        mutationFn: (data: any) => api.createDonationCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.categories() });
            toast.success('Category added successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to add category');
        },
    });

    const updateCategory = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => api.updateDonationCategory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.categories() });
            toast.success('Category updated successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update category');
        },
    });

    const deleteCategory = useMutation({
        mutationFn: (id: number) => api.deleteDonationCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.categories() });
            toast.success('Category deleted successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete category');
        },
    });

    return { addCategory, updateCategory, deleteCategory };
}

export function useDonationLocations() {
    return useQuery({
        queryKey: inventoryKeys.locations(),
        queryFn: () => api.getDonationLocations(),
        staleTime: 10 * 60 * 1000,
    });
}

export function useDonationLocationMutations() {
    const queryClient = useQueryClient();

    const addLocation = useMutation({
        mutationFn: (data: any) => api.createDonationLocation(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.locations() });
            toast.success('Donation location added successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to add donation location');
        },
    });

    const updateLocation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => api.updateDonationLocation(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.locations() });
            toast.success('Donation location updated successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update donation location');
        },
    });

    const deleteLocation = useMutation({
        mutationFn: (id: number) => api.deleteDonationLocation(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.locations() });
            toast.success('Donation location deleted successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete donation location');
        },
    });

    return { addLocation, updateLocation, deleteLocation };
}

export function useExportInventory() {
    return useMutation({
        mutationFn: ({ month, year, unit }: { month: number | string; year: number; unit: string }) =>
            api.exportInventory(month, year, unit),
        onSuccess: (blob, variables) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `inventory-${variables.year}-${variables.month}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Export completed successfully!');
        },
        onError: () => {
            toast.error('Export failed. Please try again.');
        },
    });
}
