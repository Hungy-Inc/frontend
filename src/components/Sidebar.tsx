'use client';

import styles from './Sidebar.module.css';
import { FaHome, FaUserFriends, FaChartBar, FaExchangeAlt, FaBoxOpen, FaClock, FaCalendarAlt, FaUtensils } from 'react-icons/fa';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';

const menu = [
  { icon: <FaHome />, label: 'Dashboard', href: '/dashboard' },
  { icon: <FaUserFriends />, label: 'Volunteer Hours', href: '/volunteers' },
  { icon: <FaChartBar />, label: 'Incoming Stats', href: '/incoming-stats' },
  { icon: <FaExchangeAlt />, label: 'Outgoing Stats', href: '/outgoing-stats' },
  { icon: <FaBoxOpen />, label: 'Inventory', href: '/inventory' },
  { icon: <FaUserFriends />, label: 'Manage Users', href: '/manage-users' },
  { icon: <FaClock />, label: 'Manage Shifts', href: '/manage-shifts' },
  { icon: <FaCalendarAlt />, label: 'Schedule Shifts', href: '/schedule-shifts' },
  { icon: <FaUtensils />, label: 'Kitchen Details', href: '/kitchen-details' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
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
    }
  }, []);
  if (pathname === '/login') return null;
  return (
    <aside className={styles.sidebar}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2rem 1.5rem 1.5rem 1.5rem' }}>
          <Image src="/assets/hungy-logo.jpg" alt="Hungy Logo" width={32} height={32} />
          <div className={styles.logo} style={{ padding: 0 }}>HUN<span>G</span>Y</div>
        </div>
        <nav style={{ flex: 1, overflowY: 'auto' }}>
          {menu.map((item) => (
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