
'use client';

import { useState, useEffect } from 'react';
import { FaFileCsv, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import DataTable from './DataTable'; // Reusing DataTable

interface ImportHistoryTableProps {
    organizationId: string | number;
}

export default function ImportHistoryTable({ organizationId }: ImportHistoryTableProps) {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, [organizationId]);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('superAdminToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/organizations/${organizationId}/import-history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setHistory(data);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-gray-500 text-center py-8">Loading history...</div>;

    const columns = [
        {
            header: 'Date',
            accessor: (row: any) => new Date(row.importedAt).toLocaleDateString() + ' ' + new Date(row.importedAt).toLocaleTimeString(),
            sortable: true
        },
        {
            header: 'Filename',
            accessor: (row: any) => (
                <div className="flex items-center gap-2 font-medium text-gray-900">
                    <FaFileCsv className="text-green-600" />
                    {row.filename}
                </div>
            )
        },
        {
            header: 'Status',
            accessor: (row: any) => (
                <span className={`px-2 py-1 text-xs rounded-full flex w-fit items-center gap-1 ${row.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        row.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {row.status === 'COMPLETED' && <FaCheckCircle size={10} />}
                    {row.status === 'PARTIAL' && <FaExclamationCircle size={10} />}
                    {row.status}
                </span>
            )
        },
        {
            header: 'Results',
            accessor: (row: any) => (
                <div className="text-sm">
                    <span className="text-green-600 font-bold">{row.successCount}</span> Success,{' '}
                    <span className="text-red-500 font-bold">{row.failureCount}</span> Failed
                </div>
            )
        },
        {
            header: 'Total',
            accessor: 'totalRows'
        }
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-gray-800">Bulk Import History</h3>
            </div>
            <div className="p-0">
                <DataTable
                    columns={columns}
                    data={history}
                    emptyMessage="No import history found."
                />
            </div>
        </div>
    );
}
