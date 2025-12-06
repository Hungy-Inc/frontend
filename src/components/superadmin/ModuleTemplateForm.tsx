'use client';

import { useState, useEffect } from 'react';

interface ModuleTemplateFormProps {
    initialData?: any;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    loading: boolean;
}

export default function ModuleTemplateForm({ initialData, onSubmit, onCancel, loading }: ModuleTemplateFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        displayName: '',
        description: '',
        category: 'Operations',
        sortOrder: 0,
        icon: '',
        key: '',
        type: 'MOBILE'
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...formData,
                ...initialData
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Internal Name *</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        placeholder="e.g., inventory_management"
                    />
                    <p className="text-xs text-gray-500 mt-1">Unique identifier, no spaces</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Name *</label>
                    <input
                        type="text"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        placeholder="e.g., Inventory Management"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        name="description"
                        value={formData.description || ''}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    ></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Key *</label>
                    <input
                        type="text"
                        name="key"
                        value={formData.key}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        placeholder="e.g., mobile_inventory"
                    />
                    <p className="text-xs text-gray-500 mt-1">Unique code reference (e.g., mobile_inventory, website_users)</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                        <option value="MOBILE">Mobile App Feature</option>
                        <option value="WEBSITE">Website Admin Feature</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                        <option value="Analytics">Analytics</option>
                        <option value="Operations">Operations</option>
                        <option value="Management">Management</option>
                        <option value="Communication">Communication</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                    <input
                        type="number"
                        name="sortOrder"
                        value={formData.sortOrder}
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
                    {loading ? 'Saving...' : initialData ? 'Update Template' : 'Create Template'}
                </button>
            </div>
        </form>
    );
}
