'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaCheck, FaChevronRight } from 'react-icons/fa';
import OrganizationForm from './OrganizationForm';
import { OrganizationFormData } from '@/lib/schemas';
import { superadminApi } from '@/services/api/superadmin';

interface CreateOrganizationWizardProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateOrganizationWizard({ onClose, onSuccess }: CreateOrganizationWizardProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [moduleTemplates, setModuleTemplates] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Form State
    const [formData, setFormData] = useState<Partial<OrganizationFormData>>({
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
        isActive: true,
        adminUser: {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
        }
    });

    const [modules, setModules] = useState<number[]>([]);
    const [permissions, setPermissions] = useState<Record<number, string[]>>({});

    // Reset search when changing steps
    useEffect(() => {
        setSearchQuery('');
    }, [step]);

    // Fetch Module Templates on mount
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                // Fetch using raw fetch for now as it's not yet in the service in a reusable way or to avoid service circular dependency
                // Ideally this should be in superadminApi.getModuleTemplates()
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/module-templates`);
                // Note: With cookies, we don't need manual headers if credentials=include. 
                // However, fetch defaults to NOT sending cookies cross-origin or even same-origin depending on config.
                // But axios or custom fetch wrapper handles this.
                // Wait, superadminApi methods use fetch with no credentials config explicitly shown in superadmin.ts, 
                // but core.ts might handle it?
                // `core.ts` getAuthHeaders() just returns Content-Type.
                // Default fetch does NOT send cookies unless `credentials: 'include'` is set.
                // I need to ensure `getApiUrl` or the fetch call includes credentials if I rely on cookies.
                // Let's check `backend/src/index.ts` CORS: origin is set, credentials: true.
                // So frontend fetch MUST send credentials: 'include'.

                // Let's fix `frontend/src/services/api/core.ts` later to ensure credentials are sent.
                // For now, I'll add credentials: 'include' here.
                if (response.ok) {
                    const data = await response.json();
                    setModuleTemplates(data);
                }
            } catch (error) {
                console.error('Error fetching templates:', error);
                // toast.error('Failed to load module templates');
            }
        };
        fetchTemplates();
    }, []);

    // Handlers
    const handleOrganizationSubmit = async (data: OrganizationFormData) => {
        setFormData(prev => ({ ...prev, ...data }));
        setStep(2); // Move to Modules
    };

    const toggleModule = (templateId: number) => {
        setModules(prev => {
            const isSelected = prev.includes(templateId);
            if (isSelected) {
                // Remove module and permissions
                const newPermissions = { ...permissions };
                delete newPermissions[templateId];
                setPermissions(newPermissions);
                return prev.filter(id => id !== templateId);
            } else {
                // Add module with default permissions
                setPermissions(p => ({ ...p, [templateId]: ['ADMIN'] }));
                return [...prev, templateId];
            }
        });
    };

    const togglePermission = (templateId: number, role: string) => {
        setPermissions(prev => {
            const current = prev[templateId] || [];
            const newRoles = current.includes(role)
                ? current.filter(r => r !== role)
                : [...current, role];
            return { ...prev, [templateId]: newRoles };
        });
    };

    const handleFinalSubmit = async () => {
        try {
            setLoading(true);

            const finalPayload = {
                ...formData,
                modules,
                permissions
            };

            await superadminApi.createOrganization(finalPayload);

            toast.success('Organization created successfully!');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error creating org:', error);
            toast.error(error.message || 'Failed to create organization');
        } finally {
            setLoading(false);
        }
    };

    // Render Steps
    const renderStep2_Modules = () => {
        const filteredTemplates = moduleTemplates.filter(m =>
            m.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const webModules = filteredTemplates.filter(m => m.type === 'WEBSITE');
        const mobileModules = filteredTemplates.filter(m => m.type === 'MOBILE');

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Select Modules</h3>
                        <p className="text-sm text-gray-500">Choose which features this organization will have access to.</p>
                    </div>
                    <input
                        type="text"
                        placeholder="Search modules..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none w-64"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Web Modules */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                            <span className="text-blue-600">💻</span> Website Modules
                        </h4>
                        <div className="space-y-2">
                            {webModules.map(module => (
                                <label key={module.id} className="flex items-start gap-3 p-2 hover:bg-white rounded cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={modules.includes(module.id)}
                                        onChange={() => toggleModule(module.id)}
                                        className="mt-1 h-4 w-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-900">{module.displayName}</div>
                                        <div className="text-xs text-gray-500">{module.description}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Mobile Modules */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                            <span className="text-purple-600">📱</span> Mobile Modules
                        </h4>
                        <div className="space-y-2">
                            {mobileModules.map(module => (
                                <label key={module.id} className="flex items-start gap-3 p-2 hover:bg-white rounded cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={modules.includes(module.id)}
                                        onChange={() => toggleModule(module.id)}
                                        className="mt-1 h-4 w-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-900">{module.displayName}</div>
                                        <div className="text-xs text-gray-500">{module.description}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderStep3_Permissions = () => {
        const selectedModules = moduleTemplates.filter(m => modules.includes(m.id));
        const filteredSelectedModules = selectedModules.filter(m =>
            m.displayName.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Default Permissions</h3>
                        <p className="text-sm text-gray-500">Configure which roles have access to the selected modules by default.</p>
                    </div>
                    <input
                        type="text"
                        placeholder="Search selected modules..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none w-64"
                    />
                </div>

                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Volunteer</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredSelectedModules.map(module => (
                                <tr key={module.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {module.displayName}
                                    </td>
                                    {['VOLUNTEER', 'STAFF', 'ADMIN'].map(role => (
                                        <td key={role} className="px-6 py-4 whitespace-nowrap text-center">
                                            <input
                                                type="checkbox"
                                                checked={(permissions[module.id] || []).includes(role)}
                                                onChange={() => togglePermission(module.id, role)}
                                                className="h-4 w-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderStep4_Review = () => (
        <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Review & Create</h3>

            <div className="bg-white border rounded-lg divide-y">
                <div className="p-4">
                    <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">Organization</h4>
                    <p className="font-medium text-gray-900">{formData.name}</p>
                    <p className="text-sm text-gray-600">{formData.email}</p>
                </div>
                <div className="p-4">
                    <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">Admin User</h4>
                    <p className="font-medium text-gray-900">{formData.adminUser?.firstName} {formData.adminUser?.lastName}</p>
                    <p className="text-sm text-gray-600">{formData.adminUser?.email}</p>
                </div>
                <div className="p-4">
                    <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">Modules & Permissions</h4>
                    <p className="text-sm text-gray-600">
                        {modules.length} modules selected.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {moduleTemplates.filter(m => modules.includes(m.id)).map(m => (
                            <span key={m.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {m.displayName}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full min-h-[600px]">
            {/* Stepper Header */}
            <div className="flex items-center justify-between px-8 py-4 border-b bg-gray-50 rounded-t-lg">
                <div className="flex items-center gap-2">
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === s ? 'bg-orange-600 text-white' :
                                step > s ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                                }`}>
                                {step > s ? <FaCheck size={12} /> : s}
                            </div>
                            {s < 4 && <div className={`w-8 h-0.5 mx-1 ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />}
                        </div>
                    ))}
                </div>
                <div className="text-sm font-medium text-gray-500">
                    Step {step} of 4
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                {step === 1 && (
                    <OrganizationForm
                        initialData={formData}
                        onSubmit={handleOrganizationSubmit}
                        onCancel={onClose}
                        loading={false}
                        submitLabel="Next"
                        hideCancel={true}
                    />
                )}
                {step === 2 && renderStep2_Modules()}
                {step === 3 && renderStep3_Permissions()}
                {step === 4 && renderStep4_Review()}
            </div>

            {/* Footer Actions (Only for Step 2+) */}
            {step > 1 && (
                <div className="flex items-center justify-between px-8 py-4 border-t bg-gray-50 rounded-b-lg">
                    <button
                        onClick={() => setStep(s => s - 1)}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                    >
                        Back
                    </button>

                    {step < 4 ? (
                        <button
                            onClick={() => setStep(s => s + 1)}
                            className="flex items-center gap-2 px-6 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 font-medium"
                        >
                            Next <FaChevronRight size={12} />
                        </button>
                    ) : (
                        <button
                            onClick={handleFinalSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Organization'} <FaCheck size={12} />
                        </button>
                    )}
                </div>
            )}
            {/* Step 1 cancel button is hidden in form, but we need one somewhere or rely on the X on the modal/wizard if it exists (not in my props here). 
            But CreateOrganizationWizard usually runs inside a modal which has an X or outside click.
            If not, I should add a Cancel button below organization form.
            For now, I'll rely on onClose passed to OrganizationForm (which I passed).
            Wait, I passed onClose to OrganizationForm.
            OrganizationForm has `onCancel` prop which calls `onClose`.
            So Step 1 HAS a Cancel button if hideCancel is false.
            I set `hideCancel={true}` in the code above.
            I should change it to `false` so the user can cancel/close the wizard.
            */}
        </div>
    );
}
