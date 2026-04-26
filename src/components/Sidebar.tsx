'use client';

import styles from './Sidebar.module.css';
import { FaHome, FaUserFriends, FaChartBar, FaExchangeAlt, FaBoxOpen, FaClock, FaCalendarAlt, FaUtensils, FaUsers, FaCog, FaEnvelope, FaQrcode, FaMobileAlt, FaHandHoldingUsd } from 'react-icons/fa';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from "next/navigation";

const menu = [
  { icon: <FaHome />, label: 'Dashboard', href: '/dashboard', key: 'website_dashboard' },
  // SHIFT_DISABLED_START
  // { icon: <FaUserFriends />, label: 'Volunteer Management', href: '/volunteers', key: 'website_volunteer_hours' },
  // SHIFT_DISABLED_END
  { icon: <FaChartBar />, label: 'Incoming Stats', href: '/incoming-stats', key: 'website_incoming_stats' },
  { icon: <FaExchangeAlt />, label: 'Outgoing Stats', href: '/outgoing-stats', key: 'website_outgoing_stats' },
  { icon: <FaBoxOpen />, label: 'Inventory', href: '/inventory', key: 'website_inventory' },
  { icon: <FaUsers />, label: 'Donor Data', href: '/donor-data', key: 'website_donor_data' },
  { icon: <FaUserFriends />, label: 'Manage Users', href: '/manage-users', key: 'website_manage_users' },
  // SHIFT_DISABLED_START
  // { icon: <FaClock />, label: 'Manage Shifts', href: '/manage-shifts', key: 'website_manage_shifts' },
  // { icon: <FaCalendarAlt />, label: 'Schedule Shifts', href: '/schedule-shifts', key: 'website_schedule_shifts' },
  // SHIFT_DISABLED_END
  { icon: <FaCog />, label: 'Sign Up Fields', href: '/field-management', key: 'website_signup_fields' },
  { icon: <FaEnvelope />, label: 'Email Management', href: '/email-management', key: 'website_email_management' },
  { icon: <FaQrcode />, label: 'QR Codes', href: '/qr-codes', key: 'website_qr_codes' },
  { icon: <FaMobileAlt />, label: 'Mobile Analytics', href: '/mobile-analytics', key: 'website_mobile_analytics' },
  { icon: <FaHandHoldingUsd />, label: 'My Grants', href: '/my-grants', key: 'website_my_grants' },
  { icon: <FaUtensils />, label: 'Kitchen Details', href: '/kitchen-details', key: 'website_kitchen_details' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('');
  const [assignedModules, setAssignedModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          let displayName = '';
          if (user.lastName) displayName = user.lastName;
          else displayName = 'User';
          setUserName(displayName);
          setUserEmail(user.email || '');
        } catch {
          setUserName('User');
          setUserEmail('');
        }
      }

      // Fetch assigned modules
      if (token) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modules`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              // Check if user has access to Dashboard (which now implies full website access)
              const hasWebsiteAccess = data.some((m: any) =>
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
          })
          .catch(err => console.error('Error fetching modules:', err))
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }
  }, []);

  if (pathname === '/login') return null;

  // Filter menu items
  const visibleMenu = menu.filter(item => assignedModules.has(item.key));

  return (
    <aside className={styles.sidebar}>
      <div>
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "2rem 1.5rem 1.5rem 1.5rem",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            borderRadius: "8px",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          <Image src="/assets/hungy-logo.jpg" alt="Hungy Logo" width={32} height={32} />
          <div className={styles.logo} style={{ padding: 0 }}>HUN<span>G</span>Y</div>
        </button>
        <nav style={{ flex: 1, overflowY: 'auto' }}>
          {visibleMenu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                color: pathname === item.href ? '#ff9800' : '#666',
                textDecoration: 'none',
                fontWeight: pathname === item.href ? 600 : 400,
                background: pathname === item.href ? '#fff5ed' : 'transparent',
                borderRadius: 6,
                marginBottom: 4
              }}
            >
              <span className={styles.icon}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
} 
