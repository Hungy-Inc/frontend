import { getApiUrl, getAuthHeaders } from './core';

export const statsApi = {
    // Incoming Stats
    async getIncomingStats(month: number, year: string) {
        const response = await fetch(getApiUrl(`/stats/incoming?month=${month}&year=${year}`), {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch incoming stats');
        return response.json();
    },

    async getDetailDonations(date: string) {
        const response = await fetch(getApiUrl(`/detail-donations?date=${date}`), {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch detail donations');
        return response.json();
    },

    async updateDetailDonation(data: any) {
        const response = await fetch(getApiUrl('/detail-donations'), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update donation');
        return response.json();
    },

    async deleteDetailDonation(donorId: number, categoryId: number, date: string) {
        const response = await fetch(getApiUrl(`/detail-donations/${donorId}/${categoryId}?date=${date}`), {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to delete donation');
        return response.json();
    },

    async exportIncoming(month: number, year: number, unit: string) {
        const response = await fetch(getApiUrl(`/incoming-stats/export?month=${month}&year=${year}&unit=${unit}`), {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to export incoming stats');
        return response.blob();
    },

    // Outgoing Stats
    async getOutgoingStats(month: number, year: string) {
        const response = await fetch(getApiUrl(`/stats/outgoing?month=${month}&year=${year}`), {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch outgoing stats');
        return response.json();
    },

    async getConsolidatedOutgoing(month: number, year: number) {
        const response = await fetch(getApiUrl(`/outgoing-stats/consolidated?month=${month}&year=${year}`), {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch consolidated data');
        return response.json();
    },

    async getShiftCategoriesOutgoing(month: number, year: number) {
        const response = await fetch(getApiUrl(`/outgoing-stats/filtered?month=${month}&year=${year}`), {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch shift categories data');
        return response.json();
    },

    async getFoodBoxOutgoing(month: number, year: number) {
        const response = await fetch(getApiUrl(`/outgoing-stats/foodbox?month=${month}&year=${year}`), {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch food box data');
        return response.json();
    },

    async getBackpackOutgoing(month: number, year: number) {
        const response = await fetch(getApiUrl(`/outgoing-stats/backpack?month=${month}&year=${year}`), {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch backpack data');
        return response.json();
    },

    async getOutreachOutgoing(month: number, year: number) {
        const response = await fetch(getApiUrl(`/outgoing-stats/outreach?month=${month}&year=${year}`), {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch outreach data');
        return response.json();
    },

    async getOutreachLocations() {
        const response = await fetch(getApiUrl('/outreach-locations'), {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch outreach locations');
        return response.json();
    },

    async createOutreachLocation(data: any) {
        const response = await fetch(getApiUrl('/outreach-locations'), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create outreach location');
        }
        return response.json();
    },

    async updateOutreachLocation(id: number, data: any) {
        const response = await fetch(getApiUrl(`/outreach-locations/${id}`), {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update outreach location');
        }
        return response.json();
    },

    async deleteOutreachLocation(id: number) {
        const response = await fetch(getApiUrl(`/outreach-locations/${id}`), {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete outreach location');
        }
        return response.json();
    },

    async exportOutgoing(endpoint: string, month: number, year: number) {
        const response = await fetch(getApiUrl(`/outgoing-stats/${endpoint}/export?month=${month}&year=${year}`), {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to export Excel');
        return response.blob();
    },

    async exportConsolidatedOutgoing(month: number, year: number) {
        const response = await fetch(getApiUrl(`/outgoing-stats/consolidated-excel/export?month=${month}&year=${year}`), {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to export consolidated Excel');
        return response.blob();
    },
};
