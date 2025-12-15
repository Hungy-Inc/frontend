"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import { useUserModules } from '@/hooks/queries/useUser';
import { cn } from '@/lib/utils';
import {
    FaHome,
    FaUserFriends,
    FaChartBar,
    FaExchangeAlt,
    FaBoxOpen,
    FaUsers,
    FaClock,
    FaCalendarAlt,
    FaCog,
    FaEnvelope,
    FaQrcode,
    FaMobileAlt,
    FaHandHoldingUsd,
    FaUtensils
} from 'react-icons/fa';

const menu = [
    { icon: <FaHome />, label: 'Dashboard', href: '/dashboard', key: 'website_dashboard' },
    { icon: <FaUserFriends />, label: 'Volunteer Hours', href: '/volunteers', key: 'website_volunteer_hours' },
    { icon: <FaChartBar />, label: 'Incoming Stats', href: '/incoming-stats', key: 'website_incoming_stats' },
    { icon: <FaExchangeAlt />, label: 'Outgoing Stats', href: '/outgoing-stats', key: 'website_outgoing_stats' },
    { icon: <FaBoxOpen />, label: 'Inventory', href: '/inventory', key: 'website_inventory' },
    { icon: <FaUsers />, label: 'Donor Data', href: '/donor-data', key: 'website_donor_data' },
    { icon: <FaUserFriends />, label: 'Manage Users', href: '/manage-users', key: 'website_manage_users' },
    { icon: <FaClock />, label: 'Manage Shifts', href: '/manage-shifts', key: 'website_manage_shifts' },
    { icon: <FaCalendarAlt />, label: 'Schedule Shifts', href: '/schedule-shifts', key: 'website_schedule_shifts' },
    { icon: <FaCog />, label: 'Sign Up Fields', href: '/field-management', key: 'website_signup_fields' },
    { icon: <FaEnvelope />, label: 'Email Management', href: '/email-management', key: 'website_email_management' },
    { icon: <FaQrcode />, label: 'QR Codes', href: '/qr-codes', key: 'website_qr_codes' },
    { icon: <FaMobileAlt />, label: 'Mobile Analytics', href: '/mobile-analytics', key: 'website_mobile_analytics' },
    { icon: <FaHandHoldingUsd />, label: 'My Grants', href: '/my-grants', key: 'website_my_grants' },
    { icon: <FaUtensils />, label: 'Kitchen Details', href: '/kitchen-details', key: 'website_kitchen_details' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user } = useAuthStore();
    const { data: modules } = useUserModules();

    const [assignedModules, setAssignedModules] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (modules && Array.isArray(modules)) {
            // Check if user has access to Dashboard (which now implies full website access)
            const hasWebsiteAccess = modules.some((m: any) =>
                m.isEnabled && (m.ModuleTemplate?.key === 'website_dashboard' || m.name === 'Dashboard' || m.ModuleTemplate?.type === 'WEBSITE')
            );

            if (hasWebsiteAccess) {
                // Grant access to ALL website menu items
                const allKeys = menu.map(item => item.key);
                setAssignedModules(new Set(allKeys));
            } else {
                setAssignedModules(new Set());
            }
        }
    }, [modules]);

    if (pathname === '/login') return null;

    const visibleMenu = menu.filter(item => assignedModules.has(item.key));

    return (
        <aside className="fixed left-0 top-0 h-full w-64 border-r bg-background pb-10 pt-4 hidden md:flex md:flex-col z-40">
            <div className="px-4 mb-6">
                <button
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-2.5 px-6 py-4 w-full transition-transform hover:scale-105"
                >
                    <Image src="/assets/hungy-logo.jpg" alt="Hungy Logo" width={32} height={32} />
                    <div className="text-2xl font-bold tracking-tight">
                        HUN<span className="text-primary">G</span>Y
                    </div>
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 space-y-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                {visibleMenu.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <span className={cn("text-lg", isActive ? "text-primary" : "text-muted-foreground")}>
                                {item.icon}
                            </span>
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            <div className="px-4 mt-auto">
                <p className="text-xs text-center text-muted-foreground">© 2024 Hungy v0.1.0</p>
            </div>
        </aside>
    );
}
