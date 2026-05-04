"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardCheck, Plus, X, Library, BookOpen, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuestionBank } from "@/hooks/use-assessments";
import type { QuestionBankItem } from "@/hooks/use-assessments";
import type { JobPostFormData, AssessmentType, DifficultyLevel } from "@/types/employer";
import { ASSESSMENT_TYPE_LABELS, DIFFICULTY_LABELS, JDOODLE_LANGUAGE_MAP } from "@/types/employer";

interface ExistingAssessment {
  id: string;
  name: string;
  assessmentType: string;
}

interface Props {
  form: JobPostFormData;
  update: (updates: Partial<JobPostFormData>) => void;
  linkedAssessmentId: string | null;
  setLinkedAssessmentId: (id: string | null) => void;
  existingAssessments: ExistingAssessment[];
}

export function Step6Assessment({
  form,
  update,
  linkedAssessmentId,
  setLinkedAssessmentId,
  existingAssessments,
}: Props) {
  const [assessmentQInput, setAssessmentQInput] = useState("");
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankSelected, setBankSelected] = useState<Set<string>>(new Set());
  const [bankFilters, setBankFilters] = useState({ difficulty: "", category: "" });

  const { data: bankData, isLoading: bankLoading } = useQuestionBank(bankFilters, showBankModal);
  const bankItems = bankData?.data ?? [];
  const bankCategories = [...new Set(bankItems.map((i: QuestionBankItem) => i.category))].sort();

  function addAssessmentQuestion() {
    if (!assessmentQInput.trim()) return;
    update({
      assessmentConfig: {
        ...form.assessmentConfig,
        customQuestions: [...form.assessmentConfig.customQuestions, assessmentQInput.trim()],
      },
    });
    setAssessmentQInput("");
  }

  function toggleBankItem(id: string) {
    setBankSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function confirmBankImport() {
    const selected = bankItems.filter((item: QuestionBankItem) => bankSelected.has(item.id));
    const titles = selected.map((item: QuestionBankItem) => item.title);
    update({
      assessmentConfig: {
        ...form.assessmentConfig,
        customQuestions: [...form.assessmentConfig.customQuestions, ...titles],
        bankQuestions: [...(form.assessmentConfig.bankQuestions ?? []), ...selected],
      },
    });
    setBankSelected(new Set());
    setBankFilters({ difficulty: "", category: "" });
    setShowBankModal(false);
  }

  return (
    <>
      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-2">
                <ClipboardCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Assessment</h2>
                <p className="text-sm text-muted-foreground">Add a skills assessment for candidates</p>
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.assessmentConfig.enabled}
                onChange={(e) =>
                  update({ assessmentConfig: { ...form.assessmentConfig, enabled: e.target.checked } })
                }
                className="rounded border-border/60 text-brand-500 focus:ring-brand-200"
              />
              <span className="text-sm font-medium text-foreground/80">Enable</span>
            </label>
          </div>

          {form.assessmentConfig.enabled && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Assessment Type</Label>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(ASSESSMENT_TYPE_LABELS) as [AssessmentType, string][]).map(
                    ([value, label]) => (
                      <button
                        key={value}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                          form.assessmentConfig.assessmentType === value
                            ? "border-brand-500 bg-brand-50 text-brand-700"
                            : "border-border text-muted-foreground hover:border-border/60",
                        )}
                        onClick={() =>
                          update({ assessmentConfig: { ...form.assessmentConfig, assessmentType: value } })
                        }
                      >
                        {label}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {(form.assessmentConfig.assessmentType === "mixed" ||
                form.assessmentConfig.assessmentType === "mcq_quiz") && (
                <div className="space-y-2">
                  <Label htmlFor="mcqCount">Number of MCQ Questions</Label>
                  <Input
                    id="mcqCount"
                    type="number"
                    min={5}
                    max={50}
                    value={
                      form.assessmentConfig.mcqCount ??
                      (form.assessmentConfig.assessmentType === "mcq_quiz" ? 20 : 30)
                    }
                    onChange={(e) =>
                      update({
                        assessmentConfig: { ...form.assessmentConfig, mcqCount: Number(e.target.value) },
                      })
                    }
                    className="w-32"
                  />
                  <p className="text-xs text-muted-foreground">
                    AI will generate this many multiple-choice questions.
                  </p>
                </div>
              )}

              {(form.assessmentConfig.assessmentType === "mixed" ||
                form.assessmentConfig.assessmentType === "coding_test") && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="codingCount">Number of Coding Problems</Label>
                    <Input
                      id="codingCount"
                      type="number"
                      min={1}
                      max={10}
                      value={form.assessmentConfig.codingCount ?? 2}
                      onChange={(e) =>
                        update({
                          assessmentConfig: {
                            ...form.assessmentConfig,
                            codingCount: Number(e.target.value),
                          },
                        })
                      }
                      className="w-32"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Coding Language</Label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(JDOODLE_LANGUAGE_MAP).map(([key, { label }]) => (
                        <button
                          key={key}
                          className={cn(
                            "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                            (form.assessmentConfig.codeLanguage ?? "python3") === key
                              ? "border-brand-500 bg-brand-50 text-brand-700"
                              : "border-border text-muted-foreground hover:border-border/60",
                          )}
                          onClick={() =>
                            update({
                              assessmentConfig: { ...form.assessmentConfig, codeLanguage: key },
                            })
                          }
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min={15}
                  max={180}
                  value={form.assessmentConfig.timeLimit}
                  onChange={(e) =>
                    update({
                      assessmentConfig: { ...form.assessmentConfig, timeLimit: Number(e.target.value) },
                    })
                  }
                  className="w-32"
                />
              </div>

              <div className="space-y-2">
                <Label>Difficulty Level</Label>
                <div className="flex gap-2">
                  {(Object.entries(DIFFICULTY_LABELS) as [DifficultyLevel, string][]).map(
                    ([value, label]) => (
                      <button
                        key={value}
                        className={cn(
                          "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                          form.assessmentConfig.difficultyLevel === value
                            ? "border-brand-500 bg-brand-50 text-brand-700"
                            : "border-border text-muted-foreground hover:border-border/60",
                        )}
                        onClick={() =>
                          update({
                            assessmentConfig: { ...form.assessmentConfig, difficultyLevel: value },
                          })
                        }
                      >
                        {label}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Custom Questions or Topics</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setShowBankModal(true)}
                    className="h-7 gap-1.5 text-xs text-brand-600 border-brand-200 hover:bg-brand-50"
                  >
                    <Library className="h-3 w-3" />
                    Import from Question Bank
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a question or topic..."
                    value={assessmentQInput}
                    onChange={(e) => setAssessmentQInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); addAssessmentQuestion(); }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={addAssessmentQuestion}
                    disabled={!assessmentQInput.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {form.assessmentConfig.customQuestions.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {form.assessmentConfig.customQuestions.map((q, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
                      >
                        <span className="flex-1 text-sm text-foreground/80">
                          {i + 1}. {q}
                        </span>
                        <button
                          onClick={() =>
                            update({
                              assessmentConfig: {
                                ...form.assessmentConfig,
                                customQuestions: form.assessmentConfig.customQuestions.filter(
                                  (_, idx) => idx !== i,
                                ),
                              },
                            })
                          }
                          className="text-muted-foreground/70 hover:text-red-500"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="rounded-lg bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Template Library
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Pre-built assessment templates for common roles will be available here. Coming
                    soon.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!form.assessmentConfig.enabled && (
            <div className="rounded-xl border-2 border-dashed border-border py-10 text-center">
              <ClipboardCheck className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">Assessment is disabled</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Toggle on to add a coding test, quiz, or assignment
              </p>
            </div>
          )}

          <div className="border-t border-border pt-5">
            <Label className="mb-1 block text-sm font-medium text-foreground/80">
              Or link an existing assessment
            </Label>
            <p className="mb-3 text-xs text-muted-foreground">
              When a candidate reaches the{" "}
              <span className="font-medium">Assessment Pending</span> stage, they will automatically
              receive this assessment.
            </p>
            {existingAssessments.length === 0 ? (
              <p className="text-xs italic text-muted-foreground/70">
                No assessments found. Create one from the{" "}
                <a
                  href="/employer/assessments"
                  className="text-brand-600 underline underline-offset-2"
                >
                  Assessments page
                </a>{" "}
                first.
              </p>
            ) : (
              <select
                value={linkedAssessmentId ?? ""}
                onChange={(e) => setLinkedAssessmentId(e.target.value || null)}
                className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">— None (AI will auto-generate) —</option>
                {existingAssessments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.assessmentType?.replace(/_/g, " ")})
                  </option>
                ))}
              </select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Question Bank Modal */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="flex w-full max-w-2xl flex-col" style={{ maxHeight: "90vh" }}>
            <CardContent className="flex h-full flex-col gap-4 overflow-hidden p-5 sm:p-6">
              <div className="flex shrink-0 items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Question Bank</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Select problems to import as assessment topics
                  </p>
                </div>
                <button
                  onClick={() => setShowBankModal(false)}
                  className="text-lg font-bold leading-none text-muted-foreground/70 hover:text-foreground/80"
                >
                  ×
                </button>
              </div>

              <div className="shrink-0 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {["", "easy", "medium", "hard"].map((d) => (
                    <button
                      key={d || "all-diff"}
                      onClick={() => setBankFilters((f) => ({ ...f, difficulty: d }))}
                      className={cn(
                        "rounded-full border px-3 py-0.5 text-xs font-medium transition-colors",
                        bankFilters.difficulty === d
                          ? d === "easy"
                            ? "border-emerald-400 bg-emerald-100 text-emerald-700"
                            : d === "medium"
                              ? "border-amber-400 bg-amber-100 text-amber-700"
                              : d === "hard"
                                ? "border-red-400 bg-red-100 text-red-700"
                                : "border-foreground bg-foreground text-white"
                          : "border-border text-muted-foreground hover:border-border/60",
                      )}
                    >
                      {d === "" ? "All Difficulty" : d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["", ...bankCategories].map((c) => (
                    <button
                      key={c || "all-cat"}
                      onClick={() => setBankFilters((f) => ({ ...f, category: c }))}
                      className={cn(
                        "rounded-full border px-3 py-0.5 text-xs font-medium transition-colors",
                        bankFilters.category === c
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-border text-muted-foreground hover:border-border/60",
                      )}
                    >
                      {c === "" ? "All Categories" : c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {bankLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse rounded-lg border border-border bg-muted"
                    />
                  ))
                ) : bankItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      No questions match the selected filters.
                    </p>
                  </div>
                ) : (
                  bankItems.map((item: QuestionBankItem) => {
                    const selected = bankSelected.has(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleBankItem(item.id)}
                        className={cn(
                          "w-full rounded-lg border p-3 text-left transition-colors",
                          selected
                            ? "border-emerald-400 bg-emerald-50"
                            : "border-border hover:border-border/60 hover:bg-muted/30",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                              selected ? "border-emerald-500 bg-emerald-500" : "border-border/60",
                            )}
                          >
                            {selected && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-semibold text-foreground">
                                {item.title}
                              </span>
                              <Badge
                                className={cn(
                                  "px-1.5 py-0 text-[10px]",
                                  item.difficulty === "easy"
                                    ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                                    : item.difficulty === "medium"
                                      ? "border-amber-200 bg-amber-100 text-amber-700"
                                      : "border-red-200 bg-red-100 text-red-700",
                                )}
                                variant="outline"
                              >
                                {item.difficulty}
                              </Badge>
                              <Badge
                                className="border-border bg-muted px-1.5 py-0 text-[10px] text-muted-foreground"
                                variant="outline"
                              >
                                {item.category}
                              </Badge>
                            </div>
                            <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
                              {item.prompt}
                            </p>
                            <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                              {item.testCases.length} test cases ·{" "}
                              {Object.keys(item.starterCode).length} languages
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border pt-1">
                <span className="text-xs text-muted-foreground">
                  {bankSelected.size > 0 ? `${bankSelected.size} selected` : "Click questions to select"}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="text-xs"
                    onClick={() => setShowBankModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="gap-1.5 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                    onClick={confirmBankImport}
                    disabled={bankSelected.size === 0}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Import {bankSelected.size > 0 ? `${bankSelected.size} ` : ""}Questions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
