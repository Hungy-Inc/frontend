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
  // Additional user profile fields
  ageBracket?: string;
  birthdate?: string;
  pronouns?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  homePhone?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  communicationPreferences?: string;
  profilePictureUrl?: string;
  allergies?: string;
  medicalConcerns?: string;
  preferredDays?: string;
  preferredShifts?: string;
  frequency?: string;
  preferredPrograms?: string;
  canCallIfShortHanded?: boolean;
  schoolWorkCommitment?: string;
  requiredHours?: string;
  howDidYouHear?: string;
  startDate?: string;
  parentGuardianName?: string;
  parentGuardianEmail?: string;
  registrationType?: string;
}

const roles = ["VOLUNTEER", "STAFF", "ADMIN"];

// Enum options for dropdowns
const ageBrackets = [
  { value: "UNDER_16", label: "Under 16" },
  { value: "AGE_16_29", label: "16-29" },
  { value: "AGE_30_39", label: "30-39" },
  { value: "AGE_40_49", label: "40-49" },
  { value: "AGE_50_59", label: "50-59" },
  { value: "AGE_60_69", label: "60-69" },
  { value: "AGE_70_PLUS", label: "70+" }
];

const pronounsOptions = [
  { value: "HE_HIM", label: "He/Him" },
  { value: "SHE_HER", label: "She/Her" },
  { value: "THEY_THEM", label: "They/Them" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" }
];

const communicationPreferences = [
  { value: "EMAIL", label: "Email" },
  { value: "SMS", label: "SMS" },
  { value: "APP_NOTIFICATION", label: "App Notification" }
];

const frequencyOptions = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "BI_WEEKLY", label: "Bi-weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "DAILY", label: "Daily" },
  { value: "ONCE", label: "Once" },
  { value: "WHEN_TIME_PERMITS", label: "When time permits" }
];

const howDidYouHearOptions = [
  { value: "FAMILY_FRIENDS", label: "Family/Friends" },
  { value: "GOOGLE", label: "Google" },
  { value: "SOCIAL_MEDIA", label: "Social Media" },
  { value: "CONNECT_FREDERICTON", label: "Connect Fredericton" },
  { value: "SCHOOL", label: "School" },
  { value: "WORK", label: "Work" },
  { value: "NOTICE_BOARDS", label: "Notice Boards" },
  { value: "EVENTS", label: "Events" }
];

const registrationTypes = [
  { value: "ADULT", label: "Adult" },
  { value: "MINOR", label: "Minor" }
];

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
    ageBracket: '',
    birthdate: '',
    pronouns: '',
    address: '',
    city: '',
    postalCode: '',
    homePhone: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    communicationPreferences: '',
    allergies: '',
    medicalConcerns: '',
    preferredDays: '',
    preferredShifts: '',
    frequency: '',
    preferredPrograms: '',
    canCallIfShortHanded: false,
    schoolWorkCommitment: '',
    requiredHours: '',
    howDidYouHear: '',
    startDate: '',
    parentGuardianName: '',
    parentGuardianEmail: '',
    registrationType: 'ADULT'
  });
  const [saving, setSaving] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Fetch user details
  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError("");
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
        ageBracket: data.ageBracket || '',
        birthdate: data.birthdate || '',
        pronouns: data.pronouns || '',
        address: data.address || '',
        city: data.city || '',
        postalCode: data.postalCode || '',
        homePhone: data.homePhone || '',
        emergencyContactName: data.emergencyContactName || '',
        emergencyContactNumber: data.emergencyContactNumber || '',
        communicationPreferences: data.communicationPreferences || '',
        allergies: data.allergies || '',
        medicalConcerns: data.medicalConcerns || '',
        preferredDays: data.preferredDays || '',
        preferredShifts: data.preferredShifts || '',
        frequency: data.frequency || '',
        preferredPrograms: data.preferredPrograms || '',
        canCallIfShortHanded: data.canCallIfShortHanded || false,
        schoolWorkCommitment: data.schoolWorkCommitment || '',
        requiredHours: data.requiredHours || '',
        howDidYouHear: data.howDidYouHear || '',
        startDate: data.startDate || '',
        parentGuardianName: data.parentGuardianName || '',
        parentGuardianEmail: data.parentGuardianEmail || '',
        registrationType: data.registrationType || 'ADULT'
      });
    } catch (err) {
      setError("Failed to load user details.");
      toast.error("Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  // User approval/denial functions
  const approveUser = async () => {
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
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ reason })
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
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/users/${userId}/agreement`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("No license agreement found for this user");
        } else {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.error || "Failed to fetch user agreement");
        }
        return;
      }
      
      const data = await response.json();
      
      if (data.documentUrl) {
        window.open(data.documentUrl, '_blank');
      } else {
        toast.error("No agreement document available for this user");
      }
    } catch (err) {
      toast.error("Failed to open user agreement");
    }
  };

  const deleteUser = async () => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    
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
      ageBracket: user.ageBracket || '',
      birthdate: user.birthdate || '',
      pronouns: user.pronouns || '',
      address: user.address || '',
      city: user.city || '',
      postalCode: user.postalCode || '',
      homePhone: user.homePhone || '',
      emergencyContactName: user.emergencyContactName || '',
      emergencyContactNumber: user.emergencyContactNumber || '',
      communicationPreferences: user.communicationPreferences || '',
      allergies: user.allergies || '',
      medicalConcerns: user.medicalConcerns || '',
      preferredDays: user.preferredDays || '',
      preferredShifts: user.preferredShifts || '',
      frequency: user.frequency || '',
      preferredPrograms: user.preferredPrograms || '',
      canCallIfShortHanded: user.canCallIfShortHanded || false,
      schoolWorkCommitment: user.schoolWorkCommitment || '',
      requiredHours: user.requiredHours || '',
      howDidYouHear: user.howDidYouHear || '',
      startDate: user.startDate || '',
      parentGuardianName: user.parentGuardianName || '',
      parentGuardianEmail: user.parentGuardianEmail || '',
      registrationType: user.registrationType || 'ADULT'
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
      ageBracket: user.ageBracket || '',
      birthdate: user.birthdate || '',
      pronouns: user.pronouns || '',
      address: user.address || '',
      city: user.city || '',
      postalCode: user.postalCode || '',
      homePhone: user.homePhone || '',
      emergencyContactName: user.emergencyContactName || '',
      emergencyContactNumber: user.emergencyContactNumber || '',
      communicationPreferences: user.communicationPreferences || '',
      allergies: user.allergies || '',
      medicalConcerns: user.medicalConcerns || '',
      preferredDays: user.preferredDays || '',
      preferredShifts: user.preferredShifts || '',
      frequency: user.frequency || '',
      preferredPrograms: user.preferredPrograms || '',
      canCallIfShortHanded: user.canCallIfShortHanded || false,
      schoolWorkCommitment: user.schoolWorkCommitment || '',
      requiredHours: user.requiredHours || '',
      howDidYouHear: user.howDidYouHear || '',
      startDate: user.startDate || '',
      parentGuardianName: user.parentGuardianName || '',
      parentGuardianEmail: user.parentGuardianEmail || '',
      registrationType: user.registrationType || 'ADULT'
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
        ageBracket: editData.ageBracket || null,
        birthdate: editData.birthdate || null,
        pronouns: editData.pronouns || null,
        address: editData.address || null,
        city: editData.city || null,
        postalCode: editData.postalCode || null,
        homePhone: editData.homePhone || null,
        emergencyContactName: editData.emergencyContactName || null,
        emergencyContactNumber: editData.emergencyContactNumber || null,
        communicationPreferences: editData.communicationPreferences || null,
        allergies: editData.allergies || null,
        medicalConcerns: editData.medicalConcerns || null,
        preferredDays: editData.preferredDays || null,
        preferredShifts: editData.preferredShifts || null,
        frequency: editData.frequency || null,
        preferredPrograms: editData.preferredPrograms || null,
        canCallIfShortHanded: editData.canCallIfShortHanded !== undefined ? editData.canCallIfShortHanded : null,
        schoolWorkCommitment: editData.schoolWorkCommitment || null,
        requiredHours: editData.requiredHours || null,
        howDidYouHear: editData.howDidYouHear || null,
        startDate: editData.startDate || null,
        parentGuardianName: editData.parentGuardianName || null,
        parentGuardianEmail: editData.parentGuardianEmail || null,
        registrationType: editData.registrationType || 'ADULT',
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
    return !!(
      user.ageBracket ||
      user.birthdate ||
      user.pronouns ||
      user.address ||
      user.city ||
      user.postalCode ||
      user.homePhone ||
      user.emergencyContactName ||
      user.emergencyContactNumber ||
      user.communicationPreferences ||
      user.profilePictureUrl ||
      user.allergies ||
      user.medicalConcerns ||
      user.preferredDays ||
      user.preferredShifts ||
      user.frequency ||
      user.preferredPrograms ||
      user.canCallIfShortHanded !== undefined ||
      user.schoolWorkCommitment ||
      user.requiredHours ||
      user.howDidYouHear ||
      user.startDate ||
      user.parentGuardianName ||
      user.parentGuardianEmail ||
      user.registrationType
    );
  };

  const shouldShowAdditionalSection = (user: User) => {
    return hasAdditionalDetails(user) || isEditing;
  };

  const handleBack = () => {
    router.push('/manage-users');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-black">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-black mb-4">{error || "User not found"}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            <FaArrowLeft className="inline mr-2" />
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 text-orange-600 hover:text-orange-800 rounded-lg hover:bg-orange-100"
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-black">User Details</h1>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {user.status === 'PENDING' && (
                <>
                  <button
                    onClick={approveUser}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
                  >
                    <FaCheck />
                    Approve User
                  </button>
                  <button
                    onClick={denyUser}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
                  >
                    <FaBan />
                    Reject User
                  </button>
                </>
              )}
              {(user.status === 'APPROVED' || user.status === 'DENIED') && (
                <button
                  onClick={resetUserStatus}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
                >
                  <FaUndo />
                  Reset Status
                </button>
              )}
              <button
                onClick={viewUserAgreement}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
              >
                <FaFileAlt />
                View Agreement
              </button>
              <button
                onClick={deleteUser}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
              >
                <FaTrash />
                Delete User
              </button>
            </div>
          </div>
        </div>

        {/* User Status Banner */}
        {user.status && (
          <div className={`mb-6 p-4 rounded-lg ${statusColors[user.status]} flex items-center gap-2`}>
            {statusIcons[user.status]}
            <span className="font-medium">
              Status: {user.status}
              {user.status === 'APPROVED' && user.approvedAt && (
                <span className="ml-2 text-sm">
                  (Approved on {formatDate(user.approvedAt)}
                  {user.approvedByName && ` by ${user.approvedByName}`})
                </span>
              )}
              {user.status === 'DENIED' && user.deniedAt && (
                <span className="ml-2 text-sm">
                  (Denied on {formatDate(user.deniedAt)}
                  {user.deniedByName && ` by ${user.deniedByName}`})
                </span>
              )}
            </span>
          </div>
        )}

        {/* User Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4">
            <div className="flex items-center justify-end">
              {!isEditing ? (
                <button
                  onClick={startEdit}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
                >
                  <FaEdit />
                  Edit User
                </button>
              ) : (
                <div className="flex items-center space-x-2">
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
                    Save Changes
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 bg-orange-400 text-white rounded-lg hover:bg-orange-500 flex items-center gap-2"
                  >
                    <FaTimes />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

                     <div className="p-6">
             <div className="space-y-8">
               {/* Basic Information */}
               <div className="space-y-6">
                <h3 className="text-lg font-medium text-black border-b border-orange-200 pb-2">
                  Basic Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FaUser className="inline mr-2" />
                      Full Name
                    </label>
                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editData.firstName || ''}
                          onChange={(e) => handleEditChange('firstName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="First Name"
                        />
                        <input
                          type="text"
                          value={editData.lastName || ''}
                          onChange={(e) => handleEditChange('lastName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Last Name"
                        />
                      </div>
                    ) : (
                      <p className="text-black">{user.firstName} {user.lastName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FaEnvelope className="inline mr-2" />
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editData.email || ''}
                        onChange={(e) => handleEditChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-black">{user.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FaPhone className="inline mr-2" />
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editData.phone || ''}
                        onChange={(e) => handleEditChange('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-black">{user.phone || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FaShieldAlt className="inline mr-2" />
                      Role
                    </label>
                    {isEditing ? (
                      <select
                        value={editData.role || ''}
                        onChange={(e) => handleEditChange('role', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        {roles.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-black">{user.role}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FaCalendar className="inline mr-2" />
                      Registration Date
                    </label>
                    <p className="text-black">
                      {user.createdAt ? formatDate(user.createdAt) : 'Not available'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {shouldShowAdditionalSection(user) && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-black border-b border-orange-200 pb-2">
                    Additional Information
                  </h3>
                
                <div className="space-y-4">
                  {/* Age Bracket */}
                  {(user.ageBracket || isEditing) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age Bracket</label>
                      {isEditing ? (
                        <select
                          value={editData.ageBracket || ''}
                          onChange={(e) => handleEditChange('ageBracket', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select age bracket</option>
                          {ageBrackets.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-black">
                          {ageBrackets.find(option => option.value === user.ageBracket)?.label || user.ageBracket || 'Not provided'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Birth Date */}
                  {(user.birthdate || isEditing) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editData.birthdate || ''}
                          onChange={(e) => handleEditChange('birthdate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-black">{user.birthdate ? formatDate(user.birthdate) : 'Not provided'}</p>
                      )}
                    </div>
                  )}

                  {/* Pronouns */}
                  {(user.pronouns || isEditing) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pronouns</label>
                      {isEditing ? (
                        <select
                          value={editData.pronouns || ''}
                          onChange={(e) => handleEditChange('pronouns', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select pronouns</option>
                          {pronounsOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-black">
                          {pronounsOptions.find(option => option.value === user.pronouns)?.label || user.pronouns || 'Not provided'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Address */}
                  {(user.address || isEditing) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      {isEditing ? (
                        <textarea
                          value={editData.address || ''}
                          onChange={(e) => handleEditChange('address', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          rows={3}
                          placeholder="Enter address"
                        />
                      ) : (
                        <p className="text-black">{user.address || 'Not provided'}</p>
                      )}
                    </div>
                  )}

                  {/* City */}
                  {(user.city || isEditing) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.city || ''}
                          onChange={(e) => handleEditChange('city', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter city"
                        />
                      ) : (
                        <p className="text-black">{user.city || 'Not provided'}</p>
                      )}
                    </div>
                  )}

                  {/* Postal Code */}
                  {(user.postalCode || isEditing) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.postalCode || ''}
                          onChange={(e) => handleEditChange('postalCode', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter postal code"
                        />
                      ) : (
                        <p className="text-black">{user.postalCode || 'Not provided'}</p>
                      )}
                    </div>
                  )}

                  {/* Home Phone */}
                  {(user.homePhone || isEditing) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Home Phone</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editData.homePhone || ''}
                          onChange={(e) => handleEditChange('homePhone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter home phone"
                        />
                      ) : (
                        <p className="text-black">{user.homePhone || 'Not provided'}</p>
                      )}
                    </div>
                  )}

                  {/* Emergency Contact */}
                  {(user.emergencyContactName || user.emergencyContactNumber || isEditing) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editData.emergencyContactName || ''}
                            onChange={(e) => handleEditChange('emergencyContactName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Emergency Contact Name"
                          />
                          <input
                            type="tel"
                            value={editData.emergencyContactNumber || ''}
                            onChange={(e) => handleEditChange('emergencyContactNumber', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Emergency Contact Number"
                          />
                        </div>
                      ) : (
                        <p className="text-black">
                          {user.emergencyContactName && user.emergencyContactNumber 
                            ? `${user.emergencyContactName} - ${user.emergencyContactNumber}`
                            : user.emergencyContactName || user.emergencyContactNumber || 'Not provided'
                          }
                        </p>
                      )}
                    </div>
                  )}

                  {/* Communication Preferences */}
                  {(user.communicationPreferences || isEditing) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Communication Preferences</label>
                      {isEditing ? (
                        <select
                          value={editData.communicationPreferences || ''}
                          onChange={(e) => handleEditChange('communicationPreferences', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select communication preference</option>
                          {communicationPreferences.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-black">
                          {communicationPreferences.find(option => option.value === user.communicationPreferences)?.label || user.communicationPreferences || 'Not provided'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Allergies */}
                  {(user.allergies || isEditing) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                      {isEditing ? (
                        <textarea
                          value={editData.allergies || ''}
                          onChange={(e) => handleEditChange('allergies', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          rows={2}
                          placeholder="Enter allergies"
                        />
                      ) : (
                        <p className="text-black">{user.allergies || 'Not provided'}</p>
                      )}
                    </div>
                  )}

                  {/* Medical Concerns */}
                  {(user.medicalConcerns || isEditing) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Medical Concerns</label>
                      {isEditing ? (
                        <textarea
                          value={editData.medicalConcerns || ''}
                          onChange={(e) => handleEditChange('medicalConcerns', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          rows={2}
                          placeholder="Enter medical concerns"
                        />
                      ) : (
                        <p className="text-black">{user.medicalConcerns || 'Not provided'}</p>
                      )}
                    </div>
                  )}

                  {/* Preferred Days */}
                  {(user.preferredDays || isEditing) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Days</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.preferredDays || ''}
                          onChange={(e) => handleEditChange('preferredDays', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter preferred days"
                        />
                      ) : (
                        <p className="text-black">{user.preferredDays || 'Not provided'}</p>
                      )}
                    </div>
                  )}

                  {/* Preferred Shifts */}
                  {(user.preferredShifts || isEditing) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Shifts</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.preferredShifts || ''}
                          onChange={(e) => handleEditChange('preferredShifts', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter preferred shifts"
                        />
                      ) : (
                        <p className="text-black">{user.preferredShifts || 'Not provided'}</p>
                      )}
                    </div>
                  )}

                  {/* Frequency */}
                  {(user.frequency || isEditing) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                      {isEditing ? (
                        <select
                          value={editData.frequency || ''}
                          onChange={(e) => handleEditChange('frequency', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select frequency</option>
                          {frequencyOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-black">
                          {frequencyOptions.find(option => option.value === user.frequency)?.label || user.frequency || 'Not provided'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Preferred Programs */}
                  {(user.preferredPrograms || isEditing) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Programs</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.preferredPrograms || ''}
                          onChange={(e) => handleEditChange('preferredPrograms', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter preferred programs"
                        />
                      ) : (
                        <p className="text-black">{user.preferredPrograms || 'Not provided'}</p>
                      )}
                    </div>
                  )}

                  {/* Can Call If Short Handed */}
                  {(user.canCallIfShortHanded !== undefined || isEditing) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Can Call If Short Handed</label>
                      {isEditing ? (
                        <select
                          value={editData.canCallIfShortHanded !== undefined ? editData.canCallIfShortHanded.toString() : ''}
                          onChange={(e) => handleEditChange('canCallIfShortHanded', e.target.value === 'true')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select option</option>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      ) : (
                        <p className="text-black">
                          {user.canCallIfShortHanded !== undefined 
                            ? (user.canCallIfShortHanded ? 'Yes' : 'No')
                            : 'Not provided'
                          }
                        </p>
                      )}
                    </div>
                  )}

                  {/* School/Work Commitment */}
                  {(user.schoolWorkCommitment || isEditing) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">School/Work Commitment</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.schoolWorkCommitment || ''}
                          onChange={(e) => handleEditChange('schoolWorkCommitment', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter school/work commitment"
                        />
                      ) : (
                        <p className="text-black">{user.schoolWorkCommitment || 'Not provided'}</p>
                      )}
                    </div>
                  )}

                  {/* Required Hours */}
                  {(user.requiredHours || isEditing) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Required Hours</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.requiredHours || ''}
                          onChange={(e) => handleEditChange('requiredHours', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter required hours"
                        />
                      ) : (
                        <p className="text-black">{user.requiredHours || 'Not provided'}</p>
                      )}
                    </div>
                  )}

                  {/* How Did You Hear */}
                  {(user.howDidYouHear || isEditing) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">How Did You Hear</label>
                      {isEditing ? (
                        <select
                          value={editData.howDidYouHear || ''}
                          onChange={(e) => handleEditChange('howDidYouHear', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select how you heard about us</option>
                          {howDidYouHearOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-black">
                          {howDidYouHearOptions.find(option => option.value === user.howDidYouHear)?.label || user.howDidYouHear || 'Not provided'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Start Date */}
                  {(user.startDate || isEditing) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editData.startDate || ''}
                          onChange={(e) => handleEditChange('startDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-black">{user.startDate ? formatDate(user.startDate) : 'Not provided'}</p>
                      )}
                    </div>
                  )}

                  {/* Parent/Guardian */}
                  {(user.parentGuardianName || user.parentGuardianEmail || isEditing) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Parent/Guardian</label>
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editData.parentGuardianName || ''}
                            onChange={(e) => handleEditChange('parentGuardianName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Parent/Guardian Name"
                          />
                          <input
                            type="email"
                            value={editData.parentGuardianEmail || ''}
                            onChange={(e) => handleEditChange('parentGuardianEmail', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Parent/Guardian Email"
                          />
                        </div>
                      ) : (
                        <p className="text-black">
                          {user.parentGuardianName && user.parentGuardianEmail 
                            ? `${user.parentGuardianName} - ${user.parentGuardianEmail}`
                            : user.parentGuardianName || user.parentGuardianEmail || 'Not provided'
                          }
                        </p>
                      )}
                    </div>
                  )}

                  {/* Registration Type */}
                  {(user.registrationType || isEditing) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Registration Type</label>
                      {isEditing ? (
                        <select
                          value={editData.registrationType || ''}
                          onChange={(e) => handleEditChange('registrationType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select registration type</option>
                          {registrationTypes.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-black">
                          {registrationTypes.find(option => option.value === user.registrationType)?.label || user.registrationType || 'Not provided'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 