"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  FaEdit, 
  FaTrash, 
  FaSave, 
  FaTimes, 
  FaUserPlus, 
  FaEye, 
  FaEyeSlash, 
  FaCheck, 
  FaBan, 
  FaUndo,
  FaUsers,
  FaShieldAlt,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaFilter,
  FaUserCog,
  FaFileAlt,
  FaExternalLinkAlt,
  FaCopy
} from "react-icons/fa";
import { ImSpinner2 } from "react-icons/im"; 
import { toast } from 'react-toastify';

interface User {
  id: string;
  name: string;
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
  permissionCount?: number;
  totalModules?: number;
  hasPermissions?: boolean;
}

interface Module {
  id: number;
  name: string;
  description: string;
}

interface UserPermission {
  moduleId: number;
  moduleName: string;
  moduleDescription: string;
  canAccess: boolean;
}

interface UserPermissionData {
  userId: number;
  userName: string;
  userEmail: string;
  userRole: string;
  permissions: UserPermission[];
}

const roles = ["VOLUNTEER", "STAFF", "ADMIN"];
const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800", 
  DENIED: "bg-red-100 text-red-800"
};

const statusIcons = {
  PENDING: <FaClock className="w-4 h-4" />,
  APPROVED: <FaCheckCircle className="w-4 h-4" />,
  DENIED: <FaTimesCircle className="w-4 h-4" />
};

export default function ManageUsersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'permissions' | 'defaultPermissions'>('users');
  
  // User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<User>>({});
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addData, setAddData] = useState({ 
    firstName: "", 
    lastName: "", 
    email: "", 
    phone: "", 
    password: "", 
    confirmPassword: "", 
    role: "VOLUNTEER"
  });
  const [agreementFile, setAgreementFile] = useState<File | null>(null);
  const [uploadingAgreement, setUploadingAgreement] = useState(false);
  const [agreementFileUrl, setAgreementFileUrl] = useState<string>('');
  const [adding, setAdding] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [addUserError, setAddUserError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Permission Management State
  const [permissionUsers, setPermissionUsers] = useState<User[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissionData | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [permissionSearchTerm, setPermissionSearchTerm] = useState('');
  const [permissionFilterTerm, setPermissionFilterTerm] = useState('');

  // Default Permissions State
  const [defaultRolePermissions, setDefaultRolePermissions] = useState<Record<string, any[]>>({});
  const [defaultPermissionsLoading, setDefaultPermissionsLoading] = useState(false);
  const [savingDefaultPermissions, setSavingDefaultPermissions] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('ADMIN');
  const [defaultPermissionFilterTerm, setDefaultPermissionFilterTerm] = useState('');

  // Loading state for user approval
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Get organization ID from localStorage
  const getOrganizationId = () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          return user.organizationId;
        } catch {
          return null;
        }
      }
    }
    return null;
  };

  // Copy volunteer registration link to clipboard
  const copyVolunteerRegistrationLink = async () => {
    try {
      const organizationId = getOrganizationId();
      if (!organizationId) {
        toast.error('Organization ID not found');
        return;
      }

      // Fetch organization details from API
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/organizations/${organizationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to fetch organization details');
        return;
      }

      const organization = await response.json();
      const orgName = organization.name;

      if (!orgName) {
        toast.error('Organization name not found');
        return;
      }

      const baseUrl = window.location.origin;
      const registrationUrl = `${baseUrl}/${orgName}/volunteer-registration`;
      
      try {
        await navigator.clipboard.writeText(registrationUrl);
        toast.success('Volunteer registration link copied to clipboard!');
      } 
      catch (clipboardErr) {
        const tempInput = document.createElement('input');
        tempInput.value = registrationUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        toast.success('Volunteer registration link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error copying registration link:', err);
      toast.error('Failed to copy link to clipboard');
    }
  };

  // Fetch users for management
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      // Format the data to include the full name
      const formattedData = data.map((user: any) => ({
        ...user,
        name: `${user.firstName} ${user.lastName}`.trim()
      }));
      setUsers(formattedData);
    } catch (err) {
      setError("Failed to load users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users for permission management
  const fetchPermissionUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch permission users");
      const data = await response.json();
      // Format for permission management and only show approved users
      const formattedData = data.map((user: any) => ({
        ...user,
        name: `${user.firstName} ${user.lastName}`.trim()
      }));
      setPermissionUsers(formattedData.filter((u: any) => u.status === 'APPROVED'));
    } catch (err) {
      console.error("Failed to load permission users:", err);
      setPermissionUsers([]);
    }
  };

  // Fetch modules
  const fetchModules = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/modules`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch modules");
      }
      const data = await response.json();
      setModules(data);
    } catch (err) {
      console.error("Failed to load modules:", err);
      setModules([]);
    }
  };

  // Fetch default role permissions
  const fetchDefaultRolePermissions = async () => {
    try {
      setDefaultPermissionsLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/roles/default-permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch default role permissions");
      }
      const data = await response.json();
      setDefaultRolePermissions(data);
    } catch (err) {
      console.error("Failed to load default role permissions:", err);
      setDefaultRolePermissions({});
    } finally {
      setDefaultPermissionsLoading(false);
    }
  };

  // Update default permissions for a role
  const updateDefaultRolePermissions = async (role: string, permissions: any[]) => {
    try {
      setSavingDefaultPermissions(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/roles/${role}/default-permissions`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ permissions })
      });
      if (!response.ok) {
        throw new Error("Failed to update default role permissions");
      }
      await fetchDefaultRolePermissions();
      toast.success(`Default permissions for ${role} role updated successfully!`);
    } catch (err) {
      console.error("Failed to update default role permissions:", err);
      toast.error("Failed to update default role permissions. Please try again.");
    } finally {
      setSavingDefaultPermissions(false);
    }
  };

  // Toggle default permission for a module
  const toggleDefaultPermission = (role: string, moduleId: number) => {
    setDefaultRolePermissions(prev => {
      const rolePermissions = prev[role] || [];
      const updatedPermissions = rolePermissions.map(permission => 
        permission.moduleId === moduleId 
          ? { ...permission, canAccess: !permission.canAccess }
          : permission
      );
      return { ...prev, [role]: updatedPermissions };
    });
  };

  // Enable all default permissions for a role
  const enableAllDefaultPermissions = (role: string) => {
    setDefaultRolePermissions(prev => {
      const rolePermissions = prev[role] || [];
      const updatedPermissions = rolePermissions.map(permission => ({ ...permission, canAccess: true }));
      return { ...prev, [role]: updatedPermissions };
    });
  };

  // Disable all default permissions for a role
  const disableAllDefaultPermissions = (role: string) => {
    setDefaultRolePermissions(prev => {
      const rolePermissions = prev[role] || [];
      const updatedPermissions = rolePermissions.map(permission => ({ ...permission, canAccess: false }));
      return { ...prev, [role]: updatedPermissions };
    });
  };

  useEffect(() => {
    fetchUsers();
    fetchPermissionUsers();
    fetchModules();
    fetchDefaultRolePermissions();
  }, []);

  // User approval/denial functions
  const approveUser = async (userId: string) => {
    if (loadingUserId === userId) return;
    setLoadingUserId(userId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/users/${userId}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to approve user");
      await fetchUsers();
      await fetchPermissionUsers();
      toast.success("User approved successfully!");
    } catch (err) {
      toast.error("Failed to approve user. Please try again.");
    } finally {
      setLoadingUserId(null);
    }
  };

  const denyUser = async (userId: string) => {
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
      await fetchUsers();
      await fetchPermissionUsers();
      toast.success("User denied successfully!");
    } catch (err) {
      toast.error("Failed to deny user. Please try again.");
    }
  };

  const resetUserStatus = async (userId: string) => {
      try {
        const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/users/${userId}/reset`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to reset user status");
      await fetchUsers();
      await fetchPermissionUsers();
      toast.success("User status reset successfully!");
    } catch (err) {
      toast.error("Failed to reset user status. Please try again.");
    }
  };

  const viewUserAgreement = async (userId: string) => {
    try {
      console.log('Fetching user agreement for userId:', userId);
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/users/${userId}/agreement`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        console.error('API response not ok:', response.status, response.statusText);
        if (response.status === 404) {
          toast.error("No license agreement found for this user");
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error response:', errorData);
          toast.error(errorData.error || "Failed to fetch user agreement");
        }
        return;
      }
      
      const data = await response.json();
      console.log('Received agreement data:', data);
      
      if (data.documentUrl) {
        console.log('Opening document URL:', data.documentUrl);
        
        // Test if the URL is accessible before opening
        try {
          const testResponse = await fetch(data.documentUrl, { method: 'HEAD' });
          if (!testResponse.ok) {
            console.warn('Document URL might not be accessible:', testResponse.status);
          }
        } catch (testError) {
          console.warn('Could not test document URL accessibility:', testError);
        }
        //toast.success("Opening user agreement document");
        window.open(data.documentUrl, '_blank');
      } else {
        console.error('No documentUrl in response:', data);
        toast.error("No agreement document available for this user");
      }
    } catch (err) {
      console.error('Error in viewUserAgreement:', err);
      toast.error("Failed to open user agreement");
    }
  };

  // Permission management functions
  const fetchUserPermissions = async (userId: number) => {
    try {
      setPermissionLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/users/${userId}/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch user permissions");
      }
      
        const data = await response.json();
      setUserPermissions(data);
    } catch (err) {
      console.error("Failed to load user permissions:", err);
      setUserPermissions(null);
    } finally {
      setPermissionLoading(false);
    }
  };

  const updateUserPermissions = async () => {
    if (!userPermissions) return;
    
    try {
      setSavingPermissions(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/users/${userPermissions.userId}/permissions`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          permissions: userPermissions.permissions.map(p => ({
            moduleId: p.moduleId,
            canAccess: p.canAccess
          }))
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to update permissions");
      }
      
      await fetchPermissionUsers();
              toast.success("Permissions updated successfully!");
      } catch (err) {
        console.error("Failed to update permissions:", err);
        toast.error("Failed to update permissions. Please try again.");
      } finally {
      setSavingPermissions(false);
    }
  };

  const togglePermission = (moduleId: number) => {
    if (!userPermissions) return;
    
    setUserPermissions({
      ...userPermissions,
      permissions: userPermissions.permissions.map(p => 
        p.moduleId === moduleId ? { ...p, canAccess: !p.canAccess } : p
      )
    });
  };

  // Existing functions
  const startEdit = (user: User) => {
    setEditId(user.id);
    setEditData({ ...user });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditData({});
  };

  const handleEditChange = (field: keyof User, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      
      // Validate required fields
      if (!editData.name || !editData.email) {
        toast.error("Name and email are required fields");
        return;
      }

      // Parse name into firstName and lastName
      const nameParts = editData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const updateData = {
        firstName: firstName,
        lastName: lastName,
        email: editData.email || '',
        phone: editData.phone || null,
        role: editData.role || 'VOLUNTEER',
      };

      const response = await fetch(`${apiUrl}/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update user");
      }
      
      await fetchUsers();
      setEditId(null);
      setEditData({});
      toast.success("User updated successfully!");
    } catch (err: any) {
      console.error('Save edit error:', err);
      toast.error(err.message || "Failed to update user. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to delete user");
      await fetchUsers();
      toast.success("User deleted successfully!");
    } catch (err) {
      toast.error("Failed to delete user. Please try again.");
    }
  };

  const handleAgreementFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setAddUserError('Invalid file type. Only PDF, Word, text, and image files are allowed.');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setAddUserError('File too large. Maximum file size is 10MB.');
      return;
    }

    setAgreementFile(file);
    setUploadingAgreement(true);
    setAddUserError('');

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const formData = new FormData();
      formData.append('agreement', file);

      const response = await fetch(`${apiUrl}/api/users/upload-agreement`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || "Failed to upload agreement");
      }

      const result = await response.json();
      if (!result.fileUrl) {
        throw new Error('Upload successful but no file URL returned');
      }
      
      setAgreementFileUrl(result.fileUrl);
      toast.success('Agreement document uploaded successfully!');
    } catch (err: any) {
      console.error('Error uploading agreement:', err);
      const errorMessage = err.message || "Failed to upload agreement. Please try again.";
      setAddUserError(errorMessage);
      setAgreementFile(null);
      setAgreementFileUrl('');
      toast.error(errorMessage);
    } finally {
      setUploadingAgreement(false);
    }
  };

  const addUser = async () => {
    setAdding(true);
    setAddUserError('');
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...addData,
          agreementFileUrl,
          agreementFileName: agreementFile?.name,
          agreementFileSize: agreementFile?.size
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to add user");
      }

      await fetchUsers();
      setShowAdd(false);
      setAddData({ 
        firstName: "", 
        lastName: "", 
        email: "", 
        phone: "", 
        password: "", 
        confirmPassword: "", 
        role: "VOLUNTEER"
      });
      setAgreementFile(null);
      setAgreementFileUrl('');
      setUploadingAgreement(false);
      toast.success("User added successfully!");
    } catch (err: any) {
      setAddUserError(err.message || "Failed to add user. Please try again.");
      toast.error(err.message || "Failed to add user. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  // Validation functions
  const isEmail = (email: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

  const validatePassword = (pw: string) => {
    if (pw.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pw)) return "Password must contain uppercase letter";
    if (!/[a-z]/.test(pw)) return "Password must contain lowercase letter";
    if (!/\d/.test(pw)) return "Password must contain a number";
    return "";
  };

  const isAddFormValid = () => {
    return (
      addData.firstName.trim() &&
      addData.lastName.trim() &&
      isEmail(addData.email) &&
      addData.password &&
      addData.password === addData.confirmPassword &&
      !validatePassword(addData.password) &&
      addData.role &&
      agreementFileUrl && // Terms and conditions agreement is required
      !uploadingAgreement &&
      addData.phone &&
      addData.phone.length === 10 &&
      /^\d{10}$/.test(addData.phone)
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      timeZone: 'America/Halifax'
    });
  };

  const navigateToUserDetails = (userId: string) => {
    router.push(`/user-details/${userId}`);
  };

  // Filter functions
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const enableAllPermissions = () => {
    if (!userPermissions) return;
    setUserPermissions({
      ...userPermissions,
      permissions: userPermissions.permissions.map(p => ({ ...p, canAccess: true }))
    });
  };

  const disableAllPermissions = () => {
    if (!userPermissions) return;
    setUserPermissions({
      ...userPermissions,
      permissions: userPermissions.permissions.map(p => ({ ...p, canAccess: false }))
    });
  };

  // Filter permission users based on search term
  const filteredPermissionUsers = permissionUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(permissionSearchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(permissionSearchTerm.toLowerCase()) ||
                         user.role.toLowerCase().includes(permissionSearchTerm.toLowerCase());
    return matchesSearch;
  });

  // Filter permissions based on filter term (only by permission name)
  const filteredPermissions = userPermissions?.permissions.filter(permission => {
    const matchesFilter = permission.moduleName.toLowerCase().includes(permissionFilterTerm.toLowerCase());
    const isNotExcluded = permission.moduleName !== 'Volunteer Meal counting sub module';
    return matchesFilter && isNotExcluded;
  }) || [];

  // Filter default permissions based on filter term (only by permission name)
  const filteredDefaultPermissions = defaultRolePermissions[selectedRole]?.filter(permission => {
    const matchesFilter = permission.moduleName.toLowerCase().includes(defaultPermissionFilterTerm.toLowerCase());
    const isNotExcluded = permission.moduleName !== 'Volunteer Meal counting sub module';
    return matchesFilter && isNotExcluded;
  }) || [];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage users and their permissions</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            style={{
              borderBottomColor: activeTab === 'users' ? '#EF5C11' : 'transparent',
              color: activeTab === 'users' ? '#EF5C11' : undefined
            }}
          >
            <FaUsers className="inline mr-2" />
            User Management
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'permissions'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            style={{
              borderBottomColor: activeTab === 'permissions' ? '#EF5C11' : 'transparent',
              color: activeTab === 'permissions' ? '#EF5C11' : undefined
            }}
          >
            <FaShieldAlt className="inline mr-2" />
            Permission Management
        </button>
          <button
            onClick={() => setActiveTab('defaultPermissions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'defaultPermissions'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            style={{
              borderBottomColor: activeTab === 'defaultPermissions' ? '#EF5C11' : 'transparent',
              color: activeTab === 'defaultPermissions' ? '#EF5C11' : undefined
            }}
          >
            <FaUserCog className="inline mr-2" />
            Default Permissions
        </button>
        </nav>
      </div>

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <div>
          {/* Filters and Add Button */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                style={{ '--tw-ring-color': '#EF5C11' } as React.CSSProperties}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                style={{ '--tw-ring-color': '#EF5C11' } as React.CSSProperties}
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="DENIED">Denied</option>
              </select>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                style={{ '--tw-ring-color': '#EF5C11' } as React.CSSProperties}
              >
                <option value="all">All Roles</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <button
                onClick={copyVolunteerRegistrationLink}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg flex items-center gap-2 hover:bg-gray-700 transition"
                title="Copy volunteer registration link"
              >
                <FaCopy />
                Copy Registration Link
              </button>
              <button
                onClick={() => setShowAdd(true)}
                className="px-4 py-2 text-white rounded-lg flex items-center gap-2"
                style={{ 
                  backgroundColor: '#EF5C11',
                  '&:hover': { backgroundColor: '#666666' }
                } as React.CSSProperties}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#666666'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EF5C11'}
              >
                <FaUserPlus />
                Add User
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Users Table */}
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <FaUsers className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {users.length === 0 ? "No users in the database." : "No users match your search criteria."}
              </p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <li key={user.id} className={`px-6 py-4 ${editId ? 'cursor-default bg-gray-100 opacity-75' : 'hover:bg-gray-50 cursor-pointer'}`} onClick={() => !editId && navigateToUserDetails(user.id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                  {editId === user.id ? (
                            <div className="space-y-2">
                        <input
                                type="text"
                          value={editData.name || ''}
                                onChange={(e) => handleEditChange('name', e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Full Name"
                              />
                        <input
                                type="email"
                          value={editData.email || ''}
                                onChange={(e) => handleEditChange('email', e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Email"
                              />
                        <input
                                type="tel"
                          value={editData.phone || ''}
                                onChange={(e) => handleEditChange('phone', e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Phone"
                              />
                              <select
                          value={editData.role || ''}
                                onChange={(e) => handleEditChange('role', e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                                style={{ '--tw-ring-color': '#EF5C11', '--tw-border-opacity': '1' } as React.CSSProperties}
                              >
                                {roles.map(role => (
                                  <option key={role} value={role}>{role}</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                {user.status && (
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[user.status]}`}>
                                    {statusIcons[user.status]}
                                    <span className="ml-1">{user.status}</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">{user.email}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                <span>{user.role}</span>
                                {user.phone && <span>{user.phone}</span>}
                                {user.createdAt && <span>Joined {formatDate(user.createdAt)}</span>}
                              </div>
                              {user.status === 'APPROVED' && user.approvedAt && (
                                <p className="text-xs text-green-600 mt-1">
                                  Approved on {formatDate(user.approvedAt)}
                                  {user.approvedByName && ` by ${user.approvedByName}`}
                                </p>
                              )}
                              {user.status === 'DENIED' && user.deniedAt && (
                                <div className="text-xs text-red-600 mt-1">
                                  <p>Denied on {formatDate(user.deniedAt)}
                                    {user.deniedByName && ` by ${user.deniedByName}`}
                                  </p>
                                  {user.denialReason && <p>Reason: {user.denialReason}</p>}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        {editId === user.id ? (
                          <>
                            <button
                              onClick={() => saveEdit(user.id)}
                          disabled={saving}
                              className="p-2 text-green-600 hover:text-green-800 disabled:opacity-50"
                            >
                          <FaSave />
                        </button>
                            <button
                              onClick={cancelEdit}
                              className="p-2 text-gray-600 hover:text-gray-800"
                            >
                          <FaTimes />
                        </button>
                    </>
                  ) : (
                    <>
                            
                            {user.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => approveUser(user.id)}
                                  className={`p-2 rounded ${
                                    loadingUserId === user.id
                                      ? "text-gray-400 cursor-not-allowed"
                                      : "text-green-600 hover:text-green-800"
                                  }`}
                                  disabled={loadingUserId === user.id}
                                  title="Approve User"
                                >
                                  {loadingUserId === user.id ? (
                                    <ImSpinner2 className="animate-spin" />
                                  ) : (
                                    <FaCheck />
                                  )}
                                </button>
                                <button
                                  onClick={() => denyUser(user.id)}
                                  className="p-2 text-red-600 hover:text-red-800"
                                  title="Deny User"
                                >
                                  <FaBan />
                                </button>
                              </>
                            )}
                            {(user.status === 'APPROVED' || user.status === 'DENIED') && (
                              <button
                                onClick={() => resetUserStatus(user.id)}
                                className="p-2 text-yellow-600 hover:text-yellow-800"
                                title="Reset Status"
                              >
                                <FaUndo />
                              </button>
                            )}
                            <button
                              onClick={() => viewUserAgreement(user.id)}
                              className="p-2 text-purple-600 hover:text-purple-800"
                              title="View License Agreement"
                            >
                              <FaFileAlt />
                            </button>
                            <button
                              onClick={() => navigateToUserDetails(user.id)}
                              className="p-2"
                              style={{ color: '#EF5C11' }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#666666'}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#EF5C11'}
                            >
                          <FaEdit />
                        </button>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="p-2 text-red-600 hover:text-red-800"
                            >
                          <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Permission Management Tab */}
      {activeTab === 'permissions' && (
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Selection Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Select User</h3>
                  
                  {/* Search Bar for Permission Management */}
                  <div className="mb-4">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={permissionSearchTerm}
                        onChange={(e) => setPermissionSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        style={{ '--tw-ring-color': '#EF5C11' } as React.CSSProperties}
                      />
                    </div>
                  </div>
                  {permissionUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <FaUserCog className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No approved users</h3>
                      <p className="mt-1 text-sm text-gray-500">No approved users found in the database.</p>
                    </div>
                  ) : filteredPermissionUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <FaSearch className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                      <p className="mt-1 text-sm text-gray-500">No users match your search criteria.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredPermissionUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setSelectedUser(parseInt(user.id));
                            setPermissionFilterTerm(''); // Clear filter when selecting new user
                            fetchUserPermissions(parseInt(user.id));
                          }}
                          className={`w-full text-left p-3 rounded-lg border ${
                            selectedUser === parseInt(user.id)
                              ? 'border-orange-500'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          style={selectedUser === parseInt(user.id) ? {
                            borderColor: '#EF5C11',
                            backgroundColor: '#F5F4F2'
                          } : undefined}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-700">
                                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.role}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Permission Management Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  {!selectedUser ? (
                    <div className="text-center py-12">
                      <FaShieldAlt className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Select a user</h3>
                      <p className="mt-1 text-sm text-gray-500">Choose a user from the left panel to manage their permissions.</p>
                    </div>
                  ) : permissionLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderBottomColor: '#EF5C11' }}></div>
                    </div>
                  ) : !userPermissions ? (
                    <div className="text-center py-12">
                      <FaTimesCircle className="mx-auto h-12 w-12 text-red-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load permissions</h3>
                      <p className="mt-1 text-sm text-gray-500">Unable to load user permissions from the database.</p>
                    </div>
                  ) : (
                                        <div>
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              Permissions for {userPermissions.userName}
                            </h3>
                            <p className="text-sm text-gray-500">{userPermissions.userEmail} • {userPermissions.userRole}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={enableAllPermissions}
                              className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                            >
                              Enable All
                            </button>
                            <button
                              onClick={disableAllPermissions}
                              className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                            >
                              Disable All
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={updateUserPermissions}
                            disabled={savingPermissions}
                            className="px-4 py-2 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                            style={{ 
                              backgroundColor: '#EF5C11'
                            } as React.CSSProperties}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#666666'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EF5C11'}
                          >
                            {savingPermissions && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                            Save Permissions
                          </button>
                        </div>
                      </div>

                      {/* Permission Filter */}
                      <div className="mb-6">
                        <div className="relative">
                          <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                <input
                        type="text"
                        placeholder="Filter permissions..."
                        value={permissionFilterTerm}
                        onChange={(e) => setPermissionFilterTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        style={{ '--tw-ring-color': '#EF5C11' } as React.CSSProperties}
                      />
                        </div>
                      </div>

                      {modules.length === 0 ? (
                        <div className="text-center py-8">
                          <FaShieldAlt className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No modules found</h3>
                          <p className="mt-1 text-sm text-gray-500">No modules found in the database.</p>
                        </div>
                      ) : userPermissions.permissions.length === 0 ? (
                        <div className="text-center py-8">
                          <FaShieldAlt className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No permissions found</h3>
                          <p className="mt-1 text-sm text-gray-500">No permissions found for this user in the database.</p>
                        </div>
                      ) : filteredPermissions.length === 0 ? (
                        <div className="text-center py-8">
                          <FaFilter className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No permissions match filter</h3>
                          <p className="mt-1 text-sm text-gray-500">No permissions match your filter criteria.</p>
                          <button
                            onClick={() => setPermissionFilterTerm('')}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                          >
                            Clear filter
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredPermissions.map((permission) => (
                            <div key={permission.moduleId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">{permission.moduleName}</h4>
                                <p className="text-sm text-gray-500">{permission.moduleDescription}</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={permission.canAccess}
                                  onChange={() => togglePermission(permission.moduleId)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                                  style={{
                                    '--tw-ring-color': 'rgba(239, 92, 17, 0.3)',
                                    backgroundColor: permission.canAccess ? '#EF5C11' : '#E5E7EB'
                                  } as React.CSSProperties}></div>
                              </label>
                            </div>
                          ))}
                          
                          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                            <div className="text-sm text-gray-500">
                              {permissionFilterTerm ? (
                                <>
                                  {filteredPermissions.filter(p => p.canAccess).length} of {filteredPermissions.length} filtered permissions enabled
                                  <span className="text-gray-400 ml-2">
                                    ({filteredPermissions.filter(p => p.canAccess).length} of {filteredPermissions.length} total)
                                  </span>
                                </>
                              ) : (
                                <>
                                  {filteredPermissions.filter(p => p.canAccess).length} of {filteredPermissions.length} permissions enabled
                                </>
                              )}
                            </div>

                          </div>
                        </div>
                      )}
                    </div>
        )}
      </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Default Permissions Tab */}
      {activeTab === 'defaultPermissions' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Default Role Permissions</h2>
            <p className="text-gray-600">Configure default permissions that will be automatically assigned to new users based on their role.</p>
          </div>

          {defaultPermissionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderBottomColor: '#EF5C11' }}></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Role Selection */}
              <div className="flex space-x-4">
                {roles.map(role => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      selectedRole === role
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={selectedRole === role ? { backgroundColor: '#EF5C11' } : undefined}
                  >
                    {role}
                  </button>
                ))}
              </div>

              {/* Role Permissions */}
              {defaultRolePermissions[selectedRole] ? (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Default Permissions for {selectedRole} Role
                      </h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => enableAllDefaultPermissions(selectedRole)}
                          className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                        >
                          Enable All
                        </button>
                        <button
                          onClick={() => disableAllDefaultPermissions(selectedRole)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                        >
                          Disable All
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Filter permissions..."
                        value={defaultPermissionFilterTerm}
                        onChange={(e) => setDefaultPermissionFilterTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        style={{ '--tw-ring-color': '#EF5C11' } as React.CSSProperties}
                      />
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      {filteredDefaultPermissions.map((permission) => (
                        <div key={permission.moduleId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{permission.moduleName}</h4>
                            <p className="text-sm text-gray-500">{permission.moduleDescription}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={permission.canAccess}
                              onChange={() => toggleDefaultPermission(selectedRole, permission.moduleId)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                              style={{
                                '--tw-ring-color': 'rgba(239, 92, 17, 0.3)',
                                backgroundColor: permission.canAccess ? '#EF5C11' : '#E5E7EB'
                              } as React.CSSProperties}></div>
                          </label>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          {filteredDefaultPermissions.filter(p => p.canAccess).length} of {filteredDefaultPermissions.length} permissions shown
                        </div>
                        <button
                          onClick={() => updateDefaultRolePermissions(selectedRole, defaultRolePermissions[selectedRole])}
                          disabled={savingDefaultPermissions}
                          className="px-4 py-2 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                          style={{ 
                            backgroundColor: '#EF5C11'
                          } as React.CSSProperties}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#666666'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EF5C11'}
                        >
                          {savingDefaultPermissions && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaUserCog className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No default permissions found</h3>
                  <p className="mt-1 text-sm text-gray-500">Default permissions for the selected role are not configured.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New User</h3>
              {addUserError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {addUserError}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    value={addData.firstName}
                    onChange={(e) => setAddData({...addData, firstName: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    style={{ '--tw-ring-color': '#EF5C11' } as React.CSSProperties}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    value={addData.lastName}
                    onChange={(e) => setAddData({...addData, lastName: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    style={{ '--tw-ring-color': '#EF5C11' } as React.CSSProperties}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={addData.email}
                    onChange={(e) => setAddData({...addData, email: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    style={{ '--tw-ring-color': '#EF5C11' } as React.CSSProperties}
                    required
                  />
                  {addData.email && !isEmail(addData.email) && (
                    <p className="text-red-500 text-xs mt-1">Please enter a valid email</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={addData.phone}
                    onChange={(e) => {
                      // Only allow digits, max 10
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setAddData({ ...addData, phone: val });
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    style={{ '--tw-ring-color': '#EF5C11' } as React.CSSProperties}
                    maxLength={10}
                    pattern="[0-9]{10}"
                    required
                  />
                  {addData.phone && addData.phone.length !== 10 && (
                    <p className="text-red-500 text-xs mt-1">Phone number must be exactly 10 digits</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={addData.role}
                    onChange={(e) => setAddData({...addData, role: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    style={{ '--tw-ring-color': '#EF5C11' } as React.CSSProperties}
                  >
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={addData.password}
                      onChange={(e) => setAddData({...addData, password: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      style={{ '--tw-ring-color': '#EF5C11' } as React.CSSProperties}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? <FaEyeSlash className="h-4 w-4 text-gray-400" /> : <FaEye className="h-4 w-4 text-gray-400" />}
                    </button>
              </div>
                  {addData.password && validatePassword(addData.password) && (
                    <p className="text-red-500 text-xs mt-1">{validatePassword(addData.password)}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                  <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={addData.confirmPassword}
                      onChange={(e) => setAddData({...addData, confirmPassword: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      style={{ '--tw-ring-color': '#EF5C11' } as React.CSSProperties}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? <FaEyeSlash className="h-4 w-4 text-gray-400" /> : <FaEye className="h-4 w-4 text-gray-400" />}
                    </button>
                  </div>
                  {addData.confirmPassword && addData.password !== addData.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">Passwords don't match</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Terms and Conditions Agreement <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif"
                      onChange={handleAgreementFileChange}
                      disabled={uploadingAgreement}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                      required
                    />
                    {uploadingAgreement && (
                      <div className="flex items-center mt-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        <span className="text-sm text-gray-600">Uploading agreement...</span>
                      </div>
                    )}
                    {agreementFile && agreementFileUrl && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-700">
                          ✓ Agreement uploaded: {agreementFile.name}
                        </p>
                      </div>
                    )}
                    {!agreementFileUrl && !uploadingAgreement && (
                      <p className="text-xs text-gray-500 mt-1">
                        Upload a signed terms and conditions agreement (PDF, Word, image, or text file)
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAdd(false);
                    setAddData({ 
                      firstName: "", 
                      lastName: "", 
                      email: "", 
                      phone: "", 
                      password: "", 
                      confirmPassword: "", 
                      role: "VOLUNTEER"
                    });
                    setAgreementFile(null);
                    setAgreementFileUrl('');
                    setUploadingAgreement(false);
                    setAddUserError('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addUser}
                  disabled={adding || !isAddFormValid()}
                  className="px-4 py-2 text-white rounded-md disabled:opacity-50 flex items-center gap-2"
                  style={{ 
                    backgroundColor: '#EF5C11'
                  } as React.CSSProperties}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#666666'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EF5C11'}
                >
                  {adding && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  Add User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 