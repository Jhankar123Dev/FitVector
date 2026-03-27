"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { EmployerSidebar } from "@/components/employer/sidebar";
import { EmployerNavbar } from "@/components/employer/navbar";
import { EmployerMobileNav } from "@/components/employer/mobile-nav";
import { useUser } from "@/hooks/use-user";

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { user, isLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  // Show loading state while session is being fetched
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="text-sm text-surface-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect non-employer users to seeker dashboard
  if (user && !user.userType.includes("employer")) {
    // Exception: allow the onboarding page (where they'll become an employer)
    if (!pathname.startsWith("/employer/onboarding")) {
      router.replace("/dashboard");
      return null;
    }
  }

  // Redirect employers without a company to onboarding
  // (except if they're already on the onboarding page)
  if (
    user &&
    user.userType.includes("employer") &&
    !user.companyId &&
    !pathname.startsWith("/employer/onboarding")
  ) {
    router.replace("/employer/onboarding");
    return null;
  }

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
