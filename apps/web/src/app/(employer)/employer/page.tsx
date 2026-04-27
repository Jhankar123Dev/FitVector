"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Users,
  Video,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  Target,
  UserPlus,
  CalendarCheck,
  Send,
  CheckCircle2,
  FileText,
  Eye,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatRelativeTime } from "@/lib/utils";
import { useAnalytics, useFunnel } from "@/hooks/use-analytics";
import { useEmployer, useActivityFeed } from "@/hooks/use-employer";
import { CHART_COLORS } from "@/lib/chart-colors";

// ── Activity icon map ───────────────────────────────────────────────
const ACTIVITY_ICONS: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  new_applicant: { icon: UserPlus, bg: "bg-brand-50", color: "text-brand-500" },
  ai_interview_completed: { icon: CheckCircle2, bg: "bg-accent-50", color: "text-accent-600" },
  interview_scheduled: { icon: CalendarCheck, bg: "bg-amber-50", color: "text-amber-600" },
  job_posted: { icon: FileText, bg: "bg-sky-50", color: "text-sky-600" },
  offer_sent: { icon: Send, bg: "bg-emerald-50", color: "text-emerald-600" },
  candidate_hired: { icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600" },
};

// ── Funnel bar colors — brand blue scale (from chart-colors.ts) ─────
const FUNNEL_COLORS = CHART_COLORS.funnel;

// ── Quick actions ───────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    label: "Post a Job",
    description: "Create a new job listing with AI screening",
    icon: Briefcase,
    href: "/employer/jobs/create",
    iconBg: "bg-brand-50",
    iconColor: "text-brand-500",
  },
  {
    label: "Review Applicants",
    description: "Screen and rank candidates across roles",
    icon: Eye,
    href: "/employer/candidates",
    iconBg: "bg-accent-50",
    iconColor: "text-accent-600",
  },
  {
    label: "Check Interviews",
    description: "View upcoming and completed interviews",
    icon: Video,
    href: "/employer/interviews",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
];

export default function EmployerDashboardPage() {
  const { data: analyticsData } = useAnalytics();
  const { data: funnelResponse } = useFunnel();
  const { data: employerData } = useEmployer();
  const { data: activityResponse } = useActivityFeed();
  const activityFeed = activityResponse?.data ?? [];

  const apiMetrics = analyticsData?.data || {};
  const company = employerData?.data?.company;
  const MOCK_FUNNEL_DATA = funnelResponse?.data || [];

  const STATS = [
    {
      label: "Active Jobs",
      value: (apiMetrics.totalApplicants as number) > 0 ? "Active" : "0",
      icon: Briefcase,
      iconBg: "bg-brand-50",
      iconColor: "text-brand-500",
      trend: "",
      trendUp: true,
      href: "/employer/jobs",
    },
    {
      label: "Total Applicants",
      value: (apiMetrics.totalApplicants as number) || 0,
      icon: Users,
      iconBg: "bg-accent-50",
      iconColor: "text-accent-600",
      trend: "",
      trendUp: true,
      href: "/employer/candidates",
    },
    {
      label: "Interviews",
      value: (apiMetrics.interviewsConducted as number) || 0,
      icon: Video,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      trend: "",
      trendUp: true,
      href: "/employer/interviews",
    },
    {
      label: "Avg. Time to Hire",
      value: apiMetrics.avgTimeToHire != null ? `${apiMetrics.avgTimeToHire}d` : "—",
      icon: Clock,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      trend: "",
      trendUp: true,
      href: "/employer/analytics",
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-surface-800">
          Welcome back, {company?.name || "Your Company"}
        </h1>
        <p className="mt-1 text-sm text-surface-500">
          Here&apos;s what&apos;s happening with your hiring pipeline
        </p>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {STATS.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-shadow hover:shadow-card-hover">
              <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-5">
                <div className={`hidden sm:block rounded-lg p-2.5 ${stat.iconBg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl sm:text-2xl font-bold text-surface-800">
                    {stat.value}
                  </p>
                  <p className="text-[10px] sm:text-xs text-surface-500">{stat.label}</p>
                </div>
                <div
                  className={`hidden sm:flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    stat.trendUp
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {stat.trendUp ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {stat.trend}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* ── Main grid: chart + activity ────────────────────────────── */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
        {/* Hiring funnel chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Hiring Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={MOCK_FUNNEL_DATA}
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={CHART_COLORS.grid}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="stage"
                    tick={{ fontSize: 11, fill: CHART_COLORS.axisTick }}
                    axisLine={{ stroke: CHART_COLORS.grid }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: CHART_COLORS.axisTick }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: `1px solid ${CHART_COLORS.tooltipBorder}`,
                      boxShadow:
                        "0 4px 6px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.06)",
                      fontSize: "13px",
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                    {MOCK_FUNNEL_DATA.map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={FUNNEL_COLORS[idx % FUNNEL_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent activity feed */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Link
              href="/employer/analytics"
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityFeed.slice(0, 6).map((item) => {
                const cfg = ACTIVITY_ICONS[item.type] || ACTIVITY_ICONS.new_applicant;
                const IconComp = cfg.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.actionUrl}
                    className="flex items-start gap-3 group"
                  >
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}
                    >
                      <IconComp className={`h-3.5 w-3.5 ${cfg.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-surface-700 group-hover:text-surface-900 transition-colors">
                        {item.message}{" "}
                        {item.candidateName && (
                          <span className="font-medium text-surface-800">
                            {item.candidateName}
                          </span>
                        )}
                        {item.candidateName && " — "}
                        <span className="font-medium text-surface-800">
                          {item.jobTitle}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-surface-400">
                        {formatRelativeTime(item.timestamp)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Quick actions + plan ───────────────────────────────────── */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-4 rounded-lg border border-surface-200 p-4 transition-all hover:border-surface-300 hover:shadow-card"
                >
                  <div className={`rounded-lg p-2.5 ${action.iconBg}`}>
                    <action.icon
                      className={`h-5 w-5 ${action.iconColor}`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-surface-800">
                      {action.label}
                    </p>
                    <p className="text-xs text-surface-500">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-surface-400" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Metrics + plan */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-surface-400" />
                  <span className="text-sm text-surface-600">
                    Screening Accuracy
                  </span>
                </div>
                <span className="text-sm font-semibold text-surface-800">
                  {"—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-surface-400" />
                  <span className="text-sm text-surface-600">
                    Offers Extended
                  </span>
                </div>
                <span className="text-sm font-semibold text-surface-800">
                  {(apiMetrics.offersMade as number) || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-surface-400" />
                  <span className="text-sm text-surface-600">
                    Interview Completion
                  </span>
                </div>
                <span className="text-sm font-semibold text-surface-800">
                  78%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-surface-700">
                  Plan
                </span>
                <Badge variant="brand" className="capitalize">
                  {company?.planTier || "starter"}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-surface-500">
                10 active jobs, 500 screenings/mo, 50 AI interviews/mo
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                asChild
              >
                <Link href="/employer/settings">Manage Plan</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
