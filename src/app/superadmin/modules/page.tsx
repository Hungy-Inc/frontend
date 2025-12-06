'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaPuzzlePiece, FaSearch, FaMobileAlt, FaDesktop } from 'react-icons/fa';
import DataTable from '@/components/superadmin/DataTable';
import Modal from '@/components/superadmin/Modal';
import ModuleTemplateForm from '@/components/superadmin/ModuleTemplateForm';

export default function ModuleTemplatesPage() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'MOBILE' | 'WEBSITE'>('all');

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('superAdminToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/module-templates`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
            toast.error('Failed to load module templates');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleCreate = () => {
        setSelectedTemplate(null);
        setIsModalOpen(true);
    };

    const handleEdit = (template: any) => {
        setSelectedTemplate(template);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this module template?')) return;

        try {
            const token = localStorage.getItem('superAdminToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/module-templates/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success('Module template deleted successfully');
                fetchTemplates();
            } else {
                toast.error('Failed to delete module template');
            }
        } catch (error) {
            console.error('Error deleting template:', error);
            toast.error('Failed to delete module template');
        }
    };

    const handleSubmit = async (formData: any) => {
        try {
            setFormLoading(true);
            const token = localStorage.getItem('superAdminToken');
            const url = selectedTemplate
                ? `${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/module-templates/${selectedTemplate.id}`
                : `${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/module-templates`;

            const method = selectedTemplate ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                toast.success(`Module template ${selectedTemplate ? 'updated' : 'created'} successfully`);
                setIsModalOpen(false);
                fetchTemplates();
            } else {
                const data = await response.json();
                toast.error(data.error || 'Operation failed');
            }
        } catch (error) {
            console.error('Error saving template:', error);
            toast.error('Operation failed');
        } finally {
            setFormLoading(false);
        }
    };

    // Filter templates based on search and type
    const filteredTemplates = templates.filter(template => {
        const matchesSearch = searchTerm === '' ||
            template.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.description?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = typeFilter === 'all' || template.type === typeFilter;

        return matchesSearch && matchesType;
    });

    const columns = [
        {
            header: 'Module Name',
            accessor: (t: any) => (
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.type === 'MOBILE' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                        }`}>
                        <FaPuzzlePiece />
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{t.displayName}</div>
                        <div className="text-xs text-gray-500">{t.name}</div>
                    </div>
                </div>
            ),
            sortable: true
        },
        {
            header: 'Type',
            accessor: (t: any) => (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${t.type === 'MOBILE'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                    {t.type === 'MOBILE' ? <FaMobileAlt /> : <FaDesktop />}
                    {t.type === 'MOBILE' ? 'Mobile' : 'Website'}
                </span>
            ),
            sortable: true
        },
        {
            header: 'Key',
            accessor: (t: any) => <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">{t.key}</code>
        },
        {
            header: 'Description',
            accessor: (t: any) => <div className="truncate max-w-xs text-gray-500">{t.description || '-'}</div>
        },
        {
            header: 'Assigned To',
            accessor: (t: any) => (
                <span className="text-gray-700">
                    {t._count?.modules || 0} {t._count?.modules === 1 ? 'Org' : 'Orgs'}
                </span>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Module Templates</h1>
                    <p className="text-sm text-gray-600 mt-1">Manage module templates and assign them to organizations</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                    <FaPlus />
                    <span>Add Template</span>
                </button>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, key, or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Type Filter */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setTypeFilter('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${typeFilter === 'all'
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setTypeFilter('MOBILE')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${typeFilter === 'MOBILE'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <FaMobileAlt />
                            Mobile
                        </button>
                        <button
                            onClick={() => setTypeFilter('WEBSITE')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${typeFilter === 'WEBSITE'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <FaDesktop />
                            Website
                        </button>
                    </div>
                </div>

                {/* Results count */}
                <div className="mt-3 text-sm text-gray-600">
                    Showing {filteredTemplates.length} of {templates.length} templates
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <div className="text-blue-600 mt-0.5">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-blue-900">How to assign modules to organizations</h3>
                        <p className="text-sm text-blue-700 mt-1">
                            Go to <strong>Organizations</strong> → Select an organization → Click the <strong>Modules</strong> tab to assign or unassign modules.
                        </p>
                    </div>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={filteredTemplates}
                loading={loading}
                actions={(template) => (
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => handleEdit(template)}
                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Edit"
                        >
                            <FaEdit />
                        </button>
                        <button
                            onClick={() => handleDelete(template.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                        >
                            <FaTrash />
                        </button>
                    </div>
                )}
            />

            {/* Edit/Create Module Template Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedTemplate ? 'Edit Module Template' : 'Add New Module Template'}
                size="md"
            >
                <ModuleTemplateForm
                    initialData={selectedTemplate}
                    onSubmit={handleSubmit}
                    onCancel={() => setIsModalOpen(false)}
                    loading={formLoading}
                />
            </Modal>
        </div>
    );
}
