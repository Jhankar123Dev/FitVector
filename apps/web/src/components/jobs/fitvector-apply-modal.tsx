"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MatchScoreBadge } from "./match-score-badge";
import {
  X,
  Zap,
  FileText,
  CheckCircle2,
  Sparkles,
  Loader2,
  ArrowRight,
  PartyPopper,
  AlertCircle,
  Info,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";
import { useFitVectorApply, useFitVectorApplications } from "@/hooks/use-fitvector-apply";
import type { JobSearchResult } from "@/types/job";
import type { ScreeningAnswer } from "@/types/marketplace";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ScreeningQuestion {
  id: string;
  question: string;
  type: "short_answer" | "yes_no" | "multiple_choice";
  required: boolean;
}

interface ResumeOption {
  id: string;
  versionName: string;
  jobTitle: string | null;
  companyName: string | null;
}

// ─── Confetti ──────────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  "#6c5ce7", "#00d97e", "#3B82F6", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#14B8A6", "#F97316", "#06B6D4",
];

function ConfettiPiece({ index }: { index: number }) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const left = Math.random() * 100;
  const delay = Math.random() * 0.5;
  const duration = 1.5 + Math.random() * 1;
  const size = 6 + Math.random() * 6;
  const rotation = Math.random() * 360;

  return (
    <div
      className="pointer-events-none fixed z-[60]"
      style={{
        left: `${left}%`,
        top: "-10px",
        width: `${size}px`,
        height: `${size * 0.6}px`,
        backgroundColor: color,
        borderRadius: "2px",
        transform: `rotate(${rotation}deg)`,
        animation: `confettiFall ${duration}s ease-in ${delay}s forwards`,
      }}
    />
  );
}

function ConfettiExplosion() {
  const pieces = Array.from({ length: 35 }, (_, i) => i);
  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0% { opacity: 1; transform: translateY(0) rotate(0deg); }
          100% { opacity: 0; transform: translateY(100vh) rotate(720deg); }
        }
      `}</style>
      {pieces.map((i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </>
  );
}

// ─── Main Modal ────────────────────────────────────────────────────────────

interface FitVectorApplyModalProps {
  job: JobSearchResult;
  onClose: () => void;
  onSubmitted: () => void;
}

export function FitVectorApplyModal({
  job,
  onClose,
  onSubmitted,
}: FitVectorApplyModalProps) {
  const { user } = useUser();
  const fitVectorApply = useFitVectorApply();
  const backdropRef = useRef<HTMLDivElement>(null);

  // The job post ID driving this application — job.jobPostId is the DB row
  const jobPostId = job.jobPostId ?? job.id;

  // Proactively check if already applied (uses cached data if available)
  const { data: myApplications } = useFitVectorApplications();
  const alreadyApplied = (myApplications?.data ?? []).some(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (app: any) => app.jobId === jobPostId || app.employerJobPostId === jobPostId,
  );

  // ── State ─────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<"idle" | "submitting" | "success">("idle");
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [answers, setAnswers] = useState<ScreeningAnswer[]>([]);
  const [interestNote, setInterestNote] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Fetch real resumes ────────────────────────────────────────────────────
  const {
    data: resumes = [],
    isLoading: resumesLoading,
    refetch: refetchResumes,
    isFetching: resumesFetching,
  } = useQuery<ResumeOption[]>({
    queryKey: ["user-resumes-apply"],
    queryFn: async () => {
      const res = await fetch("/api/user/resumes");
      const json = await res.json() as { data?: ResumeOption[] };
      return json.data ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });

  // Auto-select first resume once loaded
  useEffect(() => {
    if (resumes.length > 0 && !selectedResumeId) {
      setSelectedResumeId(resumes[0].id);
    }
  }, [resumes, selectedResumeId]);

  // ── Fetch screening questions ─────────────────────────────────────────────
  const { data: jobPostData, isLoading: questionsLoading } = useQuery<{
    id: string;
    title: string;
    screeningQuestions: ScreeningQuestion[];
  }>({
    queryKey: ["job-post-questions", jobPostId],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/post/${jobPostId}`);
      if (!res.ok) return { id: jobPostId, title: job.title, screeningQuestions: [] };
      const json = await res.json() as { data?: { id: string; title: string; screeningQuestions: ScreeningQuestion[] } };
      return json.data ?? { id: jobPostId, title: job.title, screeningQuestions: [] };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!jobPostId,
  });

  const screeningQuestions = jobPostData?.screeningQuestions ?? [];

  // Gate submit: all required questions must have a non-empty answer
  const requiredAnswered = screeningQuestions
    .filter((q) => q.required)
    .every((q) => {
      const ans = answers.find((a) => a.questionId === q.id);
      return ans && ans.answer.trim().length > 0;
    });

  // Initialise blank answers when questions load
  useEffect(() => {
    if (screeningQuestions.length > 0 && answers.length === 0) {
      setAnswers(
        screeningQuestions.map((q) => ({
          questionId: q.id,
          question: q.question,
          type: q.type,
          answer: "",
          aiSuggested: false,
        })),
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screeningQuestions.length]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const selectedResume = resumes.find((r) => r.id === selectedResumeId);

  function resumeLabel(r: ResumeOption): string {
    if (r.versionName) return r.versionName;
    if (r.jobTitle && r.companyName) return `${r.jobTitle} @ ${r.companyName}`;
    if (r.jobTitle) return r.jobTitle;
    return "Untitled Resume";
  }

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current && phase !== "submitting") {
      onClose();
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "submitting") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose, phase]);

  // Update a single screening answer
  const updateAnswer = (questionId: string, value: string) => {
    setAnswers((prev) =>
      prev.map((a) => (a.questionId === questionId ? { ...a, answer: value } : a)),
    );
  };

  // Submit via real API
  const handleSubmit = async () => {
    setErrorMessage(null);
    setPhase("submitting");
    try {
      await fitVectorApply.mutateAsync({
        jobPostId,
        resumeId: selectedResumeId,
        resumeName: selectedResume ? resumeLabel(selectedResume) : "Resume",
        matchScore: job.matchScore ?? undefined,
        screeningAnswers: answers.map((a) => ({
          questionId: a.questionId,
          question: a.question,
          answer: a.answer,
        })),
        coverNote: interestNote || undefined,
      });
      setShowConfetti(true);
      setPhase("success");
      setTimeout(() => setShowConfetti(false), 3000);
    } catch (err) {
      console.error("Apply failed:", err);
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setErrorMessage(msg);
      setPhase("idle");
    }
  };

  const answeredCount = answers.filter((a) => a.answer.trim()).length;
  const dataLoading = resumesLoading || questionsLoading;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
    >
      {showConfetti && <ConfettiExplosion />}

      <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* ── Success State ── */}
        {phase === "success" ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-50">
              <PartyPopper className="h-8 w-8 text-accent-600" />
            </div>
            <h2 className="text-xl font-semibold text-surface-800">
              Application Submitted!
            </h2>
            <p className="mt-2 text-sm text-surface-500">
              You applied to{" "}
              <span className="font-medium text-surface-700">{job.title}</span>{" "}
              at{" "}
              <span className="font-medium text-surface-700">{job.companyName}</span>
            </p>
            <Badge variant="success" className="mt-3">
              Applied via FitVector
            </Badge>
            <p className="mt-4 text-xs text-surface-400">
              You&apos;ll receive real-time updates as the employer reviews your application.
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onSubmitted();
                  onClose();
                }}
              >
                Continue Browsing
              </Button>
              <Button size="sm" asChild>
                <a href="/dashboard/tracker">
                  Track in Dashboard
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* ── Header ── */}
            <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-accent-500 text-white hover:bg-accent-600">
                    <Zap className="mr-1 h-3 w-3" />
                    FitVector Apply
                  </Badge>
                </div>
                <CardTitle className="mt-2 text-base">{job.title}</CardTitle>
                <p className="mt-0.5 text-sm text-surface-500">{job.companyName}</p>
              </div>
              <div className="flex items-center gap-2">
                <MatchScoreBadge
                  score={job.matchScore}
                  bucket={job.matchBucket}
                  showLabel
                  size="md"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  disabled={phase === "submitting"}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 pb-6">
              {/* ── Loading skeleton ── */}
              {dataLoading && (
                <div className="flex items-center gap-2 py-4 text-sm text-surface-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading application details…
                </div>
              )}

              {!dataLoading && (
                <>
                  {/* ── Resume Selector ── */}
                  <div>
                    <Label className="text-sm font-medium">Resume</Label>
                    <p className="mb-2 text-xs text-surface-400">
                      Select which resume to submit with your application
                    </p>
                    {resumes.length === 0 ? (
                      <p className="text-xs text-surface-400">
                        No resumes found.{" "}
                        <a href="/dashboard/resume" className="text-brand-600 underline">
                          Create one first
                        </a>
                        .
                      </p>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedResumeId}
                            onChange={(e) => setSelectedResumeId(e.target.value)}
                            className="flex-1 rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                          >
                            {resumes.map((r) => (
                              <option key={r.id} value={r.id}>
                                {resumeLabel(r)}
                              </option>
                            ))}
                          </select>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0"
                            title="Refresh resume list"
                            disabled={resumesFetching}
                            onClick={() => refetchResumes()}
                          >
                            <RefreshCw className={cn("h-3.5 w-3.5", resumesFetching && "animate-spin")} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 gap-1.5 text-xs"
                            asChild
                          >
                            <a href="/dashboard/resume" target="_blank" rel="noopener noreferrer">
                              <FileText className="h-3 w-3" />
                              Tailor ↗
                            </a>
                          </Button>
                        </div>
                        <p className="text-[11px] text-surface-400 mt-1">
                          Tailored a new resume in the new tab? Click <RefreshCw className="inline h-2.5 w-2.5" /> to refresh this list.
                        </p>
                      </>
                    )}
                  </div>

                  {/* ── Screening Questions ── */}
                  {screeningQuestions.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Screening Questions</Label>
                      <p className="mb-3 text-xs text-surface-400">
                        Answer the employer&apos;s screening questions
                      </p>
                      <div className="space-y-4">
                        {screeningQuestions.map((q) => {
                          const answer = answers.find((a) => a.questionId === q.id);
                          return (
                            <div key={q.id} className="space-y-1.5">
                              <p className="text-sm font-medium text-surface-700">
                                {q.question}
                                {q.required && (
                                  <span className="ml-1 text-red-500">*</span>
                                )}
                              </p>

                              {q.type === "short_answer" && (
                                <Textarea
                                  value={answer?.answer || ""}
                                  onChange={(e) => updateAnswer(q.id, e.target.value)}
                                  rows={3}
                                  className="text-sm"
                                  placeholder="Your answer…"
                                />
                              )}

                              {q.type === "yes_no" && (
                                <div className="flex gap-3">
                                  {["yes", "no"].map((val) => (
                                    <button
                                      key={val}
                                      onClick={() => updateAnswer(q.id, val)}
                                      className={cn(
                                        "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                                        answer?.answer === val
                                          ? "border-brand-300 bg-brand-50 text-brand-700"
                                          : "border-surface-200 text-surface-500 hover:border-surface-300",
                                      )}
                                    >
                                      {val === "yes" ? "Yes" : "No"}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {screeningQuestions.length === 0 && (
                    <div className="rounded-lg border border-surface-200 bg-surface-50 px-4 py-3">
                      <p className="text-xs text-surface-500">
                        No screening questions for this position
                      </p>
                    </div>
                  )}

                  {/* ── Why I'm Interested ── */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">
                          Why I&apos;m Interested{" "}
                          <span className="font-normal text-surface-400">(optional)</span>
                        </Label>
                        <p className="text-xs text-surface-400">
                          A short note to stand out to the hiring team
                        </p>
                      </div>
                    </div>
                    <Textarea
                      value={interestNote}
                      onChange={(e) => setInterestNote(e.target.value)}
                      rows={3}
                      className="mt-2 text-sm"
                      placeholder="Tell the employer why you're excited about this role…"
                    />
                  </div>

                  {/* ── Review Section ── */}
                  <div className="rounded-lg border border-brand-200 bg-brand-50/50 p-4">
                    <h4 className="text-sm font-semibold text-surface-800">Review</h4>
                    <div className="mt-2 space-y-1.5 text-xs text-surface-600">
                      <p>
                        Applying as{" "}
                        <span className="font-medium text-surface-800">
                          {user?.name || "User"}
                        </span>{" "}
                        {selectedResume && (
                          <>
                            with resume{" "}
                            <span className="font-medium text-surface-800">
                              {resumeLabel(selectedResume)}
                            </span>
                          </>
                        )}
                      </p>
                      <p>
                        Match score:{" "}
                        <span className="font-medium text-surface-800">{job.matchScore}%</span>
                      </p>
                      {screeningQuestions.length > 0 && (
                        <p>
                          Screening questions answered:{" "}
                          <span className="font-medium text-surface-800">
                            {answeredCount} of {screeningQuestions.length}
                          </span>
                        </p>
                      )}
                      {interestNote && (
                        <p className="flex items-center gap-1 text-accent-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Cover note included
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ── Error / Already-Applied Banner ── */}
                  {(alreadyApplied || errorMessage) && (
                    alreadyApplied || errorMessage?.toLowerCase().includes("already applied") ? (
                      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <div className="flex-1 text-sm">
                          <p className="font-medium text-amber-800">Already applied</p>
                          <p className="mt-0.5 text-amber-700">
                            You&apos;ve already submitted an application for this role.{" "}
                            <a
                              href="/dashboard/tracker"
                              className="font-medium underline underline-offset-2 hover:text-amber-900"
                            >
                              Track your application →
                            </a>
                          </p>
                        </div>
                      </div>
                    ) : errorMessage ? (
                      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                        <p className="text-sm text-red-700">{errorMessage}</p>
                      </div>
                    ) : null
                  )}

                  {/* Required questions hint */}
                  {!requiredAnswered && screeningQuestions.some((q) => q.required) && (
                    <p className="text-center text-[11px] text-red-500">
                      Please answer all required questions (*) to continue.
                    </p>
                  )}

                  {/* ── Submit Button ── */}
                  <Button
                    onClick={handleSubmit}
                    disabled={phase === "submitting" || !selectedResumeId || alreadyApplied || !requiredAnswered}
                    className="w-full gap-2 bg-accent-500 text-white hover:bg-accent-600"
                  >
                    {phase === "submitting" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Submit Application
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
