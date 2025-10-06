"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaSave, FaArrowLeft, FaToggleOn, FaToggleOff, FaCog, FaTrash, FaPlus, FaCheck, FaBan } from "react-icons/fa";
import { toast } from 'react-toastify';

// Utility functions for Halifax timezone conversion
const convertUTCToHalifax = (utcTimeString: string): string => {
  const utcDate = new Date(utcTimeString);
  const halifaxDate = new Date(utcDate.toLocaleString("en-US", {timeZone: "America/Halifax"}));
  return halifaxDate.toISOString().slice(0, 16);
};

const convertHalifaxToUTC = (halifaxTimeString: string): string => {
  try {
    // If it's already a full datetime string, parse it directly

    
    if (halifaxTimeString.includes('T') && halifaxTimeString.includes('-')) {
      // It's already a datetime string, just return it as UTC
      return new Date(halifaxTimeString).toISOString();
    }
    
    // If it's just a time string (HH:MM), convert it to UTC
    const [hours, minutes] = halifaxTimeString.split(':');
    const halifaxDate = new Date();
    halifaxDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // Convert Halifax time to UTC
    const utcDate = new Date(halifaxDate.toLocaleString("en-US", {timeZone: "UTC"}));
    return utcDate.toISOString();
  } catch (error) {
    console.error('Error converting Halifax time to UTC:', error);
    return halifaxTimeString;
  }
};

interface ShiftDetails {
  id: number;
  name: string;
  dayOfWeek: number | null;
  startTime: string;
  endTime: string;
  shiftCategoryId: number;
  location: string;
  slots: number;
  organizationId: number;
  isRecurring: boolean;
  isActive: boolean;
  ShiftCategory: {
    id: number;
    name: string;
    icon?: string;
  };
}

interface CategoryOption {
  id: number;
  name: string;
  icon?: string;
}

export default function EditShiftPage() {
  const params = useParams();
  const router = useRouter();
  const shiftId = parseInt(params.shiftId as string);

  const [shift, setShift] = useState<ShiftDetails | null>(null);
  // Dynamic field management state
  const [shiftFields, setShiftFields] = useState<any[]>([]);
  const [availableFieldDefs, setAvailableFieldDefs] = useState<any[]>([]);
  const [fieldLoading, setFieldLoading] = useState(false);
  const [fieldSearchTerm, setFieldSearchTerm] = useState('');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Default Users state
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedDefaultUsers, setSelectedDefaultUsers] = useState<number[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [defaultUsersError, setDefaultUsersError] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [savingDefaultUsers, setSavingDefaultUsers] = useState(false);

  // Form state for shift details
  const [shiftForm, setShiftForm] = useState({
    name: '',
    dayOfWeek: 0,
    startTime: '',
    endTime: '',
    shiftCategoryId: '',
    location: '',
    slots: 1,
    isActive: true
  });

  useEffect(() => {
    if (shiftId) {
      fetchShiftDetails();
      fetchCategories();
      fetchAvailableUsers();
      loadAvailableFields();
      loadShiftFields();
    }
  }, [shiftId]);

  const fetchShiftDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Fetch shift details
      const shiftRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recurring-shifts/${shiftId}/edit`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!shiftRes.ok) {
        throw new Error('Failed to fetch shift details');
      }

      const shiftData = await shiftRes.json();
      setShift(shiftData);

      // Populate form with shift data
      setShiftForm({
        name: shiftData.name,
        dayOfWeek: shiftData.dayOfWeek || 0,
        startTime: shiftData.isRecurring 
          ? convertUTCToHalifax(shiftData.startTime).slice(11, 16) // Extract time part for recurring shifts
          : convertUTCToHalifax(shiftData.startTime), // Full datetime for one-time shifts
        endTime: shiftData.isRecurring 
          ? convertUTCToHalifax(shiftData.endTime).slice(11, 16) // Extract time part for recurring shifts
          : convertUTCToHalifax(shiftData.endTime), // Full datetime for one-time shifts
        shiftCategoryId: shiftData.shiftCategoryId.toString(),
        location: shiftData.location,
        slots: shiftData.slots,
        isActive: shiftData.isActive
      });

    } catch (err) {
      console.error('Error fetching shift details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch shift details');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shift-categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setDefaultUsersError('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchDefaultUsersForShift = async (shiftId: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recurring-shifts/${shiftId}/default-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedDefaultUsers(data.map((user: any) => user.id));
      }
    } catch (err) {
      console.error('Error fetching default users:', err);
    }
  };

  const handleSaveDefaultUsers = async () => {
    setSavingDefaultUsers(true);
    try {
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recurring-shifts/${shiftId}/default-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userIds: selectedDefaultUsers })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save default users');
      }

      toast.success('Default users saved successfully!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save default users');
    } finally {
      setSavingDefaultUsers(false);
    }
  };

  const handleShiftSave = async () => {
    if (!shift) return;
    
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      
      // Prepare update data based on shift type
      let updateData: any = {
        name: shiftForm.name,
        shiftCategoryId: Number(shiftForm.shiftCategoryId),
        location: shiftForm.location,
        slots: Number(shiftForm.slots),
        isActive: shiftForm.isActive,
        fieldRequirements: shiftFields.map(field => ({
          fieldDefinitionId: field.fieldDefinitionId,
          isRequired: field.isRequired,
          isActive: field.isActive
        }))
      };

      if (shift.isRecurring) {
        // Recurring shift - use time format with Halifax to UTC conversion
        const baseDate = '1969-06-10';
        updateData.dayOfWeek = Number(shiftForm.dayOfWeek);
        // Convert Halifax time to UTC for recurring shifts
        const startTimeUTC = convertHalifaxToUTC(`${baseDate}T${shiftForm.startTime}:00`);
        const endTimeUTC = convertHalifaxToUTC(`${baseDate}T${shiftForm.endTime}:00`);
        updateData.startTime = startTimeUTC;
        updateData.endTime = endTimeUTC;
      } else {
        // One-time shift - use full datetime with Halifax to UTC conversion
        updateData.startTime = convertHalifaxToUTC(shiftForm.startTime);
        updateData.endTime = convertHalifaxToUTC(shiftForm.endTime);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recurring-shifts/${shiftId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update shift');
      }

      // Note: Default users are saved separately using the "Save Default Users" button

      toast.success('Shift details updated successfully!');
      await fetchShiftDetails(); // Refresh data
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update shift');
    } finally {
      setSaving(false);
    }
  };

  // Dynamic field management functions
  const loadAvailableFields = async () => {
    setFieldLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fields/definitions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableFieldDefs(data);
      }
    } catch (err) {
      console.error('Error loading available fields:', err);
    } finally {
      setFieldLoading(false);
    }
  };

  const loadShiftFields = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recurring-shifts/${shiftId}/field-requirements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setShiftFields(data);
      }
    } catch (err) {
      console.error('Error loading shift fields:', err);
    }
  };

  const addFieldToForm = (fieldDef: any) => {
    const newField = {
      fieldDefinitionId: fieldDef.id,
      fieldDefinition: fieldDef,
      isRequired: false,
      isActive: true,
      order: shiftFields.length + 1
    };
    setShiftFields([...shiftFields, newField]);
  };

  const removeFieldFromForm = (fieldId: number) => {
    setShiftFields(shiftFields.filter(field => field.fieldDefinitionId !== fieldId));
  };

  const updateFieldInForm = (fieldId: number, updates: any) => {
    setShiftFields(shiftFields.map(field => 
      field.fieldDefinitionId === fieldId ? { ...field, ...updates } : field
    ));
  };

  const handleBack = () => {
    router.push('/manage-shifts');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shift details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
          >
            <FaArrowLeft className="inline mr-2" />
            Back to Manage Shifts
          </button>
        </div>
      </div>
    );
  }

  if (!shift) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-xl mb-4">Shift Not Found</div>
          <p className="text-gray-600 mb-4">The requested shift could not be found.</p>
          <button
            onClick={handleBack}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
          >
            <FaArrowLeft className="inline mr-2" />
            Back to Manage Shifts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Edit Shift</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleShiftSave}
                disabled={saving}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Section A: Shift Details */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mr-3">
                Section A
              </span>
              Shift Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shift Name *
                </label>
                <input
                  type="text"
                  value={shiftForm.name}
                  onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter shift name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={shiftForm.shiftCategoryId}
                  onChange={(e) => setShiftForm({ ...shiftForm, shiftCategoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={shiftForm.location}
                  onChange={(e) => setShiftForm({ ...shiftForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Slots *
                </label>
                <input
                  type="number"
                  min="1"
                  value={shiftForm.slots}
                  onChange={(e) => setShiftForm({ ...shiftForm, slots: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {shift.isRecurring && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Day of Week *
                  </label>
                  <select
                    value={shiftForm.dayOfWeek}
                    onChange={(e) => setShiftForm({ ...shiftForm, dayOfWeek: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value={0}>Sunday</option>
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  type={shift.isRecurring ? "time" : "datetime-local"}
                  value={shiftForm.startTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <input
                  type={shift.isRecurring ? "time" : "datetime-local"}
                  value={shiftForm.endTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={shiftForm.isActive}
                  onChange={(e) => setShiftForm({ ...shiftForm, isActive: e.target.checked })}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
            </div>
          </div>

          {/* Section B: Default Users */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium mr-3">
                Section B
              </span>
              Default Users
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Users
                </label>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                {loadingUsers ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading users...</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {availableUsers
                      .filter(user => 
                        user.firstName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                        user.lastName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                        user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
                      )
                      .map((user) => (
                        <div key={user.id} className="p-3 hover:bg-gray-50">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedDefaultUsers.includes(user.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDefaultUsers([...selectedDefaultUsers, user.id]);
                                } else {
                                  setSelectedDefaultUsers(selectedDefaultUsers.filter(id => id !== user.id));
                                }
                              }}
                              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                            />
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </label>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleSaveDefaultUsers}
                disabled={savingDefaultUsers}
                className="w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {savingDefaultUsers ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    Save Default Users
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section C: Dynamic Field Management */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mr-3">
                Section C
              </span>
              Dynamic Field Management
            </h2>

            <div className="space-y-6">
              {/* Current Fields */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Current Fields</h3>
                {shiftFields.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No fields configured for this shift</p>
                    <p className="text-gray-400 text-sm mt-1">Add fields from the available fields below</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shiftFields.map((field, index) => (
                      <div key={field.fieldDefinitionId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">
                              {field.fieldDefinition?.name}
                            </span>
                            {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                            <span className="ml-2 text-xs text-gray-500">
                              ({field.fieldDefinition?.fieldType})
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {field.fieldDefinition?.description}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={field.isRequired}
                              onChange={(e) => updateFieldInForm(field.fieldDefinitionId, { isRequired: e.target.checked })}
                              className="mr-1"
                            />
                            <span className="text-xs text-gray-600">Required</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={field.isActive}
                              onChange={(e) => updateFieldInForm(field.fieldDefinitionId, { isActive: e.target.checked })}
                              className="mr-1"
                            />
                            <span className="text-xs text-gray-600">Active</span>
                          </label>
                          {!field.fieldDefinition?.isSystemField && (
                            <button
                              onClick={() => removeFieldFromForm(field.fieldDefinitionId)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Remove field"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Fields */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Available Fields ({availableFieldDefs.filter(fieldDef => !shiftFields.some(field => field.fieldDefinitionId === fieldDef.id)).length})
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.open('/field-management', '_blank')}
                      className="px-3 py-1.5 bg-green-500 text-white text-sm rounded hover:bg-green-600 flex items-center gap-2"
                    >
                      <FaPlus />
                      Add New Dynamic Field
                    </button>
                    <button
                      onClick={loadAvailableFields}
                      className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 flex items-center gap-2"
                    >
                      <FaCog />
                      Refresh Fields
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search available fields..."
                      value={fieldSearchTerm}
                      onChange={(e) => setFieldSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {fieldLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading available fields...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableFieldDefs
                      .filter(fieldDef => !shiftFields.some(field => field.fieldDefinitionId === fieldDef.id))
                      .filter(fieldDef => 
                        fieldDef.name.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
                        fieldDef.label.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
                        fieldDef.description.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
                        fieldDef.fieldType.toLowerCase().includes(fieldSearchTerm.toLowerCase())
                      )
                      .map((fieldDef) => (
                        <div key={fieldDef.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900">
                                {fieldDef.name}
                              </span>
                              <span className="ml-2 text-xs text-gray-500">
                                ({fieldDef.fieldType})
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {fieldDef.description}
                            </p>
                          </div>
                          <button
                            onClick={() => addFieldToForm(fieldDef)}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                          >
                            Add Field
                          </button>
                        </div>
                      ))}
                    {availableFieldDefs.filter(fieldDef => !shiftFields.some(field => field.fieldDefinitionId === fieldDef.id)).length === 0 && (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">All available fields have been added</p>
                      </div>
                    )}
                    {fieldSearchTerm && availableFieldDefs
                      .filter(fieldDef => !shiftFields.some(field => field.fieldDefinitionId === fieldDef.id))
                      .filter(fieldDef => 
                        fieldDef.name.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
                        fieldDef.label.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
                        fieldDef.description.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
                        fieldDef.fieldType.toLowerCase().includes(fieldSearchTerm.toLowerCase())
                      ).length === 0 && (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">No fields found matching "{fieldSearchTerm}".</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}