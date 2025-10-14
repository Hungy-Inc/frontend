"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaSave, FaArrowLeft, FaToggleOn, FaToggleOff } from "react-icons/fa";
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
    
    // If it's just a time string (HH:MM), create a date with today's date
    if (halifaxTimeString.includes(':') && !halifaxTimeString.includes('T')) {
      const today = new Date();
      const [hours, minutes] = halifaxTimeString.split(':');
      const halifaxDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hours), parseInt(minutes));
      
      // Convert to UTC by subtracting the timezone offset
      const utcDate = new Date(halifaxDate.getTime() - (halifaxDate.getTimezoneOffset() * 60000));
      return utcDate.toISOString();
    }
    
    // Default fallback
    return new Date(halifaxTimeString).toISOString();
  } catch (error) {
    console.error('Error converting Halifax time to UTC:', error);
    return new Date(halifaxTimeString).toISOString();
  }
};

const extractTimeFromUTC = (utcTimeString: string): string => {
  try {
    const utcDate = new Date(utcTimeString);
    if (isNaN(utcDate.getTime())) {
      console.error('Invalid UTC time string:', utcTimeString);
      return '00:00';
    }
    
    // Convert to Halifax timezone
    const halifaxDate = new Date(utcDate.toLocaleString("en-US", {timeZone: "America/Halifax"}));
    const timeString = halifaxDate.toTimeString();
    return timeString.slice(0, 5); // Return HH:MM format
  } catch (error) {
    console.error('Error extracting time from UTC:', error);
    return '00:00';
  }
};

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
  isRecurring: boolean;
  isActive: boolean;
  ShiftCategory: {
    id: number;
    name: string;
    icon?: string;
  };
}

interface RegistrationFields {
  id?: number;
  shiftId: number;
  requireFirstName: boolean;
  requireLastName: boolean;
  requireEmail: boolean;
  requireAgeBracket: boolean;
  requireBirthdate: boolean;
  requirePronouns: boolean;
  requirePhone: boolean;
  requireAddress: boolean;
  requireCity: boolean;
  requirePostalCode: boolean;
  requireHomePhone: boolean;
  requireEmergencyContactName: boolean;
  requireEmergencyContactNumber: boolean;
  requireCommunicationPreferences: boolean;
  requireProfilePictureUrl: boolean;
  requireAllergies: boolean;
  requireMedicalConcerns: boolean;
  requirePreferredDays: boolean;
  requirePreferredShifts: boolean;
  requireFrequency: boolean;
  requirePreferredPrograms: boolean;
  requireCanCallIfShortHanded: boolean;
  requireSchoolWorkCommitment: boolean;
  requireRequiredHours: boolean;
  requireHowDidYouHear: boolean;
  requireStartDate: boolean;
  requireParentGuardianName: boolean;
  requireParentGuardianEmail: boolean;
}

interface CategoryOption {
  id: number;
  name: string;
  icon?: string;
}

// Field configuration with enum-based labels and descriptions
const FIELD_CONFIG = [
  {
    key: 'requireFirstName' as keyof RegistrationFields,
    label: 'First Name',
    description: 'Volunteer\'s first name',
    category: 'Basic Information',
    required: true
  },
  {
    key: 'requireLastName' as keyof RegistrationFields,
    label: 'Last Name',
    description: 'Volunteer\'s last name',
    category: 'Basic Information',
    required: true
  },
  {
    key: 'requireEmail' as keyof RegistrationFields,
    label: 'Email Address',
    description: 'Primary contact email',
    category: 'Basic Information',
    required: true
  },
  {
    key: 'requireAgeBracket' as keyof RegistrationFields,
    label: 'Age Bracket',
    description: 'Age range (Under 16, 16-29, 30-39, 40-49, 50-59, 60-69, 70+)',
    category: 'Personal Information',
    required: false
  },
  {
    key: 'requireBirthdate' as keyof RegistrationFields,
    label: 'Birth Date',
    description: 'Date of birth for age verification',
    category: 'Personal Information',
    required: false
  },
  {
    key: 'requirePronouns' as keyof RegistrationFields,
    label: 'Pronouns',
    description: 'Preferred pronouns (He/Him, She/Her, They/Them, Prefer not to say)',
    category: 'Personal Information',
    required: false
  },
  {
    key: 'requirePhone' as keyof RegistrationFields,
    label: 'Phone Number',
    description: 'Primary phone number',
    category: 'Contact & Address',
    required: false
  },
  {
    key: 'requireAddress' as keyof RegistrationFields,
    label: 'Address',
    description: 'Street address',
    category: 'Contact & Address',
    required: false
  },
  {
    key: 'requireCity' as keyof RegistrationFields,
    label: 'City',
    description: 'City of residence',
    category: 'Contact & Address',
    required: false
  },
  {
    key: 'requirePostalCode' as keyof RegistrationFields,
    label: 'Postal Code',
    description: 'Postal/ZIP code',
    category: 'Contact & Address',
    required: false
  },
  {
    key: 'requireHomePhone' as keyof RegistrationFields,
    label: 'Home Phone',
    description: 'Alternative phone number',
    category: 'Contact & Address',
    required: false
  },
  {
    key: 'requireEmergencyContactName' as keyof RegistrationFields,
    label: 'Emergency Contact Name',
    description: 'Name of emergency contact person',
    category: 'Emergency Contact',
    required: false
  },
  {
    key: 'requireEmergencyContactNumber' as keyof RegistrationFields,
    label: 'Emergency Contact Number',
    description: 'Phone number of emergency contact',
    category: 'Emergency Contact',
    required: false
  },
  {
    key: 'requireCommunicationPreferences' as keyof RegistrationFields,
    label: 'Communication Preferences',
    description: 'Preferred contact method (Email, SMS, App Notification)',
    category: 'Communication',
    required: false
  },
  {
    key: 'requireProfilePictureUrl' as keyof RegistrationFields,
    label: 'Profile Picture',
    description: 'Profile photo upload',
    category: 'Profile',
    required: false
  },
  {
    key: 'requireAllergies' as keyof RegistrationFields,
    label: 'Allergies',
    description: 'Any food or environmental allergies',
    category: 'Health & Safety',
    required: false
  },
  {
    key: 'requireMedicalConcerns' as keyof RegistrationFields,
    label: 'Medical Concerns',
    description: 'Any medical conditions or concerns',
    category: 'Health & Safety',
    required: false
  },
  {
    key: 'requirePreferredDays' as keyof RegistrationFields,
    label: 'Preferred Days',
    description: 'Preferred days for volunteering',
    category: 'Volunteering Preferences',
    required: false
  },
  {
    key: 'requirePreferredShifts' as keyof RegistrationFields,
    label: 'Preferred Shifts',
    description: 'Preferred shift times',
    category: 'Volunteering Preferences',
    required: false
  },
  {
    key: 'requireFrequency' as keyof RegistrationFields,
    label: 'Volunteering Frequency',
    description: 'How often they can volunteer (Weekly, Bi-weekly, Monthly, Daily, Once, When time permits)',
    category: 'Volunteering Preferences',
    required: false
  },
  {
    key: 'requirePreferredPrograms' as keyof RegistrationFields,
    label: 'Preferred Programs',
    description: 'Specific programs they\'re interested in',
    category: 'Volunteering Preferences',
    required: false
  },
  {
    key: 'requireCanCallIfShortHanded' as keyof RegistrationFields,
    label: 'Can Call If Short-Handed',
    description: 'Willing to be called for last-minute shifts',
    category: 'Volunteering Preferences',
    required: false
  },
  {
    key: 'requireSchoolWorkCommitment' as keyof RegistrationFields,
    label: 'School/Work Commitment',
    description: 'Currently in school or working',
    category: 'Commitment Details',
    required: false
  },
  {
    key: 'requireRequiredHours' as keyof RegistrationFields,
    label: 'Required Hours',
    description: 'Number of hours needed (for students/community service)',
    category: 'Commitment Details',
    required: false
  },
  {
    key: 'requireHowDidYouHear' as keyof RegistrationFields,
    label: 'How Did You Hear About Us',
    description: 'Source of information (Family/Friends, Google, Social Media, Connect Fredericton, School, Work, Notice Boards, Events)',
    category: 'Additional Information',
    required: false
  },
  {
    key: 'requireStartDate' as keyof RegistrationFields,
    label: 'Preferred Start Date',
    description: 'When they would like to start volunteering',
    category: 'Additional Information',
    required: false
  },
  {
    key: 'requireParentGuardianName' as keyof RegistrationFields,
    label: 'Parent/Guardian Name',
    description: 'Parent or guardian name (for minors)',
    category: 'Youth Volunteer Information',
    required: false
  },
  {
    key: 'requireParentGuardianEmail' as keyof RegistrationFields,
    label: 'Parent/Guardian Email',
    description: 'Parent or guardian email (for minors)',
    category: 'Youth Volunteer Information',
    required: false
  }
];

export default function EditShiftPage() {
  const params = useParams();
  const router = useRouter();
  const shiftId = parseInt(params.shiftId as string);

  const [shift, setShift] = useState<ShiftDetails | null>(null);
  const [registrationFields, setRegistrationFields] = useState<RegistrationFields | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Unsaved changes tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [originalShiftForm, setOriginalShiftForm] = useState<any>(null);
  const [originalRegistrationFields, setOriginalRegistrationFields] = useState<RegistrationFields | null>(null);
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
    }
  }, [shiftId]);

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
    if (!originalShiftForm || !originalRegistrationFields) return;
    
    const shiftChanged = !deepEqual(shiftForm, originalShiftForm);
    const fieldsChanged = !deepEqual(registrationFields, originalRegistrationFields);
    const usersChanged = !deepEqual(selectedDefaultUsers, originalDefaultUsers);
    
    const hasChanges = shiftChanged || fieldsChanged || usersChanged;
    setHasUnsavedChanges(hasChanges);
  }, [shiftForm, registrationFields, selectedDefaultUsers, originalShiftForm, originalRegistrationFields, originalDefaultUsers]);

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
      
      if (!shiftRes.ok) throw new Error("Failed to fetch shift details");
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
          ? extractTimeFromUTC(shiftData.startTime)
          : convertUTCToHalifax(shiftData.startTime),
        endTime: shiftData.isRecurring 
          ? extractTimeFromUTC(shiftData.endTime)
          : convertUTCToHalifax(shiftData.endTime),
        shiftCategoryId: String(shiftData.shiftCategoryId),
        location: shiftData.location,
        slots: shiftData.slots,
        isActive: shiftData.isActive
      };
      
      setShiftForm(formData);
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

      // Fetch registration fields
      const fieldsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recurring-shifts/${shiftId}/registration-fields`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!fieldsRes.ok) throw new Error("Failed to fetch registration fields");
      const fieldsData = await fieldsRes.json();
      setRegistrationFields(fieldsData);
      setOriginalRegistrationFields({ ...fieldsData }); // Deep copy for comparison

      // Fetch default users for this shift
      fetchDefaultUsersForShift(shiftId);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load shift details");
      toast.error("Failed to load shift details");
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
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      // Filter out "Collection" category as it's only for backend use
      const filteredCategories = data.filter((category: any) => 
        category.name.toLowerCase() !== 'collection'
      );
      setCategories(filteredCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    setDefaultUsersError('');
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      // Filter only approved users
      const approvedUsers = data.filter((user: any) => user.status === 'APPROVED');
      setAvailableUsers(approvedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setDefaultUsersError('Failed to load users');
      setAvailableUsers([]);
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
        const defaultUserIds = data.defaultUsers.map((du: any) => du.userId);
        setSelectedDefaultUsers(defaultUserIds);
        setOriginalDefaultUsers([...defaultUserIds]); // Store original for comparison
      } else {
        console.error('Failed to fetch default users:', res.status, res.statusText);
        setSelectedDefaultUsers([]);
        setOriginalDefaultUsers([]);
      }
    } catch (err) {
      console.error('Failed to fetch default users:', err);
      setSelectedDefaultUsers([]);
    }
  };

  const handleSaveDefaultUsers = async () => {
    setSavingDefaultUsers(true);
    setDefaultUsersError('');
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recurring-shifts/${shiftId}/default-users`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userIds: selectedDefaultUsers
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save default users');
      }

      const data = await res.json();
      console.log('Saved default users:', data); // Debug log
      toast.success('Default users saved successfully!');
      
      // Update original values to reflect saved state
      setOriginalDefaultUsers([...selectedDefaultUsers]);
      
      // Refresh the default users to confirm they're saved
      await fetchDefaultUsersForShift(shiftId);
    } catch (err) {
      console.error('Error saving default users:', err);
      setDefaultUsersError(err instanceof Error ? err.message : 'Failed to save default users');
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
        isActive: shiftForm.isActive
      };

      if (shift.isRecurring) {
        // Recurring shift - use time format with Halifax to UTC conversion
        const baseDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
        updateData.newDaysOfWeek = shiftForm.newDaysOfWeek;
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
      
      // Don't refresh data immediately to avoid overwriting the updated original values
      // The form state is already up to date
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update shift');
    } finally {
      setSaving(false);
    }
  };

  const handleRegistrationFieldsSave = async () => {
    if (!registrationFields) return;
    
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recurring-shifts/${shiftId}/registration-fields`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(registrationFields)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update registration fields');
      }

      toast.success('Registration fields updated successfully!');
      
      // Update original values to reflect saved state (deep copy)
      setOriginalRegistrationFields({ ...registrationFields });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update registration fields');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldToggle = (fieldKey: keyof RegistrationFields) => {
    if (!registrationFields) return;
    
    setRegistrationFields(prev => ({
      ...prev!,
      [fieldKey]: !prev![fieldKey]
    }));
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

  if (error || !shift) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Shift not found"}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Back to Manage Shifts
          </button>
        </div>
      </div>
    );
  }

  // Group fields by category
  const groupedFields = FIELD_CONFIG.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = [];
    }
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, typeof FIELD_CONFIG>);

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
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Section A: Shift Details */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mr-3">
                  Section A
                </span>
                Shift Details
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((day, i) => (
                      // <option key={i} value={i}>{day}</option>
                      <label key={i} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shiftForm.newDaysOfWeek.includes(i)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setShiftForm(prev => {
                                const newDaysOfWeek = [...prev.newDaysOfWeek, i];
                                return {
                                  ...prev,
                                  newDaysOfWeek
                                };
                              });
                            } else {
                              setShiftForm(prev => {
                                const newDaysOfWeek = prev.newDaysOfWeek.filter(d => d !== i);
                                return {
                                  ...prev,
                                  newDaysOfWeek
                                };
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={shiftForm.shiftCategoryId}
                  onChange={(e) => setShiftForm(prev => ({ ...prev, shiftCategoryId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  value={shiftForm.location}
                  onChange={(e) => setShiftForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Slots *
                </label>
                <input
                  type="number"
                  min="1"
                  value={shiftForm.slots}
                  onChange={(e) => setShiftForm(prev => ({ ...prev, slots: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={shiftForm.isActive}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>

              <button
                onClick={handleShiftSave}
                disabled={saving || !shiftForm.name || !shiftForm.startTime || !shiftForm.endTime || !shiftForm.shiftCategoryId || !shiftForm.location}
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
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mr-3">
                Section B
              </span>
              Default Users Assignment
            </h2>
            
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">
                Select users to automatically assign to this shift:
              </div>
              <div className="text-xs text-gray-500 mb-4">
                Debug: Available users: {availableUsers.length}, Selected: {selectedDefaultUsers.length}, Selected IDs: {JSON.stringify(selectedDefaultUsers)}
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

            {defaultUsersError && (
              <div className="text-red-600 text-sm mb-4">{defaultUsersError}</div>
            )}
            
            {loadingUsers ? (
              <div className="text-gray-600 text-sm">Loading users...</div>
            ) : (
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
                        {filteredUsers.map((user: any) => (
                          <label key={user.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedDefaultUsers.includes(user.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  if (selectedDefaultUsers.length >= shiftForm.slots) {
                                    toast.error(`Cannot select more than ${shiftForm.slots} users (shift slots limit)`);
                                    return;
                                  }
                                  setSelectedDefaultUsers(prev => [...prev, user.id]);
                                } else {
                                  setSelectedDefaultUsers(prev => prev.filter(id => id !== user.id));
                                }
                              }}
                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                            <span className="text-sm">
                              {user.firstName} {user.lastName} ({user.email})
                            </span>
                          </label>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                
                <div className="text-sm text-gray-600">
                  Selected: {selectedDefaultUsers.length} / {shiftForm.slots} slots
                </div>
                
                {selectedDefaultUsers.length === 0 && (
                  <div className="text-sm text-orange-600 font-semibold p-3 bg-yellow-100 rounded-lg text-center">
                    ⚠️ No default users assigned to this shift
                  </div>
                )}
              </div>
            )}

            {/* Save Button for Default Users */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleSaveDefaultUsers}
                disabled={savingDefaultUsers}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {savingDefaultUsers ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving Default Users...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Save Default Users
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section C: Registration Fields */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mr-3">
                Section C
              </span>
              Registration Fields Configuration
            </h2>

            {registrationFields && (
              <div className="space-y-6">
                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search fields by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {(() => {
                  const allFilteredFields = Object.entries(groupedFields).map(([category, fields]) => {
                    // Filter fields based on search term
                    const filteredFields = fields.filter(field => 
                      field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      field.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      category.toLowerCase().includes(searchTerm.toLowerCase())
                    );

                    return { category, fields: filteredFields };
                  }).filter(({ fields }) => fields.length > 0);

                  if (searchTerm && allFilteredFields.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <p className="text-gray-500 text-lg">No fields found matching "{searchTerm}"</p>
                        <p className="text-gray-400 text-sm mt-2">Try searching for a different term</p>
                      </div>
                    );
                  }

                                     return allFilteredFields.map(({ category, fields }) => (
                     <div key={category} className="border border-gray-200 rounded-lg p-4">
                       <h3 className="text-lg font-medium text-gray-900 mb-4">{category}</h3>
                       <div className="space-y-3">
                         {fields.map((field) => (
                           <div key={field.key} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                             <div className="flex-1">
                               <div className="flex items-center">
                                 <label className="text-sm font-medium text-gray-900">
                                   {field.label}
                                   {field.required && <span className="text-red-500 ml-1">*</span>}
                                 </label>
                               </div>
                               <p className="text-xs text-gray-600 mt-1">{field.description}</p>
                             </div>
                             <div className="ml-4">
                               <button
                                 onClick={() => handleFieldToggle(field.key)}
                                 disabled={field.required}
                                 className={`p-2 rounded-lg transition-colors ${
                                   field.required 
                                     ? 'bg-green-100 text-green-600 cursor-not-allowed' 
                                     : registrationFields![field.key]
                                       ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                       : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                 }`}
                                 title={field.required ? 'This field is always required' : 'Toggle field requirement'}
                               >
                                 {registrationFields![field.key] ? <FaToggleOn className="w-4 h-4" /> : <FaToggleOff className="w-4 h-4" />}
                               </button>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   ));
                 })()}

                <button
                  onClick={handleRegistrationFieldsSave}
                  disabled={saving}
                  className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" />
                      Save Registration Fields
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 