import { getApiUrl } from './core';

export interface Order {
    id: string;
    customer: string;
    status: string;
    amount: number;
}

export const miscApi = {
    async getRecentOrders(): Promise<Order[]> {
        const response = await fetch(getApiUrl('/orders/recent'));
        if (!response.ok) {
            throw new Error('Failed to fetch recent orders');
        }
        return response.json();
    },
};
