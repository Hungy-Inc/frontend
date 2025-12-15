import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { donationLocationSchema, DonationLocationFormData } from '@/lib/schemas';

interface LocationFormProps {
    defaultValues?: Partial<DonationLocationFormData>;
    onSubmit: (data: DonationLocationFormData) => void;
    onCancel: () => void;
    isLoading?: boolean;
    submitLabel?: string;
}

export const LocationForm: React.FC<LocationFormProps> = ({
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
    } = useForm<DonationLocationFormData>({
        resolver: zodResolver(donationLocationSchema),
        defaultValues: {
            name: '',
            location: '',
            contactInfo: '',
            ...defaultValues
        }
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ marginBottom: 16 }}>
                <input
                    {...register('name')}
                    type="text"
                    placeholder="Name *"
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
                    {...register('location')}
                    type="text"
                    placeholder="Location *"
                    style={{
                        width: '100%',
                        padding: 8,
                        border: '1px solid #ddd',
                        borderRadius: 4,
                        borderColor: errors.location ? 'red' : '#ddd'
                    }}
                />
                {errors.location && (
                    <span style={{ color: 'red', fontSize: '12px' }}>{errors.location.message}</span>
                )}
            </div>

            <div style={{ marginBottom: 16 }}>
                <input
                    {...register('contactInfo')}
                    type="text"
                    placeholder="Contact Info (optional)"
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
                        background: isLoading ? '#10b981' : '#059669', // Emerald-600 vs Emerald-500
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
