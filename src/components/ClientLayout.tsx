"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ReportIssueButton from "./ReportIssueButton";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isLoginPage = pathname === '/login';
  const isForgotPasswordPage = pathname === '/forgot-password';
  const isShiftSignupPage = pathname.startsWith('/shift-signup');
  const isContactPage = pathname === '/contact';
  const isPrivacyPolicyPage = pathname === '/privacy-policy';
  const isTermsOfServicePage = pathname === '/terms-of-service';
  const isVolunteerRegistrationPage = pathname.includes('/volunteer-registration');
  const shouldShowSidebarAndHeader = !isHomePage && !isLoginPage && !isForgotPasswordPage && !isShiftSignupPage && !isContactPage && !isPrivacyPolicyPage && !isTermsOfServicePage && !isVolunteerRegistrationPage;
  
  const lastNotificationTimestamp = useRef<number>(0);

  useEffect(() => {
    // Only listen for notifications if user is logged in (sidebar is shown)
    if (!shouldShowSidebarAndHeader) {
      return;
    }

    // Check if user is admin
    const token = localStorage.getItem('token');
    if (!token) return;

    // Decode token to check role (simple check, in production use proper JWT decode)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role !== 'ADMIN') return;
    } catch (e) {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'volunteer_notification' && e.newValue) {
        try {
          const notification = JSON.parse(e.newValue);
          
          // Prevent duplicate notifications
          if (notification.timestamp <= lastNotificationTimestamp.current) {
            return;
          }
          
          lastNotificationTimestamp.current = notification.timestamp;
          
          if (notification.type === 'NEW_VOLUNTEER_REGISTRATION') {
            const message = notification.count === 1 
              ? "A new volunteer has registered! Go to Manage Users to review the application."
              : `${notification.count} new volunteers have registered! Go to Manage Users to review the applications.`;
            
            toast.success(message, {
              autoClose: 8000,
            });
          }
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      }
    };

    // Listen for storage events (cross-tab communication)
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [shouldShowSidebarAndHeader]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f7f7f9" }}>
      {shouldShowSidebarAndHeader && <Sidebar />}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {shouldShowSidebarAndHeader && <Header />}
        <main style={{ flex: 1 }}>{children}</main>
      </div>
      {shouldShowSidebarAndHeader && <ReportIssueButton />}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
} 