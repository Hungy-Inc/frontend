"use client";
import React, { useEffect, useState, useMemo } from "react";
import ReactDOM from 'react-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
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

const getFieldTypeInfo = (type: string) => {
  return fieldTypes.find(t => t.value === type) || { label: type };
};

const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ isOpen, onClose, title, children, footer }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out"
        aria-hidden="true"
        onClick={onClose}
      ></div>

      <div className="relative z-10 w-full max-w-2xl h-[80vh] flex flex-col transform overflow-visible rounded-xl bg-white/90 shadow-2xl backdrop-blur-lg transition-all duration-300 ease-out">
        <div className="p-6 flex-shrink-0">
          <div className="flex items-start justify-between">
            <h3 className="text-xl font-semibold text-gray-900" id="modal-title">
              {title}
            </h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 -mt-1 -mr-1 flex-shrink-0"
              onClick={onClose}
              aria-label="Close modal"
            >
              <span className="text-xl font-bold">&times;</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {children}
        </div>
        {footer && (
          <div className="bg-gray-50/70 px-6 py-4 flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0 flex-shrink-0 border-t border-gray-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

const FieldDefinitionForm: React.FC<{
  data: Partial<FieldDefinition>;
  onDataChange: (newData: Partial<FieldDefinition>) => void;
  isSystemField: boolean;
  isEditing?: boolean;
}> = ({ data, onDataChange, isSystemField, isEditing = false }) => {
  // When isSystemField prop changes, update the data
  React.useEffect(() => {
    if (isSystemField && !data.isSystemField) {
      onDataChange({ ...data, isSystemField: true });
    }
  }, [isSystemField]);
  const handleOptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onDataChange({ ...data, options: e.target.value.split('\n') });
  };

  const fieldType = data.fieldType || 'TEXT';
  const showOptions = ['SELECT', 'MULTISELECT', 'BOOLEAN'].includes(fieldType);

  return (
    <div className="space-y-6">
      {!isEditing && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
          <input
            type="checkbox"
            id="isSystemField"
            checked={data.isSystemField || false}
            onChange={(e) => onDataChange({ ...data, isSystemField: e.target.checked })}
            className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 cursor-pointer"
          />
          <label htmlFor="isSystemField" className="text-sm font-medium text-amber-900 cursor-pointer flex-1">
            System Field (Required by default)
          </label>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name (Internal ID)</label>
          <input
            type="text"
            value={data.name || ''}
            onChange={(e) => !isEditing && onDataChange({ ...data, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:text-gray-500"
            placeholder="e.g., emergencyContact"
            disabled={isEditing}
            aria-describedby="name-description"
          />
          <p className="mt-1 text-xs text-gray-500" id="name-description">
            {isEditing ? 'Field name cannot be changed.' : 'Use camelCase (e.g., emergencyContact)'}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Label (Display Name)</label>
          <input
            type="text"
            value={data.label || ''}
            onChange={(e) => onDataChange({ ...data, label: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-orange-500 focus:border-orange-500"
            placeholder="e.g., Emergency Contact"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={data.description || ''}
          onChange={(e) => onDataChange({ ...data, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-orange-500 focus:border-orange-500"
          rows={3}
          placeholder="Optional helper text for users..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Field Type</label>
          <select
            value={fieldType}
            onChange={(e) => {
              const newFieldType = e.target.value;
              onDataChange({
                ...data,
                fieldType: newFieldType,
                options: ['SELECT', 'MULTISELECT', 'BOOLEAN'].includes(newFieldType) ? (data.options || []) : []
              });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:text-gray-500"
            disabled={isSystemField}
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
            value={data.placeholder || ''}
            onChange={(e) => onDataChange({ ...data, placeholder: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-orange-500 focus:border-orange-500"
            placeholder="Optional placeholder text..."
          />
        </div>
      </div>

      {showOptions && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {fieldType === 'BOOLEAN' ? 'Options (User selects one)' : 'Options (one per line)'}
          </label>
          <p className="text-xs text-gray-500 mb-2">
            {fieldType === 'BOOLEAN'
              ? 'e.g., Yes/No, Agree/Disagree.'
              : 'Press Enter to add a new option.'
            }
          </p>
          <textarea
            value={Array.isArray(data.options) ? data.options.join('\n') : ''}
            onChange={handleOptionChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
            rows={4}
            placeholder="Option 1&#10;Option 2&#10;Option 3"
          />
        </div>
      )}

      {isSystemField && (
        <div className="flex items-center p-3 bg-blue-50 rounded-xl border border-blue-200">
          <span className="text-sm text-blue-700">
            This is a System Field. Type and Name cannot be changed.
          </span>
        </div>
      )}
    </div>
  );
};

const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const { label } = getFieldTypeInfo(type);
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      {label}
    </span>
  );
};

const SkeletonCard: React.FC = () => (
  <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-5 animate-pulse w-full">
    <div className="flex justify-between items-center mb-3">
      <div className="h-6 w-3/5 bg-gray-200 rounded"></div>
      <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
    </div>
    <div className="h-4 w-2/5 bg-gray-200 rounded mb-4"></div>
    <div className="h-6 w-1/4 bg-gray-200 rounded-full mb-4"></div>
    <div className="space-y-2">
      <div className="h-4 w-full bg-gray-200 rounded"></div>
      <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
    </div>
    <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
      <div className="h-8 w-16 bg-gray-200 rounded-lg"></div>
      <div className="h-8 w-16 bg-gray-200 rounded-lg"></div>
    </div>
  </div>
);

const EmptyState: React.FC<{
  title: string;
  message: string;
  action?: React.ReactNode;
}> = ({ title, message, action }) => (
  <div className="col-span-full flex flex-col items-center justify-center text-center p-12 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 w-full">
    <span className="text-4xl text-gray-400 mb-4 font-bold italic">i</span>
    <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
    <p className="mt-2 text-gray-600">{message}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>
);

const FieldDefinitionCard: React.FC<{
  field: FieldDefinition;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
}> = ({ field, onEdit, onDelete, onViewDetails }) => {

  return (
    <div className="flex flex-col justify-between bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 w-full overflow-hidden">
      <div className="p-5 overflow-hidden">
        <div className="flex justify-between items-start mb-3 gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-lg font-semibold text-gray-900 truncate font-mono" title={field.name}>{field.name}</h4>
            <p className="text-sm text-gray-500 truncate" title={field.label}>{field.label}</p>
          </div>
          <button
            onClick={onViewDetails}
            className="p-2 rounded-lg text-gray-500 hover:bg-blue-100 hover:text-blue-600 transition-colors flex-shrink-0"
            aria-label="View field details"
            title="View all details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="mb-4">
          <TypeBadge type={field.fieldType} />
          {field.isSystemField && (
            <span className="ml-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              System
            </span>
          )}
        </div>
        <div className="text-sm text-gray-600 line-clamp-2" title={field.description}>
          <span className="break-words">{field.description || <span className="italic text-gray-400">No description</span>}</span>
        </div>
      </div>
      <div className="flex justify-end space-x-3 p-4 bg-gray-50/70 rounded-b-xl border-t border-gray-100">
        {!field.isSystemField && (
          <button
            onClick={onDelete}
            className="p-2 rounded-lg text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
            aria-label={`Delete ${field.name}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
          aria-label={`Edit ${field.name}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
          Edit
        </button>
      </div>
    </div>
  );
};

const OrganizationFieldCard: React.FC<{
  field: RegistrationField;
  onToggleRequired: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
}> = ({ field, onToggleRequired, onToggleActive, onDelete, onViewDetails }) => {
  const { fieldDefinition } = field;
  const isSystem = fieldDefinition.isSystemField;

  return (
    <div
      className={`flex flex-col bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 transition-all duration-300 w-full hover:shadow-xl overflow-hidden`}
    >
      <div className="p-5 overflow-hidden">
        {/* Card Header */}
        <div className="flex justify-between items-start mb-3 gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-lg font-semibold text-gray-900 truncate font-mono" title={fieldDefinition.name}>{fieldDefinition.name}</h4>
            <p className="text-sm text-gray-500 truncate" title={fieldDefinition.label}>{fieldDefinition.label}</p>
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0">
            <span className="text-lg font-bold text-orange-600 w-6 text-center">{field.order}</span>
            <button
              onClick={onViewDetails}
              className="p-2 rounded-lg text-gray-500 hover:bg-blue-100 hover:text-blue-600 transition-colors flex-shrink-0"
              aria-label="View field details"
              title="View all details"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Badges */}
        <div className="mb-4 flex flex-wrap gap-2">
          <TypeBadge type={fieldDefinition.fieldType} />
          {isSystem && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
               System
            </span>
          )}
        </div>

        <div className="text-sm text-gray-600 line-clamp-2" title={fieldDefinition.description}>
          <span className="break-words">{fieldDefinition.description || <span className="italic text-gray-400">No description</span>}</span>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <button
            onClick={onToggleRequired}
            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${field.isRequired
                ? 'bg-orange-50 border-orange-200'
                : 'bg-gray-50 border-gray-200'
              } ${'hover:border-gray-300'}`}
            aria-pressed={field.isRequired}
          >
            <span className={`font-medium ${field.isRequired ? 'text-orange-700' : 'text-gray-700'}`}>
              Required
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${field.isRequired ? 'bg-orange-600 text-white' : 'bg-gray-400 text-white'}`}>
                {field.isRequired ? 'ON' : 'OFF'}
            </span>
          </button>
          <button
            onClick={onToggleActive}
            disabled={isSystem && fieldDefinition.name === 'email'} // Email is always active
            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${field.isActive
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
              } ${isSystem && fieldDefinition.name === 'email' ? 'cursor-not-allowed opacity-70' : 'hover:border-gray-300'}`}
            aria-pressed={field.isActive}
          >
            <span className={`font-medium ${field.isActive ? 'text-green-700' : 'text-gray-700'}`}>
              Active
            </span>
             <span className={`px-2 py-0.5 rounded-full text-xs ${field.isActive ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'}`}>
                 {field.isActive ? 'ON' : 'OFF'}
             </span>
          </button>
        </div>
      </div>
      {!isSystem && ( 
        <div className="flex justify-end p-4 bg-gray-50/70 rounded-b-xl border-t border-gray-100">
          <button
            onClick={onDelete}
            className="p-2 rounded-lg text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
            aria-label={`Remove ${fieldDefinition.name} from organization`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};


// --- MAIN PAGE COMPONENT ---

export default function FieldManagementPage() {
  const [activeTab, setActiveTab] = useState<'definitions' | 'organization'>('definitions');

  // Field Definitions State
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [saving, setSaving] = useState(false);

  // Modals State (Definitions)
  const [showAddModal, setShowAddModal] = useState(false);
  const [addData, setAddData] = useState<Partial<FieldDefinition>>({
    name: "",
    label: "",
    description: "",
    fieldType: "TEXT",
    validation: {},
    options: [],
    placeholder: "",
    isSystemField: false
  });
  const [editModalField, setEditModalField] = useState<FieldDefinition | null>(null);
  const [editData, setEditData] = useState<Partial<FieldDefinition>>({});

  // --- Organization State ---
  const [registrationFields, setRegistrationFields] = useState<RegistrationField[]>([]);
  const [availableFields, setAvailableFields] = useState<FieldDefinition[]>([]);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgError, setOrgError] = useState("");
  const [orgSearchTerm, setOrgSearchTerm] = useState('');
  const [orgTypeFilter, setOrgTypeFilter] = useState<string>('all');

  // Modals State (Organization)
  const [showAddOrgFieldModal, setShowAddOrgFieldModal] = useState(false);
  const [selectedFieldIds, setSelectedFieldIds] = useState<number[]>([]);
  const [addFieldSearchTerm, setAddFieldSearchTerm] = useState('');
  const [addingField, setAddingField] = useState(false);

  // Details Modal State
  const [detailsModalField, setDetailsModalField] = useState<FieldDefinition | null>(null);

  // Rearrange Modal State
  const [showRearrangeModal, setShowRearrangeModal] = useState(false);
  const [reorderedFields, setReorderedFields] = useState<RegistrationField[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
    } catch (err: any) { 
      setError(err.message || "Failed to load field definitions.");
      setFieldDefinitions([]);
    } finally {
      setLoading(false);
    }
  };

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
    } catch (err: any) {
      setOrgError(err.message || "Failed to load registration fields.");
      setRegistrationFields([]);
    } finally {
      setOrgLoading(false);
    }
  };

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
    } catch (err: any) { 
      console.error("Failed to load available fields:", err.message);
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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddModal(false);
        setEditModalField(null);
        setShowAddOrgFieldModal(false);
        // Removed setItemToDelete(null);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // --- Filtered Data ---

  const filteredFieldDefinitions = useMemo(() =>
    fieldDefinitions.filter(field => {
      const matchesSearch = field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.label.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || field.fieldType === typeFilter;
      return matchesSearch && matchesType;
    }), [fieldDefinitions, searchTerm, typeFilter]);

  const filteredAndSortedOrgFields = useMemo(() =>
    registrationFields
      .filter(field => {
        const matchesSearch = field.fieldDefinition.name.toLowerCase().includes(orgSearchTerm.toLowerCase()) ||
          field.fieldDefinition.label.toLowerCase().includes(orgSearchTerm.toLowerCase());
        const matchesType = orgTypeFilter === 'all' || field.fieldDefinition.fieldType === orgTypeFilter;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => a.order - b.order), // Ensure sorting is always applied
    [registrationFields, orgSearchTerm, orgTypeFilter]);

  const filteredAvailableFields = useMemo(() =>
    availableFields.filter(field =>
      field.label.toLowerCase().includes(addFieldSearchTerm.toLowerCase()) ||
      field.name.toLowerCase().includes(addFieldSearchTerm.toLowerCase()) ||
      (field.description && field.description.toLowerCase().includes(addFieldSearchTerm.toLowerCase()))
    ), [availableFields, addFieldSearchTerm]);


  const handleOpenAddModal = () => {
    setAddData({
      name: "", label: "", description: "", fieldType: "TEXT",
      validation: {}, options: [], placeholder: "", isSystemField: false
    });
    setShowAddModal(true);
  };

  const handleAddFieldDefinition = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");
      
      const response = await fetch(`${apiUrl}/api/fields/definitions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...addData,
          options: addData.options ? addData.options.filter(opt => opt && opt.trim()) : [] // Ensure options exist and filter empty strings
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add field definition");
      }

      const newField = await response.json();
      setFieldDefinitions(prev => [...prev, newField]); // Use functional update
      setShowAddModal(false);
      toast.success("Field definition added successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to add field definition");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEditModal = (field: FieldDefinition) => {
    setEditModalField(field);
    setEditData({
      ...field,
      options: Array.isArray(field.options) ? field.options : (field.options ? [field.options] : []),
      validation: field.validation || {},
      description: field.description || '',
      placeholder: field.placeholder || '',
    });
  };

  const handleUpdateFieldDefinition = async () => {
    if (!editModalField) return;

    if (!editData.name || !editData.label) {
      toast.error("Name and label are required");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(`${apiUrl}/api/fields/definitions/${editModalField.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...editData,
          options: Array.isArray(editData.options) ? editData.options.filter(opt => opt && opt.trim()) : [] // Ensure options exist and filter empty strings
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update field definition");
      }

      const updatedField = await response.json();
      setFieldDefinitions(prevFields => prevFields.map(field => // Use functional update
        field.id === editModalField.id ? updatedField : field
      ));
      setEditModalField(null);
      toast.success("Field definition updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update field definition");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFieldDefinition = async (id: number) => {
    try {
      const originalDefinitions = [...fieldDefinitions];
      setFieldDefinitions(prev => prev.filter(field => field.id !== id));

      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(`${apiUrl}/api/fields/definitions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setFieldDefinitions(originalDefinitions);
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete field definition");
      }

      toast.success("Field definition deleted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete field definition");
      fetchFieldDefinitions();
    }
  };

  const handleOpenAddOrgFieldModal = () => {
    setSelectedFieldIds([]);
    setAddFieldSearchTerm('');
    setShowAddOrgFieldModal(true);
  };

  const handleAddFieldToOrganization = async () => {
    if (selectedFieldIds.length === 0) return;

    try {
      setAddingField(true);
      const organizationId = getOrganizationId();
      if (!organizationId) throw new Error("Organization ID not found");

      const token = localStorage.getItem("token");
      const addedFields: RegistrationField[] = [];

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

          const fieldName = availableFields.find(f => f.id === fieldId)?.name || `ID ${fieldId}`;
          throw new Error(`Failed to add field ${fieldName}: ${errorData.error || 'Unknown error'}`);
        }
        addedFields.push(await response.json());
      }

      // Update state using functional updates and ensure sorting
      setRegistrationFields(prev => [...prev, ...addedFields].sort((a, b) => a.order - b.order));
      setAvailableFields(prev => prev.filter(field => !selectedFieldIds.includes(field.id)));
      setShowAddOrgFieldModal(false);

      const message = selectedFieldIds.length === 1
        ? "Field added to organization successfully!"
        : `${selectedFieldIds.length} fields added to organization successfully!`;
      toast.success(message);
    } catch (err: any) {
      toast.error(err.message || "Failed to add field(s) to organization");
    } finally {
      setAddingField(false);
    }
  };

  const handleUpdateRegistrationField = async (id: number, updates: Partial<RegistrationField>) => {
    const originalFields = [...registrationFields]; 
    try {
      setRegistrationFields(prevFields =>
        prevFields.map(field =>
          field.id === id ? { ...field, ...updates } : field
        ).sort((a, b) => a.order - b.order) 
      );

      const organizationId = getOrganizationId();
      if (!organizationId) throw new Error("Organization ID not found");

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
        setRegistrationFields(originalFields);
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update field");
      }
      toast.success("Field updated successfully!");

    } catch (err: any) {
      toast.error(err.message || "Failed to update field");
      setRegistrationFields(originalFields); 
    }
  };

  const handleRemoveFieldFromOrganization = async (id: number) => {
    const originalRegFields = [...registrationFields];
    const originalAvailableFields = [...availableFields];
    const removedField = registrationFields.find(field => field.id === id);

    try {
      setRegistrationFields(prev => prev.filter(field => field.id !== id));
      if (removedField) {
        setAvailableFields(prev => [...prev, removedField.fieldDefinition]);
      }

      const organizationId = getOrganizationId();
      if (!organizationId) throw new Error("Organization ID not found");

      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/organizations/${organizationId}/registration-fields/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setRegistrationFields(originalRegFields);
        setAvailableFields(originalAvailableFields);
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove field from organization");
      }

      toast.success("Field removed from organization successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove field from organization");
      setRegistrationFields(originalRegFields);
      setAvailableFields(originalAvailableFields);
    }
  };


  const copyVolunteerRegistrationLink = async () => {
    try {
      const organizationId = getOrganizationId();
      if (!organizationId) throw new Error('Organization ID not found');

      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/organizations/${organizationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch organization details');

      const organization = await response.json();
      const orgName = organization.name;
      if (!orgName) throw new Error('Organization name not found');

      const baseUrl = window.location.origin;
      const registrationUrl = `${baseUrl}/${orgName}/volunteer-registration`;

      try {
        const tempInput = document.createElement('input');
        tempInput.value = registrationUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        toast.success('Volunteer registration link copied to clipboard!');
      } catch (copyErr) {
        console.error('Clipboard copy failed:', copyErr);
        toast.error('Failed to copy link automatically. Please copy it manually.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to copy link');
    }
  };

  const handleOpenRearrangeModal = () => {
    setReorderedFields([...registrationFields]);
    setShowRearrangeModal(true);
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const newFields = Array.from(reorderedFields);
    const [movedField] = newFields.splice(source.index, 1);
    newFields.splice(destination.index, 0, movedField);

    setReorderedFields(newFields);
  };

  const handleSaveFieldOrder = async () => {
    try {
      setIsSavingOrder(true);
      const organizationId = getOrganizationId();
      if (!organizationId) throw new Error('Organization ID not found');

      const token = localStorage.getItem('token');
      const updates = reorderedFields.map((field, index) => ({
        id: field.id,
        order: index + 1
      }));

      for (const update of updates) {
        const response = await fetch(`${apiUrl}/api/organizations/${organizationId}/registration-fields/${update.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ order: update.order }),
        });

        if (!response.ok) throw new Error('Failed to update field order');
      }

      setRegistrationFields(reorderedFields.map((field, index) => ({ ...field, order: index + 1 })));
      setShowRearrangeModal(false);
      toast.success('Field order updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save field order');
    } finally {
      setIsSavingOrder(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>

      <div className="min-h-screen text-gray-800">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Sign Up Fields</h1>
            <p className="mt-2 text-lg text-gray-600">
              Manage dynamic field definitions and organization requirements
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('definitions')}
                  className={`py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'definitions'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  aria-current={activeTab === 'definitions' ? 'page' : undefined}
                >
                  Field Definitions
                </button>
                <button
                  onClick={() => setActiveTab('organization')}
                  className={`py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'organization'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  aria-current={activeTab === 'organization' ? 'page' : undefined}
                >
                  Sign Up Fields
                </button>
              </nav>
            </div>
          </div>

          {/* FIELD DEFINITIONS */}
          {activeTab === 'definitions' && (
            <div className="animate-fade-in">
              {/* Header & Controls */}
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                         <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                       </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Search definitions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full sm:w-64 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                         <path d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" />
                       </svg>
                    </span>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="pl-10 pr-8 py-2 w-full sm:w-auto border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none transition bg-white"
                    >
                      <option value="all">All Types</option>
                      {fieldTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                       <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                     </svg>
                  </div>
                </div>
                <button
                  onClick={handleOpenAddModal}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 shadow-lg hover:shadow-orange-300/50 transition-all duration-300"
                >
                  <span className="text-xl font-bold">+</span>
                  <span>Add Field Definition</span>
                </button>
              </div>

              {/* Content Area */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : error ? (
                <EmptyState
                  title="Error Loading Definitions"
                  message={error}
                  action={
                    <button
                      onClick={fetchFieldDefinitions}
                      className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                         <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101A7.002 7.002 0 0110 3c3.866 0 7 3.134 7 7s-3.134 7-7 7a7.002 7.002 0 01-5.652-2.946A1 1 0 115.7 13.03A5.002 5.002 0 0010 15c2.757 0 5-2.243 5-5s-2.243-5-5-5a5.002 5.002 0 00-4.095 2.181V6a1 1 0 112 0v4a1 1 0 01-1 1H3a1 1 0 110-2h1V3a1 1 0 011-1z" clipRule="evenodd" />
                       </svg>
                       Retry
                    </button>
                  }
                />
              ) : filteredFieldDefinitions.length === 0 ? (
                <EmptyState
                  title="No Field Definitions Found"
                  message={searchTerm || typeFilter !== 'all' ? "Try adjusting your search or filter." : "Get started by adding a new field definition."}
                  action={
                    <button
                      onClick={handleOpenAddModal}
                      className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition"
                    >
                       <span className="text-xl font-bold">+</span> Add Definition
                    </button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredFieldDefinitions.map(field => (
                    <FieldDefinitionCard
                      key={field.id}
                      field={field}
                      onEdit={() => handleOpenEditModal(field)}
                      onDelete={() => handleDeleteFieldDefinition(field.id)}
                      onViewDetails={() => setDetailsModalField(field)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SIGN UP FIELDS */}
          {activeTab === 'organization' && (
            <div className="animate-fade-in">
              {/* Header*/}
              <p className="mb-4">Manage which fields are required for your organization</p>
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-200">
                 <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative">
                       <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                         </svg>
                       </span>
                      <input
                        type="text"
                        placeholder="Search your fields..."
                        value={orgSearchTerm}
                        onChange={(e) => setOrgSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full sm:w-64 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                      />
                    </div>
                    <div className="relative">
                       <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" />
                         </svg>
                       </span>
                      <select
                        value={orgTypeFilter}
                        onChange={(e) => setOrgTypeFilter(e.target.value)}
                        className="pl-10 pr-8 py-2 w-full sm:w-auto border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none transition bg-white"
                      >
                        <option value="all">All Types</option>
                        {fieldTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                         <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                       </svg>
                    </div>
                  </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={copyVolunteerRegistrationLink}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-600 text-white font-medium rounded-xl hover:bg-gray-700 transition"
                    title="Copy volunteer registration link"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                       <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                       <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                     </svg>
                    <span className="sm:hidden lg:inline">Copy Registration Link</span>
                  </button>

                  <button
                    onClick={handleOpenRearrangeModal}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition"
                    title="Rearrange field order"
                    disabled={registrationFields.length === 0}
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                       <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 11-2 0V4zm9 1a1 1 0 110-2h4a1 1 0 011 1v4a1 1 0 11-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L14.586 5H13a1 1 0 01-1-1zM3 15a1 1 0 011 1v1.586l2.293-2.293a1 1 0 111.414 1.414L5 18.586V17a1 1 0 11-2 0v-2zm9-1a1 1 0 110 2h-1.586l2.293 2.293a1 1 0 11-1.414 1.414L10 18.414V20a1 1 0 11-2 0v-4a1 1 0 011-1h4z" clipRule="evenodd" />
                     </svg>
                    <span className="sm:hidden lg:inline">Rearrange</span>
                  </button>
                  
                  <button
                      onClick={handleOpenAddOrgFieldModal}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 shadow-lg hover:shadow-orange-300/50 transition-all duration-300"
                    >
                       <span className="text-xl font-bold">+</span>
                      <span>Add Field</span>
                    </button>
                </div>
              </div>

              {/* Content Area */}
              {orgLoading ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : orgError ? (
                <EmptyState
                  title="Error Loading Fields"
                  message={orgError}
                  action={
                    <button
                      onClick={fetchRegistrationFields}
                      className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                         <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101A7.002 7.002 0 0110 3c3.866 0 7 3.134 7 7s-3.134 7-7 7a7.002 7.002 0 01-5.652-2.946A1 1 0 115.7 13.03A5.002 5.002 0 0010 15c2.757 0 5-2.243 5-5s-2.243-5-5-5a5.002 5.002 0 00-4.095 2.181V6a1 1 0 112 0v4a1 1 0 01-1 1H3a1 1 0 110-2h1V3a1 1 0 011-1z" clipRule="evenodd" />
                       </svg>
                       Retry
                    </button>
                  }
                />
              ) : filteredAndSortedOrgFields.length === 0 ? ( 
                <EmptyState
                  title="No Organization Fields"
                  message={orgSearchTerm || orgTypeFilter !== 'all' ? "Try adjusting your search or filter." : "Get started by adding fields to your registration form."}
                  action={
                    <button
                      onClick={handleOpenAddOrgFieldModal}
                      className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition"
                    >
                       <span className="text-xl font-bold">+</span> Add Field
                    </button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAndSortedOrgFields.map(field => ( 
                    <OrganizationFieldCard
                      key={field.id}
                      field={field}
                      onToggleRequired={() => handleUpdateRegistrationField(field.id, { isRequired: !field.isRequired })}
                      onToggleActive={() => handleUpdateRegistrationField(field.id, { isActive: !field.isActive })}
                      onDelete={() => handleRemoveFieldFromOrganization(field.id)}
                      onViewDetails={() => setDetailsModalField(field.fieldDefinition)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Add Field Definition Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Field Definition"
        footer={
          <>
            <button
              type="button"
              className="w-full justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:w-auto"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="w-full justify-center rounded-xl border border-transparent bg-orange-600 px-4 py-2.5 text-base font-medium text-white shadow-sm hover:bg-orange-700 disabled:opacity-50 sm:w-auto flex items-center gap-2"
              onClick={handleAddFieldDefinition}
              disabled={saving || !addData.name || !addData.label}
            >
              <span>{saving ? 'Adding...' : 'Add Field'}</span>
            </button>
          </>
        }
      >
        <FieldDefinitionForm
          data={addData}
          onDataChange={setAddData}
          isSystemField={false}
          isEditing={false}
        />
      </Modal>

      {/* Edit Field Definition Modal */}
      <Modal
        isOpen={!!editModalField}
        onClose={() => setEditModalField(null)}
        title={`Edit "${editModalField?.name}"`}
        footer={
          <>
            <button
              type="button"
              className="w-full justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:w-auto"
              onClick={() => setEditModalField(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="w-full justify-center rounded-xl border border-transparent bg-orange-600 px-4 py-2.5 text-base font-medium text-white shadow-sm hover:bg-orange-700 disabled:opacity-50 sm:w-auto flex items-center gap-2"
              onClick={handleUpdateFieldDefinition}
              disabled={saving || !editData.name || !editData.label}
            >
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </>
        }
      >
        <FieldDefinitionForm
          data={editData}
          onDataChange={setEditData}
          isSystemField={editModalField?.isSystemField || false}
          isEditing={true}
        />
      </Modal>

      {/* Add Field to Organization Modal */}
      <Modal
        isOpen={showAddOrgFieldModal}
        onClose={() => setShowAddOrgFieldModal(false)}
        title="Add Fields to Organization"
        footer={
          <>
            <button
              type="button"
              className="w-full justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:w-auto"
              onClick={() => setShowAddOrgFieldModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="w-full justify-center rounded-xl border border-transparent bg-orange-600 px-4 py-2.5 text-base font-medium text-white shadow-sm hover:bg-orange-700 disabled:opacity-50 sm:w-auto flex items-center gap-2"
              onClick={handleAddFieldToOrganization}
              disabled={addingField || selectedFieldIds.length === 0}
            >
               <span>{addingField ? 'Adding...' : `Add ${selectedFieldIds.length} Field${selectedFieldIds.length !== 1 ? 's' : ''}`}</span>
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="relative">
             <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                 </svg>
               </span>
            <input
              type="text"
              placeholder="Search available fields..."
              value={addFieldSearchTerm}
              onChange={(e) => setAddFieldSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            />
          </div>
          {availableFields.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
               <span className="text-4xl text-gray-400 mb-2 font-bold italic inline-block">i</span>
              <p>All available fields are already assigned.</p>
            </div>
          ) : (
            <>
              <div className="border border-gray-200 rounded-xl max-h-80 overflow-y-auto divide-y divide-gray-100">
                {filteredAvailableFields.map(field => (
                  <label
                    key={field.id}
                    className="flex items-start p-4 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFieldIds.includes(field.id)}
                      onChange={(e) => {
                        setSelectedFieldIds(ids =>
                          e.target.checked ? [...ids, field.id] : ids.filter(id => id !== field.id)
                        );
                      }}
                      className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900 font-mono">{field.name}</span>
                        <TypeBadge type={field.fieldType} />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{field.label}</div>
                      {field.description && (
                        <div className="text-xs text-gray-600 mt-1">{field.description}</div>
                      )}
                    </div>
                  </label>
                ))}
                {filteredAvailableFields.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <span className="text-4xl text-gray-400 mb-2 inline-block">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                         <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                       </svg>
                    </span>
                    <p>No fields match your search.</p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-sm pt-2">
                <button
                  onClick={() => setSelectedFieldIds(filteredAvailableFields.map(f => f.id))}
                  className="text-orange-600 hover:text-orange-700 font-medium"
                  disabled={filteredAvailableFields.length === 0}
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedFieldIds([])}
                  className="text-gray-600 hover:text-gray-700 font-medium"
                   disabled={selectedFieldIds.length === 0}
                >
                  Clear Selection ({selectedFieldIds.length})
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Field Details Modal */}
      <Modal
        isOpen={!!detailsModalField}
        onClose={() => setDetailsModalField(null)}
        title={`Field Details: ${detailsModalField?.name}`}
      >
        {detailsModalField && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Name (Internal ID)</label>
                <p className="text-sm text-gray-900 font-mono bg-gray-50 p-3 rounded-lg">{detailsModalField.name}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Label (Display Name)</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{detailsModalField.label}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Field Type</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{detailsModalField.fieldType}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">System Field</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{detailsModalField.isSystemField ? 'Yes' : 'No'}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg min-h-[60px]">{detailsModalField.description || <span className="italic text-gray-400">No description provided</span>}</p>
            </div>

            {detailsModalField.placeholder && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Placeholder</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{detailsModalField.placeholder}</p>
              </div>
            )}

            {detailsModalField.options && detailsModalField.options.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Options</label>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <ul className="space-y-1">
                    {detailsModalField.options.map((option, index) => (
                      <li key={index} className="text-sm text-gray-900 flex items-start">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-orange-100 text-orange-600 text-xs font-semibold mr-2 flex-shrink-0">{index + 1}</span>
                        <span>{option}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-500 pt-4 border-t border-gray-200">
              <div>
                <p className="font-semibold text-gray-700">Created</p>
                <p>{new Date(detailsModalField.createdAt).toLocaleDateString()} {new Date(detailsModalField.createdAt).toLocaleTimeString()}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Last Updated</p>
                <p>{new Date(detailsModalField.updatedAt).toLocaleDateString()} {new Date(detailsModalField.updatedAt).toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Rearrange Fields Modal */}
      <Modal
        isOpen={showRearrangeModal}
        onClose={() => setShowRearrangeModal(false)}
        title="Rearrange Field Order"
        footer={
          <>
            <button
              onClick={() => setShowRearrangeModal(false)}
              className="px-4 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveFieldOrder}
              disabled={isSavingOrder}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition font-medium"
            >
              {isSavingOrder ? 'Saving...' : 'Save Order'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          {reorderedFields.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No fields to rearrange</p>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="fields-list">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`space-y-2 p-2 rounded-lg transition ${
                      snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-transparent'
                    }`}
                    style={{
                      minHeight: '200px',
                      overflow: 'visible'
                    }}
                  >
                    {reorderedFields.map((field, index) => (
                      <Draggable
                        key={field.id}
                        draggableId={`field-${field.id}`}
                        index={index}
                      >
                        {(provided, snapshot) => {
                          const child = (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center gap-3 p-4 bg-white border-2 rounded-lg transition ${
                                snapshot.isDragging
                                  ? 'border-blue-500 shadow-lg bg-blue-50 opacity-95'
                                  : 'border-gray-200 hover:shadow-md'
                              }}`}
                              style={provided.draggableProps.style}
                            >
                              <div
                                {...provided.dragHandleProps}
                                className="flex-shrink-0 cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600 transition"
                                title="Drag to reorder"
                                aria-label="Drag handle"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </div>
                              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 font-semibold rounded-full text-sm">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{field.fieldDefinition.name}</p>
                                <p className="text-sm text-gray-500 truncate">{field.fieldDefinition.label}</p>
                              </div>
                            </div>
                          );

                          if (snapshot.isDragging) {
                            return ReactDOM.createPortal(child, document.body);
                          }

                          return child;
                        }}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </Modal>

    </>
  );
}
