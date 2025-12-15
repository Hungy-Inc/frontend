import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-toastify';

export const incomingKeys = {
    all: ['incoming'] as const,
    stats: (month: number | string, year: number) => [...incomingKeys.all, 'stats', month, year] as const,
    detail: (date: string) => [...incomingKeys.all, 'detail', date] as const,
};

export function useIncomingStats(month: number, year: number, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: incomingKeys.stats(month, year),
        queryFn: () => api.getIncomingStats(month, year.toString()),
        staleTime: 5 * 60 * 1000,
        ...options
    });
}

export function useDetailDonations(date: string | null, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: incomingKeys.detail(date || ''),
        queryFn: () => api.getDetailDonations(date!),
        enabled: !!date && options?.enabled !== false,
        staleTime: 5 * 60 * 1000,
    });
}

export function useUpdateDonation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => api.updateDetailDonation(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: incomingKeys.all });
            toast.success('Donation updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update donation');
        },
    });
}

export function useDeleteDonation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ donorId, categoryId, date }: { donorId: number; categoryId: number; date: string }) =>
            api.deleteDetailDonation(donorId, categoryId, date),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: incomingKeys.all });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete donation');
        },
    });
}

export function useExportIncoming() {
    return useMutation({
        mutationFn: ({ month, year, unit }: { month: number; year: number; unit: string }) =>
            api.exportIncoming(month, year, unit),
        onSuccess: (blob, variables) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `incoming-stats-${variables.year}-${variables.month}.xlsx`;
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
