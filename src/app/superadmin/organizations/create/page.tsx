'use client';

import { useRouter } from 'next/navigation';
import CreateOrganizationWizard from '@/components/superadmin/CreateOrganizationWizard';

export default function CreateOrganizationPage() {
    const router = useRouter();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Create Organization</h1>
                    <p className="text-sm text-gray-600 mt-1">Follow the steps to set up a new organization</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <CreateOrganizationWizard
                    onClose={() => router.push('/superadmin/organizations')}
                    onSuccess={() => router.push('/superadmin/organizations')}
                />
            </div>
        </div>
    );
}
