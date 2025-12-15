import { getApiUrl, getAuthHeaders } from './core';

export const volunteersApi = {
    // Volunteers
    async getVolunteerSummary(month: number, year: string) {
        const response = await fetch(getApiUrl(`/volunteers/summary?month=${month}&year=${year}`), {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch volunteer summary');
        return response.json();
    },

    async getVolunteerDetails(month: number, year: number) {
        const response = await fetch(getApiUrl(`/volunteers/details?month=${month}&year=${year}`), {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch volunteers');
        return response.json();
    },

    async getVolunteerHours(month: number, year: number) {
        const response = await fetch(getApiUrl(`/stats/volunteers?month=${month}&year=${year}`), {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch volunteer hours');
        return response.json();
    },

    async exportVolunteerHours(month: number, year: number) {
        const response = await fetch(getApiUrl(`/volunteer-hours/export?month=${month}&year=${year}`), {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to export Excel');
        return response.blob();
    },

    async getRecurringShifts() {
        const response = await fetch(getApiUrl('/recurring-shifts'), {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch recurring shifts');
        return response.json();
    },

    // Users (Assuming this belongs here or in separate users module, placing here for now as user mgmt)
    async getUsers() {
        const response = await fetch(getApiUrl('/users'), {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        return response.json();
    },

    async getUserModules() {
        const response = await fetch(getApiUrl('/modules'), {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch modules');
        return response.json();
    },
};
