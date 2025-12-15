import { getApiUrl, getAuthHeaders } from './core';

export const auth = {
    me: async () => {
        const response = await fetch(getApiUrl('/me'), {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch user');
        return response.json();
    },

    logout: async () => {
        // Optional: Call backend logout if you implement cookie clearing endpoint
        // For now, just clearing frontend state is enough if the cookie has an expiry, 
        // but ideally we should have a /logout endpoint to clear the cookie.
        // We will implement a simple fetch to a logout endpoint if we add one.
    }
};
