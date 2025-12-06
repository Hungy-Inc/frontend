'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaFileExport, FaFilter, FaEye } from 'react-icons/fa';
import DataTable from '@/components/superadmin/DataTable';
import Modal from '@/components/superadmin/Modal';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        action: '',
        entityType: '',
        startDate: '',
        endDate: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0
    });
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('superAdminToken');

            let query = `?page=${pagination.page}&limit=${pagination.limit}`;
            if (filters.action) query += `&action=${filters.action}`;
            if (filters.entityType) query += `&entityType=${filters.entityType}`;
            if (filters.startDate) query += `&startDate=${filters.startDate}`;
            if (filters.endDate) query += `&endDate=${filters.endDate}`;

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/audit-logs${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setLogs(data.logs);
                setPagination(prev => ({
                    ...prev,
                    total: data.pagination.total,
                    totalPages: data.pagination.totalPages
                }));
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            toast.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [pagination.page, filters]);

    const handleExport = async () => {
        try {
            const token = localStorage.getItem('superAdminToken');
            let query = '?';
            if (filters.startDate) query += `&startDate=${filters.startDate}`;
            if (filters.endDate) query += `&endDate=${filters.endDate}`;

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/audit-logs/export${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                toast.error('Failed to export logs');
            }
        } catch (error) {
            console.error('Error exporting logs:', error);
            toast.error('Failed to export logs');
        }
    };

    const columns = [
        {
            header: 'Timestamp',
            accessor: (log: any) => new Date(log.createdAt).toLocaleString(),
            sortable: true
        },
        {
            header: 'Admin',
            accessor: (log: any) => (
                <div>
                    <div className="font-medium text-gray-900">{log.SuperAdmin.firstName} {log.SuperAdmin.lastName}</div>
                    <div className="text-xs text-gray-500">{log.SuperAdmin.email}</div>
                </div>
            )
        },
        {
            header: 'Action',
            accessor: (log: any) => (
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                    {log.action}
                </span>
            )
        },
        {
            header: 'Entity',
            accessor: (log: any) => (
                <div className="text-sm">
                    <span className="text-gray-500">{log.entityType}</span>
                    {log.entityId && <span className="text-gray-400 ml-1">#{log.entityId}</span>}
                </div>
            )
        },
        {
            header: 'IP Address',
            accessor: 'ipAddress'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Audit Logs</h1>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <FaFileExport />
                    <span>Export CSV</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Action Type</label>
                    <select
                        value={filters.action}
                        onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none w-40"
                    >
                        <option value="">All Actions</option>
                        <option value="LOGIN">Login</option>
                        <option value="CREATE_ORG">Create Org</option>
                        <option value="UPDATE_ORG">Update Org</option>
                        <option value="DELETE_ORG">Delete Org</option>
                        <option value="CREATE_USER">Create User</option>
                        <option value="UPDATE_USER">Update User</option>
                        <option value="ASSIGN_MODULES">Assign Modules</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Entity Type</label>
                    <select
                        value={filters.entityType}
                        onChange={(e) => setFilters(prev => ({ ...prev, entityType: e.target.value }))}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none w-40"
                    >
                        <option value="">All Entities</option>
                        <option value="Organization">Organization</option>
                        <option value="User">User</option>
                        <option value="Module">Module</option>
                        <option value="SuperAdmin">Super Admin</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                </div>

                <button
                    onClick={() => setFilters({ action: '', entityType: '', startDate: '', endDate: '' })}
                    className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 underline"
                >
                    Clear Filters
                </button>
            </div>

            <DataTable
                columns={columns}
                data={logs}
                loading={loading}
                pagination={{
                    currentPage: pagination.page,
                    totalPages: pagination.totalPages,
                    totalItems: pagination.total,
                    itemsPerPage: pagination.limit,
                    onPageChange: (page) => setPagination(prev => ({ ...prev, page }))
                }}
                actions={(log) => (
                    <button
                        onClick={() => {
                            setSelectedLog(log);
                            setIsModalOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                    >
                        <FaEye />
                    </button>
                )}
            />

            {/* Log Details Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Audit Log Details"
                size="lg"
            >
                {selectedLog && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">Timestamp</label>
                                <div className="mt-1 text-sm text-gray-900">{new Date(selectedLog.createdAt).toLocaleString()}</div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">Action</label>
                                <div className="mt-1 text-sm font-mono bg-gray-100 inline-block px-2 py-1 rounded">{selectedLog.action}</div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">Super Admin</label>
                                <div className="mt-1 text-sm text-gray-900">
                                    {selectedLog.SuperAdmin.firstName} {selectedLog.SuperAdmin.lastName}
                                    <div className="text-gray-500 text-xs">{selectedLog.SuperAdmin.email}</div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">IP Address</label>
                                <div className="mt-1 text-sm text-gray-900">{selectedLog.ipAddress || '-'}</div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">Entity Type</label>
                                <div className="mt-1 text-sm text-gray-900">{selectedLog.entityType}</div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">Entity ID</label>
                                <div className="mt-1 text-sm text-gray-900">{selectedLog.entityId || '-'}</div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Action Details</label>
                            <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto border border-gray-200">
                                {JSON.stringify(selectedLog.details, null, 2)}
                            </pre>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-2">User Agent</label>
                            <div className="text-xs text-gray-600 break-all bg-gray-50 p-2 rounded border border-gray-200">
                                {selectedLog.userAgent || '-'}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
