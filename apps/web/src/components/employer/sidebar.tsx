"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Video,
  ClipboardCheck,
  CalendarDays,
  BarChart3,
  Database,
  Palette,
  Megaphone,
  Settings,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEmployer } from "@/hooks/use-employer";

const NAV_ITEMS = [
  { href: "/employer", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employer/jobs", label: "Jobs", icon: Briefcase },
  { href: "/employer/candidates", label: "Candidates", icon: Users },
  { href: "/employer/interviews", label: "Interviews", icon: Video },
  { href: "/employer/assessments", label: "Assessments", icon: ClipboardCheck },
  { href: "/employer/scheduling", label: "Scheduling", icon: CalendarDays },
  { href: "/employer/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/employer/talent-pool", label: "Talent Pool", icon: Database },
  { href: "/employer/branding", label: "Branding", icon: Palette },
  { href: "/employer/promotions", label: "Promotions", icon: Megaphone },
  { href: "/employer/settings", label: "Settings", icon: Settings },
  { href: "/employer/team", label: "Team", icon: UsersRound },
];

interface EmployerSidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function EmployerSidebar({ className, onNavigate }: EmployerSidebarProps) {
  const pathname = usePathname();
  const { data: employerData, isLoading } = useEmployer();
  const company = employerData?.data?.company;

  return (
    <aside
      className={cn(
        "flex h-full w-[240px] flex-col bg-surface-900",
        className,
      )}
    >
      {/* Company header — links to home */}
      <Link href="/" className="flex h-14 items-center gap-2.5 border-b border-surface-800 px-4">
        {isLoading ? (
          <>
            <div className="h-7 w-7 shrink-0 animate-pulse rounded-lg bg-surface-700" />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="h-3 w-24 animate-pulse rounded bg-surface-700" />
              <div className="h-2 w-16 animate-pulse rounded bg-surface-800" />
            </div>
          </>
        ) : company ? (
          <>
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="h-7 w-7 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-xs font-bold text-white">
                {company.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-white leading-tight">
                {company.name}
              </p>
              <p className="truncate text-[10px] text-surface-500 leading-tight">Employer Portal</p>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-700 text-xs font-bold text-surface-400">
              ?
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-surface-400 leading-tight">
                No Company
              </p>
              <p className="truncate text-[10px] text-surface-500 leading-tight">Employer Portal</p>
            </div>
          </>
        )}
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto scrollbar-dark px-2.5 py-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/employer" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-brand-500/15 text-brand-300"
                  : "text-surface-400 hover:bg-surface-800 hover:text-surface-200",
              )}
            >
              <item.icon className={cn("h-[16px] w-[16px] shrink-0", isActive && "text-brand-400")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Plan badge */}
      <div className="border-t border-surface-800 p-3">
        <div className="flex items-center justify-between rounded-md bg-surface-800/60 px-3 py-2">
          <span className="text-[11px] font-medium text-surface-400">Plan</span>
          <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-[11px] font-semibold capitalize text-brand-300">
            {company?.planTier || "starter"}
          </span>
        </div>
      </div>
    </aside>
  );
}
