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
      <CardContent className="flex items-start gap-4 p-5">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-surface-900">{value.toLocaleString()}</p>
          <p className="text-sm text-surface-500">{label}</p>
          {sub && <p className="mt-0.5 text-xs text-surface-400">{sub}</p>}
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Platform Overview</h1>
        <p className="mt-1 text-sm text-surface-500">Real-time snapshot of FitVector data</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-surface-100" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
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
            <CardContent className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-surface-700">Users by Role</h2>
              <div className="flex flex-wrap gap-4">
                {Object.entries(stats.roleBreakdown).map(([role, count]) => (
                  <div key={role} className="text-center">
                    <p className="text-xl font-bold text-surface-900">{count}</p>
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
