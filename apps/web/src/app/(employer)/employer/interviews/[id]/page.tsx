"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
  XCircle,
  Download,
  Users,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Search,
  Play,
  Pause,
  Star,
  Shield,
  MessageSquare,
  Brain,
  Volume2,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { useInterview } from "@/hooks/use-interviews";
import { CHART_COLORS } from "@/lib/chart-colors";
import type { AIInterview } from "@/types/employer";
import {
  AI_RECOMMENDATION_LABELS,
  AI_RECOMMENDATION_COLORS,
  CHEATING_CONFIDENCE_COLORS,
} from "@/types/employer";

// ── Circular progress component ──────────────────────────────────────
function CircularProgress({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80 ? CHART_COLORS.scoreHigh
    : score >= 60 ? CHART_COLORS.scoreMid
    : score >= 40 ? CHART_COLORS.scoreWarn
    : CHART_COLORS.scoreLow;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={CHART_COLORS.svgTrack} strokeWidth="8" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl sm:text-3xl font-bold text-foreground">{score}</span>
        <span className="text-[10px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

// ── Star rating component ────────────────────────────────────────────
function StarRating({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i <= score ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}

export default function InterviewReportPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const { data: interviewData, isLoading } = useInterview(interviewId);
  const interview = interviewData?.data as unknown as AIInterview | undefined;

  // ── All hooks MUST be called unconditionally — before any early return ──
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);
  const [transcriptSearch, setTranscriptSearch] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  const radarData = useMemo(
    () =>
      (interview?.skillRatings ?? []).map((r) => ({
        skill: r.skill.length > 15 ? r.skill.slice(0, 13) + "…" : r.skill,
        score: r.score,
        fullMark: 5,
      })),
    [interview?.skillRatings],
  );

  const filteredTranscript = useMemo(() => {
    if (!interview?.transcript) return [];
    if (!transcriptSearch.trim()) return interview.transcript;
    const q = transcriptSearch.toLowerCase();
    return interview.transcript.filter((t) => t.text.toLowerCase().includes(q));
  }, [interview?.transcript, transcriptSearch]);

  // ── Early returns AFTER all hooks ──────────────────────────────────────
  if (isLoading || !interview) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!interview.overallScore) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground/40" />
        <p className="mt-3 text-lg font-medium text-muted-foreground">Interview Not Completed</p>
        <p className="mt-1 text-sm text-muted-foreground/60">This interview report is not available yet.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/employer/interviews")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Interviews
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">
              AI Interview Report
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
              {interview.applicantName} — {interview.jobTitle}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground/60">
              {interview.completedAt
                ? new Date(interview.completedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
              {interview.durationActual && ` · ${interview.durationActual} min`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Score + Recommendation */}
          <CircularProgress score={interview.overallScore} size={90} />
          {interview.aiRecommendation && (
            <Badge
              className={cn(
                "border px-3 py-1.5 text-xs sm:text-sm font-semibold",
                AI_RECOMMENDATION_COLORS[interview.aiRecommendation],
              )}
            >
              {AI_RECOMMENDATION_LABELS[interview.aiRecommendation]}
            </Badge>
          )}
        </div>
      </div>

      {/* ── Section 1: Executive Summary ──────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Brain className="h-4 w-4 text-brand-500" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground/80">
            {interview.executiveSummary}
          </p>
        </CardContent>
      </Card>

      {/* ── Section 2: Skill Ratings ──────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base">Skill Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Radar chart */}
            {radarData.length > 0 && (
              <div className="h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke={CHART_COLORS.grid} />
                    <PolarAngleAxis
                      dataKey="skill"
                      tick={{ fontSize: 10, fill: CHART_COLORS.axisTick }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 5]}
                      tick={{ fontSize: 9, fill: CHART_COLORS.axisTickMuted }}
                      tickCount={6}
                    />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke={CHART_COLORS.primary}
                      fill={CHART_COLORS.primary}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Skill table */}
            <div className="space-y-3">
              {interview.skillRatings.map((r) => (
                <div key={r.skill} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{r.skill}</span>
                    <StarRating score={r.score} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{r.justification}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Sections 3 & 4: Strengths + Concerns ──────────────────── */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {interview.strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-foreground/80">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Areas of Concern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {interview.concerns.map((c, i) => (
                <li key={i} className="flex gap-2 text-sm text-foreground/80">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {c}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* ── Section 5: Cheating Assessment ─────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Shield className="h-4 w-4 text-muted-foreground" />
            Cheating Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
            {interview.cheatingConfidence && (
              <Badge
                className={cn(
                  "border px-3 py-1.5 text-sm font-semibold capitalize shrink-0",
                  CHEATING_CONFIDENCE_COLORS[interview.cheatingConfidence],
                )}
              >
                {interview.cheatingConfidence === "low" ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Low Risk — Clean
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {interview.cheatingConfidence} Risk
                  </span>
                )}
              </Badge>
            )}
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{interview.cheatingNote}</p>
              {interview.cheatingSignals.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground">Detected Signals:</p>
                  {interview.cheatingSignals.map((sig, i) => (
                    <div key={i} className="flex gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                      {sig}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 6: Communication ──────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base">Communication Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {interview.communicationScores.map((cs) => (
              <div key={cs.label} className="rounded-lg border border-border p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm font-medium text-foreground">{cs.label}</p>
                  <span
                    className={cn(
                      "text-lg sm:text-xl font-bold",
                      cs.score >= 4 ? "text-emerald-600" : cs.score >= 3 ? "text-brand-600" : "text-amber-600",
                    )}
                  >
                    {cs.score}/5
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] sm:text-xs text-muted-foreground">{cs.note}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Section 7: Full Transcript ─────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-sm sm:text-base">
              Full Transcript ({interview.transcript.length} turns)
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  placeholder="Search transcript..."
                  value={transcriptSearch}
                  onChange={(e) => setTranscriptSearch(e.target.value)}
                  className="h-8 w-48 pl-8 text-xs"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 h-8 text-xs"
                onClick={() => setTranscriptExpanded(!transcriptExpanded)}
              >
                {transcriptExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
                {transcriptExpanded ? "Collapse" : "Expand"}
              </Button>
            </div>
          </div>
        </CardHeader>
        {transcriptExpanded && (
          <CardContent>
            <div className="max-h-[500px] space-y-3 overflow-y-auto pr-2">
              {filteredTranscript.map((turn, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-lg p-3",
                    turn.speaker === "ai"
                      ? "bg-muted/40 border border-border"
                      : "bg-white border border-border",
                  )}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[10px] font-semibold uppercase tracking-wider",
                        turn.speaker === "ai" ? "text-muted-foreground/60" : "text-brand-500",
                      )}
                    >
                      {turn.speaker === "ai" ? "AI Interviewer" : interview.applicantName}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">{turn.timestamp}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/80">{turn.text}</p>
                </div>
              ))}
              {filteredTranscript.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground/60">
                  No transcript matches for &ldquo;{transcriptSearch}&rdquo;
                </p>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── Section 8: Audio Playback ──────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            Audio Recording
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Play/pause */}
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </Button>

            {/* Timeline */}
            <div className="flex flex-1 items-center gap-3">
              <span className="text-xs text-muted-foreground tabular-nums w-10">
                {Math.floor(playbackProgress * (interview.durationActual || 20))}:00
              </span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setPlaybackProgress((e.clientX - rect.left) / rect.width);
                }}
              >
                <div
                  className="h-full bg-brand-500 rounded-full transition-all"
                  style={{ width: `${playbackProgress * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums w-10">
                {interview.durationActual || 20}:00
              </span>
            </div>

            {/* Speed controls */}
            <div className="flex items-center gap-1">
              {[1, 1.5, 2].map((speed) => (
                <button
                  key={speed}
                  className={cn(
                    "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                    playbackSpeed === speed
                      ? "bg-brand-50 text-brand-700"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                  onClick={() => setPlaybackSpeed(speed)}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground/60">
            Mock audio player — actual audio playback will be available when connected to the backend.
          </p>
        </CardContent>
      </Card>

      {/* ── Section 9: Compare button ──────────────────────────────── */}
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-6 sm:flex-row sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground/80">Compare with other candidates</p>
            <p className="text-xs text-muted-foreground">
              Side-by-side comparison of interview performance
            </p>
          </div>
          <Button variant="outline" asChild className="gap-1.5">
            <Link href={`/employer/interviews/compare?ids=${interview.id}`}>
              <Users className="h-4 w-4" />
              Compare Candidates
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* ── Action bar ─────────────────────────────────────────────── */}
      <div className="sticky bottom-0 -mx-3 sm:-mx-4 md:-mx-6 border-t border-border bg-background px-3 py-3 sm:px-4 sm:py-4 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button className="gap-1.5 h-9 text-sm">
              <ArrowRight className="h-3.5 w-3.5" />
              Advance to Human Interview
            </Button>
            <Button variant="outline" className="gap-1.5 h-9 text-sm">
              <ArrowRight className="h-3.5 w-3.5" />
              Advance to Assessment
            </Button>
            <Button
              variant="outline"
              className="gap-1.5 h-9 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <XCircle className="h-3.5 w-3.5" />
              Reject
            </Button>
          </div>
          <Button variant="outline" className="gap-1.5 h-9 text-sm">
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download Report as PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
