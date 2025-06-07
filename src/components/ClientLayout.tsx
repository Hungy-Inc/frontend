"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f7f7f9" }}>
      {!isHomePage && <Sidebar />}
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
} 