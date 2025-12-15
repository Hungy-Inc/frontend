import { getApiUrl, getAuthHeaders } from './core';

export const superadminApi = {
    // Auth
    getProfile: async () => {
        const response = await fetch(getApiUrl('/superadmin/auth/profile'), {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch profile');
        return response.json();
    },

    // Organizations
    getOrganizations: async (search: string = '') => {
        const response = await fetch(getApiUrl(`/superadmin/organizations?search=${search}`), {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch organizations');
        return response.json();
    },

    getOrganization: async (id: number) => {
        const response = await fetch(getApiUrl(`/superadmin/organizations/${id}`), {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch organization');
        return response.json();
    },

    createOrganization: async (data: any) => {
        const response = await fetch(getApiUrl('/superadmin/organizations'), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create organization');
        return response.json();
    },

    updateOrganization: async (id: number, data: any) => {
        const response = await fetch(getApiUrl(`/superadmin/organizations/${id}`), {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update organization');
        return response.json();
    },

    // Users
    getUsers: async (search: string = '') => {
        const response = await fetch(getApiUrl(`/superadmin/users?search=${search}`), {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch users');
        return response.json();
    },

    getUser: async (id: number) => {
        const response = await fetch(getApiUrl(`/superadmin/users/${id}`), {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch user');
        return response.json();
    },
    // Organization Modules & Users
    getOrganizationModules: async (id: number) => {
        const response = await fetch(getApiUrl(`/superadmin/organizations/${id}/modules`), {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch organization modules');
        return response.json();
    },

    getOrganizationUsers: async (id: number) => {
        const response = await fetch(getApiUrl(`/superadmin/organizations/${id}/users`), {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch organization users');
        return response.json();
    },

    toggleOrganizationModule: async (orgId: number, moduleId: number) => {
        const response = await fetch(getApiUrl(`/superadmin/organizations/${orgId}/modules/${moduleId}/toggle`), {
            method: 'PATCH',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to toggle module');
        return response.json(); // May be empty body for 200/204
    },

    assignOrganizationModules: async (orgId: number, moduleTemplateIds: number[]) => {
        const response = await fetch(getApiUrl(`/superadmin/organizations/${orgId}/modules`), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ moduleTemplateIds }),
        });
        if (!response.ok) throw new Error('Failed to assign modules');
        return response.json();
    },

    updateOrganizationPermissions: async (orgId: number, permissions: Record<number, string[]>) => {
        const response = await fetch(getApiUrl(`/superadmin/organizations/${orgId}/permissions`), {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ permissions }),
        });
        if (!response.ok) throw new Error('Failed to update permissions');
        return response.json();
    },

    // Templates
    getModuleTemplates: async () => {
        const response = await fetch(getApiUrl('/superadmin/module-templates'), {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch module templates');
        return response.json();
    },

    // User Management
    createUser: async (data: any) => {
        const response = await fetch(getApiUrl('/superadmin/users'), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create user');
        }
        return response.json();
    },

    updateUser: async (id: number, data: any) => {
        const response = await fetch(getApiUrl(`/superadmin/users/${id}`), {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update user');
        return response.json();
    },

    deleteUser: async (id: number) => {
        const response = await fetch(getApiUrl(`/superadmin/users/${id}`), {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete user');
        return response.json();
    },

    resetUserPassword: async (id: number, password: string) => {
        const response = await fetch(getApiUrl(`/superadmin/users/${id}/reset-password`), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ newPassword: password }),
        });
        if (!response.ok) throw new Error('Failed to reset password');
        return response.json();
    },
};
