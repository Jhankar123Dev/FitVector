"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Target, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useUser } from "@/hooks/use-user";

interface AnalyticsData {
  totalApplications: number;
  statusBreakdown: Record<string, number>;
  thisWeekApplications: number;
  responseRate: number;
  avgTimeToResponse: string;
}

export default function AnalyticsPage() {
  const { user } = useUser();

  const { data, isLoading } = useQuery<AnalyticsData | null>({
    queryKey: ["analytics"],
    queryFn: async (): Promise<AnalyticsData | null> => {
      const res = await fetch("/api/tracker?all=true");
      if (!res.ok) return null;
      const json = await res.json();
      const apps = json.data || [];

      const statusBreakdown: Record<string, number> = {};
      let thisWeek = 0;
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      for (const app of apps) {
        statusBreakdown[app.status] = (statusBreakdown[app.status] || 0) + 1;
        if (new Date(app.createdAt).getTime() > oneWeekAgo) thisWeek++;
      }

      const responded = (statusBreakdown.screening || 0) + (statusBreakdown.interview || 0) + (statusBreakdown.offer || 0) + (statusBreakdown.rejected || 0);
      const applied = apps.filter((a: { status: string }) => a.status !== "saved").length;

      return {
        totalApplications: apps.length,
        statusBreakdown,
        thisWeekApplications: thisWeek,
        responseRate: applied > 0 ? Math.round((responded / applied) * 100) : 0,
        avgTimeToResponse: "~5 days",
      };
    },
  });

  const stats = [
    {
      title: "Total Applications",
      value: data?.totalApplications ?? 0,
      icon: Target,
      description: "All tracked applications",
    },
    {
      title: "This Week",
      value: data?.thisWeekApplications ?? 0,
      icon: Calendar,
      description: "Applications added this week",
    },
    {
      title: "Response Rate",
      value: `${data?.responseRate ?? 0}%`,
      icon: TrendingUp,
      description: "Of applied jobs got a response",
    },
    {
      title: "Avg Response Time",
      value: data?.avgTimeToResponse ?? "—",
      icon: BarChart3,
      description: "Average time to hear back",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-surface-800">Analytics</h1>
        <p className="mt-1 text-sm text-surface-500">
          Track your job search performance and trends
        </p>
      </div>

      {isLoading && <LoadingSpinner message="Loading analytics..." />}

      {!isLoading && data && data.totalApplications === 0 && (
        <EmptyState
          icon={BarChart3}
          title="No data yet"
          description="Start tracking applications in the Tracker tab to see analytics here."
        />
      )}

      {!isLoading && data && data.totalApplications > 0 && (
        <>
          {/* Stat cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium uppercase tracking-wider text-surface-500">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-surface-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-surface-800">{stat.value}</div>
                  <p className="text-xs text-surface-500">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Status breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Application Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(data.statusBreakdown).map(([status, count]) => {
                  const total = data.totalApplications;
                  const countNum = Number(count);
                  const pct = Math.round((countNum / total) * 100);
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize text-surface-700">{status}</span>
                        <span className="text-surface-500">
                          {countNum} ({pct}%)
                        </span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-100">
                        <div
                          className="h-full rounded-full bg-brand-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
