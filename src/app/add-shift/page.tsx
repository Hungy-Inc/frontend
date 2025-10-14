"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaSave, FaArrowLeft, FaToggleOn, FaToggleOff } from "react-icons/fa";
import { toast } from 'react-toastify';

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

interface RegistrationFields {
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
  requireSkills: boolean;
  requireAvailability: boolean;
  requireNotes: boolean;
}

export default function AddShiftPage() {
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

  // Registration fields state
  const [registrationFields, setRegistrationFields] = useState<RegistrationFields>({
    requireFirstName: true,
    requireLastName: true,
    requireEmail: true,
    requireAgeBracket: false,
    requireBirthdate: false,
    requirePronouns: false,
    requirePhone: false,
    requireAddress: false,
    requireCity: false,
    requirePostalCode: false,
    requireHomePhone: false,
    requireEmergencyContactName: false,
    requireEmergencyContactNumber: false,
    requireCommunicationPreferences: false,
    requireProfilePictureUrl: false,
    requireAllergies: false,
    requireMedicalConcerns: false,
    requirePreferredDays: false,
    requirePreferredShifts: false,
    requireFrequency: false,
    requirePreferredPrograms: false,
    requireSkills: false,
    requireAvailability: false,
    requireNotes: false
  });

  // Other state
  const [categoryOptions, setCategoryOptions] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedDefaultUsers, setSelectedDefaultUsers] = useState<number[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load initial data
  useEffect(() => {
    fetchCategories();
    fetchAvailableUsers();
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
        const baseDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
        const start = new Date(`${baseDate}T${shiftForm.startTime}`);
        const end = new Date(`${baseDate}T${shiftForm.endTime}`);
        const diffMs = end.getTime() - start.getTime();
        if (diffMs < 60 * 60 * 1000) {
          toast.error('Shift end time must be at least 1 hour after start time.');
          setSaving(false);
          return;
        }
        startTime = `${baseDate}T${shiftForm.startTime}:00-03:00`;
        endTime = `${baseDate}T${shiftForm.endTime}:00-03:00`;
      } else {
        // One-time shift - use datetime inputs
        const start = new Date(shiftForm.startTime);
        const end = new Date(shiftForm.endTime);
        const diffMs = end.getTime() - start.getTime();
        if (diffMs < 60 * 60 * 1000) {
          toast.error('Shift end time must be at least 1 hour after start time.');
          setSaving(false);
          return;
        }
        startTime = shiftForm.startTime;
        endTime = shiftForm.endTime;
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
          isRecurring: shiftForm.isRecurring
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add shift');
      
      // Add default users if any are selected
      if (selectedDefaultUsers.length > 0) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recurring-shifts/${data.id}/default-users`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              userIds: selectedDefaultUsers
            })
          });
        } catch (err) {
          console.error('Failed to add default users:', err);
          toast.warning('Shift created but failed to assign default users. You can assign them later.');
        }
      }

      // Create registration fields
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts/${data.id}/registration-fields`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(registrationFields)
        });
      } catch (err) {
        console.error('Failed to create registration fields:', err);
        toast.warning('Shift created but failed to set registration fields. You can configure them later.');
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

  const handleFieldToggle = (fieldKey: keyof RegistrationFields) => {
    setRegistrationFields(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }));
  };

  // Grouped fields for better organization
  const groupedFields = {
    'Basic Information': [
      { key: 'requireFirstName', label: 'First Name', description: 'User\'s first name', required: true },
      { key: 'requireLastName', label: 'Last Name', description: 'User\'s last name', required: true },
      { key: 'requireEmail', label: 'Email Address', description: 'User\'s email address', required: true },
      { key: 'requireAgeBracket', label: 'Age Bracket', description: 'User\'s age range', required: false },
      { key: 'requireBirthdate', label: 'Birth Date', description: 'User\'s date of birth', required: false },
      { key: 'requirePronouns', label: 'Pronouns', description: 'User\'s preferred pronouns', required: false }
    ],
    'Contact Information': [
      { key: 'requirePhone', label: 'Phone Number', description: 'User\'s primary phone number', required: false },
      { key: 'requireHomePhone', label: 'Home Phone', description: 'User\'s home phone number', required: false },
      { key: 'requireAddress', label: 'Address', description: 'User\'s street address', required: false },
      { key: 'requireCity', label: 'City', description: 'User\'s city', required: false },
      { key: 'requirePostalCode', label: 'Postal Code', description: 'User\'s postal/ZIP code', required: false }
    ],
    'Emergency Contacts': [
      { key: 'requireEmergencyContactName', label: 'Emergency Contact Name', description: 'Name of emergency contact', required: false },
      { key: 'requireEmergencyContactNumber', label: 'Emergency Contact Number', description: 'Phone number of emergency contact', required: false }
    ],
    'Preferences & Communication': [
      { key: 'requireCommunicationPreferences', label: 'Communication Preferences', description: 'How user prefers to be contacted', required: false },
      { key: 'requireProfilePictureUrl', label: 'Profile Picture', description: 'User\'s profile photo', required: false }
    ],
    'Health & Safety': [
      { key: 'requireAllergies', label: 'Allergies', description: 'Any known allergies', required: false },
      { key: 'requireMedicalConcerns', label: 'Medical Concerns', description: 'Any medical conditions or concerns', required: false }
    ],
    'Availability & Skills': [
      { key: 'requirePreferredDays', label: 'Preferred Days', description: 'Days user prefers to volunteer', required: false },
      { key: 'requirePreferredShifts', label: 'Preferred Shifts', description: 'Types of shifts user prefers', required: false },
      { key: 'requireFrequency', label: 'Volunteer Frequency', description: 'How often user wants to volunteer', required: false },
      { key: 'requirePreferredPrograms', label: 'Preferred Programs', description: 'Programs user is interested in', required: false },
      { key: 'requireSkills', label: 'Skills', description: 'User\'s relevant skills and experience', required: false },
      { key: 'requireAvailability', label: 'Availability', description: 'User\'s general availability', required: false }
    ],
    'Additional Information': [
      { key: 'requireNotes', label: 'Additional Notes', description: 'Any additional information or comments', required: false }
    ]
  };

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
                      {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((day, i) => (
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
                                    newDaysOfWeek,
                                    dayOfWeek: prev.newDaysOfWeek.length === 0 ? i : prev.dayOfWeek
                                  };
                                });
                              } else {
                                setShiftForm(prev => {
                                  const newDaysOfWeek = prev.newDaysOfWeek.filter(d => d !== i);
                                  return {
                                    ...prev,
                                    newDaysOfWeek,
                                    dayOfWeek: prev.newDaysOfWeek.length === 1 && prev.newDaysOfWeek[0] === i ? 0 : prev.dayOfWeek
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
                              onClick={() => handleFieldToggle(field.key as keyof RegistrationFields)}
                              disabled={field.required}
                              className={`p-2 rounded-lg transition-colors ${
                                field.required 
                                  ? 'bg-green-100 text-green-600 cursor-not-allowed' 
                                  : registrationFields[field.key as keyof RegistrationFields]
                                    ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              }`}
                            >
                              {field.required ? (
                                <FaToggleOn className="text-lg" />
                              ) : registrationFields[field.key as keyof RegistrationFields] ? (
                                <FaToggleOn className="text-lg" />
                              ) : (
                                <FaToggleOff className="text-lg" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
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
    </div>
  );
}
