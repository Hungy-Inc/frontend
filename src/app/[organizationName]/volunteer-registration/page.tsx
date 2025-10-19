"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash, FaSpinner, FaCheckCircle } from 'react-icons/fa';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  const validatePassword = (pw: string) => {
    if (pw.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pw)) return "Password must contain uppercase letter";
    if (!/[a-z]/.test(pw)) return "Password must contain lowercase letter";
    if (!/\d/.test(pw)) return "Password must contain a number";
    return "";
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

    // Validate password
    if (!password) {
      toast.error('Password is required');
      return false;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError);
      return false;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return false;
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
          password,
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

    const commonClasses = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent";

    switch (fieldDefinition.fieldType) {
      case 'TEXT':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(fieldDefinition.name, e.target.value)}
            placeholder={fieldDefinition.placeholder || ''}
            className={commonClasses}
            required={field.isRequired}
          />
        );

      case 'EMAIL':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => handleFieldChange(fieldDefinition.name, e.target.value)}
            placeholder={fieldDefinition.placeholder || 'your.email@example.com'}
            className={commonClasses}
            required={field.isRequired}
          />
        );

      case 'PHONE':
        return (
          <input
            type="tel"
            value={value}
            onChange={(e) => handleFieldChange(fieldDefinition.name, e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder={fieldDefinition.placeholder || '1234567890'}
            className={commonClasses}
            required={field.isRequired}
          />
        );

      case 'DATE':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(fieldDefinition.name, e.target.value)}
            className={commonClasses}
            required={field.isRequired}
          />
        );

      case 'DATETIME':
        return (
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => handleFieldChange(fieldDefinition.name, e.target.value)}
            className={commonClasses}
            required={field.isRequired}
          />
        );

      case 'NUMBER':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(fieldDefinition.name, e.target.value)}
            placeholder={fieldDefinition.placeholder || ''}
            className={commonClasses}
            required={field.isRequired}
          />
        );

      case 'BOOLEAN':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleFieldChange(fieldDefinition.name, e.target.checked)}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              required={field.isRequired}
            />
            <label className="ml-2 text-sm text-gray-700">
              {fieldDefinition.description || 'Yes'}
            </label>
          </div>
        );

      case 'SELECT':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(fieldDefinition.name, e.target.value)}
            className={commonClasses}
            required={field.isRequired}
          >
            <option value="">Select an option</option>
            {fieldDefinition.options?.map((option: string, idx: number) => (
              <option key={idx} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'MULTISELECT':
        return (
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
        );

      case 'TEXTAREA':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(fieldDefinition.name, e.target.value)}
            placeholder={fieldDefinition.placeholder || ''}
            rows={4}
            className={commonClasses}
            required={field.isRequired}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(fieldDefinition.name, e.target.value)}
            placeholder={fieldDefinition.placeholder || ''}
            className={commonClasses}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.fieldDefinition.label}
                  {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.fieldDefinition.description && (
                  <p className="text-sm text-gray-500 mb-2">{field.fieldDefinition.description}</p>
                )}
                {renderField(field)}
              </div>
            ))}

            {/* Password Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
