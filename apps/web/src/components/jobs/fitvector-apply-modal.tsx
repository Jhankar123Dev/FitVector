"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";
import type { JobSearchResult } from "@/types/job";
import type { ScreeningAnswer } from "@/types/marketplace";
import {
  MOCK_SEEKER_RESUMES,
  MOCK_AI_SCREENING_ANSWERS,
  MOCK_AI_INTEREST_NOTES,
  FITVECTOR_JOB_POST_MAP,
} from "@/lib/mock/seeker-marketplace-data";
import { MOCK_JOB_POSTS } from "@/lib/mock/employer-data";

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
  const backdropRef = useRef<HTMLDivElement>(null);

  // State
  const [phase, setPhase] = useState<"idle" | "submitting" | "success">("idle");
  const [selectedResumeId, setSelectedResumeId] = useState(
    MOCK_SEEKER_RESUMES[2]?.id || MOCK_SEEKER_RESUMES[0].id,
  );
  const [answers, setAnswers] = useState<ScreeningAnswer[]>(() =>
    MOCK_AI_SCREENING_ANSWERS[job.id] || [],
  );
  const [interestNote, setInterestNote] = useState("");
  const [aiAssistLoading, setAiAssistLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Get screening questions from employer data
  const employerJobPostId = FITVECTOR_JOB_POST_MAP[job.id];
  const employerJobPost = MOCK_JOB_POSTS.find((jp) => jp.id === employerJobPostId);
  const screeningQuestions = employerJobPost?.screeningQuestions || [];

  const selectedResume = MOCK_SEEKER_RESUMES.find((r) => r.id === selectedResumeId);

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

  // Update screening answer
  const updateAnswer = (questionId: string, value: string) => {
    setAnswers((prev) =>
      prev.map((a) => (a.questionId === questionId ? { ...a, answer: value } : a)),
    );
  };

  // AI Assist for interest note
  const handleAiAssist = () => {
    setAiAssistLoading(true);
    setTimeout(() => {
      setInterestNote(MOCK_AI_INTEREST_NOTES[job.id] || "");
      setAiAssistLoading(false);
    }, 1000);
  };

  // Submit
  const handleSubmit = () => {
    setPhase("submitting");
    setTimeout(() => {
      setShowConfetti(true);
      setPhase("success");
      setTimeout(() => setShowConfetti(false), 3000);
    }, 1500);
  };

  // Answered count
  const answeredCount = answers.filter((a) => a.answer.trim()).length;

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
              You applied to <span className="font-medium text-surface-700">{job.title}</span>{" "}
              at <span className="font-medium text-surface-700">{job.companyName}</span>
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
              {/* ── Resume Selector ── */}
              <div>
                <Label className="text-sm font-medium">Resume</Label>
                <p className="mb-2 text-xs text-surface-400">
                  Select which resume to submit with your application
                </p>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="flex-1 rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                  >
                    {MOCK_SEEKER_RESUMES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <Button variant="outline" size="sm" className="shrink-0 gap-1.5 text-xs">
                    <FileText className="h-3 w-3" />
                    Tailor New
                  </Button>
                </div>
              </div>

              {/* ── Screening Questions ── */}
              {screeningQuestions.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Screening Questions</Label>
                  <p className="mb-3 text-xs text-surface-400">
                    AI-suggested answers based on your profile — review and edit as needed
                  </p>
                  <div className="space-y-4">
                    {screeningQuestions.map((q) => {
                      const answer = answers.find((a) => a.questionId === q.id);
                      return (
                        <div key={q.id} className="space-y-1.5">
                          <div className="flex items-start gap-2">
                            <p className="text-sm font-medium text-surface-700">
                              {q.question}
                              {q.required && (
                                <span className="ml-1 text-red-500">*</span>
                              )}
                            </p>
                          </div>

                          {q.type === "short_answer" && (
                            <div className="relative">
                              <Textarea
                                value={answer?.answer || ""}
                                onChange={(e) => updateAnswer(q.id, e.target.value)}
                                rows={3}
                                className="text-sm"
                                placeholder="Your answer..."
                              />
                              {answer?.aiSuggested && answer.answer && (
                                <Badge
                                  className="absolute right-2 top-2 gap-1 bg-accent-50 text-accent-700 hover:bg-accent-100"
                                >
                                  <Sparkles className="h-2.5 w-2.5" />
                                  AI Suggested
                                </Badge>
                              )}
                            </div>
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
                              {answer?.aiSuggested && answer.answer && (
                                <Badge className="gap-1 bg-accent-50 text-accent-700 hover:bg-accent-100">
                                  <Sparkles className="h-2.5 w-2.5" />
                                  AI
                                </Badge>
                              )}
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAiAssist}
                    disabled={aiAssistLoading}
                    className="gap-1.5 text-xs"
                  >
                    {aiAssistLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3 text-brand-500" />
                    )}
                    AI Assist
                  </Button>
                </div>
                <Textarea
                  value={interestNote}
                  onChange={(e) => setInterestNote(e.target.value)}
                  rows={3}
                  className="mt-2 text-sm"
                  placeholder="Tell the employer why you're excited about this role..."
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
                    with resume{" "}
                    <span className="font-medium text-surface-800">
                      {selectedResume?.name}
                    </span>
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

              {/* ── Submit Button ── */}
              <Button
                onClick={handleSubmit}
                disabled={phase === "submitting"}
                className="w-full gap-2 bg-accent-500 text-white hover:bg-accent-600"
              >
                {phase === "submitting" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Submit Application
                  </>
                )}
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
