'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    FaChartLine,
    FaBuilding,
    FaPuzzlePiece,
    FaUsers,
    FaHistory,
    FaCog
} from 'react-icons/fa';

export default function SuperAdminSidebar() {
    const pathname = usePathname();

    const menuItems = [
        {
            name: 'Dashboard',
            path: '/superadmin/dashboard',
            icon: <FaChartLine size={20} />
        },
        {
            name: 'Organizations',
            path: '/superadmin/organizations',
            icon: <FaBuilding size={20} />
        },
        {
            name: 'Modules',
            path: '/superadmin/modules',
            icon: <FaPuzzlePiece size={20} />
        },
        {
            name: 'Users',
            path: '/superadmin/users',
            icon: <FaUsers size={20} />
        },
        {
            name: 'Audit Logs',
            path: '/superadmin/audit-logs',
            icon: <FaHistory size={20} />
        }
    ];

    return (
        <div className="w-64 bg-white shadow-lg flex flex-col h-full z-10">
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                        H
                    </div>
                    <span className="text-xl font-bold text-gray-800">HÜNGY</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full ml-2">Admin</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname.startsWith(item.path);

                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors duration-200 ${isActive
                                    ? 'bg-orange-50 text-orange-600 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <span className={isActive ? 'text-orange-600' : 'text-gray-400'}>
                                {item.icon}
                            </span>
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / Settings */}
            <div className="p-4 border-t border-gray-100">
                <Link
                    href="/superadmin/profile"
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors duration-200 ${pathname === '/superadmin/profile'
                            ? 'bg-orange-50 text-orange-600 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                >
                    <span className={pathname === '/superadmin/profile' ? 'text-orange-600' : 'text-gray-400'}>
                        <FaCog size={20} />
                    </span>
                    <span>Settings</span>
                </Link>
            </div>
        </div>
    );
}
