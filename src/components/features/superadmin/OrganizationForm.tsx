import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { organizationSchema, OrganizationFormData } from '@/lib/schemas';

interface OrganizationFormProps {
    initialData?: Partial<OrganizationFormData>;
    onSubmit: (data: OrganizationFormData) => Promise<void>;
    onCancel: () => void;
    loading: boolean;
    isEditing?: boolean;
    submitLabel?: string;
    hideCancel?: boolean;
}

export default function OrganizationForm({ initialData, onSubmit, onCancel, loading, isEditing = false, submitLabel, hideCancel = false }: OrganizationFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(organizationSchema),
        defaultValues: {
            name: initialData?.name || '',
            email: initialData?.email || '',
            phone: initialData?.phone || '',
            address: initialData?.address || '',
            contactPerson: initialData?.contactPerson || '',
            timezone: initialData?.timezone || 'America/Halifax',
            incoming_dollar_value: initialData?.incoming_dollar_value || 10,
            mealsvalue: initialData?.mealsvalue || 10,
            foodboxmealscount: initialData?.foodboxmealscount || 2,
            backpackmealscount: initialData?.backpackmealscount || 10,
            notes: initialData?.notes || '',
            isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
            adminUser: {
                firstName: '',
                lastName: '',
                email: '',
                password: ''
            }
        }
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Organization Details */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Organization Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name *</label>
                        <input
                            {...register('name')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                        <input
                            {...register('email')}
                            type="email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                            {...register('phone')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                        <input
                            {...register('contactPerson')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <input
                            {...register('address')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                        <select
                            {...register('timezone')}
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
                            {...register('incoming_dollar_value')}
                            type="number"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                        {errors.incoming_dollar_value && <p className="text-red-500 text-xs mt-1">{errors.incoming_dollar_value.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Meal Value ($)</label>
                        <input
                            {...register('mealsvalue')}
                            type="number"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Food Box (meals/lb)</label>
                        <input
                            {...register('foodboxmealscount')}
                            type="number"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Backpack (meals/unit)</label>
                        <input
                            {...register('backpackmealscount')}
                            type="number"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Admin User (Only for new orgs) */}
            {!isEditing && (
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Initial Admin User</h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                <input
                                    {...register('adminUser.firstName')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                <input
                                    {...register('adminUser.lastName')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    {...register('adminUser.email')}
                                    type="email"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input
                                    {...register('adminUser.password')}
                                    type="password"
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
                    {...register('notes')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                ></textarea>
            </div>

            {/* Status Toggle (for edits) */}
            {isEditing && (
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        {...register('isActive')}
                        id="isActive"
                        className="rounded border-gray-300 text-orange-600 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active Organization</label>
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                {!hideCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50"
                >
                    {loading ? 'Saving...' : submitLabel || (isEditing ? 'Update Organization' : 'Create Organization')}
                </button>
            </div>
        </form>
    );
}
