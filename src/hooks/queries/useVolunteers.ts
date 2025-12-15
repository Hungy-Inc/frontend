import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';

export const volunteerKeys = {
    all: ['volunteers'] as const,
    hours: (month: number, year: number) => [...volunteerKeys.all, 'hours', month, year] as const,
    details: (month: number, year: number) => [...volunteerKeys.all, 'details', month, year] as const,
};

export const useVolunteerHours = (month: number, year: number) => {
    return useQuery({
        queryKey: volunteerKeys.hours(month, year),
        queryFn: () => api.getVolunteerHours(month, year),
    });
};

export const useVolunteerDetails = (month: number, year: number) => {
    return useQuery({
        queryKey: volunteerKeys.details(month, year),
        queryFn: () => api.getVolunteerDetails(month, year),
    });
};

export const useExportVolunteerHours = () => {
    return useMutation({
        mutationFn: ({ month, year }: { month: number; year: number }) =>
            api.exportVolunteerHours(month, year),
    });
};
