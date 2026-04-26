"use client";
// SHIFT_DISABLED_START
import { redirect } from 'next/navigation';
// SHIFT_DISABLED_END
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaSave, FaArrowLeft, FaToggleOn, FaToggleOff, FaCog, FaTrash, FaPlus, FaCheck, FaBan } from "react-icons/fa";
import { toast } from 'react-toastify';
import { convertHalifaxToUTC } from '@/utils/timezoneUtils';

interface ShiftForm {
  name: string;
  dayOfWeek: number;
  newDaysOfWeek: number[];
  startTime: string;
  endTime: string;
  shiftCategoryId: string;
  location: string;
  slots: number;
  isRecurring: boolean;
}

// Removed old RegistrationFields interface - now using dynamic fields

export default function AddShiftPage() {
  // SHIFT_DISABLED_START
  (redirect as unknown as (url: string) => void)('/dashboard');
  // SHIFT_DISABLED_END
  const router = useRouter();

  // Form state
  const [shiftForm, setShiftForm] = useState<ShiftForm>({
    name: '',
    dayOfWeek: 0,
    newDaysOfWeek: [],
    startTime: '',
    endTime: '',
    shiftCategoryId: '',
    location: '',
    slots: 1,
    isRecurring: true
  });

  // Day specific configuration interface
  interface DayConfig {
    isActive: boolean;
    slots: number | null;
    startTime: string | null;
    endTime: string | null;
    defaultUserIds: number[];
  }

  // Dynamic field management state
  const [shiftFields, setShiftFields] = useState<any[]>([]);
  const [availableFieldDefs, setAvailableFieldDefs] = useState<any[]>([]);
  const [fieldLoading, setFieldLoading] = useState(false);
  const [fieldSearchTerm, setFieldSearchTerm] = useState('');

  // Day specific configuration state
  const [showDayConfigs, setShowDayConfigs] = useState(false);
  const [dayConfigs, setDayConfigs] = useState<{ [key: number]: DayConfig }>({});
  const [daySearchTerms, setDaySearchTerms] = useState<{ [key: number]: string }>({});

  // Other state
  const [categoryOptions, setCategoryOptions] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedDefaultUsers, setSelectedDefaultUsers] = useState<number[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Initialize day configs when days selected change - Bidirectional sync
  useEffect(() => {
    if (shiftForm.isRecurring) {
      setDayConfigs(prev => {
        const newConfigs: { [key: number]: DayConfig } = {};
        
        // Only keep configs for days that are in newDaysOfWeek
        shiftForm.newDaysOfWeek.forEach(day => {
          // Preserve existing config if it exists, otherwise create new one
          if (prev[day]) {
            newConfigs[day] = {
              ...prev[day],
              isActive: true  // Ensure it's active if it's in newDaysOfWeek
            };
          } else {
            newConfigs[day] = {
              isActive: true,
              slots: null, // Use default
              startTime: null, // Use default
              endTime: null, // Use default
              defaultUserIds: []
            };
          }
        });
        
        return newConfigs;
      });
    } else {
      // Clear day configs if not recurring
      setDayConfigs({});
    }
  }, [shiftForm.newDaysOfWeek, shiftForm.isRecurring]);

  // Load initial data
  useEffect(() => {
    fetchCategories();
    fetchAvailableUsers();
    loadAvailableFields();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shift-categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        // Filter out "Collection" category as it's only for backend use
        const filteredCategories = data.filter((category: any) =>
          category.name.toLowerCase() !== 'collection'
        );
        setCategoryOptions(filteredCategories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        // Filter only approved users (same as Manage Shifts page)
        const approvedUsers = data.filter((user: any) => user.status === 'APPROVED');
        setAvailableUsers(approvedUsers);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  // Load available field definitions
  const loadAvailableFields = async () => {
    try {
      setFieldLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fields/definitions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch field definitions");
      const data = await response.json();
      setAvailableFieldDefs(data);

      // Set default fields (system fields)
      const defaultFields = data.filter((field: any) => field.isSystemField).slice(0, 3);
      setShiftFields(defaultFields.map((field: any, index: number) => ({
        fieldDefinitionId: field.id,
        fieldDefinition: field,
        isRequired: true,
        isActive: true,
        order: index + 1
      })));
    } catch (err) {
      console.error("Failed to load available fields:", err);
      setAvailableFieldDefs([]);
    } finally {
      setFieldLoading(false);
    }
  };

  const addFieldToForm = (field: any) => {
    const newField = {
      fieldDefinitionId: field.id,
      fieldDefinition: field,
      isRequired: false,
      isActive: true,
      order: shiftFields.length + 1
    };
    setShiftFields([...shiftFields, newField]);
    setAvailableFieldDefs(availableFieldDefs.filter(f => f.id !== field.id));
  };

  const removeFieldFromForm = (fieldId: number) => {
    const fieldToRemove = shiftFields.find(f => f.fieldDefinitionId === fieldId);
    if (fieldToRemove && !fieldToRemove.fieldDefinition.isSystemField) {
      setShiftFields(shiftFields.filter(f => f.fieldDefinitionId !== fieldId));
      setAvailableFieldDefs([...availableFieldDefs, fieldToRemove.fieldDefinition]);
    }
  };

  const updateFieldInForm = (fieldId: number, updates: any) => {
    setShiftFields(shiftFields.map(field =>
      field.fieldDefinitionId === fieldId ? { ...field, ...updates } : field
    ));
  };

  const handleSave = async () => {
    if (!shiftForm.name.trim()) {
      toast.error("Shift name is required");
      return;
    }
    if (!shiftForm.shiftCategoryId) {
      toast.error("Shift category is required");
      return;
    }
    if (!shiftForm.location.trim()) {
      toast.error("Location is required");
      return;
    }
    if (!shiftForm.startTime || !shiftForm.endTime) {
      toast.error("Start and end times are required");
      return;
    }
    if (shiftForm.isRecurring && shiftForm.newDaysOfWeek.length === 0) {
      toast.error("Please select at least one day of the week for recurring shifts");
      return;
    }

    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem("token");

      let startTime, endTime;

      if (shiftForm.isRecurring) {
        // Recurring shift - use fixed reference date to ensure consistent UTC storage
        // This ensures 9:00 AM always displays as 9:00 AM regardless of DST period
        // Convert Halifax time to UTC using fixed reference date (true = use fixed date)
        startTime = convertHalifaxToUTC(shiftForm.startTime, true);
        endTime = convertHalifaxToUTC(shiftForm.endTime, true);

        // Validate time difference
        const start = new Date(startTime);
        const end = new Date(endTime);
        const diffMs = end.getTime() - start.getTime();
        if (diffMs < 60 * 60 * 1000) {
          toast.error('Shift end time must be at least 1 hour after start time.');
          setSaving(false);
          return;
        }
      } else {
        // One-time shift - use datetime inputs (interpreted as Halifax timezone)
        // For one-time shifts, extract date from input and use that date for conversion
        // This ensures 9:00 AM on Nov 10 always displays as 9:00 AM regardless of DST period
        startTime = convertHalifaxToUTC(shiftForm.startTime, false); // false = extract date from input
        endTime = convertHalifaxToUTC(shiftForm.endTime, false); // false = extract date from input

        // Validate time difference
        const start = new Date(startTime);
        const end = new Date(endTime);
        const diffMs = end.getTime() - start.getTime();
        if (diffMs < 60 * 60 * 1000) {
          toast.error('Shift end time must be at least 1 hour after start time.');
          setSaving(false);
          return;
        }
      }

      // Create the shift
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recurring-shifts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...shiftForm,
          startTime,
          endTime,
          shiftCategoryId: Number(shiftForm.shiftCategoryId),
          dayOfWeek: shiftForm.isRecurring ? Number(shiftForm.dayOfWeek) : null,
          newDaysOfWeek: shiftForm.isRecurring ? shiftForm.newDaysOfWeek : [],
          slots: Number(shiftForm.slots),
          isRecurring: shiftForm.isRecurring,
          fieldRequirements: shiftFields.map(field => ({
            fieldDefinitionId: field.fieldDefinitionId,
            isRequired: field.isRequired,
            isActive: field.isActive
          })),
          dayConfigs: Object.entries(dayConfigs)
            .filter(([day]) => shiftForm.newDaysOfWeek.includes(Number(day))) // Only send configs for selected days
            .map(([day, config]) => ({
              dayOfWeek: Number(day),
              isActive: config.isActive,
              slots: config.slots,
              // Convert Halifax time strings (HH:MM) to UTC DateTime format, or null if not set
              startTime: config.startTime && config.startTime !== null && config.startTime !== '' 
                ? convertHalifaxToUTC(config.startTime, true) 
                : null,
              endTime: config.endTime && config.endTime !== null && config.endTime !== '' 
                ? convertHalifaxToUTC(config.endTime, true) 
                : null,
              defaultUserIds: config.defaultUserIds || []
            }))
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add shift');

      // Add default users if any are selected
      if (selectedDefaultUsers.length > 0) {
        try {
          // Filter out invalid user IDs and ensure they are numbers
          const validUserIds = selectedDefaultUsers
            .filter((id): id is number => id != null && !isNaN(Number(id)))
            .map(id => Number(id));

          if (validUserIds.length > 0) {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recurring-shifts/${data.id}/default-users`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                userIds: validUserIds
              })
            });
          }
        } catch (err) {
          console.error('Failed to add default users:', err);
          toast.warning('Shift created but failed to assign default users. You can assign them later.');
        }
      }

      toast.success(`${shiftForm.isRecurring ? 'Recurring' : 'One-time'} shift added successfully!`);
      router.push('/manage-shifts');

    } catch (err: any) {
      setError(err.message || 'Failed to add shift');
      toast.error(err.message || 'Failed to add shift');
    } finally {
      setSaving(false);
    }
  };

  // Removed old handleFieldToggle and groupedFields - now using dynamic field management

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/manage-shifts')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Add New Shift
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Description */}
        <div className="mb-8">
          <p className="text-gray-600">Create a new recurring or one-time shift with all configurations</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        <div className="space-y-8">
          {/* Section A: Shift Details */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium mr-3">
                Section A
              </span>
              Shift Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shift Name *
                  </label>
                  <input
                    type="text"
                    value={shiftForm.name}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter shift name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shift Type *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="shiftType"
                        checked={shiftForm.isRecurring}
                        onChange={() => setShiftForm(prev => ({ ...prev, isRecurring: true }))}
                        className="mr-2"
                      />
                      Recurring
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="shiftType"
                        checked={!shiftForm.isRecurring}
                        onChange={() => setShiftForm(prev => ({ ...prev, isRecurring: false }))}
                        className="mr-2"
                      />
                      One-time
                    </label>
                  </div>
                </div>

                {shiftForm.isRecurring && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Day of Week *
                    </label>
                    {/* <select
                      value={shiftForm.dayOfWeek}
                      onChange={(e) => setShiftForm(prev => ({ ...prev, dayOfWeek: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      {[...Array(7)].map((_, i) => (
                        <option key={i} value={i}>
                          {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][i]}
                        </option> */}
                    <div className="flex flex-wrap gap-4">
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => (
                        <label key={i} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={shiftForm.newDaysOfWeek.includes(i)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setShiftForm(prev => {
                                  const newDaysOfWeek = [...prev.newDaysOfWeek, i].sort();
                                  return {
                                    ...prev,
                                    newDaysOfWeek,
                                    dayOfWeek: prev.newDaysOfWeek.length === 0 ? i : prev.dayOfWeek
                                  };
                                });
                                // Sync day config - ensure it's active
                                setDayConfigs(prev => ({
                                  ...prev,
                                  [i]: prev[i] || {
                                    isActive: true,
                                    slots: null,
                                    startTime: null,
                                    endTime: null,
                                    defaultUserIds: []
                                  }
                                }));
                              } else {
                                setShiftForm(prev => {
                                  const newDaysOfWeek = prev.newDaysOfWeek.filter(d => d !== i).sort();
                                  return {
                                    ...prev,
                                    newDaysOfWeek,
                                    dayOfWeek: prev.newDaysOfWeek.length === 1 && prev.newDaysOfWeek[0] === i ? 0 : prev.dayOfWeek
                                  };
                                });
                                // Remove day config when day is unchecked
                                setDayConfigs(prev => {
                                  const newConfigs = { ...prev };
                                  delete newConfigs[i];
                                  return newConfigs;
                                });
                              }
                            }}
                            className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                          />
                          <span className="text-sm text-gray-700">{day}</span>
                        </label>
                      ))}
                      {/* </select> */}
                    </div>

                    {shiftForm.newDaysOfWeek.length === 0 && (
                      <p className="text-red-500 text-sm mt-1">Please select at least one day</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {shiftForm.isRecurring ? 'Start Time *' : 'Start Date & Time *'}
                  </label>
                  <input
                    type={shiftForm.isRecurring ? 'time' : 'datetime-local'}
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {shiftForm.isRecurring ? 'End Time *' : 'End Date & Time *'}
                  </label>
                  <input
                    type={shiftForm.isRecurring ? 'time' : 'datetime-local'}
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shift Category *
                </label>
                <select
                  value={shiftForm.shiftCategoryId}
                  onChange={(e) => setShiftForm(prev => ({ ...prev, shiftCategoryId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  {categoryOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.icon ? `${opt.icon} ` : ''}{opt.name}
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
                  onChange={(e) => setShiftForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter shift location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Volunteer Slots
                </label>
                <input
                  type="number"
                  min={1}
                  value={shiftForm.slots}
                  onChange={(e) => setShiftForm(prev => ({ ...prev, slots: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter number of volunteers needed"
                />
              </div>
            </div>
          </div>
        </div>


        {shiftForm.isRecurring && shiftForm.newDaysOfWeek.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium mr-3">
                  Section A.1
                </span>
                Day Configuration
              </h2>
              <label className="flex items-center cursor-pointer select-none">
                <span className="text-sm mr-3 font-medium text-gray-600">Enable Individual Config</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={showDayConfigs}
                    onChange={() => setShowDayConfigs(!showDayConfigs)}
                  />
                  <div className={`block w-12 h-7 rounded-full transition-colors ${showDayConfigs ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${showDayConfigs ? 'transform translate-x-5' : ''}`}></div>
                </div>
              </label>
            </div>

            {showDayConfigs && (
              <div className="space-y-8 mt-8">
                {[0, 1, 2, 3, 4, 5, 6].map((day, index) => {
                  // Ensure config always exists and has all required fields to prevent controlled/uncontrolled input issues
                  const config: DayConfig = dayConfigs[day] || { 
                    isActive: shiftForm.newDaysOfWeek.includes(day), 
                    slots: null, 
                    startTime: null, 
                    endTime: null, 
                    defaultUserIds: [] 
                  };
                  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
                  
                  // Only show days that are in newDaysOfWeek or have existing configs
                  if (!shiftForm.newDaysOfWeek.includes(day) && !dayConfigs[day]) {
                    return null;
                  }

                  return (
                    <div key={day} className={`bg-gray-50 rounded-lg border p-6 transition-all ${!config.isActive ? 'opacity-70 bg-gray-100' : ''}`}>
                      <div className="flex items-center justify-between mb-6 border-b pb-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                          <span className="bg-white border text-gray-600 px-2 py-1 rounded text-xs font-semibold mr-2 uppercase tracking-wide shadow-sm">
                            Day {index + 1}
                          </span>
                          {dayName}
                        </h3>
                        <label className="flex items-center cursor-pointer select-none">
                          <span className="text-sm mr-2 font-medium text-gray-600">{config.isActive ? 'Active' : 'Skipped'}</span>
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={config.isActive}
                              onChange={(e) => {
                                const isChecked = e.target.checked;

                                // Update dayConfigs
                                setDayConfigs(prev => ({
                                  ...prev,
                                  [day]: { ...prev[day], isActive: isChecked }
                                }));

                                // Sync with newDaysOfWeek
                                setShiftForm(prev => {
                                  let newDays = prev.newDaysOfWeek || [];
                                  if (isChecked) {
                                    newDays = [...new Set([...newDays, day])].sort();
                                  } else {
                                    newDays = newDays.filter(d => d !== day).sort();
                                  }

                                  return {
                                    ...prev,
                                    newDaysOfWeek: newDays,
                                    // Ensure we don't have an empty dayOfWeek if we just removed the last one, or added the first one
                                    dayOfWeek: newDays.length > 0 ? newDays[0] : (isChecked ? day : prev.dayOfWeek)
                                  };
                                });
                              }}
                              className="sr-only"
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${config.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${config.isActive ? 'transform translate-x-4' : ''}`}></div>
                          </div>
                        </label>
                      </div>

                      <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${!config.isActive ? 'pointer-events-none grayscale opacity-50' : ''}`}>
                        {/* Left Column: Times & Slots */}
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Slots Override</label>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                placeholder={`Default: ${shiftForm.slots || 'Not set'}`}
                                value={config.slots === null || config.slots === undefined ? '' : config.slots}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? null : Number(e.target.value);
                                  setDayConfigs(prev => ({
                                    ...prev,
                                    [day]: { 
                                      ...(prev[day] || { isActive: true, slots: null, startTime: null, endTime: null, defaultUserIds: [] }),
                                      slots: val 
                                    }
                                  }));
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                disabled={!config.isActive}
                              />
                              <p className="text-xs text-gray-500 mt-1">Leave empty to use the global setting.</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                              <input
                                type="time"
                                value={config.startTime ?? ''}
                                onChange={(e) => setDayConfigs(prev => ({
                                  ...prev,
                                  [day]: { 
                                    ...(prev[day] || { isActive: true, slots: null, startTime: null, endTime: null, defaultUserIds: [] }),
                                    startTime: e.target.value || null 
                                  }
                                }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                disabled={!config.isActive}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                              <input
                                type="time"
                                value={config.endTime ?? ''}
                                onChange={(e) => setDayConfigs(prev => ({
                                  ...prev,
                                  [day]: { 
                                    ...(prev[day] || { isActive: true, slots: null, startTime: null, endTime: null, defaultUserIds: [] }),
                                    endTime: e.target.value || null 
                                  }
                                }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                disabled={!config.isActive}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Right Column: Default Users */}
                        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                          <label className="block text-sm font-semibold text-gray-800 mb-3">Default Users for {dayName}</label>

                          {/* Search */}
                          <div className="mb-3 relative">
                            <input
                              type="text"
                              placeholder="Search users..."
                              value={daySearchTerms[day] || ''}
                              onChange={(e) => setDaySearchTerms(prev => ({ ...prev, [day]: e.target.value }))}
                              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                              disabled={!config.isActive}
                            />
                            <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                          </div>

                          {/* List */}
                          <div className="flex-1 overflow-y-auto max-h-48 space-y-2 pr-1 custom-scrollbar">
                            {availableUsers
                              .filter(u => u.status === 'APPROVED')
                              .filter(u => {
                                const term = (daySearchTerms[day] || '').toLowerCase();
                                if (!term) return true;
                                const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
                                return fullName.includes(term) || u.email.toLowerCase().includes(term);
                              })
                              .map(user => (
                                <label key={`${day}-${user.id}`} className="flex items-center p-2 rounded hover:bg-indigo-50 cursor-pointer transition-colors border border-transparent hover:border-indigo-100">
                                  <input
                                    type="checkbox"
                                    checked={config.defaultUserIds?.includes(Number(user.id))}
                                    onChange={(e) => {
                                      setDayConfigs(prev => {
                                        const currentConfig = prev[day] || { isActive: true, slots: null, startTime: null, endTime: null, defaultUserIds: [] };
                                        const currentIds = currentConfig.defaultUserIds || [];
                                        const newIds = e.target.checked
                                          ? [...currentIds, Number(user.id)]
                                          : currentIds.filter(id => id !== Number(user.id));
                                        return {
                                          ...prev,
                                          [day]: { ...currentConfig, defaultUserIds: newIds }
                                        };
                                      });
                                    }}
                                    disabled={!config.isActive}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 mr-3"
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-700">{user.firstName} {user.lastName}</span>
                                    <span className="text-xs text-gray-500">{user.email}</span>
                                  </div>
                                </label>
                              ))
                            }
                            {availableUsers.filter(u => u.status === 'APPROVED' && (`${u.firstName} ${u.lastName}`.toLowerCase().includes((daySearchTerms[day] || '').toLowerCase()))).length === 0 && (
                              <div className="text-center py-6 text-xs text-gray-400">No users found</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Section B: Default Users */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mr-3">
              Section B
            </span>
            Default Users Assignment
          </h2>

          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-2">
              Select users to automatically assign to this shift:
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-4">
              {(() => {
                // Filter users based on search term
                const filteredUsers = availableUsers.filter(user =>
                  user.firstName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                  user.lastName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                  user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
                );

                return filteredUsers.length === 0 ? (
                  <div className="text-gray-600 text-sm text-center py-8">
                    {userSearchTerm ? 'No users found matching your search' : 'No approved users available'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredUsers
                      .filter((user: any) => user.id != null && !isNaN(Number(user.id))) // Filter out users without valid IDs
                      .map((user: any) => {
                        const userId = Number(user.id); // Ensure ID is a number
                        return (
                          <label key={userId} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedDefaultUsers.includes(userId)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  if (selectedDefaultUsers.length >= shiftForm.slots) {
                                    toast.error(`Cannot select more than ${shiftForm.slots} users (shift slots limit)`);
                                    return;
                                  }
                                  // Only add if user ID is valid
                                  if (userId != null && !isNaN(userId)) {
                                    setSelectedDefaultUsers(prev => [...prev, userId]);
                                  } else {
                                    toast.error(`Invalid user ID for user: ${user.firstName} ${user.lastName}`);
                                  }
                                } else {
                                  setSelectedDefaultUsers(prev => prev.filter(id => id !== userId));
                                }
                              }}
                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                            <span className="text-sm">
                              {user.firstName} {user.lastName} ({user.email})
                            </span>
                          </label>
                        );
                      })}
                  </div>
                );
              })()}
            </div>

            <div className="text-sm text-gray-600">
              Selected: {selectedDefaultUsers.length} / {shiftForm.slots} slots
            </div>
          </div>
        </div>

        {/* Section C: Dynamic Field Management */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mr-3">
              Section C
            </span>
            Field Requirements
          </h2>

          <div className="space-y-6">
            {/* Selected Fields */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm font-medium text-gray-700">
                  Selected Fields ({shiftFields.length})
                </div>
                <button
                  onClick={loadAvailableFields}
                  className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 flex items-center gap-2"
                >
                  <FaCog />
                  Refresh Fields
                </button>
              </div>

              {fieldLoading ? (
                <div className="text-center py-8 text-gray-500">
                  Loading fields...
                </div>
              ) : shiftFields.length === 0 ? (
                <div className="text-center py-8 text-gray-500 italic">
                  No fields selected. Basic fields (Name, Email) will be required by default.
                </div>
              ) : (
                <div className="space-y-2">
                  {shiftFields.map((field) => (
                    <div key={field.fieldDefinitionId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {field.fieldDefinition.label}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {field.fieldDefinition.fieldType}
                          {field.fieldDefinition.description && ` - ${field.fieldDefinition.description}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => updateFieldInForm(field.fieldDefinitionId, { isRequired: !field.isRequired })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${field.isRequired
                            ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                            }`}
                        >
                          {field.isRequired ? <><FaCheck className="inline mr-1" />Required</> : <><FaBan className="inline mr-1" />Optional</>}
                        </button>
                        {!field.fieldDefinition.isSystemField && (
                          <button
                            onClick={() => removeFieldFromForm(field.fieldDefinitionId)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove field"
                          >
                            <FaTrash />
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
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm font-medium text-gray-700">
                  Available Fields ({availableFieldDefs.filter(fieldDef => !shiftFields.some(field => field.fieldDefinitionId === fieldDef.id)).length})
                </div>
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
                <div className="text-center py-8 text-gray-500">
                  Loading available fields...
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableFieldDefs
                    .filter(fieldDef => !shiftFields.some(field => field.fieldDefinitionId === fieldDef.id))
                    .filter(fieldDef =>
                      fieldDef.name.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
                      fieldDef.label.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
                      fieldDef.description.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
                      fieldDef.fieldType.toLowerCase().includes(fieldSearchTerm.toLowerCase())
                    )
                    .slice(0, 10)
                    .map(field => (
                      <button
                        key={field.id}
                        onClick={() => addFieldToForm(field)}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center gap-2"
                      >
                        <FaPlus className="text-xs" />
                        {field.label}
                      </button>
                    ))}
                  {availableFieldDefs.filter(fieldDef => !shiftFields.some(field => field.fieldDefinitionId === fieldDef.id)).length === 0 && (
                    <div className="text-center py-8 text-gray-500 italic">
                      All available fields have been added to this shift.
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
                      <div className="text-center py-8 text-gray-500 italic">
                        No fields found matching "{fieldSearchTerm}".
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-medium"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Creating Shift...
              </>
            ) : (
              <>
                <FaSave className="mr-3" />
                Create Shift
              </>
            )}
          </button>
        </div>
      </div>
    </div>

  );
}
