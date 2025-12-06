'use client';

import { useState, useEffect } from 'react';

interface UserFormProps {
    initialData?: any;
    organizations: any[];
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    loading: boolean;
    isCreate?: boolean;
}

export default function UserForm({ initialData, organizations, onSubmit, onCancel, loading, isCreate = false }: UserFormProps) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        organizationId: organizations.length === 1 ? organizations[0].id.toString() : '',
        role: 'VOLUNTEER',
        phone: '',
        address: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...formData,
                ...initialData,
                organizationId: initialData.organizationId?.toString() || '',
                password: '' // Don't show password on edit
            });
        } else if (organizations.length === 1 && !formData.organizationId) {
            // Pre-select if only one organization
            setFormData(prev => ({
                ...prev,
                organizationId: organizations[0].id.toString()
            }));
        }
    }, [initialData, organizations]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={!isCreate} // Email cannot be changed after creation usually
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none disabled:bg-gray-100"
                    />
                </div>
                {isCreate && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required={isCreate}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organization *</label>
                    <select
                        name="organizationId"
                        value={formData.organizationId}
                        onChange={handleChange}
                        required
                        disabled={organizations.length === 1}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                        <option value="">Select Organization</option>
                        {organizations.map(org => (
                            <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                        <option value="ADMIN">Admin</option>
                        <option value="STAFF">Staff</option>
                        <option value="VOLUNTEER">Volunteer</option>
                        <option value="DONOR">Donor</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                        type="text"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                        type="text"
                        name="address"
                        value={formData.address || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50"
                >
                    {loading ? 'Saving...' : isCreate ? 'Create User' : 'Update User'}
                </button>
            </div>
        </form>
    );
}
