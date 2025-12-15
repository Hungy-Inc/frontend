import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { outreachLocationSchema, OutreachLocationFormData } from '@/lib/schemas';

interface OutreachLocationFormProps {
    defaultValues?: Partial<OutreachLocationFormData>;
    onSubmit: (data: OutreachLocationFormData) => void;
    onCancel: () => void;
    isLoading?: boolean;
    submitLabel?: string;
}

export const OutreachLocationForm: React.FC<OutreachLocationFormProps> = ({
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
    } = useForm<OutreachLocationFormData>({
        resolver: zodResolver(outreachLocationSchema),
        defaultValues: {
            name: '',
            location: '',
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
                    placeholder="Location (optional)"
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
                        background: isLoading ? 'hsl(var(--primary))' : 'hsl(var(--primary))', // Keeping the orange theme
                        opacity: isLoading ? 0.7 : 1,
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
