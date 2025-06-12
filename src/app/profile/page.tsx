"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaUser, FaEnvelope, FaPhone, FaBuilding, FaUserShield, FaEdit, FaSave, FaTimes } from 'react-icons/fa';

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
        
        const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${user.userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user details');
        }
        
        const userData = await userResponse.json();
        console.log('User data from API:', userData);

        setProfile({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone || 'Not provided',
          role: userData.role,
          organizationId: userData.organizationId,
          organizationName: userData.organizationName
        });

        setEditedFields({
          name: userData.name,
          email: userData.email,
          phone: userData.phone || ''
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
    setIsEditing(false);
    setEditedFields({
      name: profile?.name || '',
      email: profile?.email || '',
      phone: profile?.phone || ''
    });
    setSaveError('');
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !profile) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${profile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editedFields.name,
          email: editedFields.email,
          phone: editedFields.phone
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setProfile(prev => prev ? {
        ...prev,
        name: editedFields.name,
        email: editedFields.email,
        phone: editedFields.phone
      } : null);

      setIsEditing(false);
      setSaveError('');
    } catch (err) {
      console.error('Error saving profile:', err);
      setSaveError('Failed to save changes');
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
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleSave}
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
    </main>
  );
} 