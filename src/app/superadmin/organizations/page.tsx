'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaPlus } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import { superadminApi } from '@/services/api/superadmin';
import DataTable from '@/components/superadmin/DataTable';


export default function OrganizationsPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');

    const { data: organizations = [], isLoading: loading } = useQuery({
        queryKey: ['organizations', search],
        queryFn: () => superadminApi.getOrganizations(search)
    });



    const handleRowClick = (org: any) => {
        router.push(`/superadmin/organizations/${org.id}`);
    };

    const columns = [
        {
            header: 'Organization',
            accessor: (org: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold">
                        {org.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{org.name}</div>
                        <div className="text-xs text-gray-500">{org.email}</div>
                    </div>
                </div>
            ),
            sortable: true
        },
        {
            header: 'Contact',
            accessor: (org: any) => (
                <div>
                    <div className="text-sm text-gray-900">{org.contactPerson || '-'}</div>
                    <div className="text-xs text-gray-500">{org.phone || '-'}</div>
                </div>
            )
        },
        {
            header: 'Users',
            accessor: (org: any) => (
                <div className="text-sm text-gray-700 font-medium">
                    {org._count?.User || 0}
                </div>
            ),
            sortable: true
        },
        {
            header: 'Modules',
            accessor: (org: any) => (
                <div className="text-sm text-gray-700 font-medium">
                    {org._count?.Module || 0}
                </div>
            ),
            sortable: true
        },
        {
            header: 'Status',
            accessor: (org: any) => (
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${org.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                    }`}>
                    {org.isActive ? 'Active' : 'Inactive'}
                </span>
            ),
            sortable: true
        },
        {
            header: 'Created',
            accessor: (org: any) => (
                <div className="text-sm text-gray-600">
                    {new Date(org.onboardedAt).toLocaleDateString()}
                </div>
            ),
            sortable: true
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Organizations</h1>
                    <p className="text-sm text-gray-600 mt-1">Manage all organizations and their settings</p>
                </div>
                <button
                    onClick={() => router.push('/superadmin/organizations/create')}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                    <FaPlus />
                    <span>Add Organization</span>
                </button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <div className="text-blue-600 mt-0.5">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-blue-900">Click any row to view details</h3>
                        <p className="text-sm text-blue-700 mt-1">
                            Click on any organization to view and manage its users, modules, and settings.
                        </p>
                    </div>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={organizations}
                loading={loading}
                search={{
                    value: search,
                    onChange: setSearch,
                    placeholder: 'Search by name or email...'
                }}
                onRowClick={handleRowClick}
            />


        </div>
    );
}
