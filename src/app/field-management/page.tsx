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
  FaInfoCircle,
  FaLock,
  FaCopy
} from "react-icons/fa";
import { toast } from 'react-toastify';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

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

  // Sign Up Fields search and filter state
  const [orgSearchTerm, setOrgSearchTerm] = useState('');
  const [orgTypeFilter, setOrgTypeFilter] = useState<string>('all');
  
  // Organization Fields State
  const [registrationFields, setRegistrationFields] = useState<RegistrationField[]>([]);
  const [availableFields, setAvailableFields] = useState<FieldDefinition[]>([]);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgError, setOrgError] = useState("");
  const [showAddField, setShowAddField] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [selectedFieldIds, setSelectedFieldIds] = useState<number[]>([]);
  const [addFieldSearchTerm, setAddFieldSearchTerm] = useState('');
  const [addingField, setAddingField] = useState(false);

  // Reorder mode state
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [reorderedFields, setReorderedFields] = useState<RegistrationField[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

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
  // Copy volunteer registration link to clipboard
  const copyVolunteerRegistrationLink = async () => {
    try {
      const organizationId = getOrganizationId();
      if (!organizationId) {
        toast.error('Organization ID not found');
        return;
      }
  
      // Fetch organization details from API
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/organizations/${organizationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch organization:', errorData);
        toast.error(errorData.error || 'Failed to fetch organization details');
        return;
      }
  
      const organization = await response.json();
      console.log('Fetched organization:', organization);
      
      const orgName = organization.name;
  
      if (!orgName) {
        toast.error('Organization name not found');
        return;
      }
  
      const baseUrl = window.location.origin;
      const registrationUrl = `${baseUrl}/${orgName}/volunteer-registration`;
      try{
        await navigator.clipboard.writeText(registrationUrl);
        toast.success('Volunteer registration link copied to clipboard!');
      }
      catch(clipboardErr){
        const tempInput = document.createElement('input');
        tempInput.value = registrationUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        toast.success('Volunteer registration link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error copying registration link:', err);
      toast.error('Failed to copy link to clipboard');
    }
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
      setRegistrationFields(data.sort((a: RegistrationField, b: RegistrationField) => a.order - b.order));
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
          setSelectedFieldIds([]);
          setAddFieldSearchTerm('');
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
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response = await fetch(`${apiUrl}/api/fields/definitions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...addData,
          options: addData.options.filter(opt => opt.trim())
        }),
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
    if (!editId) {
      toast.error("No field selected for editing");
      return;
    }

    // Validate required fields
    if (!editData.name || !editData.label) {
      toast.error("Name and label are required");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response = await fetch(`${apiUrl}/api/fields/definitions/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...editData,
          options: Array.isArray(editData.options) ? editData.options.filter(opt => opt.trim()) : []
        }),
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
      if (!token) {
        throw new Error("No authentication token found");
      }
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
    if (selectedFieldIds.length === 0) return;

    try {
      setAddingField(true);
      const organizationId = getOrganizationId();
      if (!organizationId) {
        toast.error("Organization ID not found");
        return;
      }

      const token = localStorage.getItem("token");
      const addedFields: RegistrationField[] = [];
      
      // Add each selected field
      for (const fieldId of selectedFieldIds) {
        const response = await fetch(`${apiUrl}/api/organizations/${organizationId}/registration-fields`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fieldDefinitionId: fieldId,
            isRequired: false,
            isActive: true
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to add field to organization");
        }

        const newRegistrationField = await response.json();
        addedFields.push(newRegistrationField);
      }

      setRegistrationFields([...registrationFields, ...addedFields]);
      setAvailableFields(availableFields.filter(field => !selectedFieldIds.includes(field.id)));
      setShowAddField(false);
      setSelectedFieldIds([]);
      setAddFieldSearchTerm('');
      setSelectedFieldId(null);
      
      const message = selectedFieldIds.length === 1 
        ? "Field added to organization successfully!" 
        : `${selectedFieldIds.length} fields added to organization successfully!`;
      toast.success(message);
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

  // Filter organization registration fields and sort by order
  const filteredRegistrationFields = registrationFields
    .filter(field => {
      const matchesSearch = field.fieldDefinition.name.toLowerCase().includes(orgSearchTerm.toLowerCase()) ||
                           field.fieldDefinition.label.toLowerCase().includes(orgSearchTerm.toLowerCase());
      const matchesType = orgTypeFilter === 'all' || field.fieldDefinition.fieldType === orgTypeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => a.order - b.order);

  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(reorderedFields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order values
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index + 1
    }));

    setReorderedFields(updatedItems);
  };

  // Toggle reorder mode
  const toggleReorderMode = () => {
    if (!isReorderMode) {
      // Entering reorder mode - initialize with current fields sorted by order
      const sortedFields = [...filteredRegistrationFields].sort((a, b) => a.order - b.order);
      setReorderedFields(sortedFields);
      setIsReorderMode(true);
    } else {
      // Exiting reorder mode - save changes
      handleSaveOrder();
    }
  };

  // Save the new order to the database
  const handleSaveOrder = async () => {
    try {
      setIsSavingOrder(true);
      const organizationId = getOrganizationId();
      if (!organizationId) {
        toast.error("Organization ID not found");
        return;
      }

      const token = localStorage.getItem("token");
      const updates = reorderedFields.map(field => ({
        id: field.id,
        order: field.order
      }));

      const response = await fetch(`${apiUrl}/api/organizations/${organizationId}/registration-fields/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save field order");
      }

      // Update the main registrationFields state with new order
      setRegistrationFields(prevFields => {
        const updatedFields = [...prevFields];
        reorderedFields.forEach(reorderedField => {
          const index = updatedFields.findIndex(f => f.id === reorderedField.id);
          if (index !== -1) {
            updatedFields[index] = reorderedField;
          }
        });
        // Sort by order after update
        return updatedFields.sort((a, b) => a.order - b.order);
      });

      setIsReorderMode(false);
      toast.success("Field order saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save field order");
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Cancel reorder mode
  const cancelReorderMode = () => {
    setIsReorderMode(false);
    setReorderedFields([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sign Up Fields</h1>
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
                Sign Up Fields
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
                          onChange={(e) => {
                            const newFieldType = e.target.value;
                            setAddData({
                              ...addData, 
                              fieldType: newFieldType,
                              options: (newFieldType === 'SELECT' || newFieldType === 'MULTISELECT' || newFieldType === 'BOOLEAN') ? addData.options : []
                            });
                          }}
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

                    {(addData.fieldType === 'SELECT' || addData.fieldType === 'MULTISELECT' || addData.fieldType === 'BOOLEAN') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {addData.fieldType === 'BOOLEAN' ? 'Options (one per line) - User selects one option' : 'Options (one per line)'}
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                          {addData.fieldType === 'BOOLEAN' 
                            ? 'Press Enter to add options. User will select only ONE option (e.g., Yes/No, Agree/Disagree).' 
                            : 'Press Enter to add a new option. Empty lines will be ignored when saving.'
                          }
                        </p>
                        <textarea
                          value={addData.options.join('\n')}
                          onChange={(e) => setAddData({...addData, options: e.target.value.split('\n')})}
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
                          onChange={(e) => {
                            const newFieldType = e.target.value;
                            setEditData({
                              ...editData, 
                              fieldType: newFieldType,
                              options: (newFieldType === 'SELECT' || newFieldType === 'MULTISELECT' || newFieldType === 'BOOLEAN') ? (editData.options || []) : []
                            });
                          }}
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

                    {(editData.fieldType === 'SELECT' || editData.fieldType === 'MULTISELECT' || editData.fieldType === 'BOOLEAN') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {editData.fieldType === 'BOOLEAN' ? 'Options (one per line) - User selects one option' : 'Options (one per line)'}
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                          {editData.fieldType === 'BOOLEAN' 
                            ? 'Press Enter to add options. User will select only ONE option (e.g., Yes/No, Agree/Disagree).' 
                            : 'Press Enter to add a new option. Empty lines will be ignored when saving.'
                          }
                        </p>
                        <textarea
                          value={Array.isArray(editData.options) ? editData.options.join('\n') : ''}
                          onChange={(e) => setEditData({...editData, options: e.target.value.split('\n')})}
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
                            {(() => {
                              const options = Array.isArray(field.options) ? field.options : (field.options ? [field.options] : []);
                              return options.length > 0 ? (
                                <div className="max-w-xs truncate">
                                  {options.slice(0, 2).join(', ')}
                                  {options.length > 2 && ` +${options.length - 2} more`}
                                </div>
                              ) : (
                                '-'
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditId(field.id);
                                  setEditData({
                                    ...field,
                                    options: Array.isArray(field.options) ? field.options : (field.options ? [field.options] : []),
                                    validation: field.validation || {},
                                    description: field.description || '',
                                    placeholder: field.placeholder || '',
                                    isSystemField: field.isSystemField || false
                                  });
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
            {/* Header with Search and Filter */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Sign Up Field Requirements</h3>
                  <p className="text-sm text-gray-600">Manage which fields are required for your organization</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={copyVolunteerRegistrationLink}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg flex items-center gap-2 hover:bg-gray-700 transition"
                    title="Copy volunteer registration link"
                  >
                    <FaCopy />
                    Copy Registration Link
                  </button>
                  <button
                    onClick={() => setShowAddField(true)}
                    className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center space-x-2"
                    disabled={isReorderMode}
                  >
                    <FaPlus />
                    <span>Add Field</span>
                  </button>
                  {isReorderMode ? (
                    <>
                      <button
                        onClick={cancelReorderMode}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center space-x-2"
                        disabled={isSavingOrder}
                      >
                        <FaTimes />
                        <span>Cancel</span>
                      </button>
                      <button
                        onClick={toggleReorderMode}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
                        disabled={isSavingOrder}
                      >
                        <FaSave />
                        <span>{isSavingOrder ? 'Saving...' : 'Save Order'}</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={toggleReorderMode}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                      disabled={filteredRegistrationFields.length === 0}
                    >
                      <FaGripVertical />
                      <span>Rearrange</span>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Search and Filter Controls */}
              <div className="flex space-x-4">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search fields..."
                    value={orgSearchTerm}
                    onChange={(e) => setOrgSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <select
                  value={orgTypeFilter}
                  onChange={(e) => setOrgTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">All Types</option>
                  {fieldTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Add Field Modal */}
            {showAddField && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Add Fields to Organization</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedFieldIds.length > 0 
                          ? `${selectedFieldIds.length} field${selectedFieldIds.length > 1 ? 's' : ''} selected`
                          : 'Select one or more fields to add'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowAddField(false);
                        setSelectedFieldIds([]);
                        setAddFieldSearchTerm('');
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search available fields..."
                        value={addFieldSearchTerm}
                        onChange={(e) => setAddFieldSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>

                    {/* Field List with Checkboxes */}
                    {availableFields.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FaInfoCircle className="mx-auto h-8 w-8 mb-2" />
                        <p>All available fields are already assigned to your organization.</p>
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-md max-h-96 overflow-y-auto">
                        {availableFields
                          .filter(field => 
                            field.label.toLowerCase().includes(addFieldSearchTerm.toLowerCase()) ||
                            field.name.toLowerCase().includes(addFieldSearchTerm.toLowerCase()) ||
                            (field.description && field.description.toLowerCase().includes(addFieldSearchTerm.toLowerCase()))
                          )
                          .map(field => (
                            <label
                              key={field.id}
                              className="flex items-start p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <input
                                type="checkbox"
                                checked={selectedFieldIds.includes(field.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedFieldIds([...selectedFieldIds, field.id]);
                                  } else {
                                    setSelectedFieldIds(selectedFieldIds.filter(id => id !== field.id));
                                  }
                                }}
                                className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                              />
                              <div className="ml-3 flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-900">{field.label}</span>
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                    {fieldTypes.find(t => t.value === field.fieldType)?.label || field.fieldType}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">{field.name}</div>
                                {field.description && (
                                  <div className="text-xs text-gray-600 mt-1">{field.description}</div>
                                )}
                              </div>
                            </label>
                          ))}
                        {availableFields.filter(field => 
                          field.label.toLowerCase().includes(addFieldSearchTerm.toLowerCase()) ||
                          field.name.toLowerCase().includes(addFieldSearchTerm.toLowerCase()) ||
                          (field.description && field.description.toLowerCase().includes(addFieldSearchTerm.toLowerCase()))
                        ).length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <FaSearch className="mx-auto h-8 w-8 mb-2 text-gray-400" />
                            <p>No fields match your search.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Select All / Deselect All */}
                    {availableFields.length > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <button
                          onClick={() => {
                            const filteredFields = availableFields.filter(field => 
                              field.label.toLowerCase().includes(addFieldSearchTerm.toLowerCase()) ||
                              field.name.toLowerCase().includes(addFieldSearchTerm.toLowerCase()) ||
                              (field.description && field.description.toLowerCase().includes(addFieldSearchTerm.toLowerCase()))
                            );
                            setSelectedFieldIds(filteredFields.map(f => f.id));
                          }}
                          className="text-orange-600 hover:text-orange-700 font-medium"
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => setSelectedFieldIds([])}
                          className="text-gray-600 hover:text-gray-700 font-medium"
                        >
                          Clear Selection
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => {
                        setShowAddField(false);
                        setSelectedFieldIds([]);
                        setAddFieldSearchTerm('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddFieldToOrganization}
                      disabled={addingField || selectedFieldIds.length === 0}
                      className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {addingField ? <FaSave /> : <FaPlus />}
                      <span>
                        {addingField 
                          ? 'Adding...' 
                          : selectedFieldIds.length === 0 
                            ? 'Add Fields'
                            : `Add ${selectedFieldIds.length} Field${selectedFieldIds.length > 1 ? 's' : ''}`
                        }
                      </span>
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
                    Sign Up Fields ({filteredRegistrationFields.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  {isReorderMode ? (
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drag</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                          </tr>
                        </thead>
                        <Droppable droppableId="fields">
                          {(provided) => (
                            <tbody
                              className="bg-white divide-y divide-gray-200"
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                            >
                              {reorderedFields.map((field, index) => (
                                <Draggable key={field.id} draggableId={field.id.toString()} index={index}>
                                  {(provided, snapshot) => (
                                    <tr
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={snapshot.isDragging ? 'bg-blue-50 shadow-lg' : ''}
                                    >
                                      <td className="px-6 py-4 whitespace-nowrap" {...provided.dragHandleProps}>
                                        <FaGripVertical className="text-gray-400 cursor-move" />
                                      </td>
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
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          field.isRequired 
                                            ? 'bg-red-100 text-red-800' 
                                            : 'bg-gray-100 text-gray-800'
                                        }`}>
                                          {field.isRequired ? <FaToggleOn className="mr-1" /> : <FaToggleOff className="mr-1" />}
                                          {field.isRequired ? 'Required' : 'Optional'}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          field.isActive 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-gray-100 text-gray-800'
                                        }`}>
                                          {field.isActive ? <FaToggleOn className="mr-1" /> : <FaToggleOff className="mr-1" />}
                                          {field.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                      </td>
                                    </tr>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </tbody>
                          )}
                        </Droppable>
                      </table>
                    </DragDropContext>
                  ) : (
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
                        {filteredRegistrationFields.map((field) => (
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
                                {field.isRequired ? <FaToggleOn className="mr-1" /> : <FaToggleOff className="mr-1" />}
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
                              {field.fieldDefinition.isSystemField && (
                                <span className="flex items-center gap-1 text-gray-500"><FaLock /> System Field</span>
                              )}
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
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
