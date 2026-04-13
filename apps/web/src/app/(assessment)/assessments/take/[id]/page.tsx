"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useProctoringTracker } from "@/hooks/use-proctoring-tracker";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Code2,
  Play,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssessmentQuestion } from "@/types/employer";
import { QUESTION_TYPE_LABELS } from "@/types/employer";

// ── Monaco Editor — SSR disabled (browser-only API, Next.js SSR would crash) ──
const MonacoEditor = dynamic(
  () => import("@monaco-editor/react"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full rounded-lg bg-[#1e1e1e] flex items-center justify-center">
        <div className="flex items-center gap-2 text-zinc-500 text-sm">
          <div className="h-4 w-4 animate-spin rounded-full border border-zinc-600 border-t-zinc-400" />
          Loading editor…
        </div>
      </div>
    ),
  },
);

// ── Language identifier map: our keys → Monaco grammar names ──────────────
// Maps stored codeLanguage keys (incl. aliases) → Monaco language IDs
const MONACO_LANG: Record<string, string> = {
  python3:    "python",
  python:     "python",
  nodejs:     "javascript",
  javascript: "javascript",
  java:       "java",
  cpp17:      "cpp",
  "c++":      "cpp",
  cpp:        "cpp",
  go:         "go",
  typescript: "typescript",
  ts:         "typescript",
};

// Human-readable labels for the language badge
const LANG_LABEL: Record<string, string> = {
  python3:    "Python",
  python:     "Python",
  nodejs:     "JavaScript",
  javascript: "JavaScript",
  java:       "Java",
  cpp17:      "C++",
  "c++":      "C++",
  cpp:        "C++",
  go:         "Go",
  typescript: "TypeScript",
};

// Client-side language alias normaliser (mirrors jdoodle.ts but without Node imports)
const LANG_CANONICAL: Record<string, string> = {
  "c++":        "cpp17",
  "cpp":        "cpp17",
  "cpp14":      "cpp17",
  "javascript": "nodejs",
  "js":         "nodejs",
  "python":     "python3",
  "py":         "python3",
  "ts":         "typescript",
};
function canonicalLang(lang: string): string {
  return LANG_CANONICAL[lang.toLowerCase()] ?? lang.toLowerCase();
}

// Minimal starter code shown when the question has no starterCodeMap
const DEFAULT_STARTER: Record<string, string> = {
  nodejs: `// Write your solution here\nfunction solution() {\n\n}\n`,
  javascript: `// Write your solution here\nfunction solution() {\n\n}\n`,
  python3: `# Write your solution here\ndef solution():\n    pass\n`,
  python: `# Write your solution here\ndef solution():\n    pass\n`,
  java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write your solution here\n    }\n}\n`,
  cpp17: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n    // Write your solution here\n}\n`,
  typescript: `// Write your solution here\nfunction solution(): void {\n\n}\n`,
};

// ── Shared Monaco options (defined outside component — stable reference) ──
const MONACO_OPTIONS = {
  minimap:                  { enabled: false },
  fontSize:                 14,
  lineNumbers:              "on" as const,
  bracketPairColorization:  { enabled: true },
  autoClosingBrackets:      "always" as const,
  autoClosingQuotes:        "always" as const,
  autoIndent:               "full" as const,
  tabSize:                  2,
  wordWrap:                 "on" as const,
  scrollBeyondLastLine:     false,
  padding:                  { top: 16, bottom: 16 },
  renderLineHighlight:      "all" as const,
  smoothScrolling:          true,
  cursorBlinking:           "smooth" as const,
};

// ── Run result type — expectedOutput intentionally absent (never sent to client) ──
interface RunResult {
  input:       string;
  actualOutput: string;
  passed:      boolean;
  error?:      string;
}

type ViewState = "loading" | "intro" | "test" | "confirm" | "results";

interface AssessmentData {
  id:               string;
  status:           string;
  startedAt:        string | null;
  candidateName:    string;
  assessmentName:   string;
  assessmentType:   string;
  jobTitle:         string;
  timeLimitMinutes: number | null;
  difficulty:       string | null;
  passingScore:     number | null;
  questions:        AssessmentQuestion[];
  settings:         Record<string, unknown>;
  questionCount:    number;
  expiresAt?:       string | null;
}

export default function TakeAssessmentPage() {
  const { id } = useParams<{ id: string }>();

  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const [view, setView]                     = useState<ViewState>("loading");
  const [currentQ, setCurrentQ]             = useState(0);
  const [answers, setAnswers]               = useState<Record<string, string>>({});
  const [flagged, setFlagged]               = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft]             = useState(0);
  const [submitResult, setSubmitResult]     = useState<Record<string, unknown> | null>(null);
  const [loadError, setLoadError]           = useState("");

  // Run results: keyed by question id — no expectedOutput stored client-side
  const [runResults, setRunResults]     = useState<Record<string, RunResult[]>>({});
  const [runningQId, setRunningQId]     = useState<string | null>(null);
  const [runError, setRunError]         = useState<Record<string, string>>({});

  // Fetch assessment data
  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch(`/api/assessment/${id}`);
        const json = await res.json();

        if (res.status === 410) {
          setLoadError(json.error || "This assessment link has expired.");
          return;
        }
        if (!res.ok) {
          setLoadError(json.error || "Assessment not available");
          return;
        }

        setAssessmentData(json.data);
        if (json.data.status === "started") {
          setTimeLeft((json.data.timeLimitMinutes || 30) * 60);
          setView("test");
        } else {
          setView("intro");
        }
      } catch {
        setLoadError("Failed to load assessment");
      }
    }
    load();
  }, [id]);

  const assessment = assessmentData
    ? {
        id:          assessmentData.id,
        title:       assessmentData.assessmentName,
        type:        assessmentData.assessmentType,
        difficulty:  assessmentData.difficulty  || "medium",
        duration:    assessmentData.timeLimitMinutes || 30,
        passingScore: assessmentData.passingScore || 60,
        questions:   assessmentData.questions,
        status:      "active",
        settings:    assessmentData.settings,
        expiresAt:   assessmentData.expiresAt,
      }
    : null;

  const proctoring = (assessment?.settings as Record<string, Record<string, boolean>>)?.proctoring ?? {};
  const { tabSwitches, copyPasteAttempts, proctoringWarning, dismissWarning, getProctoringData } =
    useProctoringTracker({
      sessionId:        id,
      enabled:          view === "test",
      trackTabSwitches: proctoring.tabSwitchDetection !== false,
      trackCopyPaste:   proctoring.copyPasteDetection !== false,
      persistToStorage: true,
    });

  // Suppress unused-variable warnings — these are consumed by the proctoring hook
  void tabSwitches;
  void copyPasteAttempts;

  useEffect(() => {
    if (assessment && view === "intro") setTimeLeft((assessment.duration || 30) * 60);
  }, [assessment, view]);

  useEffect(() => {
    if (view !== "test") return;
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [view, timeLeft]);

  const formatTime = useCallback((s: number) => {
    const m   = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }, []);

  const questions = assessment?.questions ?? [];

  const score = useMemo(() => {
    if (view !== "results") return null;
    let earned = 0;
    let max    = 0;
    questions.forEach((q) => {
      max += q.points;
      const ans = answers[q.id];
      if (ans && ans === q.correctAnswer) earned += q.points;
      else if (ans && q.type === "short_answer") earned += Math.round(q.points * 0.5);
      else if (ans && q.type === "code")         earned += Math.round(q.points * 0.4);
    });
    const pct = max > 0 ? Math.round((earned / max) * 100) : 0;
    return { earned, max, pct, passed: pct >= (assessment?.passingScore ?? 60) };
  }, [view, questions, answers, assessment?.passingScore]);

  // ── Loading / error states ──────────────────────────────────────────────────
  if (view === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (loadError || !assessment) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
            <p className="text-sm text-surface-600">{loadError || "Assessment not found."}</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/tests">← Back to My Tests</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question    = questions[currentQ];
  const totalPoints = questions.reduce((s, q) => s + q.points, 0);

  function setAnswer(qId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  }

  // Pre-populate starter code the first time a code question is rendered.
  // Priority: saved answer → starterCodeMap[canonical] → DEFAULT_STARTER[canonical] → ""
  function getAnswerWithStarter(q: AssessmentQuestion): string {
    const existing = answers[q.id];
    if (existing !== undefined) return existing;
    if (q.type !== "code") return "";

    const lang    = canonicalLang(q.codeLanguage ?? "nodejs");
    const starter = q.starterCodeMap
      ? (q.starterCodeMap[lang] ?? q.starterCodeMap[q.codeLanguage ?? ""] ?? null)
      : null;
    return starter ?? DEFAULT_STARTER[lang] ?? DEFAULT_STARTER.nodejs;
  }

  function toggleFlag(qId: string) {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId); else next.add(qId);
      return next;
    });
  }

  // ── Secure "Run Code" — sends questionId only, server fetches test cases from DB ──
  // SECURITY: testCases are NEVER sent from the client. The server looks them up
  // using the questionId + submissionToken chain, preventing score forgery.
  async function handleRunCode(q: AssessmentQuestion) {
    const code = getAnswerWithStarter(q);
    if (!code?.trim()) return;

    setRunningQId(q.id);
    setRunError((prev) => ({ ...prev, [q.id]: "" }));

    try {
      const res  = await fetch("/api/code/execute", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          code,
          language:        q.codeLanguage || "nodejs",
          questionId:      q.id,           // server fetches test cases from DB
          submissionToken: id,             // validates active session
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setRunError((prev) => ({ ...prev, [q.id]: json.error || "Execution failed" }));
        return;
      }

      if (json.data?.results) {
        setRunResults((prev) => ({ ...prev, [q.id]: json.data.results as RunResult[] }));
      }
    } catch {
      setRunError((prev) => ({ ...prev, [q.id]: "Network error — please try again" }));
    } finally {
      setRunningQId(null);
    }
  }

  // ═══════════════════ INTRO SCREEN ═══════════════════════════════════════════
  if (view === "intro") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="space-y-5 p-5 sm:p-8">
            <div className="text-center">
              <h1 className="text-xl sm:text-2xl font-bold text-surface-800">{assessment.title}</h1>
              <p className="mt-1 text-xs sm:text-sm text-surface-500">
                Please read the instructions before starting.
              </p>
            </div>

            {/* Expiry warning */}
            {assessment.expiresAt && (
              <div className="flex items-center gap-2 rounded-md bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-sm text-amber-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Deadline: {new Date(assessment.expiresAt).toLocaleString()}
              </div>
            )}

            <div className="space-y-3 rounded-lg bg-surface-50 p-4">
              {[
                ["Duration",      `${assessment.duration} minutes`],
                ["Questions",     String(questions.length)],
                ["Total Points",  String(totalPoints)],
                ["Passing Score", `${assessment.passingScore}%`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-surface-500">{label}</span>
                  <span className="font-medium text-surface-800">{value}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-surface-700">Instructions:</p>
              <ul className="space-y-1 text-[11px] sm:text-xs text-surface-600">
                <li>• The timer starts as soon as you begin the assessment.</li>
                <li>• You can navigate between questions using the navigation bar.</li>
                <li>• Flag questions to review them later before submitting.</li>
                <li>• Your answers are auto-saved as you progress.</li>
                <li>• For coding questions, use ▶ Run Code to test against preview cases.</li>
                {(assessment.settings as Record<string, Record<string, boolean>>)?.proctoring?.tabSwitchDetection && (
                  <li className="text-amber-600">• Tab/window switches will be monitored.</li>
                )}
                {(assessment.settings as Record<string, Record<string, boolean>>)?.proctoring?.copyPasteDetection && (
                  <li className="text-amber-600">• Copy-paste activity will be monitored.</li>
                )}
              </ul>
            </div>

            <Button
              className="w-full gap-1.5"
              onClick={async () => {
                try { await fetch(`/api/assessment/${id}/start`, { method: "POST" }); } catch { /* continue */ }
                setView("test");
              }}
            >
              Start Assessment
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ═══════════════════ RESULTS SCREEN ═════════════════════════════════════════
  if (view === "results" && score) {
    const serverPct     = typeof (submitResult as Record<string, unknown> | null)?.finalScore === "number"
      ? (submitResult as Record<string, unknown>).finalScore as number
      : null;
    const displayPct    = serverPct ?? score.pct;
    const displayPassed = displayPct >= (assessment?.passingScore ?? 60);
    const displayEarned = score.max > 0 ? Math.round((displayPct / 100) * score.max) : score.earned;

    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="space-y-5 p-5 sm:p-8 text-center">
            <div className={cn(
              "mx-auto flex h-16 w-16 items-center justify-center rounded-full",
              displayPassed ? "bg-emerald-100" : "bg-red-100",
            )}>
              {displayPassed
                ? <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                : <XCircle      className="h-8 w-8 text-red-600"     />}
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-surface-800">
                {displayPassed ? "Assessment Passed!" : "Assessment Not Passed"}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-surface-500">
                {displayPassed
                  ? "Congratulations! You met the passing threshold."
                  : "Unfortunately you did not meet the passing score this time."}
              </p>
            </div>

            <div className="flex items-center justify-center gap-6">
              <div>
                <p className={cn("text-3xl font-bold", displayPassed ? "text-emerald-600" : "text-red-600")}>
                  {displayPct}%
                </p>
                <p className="text-[11px] text-surface-500">Score</p>
              </div>
              <div className="h-10 w-px bg-surface-200" />
              <div>
                <p className="text-3xl font-bold text-surface-800">{displayEarned}/{score.max}</p>
                <p className="text-[11px] text-surface-500">Points</p>
              </div>
            </div>

            {(assessment.settings as Record<string, boolean>)?.showResultsToCandidate && (
              <div className="space-y-2 text-left">
                <p className="text-xs font-semibold text-surface-700">Question Breakdown</p>
                {questions.map((q, i) => {
                  const ans          = answers[q.id];
                  const serverGraded = (
                    (submitResult as Record<string, unknown> | null)
                      ?.gradedAnswers as Array<{ questionId: string; isCorrect: boolean; pointsEarned: number }> | undefined
                  )?.find((g) => g.questionId === q.id);
                  const correct      = serverGraded ? serverGraded.isCorrect : false;
                  const pointsEarned = serverGraded?.pointsEarned ?? 0;
                  return (
                    <div
                      key={q.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3",
                        correct ? "border-emerald-200 bg-emerald-50/50"
                          : ans  ? "border-amber-200 bg-amber-50/50"
                          :        "border-surface-200",
                      )}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-100 text-[10px] font-bold text-surface-600">
                        {i + 1}
                      </span>
                      <p className="text-xs text-surface-700 flex-1 line-clamp-1">{q.prompt}</p>
                      <span className="text-[10px] font-bold">
                        {correct ? (
                          <span className="text-emerald-600">✓ {pointsEarned}pts</span>
                        ) : ans ? (
                          <span className="text-amber-600">✗ 0pts</span>
                        ) : (
                          <span className="text-surface-400">skipped</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/tests">← Back to My Tests</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ═══════════════════ CONFIRM MODAL ══════════════════════════════════════════
  if (view === "confirm") {
    // A question is "answered" if: the user typed something, OR it's a code question
    // (code questions always have starter code visible in the editor — they count as answered)
    const answered = questions.filter((q) =>
      q.type === "code" ? !!getAnswerWithStarter(q).trim() : !!answers[q.id]
    ).length;
    const flaggedCount = flagged.size;

    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-5 p-5 sm:p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
            <h2 className="text-lg font-semibold text-surface-800">Submit Assessment?</h2>
            <div className="space-y-1 text-xs sm:text-sm text-surface-600">
              <p>You have answered <strong>{answered}</strong> of <strong>{questions.length}</strong> questions.</p>
              {flaggedCount > 0 && (
                <p className="text-amber-600">
                  <strong>{flaggedCount}</strong> question{flaggedCount > 1 ? "s" : ""} flagged for review.
                </p>
              )}
              {answered < questions.length && (
                <p className="text-red-600">
                  <strong>{questions.length - answered}</strong> unanswered question{questions.length - answered > 1 ? "s" : ""}.
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setView("test")}>
                Go Back
              </Button>
              <Button
                className="flex-1 gap-1.5"
                onClick={async () => {
                  try {
                    const payload = {
                      answers: (assessment?.questions || []).map((q: AssessmentQuestion) => ({
                        questionId:     q.id,
                        selectedAnswer: q.type === "code"
                          ? JSON.stringify({ code: getAnswerWithStarter(q), testResults: runResults[q.id] || [] })
                          : (answers[q.id] || undefined),
                      })),
                      proctoringData: getProctoringData(),
                    };
                    const res  = await fetch(`/api/assessment/${id}/submit`, {
                      method:  "POST",
                      headers: { "Content-Type": "application/json" },
                      body:    JSON.stringify(payload),
                    });
                    const json = await res.json();
                    setSubmitResult(json.data || {});
                    try { sessionStorage.removeItem(`proctoring_${id}`); } catch { /* ignore */ }
                  } catch { /* fallback to results view */ }
                  setView("results");
                }}
              >
                <Send className="h-3.5 w-3.5" />
                Submit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ═══════════════════ TEST SCREEN ════════════════════════════════════════════
  const timeWarning = timeLeft <= 300;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Proctoring warning banner */}
      {proctoringWarning && (
        <div className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-amber-50 border-b border-amber-200 px-4 py-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            {proctoringWarning}
          </div>
          <button
            onClick={dismissWarning}
            className="text-amber-600 hover:text-amber-800 text-lg leading-none font-bold shrink-0"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Sticky timer bar */}
      <div className="sticky top-0 z-30 border-b border-surface-200 bg-white px-3 py-2 sm:px-6 sm:py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="hidden sm:block text-sm font-semibold text-surface-800 truncate max-w-[200px]">
              {assessment.title}
            </h2>
            <Badge className="text-[10px] sm:text-[11px] bg-surface-100 text-surface-600 border-surface-200">
              {currentQ + 1} / {questions.length}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-mono font-bold",
              timeWarning ? "bg-red-50 text-red-600 animate-pulse" : "bg-surface-100 text-surface-700",
            )}>
              <Clock className="h-3.5 w-3.5" />
              {formatTime(timeLeft)}
            </div>
            <Button size="sm" className="gap-1 text-xs sm:text-sm" onClick={() => setView("confirm")}>
              <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Submit</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Question nav sidebar (desktop) */}
        <div className="hidden lg:flex flex-col gap-2 border-r border-surface-200 bg-white p-4 w-[200px]">
          <p className="text-[11px] font-semibold text-surface-500 mb-1">Questions</p>
          <div className="grid grid-cols-4 gap-1.5">
            {questions.map((q, i) => {
              const isAnswered = q.type === "code" ? !!getAnswerWithStarter(q).trim() : !!answers[q.id];
              const isFlagged  = flagged.has(q.id);
              const isCurrent  = i === currentQ;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQ(i)}
                  className={cn(
                    "relative flex h-8 w-8 items-center justify-center rounded text-xs font-bold transition-colors",
                    isCurrent  ? "bg-brand-500 text-white"
                    : isAnswered ? "bg-emerald-100 text-emerald-700"
                    : "bg-surface-100 text-surface-600 hover:bg-surface-200",
                  )}
                >
                  {i + 1}
                  {isFlagged && (
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 border border-white" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-3 space-y-1 text-[10px] text-surface-500">
            <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-100" /> Answered</div>
            <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-surface-100" /> Unanswered</div>
            <div className="flex items-center gap-1.5">
              <span className="relative h-3 w-3 rounded bg-surface-100">
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400" />
              </span>
              Flagged
            </div>
          </div>
        </div>

        {/* Question area */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-3xl">
            <QuestionView
              question={question}
              index={currentQ}
              answer={getAnswerWithStarter(question)}
              isFlagged={flagged.has(question.id)}
              onAnswer={(v) => setAnswer(question.id, v)}
              onToggleFlag={() => toggleFlag(question.id)}
              runResult={runResults[question.id]}
              runErrorMsg={runError[question.id]}
              isRunning={runningQId === question.id}
              onRun={question.type === "code" ? () => handleRunCode(question) : undefined}
            />
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="sticky bottom-0 border-t border-surface-200 bg-white px-3 py-2.5 sm:px-6 sm:py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Button
            variant="outline" size="sm"
            disabled={currentQ === 0}
            onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
            className="gap-1 text-xs sm:text-sm"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </Button>

          {/* Mobile question dots */}
          <div className="flex lg:hidden items-center gap-1 overflow-x-auto max-w-[200px] px-2">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentQ(i)}
                className={cn(
                  "h-2.5 w-2.5 shrink-0 rounded-full transition-colors",
                  i === currentQ ? "bg-brand-500" : (q.type === "code" ? !!getAnswerWithStarter(q).trim() : !!answers[q.id]) ? "bg-emerald-400" : "bg-surface-300",
                )}
              />
            ))}
          </div>

          <Button
            variant={currentQ === questions.length - 1 ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (currentQ < questions.length - 1) setCurrentQ((p) => p + 1);
              else setView("confirm");
            }}
            className="gap-1 text-xs sm:text-sm"
          >
            {currentQ === questions.length - 1 ? "Review & Submit" : "Next"}
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Question renderer ────────────────────────────────────────────────────────
function QuestionView({
  question,
  index,
  answer,
  isFlagged,
  onAnswer,
  onToggleFlag,
  runResult,
  runErrorMsg,
  isRunning,
  onRun,
}: {
  question:     AssessmentQuestion;
  index:        number;
  answer:       string;
  isFlagged:    boolean;
  onAnswer:     (v: string) => void;
  onToggleFlag: () => void;
  runResult?:   RunResult[];
  runErrorMsg?: string;
  isRunning?:   boolean;
  onRun?:       () => void;
}) {
  const passedCount = runResult?.filter((r) => r.passed).length ?? 0;
  const totalCount  = runResult?.length ?? 0;

  return (
    <Card>
      <CardContent className="space-y-5 p-4 sm:p-6">
        {/* Question header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
              {index + 1}
            </span>
            <Badge className="border text-[10px] bg-surface-50 text-surface-600 border-surface-200">
              {QUESTION_TYPE_LABELS[question.type]}
            </Badge>
            <span className="text-[10px] text-surface-400">{question.points} pts</span>
            {question.codeLanguage && (
              <Badge className="border text-[10px] bg-sky-50 text-sky-700 border-sky-200 gap-0.5">
                <Code2 className="h-2.5 w-2.5" />
                {LANG_LABEL[question.codeLanguage] ?? question.codeLanguage}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost" size="sm"
            className={cn("h-7 gap-1 text-[11px]", isFlagged ? "text-amber-600" : "text-surface-400")}
            onClick={onToggleFlag}
          >
            <Flag className={cn("h-3 w-3", isFlagged && "fill-amber-400")} />
            {isFlagged ? "Flagged" : "Flag"}
          </Button>
        </div>

        {/* Prompt */}
        <div className="text-xs sm:text-sm text-surface-800 whitespace-pre-wrap leading-relaxed">
          {question.prompt}
        </div>

        {/* ── MCQ / True-False options ─────────────────────────────────────── */}
        {(question.type === "multiple_choice" || question.type === "true_false") && question.options && (
          <div className="space-y-2">
            {question.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => onAnswer(opt)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left text-xs sm:text-sm transition-colors",
                  answer === opt
                    ? "border-brand-500 bg-brand-50 text-brand-800"
                    : "border-surface-200 text-surface-700 hover:border-surface-300 hover:bg-surface-50",
                )}
              >
                <span className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold",
                  answer === opt ? "border-brand-500 bg-brand-500 text-white" : "border-surface-300 text-surface-500",
                )}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{opt}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Code question — Monaco IDE ───────────────────────────────────── */}
        {question.type === "code" && (
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-surface-500">Your Code:</p>

            {/* Monaco Editor — SSR disabled via dynamic import at module top */}
            <div className="rounded-lg overflow-hidden border border-zinc-700">
              <MonacoEditor
                height="400px"
                language={MONACO_LANG[question.codeLanguage ?? "nodejs"] ?? "javascript"}
                value={answer}
                onChange={(val) => onAnswer(val ?? "")}
                theme="vs-dark"
                options={MONACO_OPTIONS}
              />
            </div>

            {/* Run Code button + summary */}
            {onRun && (
              <div className="flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs border-zinc-600 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white"
                  onClick={onRun}
                  disabled={isRunning || !answer.trim()}
                >
                  {isRunning ? (
                    <span className="h-3 w-3 animate-spin rounded-full border border-emerald-500 border-t-transparent" />
                  ) : (
                    <Play className="h-3 w-3 fill-current text-emerald-400" />
                  )}
                  {isRunning ? "Running…" : "▶ Run Code"}
                </Button>

                {runResult && (
                  <span className={cn(
                    "text-[11px] font-semibold",
                    passedCount === totalCount ? "text-emerald-600" : "text-amber-600",
                  )}>
                    {passedCount}/{totalCount} preview tests passed
                  </span>
                )}
              </div>
            )}

            {/* API error (e.g. JDoodle down, invalid session) */}
            {runErrorMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {runErrorMsg}
              </div>
            )}

            {/* Run results panel — expectedOutput intentionally absent */}
            {runResult && runResult.length > 0 && (
              <div className="rounded-lg border border-zinc-700 bg-zinc-950 overflow-hidden">
                <div className="flex items-center gap-2 border-b border-zinc-700 bg-zinc-900 px-3 py-2">
                  <Terminal className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wide">
                    Preview Results
                  </span>
                  <span className={cn(
                    "ml-auto text-[11px] font-bold",
                    passedCount === totalCount ? "text-emerald-400" : "text-red-400",
                  )}>
                    {passedCount}/{totalCount} passed
                  </span>
                </div>
                <div className="divide-y divide-zinc-800">
                  {runResult.map((r, i) => (
                    <div
                      key={i}
                      className={cn(
                        "px-3 py-2.5 text-xs font-mono",
                        r.passed ? "bg-emerald-950/30" : "bg-red-950/30",
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        {r.passed
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          : <XCircle      className="h-3.5 w-3.5 text-red-400 shrink-0" />}
                        <span className={cn("font-semibold text-[11px]", r.passed ? "text-emerald-300" : "text-red-300")}>
                          Test {i + 1} — {r.passed ? "Passed" : "Failed"}
                        </span>
                      </div>

                      <div className="space-y-0.5 text-[11px]">
                        <p className="text-zinc-500">
                          Input: <span className="text-zinc-300">{r.input || "(empty)"}</span>
                        </p>
                        <p className="text-zinc-500">
                          Your output:{" "}
                          <span className={r.passed ? "text-emerald-300" : "text-red-300"}>
                            {r.actualOutput || "(no output)"}
                          </span>
                        </p>
                        {/* expectedOutput intentionally not shown — prevents gaming */}
                        {r.error && (
                          <p className="text-red-400 mt-1 whitespace-pre-wrap">{r.error}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Short answer ─────────────────────────────────────────────────── */}
        {question.type === "short_answer" && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-surface-500">Your Answer:</p>
            <textarea
              rows={6}
              className="w-full rounded-lg border border-surface-200 bg-white p-3 text-xs sm:text-sm text-surface-800 outline-none focus:ring-2 focus:ring-brand-500/30 placeholder:text-surface-400"
              placeholder="Type your answer here…"
              value={answer}
              onChange={(e) => onAnswer(e.target.value)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
