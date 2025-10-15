"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FaUser, FaEnvelope, FaPhone, FaBuilding, FaUserShield, FaEdit, FaSave, FaTimes, FaKey, FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-toastify';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  organizationId: string;
  organizationName: string;
}

interface EditableFields {
  name: string;
  email: string;
  phone: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedFields, setEditedFields] = useState<EditableFields>({
    name: '',
    email: '',
    phone: ''
  });
  const [saveError, setSaveError] = useState('');
  
  // Change Password Modal State
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Move validation logic to useMemo to prevent unnecessary recalculations and add null checks
  const validation = useMemo(() => {
    const name = editedFields.name || '';
    const email = editedFields.email || '';
    const phone = editedFields.phone || '';

    // Only validate if we're editing and have some data
    if (!isEditing) {
      return {
        isNameValid: true,
        isPhoneValid: true,
        isEmailValid: true,
        allFieldsFilled: true,
        canSave: false
      };
    }

    const isNameValid = /^[A-Za-z ]+$/.test(name.trim());
    // More flexible phone validation - allows digits, spaces, dashes, parentheses, and plus sign
    const isPhoneValid = /^[\d\s\-\(\)\+]+$/.test(phone.trim()) && phone.trim().length >= 10;
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const allFieldsFilled = name.trim() && email.trim() && phone.trim();
    const canSave = isNameValid && isPhoneValid && isEmailValid && allFieldsFilled;

    return {
      isNameValid,
      isPhoneValid,
      isEmailValid,
      allFieldsFilled,
      canSave
    };
  }, [editedFields, isEditing]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        
        if (!token || !userStr) {
          router.push('/login');
          return;
        }

        const user = JSON.parse(userStr);
        console.log('User data from localStorage:', user);
        
        // Check if API URL is configured
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        console.log('Environment variables:', {
          NEXT_PUBLIC_API_URL: apiUrl,
          NODE_ENV: process.env.NODE_ENV
        });
        
        if (!apiUrl) {
          throw new Error('API URL not configured. Please contact administrator.');
        }
        
        const userResponse = await fetch(`${apiUrl}/api/users/${user.userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user details');
        }
        
        const userData = await userResponse.json();
        console.log('User data from API:', userData);

        setProfile({
          id: userData.id,
          name: userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : userData.name || 'Unknown',
          email: userData.email || 'No email',
          phone: userData.phone || 'Not provided',
          role: userData.role || 'Unknown',
          organizationId: userData.organizationId,
          organizationName: userData.organizationName || 'Unknown Organization'
        });

        setEditedFields({
          name: userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : userData.name || '',
          email: userData.email || '',
          phone: userData.phone || ''
        });
        
        console.log('Profile data loaded:', {
          name: userData.name,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone,
          role: userData.role,
          organizationName: userData.organizationName
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile information');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleEdit = () => {
    setIsEditing(true);
    setSaveError('');
  };

  const handleCancel = () => {
    console.log('Canceling edit, resetting to profile data:', {
      name: profile?.name || '',
      email: profile?.email || '',
      phone: profile?.phone || ''
    });
    
    setIsEditing(false);
    setEditedFields({
      name: profile?.name || '',
      email: profile?.email || '',
      phone: profile?.phone || ''
    });
    setSaveError('');
  };

  const handleSave = async () => {
    if (!validation.canSave) {
      const errorMessage = 'Please fill all fields correctly. Name: letters only, Phone: valid phone number format, Email: valid format.';
      setSaveError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      if (!token || !profile) return;
      
      // Check if API URL is configured
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('API URL not configured. Please contact administrator.');
      }
      
      // Split the name into firstName and lastName for the backend
      const nameParts = editedFields.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      console.log('Sending update request:', {
        apiUrl,
        userId: profile.id,
        firstName,
        lastName,
        email: editedFields.email.trim(),
        phone: editedFields.phone.trim()
      });
      
      const response = await fetch(`${apiUrl}/api/users/${profile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email: editedFields.email.trim(),
          phone: editedFields.phone.trim()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const updatedUser = await response.json();
      console.log('Profile update successful:', updatedUser);
      
      // Update the local profile state with the new data
      setProfile(prev => prev ? {
        ...prev,
        name: editedFields.name.trim(),
        email: editedFields.email.trim(),
        phone: editedFields.phone.trim()
      } : null);
      
      setIsEditing(false);
      setSaveError('');
      toast.success('Profile updated successfully!');
      
    } catch (err) {
      console.error('Error saving profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save changes';
      setSaveError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Password validation function (same as manage-users)
  const validatePassword = (pw: string) => {
    if (pw.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pw)) return "Password must contain uppercase letter";
    if (!/[a-z]/.test(pw)) return "Password must contain lowercase letter";
    if (!/\d/.test(pw)) return "Password must contain a number";
    return "";
  };

  const handleChangePassword = async () => {
    // Validate all fields are filled
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    // Validate old password and new password are different
    if (passwordData.oldPassword === passwordData.newPassword) {
      toast.error('New password must be different from old password');
      return;
    }

    // Validate new password matches confirm password
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    // Validate new password requirements
    const passwordError = validatePassword(passwordData.newPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    setChangingPassword(true);
    
    const token = localStorage.getItem("token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (!token || !profile || !apiUrl) {
      toast.error('Missing required information');
      setChangingPassword(false);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/users/${profile.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword
        })
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(responseData.error || 'Failed to change password');
        setChangingPassword(false);
        return;
      }

      toast.success('Password changed successfully!');
      setShowChangePassword(false);
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      // Network or other errors
      console.error('Error changing password:', err);
      toast.error('Failed to change password. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <main style={{ padding: 32 }}>
        <div style={{ textAlign: 'center', color: '#666' }}>Loading profile information...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: 32 }}>
        <div style={{ textAlign: 'center', color: 'red' }}>{error}</div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main style={{ padding: 32 }}>
        <div style={{ textAlign: 'center', color: '#666' }}>No profile information available</div>
      </main>
    );
  }

  return (
    <main style={{ padding: 32 }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#333' }}>Profile Information</h1>
          {!isEditing ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleEdit}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#ff9800',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.2s ease'
                }}
              >
                <FaEdit size={16} />
                Edit Profile
              </button>
              <button
                onClick={() => setShowChangePassword(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#666',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.2s ease'
                }}
              >
                <FaKey size={16} />
                Change Password
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleSave}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: validation.canSave ? '#ff9800' : '#ccc',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 6,
                  cursor: validation.canSave ? 'pointer' : 'not-allowed',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                  opacity: validation.canSave ? 1 : 0.7
                }}
                disabled={!validation.canSave}
              >
                <FaSave size={16} />
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#f5f5f5',
                  color: '#666',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.2s ease'
                }}
              >
                <FaTimes size={16} />
                Cancel
              </button>
            </div>
          )}
        </div>
        
        {saveError && (
          <div style={{ 
            background: '#fff5ed', 
            color: '#ff9800', 
            padding: '12px 16px', 
            borderRadius: 6, 
            marginBottom: 24 
          }}>
            {saveError}
          </div>
        )}

        <div style={{ 
          background: '#fff', 
          borderRadius: 12, 
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)', 
          padding: 32 
        }}>
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#666' }}>Name</label>
                <input
                  type="text"
                  value={editedFields.name}
                  onChange={e => setEditedFields(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: '1px solid #eee',
                    fontSize: '1rem'
                  }}
                />
                {isEditing && !validation.isNameValid && (
                  <div style={{ color: 'red', fontSize: 13 }}>Name must contain only letters and spaces.</div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#666' }}>Email</label>
                <input
                  type="email"
                  value={editedFields.email}
                  onChange={e => setEditedFields(prev => ({ ...prev, email: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: '1px solid #eee',
                    fontSize: '1rem'
                  }}
                />
                {isEditing && !validation.isEmailValid && (
                  <div style={{ color: 'red', fontSize: 13 }}>Email must be in a valid format.</div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#666' }}>Phone</label>
                <input
                  type="tel"
                  value={editedFields.phone}
                  onChange={e => setEditedFields(prev => ({ ...prev, phone: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: '1px solid #eee',
                    fontSize: '1rem'
                  }}
                />
                {isEditing && !validation.isPhoneValid && (
                  <div style={{ color: 'red', fontSize: 13 }}>Phone must be a valid phone number (at least 10 characters, can include spaces, dashes, parentheses, and plus sign).</div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <FaUser size={20} style={{ color: '#ff9800' }} />
                <div>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>Name</div>
                  <div style={{ fontWeight: 500 }}>{profile.name}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <FaEnvelope size={20} style={{ color: '#ff9800' }} />
                <div>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>Email</div>
                  <div style={{ fontWeight: 500 }}>{profile.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <FaPhone size={20} style={{ color: '#ff9800' }} />
                <div>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>Phone</div>
                  <div style={{ fontWeight: 500 }}>{profile.phone}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <FaBuilding size={20} style={{ color: '#ff9800' }} />
                <div>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>Organization</div>
                  <div style={{ fontWeight: 500 }}>{profile.organizationName}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <FaUserShield size={20} style={{ color: '#ff9800' }} />
                <div>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>Role</div>
                  <div style={{ fontWeight: 500 }}>{profile.role}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 32,
            maxWidth: 500,
            width: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: '#333', margin: 0 }}>Change Password</h2>
              <button
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666',
                  fontSize: 24
                }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Old Password */}
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#666' }}>
                  Old Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, oldPassword: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 12px',
                      borderRadius: 6,
                      border: '1px solid #eee',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter your current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#666'
                    }}
                  >
                    {showOldPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#666' }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 12px',
                      borderRadius: 6,
                      border: '1px solid #eee',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#666'
                    }}
                  >
                    {showNewPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                </div>
                {passwordData.newPassword && validatePassword(passwordData.newPassword) && (
                  <div style={{ color: 'red', fontSize: 13, marginTop: 4 }}>
                    {validatePassword(passwordData.newPassword)}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#666' }}>
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 12px',
                      borderRadius: 6,
                      border: '1px solid #eee',
                      fontSize: '1rem'
                    }}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#666'
                    }}
                  >
                    {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                </div>
                {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                  <div style={{ color: 'red', fontSize: 13, marginTop: 4 }}>
                    Passwords do not match
                  </div>
                )}
              </div>

              {/* Password Requirements */}
              <div style={{
                background: '#f5f5f5',
                padding: 12,
                borderRadius: 6,
                fontSize: 13,
                color: '#666'
              }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Password Requirements:</div>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>At least 8 characters</li>
                  <li>At least one uppercase letter</li>
                  <li>At least one lowercase letter</li>
                  <li>At least one number</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    background: changingPassword ? '#ccc' : '#ff9800',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: 6,
                    cursor: changingPassword ? 'not-allowed' : 'pointer',
                    fontWeight: 500,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  disabled={changingPassword}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    background: '#f5f5f5',
                    color: '#666',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: 6,
                    cursor: changingPassword ? 'not-allowed' : 'pointer',
                    fontWeight: 500,
                    transition: 'all 0.2s ease'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}