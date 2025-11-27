'use client';

import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaClock, FaMapMarkerAlt, FaUser, FaCalendarAlt } from 'react-icons/fa';

interface Shift {
  id: number;
  name: string;
  categoryName: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  availableSlots: number;
  totalSlots: number;
  dynamicFields: Array<{
    id: number;
    fieldDefinitionId: number;
    isRequired: boolean;
    isActive: boolean;
    order: number;
    fieldDefinition: {
      id: number;
      name: string;
      label: string;
      description: string;
      fieldType: 'TEXT' | 'EMAIL' | 'NUMBER' | 'SELECT' | 'MULTISELECT' | 'BOOLEAN' | 'DATE' | 'TEXTAREA';
      validation: any;
      options: string[] | null;
      isSystemField: boolean;
    };
  }>;
}

interface SignupFormData {
  selectedDate: string;
  fieldValues: { [key: string]: any };
}

interface FormErrors {
  [key: string]: string;
}

export default function ShiftSignupPage() {
  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<SignupFormData>({
    selectedDate: '',
    fieldValues: {}
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Get URL parameters
  const [categoryName, setCategoryName] = useState('');
  const [shiftName, setShiftName] = useState('');
  const [urlDate, setUrlDate] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      if (pathParts.length >= 4) {
        setCategoryName(decodeURIComponent(pathParts[2]));
        setShiftName(decodeURIComponent(pathParts[3]));
      }
      
      const urlParams = new URLSearchParams(window.location.search);
      const dateParam = urlParams.get('date');
      if (dateParam) {
        setUrlDate(dateParam);
        setFormData(prev => ({ ...prev, selectedDate: dateParam }));
      }
    }
  }, []);

  // Helper function to format date for Halifax timezone
  const formatHalifaxDateString = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Halifax'
      });
    } catch (error) {
      return dateStr;
    }
  };

  // Fetch shift details
  useEffect(() => {
    const fetchShiftDetails = async () => {
      if (!categoryName || !shiftName) return;
      
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/public/shift-signup/${encodeURIComponent(categoryName)}/${encodeURIComponent(shiftName)}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Shift not found');
          } else {
            setError('Failed to load shift details');
          }
          return;
        }
        
        const data = await response.json();
        setShift(data);
      } catch (err) {
        console.error('Error fetching shift details:', err);
        setError('Failed to load shift details');
      } finally {
        setLoading(false);
      }
    };

    fetchShiftDetails();
  }, [categoryName, shiftName]);

  // Form validation
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    // Validate dynamic fields based on shift requirements
    if (shift?.dynamicFields) {
      for (const fieldReq of shift.dynamicFields) {
        if (fieldReq.isRequired) {
          const fieldValue = formData.fieldValues[fieldReq.fieldDefinition.name];
          if (!fieldValue || (typeof fieldValue === 'string' && !fieldValue.trim())) {
            errors[`field_${fieldReq.fieldDefinition.name}`] = `${fieldReq.fieldDefinition.label} is required`;
          }
        }
      }
    }
    
    if (!formData.selectedDate.trim()) {
      errors.selectedDate = "Please select a date";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      setError("");
      
      // Extract system field values from dynamic fields
      let email = '';
      let firstName = '';
      let lastName = '';
      
      if (shift?.dynamicFields) {
        for (const fieldReq of shift.dynamicFields) {
          const fieldDef = fieldReq.fieldDefinition;
          const fieldValue = formData.fieldValues[fieldDef.name] || '';
          
          if (fieldDef.name === 'email') {
            email = fieldValue;
          } else if (fieldDef.name === 'firstName') {
            firstName = fieldValue;
          } else if (fieldDef.name === 'lastName') {
            lastName = fieldValue;
          }
        }
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/public/shift-signup/${encodeURIComponent(categoryName)}/${encodeURIComponent(shiftName)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          shiftDate: formData.selectedDate,
          fieldValues: formData.fieldValues
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to sign up for shift");
      }
      
      setSuccess(true);
      setSuccessMessage(data.message || "You have successfully signed up for the shift!");
    } catch (err: any) {
      console.error("Shift signup error:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle field value changes
  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      fieldValues: {
        ...prev.fieldValues,
        [fieldName]: value
      }
    }));
    
    // Clear error for this field
    if (formErrors[`field_${fieldName}`]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`field_${fieldName}`];
        return newErrors;
      });
    }
  };

  // Render field input based on type
  const renderFieldInput = (fieldReq: any) => {
    const fieldDef = fieldReq.fieldDefinition;
    const fieldName = fieldDef.name;
    const fieldValue = formData.fieldValues[fieldName] || '';
    const hasError = formErrors[`field_${fieldName}`];

    switch (fieldDef.fieldType) {
      case 'TEXT':
      case 'EMAIL':
        return (
          <input
            type={fieldDef.fieldType === 'EMAIL' ? 'email' : 'text'}
            id={fieldName}
            value={fieldValue}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              hasError ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={fieldDef.placeholder || `Enter ${fieldDef.label.toLowerCase()}`}
            required={fieldReq.isRequired}
          />
        );

      case 'NUMBER':
        return (
          <input
            type="number"
            id={fieldName}
            value={fieldValue}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              hasError ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={fieldDef.placeholder || `Enter ${fieldDef.label.toLowerCase()}`}
            required={fieldReq.isRequired}
          />
        );

      case 'TEXTAREA':
        return (
          <textarea
            id={fieldName}
            value={fieldValue}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              hasError ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={fieldDef.placeholder || `Enter ${fieldDef.label.toLowerCase()}`}
            required={fieldReq.isRequired}
          />
        );

      case 'DATE':
        return (
          <input
            type="date"
            id={fieldName}
            value={fieldValue}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              hasError ? 'border-red-500' : 'border-gray-300'
            }`}
            required={fieldReq.isRequired}
          />
        );

      case 'SELECT':
        return (
          <select
            id={fieldName}
            value={fieldValue}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              hasError ? 'border-red-500' : 'border-gray-300'
            }`}
            required={fieldReq.isRequired}
          >
            <option value="">Select {fieldDef.label.toLowerCase()}</option>
            {fieldDef.options?.map((option: string, index: number) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'MULTISELECT':
        return (
          <div className="space-y-2">
            {fieldDef.options?.map((option: string, index: number) => (
              <label key={index} className="flex items-center">
                <input
                  type="checkbox"
                  checked={Array.isArray(fieldValue) ? fieldValue.includes(option) : false}
                  onChange={(e) => {
                    const currentValues = Array.isArray(fieldValue) ? fieldValue : [];
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter(v => v !== option);
                    handleFieldChange(fieldName, newValues);
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'BOOLEAN':
        return (
          <div className="space-y-2">
            {fieldDef.options?.map((option: string, index: number) => (
              <label key={index} className="flex items-center">
                <input
                  type="radio"
                  name={fieldName}
                  value={option}
                  checked={fieldValue === option}
                  onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                  className="mr-2"
                  required={fieldReq.isRequired}
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      default:
        return (
          <input
            type="text"
            id={fieldName}
            value={fieldValue}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              hasError ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={fieldDef.placeholder || `Enter ${fieldDef.label.toLowerCase()}`}
            required={fieldReq.isRequired}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shift details...</p>
        </div>
      </div>
    );
  }

  if (error && !shift) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full text-white py-2 px-4 rounded-lg transition"
            style={{ backgroundColor: '#ff9800' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e68900'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ff9800'}
          >
            Go to Home Page
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <FaCheckCircle className="text-4xl text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Signup Successful!</h2>
          <p className="text-gray-600 mb-6">{successMessage}</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Shift Details:</h3>
            <p className="text-sm text-gray-600">
              <strong>{shift?.name}</strong> ({shift?.categoryName})
            </p>
            <p className="text-sm text-gray-600">
              📅 {formData.selectedDate ? formatHalifaxDateString(formData.selectedDate) : 'Date selected'}
            </p>
            <p className="text-sm text-gray-600">
              🕒 {shift && `${new Date(shift.startTime).toLocaleTimeString('en-CA', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone: 'America/Halifax'
              })} - ${new Date(shift.endTime).toLocaleTimeString('en-CA', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone: 'America/Halifax'
              })}`}
            </p>
            <p className="text-sm text-gray-600">
              📍 {shift?.location}
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full text-white py-2 px-4 rounded-lg transition"
            style={{ backgroundColor: '#ff9800' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e68900'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ff9800'}
          >
            Go to Home Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Volunteer Shift Signup</h1>
          <p className="text-gray-600">Join us for this volunteer opportunity</p>
        </div>

        {/* Shift Full Message */}
        {shift && shift.availableSlots <= 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Shift Full</h2>
            <p className="text-gray-600 mb-6">
              Sorry, this shift is currently full. Please check back later or choose a different shift.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full text-white py-2 px-4 rounded-lg transition"
              style={{ backgroundColor: '#ff9800' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e68900'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ff9800'}
            >
              Go to Home Page
            </button>
          </div>
        )}

        {/* Shift Details */}
        {shift && shift.availableSlots > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{shift.name}</h2>
              <p className="text-gray-600 mb-6">{shift.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-gray-600">
                  <FaCalendarAlt className="mr-2" />
                  <span>Category: {shift.categoryName}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FaClock className="mr-2" />
                  <span>
                    {new Date(shift.startTime).toLocaleTimeString('en-CA', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                      timeZone: 'America/Halifax'
                    })} - {new Date(shift.endTime).toLocaleTimeString('en-CA', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                      timeZone: 'America/Halifax'
                    })}
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FaMapMarkerAlt className="mr-2" />
                  <span>{shift.location}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FaUser className="mr-2" />
                  <span>{shift.availableSlots} of {shift.totalSlots} spots available</span>
                </div>
              </div>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date Selection */}
              <div>
                <label htmlFor="selectedDate" className="block text-sm font-medium text-gray-700 mb-2">
                  {urlDate ? 'Selected Date' : 'Select Date'} *
                </label>
                <input
                  type="date"
                  id="selectedDate"
                  value={formData.selectedDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, selectedDate: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    formErrors.selectedDate ? 'border-red-500' : 'border-gray-300'
                  } ${urlDate ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  required
                  readOnly={!!urlDate}
                />
                {urlDate && (
                  <p className="mt-1 text-sm text-gray-500">
                    Date is pre-selected from the link. This shift is scheduled for this specific date.
                  </p>
                )}
                {formErrors.selectedDate && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.selectedDate}</p>
                )}
              </div>

              {/* Dynamic Fields */}
              {shift.dynamicFields && shift.dynamicFields.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Signup Information</h3>
                  {shift.dynamicFields
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((fieldReq) => (
                    <div key={fieldReq.id}>
                      <label htmlFor={fieldReq.fieldDefinition.name} className="block text-sm font-medium text-gray-700 mb-2">
                        {fieldReq.fieldDefinition.label}
                        {fieldReq.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {fieldReq.fieldDefinition.description && (
                        <p className="text-sm text-gray-500 mb-2">{fieldReq.fieldDefinition.description}</p>
                      )}
                      {renderFieldInput(fieldReq)}
                      {formErrors[`field_${fieldReq.fieldDefinition.name}`] && (
                        <p className="mt-1 text-sm text-red-600">
                          {formErrors[`field_${fieldReq.fieldDefinition.name}`]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full text-white py-3 px-4 rounded-lg transition font-semibold"
                style={{ backgroundColor: '#ff9800' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e68900'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ff9800'}
              >
                {submitting ? 'Signing up...' : 'Sign Up for Shift'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}