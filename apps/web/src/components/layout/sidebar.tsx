"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  FileText,
  Mail,
  Kanban,
  CalendarDays,
  BarChart3,
  Users,
  Settings,
  ClipboardCheck,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/jobs", label: "Jobs", icon: Search },
  { href: "/dashboard/companies", label: "Companies", icon: Building2 },
  { href: "/dashboard/resume", label: "Resume", icon: FileText },
  { href: "/dashboard/tests", label: "Tests", icon: ClipboardCheck },
  { href: "/dashboard/outreach", label: "Outreach", icon: Mail },
  { href: "/dashboard/tracker", label: "Tracker", icon: Kanban },
  { href: "/dashboard/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/community", label: "Community", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col bg-slate-50 dark:bg-slate-900 border-r border-border",
        className,
      )}
    >
      {/* Logo — links to home */}
      <Link href="/" className="flex h-16 items-center gap-2 border-b border-border px-6">
        <span className="text-xl font-bold">
          <span className="text-primary">Fit</span>
          <span className="text-foreground">Vector</span>
        </span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Plan badge */}
      <div className="border-t border-border p-4">
        <div className="rounded-lg bg-muted p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Current Plan</span>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
              {user?.planTier || "free"}
            </span>
          </div>
          {user?.planTier === "free" && (
            <Link
              href="/dashboard/settings/plan"
              className="mt-2 block text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Upgrade for more features
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
