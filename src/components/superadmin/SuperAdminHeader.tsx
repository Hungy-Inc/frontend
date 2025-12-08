'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FaUserCircle, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';

export default function SuperAdminHeader() {
    const router = useRouter();
    const [user, setUser] = useState<{ firstName: string; lastName: string; email: string } | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const userInfo = localStorage.getItem('superAdminInfo');
        if (userInfo) {
            setUser(JSON.parse(userInfo));
        }

        // Close dropdown when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('superAdminToken');
            if (token) {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('superAdminToken');
            localStorage.removeItem('superAdminInfo');
            router.push('/superadmin/login');
        }
    };

    return (
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-10">
            {/* Left side - Breadcrumbs or Title (Optional) */}
            <div>
                {/* Can add breadcrumbs here later */}
            </div>

            {/* Right side - User Profile */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                >
                    <div className="text-right hidden md:block">
                        <div className="text-sm font-semibold text-gray-800">
                            {user ? `${user.firstName} ${user.lastName}` : 'Super Admin'}
                        </div>
                        <div className="text-xs text-gray-500">
                            {user?.email || 'admin@hungy.com'}
                        </div>
                    </div>
                    <FaUserCircle className="text-gray-400 text-3xl" />
                    <FaChevronDown className={`text-gray-400 text-xs transition-transform duration-200 ${showDropdown ? 'transform rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 animate-fadeIn">
                        <div className="px-4 py-3 border-b border-gray-100 md:hidden">
                            <p className="text-sm font-semibold text-gray-800">{user ? `${user.firstName} ${user.lastName}` : 'Super Admin'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>

                        <button
                            onClick={() => router.push('/superadmin/profile')}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                            <FaUserCircle className="text-gray-400" />
                            Profile Settings
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                            <FaSignOutAlt />
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
