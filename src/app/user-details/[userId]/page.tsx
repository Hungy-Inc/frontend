"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  FaEdit, 
  FaTrash, 
  FaSave, 
  FaTimes, 
  FaCheck, 
  FaBan, 
  FaUndo,
  FaFileAlt,
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaShieldAlt,
  FaCalendar,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaExternalLinkAlt
} from "react-icons/fa";
import { ImSpinner2 } from "react-icons/im";
import { toast } from 'react-toastify';

interface CustomField {
  id: number;
  fieldDefinitionId: number;
  name: string;
  label: string;
  description?: string;
  fieldType: string;
  isRequired: boolean;
  value: any;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string;
  status?: 'PENDING' | 'APPROVED' | 'DENIED';
  createdAt?: string;
  approvedAt?: string;
  approvedBy?: number;
  approvedByName?: string;
  deniedAt?: string;
  deniedBy?: number;
  deniedByName?: string;
  denialReason?: string;
  address?: string;
  organizationName?: string;
  customFields?: CustomField[];
  age?: number | null;
  isUnder16?: boolean;
}

const roles = ["VOLUNTEER", "STAFF", "ADMIN"];

const statusColors = {
  PENDING: "bg-orange-100 text-orange-800",
  APPROVED: "bg-orange-100 text-orange-800", 
  DENIED: "bg-orange-100 text-orange-800"
};

const statusIcons = {
  PENDING: <FaClock className="w-4 h-4" />,
  APPROVED: <FaCheckCircle className="w-4 h-4" />,
  DENIED: <FaTimesCircle className="w-4 h-4" />
};

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<User>>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'VOLUNTEER',
    phone: '',
    address: ''
  });
  const [editCustomFields, setEditCustomFields] = useState<Record<number, any>>({});
  const [saving, setSaving] = useState(false);
  const [extraHoursRecords, setExtraHoursRecords] = useState<{ id: number; hours: number; reason: string | null; recordDate: string }[]>([]);
  const [extraHoursLoading, setExtraHoursLoading] = useState(false);
  const [extraHoursMonth, setExtraHoursMonth] = useState(0);
  const [extraHoursYear, setExtraHoursYear] = useState(new Date().getFullYear());
  const [showAddExtraHours, setShowAddExtraHours] = useState(false);
  const [addExtraHoursForm, setAddExtraHoursForm] = useState({ hours: '', recordDate: new Date().toISOString().split('T')[0], reason: '' });
  const [addingExtraHours, setAddingExtraHours] = useState(false);
  const [extraHoursEligibleShifts, setExtraHoursEligibleShifts] = useState<{ shiftId: number; recurringShiftId: number | null; name: string; startTime: string; endTime: string }[]>([]);
  const [extraHoursEligibleShiftsLoading, setExtraHoursEligibleShiftsLoading] = useState(false);
  const [extraHoursSelectedShift, setExtraHoursSelectedShift] = useState<{ shiftId: number; recurringShiftId: number | null; name: string } | null>(null);

  // Approve/deny and document view state
  const [approveLoading, setApproveLoading] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [userAgreements, setUserAgreements] = useState<Array<{
    id: number;
    documentUrl: string;
    signature: string;
    acceptedAt: string;
    termsTitle?: string;
    termsVersion?: string;
  }>>([]);
  const [loadingAgreements, setLoadingAgreements] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Fetch user details
  const fetchUserDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch user details");
      const data = await response.json();
      setUser(data);
      setEditData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        role: data.role || 'VOLUNTEER',
        phone: data.phone || '',
        address: data.address || ''
      });
      // Initialize custom field edits
      const customFieldsMap: Record<number, any> = {};
      if (data.customFields) {
        data.customFields.forEach((field: CustomField) => {
          customFieldsMap[field.fieldDefinitionId] = field.value;
        });
      }
      setEditCustomFields(customFieldsMap);
    } catch (err) {
      setError("Failed to load user details.");
      toast.error("Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchExtraHours = async () => {
    if (!userId) return;
    setExtraHoursLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = `${apiUrl}/api/extra-hours?userId=${userId}&month=${extraHoursMonth}&year=${extraHoursYear}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setExtraHoursRecords(Array.isArray(data) ? data : []);
      } else {
        setExtraHoursRecords([]);
      }
    } catch {
      setExtraHoursRecords([]);
    } finally {
      setExtraHoursLoading(false);
    }
  };

  useEffect(() => {
    fetchExtraHours();
  }, [userId, extraHoursMonth, extraHoursYear]);

  // Fetch eligible shifts for Add extra hours when popup is open (user registered + checked in on recordDate)
  useEffect(() => {
    if (!showAddExtraHours || !userId || !addExtraHoursForm.recordDate) {
      setExtraHoursEligibleShifts([]);
      setExtraHoursSelectedShift(null);
      return;
    }
    let cancelled = false;
    setExtraHoursEligibleShiftsLoading(true);
    setExtraHoursSelectedShift(null);
    const token = localStorage.getItem('token');
    fetch(`${apiUrl}/api/extra-hours/eligible-shifts?userId=${userId}&date=${addExtraHoursForm.recordDate}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then((data: any[]) => {
        if (!cancelled) setExtraHoursEligibleShifts(Array.isArray(data) ? data : []);
      })
      .catch(() => { if (!cancelled) setExtraHoursEligibleShifts([]); })
      .finally(() => { if (!cancelled) setExtraHoursEligibleShiftsLoading(false); });
    return () => { cancelled = true; };
  }, [showAddExtraHours, userId, addExtraHoursForm.recordDate]);

  const handleAddExtraHours = async () => {
    if (!extraHoursSelectedShift) {
      toast.error('Please select a shift (user must be registered and checked in on the selected date).');
      return;
    }
    const h = parseFloat(addExtraHoursForm.hours);
    if (isNaN(h) || h < 0) {
      toast.error('Please enter a valid number of hours.');
      return;
    }
    setAddingExtraHours(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/extra-hours`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          userId: parseInt(userId),
          hours: h,
          recordDate: addExtraHoursForm.recordDate,
          reason: addExtraHoursForm.reason || undefined,
          shiftId: extraHoursSelectedShift.shiftId,
          recurringShiftId: extraHoursSelectedShift.recurringShiftId ?? undefined
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to add extra hours');
      }
      toast.success('Extra hours added.');
      setShowAddExtraHours(false);
      setAddExtraHoursForm({ hours: '', recordDate: new Date().toISOString().split('T')[0], reason: '' });
      setExtraHoursSelectedShift(null);
      fetchExtraHours();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add extra hours');
    } finally {
      setAddingExtraHours(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to delete user");
      
      toast.success("User deleted successfully!");
      router.push('/manage-users');
    } catch (err) {
      toast.error("Failed to delete user. Please try again.");
    }
  };

  const startEdit = () => {
    if (!user) return;
    setIsEditing(true);
    setEditData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || 'VOLUNTEER',
      phone: user.phone || '',
      address: user.address || ''
    });
    // Initialize custom field edits
    const customFieldsMap: Record<number, any> = {};
    if (user.customFields) {
      user.customFields.forEach((field: CustomField) => {
        customFieldsMap[field.fieldDefinitionId] = field.value;
      });
    }
    setEditCustomFields(customFieldsMap);
  };

  const cancelEdit = () => {
    if (!user) return;
    setIsEditing(false);
    setEditData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || 'VOLUNTEER',
      phone: user.phone || '',
      address: user.address || ''
    });
    // Reset custom field edits
    const customFieldsMap: Record<number, any> = {};
    if (user.customFields) {
      user.customFields.forEach((field: CustomField) => {
        customFieldsMap[field.fieldDefinitionId] = field.value;
      });
    }
    setEditCustomFields(customFieldsMap);
  };

  const handleEditChange = (field: keyof User, value: string | boolean) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomFieldChange = (fieldDefinitionId: number, value: any) => {
    setEditCustomFields(prev => ({ ...prev, [fieldDefinitionId]: value }));
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");

      // Validate phone number if provided
      if (editData.phone && editData.phone.length !== 10) {
        toast.error("Phone number must be of 10 digits");
        setSaving(false);
        return;
      }
      // Validate duplicate email (only if email changed)
      if (editData.email && editData.email !== user?.email) {
        const emailCheckResponse = await fetch(`${apiUrl}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (emailCheckResponse.ok) {
          const allUsers = await emailCheckResponse.json();
          const newEmail = editData.email as string;
          const emailExists = allUsers.some((u: any) => u.email.toLowerCase() === newEmail.toLowerCase() && u.id !== user?.id);
          if (emailExists) {
            toast.error("This email is already in use by another user");
            setSaving(false);
            return;
          }
        }
      }

      const updateData = {
        firstName: editData.firstName || '',
        lastName: editData.lastName || '',
        email: editData.email || '',
        phone: editData.phone || null,
        role: editData.role || 'VOLUNTEER',
        address: editData.address || null,
      };

      const response = await fetch(`${apiUrl}/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) throw new Error("Failed to update user");
      
      // Save custom fields (only filtered ones, excluding basic info fields)
      if (user) {
        const filteredFields = getFilteredCustomFields(user);
        if (filteredFields.length > 0) {
          for (const field of filteredFields) {
            if (editCustomFields[field.fieldDefinitionId] !== undefined) {
              await fetch(`${apiUrl}/api/user-field-values`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  userId: parseInt(userId),
                  fieldDefinitionId: field.fieldDefinitionId,
                  value: editCustomFields[field.fieldDefinitionId]
                }),
              });
            }
          }
        }
      }
      
      await fetchUserDetails();
      setIsEditing(false);
      toast.success("User updated successfully!");
    } catch (err) {
      toast.error("Failed to update user. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not available';
    try {
      return new Date(dateString).toLocaleDateString('en-CA', {
        timeZone: 'America/Halifax'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const renderFieldValue = (field: CustomField) => {
    if (field.value === null || field.value === undefined) {
      return <p className="text-gray-400 italic">Not provided</p>;
    }

    switch (field.fieldType) {
      case 'BOOLEAN':
        return <p className="text-black">{field.value ? 'Yes' : 'No'}</p>;
      case 'DATE':
        try {
          return <p className="text-black">{new Date(field.value).toLocaleDateString('en-CA')}</p>;
        } catch {
          return <p className="text-black">{field.value}</p>;
        }
      case 'DATETIME':
        try {
          return <p className="text-black">{new Date(field.value).toLocaleString('en-CA')}</p>;
        } catch {
          return <p className="text-black">{field.value}</p>;
        }
      case 'MULTISELECT':
        // Handle array values
        if (Array.isArray(field.value)) {
          return (
            <div className="flex flex-wrap gap-2">
              {field.value.map((item: string, idx: number) => (
                <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  {item}
                </span>
              ))}
            </div>
          );
        }
        // Handle string values that might be JSON arrays
        if (typeof field.value === 'string') {
          try {
            // Try to parse as JSON (handles cases like "[\\"Tuesday\\",\\"Wednesday\\"]")
            const parsed = JSON.parse(field.value);
            if (Array.isArray(parsed)) {
              return (
                <div className="flex flex-wrap gap-2">
                  {parsed.map((item: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {item}
                    </span>
                  ))}
                </div>
              );
            }
          } catch {
            // If parsing fails, treat as single value
            return (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                {field.value}
              </span>
            );
          }
        }
        // Fallback for other types
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            {String(field.value)}
          </span>
        );
      case 'TEXTAREA':
        return <p className="text-black whitespace-pre-wrap">{field.value}</p>;
      default:
        return <p className="text-black">{String(field.value)}</p>;
    }
  };

  const isBasicInfoField = (fieldName: string): boolean => {
    const normalizedName = fieldName.toLowerCase().replace(/[\s_-]/g, '');
    const basicFields = ['firstname', 'lastname', 'email', 'phone', 'role'];
    return basicFields.includes(normalizedName);
  };

  const getFilteredCustomFields = (user: User) => {
    if (!user.customFields) return [];
    return user.customFields.filter(
      field => !isBasicInfoField(field.name)
    );
  };

  const hasCustomFields = (user: User) => {
    return getFilteredCustomFields(user).length > 0;
  };

  const handleBack = () => {
    router.push('/manage-users');
  };

  const approveUser = async () => {
    if (approveLoading || !userId) return;
    setApproveLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/users/${userId}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to approve user");
      await fetchUserDetails();
      toast.success("User approved successfully!");
    } catch (err) {
      toast.error("Failed to approve user. Please try again.");
    } finally {
      setApproveLoading(false);
    }
  };

  const denyUser = async () => {
    const reason = prompt("Please enter a reason for denial:");
    if (!reason) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/users/${userId}/deny`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error("Failed to deny user");
      await fetchUserDetails();
      toast.success("User denied successfully!");
    } catch (err) {
      toast.error("Failed to deny user. Please try again.");
    }
  };

  const resetUserStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/users/${userId}/reset`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to reset user status");
      await fetchUserDetails();
      toast.success("User status reset successfully!");
    } catch (err) {
      toast.error("Failed to reset user status. Please try again.");
    }
  };

  const viewUserAgreement = async () => {
    if (!userId) return;
    try {
      setLoadingAgreements(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/users/${userId}/agreement`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("No license agreement found for this user");
        } else {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.error || "Failed to fetch user agreements");
        }
        setLoadingAgreements(false);
        return;
      }
      const data = await response.json();
      if (data.agreements && Array.isArray(data.agreements)) {
        if (data.agreements.length === 0) {
          toast.error("No agreement documents available for this user");
          setLoadingAgreements(false);
          return;
        }
        if (data.agreements.length === 1) {
          window.open(data.agreements[0].documentUrl, '_blank');
          setLoadingAgreements(false);
          return;
        }
        setUserAgreements(data.agreements);
        setShowDocumentModal(true);
      } else if (data.documentUrl) {
        window.open(data.documentUrl, '_blank');
      } else {
        toast.error("No agreement document available for this user");
      }
      setLoadingAgreements(false);
    } catch (err) {
      toast.error("Failed to fetch user agreements");
      setLoadingAgreements(false);
    }
  };

  const openDocument = (documentUrl: string) => {
    window.open(documentUrl, '_blank');
  };

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-CA', {
        timeZone: 'America/Halifax',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || "User not found"}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 mx-auto"
          >
            <FaArrowLeft />
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center text-orange-600 hover:text-orange-700 mb-4"
          >
            <FaArrowLeft className="mr-2" />
            Back to Users
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-orange-100 rounded-full p-3 mr-4">
                <FaUser className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <div className="flex items-center flex-wrap gap-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h1>
                  {user.isUnder16 && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-amber-500 text-amber-950 border border-amber-600" title={user.age != null ? `Age: ${user.age}` : 'Under 16'}>
                      Under 16
                    </span>
                  )}
                </div>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              {!isEditing ? (
                <>
                  <button
                    onClick={startEdit}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
                  >
                    <FaEdit />
                    Edit User
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
                  >
                    <FaTrash />
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
                  >
                    <FaTimes />
                    Cancel
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <FaSave />
                    )}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column: Under 16 notice + Basic Information */}
          <div className="space-y-6">
            {user.isUnder16 && (
              <div className="bg-amber-50 border border-amber-400 rounded-lg px-6 py-4 shadow-sm">
                <p className="text-amber-900 font-medium">This account holder is under 16.</p>
              </div>
            )}
            {/* Basic Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-black">Basic Information</h3>
              </div>
              <div className="px-6 py-4 space-y-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.firstName || ''}
                    onChange={(e) => handleEditChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter first name"
                  />
                ) : (
                  <p className="text-black">{user.firstName || 'Not provided'}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.lastName || ''}
                    onChange={(e) => handleEditChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter last name"
                  />
                ) : (
                  <p className="text-black">{user.lastName || 'Not provided'}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editData.email || ''}
                    onChange={(e) => handleEditChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter email"
                  />
                ) : (
                  <p className="text-black">{user.email || 'Not provided'}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                {isEditing ? (
                  <>
                    <input
                      type="tel"
                      value={editData.phone || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        handleEditChange('phone', value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Enter 10-digit phone number"
                      maxLength={10}
                    />
                    {editData.phone && editData.phone.length !== 10 && (
                      <p className="text-red-500 text-xs mt-1">Phone number must be of 10 digits</p>
                    )}
                  </>
                ) : (
                  <p className="text-black">{user.phone || 'Not provided'}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                {isEditing ? (
                  <select
                    value={editData.role || 'VOLUNTEER'}
                    onChange={(e) => handleEditChange('role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-black">{user.role || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>
          </div>

          {/* Status & Additional Information */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-black">Status</h3>
              </div>
              <div className="px-6 py-4">
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[user.status || 'PENDING']}`}>
                    {statusIcons[user.status || 'PENDING']}
                    <span className="ml-1">{user.status || 'PENDING'}</span>
                  </span>
                </div>
                {user.approvedAt && (
                  <p className="text-sm text-gray-600 mt-2">
                    Approved on {formatDate(user.approvedAt)}
                  </p>
                )}
                {user.deniedAt && (
                  <p className="text-sm text-gray-600 mt-2">
                    Denied on {formatDate(user.deniedAt)}
                    {user.denialReason && (
                      <span className="block text-red-600">Reason: {user.denialReason}</span>
                    )}
                  </p>
                )}
                {!isEditing && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-3">Actions</p>
                    <div className="flex flex-wrap gap-2">
                      {user.status === 'PENDING' && (
                        <>
                          <button
                            onClick={approveUser}
                            disabled={approveLoading}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                          >
                            {approveLoading ? (
                              <ImSpinner2 className="animate-spin w-4 h-4" />
                            ) : (
                              <FaCheck className="w-4 h-4" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={denyUser}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                          >
                            <FaBan className="w-4 h-4" />
                            Deny
                          </button>
                        </>
                      )}
                      {(user.status === 'APPROVED' || user.status === 'DENIED') && (
                        <button
                          onClick={resetUserStatus}
                          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2"
                        >
                          <FaUndo className="w-4 h-4" />
                          Reset Status
                        </button>
                      )}
                      <button
                        onClick={viewUserAgreement}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                      >
                        <FaFileAlt className="w-4 h-4" />
                        View Agreement
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Custom Fields */}
        {hasCustomFields(user) && (
          <div className="bg-white shadow rounded-lg mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-black">Additional Information</h3>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {getFilteredCustomFields(user).map((field) => {
                  const currentValue = editCustomFields[field.fieldDefinitionId] !== undefined 
                    ? editCustomFields[field.fieldDefinitionId] 
                    : field.value;
                  
                  return (
                    <div key={field.fieldDefinitionId}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                        {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {isEditing ? (
                        <div>
                          {field.fieldType === 'TEXTAREA' ? (
                            <textarea
                              value={currentValue || ''}
                              onChange={(e) => handleCustomFieldChange(field.fieldDefinitionId, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                              rows={3}
                            />
                          ) : field.fieldType === 'BOOLEAN' ? (
                            <select
                              value={currentValue ? 'true' : 'false'}
                              onChange={(e) => handleCustomFieldChange(field.fieldDefinitionId, e.target.value === 'true')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            >
                              <option value="false">No</option>
                              <option value="true">Yes</option>
                            </select>
                          ) : field.fieldType === 'SELECT' ? (
                            <select
                              value={currentValue || ''}
                              onChange={(e) => handleCustomFieldChange(field.fieldDefinitionId, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            >
                              <option value="">Select an option</option>
                              {/* Options would come from field definition */}
                            </select>
                          ) : field.fieldType === 'DATE' ? (
                            <input
                              type="date"
                              value={currentValue ? new Date(currentValue).toISOString().split('T')[0] : ''}
                              onChange={(e) => handleCustomFieldChange(field.fieldDefinitionId, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                          ) : (
                            <input
                              type={field.fieldType === 'EMAIL' ? 'email' : field.fieldType === 'PHONE' ? 'tel' : field.fieldType === 'NUMBER' ? 'number' : 'text'}
                              value={currentValue || ''}
                              onChange={(e) => handleCustomFieldChange(field.fieldDefinitionId, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                            />
                          )}
                        </div>
                      ) : (
                        renderFieldValue(field)
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Extra Hours (by month/year) */}
        <div className="bg-white shadow rounded-lg mt-6">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-lg font-medium text-black">Extra Hours</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddExtraHours(true)}
                className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
              >
                Add extra hours
              </button>
              <select
                value={extraHoursMonth}
                onChange={(e) => setExtraHoursMonth(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value={0}>All months</option>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                  <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
              <select
                value={extraHoursYear}
                onChange={(e) => setExtraHoursYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="px-6 py-4">
            {extraHoursLoading ? (
              <p className="text-gray-500">Loading...</p>
            ) : extraHoursRecords.length === 0 ? (
              <p className="text-gray-500">No extra hours recorded for this period.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-600">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Hours</th>
                    <th className="py-2">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {extraHoursRecords.map((r: any) => (
                    <tr key={r.id} className="border-b border-gray-100">
                      <td className="py-2 pr-4 text-black">{formatDate(r.recordDate)}</td>
                      <td className="py-2 pr-4 text-black">{Number(r.hours).toFixed(2)}</td>
                      <td className="py-2 text-gray-600">{r.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="text-gray-500 text-xs mt-2">Total: {extraHoursRecords.reduce((s, r) => s + Number(r.hours), 0).toFixed(2)} hours this period.</p>

            {showAddExtraHours && (
              <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h4 className="font-medium text-black mb-3">Add extra hours</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={addExtraHoursForm.recordDate}
                      onChange={(e) => {
                        setAddExtraHoursForm(prev => ({ ...prev, recordDate: e.target.value }));
                        setExtraHoursSelectedShift(null);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Hours</label>
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      value={addExtraHoursForm.hours}
                      onChange={(e) => setAddExtraHoursForm(prev => ({ ...prev, hours: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="e.g. 1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Reason (optional)</label>
                    <input
                      type="text"
                      value={addExtraHoursForm.reason}
                      onChange={(e) => setAddExtraHoursForm(prev => ({ ...prev, reason: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="e.g. Snow day"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shift (registered & checked in on this date)</label>
                  {extraHoursEligibleShiftsLoading ? (
                    <p className="text-sm text-gray-500">Loading shifts...</p>
                  ) : extraHoursEligibleShifts.length === 0 ? (
                    <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">No shifts found. User must be registered and checked in for a shift on the selected date.</p>
                  ) : (
                    <select
                      value={extraHoursSelectedShift ? extraHoursSelectedShift.shiftId : ''}
                      onChange={(e) => {
                        const id = parseInt(e.target.value, 10);
                        const shift = extraHoursEligibleShifts.find(s => s.shiftId === id);
                        setExtraHoursSelectedShift(shift ? { shiftId: shift.shiftId, recurringShiftId: shift.recurringShiftId, name: shift.name } : null);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      required
                    >
                      <option value="">Select shift</option>
                      {extraHoursEligibleShifts.map(s => {
                        const start = new Date(s.startTime).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' });
                        const end = new Date(s.endTime).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' });
                        return (
                          <option key={s.shiftId} value={s.shiftId}>
                            {s.name} ({start} – {end})
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddExtraHours(false)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddExtraHours}
                    disabled={addingExtraHours || !extraHoursSelectedShift || extraHoursEligibleShifts.length === 0}
                    className="px-3 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50"
                  >
                    {addingExtraHours ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Document Modal */}
        {showDocumentModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    License Agreements for {user?.firstName} {user?.lastName}
                  </h3>
                  <button
                    onClick={() => {
                      setShowDocumentModal(false);
                      setUserAgreements([]);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
                {loadingAgreements ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  </div>
                ) : userAgreements.length === 0 ? (
                  <div className="text-center py-8">
                    <FaFileAlt className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No agreement documents found</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {userAgreements.map((agreement, index) => (
                      <div
                        key={agreement.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <FaFileAlt className="text-purple-600" />
                              <h4 className="text-sm font-medium text-gray-900">
                                {agreement.termsTitle || `Agreement ${index + 1}`}
                                {agreement.termsVersion && (
                                  <span className="text-gray-500 ml-2">(v{agreement.termsVersion})</span>
                                )}
                              </h4>
                            </div>
                            <div className="text-xs text-gray-500 space-y-1">
                              <p>Signed: {formatDateTime(agreement.acceptedAt)}</p>
                              {agreement.signature && (
                                <p className="font-mono text-gray-400">Signature: {agreement.signature.substring(0, 20)}...</p>
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            <button
                              onClick={() => openDocument(agreement.documentUrl)}
                              className="px-3 py-2 text-sm text-white rounded-lg flex items-center gap-2 hover:opacity-90 transition bg-orange-500 hover:bg-orange-600"
                            >
                              <FaExternalLinkAlt />
                              Open
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => {
                      setShowDocumentModal(false);
                      setUserAgreements([]);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}