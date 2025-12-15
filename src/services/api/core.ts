import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Ensure the API_BASE_URL is always absolute and append /api
export const getApiUrl = (endpoint: string) => {
    const baseUrl = API_BASE_URL.startsWith('http') ? API_BASE_URL : `http://localhost:3001`;
    const apiUrl = `${baseUrl}/api`;
    return `${apiUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

// Helper function to get auth headers
export const getAuthHeaders = (): Record<string, string> => {
    if (typeof window === 'undefined') return { 'Content-Type': 'application/json' };

    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};
