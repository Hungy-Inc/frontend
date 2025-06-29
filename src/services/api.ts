const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

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

export const api = {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`)
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats')
    }
    return response.json()
  },

  async getRecentOrders(): Promise<Order[]> {
    const response = await fetch(`${API_BASE_URL}/orders/recent`)
    if (!response.ok) {
      throw new Error('Failed to fetch recent orders')
    }
    return response.json()
  },

  async getDashboardSummary(month: string, year: string): Promise<DashboardSummary> {
    const response = await fetch(`${API_BASE_URL}/dashboard-summary?month=${month}&year=${year}`)
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard summary')
    }
    return response.json()
  }
} 