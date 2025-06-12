"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isLoginPage = pathname === '/login';

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f7f7f9" }}>
      {!isHomePage && !isLoginPage && <Sidebar />}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {!isHomePage && !isLoginPage && <Header />}
        <main style={{ flex: 1 }}>{children}</main>
      </div>
    </div>
  );
} 