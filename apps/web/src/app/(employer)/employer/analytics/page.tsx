"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Video,
  Send,
  UserCheck,
  Clock,
  DollarSign,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { cn } from "@/lib/utils";
import type { AnalyticsDateRange } from "@/types/employer";
import { SOURCE_LABELS } from "@/types/employer";
import { useAnalytics, useFunnel, useSources } from "@/hooks/use-analytics";
import {
  MOCK_TIME_TO_HIRE_TREND,
  MOCK_JOB_PERFORMANCE,
  MOCK_INTERVIEWER_PERFORMANCE,
} from "@/lib/mock/analytics-data";

// ── Funnel colors (gradient from brand to emerald) ──────────────────
const FUNNEL_COLORS = ["#6c5ce7", "#7c6cf7", "#8b7ff7", "#4ade80", "#22c55e", "#16a34a", "#059669"];

const DATE_RANGE_OPTIONS: { value: AnalyticsDateRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<AnalyticsDateRange>("30d");

  // Real data from API
  const { data: analyticsData, isLoading: metricsLoading } = useAnalytics(dateRange === "custom" ? "90d" : dateRange);
  const { data: funnelData } = useFunnel();
  const { data: sourcesData } = useSources();

  // Map API response to expected shape
  const apiMetrics = analyticsData?.data || {};
  const metrics = {
    totalApplicants: (apiMetrics.totalApplicants as number) || 0,
    interviewsConducted: (apiMetrics.interviewsConducted as number) || 0,
    offersMade: (apiMetrics.offersMade as number) || 0,
    hires: (apiMetrics.hires as number) || 0,
    avgTimeToHire: apiMetrics.avgTimeToHire != null ? `${apiMetrics.avgTimeToHire} days` : null,
    costPerHire: null,
  };

  // No previous period comparison from API — use null for now
  const prevMetrics = metrics;

  function trendPct(current: number, previous: number): { value: string; up: boolean } | null {
    if (previous === 0) return null;
    const pct = Math.round(((current - previous) / previous) * 100);
    return { value: `${pct > 0 ? "+" : ""}${pct}%`, up: pct >= 0 };
  }

  const downloadCSV = useCallback(() => {
    const rows = [
      ["Metric", "Value"],
      ["Total Applicants", String(metrics.totalApplicants)],
      ["Interviews Conducted", String(metrics.interviewsConducted)],
      ["Offers Made", String(metrics.offersMade)],
      ["Hires", String(metrics.hires)],
      ["Avg Time to Hire (days)", metrics.avgTimeToHire != null ? String(metrics.avgTimeToHire) : "N/A"],
      ["Cost per Hire (INR)", metrics.costPerHire != null ? String(metrics.costPerHire) : "N/A"],
      [""],
      ["Hiring Funnel"],
      ["Stage", "Count", "Conversion Rate"],
      ...(funnelData?.data || []).map((s) => [s.stage, String(s.count), s.conversionRate != null ? `${s.conversionRate}%` : ""]),
      [""],
      ["Source Analysis"],
      ["Source", "Count", "Avg Score"],
      ...(sourcesData?.data || []).map((s) => [s.source, String(s.count), String(s.avgScore)]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-report-${dateRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [metrics, dateRange]);

  const statCards = [
    { label: "Total Applicants", value: metrics.totalApplicants, icon: Users, iconBg: "bg-brand-50", iconColor: "text-brand-500", trend: trendPct(metrics.totalApplicants, prevMetrics.totalApplicants) },
    { label: "Interviews", value: metrics.interviewsConducted, icon: Video, iconBg: "bg-accent-50", iconColor: "text-accent-600", trend: trendPct(metrics.interviewsConducted, prevMetrics.interviewsConducted) },
    { label: "Offers Made", value: metrics.offersMade, icon: Send, iconBg: "bg-amber-50", iconColor: "text-amber-600", trend: trendPct(metrics.offersMade, prevMetrics.offersMade) },
    { label: "Hires", value: metrics.hires, icon: UserCheck, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", trend: trendPct(metrics.hires, prevMetrics.hires) },
    { label: "Avg Time-to-Hire", value: metrics.avgTimeToHire != null ? `${metrics.avgTimeToHire}d` : "—", icon: Clock, iconBg: "bg-sky-50", iconColor: "text-sky-600", trend: null },
    { label: "Cost/Hire", value: metrics.costPerHire != null ? `₹${(metrics.costPerHire / 1000).toFixed(0)}K` : "—", icon: DollarSign, iconBg: "bg-rose-50", iconColor: "text-rose-600", trend: null },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-surface-800">
            Analytics
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-surface-500">
            Hiring performance and insights
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Date range picker */}
          <div className="flex rounded-lg border border-surface-200 overflow-hidden">
            {DATE_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDateRange(opt.value)}
                className={cn(
                  "px-3 py-1.5 text-[11px] sm:text-xs font-medium transition-colors",
                  dateRange === opt.value
                    ? "bg-brand-500 text-white"
                    : "bg-white text-surface-600 hover:bg-surface-50",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={downloadCSV}>
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* ── Row 1: Key metrics ────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={cn("flex rounded-md p-1.5", stat.iconBg)}>
                  <stat.icon className={cn("h-3.5 w-3.5", stat.iconColor)} />
                </div>
              </div>
              <p className="text-lg sm:text-xl font-bold text-surface-800">{stat.value}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[10px] sm:text-[11px] text-surface-500">{stat.label}</p>
                {stat.trend && (
                  <span className={cn("text-[10px] font-semibold", stat.trend.up ? "text-emerald-600" : "text-red-500")}>
                    {stat.trend.value}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Row 2: Hiring funnel ──────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base">Hiring Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Custom funnel visualization */}
          <div className="space-y-2">
            {(funnelData?.data || []).map((stage, i) => {
              const maxCount = (funnelData?.data || [])[0].count;
              const widthPct = maxCount > 0 ? Math.max((stage.count / maxCount) * 100, 8) : 8;
              return (
                <div key={stage.stage} className="flex items-center gap-3">
                  <div className="w-[100px] sm:w-[130px] shrink-0 text-right">
                    <p className="text-[11px] sm:text-xs font-medium text-surface-700">{stage.stage}</p>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div
                      className="h-8 rounded-md flex items-center justify-end pr-2 transition-all"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: FUNNEL_COLORS[i] || FUNNEL_COLORS[0],
                        minWidth: 40,
                      }}
                    >
                      <span className="text-[11px] font-bold text-white">{stage.count}</span>
                    </div>
                    {stage.conversionRate != null && (
                      <span className="text-[10px] text-surface-400 shrink-0">
                        {stage.conversionRate}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-surface-400">
            <ArrowRight className="h-3 w-3" />
            Percentages show conversion rate from previous stage
          </div>
        </CardContent>
      </Card>

      {/* ── Row 3: Charts side by side ────────────────────────── */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Source Analysis */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base">Source Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] sm:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(sourcesData?.data || []).map((s) => ({ ...s, name: s.source }))} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#78716c" }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#a8a29e" }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#a8a29e" }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e7e5e4" }} />
                  <Bar yAxisId="left" dataKey="count" name="Candidates" fill="#6c5ce7" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="avgScore" name="Avg Score" fill="#00d97e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Time-to-Hire Trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base">Time-to-Hire Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] sm:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOCK_TIME_TO_HIRE_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#78716c" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#a8a29e" }} domain={[0, 25]} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e7e5e4" }}
                    formatter={(value: number) => [`${value} days`, "Time to Hire"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="days"
                    stroke="#6c5ce7"
                    strokeWidth={2.5}
                    dot={{ fill: "#6c5ce7", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: Tables side by side ────────────────────────── */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Job Performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base">Job Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[450px]">
                <thead>
                  <tr className="border-b border-surface-200 bg-surface-50">
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-surface-600">Job</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-surface-600">Applicants</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-surface-600">Screen %</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-surface-600">Interview %</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-surface-600">Hired</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_JOB_PERFORMANCE.map((job) => (
                    <tr key={job.jobId} className="border-b border-surface-100 hover:bg-surface-50">
                      <td className="px-3 py-2">
                        <span className="text-xs font-medium text-surface-800 line-clamp-1">{job.title}</span>
                      </td>
                      <td className="px-3 py-2 text-xs text-surface-600">{job.applicants}</td>
                      <td className="px-3 py-2">
                        <span className={cn(
                          "text-xs font-semibold",
                          job.screenRate >= 75 ? "text-emerald-600" : job.screenRate >= 60 ? "text-brand-600" : "text-amber-600",
                        )}>
                          {job.screenRate}%
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={cn(
                          "text-xs font-semibold",
                          job.interviewRate >= 40 ? "text-emerald-600" : job.interviewRate >= 25 ? "text-brand-600" : "text-amber-600",
                        )}>
                          {job.interviewRate}%
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-surface-600">{job.hired}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Interviewer Performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base">Interviewer Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="border-b border-surface-200 bg-surface-50">
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-surface-600">Interviewer</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-surface-600">Interviews</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-surface-600">Avg Feedback</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-surface-600">Calibration</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_INTERVIEWER_PERFORMANCE.map((ip) => (
                    <tr key={ip.memberId} className="border-b border-surface-100 hover:bg-surface-50">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-100 text-[9px] font-bold text-surface-600">
                            {ip.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                          </div>
                          <span className="text-xs font-medium text-surface-800">{ip.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-surface-600">{ip.interviewsDone}</td>
                      <td className="px-3 py-2">
                        <span className={cn(
                          "text-xs font-semibold",
                          ip.avgFeedbackTime <= 2 ? "text-emerald-600" : ip.avgFeedbackTime <= 4 ? "text-amber-600" : "text-red-500",
                        )}>
                          {ip.avgFeedbackTime}h
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold",
                          ip.calibrationScore >= 85 ? "bg-emerald-50 text-emerald-700" :
                          ip.calibrationScore >= 70 ? "bg-brand-50 text-brand-700" :
                          "bg-amber-50 text-amber-700",
                        )}>
                          {ip.calibrationScore}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
