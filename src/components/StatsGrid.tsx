'use client'

import { useEffect, useState } from 'react'
import { api, DashboardStats } from '@/services/api'

const stats = [
  {
    title: 'Total Orders',
    value: '1,234',
    change: '+12.5%',
    trend: 'up',
  },
  {
    title: 'Total Revenue',
    value: '$45,678',
    change: '+8.2%',
    trend: 'up',
  },
  {
    title: 'Active Users',
    value: '892',
    change: '-2.4%',
    trend: 'down',
  },
  {
    title: 'Conversion Rate',
    value: '3.2%',
    change: '+1.1%',
    trend: 'up',
  },
]

export default function StatsGrid() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getDashboardStats()
        setStats(data)
      } catch (err) {
        setError('Failed to load dashboard statistics')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg text-red-600">
        {error}
      </div>
    )
  }

  if (!stats) return null

  const statItems = [
    {
      title: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      change: '+12.5%', // TODO: Calculate real change
      trend: 'up',
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      change: '+8.2%', // TODO: Calculate real change
      trend: 'up',
    },
    {
      title: 'Active Users',
      value: stats.activeUsers.toLocaleString(),
      change: '-2.4%', // TODO: Calculate real change
      trend: 'down',
    },
    {
      title: 'Conversion Rate',
      value: `${stats.conversionRate}%`,
      change: '+1.1%', // TODO: Calculate real change
      trend: 'up',
    },
  ]

  return (
    <div className="stats-grid">
      {statItems.map((stat) => (
        <div key={stat.title} className="stat-card">
          <h3>{stat.title}</h3>
          <div className="value">{stat.value}</div>
          <div className={`trend ${stat.trend === 'up' ? 'up' : 'down'}`}>
            {stat.change}
          </div>
        </div>
      ))}
    </div>
  )
} 