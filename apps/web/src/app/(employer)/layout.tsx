"use client";

import { useState } from "react";
import { EmployerSidebar } from "@/components/employer/sidebar";
import { EmployerNavbar } from "@/components/employer/navbar";
import { EmployerMobileNav } from "@/components/employer/mobile-nav";

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      {/* Desktop sidebar */}
      <EmployerSidebar className="hidden lg:flex" />

      {/* Mobile sidebar */}
      <EmployerMobileNav
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <EmployerNavbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
