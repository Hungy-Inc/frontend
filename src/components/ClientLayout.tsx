"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { ToastContainer } from 'react-toastify';
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
  const shouldShowSidebarAndHeader = !isHomePage && !isLoginPage && !isForgotPasswordPage && !isShiftSignupPage && !isContactPage && !isPrivacyPolicyPage && !isTermsOfServicePage;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f7f7f9" }}>
      {shouldShowSidebarAndHeader && <Sidebar />}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {shouldShowSidebarAndHeader && <Header />}
        <main style={{ flex: 1 }}>{children}</main>
      </div>
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