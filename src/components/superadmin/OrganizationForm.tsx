'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface OrganizationFormProps {
    initialData?: any;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    loading: boolean;
}

export default function OrganizationForm({ initialData, onSubmit, onCancel, loading }: OrganizationFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        contactPerson: '',
        timezone: 'America/Halifax',
        incoming_dollar_value: 10,
        mealsvalue: 10,
        foodboxmealscount: 2,
        backpackmealscount: 10,
        notes: '',
        // Admin user fields (only for creation)
        adminUser: {
            firstName: '',
            lastName: '',
            email: '',
            password: ''
        }
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...formData,
                ...initialData,
                adminUser: { firstName: '', lastName: '', email: '', password: '' } // Reset admin user fields
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAdminUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            adminUser: { ...prev.adminUser, [name]: value }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization Details */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Organization Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                        <input
                            type="text"
                            name="contactPerson"
                            value={formData.contactPerson || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                        <select
                            name="timezone"
                            value={formData.timezone}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        >
                            <option value="America/Halifax">Atlantic Time (Halifax)</option>
                            <option value="America/Toronto">Eastern Time (Toronto)</option>
                            <option value="America/Vancouver">Pacific Time (Vancouver)</option>
                            <option value="America/Edmonton">Mountain Time (Edmonton)</option>
                            <option value="America/Winnipeg">Central Time (Winnipeg)</option>
                            <option value="America/St_Johns">Newfoundland Time</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Configuration */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Incoming Value ($/lb)</label>
                        <input
                            type="number"
                            name="incoming_dollar_value"
                            value={formData.incoming_dollar_value}
                            onChange={handleChange}
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Meal Value ($)</label>
                        <input
                            type="number"
                            name="mealsvalue"
                            value={formData.mealsvalue}
                            onChange={handleChange}
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Food Box (meals/lb)</label>
                        <input
                            type="number"
                            name="foodboxmealscount"
                            value={formData.foodboxmealscount}
                            onChange={handleChange}
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Backpack (meals/unit)</label>
                        <input
                            type="number"
                            name="backpackmealscount"
                            value={formData.backpackmealscount}
                            onChange={handleChange}
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Admin User (Only for new orgs) */}
            {!initialData && (
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Initial Admin User</h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.adminUser.firstName}
                                    onChange={handleAdminUserChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.adminUser.lastName}
                                    onChange={handleAdminUserChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.adminUser.email}
                                    onChange={handleAdminUserChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.adminUser.password}
                                    onChange={handleAdminUserChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Leave blank to skip creating an admin user. You can add users later.
                        </p>
                    </div>
                </div>
            )}

            {/* Notes */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
                <textarea
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                ></textarea>
            </div>

            {/* Actions */}
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
                    {loading ? 'Saving...' : initialData ? 'Update Organization' : 'Create Organization'}
                </button>
            </div>
        </form>
    );
}
