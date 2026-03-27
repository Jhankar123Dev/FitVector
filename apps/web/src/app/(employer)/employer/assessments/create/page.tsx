"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  X,
  Trash2,
  Briefcase,
  FileQuestion,
  Settings,
  Eye,
  Code2,
  BookOpen,
  FileCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssessmentType, DifficultyLevel, QuestionType } from "@/types/employer";
import {
  ASSESSMENT_TYPE_LABELS,
  DIFFICULTY_LABELS,
  QUESTION_TYPE_LABELS,
} from "@/types/employer";

// ── Step config ─────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Basic Info", icon: Briefcase },
  { id: 2, label: "Questions", icon: FileQuestion },
  { id: 3, label: "Settings", icon: Settings },
  { id: 4, label: "Review", icon: Eye },
];

interface QuestionForm {
  id: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  correctAnswer: string;
  points: number;
  codeLanguage: string;
}

interface AssessmentForm {
  title: string;
  type: AssessmentType;
  difficulty: DifficultyLevel;
  duration: number;
  description: string;
  questions: QuestionForm[];
  passingScore: number;
  randomizeQuestions: boolean;
  showResultsToCandidate: boolean;
  maxAttempts: number;
  tabSwitchDetection: boolean;
  copyPasteDetection: boolean;
}

const INITIAL_FORM: AssessmentForm = {
  title: "",
  type: "coding_test",
  difficulty: "mid",
  duration: 60,
  description: "",
  questions: [],
  passingScore: 60,
  randomizeQuestions: false,
  showResultsToCandidate: true,
  maxAttempts: 1,
  tabSwitchDetection: true,
  copyPasteDetection: false,
};

function newQuestion(): QuestionForm {
  return {
    id: `q-${Date.now()}`,
    type: "multiple_choice",
    prompt: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    points: 10,
    codeLanguage: "javascript",
  };
}

const CODE_LANGUAGES = ["javascript", "typescript", "python", "java", "go", "rust", "c++"];

export default function CreateAssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<AssessmentForm>(INITIAL_FORM);

  const update = useCallback(
    <K extends keyof AssessmentForm>(key: K, value: AssessmentForm[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const progress = Math.round((step / STEPS.length) * 100);

  // ── Question helpers ─────────────────────────────────────────
  function addQuestion() {
    update("questions", [...form.questions, newQuestion()]);
  }

  function removeQuestion(id: string) {
    update("questions", form.questions.filter((q) => q.id !== id));
  }

  function updateQuestion(id: string, patch: Partial<QuestionForm>) {
    update(
      "questions",
      form.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    );
  }

  function updateOption(qId: string, idx: number, value: string) {
    const q = form.questions.find((q) => q.id === qId);
    if (!q) return;
    const opts = [...q.options];
    opts[idx] = value;
    updateQuestion(qId, { options: opts });
  }

  function addOption(qId: string) {
    const q = form.questions.find((q) => q.id === qId);
    if (!q) return;
    updateQuestion(qId, { options: [...q.options, ""] });
  }

  function removeOption(qId: string, idx: number) {
    const q = form.questions.find((q) => q.id === qId);
    if (!q || q.options.length <= 2) return;
    const opts = q.options.filter((_, i) => i !== idx);
    updateQuestion(qId, { options: opts });
  }

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
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-semibold text-surface-800">
            Create Assessment
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-surface-500">
            Step {step} of {STEPS.length} — {STEPS[step - 1].label}
          </p>
        </div>
      </div>

      {/* ── Progress bar ──────────────────────────────────────── */}
      <div className="space-y-2">
        <Progress value={progress} className="h-1.5" />
        <div className="hidden sm:flex items-center justify-between">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const done = step > s.id;
            const current = step === s.id;
            return (
              <button
                key={s.id}
                onClick={() => s.id < step && setStep(s.id)}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium transition-colors",
                  done ? "text-brand-600 cursor-pointer" : current ? "text-surface-800" : "text-surface-400",
                  !done && !current && "cursor-default",
                )}
              >
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold",
                    done
                      ? "bg-brand-500 text-white"
                      : current
                        ? "bg-surface-800 text-white"
                        : "bg-surface-200 text-surface-500",
                  )}
                >
                  {done ? <Check className="h-3 w-3" /> : s.id}
                </div>
                <span className="hidden md:inline">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════ STEP 1 — Basic Info ═══════════════ */}
      {step === 1 && (
        <Card>
          <CardContent className="space-y-5 p-4 sm:p-6">
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">Assessment Title</Label>
              <Input
                placeholder="e.g. React Frontend Coding Test"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm">Assessment Type</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-surface-200 bg-white px-3 py-1.5 text-sm text-surface-800 outline-none focus:ring-2 focus:ring-brand-500/30"
                  value={form.type}
                  onChange={(e) => update("type", e.target.value as AssessmentType)}
                >
                  {(Object.keys(ASSESSMENT_TYPE_LABELS) as AssessmentType[]).map((t) => (
                    <option key={t} value={t}>{ASSESSMENT_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm">Difficulty Level</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-surface-200 bg-white px-3 py-1.5 text-sm text-surface-800 outline-none focus:ring-2 focus:ring-brand-500/30"
                  value={form.difficulty}
                  onChange={(e) => update("difficulty", e.target.value as DifficultyLevel)}
                >
                  {(Object.keys(DIFFICULTY_LABELS) as DifficultyLevel[]).map((d) => (
                    <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">Duration (minutes)</Label>
              <Input
                type="number"
                min={5}
                max={300}
                value={form.duration}
                onChange={(e) => update("duration", Number(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">Description</Label>
              <Textarea
                rows={3}
                placeholder="Describe what this assessment evaluates..."
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════ STEP 2 — Questions ═══════════════ */}
      {step === 2 && (
        <div className="space-y-4">
          {form.questions.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileQuestion className="h-10 w-10 text-surface-300" />
                <p className="mt-3 text-sm font-medium text-surface-600">No questions yet</p>
                <p className="mt-1 text-xs text-surface-400">Add your first question to get started.</p>
              </CardContent>
            </Card>
          )}

          {form.questions.map((q, qi) => (
            <Card key={q.id}>
              <CardContent className="space-y-4 p-3 sm:p-5">
                {/* Question header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-semibold text-surface-800">
                    Question {qi + 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:text-red-700"
                    onClick={() => removeQuestion(q.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Question Type</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-surface-200 bg-white px-3 py-1.5 text-sm text-surface-800 outline-none focus:ring-2 focus:ring-brand-500/30"
                      value={q.type}
                      onChange={(e) => {
                        const type = e.target.value as QuestionType;
                        const patch: Partial<QuestionForm> = { type };
                        if (type === "true_false") patch.options = ["True", "False"];
                        else if (type === "multiple_choice" && q.options.length < 2) patch.options = ["", "", "", ""];
                        updateQuestion(q.id, patch);
                      }}
                    >
                      {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((t) => (
                        <option key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Points</Label>
                    <Input
                      type="number"
                      min={1}
                      value={q.points}
                      onChange={(e) => updateQuestion(q.id, { points: Number(e.target.value) })}
                    />
                  </div>

                  {q.type === "code" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Language</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-surface-200 bg-white px-3 py-1.5 text-sm text-surface-800 outline-none focus:ring-2 focus:ring-brand-500/30"
                        value={q.codeLanguage}
                        onChange={(e) => updateQuestion(q.id, { codeLanguage: e.target.value })}
                      >
                        {CODE_LANGUAGES.map((l) => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Prompt</Label>
                  <Textarea
                    rows={3}
                    placeholder="Enter the question prompt..."
                    value={q.prompt}
                    onChange={(e) => updateQuestion(q.id, { prompt: e.target.value })}
                  />
                </div>

                {/* Options for MCQ / True-False */}
                {(q.type === "multiple_choice" || q.type === "true_false") && (
                  <div className="space-y-2">
                    <Label className="text-xs">Options</Label>
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${q.id}`}
                          checked={q.correctAnswer === opt && opt !== ""}
                          onChange={() => updateQuestion(q.id, { correctAnswer: opt })}
                          className="h-3.5 w-3.5 accent-brand-500"
                        />
                        <Input
                          className="flex-1"
                          placeholder={`Option ${oi + 1}`}
                          value={opt}
                          onChange={(e) => updateOption(q.id, oi, e.target.value)}
                          disabled={q.type === "true_false"}
                        />
                        {q.type === "multiple_choice" && q.options.length > 2 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => removeOption(q.id, oi)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {q.type === "multiple_choice" && (
                      <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => addOption(q.id)}>
                        <Plus className="h-3 w-3" /> Add Option
                      </Button>
                    )}
                    <p className="text-[10px] text-surface-400">Select the radio button next to the correct answer.</p>
                  </div>
                )}

                {/* Correct answer for short_answer / code */}
                {(q.type === "short_answer" || q.type === "code") && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Expected Answer / Rubric</Label>
                    <Textarea
                      rows={2}
                      placeholder="Describe the expected answer or evaluation criteria..."
                      value={q.correctAnswer}
                      onChange={(e) => updateQuestion(q.id, { correctAnswer: e.target.value })}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" className="w-full gap-1.5" onClick={addQuestion}>
            <Plus className="h-4 w-4" /> Add Question
          </Button>
        </div>
      )}

      {/* ═══════════════════ STEP 3 — Settings ═══════════════ */}
      {step === 3 && (
        <Card>
          <CardContent className="space-y-5 p-4 sm:p-6">
            <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm">Passing Score (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.passingScore}
                  onChange={(e) => update("passingScore", Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm">Max Attempts</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={form.maxAttempts}
                  onChange={(e) => update("maxAttempts", Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs sm:text-sm font-semibold text-surface-700">Options</p>
              {[
                { key: "randomizeQuestions" as const, label: "Randomize question order" },
                { key: "showResultsToCandidate" as const, label: "Show results to candidate after submission" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => update(key, e.target.checked)}
                    className="h-4 w-4 rounded border-surface-300 accent-brand-500"
                  />
                  <span className="text-xs sm:text-sm text-surface-700">{label}</span>
                </label>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-xs sm:text-sm font-semibold text-surface-700">Proctoring</p>
              {[
                { key: "tabSwitchDetection" as const, label: "Detect tab/window switches" },
                { key: "copyPasteDetection" as const, label: "Detect copy-paste activity" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => update(key, e.target.checked)}
                    className="h-4 w-4 rounded border-surface-300 accent-brand-500"
                  />
                  <span className="text-xs sm:text-sm text-surface-700">{label}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════ STEP 4 — Review ═══════════════ */}
      {step === 4 && (
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <h3 className="text-sm sm:text-base font-semibold text-surface-800">Assessment Summary</h3>

              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] text-surface-500">Title</p>
                  <p className="text-xs sm:text-sm font-medium text-surface-800">{form.title || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-surface-500">Type</p>
                  <p className="text-xs sm:text-sm font-medium text-surface-800">{ASSESSMENT_TYPE_LABELS[form.type]}</p>
                </div>
                <div>
                  <p className="text-[11px] text-surface-500">Difficulty</p>
                  <p className="text-xs sm:text-sm font-medium text-surface-800">{DIFFICULTY_LABELS[form.difficulty]}</p>
                </div>
                <div>
                  <p className="text-[11px] text-surface-500">Duration</p>
                  <p className="text-xs sm:text-sm font-medium text-surface-800">{form.duration} minutes</p>
                </div>
                <div>
                  <p className="text-[11px] text-surface-500">Passing Score</p>
                  <p className="text-xs sm:text-sm font-medium text-surface-800">{form.passingScore}%</p>
                </div>
                <div>
                  <p className="text-[11px] text-surface-500">Max Attempts</p>
                  <p className="text-xs sm:text-sm font-medium text-surface-800">{form.maxAttempts}</p>
                </div>
              </div>

              {form.description && (
                <div>
                  <p className="text-[11px] text-surface-500">Description</p>
                  <p className="text-xs text-surface-700 mt-0.5">{form.description}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 text-xs text-surface-600">
                {form.randomizeQuestions && <Badge variant="default" className="text-[10px]">Randomize</Badge>}
                {form.showResultsToCandidate && <Badge variant="default" className="text-[10px]">Show Results</Badge>}
                {form.tabSwitchDetection && <Badge variant="default" className="text-[10px]">Tab Detection</Badge>}
                {form.copyPasteDetection && <Badge variant="default" className="text-[10px]">Paste Detection</Badge>}
              </div>
            </CardContent>
          </Card>

          {/* Questions preview */}
          <Card>
            <CardContent className="space-y-3 p-4 sm:p-6">
              <h3 className="text-sm sm:text-base font-semibold text-surface-800">
                Questions ({form.questions.length})
              </h3>
              {form.questions.length === 0 ? (
                <p className="text-xs text-surface-400">No questions added. Go back to Step 2 to add questions.</p>
              ) : (
                <div className="space-y-2">
                  {form.questions.map((q, i) => (
                    <div
                      key={q.id}
                      className="flex items-start gap-3 rounded-lg border border-surface-100 p-3"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-100 text-[10px] font-bold text-surface-600">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-surface-800 line-clamp-2">{q.prompt || "Empty prompt"}</p>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-surface-500">
                          <Badge className="border text-[10px] bg-surface-50 text-surface-600 border-surface-200">
                            {QUESTION_TYPE_LABELS[q.type]}
                          </Badge>
                          <span>{q.points} pts</span>
                          {q.type === "code" && <span>({q.codeLanguage})</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-surface-500">
                Total points: {form.questions.reduce((s, q) => s + q.points, 0)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Navigation buttons ──────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => (step === 1 ? router.push("/employer/assessments") : setStep(step - 1))}
          className="gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {step === 1 ? "Cancel" : "Back"}
        </Button>

        {step < STEPS.length ? (
          <Button onClick={() => setStep(step + 1)} className="gap-1.5">
            Next
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/employer/assessments")}
            >
              Save as Draft
            </Button>
            <Button
              onClick={() => router.push("/employer/assessments")}
              className="gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              Publish
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
