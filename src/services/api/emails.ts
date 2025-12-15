import { getApiUrl, getAuthHeaders } from './core';

export const emailsApi = {
    async getEmailTemplates() {
        const response = await fetch(getApiUrl('/email-templates'), {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            throw new Error('Failed to fetch email templates');
        }
        return response.json();
    },

    async getEmailLogs(limit = 50, offset = 0) {
        const response = await fetch(getApiUrl(`/email-logs?limit=${limit}&offset=${offset}`), {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            throw new Error('Failed to fetch email logs');
        }
        return response.json();
    },

    async createEmailTemplate(templateData: any) {
        const response = await fetch(getApiUrl('/email-templates'), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(templateData)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create email template');
        }
        return response.json();
    },

    async updateEmailTemplate(templateId: number, updateData: any) {
        const response = await fetch(getApiUrl(`/email-templates/${templateId}`), {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(updateData)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update email template');
        }
        return response.json();
    },

    async deleteEmailTemplate(templateId: number) {
        const response = await fetch(getApiUrl(`/email-templates/${templateId}`), {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete email template');
        }
        return response.json();
    },

    async sendCustomEmail(emailData: any) {
        const response = await fetch(getApiUrl('/emails/send-custom'), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(emailData)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to send email');
        }
        return response.json();
    },

    async sendTemplateEmail(emailData: any) {
        const response = await fetch(getApiUrl('/emails/send-template'), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(emailData)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to send email');
        }
        return response.json();
    },
};
