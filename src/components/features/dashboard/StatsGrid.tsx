'use client'

import { useDashboardStats } from '@/hooks/queries/useDashboard'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, ArrowUp } from 'lucide-react'

// Mock initial stats for skeleton or fallback
const initialStats = [
    { title: 'Total Orders', value: '...', change: '...', trend: 'neutral' },
    { title: 'Total Revenue', value: '...', change: '...', trend: 'neutral' },
    { title: 'Active Users', value: '...', change: '...', trend: 'neutral' },
    { title: 'Conversion Rate', value: '...', change: '...', trend: 'neutral' },
]

export default function StatsGrid() {
    const { data: stats, isLoading, isError, error } = useDashboardStats();

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {initialStats.map((item, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {item.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold bg-muted h-8 w-24 rounded"></div>
                            <p className="text-xs text-muted-foreground mt-1 bg-muted h-4 w-16 rounded"></p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (isError) {
        return (
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
                Failed to load dashboard statistics: {(error as Error).message}
            </div>
        )
    }

    if (!stats) return null

    const statItems = [
        {
            title: 'Total Orders',
            value: stats.totalOrders.toLocaleString(),
            change: '+12.5%',
            trend: 'up',
        },
        {
            title: 'Total Revenue',
            value: `$${stats.totalRevenue.toLocaleString()}`,
            change: '+8.2%',
            trend: 'up',
        },
        {
            title: 'Active Users',
            value: stats.activeUsers.toLocaleString(),
            change: '-2.4%',
            trend: 'down',
        },
        {
            title: 'Conversion Rate',
            value: `${stats.conversionRate}%`,
            change: '+1.1%',
            trend: 'up',
        },
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statItems.map((stat) => (
                <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {stat.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            {stat.trend === 'up' ? (
                                <ArrowUp className="mr-1 h-4 w-4 text-green-500" />
                            ) : (
                                <ArrowDown className="mr-1 h-4 w-4 text-red-500" />
                            )}
                            <span className={stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                                {stat.change}
                            </span>
                            <span className="ml-1">from last month</span>
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
