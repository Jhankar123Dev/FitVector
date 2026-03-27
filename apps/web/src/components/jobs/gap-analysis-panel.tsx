"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Target,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { JobSearchResult } from "@/types/job";

interface GapAnalysisResult {
  matching_skills: Array<{ skill: string; evidence: string }>;
  missing_skills: Array<{ skill: string; importance: string }>;
  experience_gaps: string[];
  strengths: string[];
  recommendations: string[];
}

interface GapAnalysisPanelProps {
  job: JobSearchResult;
}

const importanceBadge: Record<string, { class: string; label: string }> = {
  critical: { class: "bg-red-100 text-red-700", label: "Critical" },
  important: { class: "bg-yellow-100 text-yellow-700", label: "Important" },
  nice_to_have: { class: "bg-gray-100 text-gray-600", label: "Nice to have" },
};

export function GapAnalysisPanel({ job }: GapAnalysisPanelProps) {
  const [result, setResult] = useState<GapAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const analyze = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs/gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: job.title,
          companyName: job.companyName,
          description: job.description,
          skillsRequired: job.skillsRequired,
          requiredExperienceYears: (job as unknown as Record<string, unknown>).requiredExperienceYears ?? null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Analysis failed");
      }
      const data = await res.json();
      setResult(data.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [job]);

  // Not yet triggered — show button
  if (!result && !loading && !error) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={analyze}
      >
        <Target className="h-3.5 w-3.5" />
        Analyze Gap
      </Button>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="mt-4 rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analyzing your fit for this role...
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
        <p className="text-xs text-red-700">{error}</p>
        <Button variant="ghost" size="sm" className="mt-1 h-7 text-xs" onClick={analyze}>
          Retry
        </Button>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="mt-4 rounded-lg border bg-muted/20">
      {/* Header */}
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Gap Analysis</span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="space-y-4 px-4 pb-4">
          {/* Strengths */}
          {result.strengths.length > 0 && (
            <div>
              <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-green-700">
                <Star className="h-3.5 w-3.5" />
                Your Strengths
              </h4>
              <ul className="space-y-1">
                {result.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-green-700">{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Matching Skills */}
          {result.matching_skills.length > 0 && (
            <div>
              <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Matching Skills ({result.matching_skills.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {result.matching_skills.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
                    title={s.evidence}
                  >
                    {s.skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing Skills */}
          {result.missing_skills.length > 0 && (
            <div>
              <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-700">
                <XCircle className="h-3.5 w-3.5" />
                Skills to Build ({result.missing_skills.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {result.missing_skills.map((s, i) => {
                  const badge = importanceBadge[s.importance] || importanceBadge.nice_to_have;
                  return (
                    <span
                      key={i}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.class}`}
                    >
                      {s.skill}
                      <span className="ml-1 opacity-60">{badge.label}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Experience Gaps */}
          {result.experience_gaps.length > 0 && (
            <div>
              <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-yellow-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                Experience Gaps
              </h4>
              <ul className="space-y-1">
                {result.experience_gaps.map((g, i) => (
                  <li key={i} className="text-xs text-yellow-700">{g}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div>
              <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                <Lightbulb className="h-3.5 w-3.5" />
                Recommendations
              </h4>
              <ol className="list-inside list-decimal space-y-1">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="text-xs text-blue-700">{r}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
