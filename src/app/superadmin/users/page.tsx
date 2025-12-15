'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaKey, FaFilter } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import { superadminApi } from '@/services/api/superadmin';
import DataTable from '@/components/superadmin/DataTable';
import Modal from '@/components/superadmin/Modal';
import UserForm from '@/components/superadmin/UserForm';
import { useSearchParams } from 'next/navigation';

export default function UsersPage() {
    const searchParams = useSearchParams();
    const [users, setUsers] = useState<any[]>([]);
    const [organizations, setOrganizations] = useState<any[]>([]);
    // search and filters are needed for query key and UI
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        organizationId: searchParams.get('orgId') || '',
        role: '',
        status: ''
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [newPassword, setNewPassword] = useState('');

    const { data: usersData, isLoading: loading, refetch: refetchUsers } = useQuery({
        queryKey: ['users', search, filters],
        queryFn: () => superadminApi.getUsers(search) // Note: API might need update to support filters if not already handling query string in getUsers
    });

    // Derived state from query result
    useEffect(() => {
        if (usersData?.users) {
            setUsers(usersData.users);
        } else if (Array.isArray(usersData)) {
            setUsers(usersData);
        }
    }, [usersData]);

    const { data: organizationsList = [] } = useQuery({
        queryKey: ['organizations', 'active'],
        queryFn: async () => {
            const data = await superadminApi.getOrganizations();
            return data.filter((org: any) => org.isActive);
        }
    });

    useEffect(() => {
        if (organizationsList) {
            setOrganizations(organizationsList);
        }
    }, [organizationsList]);


    // Open modal if action=create is in URL
    useEffect(() => {
        if (searchParams.get('action') === 'create') {
            handleCreate();
        }
    }, [searchParams]);

    const handleCreate = () => {
        setSelectedUser(null);
        setIsModalOpen(true);
    };

    const handleEdit = (user: any) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            await superadminApi.deleteUser(id);
            toast.success('User deleted successfully');
            refetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('Failed to delete user');
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !newPassword) return;

        try {
            setFormLoading(true);
            await superadminApi.resetUserPassword(selectedUser.id, newPassword);
            toast.success('Password reset successfully');
            setIsResetPasswordOpen(false);
            setNewPassword('');
            setSelectedUser(null);
        } catch (error) {
            console.error('Error resetting password:', error);
            toast.error('Failed to reset password');
        } finally {
            setFormLoading(false);
        }
    };

    const handleSubmit = async (formData: any) => {
        try {
            setFormLoading(true);

            if (selectedUser) {
                await superadminApi.updateUser(selectedUser.id, formData);
            } else {
                await superadminApi.createUser({
                    ...formData,
                    organizationId: Number(formData.organizationId)
                });
            }

            toast.success(`User ${selectedUser ? 'updated' : 'created'} successfully`);
            setIsModalOpen(false);
            refetchUsers();
        } catch (error: any) {
            console.error('Error saving user:', error);
            toast.error(error.message || 'Operation failed');
        } finally {
            setFormLoading(false);
        }
    };

    const columns = [
        {
            header: 'User',
            accessor: (u: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                        {u.firstName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{u.firstName} {u.lastName}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                    </div>
                </div>
            ),
            sortable: true
        },
        {
            header: 'Organization',
            accessor: (u: any) => u.organization?.name || '-',
            sortable: true
        },
        {
            header: 'Role',
            accessor: 'role',
            sortable: true
        },
        {
            header: 'Status',
            accessor: (u: any) => (
                <span className={`px-2 py-1 text-xs rounded-full ${u.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    u.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {u.status}
                </span>
            ),
            sortable: true
        },
        {
            header: 'Joined',
            accessor: (u: any) => new Date(u.createdAt).toLocaleDateString(),
            sortable: true
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Users Management</h1>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                    <FaPlus />
                    <span>Add User</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-gray-500">
                    <FaFilter />
                    <span className="text-sm font-medium">Filters:</span>
                </div>

                <select
                    value={filters.organizationId}
                    onChange={(e) => setFilters(prev => ({ ...prev, organizationId: e.target.value }))}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                >
                    <option value="">All Organizations</option>
                    {organizations.map(org => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                </select>

                <select
                    value={filters.role}
                    onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                >
                    <option value="">All Roles</option>
                    <option value="ADMIN">Admin</option>
                    <option value="STAFF">Staff</option>
                    <option value="VOLUNTEER">Volunteer</option>
                    <option value="DONOR">Donor</option>
                </select>

                <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                >
                    <option value="">All Statuses</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PENDING">Pending</option>
                    <option value="DENIED">Denied</option>
                </select>
            </div>

            <DataTable
                columns={columns}
                data={users}
                loading={loading}
                search={{
                    value: search,
                    onChange: setSearch,
                    placeholder: 'Search by name or email...'
                }}
                actions={(user) => (
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => {
                                setSelectedUser(user);
                                setIsResetPasswordOpen(true);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Reset Password"
                        >
                            <FaKey />
                        </button>
                        <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Edit"
                        >
                            <FaEdit />
                        </button>
                        <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                        >
                            <FaTrash />
                        </button>
                    </div>
                )}
            />

            {/* Create/Edit User Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedUser ? 'Edit User' : 'Add New User'}
                size="lg"
            >
                <UserForm
                    initialData={selectedUser}
                    organizations={organizations}
                    onSubmit={handleSubmit}
                    onCancel={() => setIsModalOpen(false)}
                    loading={formLoading}
                    isCreate={!selectedUser}
                />
            </Modal>

            {/* Reset Password Modal */}
            <Modal
                isOpen={isResetPasswordOpen}
                onClose={() => setIsResetPasswordOpen(false)}
                title="Reset Password"
                size="sm"
            >
                <form onSubmit={handleResetPassword} className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Enter a new password for <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>.
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={8}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setIsResetPasswordOpen(false)}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={formLoading}
                            className="px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50"
                        >
                            {formLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
