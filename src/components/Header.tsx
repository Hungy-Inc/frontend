"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaUserCircle, FaSignOutAlt, FaUser, FaChevronDown } from 'react-icons/fa';

export default function Header() {
  const router = useRouter();
  const [orgName, setOrgName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchOrgName = async () => {
      try {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        if (!token || !userStr) {
          return; // Don't redirect from header, let page handle it
        }

        try {
          const user = JSON.parse(userStr);
          setUserEmail(user.email || '');
          if (user.organizationId) {
            // Add a small delay to prevent blocking other loads
            setTimeout(async () => {
              try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/organizations/${user.organizationId}`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                  const data = await response.json();
                  setOrgName(data.name);
                }
              } catch (err) {
                console.error('Error fetching organization:', err);
              }
            }, 200);
          }
        } catch (err) {
          console.error('Error parsing user data:', err);
        }
      } catch (err) {
        console.error('Error in header:', err);
      }
    };

    fetchOrgName();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('donorPageAuthenticated'); 
    router.push('/');
  };

  const handleProfile = () => {
    router.push('/profile');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('profile-dropdown');
      const trigger = document.getElementById('profile-trigger');
      if (dropdown && trigger && !dropdown.contains(event.target as Node) && !trigger.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header style={{
      background: '#fff',
      padding: '1rem 2rem',
      borderBottom: '1px solid #eee',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ fontWeight: 800, fontSize: 24, color: '#666', letterSpacing: 1, textTransform: 'uppercase' }}>
        {orgName || 'Organization'}
      </div>
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          style={{
            background: isDropdownOpen ? '#fff5ed' : 'transparent',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 6,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: isDropdownOpen ? '#ff9800' : '#333',
            transition: 'all 0.2s ease'
          }}
        >
          <span style={{ fontWeight: 500 }}>{userEmail}</span>
          <FaChevronDown size={12} />
        </button>
        {isDropdownOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            background: '#fff',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            padding: '8px 0',
            minWidth: 160,
            zIndex: 1000
          }}>
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                router.push('/profile');
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#000',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#ff9800'}
              onMouseOut={(e) => e.currentTarget.style.color = '#000'}
            >
              Profile
            </button>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#000',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#ff9800'}
              onMouseOut={(e) => e.currentTarget.style.color = '#000'}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
} 