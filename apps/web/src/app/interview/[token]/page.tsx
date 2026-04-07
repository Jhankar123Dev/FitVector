"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot,
  Clock,
  MessageSquare,
  CheckCircle2,
  Loader2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { useProctoringTracker } from "@/hooks/use-proctoring-tracker";

type InterviewState = "loading" | "welcome" | "questions" | "submitting" | "complete" | "error";

interface InterviewInfo {
  id: string;
  status: string;
  interviewType: string;
  durationPlanned: number;
  candidateName: string;
  jobTitle: string;
  questions: string[];
}

export default function CandidateInterviewPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<InterviewState>("loading");
  const [info, setInfo] = useState<InterviewInfo | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  // ── Proctoring — always-on for AI interviews, timestamped signals ──
  const { proctoringWarning, dismissWarning, getSignals } = useProctoringTracker({
    sessionId: token,
    enabled: state === "questions" || state === "submitting",
    trackTabSwitches: true,
    trackCopyPaste: true,
    persistToStorage: false,
  });

  // Fetch interview info
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/interview/${token}`);
        const json = await res.json();
        if (!res.ok) {
          setErrorMsg(json.error || "Interview not available");
          setState("error");
          return;
        }
        setInfo(json.data);
        setAnswers(new Array(json.data.questions.length).fill(""));
        setState(json.data.status === "started" ? "questions" : "welcome");
      } catch {
        setErrorMsg("Failed to load interview");
        setState("error");
      }
    }
    load();
  }, [token]);

  // Start the interview
  async function handleStart() {
    try {
      const res = await fetch(`/api/interview/${token}/start`, { method: "POST" });
      if (!res.ok) {
        const json = await res.json();
        setErrorMsg(json.error || "Failed to start");
        setState("error");
        return;
      }
      setState("questions");
    } catch {
      setErrorMsg("Failed to start interview");
      setState("error");
    }
  }

  // Submit answers
  async function handleSubmit() {
    if (!info) return;
    setState("submitting");
    try {
      const payload = {
        answers: info.questions.map((q, i) => ({
          question: q,
          answer: answers[i] || "",
        })),
        clientSignals: getSignals(),
      };
      const res = await fetch(`/api/interview/${token}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json();
        setErrorMsg(json.error || "Failed to submit");
        setState("error");
        return;
      }
      setState("complete");
    } catch {
      setErrorMsg("Failed to submit interview");
      setState("error");
    }
  }

  function updateAnswer(index: number, value: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  const allAnswered = answers.every((a) => a.trim().length > 0);

  // ─── Loading ──────────────────────────────────────────────────────
  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-sm text-surface-500">Loading interview...</p>
        </div>
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────
  if (state === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <h2 className="mt-4 text-lg font-semibold text-surface-800">
              Interview Unavailable
            </h2>
            <p className="mt-2 text-sm text-surface-500">{errorMsg}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Welcome ──────────────────────────────────────────────────────
  if (state === "welcome" && info) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50 p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="space-y-6 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50">
              <Bot className="h-8 w-8 text-brand-500" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-surface-800">
                AI Interview
              </h1>
              <p className="mt-1 text-sm text-surface-500">
                {info.jobTitle}
              </p>
            </div>

            <div className="space-y-2 text-left">
              <p className="text-sm text-surface-600">
                Hello <span className="font-medium">{info.candidateName}</span>,
                welcome to your AI-powered interview!
              </p>
              <p className="text-sm text-surface-500">
                This is a text-based assessment with {info.questions.length} questions.
                Please answer each question thoughtfully. There are no time limits per question.
              </p>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-surface-500">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                {info.questions.length} questions
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                ~{info.durationPlanned} min
              </span>
            </div>

            <div className="rounded-lg bg-amber-50 px-4 py-3 text-left text-xs text-amber-700">
              <p className="font-medium">Note</p>
              <p className="mt-0.5">
                AI Interview Coming Soon — for now, please answer these questions
                in text form. Your responses will be evaluated by our AI system.
              </p>
              <p className="mt-1.5 text-amber-600">
                Tab switches and copy/paste activity are monitored during this interview.
              </p>
            </div>

            <Button onClick={handleStart} size="lg" className="w-full gap-2">
              <Bot className="h-4 w-4" />
              Start Interview
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Questions ────────────────────────────────────────────────────
  if ((state === "questions" || state === "submitting") && info) {
    return (
      <div className="min-h-screen bg-surface-50">
        {/* Proctoring warning banner */}
        {proctoringWarning && (
          <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2">
            <div className="flex items-center gap-2 text-xs font-medium text-amber-800 sm:text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              {proctoringWarning}
            </div>
            <button
              onClick={dismissWarning}
              className="shrink-0 text-lg font-bold leading-none text-amber-600 hover:text-amber-800"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}
        <div className="py-8 px-4">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-lg font-semibold text-surface-800">
              {info.jobTitle} — AI Interview
            </h1>
            <p className="mt-0.5 text-sm text-surface-500">
              Answer each question below. Take your time.
            </p>
          </div>

          {/* Questions */}
          {info.questions.map((question, i) => (
            <Card key={i}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-600">
                    {i + 1}
                  </span>
                  <p className="text-sm font-medium text-surface-800">
                    {question}
                  </p>
                </div>
                <Textarea
                  placeholder="Type your answer here..."
                  value={answers[i] || ""}
                  onChange={(e) => updateAnswer(i, e.target.value)}
                  rows={4}
                  className="text-sm"
                  disabled={state === "submitting"}
                />
                {answers[i] && (
                  <p className="text-right text-[11px] text-surface-400">
                    {answers[i].split(/\s+/).filter(Boolean).length} words
                  </p>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Submit */}
          <div className="flex items-center justify-between border-t border-surface-200 pt-4">
            <p className="text-xs text-surface-400">
              {answers.filter((a) => a.trim()).length} of {info.questions.length} answered
            </p>
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered || state === "submitting"}
              className="gap-2"
            >
              {state === "submitting" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {state === "submitting" ? "Submitting..." : "Submit Interview"}
            </Button>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // ─── Complete ─────────────────────────────────────────────────────
  if (state === "complete") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-surface-800">
              Interview Complete!
            </h2>
            <p className="mt-2 text-sm text-surface-500">
              Thank you for completing the interview. Your responses have been
              recorded and will be evaluated by our AI system.
            </p>
            <p className="mt-4 text-xs text-surface-400">
              The hiring team will review your results and get back to you soon.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
