'use client';

import { useEffect, useState } from 'react';
import { FaBuilding, FaUsers, FaPuzzlePiece, FaUtensils, FaHandHoldingHeart } from 'react-icons/fa';
import StatsCard from '@/components/superadmin/StatsCard';
import Link from 'next/link';

interface DashboardStats {
    organizations: {
        total: number;
        active: number;
        inactive: number;
    };
    users: {
        total: number;
        approved: number;
        pending: number;
    };
    moduleTemplates: {
        total: number;
    };
    donations: {
        total: number;
    };
    meals: {
        total: number;
    };
    recentOrganizations: Array<{
        id: number;
        name: string;
        email: string;
        onboardedAt: string;
        isActive: boolean;
    }>;
}

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('superAdminToken');
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/dashboard/stats`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
                <div className="text-sm text-gray-500">
                    Last updated: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Organizations"
                    value={stats?.organizations.total || 0}
                    icon={<FaBuilding size={24} />}
                    color="orange"
                    loading={loading}
                    trend={{
                        value: stats ? Math.round((stats.organizations.active / stats.organizations.total) * 100) : 0,
                        label: 'Active',
                        isPositive: true
                    }}
                />
                <StatsCard
                    title="Total Users"
                    value={stats?.users.total || 0}
                    icon={<FaUsers size={24} />}
                    color="blue"
                    loading={loading}
                    trend={{
                        value: stats ? Math.round((stats.users.approved / stats.users.total) * 100) : 0,
                        label: 'Approved',
                        isPositive: true
                    }}
                />
                <StatsCard
                    title="Total Donations"
                    value={stats?.donations.total || 0}
                    icon={<FaHandHoldingHeart size={24} />}
                    color="green"
                    loading={loading}
                />
                <StatsCard
                    title="Meals Served"
                    value={stats?.meals.total.toLocaleString() || '0'}
                    icon={<FaUtensils size={24} />}
                    color="purple"
                    loading={loading}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Organizations */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-800">Recent Organizations</h2>
                        <Link
                            href="/superadmin/organizations"
                            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                        >
                            View All
                        </Link>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {stats?.recentOrganizations.map((org) => (
                                <div key={org.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-orange-600 font-bold border border-gray-200">
                                            {org.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-800">{org.name}</h3>
                                            <p className="text-sm text-gray-500">{org.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${org.isActive
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                            }`}>
                                            {org.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {new Date(org.onboardedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {(!stats?.recentOrganizations || stats.recentOrganizations.length === 0) && (
                                <div className="text-center py-8 text-gray-500">
                                    No organizations found
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Quick Actions / System Status */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-6">System Status</h2>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Module Templates</span>
                                <span className="font-medium">{stats?.moduleTemplates.total || 0} Available</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Active Organizations</span>
                                <span className="font-medium">
                                    {stats ? Math.round((stats.organizations.active / stats.organizations.total) * 100) : 0}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{
                                        width: `${stats ? (stats.organizations.active / stats.organizations.total) * 100 : 0}%`
                                    }}
                                ></div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                            <h3 className="text-sm font-medium text-gray-800 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <Link
                                    href="/superadmin/organizations?action=create"
                                    className="block w-full text-center py-2 px-4 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium"
                                >
                                    Add New Organization
                                </Link>
                                <Link
                                    href="/superadmin/users?action=create"
                                    className="block w-full text-center py-2 px-4 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                                >
                                    Add New User
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
