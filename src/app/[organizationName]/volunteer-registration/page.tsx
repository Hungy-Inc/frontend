"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { FaSpinner, FaCheckCircle } from 'react-icons/fa';

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
}

interface RegistrationField {
  id: number;
  organizationId: number;
  fieldDefinitionId: number;
  isRequired: boolean;
  isActive: boolean;
  order: number;
  fieldDefinition: FieldDefinition;
}

interface Organization {
  id: number;
  name: string;
  address?: string;
  email: string;
}
const FloatingLabelInput = ({ 
  type = "text", 
  value, 
  onChange, 
  label, 
  required = false,
  placeholder = "",
  ...props 
}: any) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && value.toString().length > 0;

  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-full px-4 pt-6 pb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
        required={required}
        {...props}
      />
      <label
        className={`absolute left-4 transition-all duration-200 pointer-events-none ${
          isFocused || hasValue
            ? 'top-1.5 text-xs text-orange-600 font-medium'
            : 'top-1/2 -translate-y-1/2 text-base text-gray-500'
        }`}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    </div>
  );
};
const FloatingLabelTextarea = ({ 
  value, 
  onChange, 
  label, 
  required = false,
  rows = 4,
  ...props 
}: any) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && value.toString().length > 0;

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        rows={rows}
        className="w-full px-4 pt-6 pb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 resize-none"
        required={required}
        {...props}
      />
      <label
        className={`absolute left-4 transition-all duration-200 pointer-events-none ${
          isFocused || hasValue
            ? 'top-1.5 text-xs text-orange-600 font-medium'
            : 'top-6 text-base text-gray-500'
        }`}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    </div>
  );
};
const FloatingLabelSelect = ({ 
  value, 
  onChange, 
  label, 
  required = false,
  options = [],
  ...props 
}: any) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && value.toString().length > 0;

  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-full px-4 pt-6 pb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
        required={required}
        {...props}
      >
        <option value=""></option>
        {options.map((option: string, idx: number) => (
          <option key={idx} value={option}>{option}</option>
        ))}
      </select>
      <label
        className={`absolute left-4 transition-all duration-200 pointer-events-none ${
          isFocused || hasValue
            ? 'top-1.5 text-xs text-orange-600 font-medium'
            : 'top-1/2 -translate-y-1/2 text-base text-gray-500'
        }`}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

export default function VolunteerRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const organizationName = params.organizationName as string;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [registrationFields, setRegistrationFields] = useState<RegistrationField[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Record<string, any>>({});

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchOrganizationAndFields();
  }, [organizationName]);

  const fetchOrganizationAndFields = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch organization details
      const orgResponse = await fetch(`${apiUrl}/api/public/organizations/${organizationName}`);
      if (!orgResponse.ok) {
        throw new Error('Organization not found');
      }
      const orgData = await orgResponse.json();
      setOrganization(orgData);

      // Fetch registration fields
      const fieldsResponse = await fetch(`${apiUrl}/api/public/organizations/${organizationName}/registration-fields`);
      if (!fieldsResponse.ok) {
        throw new Error('Failed to fetch registration fields');
      }
      const fieldsData = await fieldsResponse.json();
      setRegistrationFields(fieldsData);

      // Initialize form data with empty values
      const initialFormData: Record<string, any> = {};
      fieldsData.forEach((field: RegistrationField) => {
        const fieldName = field.fieldDefinition.name;
        if (field.fieldDefinition.fieldType === 'BOOLEAN') {
          initialFormData[fieldName] = false;
        } else if (field.fieldDefinition.fieldType === 'MULTISELECT') {
          initialFormData[fieldName] = [];
        } else {
          initialFormData[fieldName] = '';
        }
      });
      setFormData(initialFormData);
    } catch (err: any) {
      setError(err.message || 'Failed to load registration form');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };


  const validateForm = () => {
    // Check required fields
    for (const field of registrationFields) {
      if (field.isRequired) {
        const value = formData[field.fieldDefinition.name];
        if (!value || (typeof value === 'string' && !value.trim())) {
          toast.error(`${field.fieldDefinition.label} is required`);
          return false;
        }
      }
    }

    // Validate email format
    const emailField = registrationFields.find(f => f.fieldDefinition.fieldType === 'EMAIL');
    if (emailField) {
      const email = formData[emailField.fieldDefinition.name];
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        toast.error('Please enter a valid email address');
        return false;
      }
    }

    // Validate phone format
    const phoneField = registrationFields.find(f => f.fieldDefinition.fieldType === 'PHONE');
    if (phoneField) {
      const phone = formData[phoneField.fieldDefinition.name];
      if (phone && !/^\d{10}$/.test(phone)) {
        toast.error('Phone number must be 10 digits');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Prepare field values for submission
      const fieldValues = registrationFields.map(field => ({
        fieldName: field.fieldDefinition.name,
        value: formData[field.fieldDefinition.name]
      }));

      // Get email and phone from form data
      const emailField = registrationFields.find(f => f.fieldDefinition.fieldType === 'EMAIL');
      const phoneField = registrationFields.find(f => f.fieldDefinition.fieldType === 'PHONE');

      const email = emailField ? formData[emailField.fieldDefinition.name] : '';
      const phone = phoneField ? formData[phoneField.fieldDefinition.name] : '';

      const response = await fetch(`${apiUrl}/api/public/organizations/${organizationName}/volunteer-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          phone,
          fieldValues
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const result = await response.json();
      setSuccess(true);
      toast.success(result.message || 'Registration successful!');
      
      // Trigger notification for admins via localStorage event
      const notificationEvent = {
        type: 'NEW_VOLUNTEER_REGISTRATION',
        count: 1,
        timestamp: Date.now(),
        organizationName: organizationName
      };
      localStorage.setItem('volunteer_notification', JSON.stringify(notificationEvent));
      // Remove it immediately to allow future notifications
      setTimeout(() => {
        localStorage.removeItem('volunteer_notification');
      }, 100);
      
      // Redirect to home page after 3 seconds
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      toast.error(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: RegistrationField) => {
    const { fieldDefinition } = field;
    const value = formData[fieldDefinition.name] || '';

    switch (fieldDefinition.fieldType) {
      case 'TEXT':
        return (
          <FloatingLabelInput
            type="text"
            value={value}
            onChange={(e: any) => handleFieldChange(fieldDefinition.name, e.target.value)}
            label={fieldDefinition.label}
            required={field.isRequired}
          />
        );

      case 'EMAIL':
        return (
          <FloatingLabelInput
            type="email"
            value={value}
            onChange={(e: any) => handleFieldChange(fieldDefinition.name, e.target.value)}
            label={fieldDefinition.label}
            required={field.isRequired}
          />
        );

      case 'PHONE':
        return (
          <FloatingLabelInput
            type="tel"
            value={value}
            onChange={(e: any) => {
              const onlyDigits = e.target.value.replace(/\D/g, '');
              const trimmed = onlyDigits.slice(0, 10);
              handleFieldChange(fieldDefinition.name, trimmed);
            }}
            onPaste={(e: any) => {
              e.preventDefault();
              const pasted = e.clipboardData.getData('Text').replace(/\D/g, '').slice(0, 10);
              handleFieldChange(fieldDefinition.name, pasted);
            }}
            maxLength={10}
            inputMode="numeric"
            pattern="[0-9]*"
            label={fieldDefinition.label}
            required={field.isRequired}
          />
        );

      case 'DATE':
        return (
          <FloatingLabelInput
            type="date"
            value={value}
            onChange={(e: any) => handleFieldChange(fieldDefinition.name, e.target.value)}
            label={fieldDefinition.label}
            required={field.isRequired}
          />
        );

      case 'DATETIME':
        return (
          <FloatingLabelInput
            type="datetime-local"
            value={value}
            onChange={(e: any) => handleFieldChange(fieldDefinition.name, e.target.value)}
            label={fieldDefinition.label}
            required={field.isRequired}
          />
        );

      case 'NUMBER':
        return (
          <FloatingLabelInput
            type="number"
            value={value}
            onChange={(e: any) => handleFieldChange(fieldDefinition.name, e.target.value)}
            label={fieldDefinition.label}
            required={field.isRequired}
          />
        );

      case 'BOOLEAN':
        return (
          <div className="flex items-center p-4 border border-gray-300 rounded-lg">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleFieldChange(fieldDefinition.name, e.target.checked)}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              required={field.isRequired}
            />
            <label className="ml-3 text-sm text-gray-700">
              {fieldDefinition.label}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
        );

      case 'SELECT':
        return (
          <FloatingLabelSelect
            value={value}
            onChange={(e: any) => handleFieldChange(fieldDefinition.name, e.target.value)}
            label={fieldDefinition.label}
            required={field.isRequired}
            options={fieldDefinition.options}
          />
        );

      case 'MULTISELECT':
        return (
          <div className="border border-gray-300 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              {fieldDefinition.label}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </p>
            <div className="space-y-2">
              {fieldDefinition.options?.map((option: string, idx: number) => (
                <div key={idx} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={value.includes(option)}
                    onChange={(e) => {
                      const newValue = e.target.checked
                        ? [...value, option]
                        : value.filter((v: string) => v !== option);
                      handleFieldChange(fieldDefinition.name, newValue);
                    }}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">{option}</label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'TEXTAREA':
        return (
          <FloatingLabelTextarea
            value={value}
            onChange={(e: any) => handleFieldChange(fieldDefinition.name, e.target.value)}
            label={fieldDefinition.label}
            required={field.isRequired}
            rows={4}
          />
        );

      default:
        return (
          <FloatingLabelInput
            type="text"
            value={value}
            onChange={(e: any) => handleFieldChange(fieldDefinition.name, e.target.value)}
            label={fieldDefinition.label}
            required={field.isRequired}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff8f3] flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin h-12 w-12 text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading registration form...</p>
        </div>
      </div>
    );
  }

  if (error && !organization) {
    return (
      <div className="min-h-screen bg-[#fff8f3] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#fff8f3] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-8 rounded-lg">
            <FaCheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Registration Successful!</h2>
            <p className="mb-4">Your volunteer registration has been submitted successfully.</p>
            <p className="text-sm">Your account is pending approval. You will be notified once approved.</p>
            <p className="text-sm mt-4 text-gray-600">Redirecting to home page...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff8f3]">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-2xl font-extrabold text-orange-500 tracking-tight">HÜNGY</span>
              {organization && (
                <span className="text-gray-600">| {organization.name}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Volunteer Registration</h1>
            {organization && (
              <p className="text-gray-600">Join {organization.name} as a volunteer</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dynamic Fields */}
            {registrationFields.map((field) => (
              <div key={field.id}>
                {renderField(field)}
              </div>
            ))}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors duration-200"
              >
                {submitting ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Registration</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2025 HÜNGY - Volunteer Registration</p>
        </div>
      </footer>
    </div>
  );
}
