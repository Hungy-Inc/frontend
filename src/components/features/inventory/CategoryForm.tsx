import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { donationCategorySchema, DonationCategoryFormData } from '@/lib/schemas';

interface CategoryFormProps {
    defaultValues?: Partial<DonationCategoryFormData>;
    onSubmit: (data: DonationCategoryFormData) => void;
    onCancel: () => void;
    isLoading?: boolean;
    submitLabel?: string;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
    defaultValues,
    onSubmit,
    onCancel,
    isLoading,
    submitLabel = 'Save'
}) => {
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<DonationCategoryFormData>({
        resolver: zodResolver(donationCategorySchema),
        defaultValues: {
            name: '',
            icon: '',
            ...defaultValues
        }
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ marginBottom: 16 }}>
                <input
                    {...register('name')}
                    type="text"
                    placeholder="Name"
                    style={{
                        width: '100%',
                        padding: 8,
                        border: '1px solid #ddd',
                        borderRadius: 4,
                        borderColor: errors.name ? 'red' : '#ddd'
                    }}
                />
                {errors.name && (
                    <span style={{ color: 'red', fontSize: '12px' }}>{errors.name.message}</span>
                )}
            </div>

            <div style={{ marginBottom: 16 }}>
                <input
                    {...register('icon')}
                    type="text"
                    placeholder="Icon (optional)"
                    style={{
                        width: '100%',
                        padding: 8,
                        border: '1px solid #ddd',
                        borderRadius: 4
                    }}
                />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                    type="button"
                    onClick={onCancel}
                    style={{
                        padding: '8px 16px',
                        background: '#e5e7eb',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer'
                    }}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                        padding: '8px 16px',
                        background: isLoading ? '#93c5fd' : '#2563eb', // Blue-600 vs Blue-300
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isLoading ? 'Saving...' : submitLabel}
                </button>
            </div>
        </form>
    );
};
