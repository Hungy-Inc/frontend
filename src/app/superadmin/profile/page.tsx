'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaUserCircle, FaLock, FaSave } from 'react-icons/fa';

export default function ProfilePage() {
    const [profile, setProfile] = useState({
        firstName: '',
        lastName: '',
        email: ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('superAdminToken');
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/auth/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setProfile({
                        firstName: data.firstName,
                        lastName: data.lastName,
                        email: data.email
                    });
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                toast.error('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingProfile(true);

        try {
            const token = localStorage.getItem('superAdminToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    firstName: profile.firstName,
                    lastName: profile.lastName
                })
            });

            if (response.ok) {
                const updatedProfile = await response.json();
                setProfile(prev => ({ ...prev, ...updatedProfile }));

                // Update local storage
                const userInfo = JSON.parse(localStorage.getItem('superAdminInfo') || '{}');
                localStorage.setItem('superAdminInfo', JSON.stringify({ ...userInfo, ...updatedProfile }));

                // Force header update (simple way)
                window.location.reload();

                toast.success('Profile updated successfully');
            } else {
                toast.error('Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        setSavingPassword(true);

        try {
            const token = localStorage.getItem('superAdminToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/auth/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            if (response.ok) {
                toast.success('Password changed successfully');
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to change password');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            toast.error('Failed to change password');
        } finally {
            setSavingPassword(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <h1 className="text-2xl font-bold text-gray-800">Account Settings</h1>

            {/* Profile Information */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                        <FaUserCircle size={24} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">Profile Information</h2>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input
                                type="text"
                                value={profile.firstName}
                                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input
                                type="text"
                                value={profile.lastName}
                                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                value={profile.email}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">Email cannot be changed. Contact system administrator.</p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={savingProfile}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                        >
                            <FaSave />
                            <span>{savingProfile ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* Change Password */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                        <FaLock size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">Change Password</h2>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                        <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            required
                            minLength={8}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                        <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            required
                            minLength={8}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={savingPassword}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            <FaSave />
                            <span>{savingPassword ? 'Updating...' : 'Update Password'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
