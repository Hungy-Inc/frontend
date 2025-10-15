"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  FaEdit, 
  FaTrash, 
  FaSave, 
  FaTimes, 
  FaPlus, 
  FaEye, 
  FaEyeSlash, 
  FaCheck, 
  FaBan, 
  FaUndo,
  FaCog,
  FaSearch,
  FaFilter,
  FaGripVertical,
  FaToggleOn,
  FaToggleOff,
  FaExclamationTriangle,
  FaInfoCircle
} from "react-icons/fa";
import { toast } from 'react-toastify';

interface FieldDefinition {
  id: number;
  name: string;
  label: string;
  description?: string;
  fieldType: string;
  validation?: any;
  options?: string[];
  placeholder?: string;
  isSystemField: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RegistrationField {
  id: number;
  organizationId: number;
  fieldDefinitionId: number;
  isRequired: boolean;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  fieldDefinition: FieldDefinition;
}

const fieldTypes = [
  { value: 'TEXT', label: 'Text Input' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Phone Number' },
  { value: 'DATE', label: 'Date' },
  { value: 'DATETIME', label: 'Date & Time' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'BOOLEAN', label: 'Checkbox' },
  { value: 'SELECT', label: 'Dropdown' },
  { value: 'MULTISELECT', label: 'Multi-Select' },
  { value: 'TEXTAREA', label: 'Text Area' },
  { value: 'FILE_UPLOAD', label: 'File Upload' },
  { value: 'RATING', label: 'Rating' },
  { value: 'SCALE', label: 'Scale' }
];

export default function FieldManagementPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'definitions' | 'organization'>('definitions');
  
  // Field Definitions State
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<FieldDefinition>>({});
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addData, setAddData] = useState({
    name: "",
    label: "",
    description: "",
    fieldType: "TEXT",
    validation: {},
    options: [] as string[],
    placeholder: "",
    isSystemField: false
  });
  const [adding, setAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Organization Fields State
  const [registrationFields, setRegistrationFields] = useState<RegistrationField[]>([]);
  const [availableFields, setAvailableFields] = useState<FieldDefinition[]>([]);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgError, setOrgError] = useState("");
  const [showAddField, setShowAddField] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [addingField, setAddingField] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Get user's organization ID
  const getOrganizationId = () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          return user.organizationId;
        } catch {
          return null;
        }
      }
    }
    return null;
  };

  // Fetch field definitions
  const fetchFieldDefinitions = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/fields/definitions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch field definitions");
      const data = await response.json();
      setFieldDefinitions(data);
    } catch (err) {
      setError("Failed to load field definitions.");
      setFieldDefinitions([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch organization registration fields
  const fetchRegistrationFields = async () => {
    try {
      setOrgLoading(true);
      setOrgError("");
      const organizationId = getOrganizationId();
      if (!organizationId) {
        setOrgError("Organization ID not found");
        return;
      }

      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/organizations/${organizationId}/registration-fields`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch registration fields");
      const data = await response.json();
      setRegistrationFields(data);
    } catch (err) {
      setOrgError("Failed to load registration fields.");
      setRegistrationFields([]);
    } finally {
      setOrgLoading(false);
    }
  };

  // Fetch available fields for organization
  const fetchAvailableFields = async () => {
    try {
      const organizationId = getOrganizationId();
      if (!organizationId) return;

      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/organizations/${organizationId}/available-fields`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch available fields");
      const data = await response.json();
      setAvailableFields(data);
    } catch (err) {
      console.error("Failed to load available fields:", err);
      setAvailableFields([]);
    }
  };

  useEffect(() => {
    fetchFieldDefinitions();
  }, []);

  useEffect(() => {
    if (activeTab === 'organization') {
      fetchRegistrationFields();
      fetchAvailableFields();
    }
  }, [activeTab]);

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editId) {
          setEditId(null);
          setEditData({});
        }
        if (showAdd) {
          setShowAdd(false);
        }
        if (showAddField) {
          setShowAddField(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [editId, showAdd, showAddField]);

  // Add new field definition
  const handleAddFieldDefinition = async () => {
    try {
      setAdding(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/fields/definitions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add field definition");
      }

      const newField = await response.json();
      setFieldDefinitions([...fieldDefinitions, newField]);
      setShowAdd(false);
      setAddData({
        name: "",
        label: "",
        description: "",
        fieldType: "TEXT",
        validation: {},
        options: [],
        placeholder: "",
        isSystemField: false
      });
      toast.success("Field definition added successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to add field definition");
    } finally {
      setAdding(false);
    }
  };

  // Update field definition
  const handleUpdateFieldDefinition = async () => {
    if (!editId) return;

    // Validate required fields
    if (!editData.name || !editData.label) {
      toast.error("Name and label are required");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/fields/definitions/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update field definition");
      }

      const updatedField = await response.json();
      setFieldDefinitions(fieldDefinitions.map(field => 
        field.id === editId ? updatedField : field
      ));
      setEditId(null);
      setEditData({});
      toast.success("Field definition updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update field definition");
    } finally {
      setSaving(false);
    }
  };

  // Delete field definition
  const handleDeleteFieldDefinition = async (id: number) => {
    if (!confirm("Are you sure you want to delete this field definition?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/fields/definitions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete field definition");
      }

      setFieldDefinitions(fieldDefinitions.filter(field => field.id !== id));
      toast.success("Field definition deleted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete field definition");
    }
  };

  // Add field to organization
  const handleAddFieldToOrganization = async () => {
    if (!selectedFieldId) return;

    try {
      setAddingField(true);
      const organizationId = getOrganizationId();
      if (!organizationId) {
        toast.error("Organization ID not found");
        return;
      }

      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/organizations/${organizationId}/registration-fields`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fieldDefinitionId: selectedFieldId,
          isRequired: false,
          isActive: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add field to organization");
      }

      const newRegistrationField = await response.json();
      setRegistrationFields([...registrationFields, newRegistrationField]);
      setAvailableFields(availableFields.filter(field => field.id !== selectedFieldId));
      setShowAddField(false);
      setSelectedFieldId(null);
      toast.success("Field added to organization successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to add field to organization");
    } finally {
      setAddingField(false);
    }
  };

  // Update organization field requirement
  const handleUpdateRegistrationField = async (id: number, updates: Partial<RegistrationField>) => {
    try {
      const organizationId = getOrganizationId();
      if (!organizationId) {
        toast.error("Organization ID not found");
        return;
      }

      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/organizations/${organizationId}/registration-fields/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update field requirement");
      }

      const updatedField = await response.json();
      setRegistrationFields(registrationFields.map(field => 
        field.id === id ? updatedField : field
      ));
      toast.success("Field requirement updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update field requirement");
    }
  };

  // Remove field from organization
  const handleRemoveFieldFromOrganization = async (id: number) => {
    if (!confirm("Are you sure you want to remove this field from your organization?")) return;

    try {
      const organizationId = getOrganizationId();
      if (!organizationId) {
        toast.error("Organization ID not found");
        return;
      }

      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/organizations/${organizationId}/registration-fields/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove field from organization");
      }

      const removedField = registrationFields.find(field => field.id === id);
      if (removedField) {
        setAvailableFields([...availableFields, removedField.fieldDefinition]);
      }
      setRegistrationFields(registrationFields.filter(field => field.id !== id));
      toast.success("Field removed from organization successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove field from organization");
    }
  };

  // Filter field definitions
  const filteredFieldDefinitions = fieldDefinitions.filter(field => {
    const matchesSearch = field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         field.label.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || field.fieldType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Field Management</h1>
          <p className="mt-2 text-gray-600">Manage dynamic field definitions and organization requirements</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('definitions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'definitions'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Field Definitions
              </button>
              <button
                onClick={() => setActiveTab('organization')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'organization'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Organization Fields
              </button>
            </nav>
          </div>
        </div>

        {/* Field Definitions Tab */}
        {activeTab === 'definitions' && (
          <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex space-x-4">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search fields..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">All Types</option>
                  {fieldTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowAdd(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center space-x-2"
              >
                <FaPlus />
                <span>Add Field Definition</span>
              </button>
            </div>

            {/* Add Field Modal */}
            {showAdd && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Add Field Definition</h3>
                    <button
                      onClick={() => setShowAdd(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={addData.name}
                          onChange={(e) => setAddData({...addData, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                          placeholder="e.g., emergencyContact"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                        <input
                          type="text"
                          value={addData.label}
                          onChange={(e) => setAddData({...addData, label: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                          placeholder="e.g., Emergency Contact"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={addData.description}
                        onChange={(e) => setAddData({...addData, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                        rows={3}
                        placeholder="Optional description..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Field Type</label>
                        <select
                          value={addData.fieldType}
                          onChange={(e) => setAddData({...addData, fieldType: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                        >
                          {fieldTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
                        <input
                          type="text"
                          value={addData.placeholder}
                          onChange={(e) => setAddData({...addData, placeholder: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Optional placeholder text..."
                        />
                      </div>
                    </div>

                    {(addData.fieldType === 'SELECT' || addData.fieldType === 'MULTISELECT') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Options (one per line)</label>
                        <textarea
                          value={addData.options.join('\n')}
                          onChange={(e) => setAddData({...addData, options: e.target.value.split('\n').filter(opt => opt.trim())})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                          rows={4}
                          placeholder="Option 1&#10;Option 2&#10;Option 3"
                        />
                      </div>
                    )}

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isSystemField"
                        checked={addData.isSystemField}
                        onChange={(e) => setAddData({...addData, isSystemField: e.target.checked})}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isSystemField" className="ml-2 block text-sm text-gray-700">
                        System Field (Required by default)
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => setShowAdd(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddFieldDefinition}
                      disabled={adding || !addData.name || !addData.label}
                      className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {adding ? <FaSave /> : <FaPlus />}
                      <span>{adding ? 'Adding...' : 'Add Field'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Field Modal */}
            {editId && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Edit Field Definition</h3>
                    <button
                      onClick={() => {
                        setEditId(null);
                        setEditData({});
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={editData.name || ''}
                          onChange={(e) => setEditData({...editData, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                          placeholder="e.g., emergencyContact"
                          disabled={editData.isSystemField}
                        />
                        {editData.isSystemField && (
                          <p className="text-xs text-gray-500 mt-1">System field name cannot be changed</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                        <input
                          type="text"
                          value={editData.label || ''}
                          onChange={(e) => setEditData({...editData, label: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                          placeholder="e.g., Emergency Contact"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={editData.description || ''}
                        onChange={(e) => setEditData({...editData, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                        rows={3}
                        placeholder="Optional description..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Field Type</label>
                        <select
                          value={editData.fieldType || 'TEXT'}
                          onChange={(e) => setEditData({...editData, fieldType: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                          disabled={editData.isSystemField}
                        >
                          {fieldTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                        {editData.isSystemField && (
                          <p className="text-xs text-gray-500 mt-1">System field type cannot be changed</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
                        <input
                          type="text"
                          value={editData.placeholder || ''}
                          onChange={(e) => setEditData({...editData, placeholder: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Optional placeholder text..."
                        />
                      </div>
                    </div>

                    {(editData.fieldType === 'SELECT' || editData.fieldType === 'MULTISELECT') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Options (one per line)</label>
                        <textarea
                          value={editData.options ? editData.options.join('\n') : ''}
                          onChange={(e) => setEditData({...editData, options: e.target.value.split('\n').filter(opt => opt.trim())})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                          rows={4}
                          placeholder="Option 1&#10;Option 2&#10;Option 3"
                        />
                      </div>
                    )}

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="editIsSystemField"
                        checked={editData.isSystemField || false}
                        onChange={(e) => setEditData({...editData, isSystemField: e.target.checked})}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        disabled={true}
                      />
                      <label htmlFor="editIsSystemField" className="ml-2 block text-sm text-gray-700">
                        System Field (Cannot be changed)
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => {
                        setEditId(null);
                        setEditData({});
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateFieldDefinition}
                      disabled={saving || !editData.name || !editData.label}
                      className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {saving ? <FaSave /> : <FaEdit />}
                      <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Field Definitions List */}
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                <p className="mt-2 text-gray-600">Loading field definitions...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <FaExclamationTriangle className="mx-auto h-12 w-12 text-red-400" />
                <p className="mt-2 text-red-600">{error}</p>
                <button
                  onClick={fetchFieldDefinitions}
                  className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Field Definitions ({filteredFieldDefinitions.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Options</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredFieldDefinitions.map((field) => (
                        <tr key={field.id} className={editId === field.id ? 'bg-orange-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{field.name}</div>
                            {field.description && (
                              <div className="text-sm text-gray-500">{field.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {field.label}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {fieldTypes.find(t => t.value === field.fieldType)?.label || field.fieldType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {field.isSystemField ? (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                System
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                Custom
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {field.options && field.options.length > 0 ? (
                              <div className="max-w-xs truncate">
                                {field.options.slice(0, 2).join(', ')}
                                {field.options.length > 2 && ` +${field.options.length - 2} more`}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditId(field.id);
                                  setEditData(field);
                                }}
                                className="text-orange-600 hover:text-orange-900 p-1 rounded hover:bg-orange-50 disabled:opacity-50"
                                title="Edit field definition"
                                disabled={saving}
                              >
                                <FaEdit />
                              </button>
                              {!field.isSystemField && (
                                <button
                                  onClick={() => handleDeleteFieldDefinition(field.id)}
                                  className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                  title="Delete field definition"
                                >
                                  <FaTrash />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Organization Fields Tab */}
        {activeTab === 'organization' && (
          <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Organization Field Requirements</h3>
                <p className="text-sm text-gray-600">Manage which fields are required for your organization</p>
              </div>
              <button
                onClick={() => setShowAddField(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center space-x-2"
              >
                <FaPlus />
                <span>Add Field</span>
              </button>
            </div>

            {/* Add Field Modal */}
            {showAddField && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Add Field to Organization</h3>
                    <button
                      onClick={() => setShowAddField(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Field</label>
                      <select
                        value={selectedFieldId || ''}
                        onChange={(e) => setSelectedFieldId(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="">Choose a field...</option>
                        {availableFields.map(field => (
                          <option key={field.id} value={field.id}>
                            {field.label} ({fieldTypes.find(t => t.value === field.fieldType)?.label})
                          </option>
                        ))}
                      </select>
                    </div>

                    {availableFields.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <FaInfoCircle className="mx-auto h-8 w-8 mb-2" />
                        <p>All available fields are already assigned to your organization.</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => setShowAddField(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddFieldToOrganization}
                      disabled={addingField || !selectedFieldId}
                      className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {addingField ? <FaSave /> : <FaPlus />}
                      <span>{addingField ? 'Adding...' : 'Add Field'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Organization Fields List */}
            {orgLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                <p className="mt-2 text-gray-600">Loading organization fields...</p>
              </div>
            ) : orgError ? (
              <div className="text-center py-8">
                <FaExclamationTriangle className="mx-auto h-12 w-12 text-red-400" />
                <p className="mt-2 text-red-600">{orgError}</p>
                <button
                  onClick={fetchRegistrationFields}
                  className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Organization Fields ({registrationFields.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {registrationFields.map((field) => (
                        <tr key={field.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {field.order}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{field.fieldDefinition.label}</div>
                            <div className="text-sm text-gray-500">{field.fieldDefinition.name}</div>
                            {field.fieldDefinition.description && (
                              <div className="text-sm text-gray-500">{field.fieldDefinition.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {fieldTypes.find(t => t.value === field.fieldDefinition.fieldType)?.label || field.fieldDefinition.fieldType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleUpdateRegistrationField(field.id, { isRequired: !field.isRequired })}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                field.isRequired 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {field.isRequired ? <FaCheck className="mr-1" /> : <FaBan className="mr-1" />}
                              {field.isRequired ? 'Required' : 'Optional'}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleUpdateRegistrationField(field.id, { isActive: !field.isActive })}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                field.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {field.isActive ? <FaToggleOn className="mr-1" /> : <FaToggleOff className="mr-1" />}
                              {field.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {!field.fieldDefinition.isSystemField && (
                              <button
                                onClick={() => handleRemoveFieldFromOrganization(field.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FaTrash />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
