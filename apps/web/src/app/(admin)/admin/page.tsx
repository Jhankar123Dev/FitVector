"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, Briefcase, Building2, FileText, TrendingUp, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AdminStats {
  totalUsers: number;
  totalJobs: number;
  directJobs: number;
  scrapedJobs: number;
  activeJobs: number;
  totalCompanies: number;
  totalApplications: number;
  newUsersWeek: number;
  roleBreakdown: Record<string, number>;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4 sm:gap-4 sm:p-5">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 ${color}`}>
          <Icon className="h-4 w-4 text-white sm:h-5 sm:w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold text-surface-900 sm:text-2xl">{Number(value).toLocaleString()}</p>
          <p className="text-xs text-surface-500 sm:text-sm">{label}</p>
          {sub && <p className="mt-0.5 truncate text-xs text-surface-400">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminOverviewPage() {
  const { data, isLoading } = useQuery<{ data: AdminStats }>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const stats = data?.data;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-900 sm:text-2xl">Platform Overview</h1>
        <p className="mt-0.5 text-xs text-surface-500 sm:mt-1 sm:text-sm">Real-time snapshot of FitVector data</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-100 sm:h-24" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            <StatCard
              label="Total Users"
              value={stats.totalUsers}
              sub={`+${stats.newUsersWeek} this week`}
              icon={Users}
              color="bg-blue-500"
            />
            <StatCard
              label="Total Jobs"
              value={stats.totalJobs}
              sub={`${stats.activeJobs} active`}
              icon={Briefcase}
              color="bg-green-500"
            />
            <StatCard
              label="Direct Jobs"
              value={stats.directJobs}
              sub={`${stats.scrapedJobs} scraped`}
              icon={TrendingUp}
              color="bg-brand-500"
            />
            <StatCard
              label="Companies"
              value={stats.totalCompanies}
              icon={Building2}
              color="bg-purple-500"
            />
            <StatCard
              label="Applications"
              value={stats.totalApplications}
              icon={FileText}
              color="bg-orange-500"
            />
            <StatCard
              label="DB Records"
              value={stats.totalUsers + stats.totalJobs + stats.totalApplications}
              sub="users + jobs + apps"
              icon={Database}
              color="bg-slate-500"
            />
          </div>

          {/* Role breakdown */}
          <Card>
            <CardContent className="p-4 sm:p-5">
              <h2 className="mb-3 text-sm font-semibold text-surface-700">Users by Role</h2>
              <div className="flex flex-wrap gap-4 sm:gap-6">
                {Object.entries(stats.roleBreakdown).map(([role, count]) => (
                  <div key={role} className="text-center">
                    <p className="text-lg font-bold text-surface-900 sm:text-xl">{count}</p>
                    <p className="text-xs capitalize text-surface-500">{role}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
