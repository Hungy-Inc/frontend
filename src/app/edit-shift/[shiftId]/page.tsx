"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaSave, FaArrowLeft, FaToggleOn, FaToggleOff, FaCog, FaTrash, FaPlus, FaCheck, FaBan } from "react-icons/fa";
import { toast } from 'react-toastify';
import { convertUTCToHalifax, convertUTCTimeToHalifaxTime, convertHalifaxToUTC } from '@/utils/timezoneUtils';

interface FieldDefinition {
  id: number;
  name: string;
  type: string;
  options?: string;
  isSystemField: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ShiftDetails {
  id: number;
  name: string;
  dayOfWeek: number | null; // Keep for backward compatibility
  newDaysOfWeek: number[];
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

  // Day specific configuration interface
  interface DayConfig {
    isActive: boolean;
    slots: number | null;
    startTime: string | null;
    endTime: string | null;
    defaultUserIds: number[];
  }

  const [shift, setShift] = useState<ShiftDetails | null>(null);
  // Dynamic field management state
  const [shiftFields, setShiftFields] = useState<any[]>([]);
  const [availableFieldDefs, setAvailableFieldDefs] = useState<any[]>([]);
  const [fieldLoading, setFieldLoading] = useState(false);
  const [fieldSearchTerm, setFieldSearchTerm] = useState('');
  const [fieldPage, setFieldPage] = useState(1);
  const [fieldsPerPage] = useState(10);
  const [savingFields, setSavingFields] = useState(false);

  // Day specific configuration state
  const [showDayConfigs, setShowDayConfigs] = useState(false);
  const [dayConfigs, setDayConfigs] = useState<{ [key: number]: DayConfig }>({});
  const [daySearchTerms, setDaySearchTerms] = useState<{ [key: number]: string }>({});

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Unsaved changes tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [originalShiftForm, setOriginalShiftForm] = useState<any>(null);
  const [originalDefaultUsers, setOriginalDefaultUsers] = useState<number[]>([]);

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
    newDaysOfWeek: [] as number[],
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

  // Reset pagination when search term changes
  useEffect(() => {
    setFieldPage(1);
  }, [fieldSearchTerm]);

  // Utility function for deep comparison
  const deepEqual = (obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) return true;

    if (obj1 == null || obj2 == null) return obj1 === obj2;

    if (typeof obj1 !== typeof obj2) return false;

    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length) return false;
      // Sort arrays before comparison for consistent results
      const sorted1 = [...obj1].sort();
      const sorted2 = [...obj2].sort();
      return sorted1.every((item, index) => deepEqual(item, sorted2[index]));
    }

    if (typeof obj1 === 'object') {
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);

      if (keys1.length !== keys2.length) return false;

      return keys1.every(key => deepEqual(obj1[key], obj2[key]));
    }

    return obj1 === obj2;
  };

  // Detect changes in form data
  useEffect(() => {
    if (!originalShiftForm) return;

    const shiftChanged = !deepEqual(shiftForm, originalShiftForm);
    const usersChanged = !deepEqual(selectedDefaultUsers, originalDefaultUsers);

    const hasChanges = shiftChanged || usersChanged;
    setHasUnsavedChanges(hasChanges);
  }, [shiftForm, selectedDefaultUsers, originalShiftForm, originalDefaultUsers]);

  // Prevent browser navigation when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

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

      // Set form data with Halifax timezone conversion
      const daysOfWeek = shiftData.newDaysOfWeek && shiftData.newDaysOfWeek.length > 0
        ? shiftData.newDaysOfWeek
        : (shiftData.dayOfWeek !== null ? [shiftData.dayOfWeek] : []);

      const formData = {
        name: shiftData.name,
        newDaysOfWeek: daysOfWeek,
        startTime: shiftData.isRecurring
          ? convertUTCTimeToHalifaxTime(shiftData.startTime) // Convert UTC to Halifax time for recurring shifts
          : convertUTCToHalifax(shiftData.startTime), // Full datetime for one-time shifts
        endTime: shiftData.isRecurring
          ? convertUTCTimeToHalifaxTime(shiftData.endTime) // Convert UTC to Halifax time for recurring shifts
          : convertUTCToHalifax(shiftData.endTime), // Full datetime for one-time shifts
        shiftCategoryId: shiftData.shiftCategoryId.toString(),
        location: shiftData.location,
        slots: shiftData.slots,
        isActive: shiftData.isActive
      };

      setShiftForm(formData);

      // Populate day configs if available
      // Populate day configs if available
      if (shiftData.RecurringShiftDayConfig && shiftData.RecurringShiftDayConfig.length > 0) {
        setShowDayConfigs(true);
        const configs: { [key: number]: DayConfig } = {};

        // Initialize ALL days (0-6)
        [0, 1, 2, 3, 4, 5, 6].forEach((day) => {
          configs[day] = {
            isActive: daysOfWeek.includes(day), // Active only if part of global days
            slots: null,
            startTime: null,
            endTime: null,
            defaultUserIds: []
          };
        });

        // Override with loaded configs
        shiftData.RecurringShiftDayConfig.forEach((config: any) => {
          // If valid config exists, update the specific day
          if (configs[config.dayOfWeek]) {
            configs[config.dayOfWeek] = {
              ...configs[config.dayOfWeek],
              isActive: config.isActive,
              slots: config.slots,
              // Convert UTC DateTime to Halifax time (HH:MM format)
              startTime: config.startTime ? convertUTCTimeToHalifaxTime(config.startTime) : null,
              endTime: config.endTime ? convertUTCTimeToHalifaxTime(config.endTime) : null,
              defaultUserIds: [] // Default users fetched separately
            };
          }
        });
        setDayConfigs(configs);
      } else if (shiftData.isRecurring) {
        // Initialize empty configs for recurring shift for ALL days
        const configs: { [key: number]: DayConfig } = {};
        [0, 1, 2, 3, 4, 5, 6].forEach((day) => {
          configs[day] = {
            isActive: daysOfWeek.includes(day), // Active only if part of global days
            slots: null,
            startTime: null,
            endTime: null,
            defaultUserIds: []
          };
        });
        setDayConfigs(configs);
      }
      // Create proper deep copy for comparison
      setOriginalShiftForm({
        name: formData.name,
        newDaysOfWeek: [...formData.newDaysOfWeek],
        startTime: formData.startTime,
        endTime: formData.endTime,
        shiftCategoryId: formData.shiftCategoryId,
        location: formData.location,
        slots: formData.slots,
        isActive: formData.isActive
      });

      // Fetch default users for this shift
      fetchDefaultUsersForShift(shiftId);

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
        console.log('Fetched default users:', data); // Debug log

        // Handle global default users (dayOfWeek is null)
        const globalDefaultUsers = data.defaultUsers
          .filter((du: any) => du.dayOfWeek === null)
          .map((du: any) => du.userId)
          .filter((id: any): id is number => id != null && !isNaN(Number(id)))
          .map((id: any) => Number(id));

        setSelectedDefaultUsers(globalDefaultUsers);
        setOriginalDefaultUsers([...globalDefaultUsers]); // Store original for comparison

        // Handle day-specific default users
        setDayConfigs(prev => {
          const newConfigs = { ...prev };
          
          // First, collect all day-specific user IDs by day
          const dayUserMap: { [key: number]: number[] } = {};
          data.defaultUsers
            .filter((du: any) => du.dayOfWeek !== null)
            .forEach((du: any) => {
              const day = du.dayOfWeek;
              if (!dayUserMap[day]) {
                dayUserMap[day] = [];
              }
              dayUserMap[day].push(du.userId);
            });
          
          // Then update day configs with the collected user IDs
          Object.keys(dayUserMap).forEach(dayStr => {
            const day = Number(dayStr);
            if (newConfigs[day]) {
              // Preserve all existing config, only update defaultUserIds
              newConfigs[day] = {
                ...newConfigs[day],
                defaultUserIds: dayUserMap[day]
              };
            } else {
              // If day config doesn't exist yet, create it
              newConfigs[day] = {
                isActive: true,
                slots: null,
                startTime: null,
                endTime: null,
                defaultUserIds: dayUserMap[day]
              };
            }
          });
          
          return newConfigs;
        });

      } else {
        console.error('Failed to fetch default users:', res.status, res.statusText);
        setSelectedDefaultUsers([]);
        setOriginalDefaultUsers([]);
      }
    } catch (err) {
      console.error('Error fetching default users:', err);
    }
  };

  const handleSaveDefaultUsers = async () => {
    setSavingDefaultUsers(true);
    try {
      const token = localStorage.getItem("token");

      // Filter out invalid user IDs and ensure they are numbers
      const validUserIds = selectedDefaultUsers
        .filter((id): id is number => id != null && !isNaN(Number(id)))
        .map(id => Number(id));

      if (validUserIds.length === 0 && selectedDefaultUsers.length > 0) {
        throw new Error('No valid user IDs found. Please check your selection.');
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recurring-shifts/${shiftId}/default-users`, {
        method: 'PUT', // Changed from POST to PUT for bulk update
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userIds: validUserIds })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save default users');
      }

      toast.success('Default users saved successfully!');

      // Update original values to reflect saved state
      setOriginalDefaultUsers([...validUserIds]);

      // Refresh the default users to confirm they're saved
      await fetchDefaultUsersForShift(shiftId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save default users');
    } finally {
      setSavingDefaultUsers(false);
    }
  };

  const handleShiftSave = async () => {
    if (!shift) return;

    // Validation
    if (shift.isRecurring && shiftForm.newDaysOfWeek.length === 0) {
      toast.error("Please select at least one day of the week for recurring shifts");
      return;
    }

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
        // Recurring shift - use fixed reference date to ensure consistent UTC storage
        // This ensures 9:00 AM always displays as 9:00 AM regardless of DST period
        updateData.newDaysOfWeek = shiftForm.newDaysOfWeek;
        // Convert Halifax time to UTC using fixed reference date (true = use fixed date)
        const startTimeUTC = convertHalifaxToUTC(shiftForm.startTime, true);
        const endTimeUTC = convertHalifaxToUTC(shiftForm.endTime, true);
        updateData.startTime = startTimeUTC;
        updateData.endTime = endTimeUTC;
      } else {
        // One-time shift - use full datetime with Halifax to UTC conversion
        // For one-time shifts, use actual date (false = use actual date from input)
        updateData.startTime = convertHalifaxToUTC(shiftForm.startTime, false);
        updateData.endTime = convertHalifaxToUTC(shiftForm.endTime, false);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recurring-shifts/${shiftId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...updateData,
          dayConfigs: Object.entries(dayConfigs).map(([day, config]) => ({
            dayOfWeek: Number(day),
            isActive: config.isActive,
            slots: config.slots,
            // Convert Halifax time strings (HH:MM) to UTC DateTime format
            // Use fixed reference date (true) for consistent storage, same as global times
            startTime: config.startTime ? convertHalifaxToUTC(config.startTime, true) : null,
            endTime: config.endTime ? convertHalifaxToUTC(config.endTime, true) : null,
            defaultUserIds: config.defaultUserIds
          }))
        })

      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update shift');
      }

      // Get the updated shift data from response
      const updatedShiftData = await res.json();

      // Update day configs from the response
      if (updatedShiftData.RecurringShiftDayConfig && Array.isArray(updatedShiftData.RecurringShiftDayConfig)) {
        const updatedConfigs: { [key: number]: DayConfig } = {};
        
        // Initialize ALL days (0-6) with defaults
        [0, 1, 2, 3, 4, 5, 6].forEach((day) => {
          updatedConfigs[day] = {
            isActive: shiftForm.newDaysOfWeek.includes(day), // Active only if part of global days
            slots: null,
            startTime: null,
            endTime: null,
            defaultUserIds: []
          };
        });

        // Override with loaded configs from response
        updatedShiftData.RecurringShiftDayConfig.forEach((config: any) => {
          if (updatedConfigs[config.dayOfWeek] !== undefined) {
            updatedConfigs[config.dayOfWeek] = {
              ...updatedConfigs[config.dayOfWeek],
              isActive: config.isActive,
              slots: config.slots,
              startTime: config.startTime ? convertUTCTimeToHalifaxTime(config.startTime) : null, // Convert UTC to Halifax time
              endTime: config.endTime ? convertUTCTimeToHalifaxTime(config.endTime) : null,
              defaultUserIds: [] // Will be reloaded separately
            };
          }
        });

        setDayConfigs(updatedConfigs);
        
        // Enable day configs UI if there are any day configs
        if (updatedShiftData.RecurringShiftDayConfig.length > 0) {
          setShowDayConfigs(true);
        }
      }

      // Reload default users for each day to get the updated day-specific users
      await fetchDefaultUsersForShift(shiftId);

      toast.success('Shift details updated successfully!');

      // Update original values to reflect saved state (deep copy)
      setOriginalShiftForm({
        name: shiftForm.name,
        newDaysOfWeek: [...shiftForm.newDaysOfWeek],
        startTime: shiftForm.startTime,
        endTime: shiftForm.endTime,
        shiftCategoryId: shiftForm.shiftCategoryId,
        location: shiftForm.location,
        slots: shiftForm.slots,
        isActive: shiftForm.isActive
      });
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

      toast.success('Available fields loaded successfully!');
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

  const handleSaveFields = async () => {
    setSavingFields(true);
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recurring-shifts/${shiftId}/field-requirements/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fieldRequirements: shiftFields.map(field => ({
            fieldDefinitionId: field.fieldDefinitionId,
            isRequired: field.isRequired,
            isActive: field.isActive
          }))
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save field requirements');
      }

      toast.success('Field requirements saved successfully!');

      // Refresh the field data to confirm they're saved
      await loadShiftFields();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save field requirements');
    } finally {
      setSavingFields(false);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      router.push('/manage-shifts');
    }
  };

  const handleConfirmLeave = () => {
    setShowConfirmDialog(false);
    router.push('/manage-shifts');
  };

  const handleCancelLeave = () => {
    setShowConfirmDialog(false);
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
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Unsaved Changes
              </h3>
              <p className="text-gray-600">
                You have unsaved changes that will be lost if you leave this page. Are you sure you want to continue without saving?
              </p>
            </div>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={handleCancelLeave}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Stay on Page
              </button>
              <button
                onClick={handleConfirmLeave}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Leave Without Saving
              </button>
            </div>
          </div>
        </div>
      )}
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
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  Edit Shift: {shift.name}
                </h1>
                {hasUnsavedChanges && (
                  <span className="ml-3 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                    Unsaved Changes
                  </span>
                )}
              </div>
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

              {shift.isRecurring && (
                <div>
                  {/* <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day of Week * */}
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Days of Week *
                  </label>
                  {/* <select
                    value={shiftForm.dayOfWeek}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, dayOfWeek: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  > */}
                  <div className="flex flex-wrap gap-4">
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => (
                      // <option key={i} value={i}>{day}</option>
                      <label key={i} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shiftForm.newDaysOfWeek.includes(i)}
                          onChange={(e) => {
                            const isChecked = e.target.checked;

                            // 1. Update Global State
                            if (isChecked) {
                              setShiftForm(prev => ({
                                ...prev,
                                newDaysOfWeek: [...prev.newDaysOfWeek, i].sort()
                              }));
                            } else {
                              setShiftForm(prev => ({
                                ...prev,
                                newDaysOfWeek: prev.newDaysOfWeek.filter(d => d !== i).sort()
                              }));
                            }

                            // 2. Sync Day Config State
                            setDayConfigs(prev => {
                              const existingConfig = prev[i] || {
                                isActive: isChecked,
                                slots: null,
                                startTime: null,
                                endTime: null,
                                defaultUserIds: []
                              };

                              return {
                                ...prev,
                                [i]: {
                                  ...existingConfig,
                                  isActive: isChecked
                                }
                              };
                            });
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {shift.isRecurring ? 'Start Time *' : 'Start Date & Time *'}
                    <span className="text-xs text-gray-500 ml-1">(Halifax Time)</span>
                  </label>
                  <input
                    type={shift.isRecurring ? 'time' : 'datetime-local'}
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {shift.isRecurring ? 'End Time *' : 'End Date & Time *'}
                    <span className="text-xs text-gray-500 ml-1">(Halifax Time)</span>
                  </label>
                  <input
                    type={shift.isRecurring ? 'time' : 'datetime-local'}
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
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

            {/* Save Button for Shift Details */}



            {shift.isRecurring && shiftForm.newDaysOfWeek.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200">
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
                  <>
                    <div className="space-y-8 mt-8">

                      {[0, 1, 2, 3, 4, 5, 6].map((day, index) => {

                        const config = dayConfigs[day] || { isActive: true, slots: null, startTime: null, endTime: null, defaultUserIds: [] };
                        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];

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

                                      // Update dayConfigs state
                                      setDayConfigs(prev => ({
                                        ...prev,
                                        [day]: { ...prev[day], isActive: isChecked }
                                      }));

                                      // Update main form newDaysOfWeek state
                                      setShiftForm(prev => {
                                        const currentDays = prev.newDaysOfWeek || [];
                                        if (isChecked) {
                                          return { ...prev, newDaysOfWeek: [...new Set([...currentDays, day])].sort() };
                                        } else {
                                          return { ...prev, newDaysOfWeek: currentDays.filter(d => d !== day).sort() };
                                        }
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
                                      value={config.slots === null ? '' : config.slots}
                                      onChange={(e) => {
                                        const val = e.target.value === '' ? null : Number(e.target.value);
                                        setDayConfigs(prev => ({
                                          ...prev,
                                          [day]: { ...prev[day], slots: val }
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
                                      value={config.startTime || ''}
                                      onChange={(e) => setDayConfigs(prev => ({
                                        ...prev,
                                        [day]: { ...prev[day], startTime: e.target.value || null }
                                      }))}
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                      disabled={!config.isActive}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                                    <input
                                      type="time"
                                      value={config.endTime || ''}
                                      onChange={(e) => setDayConfigs(prev => ({
                                        ...prev,
                                        [day]: { ...prev[day], endTime: e.target.value || null }
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
                                              const currentIds = prev[day]?.defaultUserIds || [];
                                              const newIds = e.target.checked
                                                ? [...currentIds, Number(user.id)]
                                                : currentIds.filter(id => id !== Number(user.id));
                                              return {
                                                ...prev,
                                                [day]: { ...prev[day], defaultUserIds: newIds }
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


                  </>
                )}
              </div>
            )}

            {/* Unified Save Button for Section A + A.1 */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleShiftSave}
                disabled={saving}
                className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    Save Shift Details
                  </>
                )}
              </button>
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
                      .filter(user => user.id != null && !isNaN(Number(user.id))) // Filter out users without valid IDs
                      .map((user) => {
                        const userId = Number(user.id); // Ensure ID is a number
                        return (
                          <div key={userId} className="p-3 hover:bg-gray-50">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedDefaultUsers.includes(userId)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    // Only add if user ID is valid
                                    if (userId != null && !isNaN(userId)) {
                                      setSelectedDefaultUsers([...selectedDefaultUsers, userId]);
                                    } else {
                                      toast.error(`Invalid user ID for user: ${user.firstName} ${user.lastName}`);
                                    }
                                  } else {
                                    setSelectedDefaultUsers(selectedDefaultUsers.filter(id => id !== userId));
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
                        );
                      })}
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

                {/* Information Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800">Field Types</h4>
                      <div className="mt-2 text-sm text-blue-700">
                        <p><strong>Default Fields:</strong> First Name, Last Name, Email - These are automatically included in every shift and cannot be removed.</p>
                        <p className="mt-1"><strong>Custom Fields:</strong> Additional fields you can add from the available fields below to collect specific information for this shift.</p>
                      </div>
                    </div>
                  </div>
                </div>
                {shiftFields.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No custom fields configured for this shift</p>
                    <p className="text-gray-400 text-sm mt-1">Add custom fields from the available fields below</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Default Fields Section */}
                    {shiftFields.filter(field => field.fieldDefinition?.isSystemField).length > 0 && (
                      <>
                        <div className="flex items-center mb-3">
                          <h4 className="text-sm font-medium text-gray-700">Default Fields</h4>
                          <div className="flex-1 h-px bg-gray-300 ml-3"></div>
                        </div>
                        {shiftFields
                          .filter(field => field.fieldDefinition?.isSystemField)
                          .map((field, index) => (
                            <div key={field.fieldDefinitionId} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
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
                                    disabled={field.fieldDefinition?.isSystemField}
                                  />
                                  <span className={`text-xs ${field.fieldDefinition?.isSystemField ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Required
                                  </span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={field.isActive}
                                    onChange={(e) => updateFieldInForm(field.fieldDefinitionId, { isActive: e.target.checked })}
                                    className="mr-1"
                                    disabled={field.fieldDefinition?.isSystemField}
                                  />
                                  <span className={`text-xs ${field.fieldDefinition?.isSystemField ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Active
                                  </span>
                                </label>
                                <span className="text-xs text-blue-600 px-2 py-1 bg-blue-100 rounded">
                                  System Field
                                </span>
                              </div>
                            </div>
                          ))}
                      </>
                    )}

                    {/* Custom Fields Section */}
                    {shiftFields.filter(field => !field.fieldDefinition?.isSystemField).length > 0 && (
                      <>
                        <div className="flex items-center mb-3 mt-6">
                          <h4 className="text-sm font-medium text-gray-700">Custom Fields</h4>
                          <div className="flex-1 h-px bg-gray-300 ml-3"></div>
                        </div>
                        {shiftFields
                          .filter(field => !field.fieldDefinition?.isSystemField)
                          .map((field, index) => (
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
                                    disabled={field.fieldDefinition?.isSystemField}
                                  />
                                  <span className={`text-xs ${field.fieldDefinition?.isSystemField ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Required
                                  </span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={field.isActive}
                                    onChange={(e) => updateFieldInForm(field.fieldDefinitionId, { isActive: e.target.checked })}
                                    className="mr-1"
                                    disabled={field.fieldDefinition?.isSystemField}
                                  />
                                  <span className={`text-xs ${field.fieldDefinition?.isSystemField ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Active
                                  </span>
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
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Available Fields */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Available Custom Fields ({availableFieldDefs.filter(fieldDef => !shiftFields.some(field => field.fieldDefinitionId === fieldDef.id) && !fieldDef.isSystemField).length})
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
                  <>
                    <div className="space-y-3">
                      {(() => {
                        const filteredFields = availableFieldDefs
                          .filter(fieldDef => !shiftFields.some(field => field.fieldDefinitionId === fieldDef.id))
                          .filter(fieldDef => !fieldDef.isSystemField) // Hide system fields from available list
                          .filter(fieldDef =>
                            fieldDef.name.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
                            fieldDef.label.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
                            fieldDef.description.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
                            fieldDef.fieldType.toLowerCase().includes(fieldSearchTerm.toLowerCase())
                          );

                        const startIndex = (fieldPage - 1) * fieldsPerPage;
                        const endIndex = startIndex + fieldsPerPage;
                        const paginatedFields = filteredFields.slice(startIndex, endIndex);

                        return paginatedFields.map((fieldDef) => (
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
                        ));
                      })()}

                      {(() => {
                        const filteredFields = availableFieldDefs
                          .filter(fieldDef => !shiftFields.some(field => field.fieldDefinitionId === fieldDef.id))
                          .filter(fieldDef =>
                            fieldDef.name.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
                            fieldDef.label.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
                            fieldDef.description.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
                            fieldDef.fieldType.toLowerCase().includes(fieldSearchTerm.toLowerCase())
                          );

                        if (filteredFields.length === 0 && !fieldSearchTerm) {
                          return (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                              <p className="text-gray-500">All available fields have been added</p>
                            </div>
                          );
                        }

                        if (filteredFields.length === 0 && fieldSearchTerm) {
                          return (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                              <p className="text-gray-500">No fields found matching "{fieldSearchTerm}".</p>
                            </div>
                          );
                        }

                        return null;
                      })()}
                    </div>

                    {/* Pagination */}
                    {(() => {
                      const filteredFields = availableFieldDefs
                        .filter(fieldDef => !shiftFields.some(field => field.fieldDefinitionId === fieldDef.id))
                        .filter(fieldDef => !fieldDef.isSystemField) // Hide system fields from available list
                        .filter(fieldDef =>
                          fieldDef.name.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
                          fieldDef.label.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
                          fieldDef.description.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
                          fieldDef.fieldType.toLowerCase().includes(fieldSearchTerm.toLowerCase())
                        );

                      const totalPages = Math.ceil(filteredFields.length / fieldsPerPage);

                      if (totalPages > 1) {
                        return (
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                            <div className="text-sm text-gray-700">
                              Showing {((fieldPage - 1) * fieldsPerPage) + 1} to {Math.min(fieldPage * fieldsPerPage, filteredFields.length)} of {filteredFields.length} fields
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setFieldPage(Math.max(1, fieldPage - 1))}
                                disabled={fieldPage === 1}
                                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Previous
                              </button>
                              <span className="px-3 py-1 text-sm text-gray-700">
                                Page {fieldPage} of {totalPages}
                              </span>
                              <button
                                onClick={() => setFieldPage(Math.min(totalPages, fieldPage + 1))}
                                disabled={fieldPage === totalPages}
                                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </>
                )}
              </div>

              {/* Save Button for Field Management */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSaveFields}
                  disabled={savingFields}
                  className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {savingFields ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving Field Requirements...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" />
                      Save Field Requirements
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}
