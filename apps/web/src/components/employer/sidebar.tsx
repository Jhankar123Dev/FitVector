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
        "flex h-full w-[240px] flex-col border-r border-border bg-slate-50 dark:bg-slate-900",
        className,
      )}
    >
      {/* Company header — links to home */}
      <Link href="/" className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        {isLoading ? (
          <>
            <div className="h-7 w-7 shrink-0 animate-pulse rounded-lg bg-muted" />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="h-2 w-16 animate-pulse rounded bg-muted" />
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
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                {company.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-foreground leading-tight">
                {company.name}
              </p>
              <p className="truncate text-[10px] text-muted-foreground leading-tight">Employer Portal</p>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
              ?
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-muted-foreground leading-tight">
                No Company
              </p>
              <p className="truncate text-[10px] text-muted-foreground leading-tight">Employer Portal</p>
            </div>
          </>
        )}
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3">
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
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className={cn("h-[16px] w-[16px] shrink-0", isActive && "text-primary")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Plan badge */}
      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
          <span className="text-[11px] font-medium text-muted-foreground">Plan</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold capitalize text-primary">
            {company?.planTier || "starter"}
          </span>
        </div>
      </div>
    </aside>
  );
}
