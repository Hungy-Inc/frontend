const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Ensure the API_BASE_URL is always absolute and append /api
const getApiUrl = (endpoint: string) => {
  const baseUrl = API_BASE_URL.startsWith('http') ? API_BASE_URL : `http://localhost:3001`;
  const apiUrl = `${baseUrl}/api`;
  return `${apiUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}

export interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  activeUsers: number
  conversionRate: number
}

export interface Order {
  id: string
  customer: string
  status: string
  amount: number
}

export interface DashboardSummary {
  incomingStats: {
    totalDonations: number
    totalWeight: number
  }
  outgoingStats: {
    totalWeight: number
    totalShifts: number
  }
  volunteerStats: {
    totalHours: number
    totalVolunteers: number
  }
  inventoryStats: {
    totalItems: number
    totalWeight: number
  }
}

// Helper function to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') {
    return {
      'Content-Type': 'application/json'
    };
  }
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const api = {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(getApiUrl('/dashboard/stats'))
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats')
    }
    return response.json()
  },

  async getRecentOrders(): Promise<Order[]> {
    const response = await fetch(getApiUrl('/orders/recent'))
    if (!response.ok) {
      throw new Error('Failed to fetch recent orders')
    }
    return response.json()
  },

  async getDashboardSummary(month: string, year: string): Promise<DashboardSummary> {
    const response = await fetch(getApiUrl(`/dashboard-summary?month=${month}&year=${year}`))
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard summary')
    }
    return response.json()
  },

  // Email Management API
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

  async getUsers() {
    const response = await fetch(getApiUrl('/users'), {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return response.json();
  }
} 