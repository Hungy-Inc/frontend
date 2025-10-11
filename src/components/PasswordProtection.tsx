'use client';
import React, { useState } from 'react';
import { toast } from 'react-toastify';

interface PasswordProtectionProps {
  children: React.ReactNode;
  onPasswordVerified: () => void;
  isAuthenticated: boolean;
}

export default function PasswordProtection({ 
  children, 
  onPasswordVerified, 
  isAuthenticated 
}: PasswordProtectionProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(true);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('You are not logged in');
        return;
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verify-donor-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });
      if (!response.ok) {
        toast.error('Invalid password');
        return;
      }
      const result = await response.json();
      if (result.success) {
        onPasswordVerified();
        toast.success('Access granted');
      } else {
        toast.error('Invalid password');
      }
    } catch (err) {
      console.error('Password verification error:', err);
      toast.error('Invalid password');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout from donor page
  const handleLogout = () => {
    localStorage.removeItem('donorPageAuthenticated');
    window.location.reload();
  };

  if (isAuthenticated) {
    return (
      <div className="relative">
        {children}
        {/* Logout button for donor page authentication */}
        <button
          onClick={handleLogout}
          className="fixed top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm shadow-lg transition-colors"
          title="Clear donor page access"
        >
          🔒 Clear Access
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="filter blur-sm pointer-events-none select-none">
        {children}
      </div>
      
      {/* Password overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Access Required
            </h2>
            <p className="text-gray-600">
              Please enter the password to access donor data
            </p>
          </div>
          
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path d="M12 5c-4.5 0-8.4 2.6-10 7 1.6 4.4 5.5 7 10 7s8.4-2.6 10-7c-1.6-4.4-5.5-7-10-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-2.5A2.5 2.5 0 1 0 12 9a2.5 2.5 0 0 0 0 5Z"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path d="M2.3 1.3 1 2.6l4 4C3 8.1 1.7 9.8 1 12c1.6 4.4 5.5 7 10 7 2 0 3.9-.5 5.5-1.6l4.2 4.2 1.3-1.3L2.3 1.3ZM12 17c-2.8 0-5-2.2-5-5 0-.7.1-1.4.4-2l1.5 1.5c-.1.2-.2.7-.2 1 0 1.8 1.5 3.5 3.3 3.5.4 0 .8-.1 1.2-.2l1.5 1.5c-.7.4-1.6.7-2.7.7Zm9.9-5c-.8-2.2-2.1-3.9-3.8-5.4C16.6 4.5 14.4 4 12 4c-1.1 0-2.1.1-3 .4l2.1 2.1c.3-.1.6-.1.9-.1 2.8 0 5 2.2 5 5 0 .3 0 .6-.1.9l3.2 3.2c.9-1.1 1.6-2.4 1.8-3.5Z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying...
                </div>
              ) : (
                'Access Donor Data'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
