"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Star,
  ChevronDown,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { useInterviews } from "@/hooks/use-interviews";
import type { AIInterview } from "@/types/employer";
import { AI_RECOMMENDATION_LABELS, AI_RECOMMENDATION_COLORS } from "@/types/employer";

const RADAR_COLORS = ["#6c5ce7", "#00d97e", "#f59e0b"];

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "h-3 w-3",
            i <= score ? "fill-amber-400 text-amber-400" : "text-surface-200",
          )}
        />
      ))}
    </div>
  );
}

export default function ComparePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Fetch all interviews and filter to completed
  const { data: interviewsData } = useInterviews("completed");
  const allInterviews = (interviewsData?.data || []) as unknown as AIInterview[];
  const completedInterviews = useMemo(
    () => allInterviews.filter((i) => i.status === "completed" && i.overallScore != null),
    [allInterviews],
  );

  // Parse initial selections from URL
  const initialIds = searchParams.get("ids")?.split(",").filter(Boolean) || [];
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (initialIds.length > 0) return initialIds.slice(0, 3);
    return completedInterviews.slice(0, 2).map((i) => i.id);
  });

  const selected = useMemo(
    () => completedInterviews.filter((i) => selectedIds.includes(i.id)),
    [completedInterviews, selectedIds],
  );

  // Build merged radar data
  const radarData = useMemo(() => {
    if (selected.length === 0) return [];
    // Get all unique skills across selected candidates
    const allSkills = new Set<string>();
    selected.forEach((i) => i.skillRatings.forEach((r) => allSkills.add(r.skill)));

    return Array.from(allSkills).map((skill) => {
      const entry: Record<string, unknown> = { skill: skill.length > 15 ? skill.slice(0, 13) + "…" : skill, fullMark: 5 };
      selected.forEach((i) => {
        const rating = i.skillRatings.find((r) => r.skill === skill);
        entry[i.applicantName] = rating?.score || 0;
      });
      return entry;
    });
  }, [selected]);

  function toggleCandidate(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= 3) return prev; // Max 3
      return [...prev, id];
    });
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="mt-0.5 h-8 w-8 shrink-0"
          onClick={() => router.push("/employer/interviews")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-surface-800">
            Compare Candidates
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-surface-500">
            Side-by-side comparison of AI interview performance (select up to 3)
          </p>
        </div>
      </div>

      {/* ── Candidate selector ────────────────────────────────────── */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <p className="mb-2 text-xs font-medium text-surface-600">Select candidates to compare:</p>
          <div className="flex flex-wrap gap-2">
            {completedInterviews.map((interview) => (
              <button
                key={interview.id}
                onClick={() => toggleCandidate(interview.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  selectedIds.includes(interview.id)
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-surface-200 text-surface-600 hover:border-surface-300",
                  selectedIds.length >= 3 && !selectedIds.includes(interview.id) && "opacity-50 cursor-not-allowed",
                )}
                disabled={selectedIds.length >= 3 && !selectedIds.includes(interview.id)}
              >
                <span className="h-6 w-6 rounded-full bg-surface-100 text-[10px] font-bold flex items-center justify-center text-surface-600">
                  {interview.applicantName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                </span>
                <span className="text-xs sm:text-sm">{interview.applicantName}</span>
                {interview.overallScore != null && (
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    interview.overallScore >= 80 ? "bg-emerald-100 text-emerald-700" : interview.overallScore >= 60 ? "bg-brand-100 text-brand-700" : "bg-amber-100 text-amber-700",
                  )}>
                    {interview.overallScore}
                  </span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selected.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-sm text-surface-500">Select at least one candidate to compare.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Radar chart overlay ──────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm sm:text-base">Skill Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] sm:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="65%">
                    <PolarGrid stroke="#e7e5e4" />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: "#78716c" }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 9, fill: "#a8a29e" }} tickCount={6} />
                    {selected.map((interview, idx) => (
                      <Radar
                        key={interview.id}
                        name={interview.applicantName}
                        dataKey={interview.applicantName}
                        stroke={RADAR_COLORS[idx]}
                        fill={RADAR_COLORS[idx]}
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                    ))}
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* ── Side-by-side candidate cards ─────────────────────── */}
          <div className={cn(
            "grid gap-4 sm:gap-6",
            selected.length === 1 && "grid-cols-1",
            selected.length === 2 && "grid-cols-1 md:grid-cols-2",
            selected.length === 3 && "grid-cols-1 md:grid-cols-3",
          )}>
            {selected.map((interview) => (
              <CandidateCompareCard key={interview.id} interview={interview} />
            ))}
          </div>

          {/* ── Advance Selected ──────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button className="gap-1.5">
              <ArrowRight className="h-3.5 w-3.5" />
              Advance Selected to Human Interview
            </Button>
            <Button variant="outline" className="gap-1.5">
              <ArrowRight className="h-3.5 w-3.5" />
              Advance to Assessment
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Candidate comparison card ────────────────────────────────────────
function CandidateCompareCard({ interview }: { interview: AIInterview }) {
  const initials = interview.applicantName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const scoreColor =
    (interview.overallScore || 0) >= 80
      ? "text-emerald-600"
      : (interview.overallScore || 0) >= 60
        ? "text-brand-600"
        : (interview.overallScore || 0) >= 40
          ? "text-amber-600"
          : "text-red-600";

  return (
    <Card>
      <CardContent className="space-y-4 p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-100 text-sm font-bold text-surface-600">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-surface-800">
              {interview.applicantName}
            </p>
            <p className="truncate text-xs text-surface-500">
              {interview.applicantRole} @ {interview.applicantCompany}
            </p>
          </div>
          <span className={cn("text-2xl font-bold", scoreColor)}>
            {interview.overallScore}
          </span>
        </div>

        {/* Recommendation badge */}
        {interview.aiRecommendation && (
          <Badge
            className={cn(
              "border text-xs font-semibold",
              AI_RECOMMENDATION_COLORS[interview.aiRecommendation],
            )}
          >
            {AI_RECOMMENDATION_LABELS[interview.aiRecommendation]}
          </Badge>
        )}

        {/* Skill breakdown */}
        <div>
          <p className="mb-2 text-xs font-semibold text-surface-500">Skills</p>
          <div className="space-y-2">
            {interview.skillRatings.map((r) => (
              <div key={r.skill} className="flex items-center justify-between">
                <span className="text-xs text-surface-700 truncate mr-2">{r.skill}</span>
                <StarRating score={r.score} />
              </div>
            ))}
          </div>
        </div>

        {/* Strengths */}
        <div>
          <p className="mb-1.5 text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Strengths
          </p>
          <ul className="space-y-1">
            {interview.strengths.slice(0, 3).map((s, i) => (
              <li key={i} className="text-[11px] text-surface-600 line-clamp-2">
                • {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Concerns */}
        <div>
          <p className="mb-1.5 text-xs font-semibold text-amber-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Concerns
          </p>
          <ul className="space-y-1">
            {interview.concerns.slice(0, 3).map((c, i) => (
              <li key={i} className="text-[11px] text-surface-600 line-clamp-2">
                • {c}
              </li>
            ))}
          </ul>
        </div>

        {/* Cheating flag */}
        {interview.cheatingConfidence && interview.cheatingConfidence !== "low" && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="text-[11px] text-amber-700">
              Cheating risk: <strong className="capitalize">{interview.cheatingConfidence}</strong>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
