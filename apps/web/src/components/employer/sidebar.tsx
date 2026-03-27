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
  Settings,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_COMPANY } from "@/lib/mock/employer-data";

const NAV_ITEMS = [
  { href: "/employer", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employer/jobs", label: "Jobs", icon: Briefcase },
  { href: "/employer/candidates", label: "Candidates", icon: Users },
  { href: "/employer/interviews", label: "Interviews", icon: Video },
  { href: "/employer/assessments", label: "Assessments", icon: ClipboardCheck },
  { href: "/employer/scheduling", label: "Scheduling", icon: CalendarDays },
  { href: "/employer/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/employer/talent-pool", label: "Talent Pool", icon: Database },
  { href: "/employer/settings", label: "Settings", icon: Settings },
  { href: "/employer/team", label: "Team", icon: UsersRound },
];

interface EmployerSidebarProps {
  className?: string;
}

export function EmployerSidebar({ className }: EmployerSidebarProps) {
  const pathname = usePathname();
  const company = MOCK_COMPANY;

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col bg-surface-900",
        className,
      )}
    >
      {/* Company header */}
      <div className="flex h-16 items-center gap-3 border-b border-surface-800 px-5">
        {company.logoUrl ? (
          <img
            src={company.logoUrl}
            alt={company.name}
            className="h-8 w-8 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
            {company.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {company.name}
          </p>
          <p className="truncate text-[11px] text-surface-500">Employer Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/employer" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-500/20 text-brand-300 border-l-2 border-brand-400"
                  : "text-surface-400 hover:bg-surface-800 hover:text-white",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Plan badge */}
      <div className="border-t border-surface-800 p-4">
        <div className="rounded-lg bg-surface-800 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-surface-400">Plan</span>
            <span className="rounded-full bg-brand-500/20 px-2.5 py-0.5 text-xs font-medium capitalize text-brand-300">
              {company.planTier}
            </span>
          </div>
          {company.planTier === "starter" && (
            <Link
              href="/employer/settings"
              className="mt-2 block text-xs text-brand-400 hover:text-brand-300 transition-colors"
            >
              Upgrade for more features
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
