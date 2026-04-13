"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Bot,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Star,
  TrendingUp,
  MessageSquare,
  Mic,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TranscriptTurn {
  speaker: "ai" | "candidate";
  text: string;
  timestamp: string;
}

interface SkillRating {
  skill: string;
  score: number; // 1-5
  note: string;
}

interface CommunicationScore {
  label: string;
  score: number; // 1-5
  note: string;
}

interface SeekerInterviewReport {
  id: string;
  status: string;
  interviewType: string;
  durationPlanned: number;
  completedAt: string | null;
  jobTitle: string;
  candidateName: string;
  executiveSummary: string | null;
  strengths: string[];
  areasToGrow: string[];
  skillRatings: SkillRating[];
  communicationScores: CommunicationScore[];
  transcript: TranscriptTurn[];
}

// ── Star rating display ───────────────────────────────────────────────────────
function StarBar({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < score ? "fill-amber-400 text-amber-400" : "text-surface-200",
          )}
        />
      ))}
      <span className="ml-1.5 text-[11px] text-surface-500">
        {score}/{max}
      </span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SeekerInterviewReportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [report, setReport] = useState<SeekerInterviewReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/seeker/interviews/${id}`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Failed to load report.");
          return;
        }
        setReport(json.data);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-400" />
            <p className="text-sm text-surface-600">{error || "Report not found."}</p>
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const interviewTypeLabels: Record<string, string> = {
    technical: "Technical Screening",
    behavioral: "Behavioural",
    role_specific: "Role-Specific",
    general: "General",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 py-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="mt-0.5 h-8 w-8 shrink-0"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
              <Bot className="h-4 w-4 text-brand-600" />
            </div>
            <h1 className="text-lg font-semibold text-surface-800">
              AI Interview Report
            </h1>
          </div>
          <p className="mt-0.5 text-sm text-surface-500">{report.jobTitle}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge className="border text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
              <CheckCircle2 className="mr-1 h-2.5 w-2.5" />
              Completed
            </Badge>
            <Badge className="border text-[10px] bg-surface-100 text-surface-600 border-surface-200">
              {interviewTypeLabels[report.interviewType] ?? report.interviewType}
            </Badge>
            <span className="text-[11px] text-surface-400">~{report.durationPlanned} min</span>
          </div>
        </div>
      </div>

      {/* Privacy notice */}
      <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
        <p className="text-xs text-brand-700">
          This report is designed to help you grow. It shows your strengths and areas to develop —
          all hiring decisions are handled separately by the employer.
        </p>
      </div>

      {/* Executive Summary */}
      {report.executiveSummary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-surface-700">Overall Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-surface-700 leading-relaxed">{report.executiveSummary}</p>
          </CardContent>
        </Card>
      )}

      {/* Strengths */}
      {report.strengths.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-surface-700">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Your Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-surface-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Areas to Grow */}
      {report.areasToGrow.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-surface-700">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Areas to Develop
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.areasToGrow.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-surface-600">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Skill Ratings */}
      {report.skillRatings.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-surface-700">
              <Star className="h-4 w-4 text-amber-400" />
              Skill Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.skillRatings.map((sr, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-surface-700">{sr.skill}</span>
                  <StarBar score={sr.score} />
                </div>
                {sr.note && (
                  <p className="text-[11px] text-surface-500 leading-relaxed">{sr.note}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Communication Scores */}
      {report.communicationScores.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-surface-700">
              <Mic className="h-4 w-4 text-brand-500" />
              Communication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.communicationScores.map((cs, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-surface-700">{cs.label}</span>
                  <StarBar score={cs.score} />
                </div>
                {cs.note && (
                  <p className="text-[11px] text-surface-500">{cs.note}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Transcript — collapsed by default */}
      {report.transcript.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <button
              onClick={() => setTranscriptOpen((v) => !v)}
              className="flex w-full items-center justify-between text-left"
            >
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-surface-700">
                <MessageSquare className="h-4 w-4 text-surface-500" />
                Interview Transcript
              </CardTitle>
              {transcriptOpen
                ? <ChevronUp className="h-4 w-4 text-surface-400" />
                : <ChevronDown className="h-4 w-4 text-surface-400" />}
            </button>
          </CardHeader>
          {transcriptOpen && (
            <CardContent>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {report.transcript.map((turn, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-2.5",
                      turn.speaker === "ai" ? "items-start" : "items-start flex-row-reverse",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                        turn.speaker === "ai"
                          ? "bg-brand-100 text-brand-700"
                          : "bg-surface-100 text-surface-600",
                      )}
                    >
                      {turn.speaker === "ai" ? "AI" : "You"}
                    </div>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-xl px-3 py-2 text-xs sm:text-sm leading-relaxed",
                        turn.speaker === "ai"
                          ? "bg-brand-50 text-brand-900"
                          : "bg-surface-100 text-surface-800",
                      )}
                    >
                      {turn.text}
                      {turn.timestamp && (
                        <span className="mt-0.5 block text-[10px] text-surface-400">
                          {turn.timestamp}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      <div className="pb-8" />
    </div>
  );
}
