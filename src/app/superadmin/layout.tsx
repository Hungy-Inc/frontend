'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import SuperAdminHeader from '@/components/superadmin/SuperAdminHeader';
import SuperAdminSidebar from '@/components/superadmin/SuperAdminSidebar';

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            // Skip auth check for login page
            if (pathname === '/superadmin/login' || pathname.startsWith('/superadmin/forgot-password') || pathname.startsWith('/superadmin/reset-password')) {
                setLoading(false);
                return;
            }

            const token = localStorage.getItem('superAdminToken');

            if (!token) {
                router.push('/superadmin/login');
                return;
            }

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/auth/profile`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    setIsAuthenticated(true);
                } else {
                    localStorage.removeItem('superAdminToken');
                    localStorage.removeItem('superAdminInfo');
                    router.push('/superadmin/login');
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                router.push('/superadmin/login');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [pathname, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    // Public pages don't need the layout
    if (pathname === '/superadmin/login' || pathname.startsWith('/superadmin/forgot-password') || pathname.startsWith('/superadmin/reset-password')) {
        return <>{children}</>;
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <SuperAdminSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <SuperAdminHeader />
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
