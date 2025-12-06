'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaBuilding, FaUser, FaCubes, FaLock, FaCheck, FaChevronRight, FaChevronLeft } from 'react-icons/fa';

interface CreateOrganizationWizardProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateOrganizationWizard({ onClose, onSuccess }: CreateOrganizationWizardProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [moduleTemplates, setModuleTemplates] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState(''); // New search state

    // Form State
    const [formData, setFormData] = useState({
        // Step 1: Organization Details
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

        // Step 2: Admin User
        adminUser: {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: '',
            sameAsContact: false
        },

        // Step 3: Modules (array of template IDs)
        modules: [] as number[],

        // Step 4: Permissions (map of templateId -> roles[])
        permissions: {} as Record<number, string[]>
    });

    // Reset search when changing steps
    useEffect(() => {
        setSearchQuery('');
    }, [step]);

    // Fetch Module Templates on mount
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const token = localStorage.getItem('superAdminToken');
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/module-templates`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setModuleTemplates(data);
                }
            } catch (error) {
                console.error('Error fetching templates:', error);
                toast.error('Failed to load module templates');
            }
        };
        fetchTemplates();
    }, []);

    // Handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAdminChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;

        if (name === 'sameAsContact') {
            if (checked) {
                // Split contact person name if possible
                const parts = formData.contactPerson.split(' ');
                const firstName = parts[0] || '';
                const lastName = parts.slice(1).join(' ') || '';

                setFormData(prev => ({
                    ...prev,
                    adminUser: {
                        ...prev.adminUser,
                        sameAsContact: true,
                        firstName,
                        lastName,
                        email: prev.email
                    }
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    adminUser: { ...prev.adminUser, sameAsContact: false }
                }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                adminUser: { ...prev.adminUser, [name]: value }
            }));
        }
    };

    const toggleModule = (templateId: number) => {
        setFormData(prev => {
            const currentModules = prev.modules;
            const isSelected = currentModules.includes(templateId);
            let newModules;

            if (isSelected) {
                newModules = currentModules.filter(id => id !== templateId);
                // Also remove permissions for this module
                const newPermissions = { ...prev.permissions };
                delete newPermissions[templateId];
                return { ...prev, modules: newModules, permissions: newPermissions };
            } else {
                newModules = [...currentModules, templateId];
                // Default permissions: Admin only initially
                return {
                    ...prev,
                    modules: newModules,
                    permissions: { ...prev.permissions, [templateId]: ['ADMIN'] }
                };
            }
        });
    };

    const togglePermission = (templateId: number, role: string) => {
        setFormData(prev => {
            const currentPermissions = prev.permissions[templateId] || [];
            const hasPermission = currentPermissions.includes(role);
            let newRolePermissions;

            if (hasPermission) {
                newRolePermissions = currentPermissions.filter(r => r !== role);
            } else {
                newRolePermissions = [...currentPermissions, role];
            }

            return {
                ...prev,
                permissions: { ...prev.permissions, [templateId]: newRolePermissions }
            };
        });
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('superAdminToken');

            // Prepare payload
            const payload = {
                ...formData,
                adminUser: {
                    firstName: formData.adminUser.firstName,
                    lastName: formData.adminUser.lastName,
                    email: formData.adminUser.email,
                    password: formData.adminUser.password
                }
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/organizations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast.success('Organization created successfully!');
                onSuccess();
                onClose();
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to create organization');
            }
        } catch (error) {
            console.error('Error creating org:', error);
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Validation
    const isStep1Valid = formData.name && formData.email;
    const isStep2Valid = formData.adminUser.email && formData.adminUser.password && (formData.adminUser.password === formData.adminUser.confirmPassword);

    // Render Steps
    const renderStep1 = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Organization Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                    <select name="timezone" value={formData.timezone} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
                        <option value="America/Halifax">Atlantic Time (Halifax)</option>
                        <option value="America/Toronto">Eastern Time (Toronto)</option>
                        <option value="America/Vancouver">Pacific Time (Vancouver)</option>
                        <option value="America/Edmonton">Mountain Time (Edmonton)</option>
                        <option value="America/Winnipeg">Central Time (Winnipeg)</option>
                        <option value="America/St_Johns">Newfoundland Time</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Incoming Value ($/lb)</label>
                    <input type="number" name="incoming_dollar_value" value={formData.incoming_dollar_value} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" step="0.01" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meal Value ($)</label>
                    <input type="number" name="mealsvalue" value={formData.mealsvalue} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" step="0.01" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Food Box (meals/lb)</label>
                    <input type="number" name="foodboxmealscount" value={formData.foodboxmealscount} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" step="0.01" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Backpack (meals/unit)</label>
                    <input type="number" name="backpackmealscount" value={formData.backpackmealscount} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" step="0.01" />
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">First Admin User</h3>

            <div className="flex items-center mb-4">
                <input
                    type="checkbox"
                    id="sameAsContact"
                    name="sameAsContact"
                    checked={formData.adminUser.sameAsContact}
                    onChange={handleAdminChange}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="sameAsContact" className="ml-2 block text-sm text-gray-900">
                    Use Organization Contact Details
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input type="text" name="firstName" value={formData.adminUser.firstName} onChange={handleAdminChange} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input type="text" name="lastName" value={formData.adminUser.lastName} onChange={handleAdminChange} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input type="email" name="email" value={formData.adminUser.email} onChange={handleAdminChange} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                    <input type="password" name="password" value={formData.adminUser.password} onChange={handleAdminChange} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                    <input type="password" name="confirmPassword" value={formData.adminUser.confirmPassword} onChange={handleAdminChange} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => {
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
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search modules..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none w-64"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Web Modules */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                            <span className="text-blue-600">💻</span> Website Modules
                        </h4>
                        <div className="space-y-2">
                            {webModules.length > 0 ? webModules.map(module => (
                                <label key={module.id} className="flex items-start gap-3 p-2 hover:bg-white rounded cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.modules.includes(module.id)}
                                        onChange={() => toggleModule(module.id)}
                                        className="mt-1 h-4 w-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-900">{module.displayName}</div>
                                        <div className="text-xs text-gray-500">{module.description}</div>
                                    </div>
                                </label>
                            )) : (
                                <p className="text-sm text-gray-500 italic p-2">No matching modules</p>
                            )}
                        </div>
                    </div>

                    {/* Mobile Modules */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                            <span className="text-purple-600">📱</span> Mobile Modules
                        </h4>
                        <div className="space-y-2">
                            {mobileModules.length > 0 ? mobileModules.map(module => (
                                <label key={module.id} className="flex items-start gap-3 p-2 hover:bg-white rounded cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.modules.includes(module.id)}
                                        onChange={() => toggleModule(module.id)}
                                        className="mt-1 h-4 w-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-900">{module.displayName}</div>
                                        <div className="text-xs text-gray-500">{module.description}</div>
                                    </div>
                                </label>
                            )) : (
                                <p className="text-sm text-gray-500 italic p-2">No matching modules</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderStep4 = () => {
        const selectedModules = moduleTemplates.filter(m => formData.modules.includes(m.id));
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
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search selected modules..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none w-64"
                        />
                    </div>
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
                                                checked={(formData.permissions[module.id] || []).includes(role)}
                                                onChange={() => togglePermission(module.id, role)}
                                                className="h-4 w-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            {filteredSelectedModules.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        {selectedModules.length === 0 ? "No modules selected. Go back to select modules." : "No matching modules found."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderStep5 = () => (
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
                    <p className="font-medium text-gray-900">{formData.adminUser.firstName} {formData.adminUser.lastName}</p>
                    <p className="text-sm text-gray-600">{formData.adminUser.email}</p>
                </div>
                <div className="p-4">
                    <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">Modules & Permissions</h4>
                    <p className="text-sm text-gray-600">
                        {formData.modules.length} modules selected with default permissions configured.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {moduleTemplates.filter(m => formData.modules.includes(m.id)).map(m => (
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
                    {[1, 2, 3, 4, 5].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === s ? 'bg-orange-600 text-white' :
                                step > s ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                                }`}>
                                {step > s ? <FaCheck size={12} /> : s}
                            </div>
                            {s < 5 && <div className={`w-8 h-0.5 mx-1 ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />}
                        </div>
                    ))}
                </div>
                <div className="text-sm font-medium text-gray-500">
                    Step {step} of 5
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
                {step === 5 && renderStep5()}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between px-8 py-4 border-t bg-gray-50 rounded-b-lg">
                <button
                    onClick={step === 1 ? onClose : () => setStep(s => s - 1)}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                    {step === 1 ? 'Cancel' : 'Back'}
                </button>

                {step < 5 ? (
                    <button
                        onClick={() => setStep(s => s + 1)}
                        disabled={step === 1 && !isStep1Valid || step === 2 && !isStep2Valid}
                        className="flex items-center gap-2 px-6 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next <FaChevronRight size={12} />
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Organization'} <FaCheck size={12} />
                    </button>
                )}
            </div>
        </div>
    );
}
