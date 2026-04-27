"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Plus, GripVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JobPostFormData, ScreeningQuestionType, ScreeningQuestion } from "@/types/employer";

interface Props {
  form: JobPostFormData;
  update: (updates: Partial<JobPostFormData>) => void;
}

export function Step4Screening({ form, update }: Props) {
  const [sqQuestion, setSqQuestion] = useState("");
  const [sqType, setSqType] = useState<ScreeningQuestionType>("short_answer");
  const [sqOptions, setSqOptions] = useState("");
  const [sqRequired, setSqRequired] = useState(true);

  function addScreeningQuestion() {
    if (!sqQuestion.trim() || form.screeningQuestions.length >= 10) return;
    const newQ: ScreeningQuestion = {
      id: `sq-${Date.now()}`,
      question: sqQuestion.trim(),
      type: sqType,
      options:
        sqType === "multiple_choice"
          ? sqOptions.split(",").map((o) => o.trim()).filter(Boolean)
          : undefined,
      required: sqRequired,
    };
    update({ screeningQuestions: [...form.screeningQuestions, newQ] });
    setSqQuestion("");
    setSqOptions("");
    setSqType("short_answer");
    setSqRequired(true);
  }

  function removeScreeningQuestion(id: string) {
    update({ screeningQuestions: form.screeningQuestions.filter((q) => q.id !== id) });
  }

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-sky-50 p-2">
            <MessageSquare className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Screening Questions</h2>
            <p className="text-sm text-muted-foreground">
              Add up to 10 custom questions for applicants (optional)
            </p>
          </div>
        </div>

        {form.screeningQuestions.length < 10 && (
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <div className="space-y-2">
              <Label>Question</Label>
              <Input
                placeholder="e.g. Why are you interested in this role?"
                value={sqQuestion}
                onChange={(e) => setSqQuestion(e.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  value={sqType}
                  onChange={(e) => setSqType(e.target.value as ScreeningQuestionType)}
                  className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="short_answer">Short Answer</option>
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="yes_no">Yes / No</option>
                </select>
              </div>
              {sqType === "multiple_choice" && (
                <div className="space-y-2">
                  <Label>Options (comma-separated)</Label>
                  <Input
                    placeholder="Option A, Option B, Option C"
                    value={sqOptions}
                    onChange={(e) => setSqOptions(e.target.value)}
                  />
                </div>
              )}
            </div>
            <label className="flex cursor-pointer items-center gap-2 self-start">
              <div
                onClick={() => setSqRequired((p) => !p)}
                className={cn(
                  "relative h-5 w-9 rounded-full transition-colors",
                  sqRequired ? "bg-brand-500" : "bg-muted/40",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                    sqRequired ? "translate-x-4" : "translate-x-0.5",
                  )}
                />
              </div>
              <span className="text-xs text-muted-foreground">Required</span>
            </label>
            <Button size="sm" onClick={addScreeningQuestion} disabled={!sqQuestion.trim()}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Question
            </Button>
          </div>
        )}

        {form.screeningQuestions.length > 0 ? (
          <div className="space-y-2">
            {form.screeningQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
              >
                <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {idx + 1}. {q.question}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground/70">
                    {q.type === "short_answer"
                      ? "Short answer"
                      : q.type === "yes_no"
                        ? "Yes / No"
                        : `Multiple choice: ${q.options?.join(", ")}`}
                  </p>
                </div>
                <button
                  onClick={() => removeScreeningQuestion(q.id)}
                  className="rounded-md p-1 text-muted-foreground/70 hover:bg-muted hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-border py-10 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">No screening questions added yet</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              These are shown to applicants when they apply
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
