"use client";

import { useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  TrendingUp,
  Target,
  AlertTriangle,
  ExternalLink,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import { useAssessment, useAssessmentResults } from "@/hooks/use-assessments";
import type { CandidateAssessmentResult } from "@/types/employer";
import {
  ASSESSMENT_TYPE_LABELS,
  DIFFICULTY_LABELS,
  CANDIDATE_ASSESSMENT_STATUS_LABELS,
  CANDIDATE_ASSESSMENT_STATUS_COLORS,
  type AssessmentType,
  type DifficultyLevel,
} from "@/types/employer";

// ── Score distribution buckets ───────────────────────────────────────
function buildDistribution(results: CandidateAssessmentResult[]) {
  const buckets = [
    { range: "0–20", count: 0, fill: "#ef4444" },
    { range: "21–40", count: 0, fill: "#f97316" },
    { range: "41–60", count: 0, fill: "#eab308" },
    { range: "61–80", count: 0, fill: "#6c5ce7" },
    { range: "81–100", count: 0, fill: "#00d97e" },
  ];
  results
    .filter((r) => r.status === "completed")
    .forEach((r) => {
      const idx = Math.min(Math.floor(r.percentage / 20), 4);
      buckets[idx].count += 1;
    });
  return buckets;
}

export default function AssessmentResultsPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const { data: assessmentData } = useAssessment(id);
  const { data: resultsData, isLoading } = useAssessmentResults(id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assessment = assessmentData?.data as any;
  const allResults = (resultsData?.data || []) as unknown as CandidateAssessmentResult[];

  if (!assessment) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-surface-500">Assessment not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/employer/assessments")}>
          Back to Assessments
        </Button>
      </div>
    );
  }

  const completed = allResults.filter((r) => r.status === "completed");
  const avgScore = completed.length > 0
    ? Math.round(completed.reduce((s, r) => s + r.percentage, 0) / completed.length)
    : 0;
  const passRate = completed.length > 0
    ? Math.round((completed.filter((r) => r.passed).length / completed.length) * 100)
    : 0;
  const flagged = allResults.filter((r) => r.proctoringFlags.flagged);
  const distribution = buildDistribution(allResults);

  const filterByTab = (tab: string): CandidateAssessmentResult[] => {
    switch (tab) {
      case "completed":
        return allResults.filter((r) => r.status === "completed");
      case "in_progress":
        return allResults.filter((r) => r.status === "in_progress");
      case "flagged":
        return allResults.filter((r) => r.proctoringFlags.flagged);
      default:
        return allResults;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="mt-0.5 h-8 w-8 shrink-0"
          onClick={() => router.push("/employer/assessments")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-surface-800">
            {assessment.title}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge className="border text-[10px] bg-brand-50 text-brand-700 border-brand-200">
              {ASSESSMENT_TYPE_LABELS[assessment.type as AssessmentType] || assessment.type}
            </Badge>
            <Badge className="border text-[10px] bg-surface-100 text-surface-600 border-surface-200">
              {DIFFICULTY_LABELS[assessment.difficulty as DifficultyLevel] || assessment.difficulty}
            </Badge>
            <span className="text-[11px] text-surface-500 flex items-center gap-1">
              <Clock className="h-3 w-3" /> {assessment.duration} min
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          { label: "Total Candidates", value: allResults.length, icon: Users, iconBg: "bg-brand-50", iconColor: "text-brand-500" },
          { label: "Completed", value: completed.length, icon: CheckCircle2, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
          { label: "Avg Score", value: `${avgScore}%`, icon: TrendingUp, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
          { label: "Pass Rate", value: `${passRate}%`, icon: Target, iconBg: "bg-sky-50", iconColor: "text-sky-600" },
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

      {/* ── Score distribution chart ──────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base">Score Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#78716c" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#a8a29e" }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e7e5e4" }}
                  formatter={(value: number) => [`${value} candidates`, "Count"]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {distribution.map((entry, idx) => (
                    <rect key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── Results table ────────────────────────────────────── */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({allResults.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({filterByTab("in_progress").length})</TabsTrigger>
          <TabsTrigger value="flagged">
            Flagged ({flagged.length})
            {flagged.length > 0 && <span className="ml-1 h-2 w-2 rounded-full bg-red-500 inline-block" />}
          </TabsTrigger>
        </TabsList>

        {["all", "completed", "in_progress", "flagged"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            {filterByTab(tab).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                  <Users className="h-10 w-10 text-surface-300" />
                  <p className="mt-3 text-sm font-medium text-surface-600">No results</p>
                  <p className="mt-1 text-xs text-surface-400">
                    No candidate results match this filter.
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
                        <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">Status</th>
                        <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">Score</th>
                        <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">Time Spent</th>
                        <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">Completed</th>
                        <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[11px] sm:text-xs font-semibold text-surface-600">Proctoring</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterByTab(tab).map((result) => (
                        <ResultRow key={result.id} result={result} passingScore={assessment.passingScore} />
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

// ── Result table row ────────────────────────────────────────────────
function ResultRow({
  result,
  passingScore,
}: {
  result: CandidateAssessmentResult;
  passingScore: number;
}) {
  const initials = result.candidateName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <tr className="border-b border-surface-100 transition-colors hover:bg-surface-50">
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-surface-100 text-[10px] sm:text-xs font-semibold text-surface-600">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs sm:text-sm font-medium text-surface-800">
              {result.candidateName}
            </p>
            <p className="truncate text-[11px] sm:text-xs text-surface-500">
              {result.candidateEmail}
            </p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <Badge className={cn("border text-[10px] sm:text-[11px]", CANDIDATE_ASSESSMENT_STATUS_COLORS[result.status])}>
          {CANDIDATE_ASSESSMENT_STATUS_LABELS[result.status]}
        </Badge>
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        {result.status === "completed" ? (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-[11px] sm:text-xs font-bold",
                result.percentage >= 80
                  ? "bg-emerald-50 text-emerald-700"
                  : result.percentage >= passingScore
                    ? "bg-brand-50 text-brand-700"
                    : result.percentage >= 40
                      ? "bg-amber-50 text-amber-700"
                      : "bg-red-50 text-red-700",
              )}
            >
              {result.percentage}%
            </span>
            <span className="text-[10px] text-surface-400">
              ({result.score}/{result.maxScore})
            </span>
          </div>
        ) : (
          <span className="text-xs text-surface-400">—</span>
        )}
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <span className="text-[11px] sm:text-xs text-surface-500">
          {result.timeSpent != null ? `${result.timeSpent} min` : "—"}
        </span>
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <span className="text-[11px] sm:text-xs text-surface-500">
          {result.completedAt ? formatRelativeTime(result.completedAt) : "—"}
        </span>
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        {result.proctoringFlags.flagged ? (
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            <span className="text-[10px] sm:text-[11px] text-red-600 font-medium">
              {result.proctoringFlags.tabSwitches} tab switches
              {result.proctoringFlags.copyPasteAttempts > 0 && `, ${result.proctoringFlags.copyPasteAttempts} pastes`}
            </span>
          </div>
        ) : (
          <Badge className="border text-[10px] sm:text-[11px] bg-emerald-50 text-emerald-700 border-emerald-200">
            Clean
          </Badge>
        )}
      </td>
    </tr>
  );
}
