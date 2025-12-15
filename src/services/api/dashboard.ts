import { getApiUrl, getAuthHeaders } from './core';

export interface DashboardStats {
    totalOrders: number;
    totalRevenue: number;
    activeUsers: number;
    conversionRate: number;
}

export interface DashboardSummary {
    incomingStats: {
        totalDonations: number;
        totalWeight: number;
    };
    outgoingStats: {
        totalWeight: number;
        totalShifts: number;
    };
    volunteerStats: {
        totalHours: number;
        totalVolunteers: number;
    };
    inventoryStats: {
        totalItems: number;
        totalWeight: number;
    };
}

export const dashboardApi = {
    async getDashboardStats(): Promise<DashboardStats> {
        const response = await fetch(getApiUrl('/dashboard/stats'), {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            throw new Error('Failed to fetch dashboard stats');
        }
        return response.json();
    },

    async getDashboardSummary(month: string, year: string): Promise<DashboardSummary> {
        const response = await fetch(getApiUrl(`/dashboard/summary?month=${month}&year=${year}`), {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            throw new Error('Failed to fetch dashboard summary');
        }
        return response.json();
    },

    async getFoodBoxSummary(month: number, year: string) {
        const response = await fetch(getApiUrl(`/dashboard/foodbox-summary?month=${month}&year=${year}`), {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch food box summary');
        return response.json();
    },

    async getOutreachSummary(month: number, year: string) {
        const response = await fetch(getApiUrl(`/dashboard/outreach-summary?month=${month}&year=${year}`), {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch outreach summary');
        return response.json();
    },
};
