
import { getApiUrl, getAuthHeaders } from './core';

export const organizationsApi = {
    getOrganization: async (id: number | string) => {
        const response = await fetch(getApiUrl(`/organizations/${id}`), {
            headers: getAuthHeaders(),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch organization');
        }
        return response.json();
    },
};
