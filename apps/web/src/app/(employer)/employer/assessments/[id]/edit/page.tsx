"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  AlertTriangle,
  Lock,
  Loader2,
  CheckCircle2,
  Save,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────

interface AssessmentDetail {
  id: string;
  name: string;
  assessmentType: string;
  timeLimitMinutes: number | null;
  difficulty: string | null;
  passingScore: number | null;
  questions: Record<string, unknown>[];
  settings: Record<string, unknown>;
}

const DIFFICULTY_OPTIONS = ["easy", "medium", "hard"] as const;

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AssessmentEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [submissionCount, setSubmissionCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  // Editable fields
  const [name, setName] = useState("");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(30);
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [passingScore, setPassingScore] = useState<number>(60);

  const questionsLocked = submissionCount > 0;

  // ── Load assessment + submission count ────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [assessRes, subRes] = await Promise.all([
          fetch(`/api/employer/assessments/${id}`),
          fetch(`/api/employer/assessments/${id}/results`),
        ]);

        if (!assessRes.ok) {
          setLoadError("Assessment not found.");
          setLoading(false);
          return;
        }

        const assessJson = await assessRes.json();
        const subJson = subRes.ok ? await subRes.json() : { data: [] };

        const a = assessJson.data as AssessmentDetail;
        setAssessment(a);
        setName(a.name);
        setTimeLimitMinutes(a.timeLimitMinutes ?? 30);
        setDifficulty(a.difficulty ?? "medium");
        setPassingScore(a.passingScore ?? 60);
        setSubmissionCount((subJson.data as unknown[]).length);
      } catch {
        setLoadError("Failed to load assessment.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // ── Save ─────────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/employer/assessments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          timeLimitMinutes,
          difficulty,
          passingScore,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to save.");
        return;
      }

      toast.success("Assessment updated.");
      router.push("/employer/assessments");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Loading / error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (loadError || !assessment) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-400" />
            <p className="text-sm text-surface-600">{loadError || "Assessment not found."}</p>
            <Button variant="outline" size="sm" onClick={() => router.push("/employer/assessments")}>
              Back to Assessments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => router.push("/employer/assessments")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-surface-800">Edit Assessment</h1>
          <p className="text-sm text-surface-500">{assessment.name}</p>
        </div>
      </div>

      {/* Submission lock warning */}
      {questionsLocked && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Questions are locked</p>
            <p className="mt-0.5 text-xs text-amber-700">
              {submissionCount} candidate{submissionCount !== 1 ? "s" : ""} have already submitted this
              assessment. Editing questions would corrupt existing grading data, so they are read-only.
              You can still update the title, time limit, difficulty, and passing score.
            </p>
          </div>
        </div>
      )}

      {/* Editable metadata */}
      <Card>
        <CardContent className="space-y-5 p-6">
          <h2 className="text-sm font-semibold text-surface-700">Assessment Details</h2>

          <div className="space-y-2">
            <Label htmlFor="name">Title</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Assessment name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
              <Input
                id="timeLimit"
                type="number"
                min={5}
                max={300}
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passingScore">Passing Score (%)</Label>
              <Input
                id="passingScore"
                type="number"
                min={0}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Difficulty</Label>
            <div className="flex gap-2">
              {DIFFICULTY_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-colors ${
                    difficulty === d
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-surface-200 text-surface-600 hover:border-surface-300"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions — read-only if locked */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-surface-700">
              Questions ({assessment.questions.length})
            </h2>
            {questionsLocked && (
              <Badge className="gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[11px]">
                <Lock className="h-3 w-3" />
                Read-only
              </Badge>
            )}
          </div>

          {assessment.questions.length === 0 ? (
            <p className="text-sm text-surface-400 italic">No questions in this assessment.</p>
          ) : (
            <div className="space-y-2">
              {assessment.questions.map((q, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-surface-200 bg-surface-50 px-4 py-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
                      {i + 1}
                    </span>
                    <p className="text-sm text-surface-700 line-clamp-2">
                      {(q.prompt as string) || (q.question as string) || "Question"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!questionsLocked && (
            <p className="mt-4 text-xs text-surface-400">
              To edit questions, use the{" "}
              <a href="/employer/assessments/create" className="text-brand-600 underline underline-offset-2">
                Create Assessment
              </a>{" "}
              page and rebuild this assessment. Question editing is disabled after candidates submit
              to preserve grading integrity.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Footer actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push("/employer/assessments")}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving || !name.trim()} className="gap-1.5">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
