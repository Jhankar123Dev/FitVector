"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Video,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  TrendingUp,
  ExternalLink,
  BarChart3,
  Send,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import { useInterviews } from "@/hooks/use-interviews";
import type { AIInterview, AIInterviewStatus } from "@/types/employer";
import { AI_INTERVIEW_STATUS_LABELS, AI_RECOMMENDATION_LABELS, AI_RECOMMENDATION_COLORS } from "@/types/employer";

// ── Status badge styling ─────────────────────────────────────────────
const STATUS_VARIANT: Record<AIInterviewStatus, "default" | "success" | "warning" | "destructive" | "brand"> = {
  invited: "brand",
  started: "warning",
  completed: "success",
  expired: "destructive",
  cancelled: "default",
};

const STATUS_ICONS: Record<AIInterviewStatus, React.ElementType> = {
  invited: Send,
  started: Clock,
  completed: CheckCircle2,
  expired: AlertTriangle,
  cancelled: AlertTriangle,
};

// ── Stats computation ────────────────────────────────────────────────
function computeStats(interviews: AIInterview[]) {
  const total = interviews.length;
  const completed = interviews.filter((i) => i.status === "completed");
  const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;
  const avgScore = completed.length > 0
    ? Math.round(completed.reduce((sum, i) => sum + (i.overallScore || 0), 0) / completed.length)
    : 0;
  const flagged = interviews.filter((i) => i.cheatingConfidence === "medium" || i.cheatingConfidence === "high").length;
  return { total, completedCount: completed.length, completionRate, avgScore, flagged };
}

export default function InterviewsPage() {
  const { data: interviewsData, isLoading } = useInterviews();
  const interviews = (interviewsData?.data || []) as unknown as AIInterview[];
  const stats = useMemo(() => computeStats(interviews), [interviews]);

  const filterByTab = (tab: string) => {
    switch (tab) {
      case "pending":
        return interviews.filter((i) => i.status === "invited" || i.status === "started");
      case "completed":
        return interviews.filter((i) => i.status === "completed");
      case "flagged":
        return interviews.filter((i) => i.cheatingConfidence === "medium" || i.cheatingConfidence === "high");
      default:
        return interviews;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-surface-800">
          AI Interviews
        </h1>
        <p className="mt-0.5 text-xs sm:text-sm text-surface-500">
          Track and review AI-conducted candidate interviews
        </p>
      </div>

      {/* ── Stats row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          { label: "Total Interviews", value: stats.total, icon: Video, iconBg: "bg-brand-50", iconColor: "text-brand-500" },
          { label: "Completion Rate", value: `${stats.completionRate}%`, icon: TrendingUp, iconBg: "bg-accent-50", iconColor: "text-accent-600" },
          { label: "Average Score", value: stats.avgScore, icon: BarChart3, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
          { label: "Flagged", value: stats.flagged, icon: AlertTriangle, iconBg: "bg-red-50", iconColor: "text-red-500" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-5">
              <div className={cn("hidden sm:flex rounded-lg p-2.5", stat.iconBg)}>
                <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl sm:text-2xl font-bold text-surface-800">{stat.value}</p>
                <p className="text-[10px] sm:text-xs text-surface-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tabs + Interview list ───────────────────────────────── */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({interviews.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({filterByTab("pending").length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({filterByTab("completed").length})</TabsTrigger>
          <TabsTrigger value="flagged">
            Flagged ({filterByTab("flagged").length})
            {stats.flagged > 0 && <span className="ml-1 h-2 w-2 rounded-full bg-red-500 inline-block" />}
          </TabsTrigger>
        </TabsList>

        {["all", "pending", "completed", "flagged"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            {filterByTab(tab).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                  <Video className="h-10 w-10 text-surface-300" />
                  <p className="mt-3 text-sm font-medium text-surface-600">
                    No {tab === "all" ? "" : tab} interviews
                  </p>
                  <p className="mt-1 text-xs text-surface-400">
                    AI interviews will appear here when candidates are invited.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-surface-200 bg-surface-50">
                        <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">Candidate</th>
                        <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">Job</th>
                        <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">Status</th>
                        <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">Date</th>
                        <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">Score</th>
                        <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">Cheating</th>
                        <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterByTab(tab).map((interview) => (
                        <InterviewRow key={interview.id} interview={interview} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// ── Interview table row ──────────────────────────────────────────────
function InterviewRow({ interview }: { interview: AIInterview }) {
  const initials = interview.applicantName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const StatusIcon = STATUS_ICONS[interview.status];
  const dateStr = interview.completedAt || interview.startedAt || interview.inviteSentAt;

  return (
    <tr className="border-b border-surface-100 transition-colors hover:bg-surface-50">
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-surface-100 text-[10px] sm:text-xs font-semibold text-surface-600">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs sm:text-sm font-medium text-surface-800">
              {interview.applicantName}
            </p>
            <p className="truncate text-[11px] sm:text-xs text-surface-500">
              {interview.applicantRole} @ {interview.applicantCompany}
            </p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <p className="text-xs sm:text-sm text-surface-700">{interview.jobTitle}</p>
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <Badge variant={STATUS_VARIANT[interview.status]} className="gap-1">
          <StatusIcon className="h-3 w-3" />
          {AI_INTERVIEW_STATUS_LABELS[interview.status]}
        </Badge>
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <span className="text-[11px] sm:text-xs text-surface-500">
          {formatRelativeTime(dateStr)}
        </span>
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        {interview.overallScore != null ? (
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 text-[11px] sm:text-xs font-bold",
              interview.overallScore >= 80
                ? "bg-emerald-50 text-emerald-700"
                : interview.overallScore >= 60
                  ? "bg-brand-50 text-brand-700"
                  : interview.overallScore >= 40
                    ? "bg-amber-50 text-amber-700"
                    : "bg-red-50 text-red-700",
            )}
          >
            {interview.overallScore}
          </span>
        ) : (
          <span className="text-xs text-surface-400">—</span>
        )}
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        {interview.cheatingConfidence ? (
          <Badge
            className={cn(
              "border text-[10px] sm:text-[11px] capitalize",
              interview.cheatingConfidence === "low"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : interview.cheatingConfidence === "medium"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-red-50 text-red-700 border-red-200",
            )}
          >
            {interview.cheatingConfidence === "low" ? "Clean" : interview.cheatingConfidence}
          </Badge>
        ) : (
          <span className="text-xs text-surface-400">—</span>
        )}
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center gap-1.5">
          {interview.status === "completed" && (
            <Button variant="outline" size="sm" asChild className="h-7 px-2 text-[11px] sm:text-xs gap-1">
              <Link href={`/employer/interviews/${interview.id}`}>
                <ExternalLink className="h-3 w-3" />
                Report
              </Link>
            </Button>
          )}
          {interview.status === "expired" && (
            <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] sm:text-xs gap-1">
              <RotateCcw className="h-3 w-3" />
              Resend
            </Button>
          )}
          {interview.status === "invited" && (
            <span className="text-[11px] text-surface-400">Awaiting</span>
          )}
          {interview.status === "started" && (
            <span className="text-[11px] text-amber-600 font-medium">In progress</span>
          )}
        </div>
      </td>
    </tr>
  );
}
