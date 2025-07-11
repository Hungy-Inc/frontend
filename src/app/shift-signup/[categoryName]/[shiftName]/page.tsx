"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  FaCalendarAlt, 
  FaClock, 
  FaMapMarkerAlt, 
  FaUsers, 
  FaSpinner, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaArrowLeft
} from "react-icons/fa";

interface ShiftDetails {
  id: number;
  name: string;
  categoryName: string;
  startTime: string;
  endTime: string;
  location: string;
  slots: number;
  availableSlots: number;
  organizationId: number;
  organizationName: string;
  signedUpCount: number;
}

interface SignupFormData {
  email: string;
  firstName: string;
  lastName: string;
  selectedDate: string;
}

// Helper: Parse YYYY-MM-DD as Halifax local date
function parseHalifaxDate(dateStr: string): Date {
  if (!dateStr) return new Date('');
  const [year, month, day] = dateStr.split('-').map(Number);
  // Construct a Date object as if the date is midnight in Halifax
  // Get the UTC time for midnight in Halifax
  // Halifax is UTC-4 or UTC-3 depending on DST, but for display, we use the timeZone option
  // So we can use Date.UTC and then display with timeZone: 'America/Halifax'
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
}

// Helper to format YYYY-MM-DD as Halifax local date string
function formatHalifaxDateString(dateStr: string) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  // Create a Date object at noon UTC to avoid timezone issues
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  // Always display in Halifax timezone
  return date.toLocaleDateString('en-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Halifax'
  });
}

export default function ShiftSignupPage() {
  const params = useParams();
  const router = useRouter();
  const categoryName = decodeURIComponent(params.categoryName as string);
  const shiftName = decodeURIComponent(params.shiftName as string);
  
  // Get date from URL query parameters
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const urlDate = searchParams.get('date');
  
  const [shift, setShift] = useState<ShiftDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState<SignupFormData>({
    email: "",
    firstName: "",
    lastName: "",
    selectedDate: urlDate || ""
  });
  const [formErrors, setFormErrors] = useState<Partial<SignupFormData>>({});

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchShiftDetails();
  }, [categoryName, shiftName, formData.selectedDate]);

  // Update form data when URL date changes
  useEffect(() => {
    if (urlDate) {
      setFormData(prev => ({ ...prev, selectedDate: urlDate }));
    }
  }, [urlDate]);

  const fetchShiftDetails = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Include date parameter if available
      let url = `${apiUrl}/api/public/shift-signup/${encodeURIComponent(categoryName)}/${encodeURIComponent(shiftName)}`;
      if (formData.selectedDate) {
        url += `?date=${encodeURIComponent(formData.selectedDate)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Shift not found. Please check the URL and try again.");
        }
        throw new Error("Failed to load shift details");
      }
      
      const data = await response.json();
      setShift(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<SignupFormData> = {};
    
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    }
    
    if (!formData.selectedDate.trim()) {
      errors.selectedDate = "Please select a date";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      setError("");
      
      const response = await fetch(`${apiUrl}/api/public/shift-signup/${encodeURIComponent(categoryName)}/${encodeURIComponent(shiftName)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          shiftDate: formData.selectedDate
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to sign up for shift");
      }
      
      setSuccess(true);
      setSuccessMessage(data.message);
      
      // Refresh shift details to update available slots
      fetchShiftDetails();
      
      // Trigger refresh on admin page if it's open
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('shiftSignupCompleted', {
          detail: { shiftId: data.shiftSignup?.id }
        }));
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof SignupFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Halifax' // Use Atlantic Canada timezone
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl mx-auto mb-4" style={{ color: '#ff9800' }} />
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Shift Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 text-white rounded-lg transition"
            style={{ backgroundColor: '#ff9800' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e68900'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ff9800'}
          >
            <FaArrowLeft className="mr-2" />
            Go Back
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Sorry, This Shift is Full!</h2>
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{shift.name}</h3>
              <p className="text-lg font-medium mb-2" style={{ color: '#ff9800' }}>{shift.categoryName}</p>
              <p className="text-gray-600 mb-4">{shift.organizationName}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="flex items-center text-gray-700">
                  <FaClock className="mr-3 flex-shrink-0" style={{ color: '#ff9800' }} />
                  <div>
                    <p className="font-medium">Time</p>
                    <p className="text-sm">
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
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-700">
                  <FaMapMarkerAlt className="mr-3 flex-shrink-0" style={{ color: '#ff9800' }} />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm">{shift.location}</p>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-700 md:col-span-2">
                  <FaUsers className="mr-3 flex-shrink-0" style={{ color: '#ff9800' }} />
                  <div>
                    <p className="font-medium">Capacity</p>
                    <p className="text-sm text-red-600 font-semibold">
                      All {shift.slots} spots have been filled
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6 text-lg">
              Unfortunately, all volunteer spots for this shift have been filled. Please check back later or contact the organization for more information about future opportunities.
            </p>
            
            <button
              onClick={() => window.location.href = '/'}
              className="px-8 py-3 text-white font-semibold rounded-lg text-lg transition focus:outline-none focus:ring-2 focus:ring-orange-300"
              style={{ backgroundColor: '#ff9800' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e68900'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ff9800'}
            >
              Go to Home Page
            </button>
          </div>
        )}

        {/* Combined Shift Details and Signup Form */}
        {shift && shift.availableSlots > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Shift Details Header */}
            <div className="border-b border-gray-200 pb-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">{shift.name}</h2>
              <p className="font-medium text-lg mb-1" style={{ color: '#ff9800' }}>{shift.categoryName}</p>
              <p className="text-gray-600 mb-4">{shift.organizationName}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center text-gray-700">
                  <FaClock className="mr-3 flex-shrink-0" style={{ color: '#ff9800' }} />
                  <div>
                    <p className="font-medium">Time</p>
                    <p className="text-sm">
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
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-700">
                  <FaMapMarkerAlt className="mr-3 flex-shrink-0" style={{ color: '#ff9800' }} />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm">{shift.location}</p>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-700 md:col-span-2">
                  <FaUsers className="mr-3 flex-shrink-0" style={{ color: '#ff9800' }} />
                  <div>
                    <p className="font-medium">Available Spots</p>
                    <p className="text-sm">
                      {shift.availableSlots} of {shift.slots} spots remaining
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h3>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                                     className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                     formErrors.email ? 'border-red-500' : 'border-gray-300'
                   }`}
                   onFocus={(e) => e.target.style.borderColor = '#ff9800'}
                   onBlur={(e) => e.target.style.borderColor = formErrors.email ? '#ef4444' : '#d1d5db'}
                  placeholder="Enter your email address"
                  disabled={submitting}
                />
                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                      formErrors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    onFocus={(e) => e.target.style.borderColor = '#ff9800'}
                    onBlur={(e) => e.target.style.borderColor = formErrors.firstName ? '#ef4444' : '#d1d5db'}
                    placeholder="Enter your first name"
                    disabled={submitting}
                  />
                  {formErrors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.firstName}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                      formErrors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    onFocus={(e) => e.target.style.borderColor = '#ff9800'}
                    onBlur={(e) => e.target.style.borderColor = formErrors.lastName ? '#ef4444' : '#d1d5db'}
                    placeholder="Enter your last name"
                    disabled={submitting}
                  />
                  {formErrors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.lastName}</p>
                  )}
                                 </div>
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Shift Date
                 </label>
                 <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                   <p className="text-gray-900 font-medium" style={{ color: '#ff9800' }}>
                     📅 {formData.selectedDate ? formatHalifaxDateString(formData.selectedDate) : 'No date selected'}
                   </p>
                 </div>
                 <input
                   type="hidden"
                   value={formData.selectedDate}
                   name="selectedDate"
                 />
               </div>
               

              
              <button
                type="submit"
                disabled={submitting}
                className="w-full text-white py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition"
                style={{ backgroundColor: '#ff9800' }}
                onMouseOver={(e) => !submitting && (e.currentTarget.style.backgroundColor = '#e68900')}
                onMouseOut={(e) => !submitting && (e.currentTarget.style.backgroundColor = '#ff9800')}
              >
                {submitting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Signing Up...
                  </>
                ) : (
                  'Sign Up for Shift'
                )}
              </button>
            </form>
                     </div>
         )}


       </div>
     </div>
   );
 } 