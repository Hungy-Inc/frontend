'use client';

import { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema, UserFormData } from '@/lib/schemas';

interface UserFormProps {
    initialData?: any;
    organizations: any[];
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    loading: boolean;
    isCreate?: boolean;
}

export default function UserForm({ initialData, organizations, onSubmit, onCancel, loading, isCreate = false }: UserFormProps) {
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(userSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            role: 'VOLUNTEER',
            phone: '',
            address: '',
            organizationId: organizations.length === 1 ? organizations[0].id : undefined
        }
    });

    useEffect(() => {
        if (initialData) {
            reset({
                firstName: initialData.firstName,
                lastName: initialData.lastName,
                email: initialData.email,
                role: initialData.role,
                phone: initialData.phone || '',
                address: initialData.address || '',
                organizationId: initialData.organizationId,
                password: '' // Don't show password on edit
            });
        } else if (organizations.length === 1) {
            setValue('organizationId', organizations[0].id);
        }
    }, [initialData, organizations, reset, setValue]);

    const handleFormSubmit: SubmitHandler<UserFormData> = async (data) => {
        await onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                        type="text"
                        {...register('firstName')}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                        type="text"
                        {...register('lastName')}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                        type="email"
                        {...register('email')}
                        disabled={!isCreate}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none disabled:bg-gray-100 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                </div>

                {isCreate && (
                    <div className="md:col-span-2">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                                <strong>Default Password:</strong> New users will use <code className="bg-blue-100 px-2 py-1 rounded">password123</code>
                            </p>
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organization *</label>
                    <select
                        {...register('organizationId')}
                        disabled={organizations.length === 1}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${errors.organizationId ? 'border-red-500' : 'border-gray-300'}`}
                    >
                        <option value="">Select Organization</option>
                        {organizations.map(org => (
                            <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                    </select>
                    {errors.organizationId && <p className="mt-1 text-xs text-red-500">{errors.organizationId.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                    <select
                        {...register('role')}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none ${errors.role ? 'border-red-500' : 'border-gray-300'}`}
                    >
                        <option value="ADMIN">Admin</option>
                        <option value="STAFF">Staff</option>
                        <option value="VOLUNTEER">Volunteer</option>
                        <option value="DONOR">Donor</option>
                    </select>
                    {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                        type="text"
                        {...register('phone')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                        type="text"
                        {...register('address')}
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
