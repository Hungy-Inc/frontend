'use client';

import styles from './Sidebar.module.css';
import { FaHome, FaUserFriends, FaChartBar, FaExchangeAlt, FaBoxOpen } from 'react-icons/fa';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const menu = [
  { icon: <FaHome />, label: 'Dashboard', href: '/' },
  { icon: <FaUserFriends />, label: 'Volunteers', href: '/volunteers' },
  { icon: <FaChartBar />, label: 'Incoming Stats', href: '/incoming-stats' },
  { icon: <FaExchangeAlt />, label: 'Outgoing Stats', href: '/outgoing-stats' },
  { icon: <FaBoxOpen />, label: 'Inventory', href: '/inventory' },
];

export default function Sidebar() {
  const pathname = usePathname();
  if (pathname === '/login') return null;
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
  return (
    <aside className={styles.sidebar}>
      <div>
        <div className={styles.logo}>HUN<span>G</span>Y</div>
        <nav>
          <ul className={styles.menu}>
            {menu.map((item) => (
              <li key={item.label} className={pathname === item.href ? styles.active : ''}>
                <Link href={item.href} className={styles.menuLink}>
                  <span className={styles.icon}>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className={styles.userInfo}>
        <div className={styles.avatar}></div>
        <div>
          <div className={styles.userName}>{userName}</div>
          <div className={styles.userEmail}>{userEmail}</div>
        </div>
      </div>
    </aside>
  );
} 