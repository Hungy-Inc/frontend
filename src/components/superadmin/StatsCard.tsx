'use client';

import { ReactNode } from 'react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    trend?: {
        value: number;
        label: string;
        isPositive: boolean;
    };
    color: 'orange' | 'blue' | 'green' | 'purple';
    loading?: boolean;
}

export default function StatsCard({ title, value, icon, trend, color, loading = false }: StatsCardProps) {
    const colorClasses = {
        orange: 'bg-orange-50 text-orange-600',
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                </div>
                <div className="h-8 w-24 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
                        <span className="ml-1 text-gray-500 font-normal">{trend.label}</span>
                    </div>
                )}
            </div>

            <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
            <div className="text-2xl font-bold text-gray-800">{value}</div>
        </div>
    );
}
