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
  FaExclamationTriangle
} from "react-icons/fa";
import { toast } from 'react-toastify';

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
  const [saving, setSaving] = useState(false);

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
  };

  const handleEditChange = (field: keyof User, value: string | boolean) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");

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

  const hasAdditionalDetails = (user: User) => {
    return !!(user.address);
  };

  const shouldShowAdditionalSection = (user: User) => {
    return hasAdditionalDetails(user) || isEditing;
  };

  const handleBack = () => {
    router.push('/manage-users');
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
                <h1 className="text-3xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
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
                  <input
                    type="tel"
                    value={editData.phone || ''}
                    onChange={(e) => handleEditChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
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
              </div>
            </div>

            {/* Additional Information */}
            {shouldShowAdditionalSection(user) && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-black border-b border-orange-200 pb-2">
                    Additional Information
                  </h3>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-4">
                    {/* Address */}
                    {(user.address || isEditing) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.address || ''}
                            onChange={(e) => handleEditChange('address', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Enter address"
                          />
                        ) : (
                          <p className="text-black">{user.address || 'Not provided'}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}