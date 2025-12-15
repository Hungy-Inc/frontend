import { dashboardApi } from './dashboard';
import { inventoryApi } from './inventory';
import { statsApi } from './stats';
import { volunteersApi } from './volunteers';
import { emailsApi } from './emails';
import { miscApi } from './misc';
import { organizationsApi } from './organizations';
import { getAuthHeaders, getApiUrl } from './core';

export const api = {
    ...dashboardApi,
    ...inventoryApi,
    ...statsApi,
    ...volunteersApi,
    ...emailsApi,
    ...emailsApi,
    ...miscApi,
    ...organizationsApi,
};

export type { DashboardStats, DashboardSummary } from './dashboard';
export type { Order } from './misc';
export * from './auth';
export * from './superadmin';
export { getAuthHeaders, getApiUrl };
