'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSuperAdminStore } from '@/stores/superAdminStore';
import SuperAdminHeader from '@/components/superadmin/SuperAdminHeader';
import SuperAdminSidebar from '@/components/superadmin/SuperAdminSidebar';

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const checkSession = useSuperAdminStore((state) => state.checkSession);
    const isAuthenticated = useSuperAdminStore((state) => state.isAuthenticated);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const initSession = async () => {
            // Skip auth check for public pages
            if (pathname === '/superadmin/login' || pathname.startsWith('/superadmin/forgot-password') || pathname.startsWith('/superadmin/reset-password')) {
                setIsChecking(false);
                return;
            }

            try {
                await checkSession();
            } catch (error) {
                // If checkSession fails, redirect to login
                router.push('/superadmin/login');
            } finally {
                setIsChecking(false);
            }
        };

        initSession();
    }, [pathname, router, checkSession]);

    // Redirect if not authenticated and not on public page
    useEffect(() => {
        if (!isChecking && !isAuthenticated) {
            if (pathname !== '/superadmin/login' && !pathname.startsWith('/superadmin/forgot-password') && !pathname.startsWith('/superadmin/reset-password')) {
                router.push('/superadmin/login');
            }
        }
    }, [isChecking, isAuthenticated, pathname, router]);

    if (isChecking) {
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
