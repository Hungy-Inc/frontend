import { getApiUrl, getAuthHeaders } from './core';

export const inventoryApi = {
    // Inventory Table
    async getInventoryTable(month: number | string, year: number | string, unit: string) {
        const response = await fetch(getApiUrl(`/inventory/donor-category-table?month=${month}&year=${year}&unit=${unit}`), {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch inventory table');
        return response.json();
    },

    async exportInventory(month: number | string, year: number, unit: string) {
        const response = await fetch(getApiUrl(`/inventory/export-table?month=${month}&year=${year}&unit=${unit}`), {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to export inventory');
        return response.blob();
    },

    // Donation Categories
    async getDonationCategories() {
        const response = await fetch(getApiUrl('/inventory/categories'), {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch donation categories');
        return response.json();
    },

    async createDonationCategory(data: any) {
        const response = await fetch(getApiUrl('/donation-categories'), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create category');
        }
        return response.json();
    },

    async updateDonationCategory(id: number, data: any) {
        const response = await fetch(getApiUrl(`/donation-categories/${id}`), {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update category');
        }
        return response.json();
    },

    async deleteDonationCategory(id: number) {
        const response = await fetch(getApiUrl(`/donation-categories/${id}`), {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete category');
        }
        return response.json();
    },

    // Donation Locations (Donors)
    async getDonationLocations() {
        const response = await fetch(getApiUrl('/donors'), {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch donation locations');
        return response.json();
    },

    async createDonationLocation(data: any) {
        const response = await fetch(getApiUrl('/donors'), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create donation location');
        }
        return response.json();
    },

    async updateDonationLocation(id: number, data: any) {
        const response = await fetch(getApiUrl(`/donors/${id}`), {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update donation location');
        }
        return response.json();
    },

    async deleteDonationLocation(id: number) {
        const response = await fetch(getApiUrl(`/donors/${id}`), {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete donation location');
        }
        return response.json();
    },

    async getInventoryStats(month: number, year: string) {
        const response = await fetch(getApiUrl(`/inventory/categories/filtered?month=${month}&year=${year}`), {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch inventory stats');
        return response.json();
    },

    async getWeighingCategories() {
        const response = await fetch(getApiUrl('/weighing-categories'), { // Check if this exists? index.ts says /api/weighing-categories -> weighingRoutes
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch weighing categories');
        return response.json();
    },
};
