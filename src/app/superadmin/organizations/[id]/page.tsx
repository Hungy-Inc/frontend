'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaBuilding, FaUsers, FaPuzzlePiece, FaCog, FaCheck, FaTimes, FaToggleOn, FaToggleOff, FaMobileAlt, FaDesktop, FaUpload, FaShieldAlt, FaSearch } from 'react-icons/fa';
import Link from 'next/link';
import StatsCard from '@/components/superadmin/StatsCard';
import DataTable from '@/components/superadmin/DataTable';
import Modal from '@/components/superadmin/Modal';
import OrganizationForm from '@/components/superadmin/OrganizationForm';
import UserForm from '@/components/superadmin/UserForm';
import BulkImportWizard from '@/components/superadmin/BulkImportWizard';
import ImportHistoryTable from '@/components/superadmin/ImportHistoryTable';

export default function OrganizationDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [organization, setOrganization] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [modules, setModules] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
    const [selectedTemplates, setSelectedTemplates] = useState<number[]>([]);
    const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
    const [permissionData, setPermissionData] = useState<Record<number, string[]>>({});
    const [permissionSearchTerm, setPermissionSearchTerm] = useState('');

    // Import state
    const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);
    const [showImportHistory, setShowImportHistory] = useState(false);

    const fetchOrganizationDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('superAdminToken');

            // Fetch Org Details
            const orgResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/organizations/${params.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (orgResponse.ok) {
                const data = await orgResponse.json();
                setOrganization(data);
            } else {
                toast.error('Failed to load organization');
                router.push('/superadmin/organizations');
                return;
            }

            // Fetch Modules
            const modulesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/organizations/${params.id}/modules`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (modulesResponse.ok) {
                setModules(await modulesResponse.json());
            }

            // Fetch Users
            const usersResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/organizations/${params.id}/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (usersResponse.ok) {
                setUsers(await usersResponse.json());
            }

        } catch (error) {
            console.error('Error fetching details:', error);
            toast.error('Failed to load details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (params.id) {
            fetchOrganizationDetails();
        }
    }, [params.id]);

    const fetchAvailableTemplates = async () => {
        try {
            const token = localStorage.getItem('superAdminToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/module-templates`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const templates = await response.json();
                // Filter out already assigned modules
                const assignedTemplateIds = modules.map(m => m.moduleTemplateId);
                setAvailableTemplates(templates.filter((t: any) => !assignedTemplateIds.includes(t.id)));
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const handleUpdateOrg = async (formData: any) => {
        try {
            const token = localStorage.getItem('superAdminToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/organizations/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                toast.success('Organization updated successfully');
                setIsEditModalOpen(false);
                fetchOrganizationDetails();
            } else {
                toast.error('Failed to update organization');
            }
        } catch (error) {
            console.error('Error updating org:', error);
            toast.error('Failed to update organization');
        }
    };

    const handleToggleModule = async (moduleId: number) => {
        try {
            const token = localStorage.getItem('superAdminToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/organizations/${params.id}/modules/${moduleId}/toggle`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                toast.success('Module status updated');
                fetchOrganizationDetails();
            }
        } catch (error) {
            console.error('Error toggling module:', error);
            toast.error('Failed to update module');
        }
    };

    const handleAssignModules = async () => {
        try {
            const token = localStorage.getItem('superAdminToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/organizations/${params.id}/modules`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ moduleTemplateIds: selectedTemplates })
            });

            if (response.ok) {
                toast.success('Modules assigned successfully');
                setIsModuleModalOpen(false);
                setSelectedTemplates([]);
                fetchOrganizationDetails();
            } else {
                toast.error('Failed to assign modules');
            }
        } catch (error) {
            console.error('Error assigning modules:', error);
            toast.error('Failed to assign modules');
        }
    };

    const handleCreateUser = async (formData: any) => {
        try {
            const token = localStorage.getItem('superAdminToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    organizationId: parseInt(formData.organizationId)
                })
            });

            if (response.ok) {
                toast.success('User created successfully');
                setIsUserModalOpen(false);
                fetchOrganizationDetails(); // Refresh users list
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to create user');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            toast.error('Failed to create user');
        }
    };

    const openPermissionModal = () => {
        // Initialize permission data from current modules
        const initialData: Record<number, string[]> = {};
        modules.forEach(m => {
            initialData[m.id] = m.RoleDefaultPermission?.map((p: any) => p.role) || [];
        });
        setPermissionData(initialData);
        setPermissionSearchTerm('');
        setIsPermissionModalOpen(true);
    };

    const togglePermission = (moduleId: number, role: string) => {
        setPermissionData(prev => {
            const current = prev[moduleId] || [];
            if (current.includes(role)) {
                return { ...prev, [moduleId]: current.filter(r => r !== role) };
            } else {
                return { ...prev, [moduleId]: [...current, role] };
            }
        });
    };

    const handleSavePermissions = async () => {
        try {
            const token = localStorage.getItem('superAdminToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/organizations/${params.id}/permissions`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ permissions: permissionData })
            });

            if (response.ok) {
                toast.success('Permissions updated successfully');
                setIsPermissionModalOpen(false);
                fetchOrganizationDetails(); // Refresh to get latest data
            } else {
                toast.error('Failed to update permissions');
            }
        } catch (error) {
            console.error('Error updating permissions:', error);
            toast.error('Failed to update permissions');
        }
    };


    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading organization details...</div>;
    }

    if (!organization) {
        return <div className="p-8 text-center text-red-500">Organization not found</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/superadmin/organizations"
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                >
                    <FaArrowLeft />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{organization.name}</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{organization.email}</span>
                        <span>•</span>
                        <span className={organization.isActive ? 'text-green-600' : 'text-red-600'}>
                            {organization.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex gap-6">
                    {[
                        { id: 'overview', label: 'Overview', icon: <FaBuilding /> },
                        { id: 'users', label: 'Users', icon: <FaUsers /> },
                        { id: 'modules', label: 'Modules', icon: <FaPuzzlePiece /> },
                        { id: 'settings', label: 'Settings', icon: <FaCog /> },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                ? 'border-orange-600 text-orange-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            <div className="py-4">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatsCard
                                title="Total Users"
                                value={organization._count?.User || 0}
                                icon={<FaUsers size={24} />}
                                color="blue"
                            />
                            <StatsCard
                                title="Active Modules"
                                value={modules.filter(m => m.isEnabled).length}
                                icon={<FaPuzzlePiece size={24} />}
                                color="orange"
                            />
                            <StatsCard
                                title="Shifts"
                                value={organization._count?.Shift || 0}
                                icon={<FaCheck size={24} />}
                                color="green"
                            />
                            <StatsCard
                                title="Donations"
                                value={organization._count?.Donation || 0}
                                icon={<FaCheck size={24} />}
                                color="purple"
                            />
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Organization Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Contact Person</label>
                                    <div className="mt-1 text-gray-900">{organization.contactPerson || '-'}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Phone</label>
                                    <div className="mt-1 text-gray-900">{organization.phone || '-'}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Address</label>
                                    <div className="mt-1 text-gray-900">{organization.address || '-'}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Timezone</label>
                                    <div className="mt-1 text-gray-900">{organization.timezone}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Onboarded At</label>
                                    <div className="mt-1 text-gray-900">{new Date(organization.onboardedAt).toLocaleDateString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setShowImportHistory(false)}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${!showImportHistory ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    All Users
                                </button>
                                <button
                                    onClick={() => setShowImportHistory(true)}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${showImportHistory ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Import History
                                </button>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
                                    onClick={() => setIsImportWizardOpen(true)}
                                >
                                    <FaUpload /> Bulk Import
                                </button>
                                <button
                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                                    onClick={() => setIsUserModalOpen(true)}
                                >
                                    Add User
                                </button>
                            </div>
                        </div>

                        {!showImportHistory ? (
                            <DataTable
                                columns={[
                                    { header: 'Name', accessor: (u: any) => `${u.firstName} ${u.lastName}`, sortable: true },
                                    { header: 'Email', accessor: 'email', sortable: true },
                                    { header: 'Role', accessor: 'role', sortable: true },
                                    {
                                        header: 'Status', accessor: (u: any) => (
                                            <span className={`px-2 py-1 text-xs rounded-full ${u.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                u.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {u.status}
                                            </span>
                                        )
                                    },
                                    { header: 'Joined', accessor: (u: any) => new Date(u.createdAt).toLocaleDateString() }
                                ]}
                                data={users}
                                emptyMessage="No users found for this organization"
                            />
                        ) : (
                            <ImportHistoryTable organizationId={params.id as string} />
                        )}
                    </div>
                )}

                {activeTab === 'modules' && (
                    <div>
                        <div className="flex justify-end mb-4 gap-3">
                            <button
                                onClick={openPermissionModal}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
                            >
                                <FaShieldAlt /> Configure Defaults
                            </button>
                            <button
                                onClick={() => {
                                    fetchAvailableTemplates();
                                    setIsModuleModalOpen(true);
                                }}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                            >
                                Assign Modules
                            </button>
                        </div>

                        {/* Mobile Modules Section */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FaMobileAlt className="text-blue-500" /> Mobile App Features
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {modules.filter(m => !m.ModuleTemplate || m.ModuleTemplate.type === 'MOBILE').map((module) => (
                                    <div key={module.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                                                <FaPuzzlePiece />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-medium text-gray-900 truncate" title={module.name}>{module.name}</h3>
                                                <p className="text-xs text-gray-500 truncate" title={module.description}>{module.description || 'No description'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleToggleModule(module.id)}
                                            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${module.isEnabled
                                                ? 'text-green-600 hover:bg-green-50'
                                                : 'text-gray-400 hover:bg-gray-50'
                                                }`}
                                            title={module.isEnabled ? 'Disable' : 'Enable'}
                                        >
                                            {module.isEnabled ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                                        </button>
                                    </div>
                                ))}
                                {modules.filter(m => !m.ModuleTemplate || m.ModuleTemplate.type === 'MOBILE').length === 0 && (
                                    <div className="col-span-full text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                                        No mobile modules assigned.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Website Modules Section */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FaDesktop className="text-purple-500" /> Website Admin Features
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {modules.filter(m => m.ModuleTemplate?.type === 'WEBSITE').map((module) => (
                                    <div key={module.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                                                <FaPuzzlePiece />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-medium text-gray-900 truncate" title={module.name}>{module.name}</h3>
                                                <p className="text-xs text-gray-500 truncate" title={module.description}>{module.description || 'No description'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleToggleModule(module.id)}
                                            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${module.isEnabled
                                                ? 'text-green-600 hover:bg-green-50'
                                                : 'text-gray-400 hover:bg-gray-50'
                                                }`}
                                            title={module.isEnabled ? 'Disable' : 'Enable'}
                                        >
                                            {module.isEnabled ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                                        </button>
                                    </div>
                                ))}
                                {modules.filter(m => m.ModuleTemplate?.type === 'WEBSITE').length === 0 && (
                                    <div className="col-span-full text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                                        No website modules assigned.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="max-w-3xl">
                        <OrganizationForm
                            initialData={organization}
                            onSubmit={handleUpdateOrg}
                            onCancel={() => setActiveTab('overview')}
                            loading={false}
                        />
                    </div>
                )}
            </div>

            {/* Edit Modal (if needed separate from settings tab) */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Organization"
                size="lg"
            >
                <OrganizationForm
                    initialData={organization}
                    onSubmit={handleUpdateOrg}
                    onCancel={() => setIsEditModalOpen(false)}
                    loading={false}
                />
            </Modal>

            {/* Assign Modules Modal */}
            <Modal
                isOpen={isModuleModalOpen}
                onClose={() => setIsModuleModalOpen(false)}
                title="Assign Modules"
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">Select modules to assign to this organization:</p>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {/* Mobile Templates */}
                        <div className="mb-4">
                            <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2 sticky top-0 bg-white py-1 z-10">
                                <FaMobileAlt className="text-blue-500" /> Mobile App Features
                            </h4>
                            <div className="space-y-2">
                                {availableTemplates.filter(t => t.type === 'MOBILE').map((template) => (
                                    <label key={template.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedTemplates.includes(template.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedTemplates([...selectedTemplates, template.id]);
                                                } else {
                                                    setSelectedTemplates(selectedTemplates.filter(id => id !== template.id));
                                                }
                                            }}
                                            className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                        />
                                        <div>
                                            <div className="font-medium text-gray-900">{template.displayName}</div>
                                            <div className="text-xs text-gray-500">{template.category}</div>
                                        </div>
                                    </label>
                                ))}
                                {availableTemplates.filter(t => t.type === 'MOBILE').length === 0 && (
                                    <div className="text-center py-2 text-gray-400 text-sm italic">
                                        No mobile modules available.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Website Templates */}
                        <div>
                            <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2 sticky top-0 bg-white py-1 z-10">
                                <FaDesktop className="text-purple-500" /> Website Admin Features
                            </h4>
                            <div className="space-y-2">
                                {availableTemplates.filter(t => t.type === 'WEBSITE').map((template) => (
                                    <label key={template.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedTemplates.includes(template.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedTemplates([...selectedTemplates, template.id]);
                                                } else {
                                                    setSelectedTemplates(selectedTemplates.filter(id => id !== template.id));
                                                }
                                            }}
                                            className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                        />
                                        <div>
                                            <div className="font-medium text-gray-900">{template.displayName}</div>
                                            <div className="text-xs text-gray-500">{template.category}</div>
                                        </div>
                                    </label>
                                ))}
                                {availableTemplates.filter(t => t.type === 'WEBSITE').length === 0 && (
                                    <div className="text-center py-2 text-gray-400 text-sm italic">
                                        No website modules available.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            onClick={() => setIsModuleModalOpen(false)}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAssignModules}
                            disabled={selectedTemplates.length === 0}
                            className="px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50"
                        >
                            Assign Selected
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Default Permissions Modal */}
            <Modal
                isOpen={isPermissionModalOpen}
                onClose={() => setIsPermissionModalOpen(false)}
                title="Configure Default Permissions"
                size="lg"
            >
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-600">
                            Configure which roles have access to modules by default. These settings apply to this organization only.
                        </p>
                    </div>

                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search modules..."
                            value={permissionSearchTerm}
                            onChange={(e) => setPermissionSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                        />
                    </div>

                    <div className="overflow-x-auto border rounded-lg max-h-[60vh]">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Module</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Volunteer</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Staff</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Admin</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {modules
                                    .filter(m => m.isEnabled)
                                    .filter(m =>
                                        m.name.toLowerCase().includes(permissionSearchTerm.toLowerCase()) ||
                                        (m.ModuleTemplate && m.ModuleTemplate.displayName.toLowerCase().includes(permissionSearchTerm.toLowerCase()))
                                    )
                                    .map(module => (
                                        <tr key={module.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {module.name}
                                                {module.ModuleTemplate && (
                                                    <span className="ml-2 text-xs text-gray-500 block font-normal">
                                                        {module.ModuleTemplate.displayName}
                                                    </span>
                                                )}
                                            </td>
                                            {['VOLUNTEER', 'STAFF', 'ADMIN'].map(role => (
                                                <td key={role} className="px-6 py-4 whitespace-nowrap text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={(permissionData[module.id] || []).includes(role)}
                                                        onChange={() => togglePermission(module.id, role)}
                                                        className="h-4 w-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                {modules.filter(m => m.isEnabled).length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                            No active modules found. Enable modules first.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            onClick={() => setIsPermissionModalOpen(false)}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSavePermissions}
                            className="px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 font-medium"
                        >
                            Save Permissions
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Add User Modal */}
            <Modal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                title="Add New User"
                size="md"
            >
                <UserForm
                    organizations={[organization]}
                    onSubmit={handleCreateUser}
                    onCancel={() => setIsUserModalOpen(false)}
                    loading={false}
                    isCreate={true}
                />
            </Modal>

            <BulkImportWizard
                isOpen={isImportWizardOpen}
                onClose={() => setIsImportWizardOpen(false)}
                organizationId={params.id as string}
                onSuccess={() => {
                    // Refresh users list
                    const token = localStorage.getItem('superAdminToken');
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/organizations/${params.id}/users`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }).then(res => res.json()).then(data => setUsers(data));
                }}
            />
        </div>
    );
}
