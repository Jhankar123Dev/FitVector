"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JobPostFormData, InterviewType, DifficultyLevel } from "@/types/employer";
import { INTERVIEW_TYPE_LABELS, DIFFICULTY_LABELS } from "@/types/employer";

interface Props {
  form: JobPostFormData;
  update: (updates: Partial<JobPostFormData>) => void;
}

export function Step5AIInterview({ form, update }: Props) {
  const [interviewQInput, setInterviewQInput] = useState("");

  function addInterviewQuestion() {
    if (!interviewQInput.trim() || form.interviewConfig.customQuestions.length >= 3) return;
    update({
      interviewConfig: {
        ...form.interviewConfig,
        customQuestions: [...form.interviewConfig.customQuestions, interviewQInput.trim()],
      },
    });
    setInterviewQInput("");
  }

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-brand-50 p-2">
              <Bot className="h-5 w-5 text-brand-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-surface-800">AI Interview</h2>
              <p className="text-sm text-surface-500">
                Configure automated first-round interviews
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.interviewConfig.enabled}
              onChange={(e) =>
                update({ interviewConfig: { ...form.interviewConfig, enabled: e.target.checked } })
              }
              className="rounded border-surface-300 text-brand-500 focus:ring-brand-200"
            />
            <span className="text-sm font-medium text-surface-700">Enable</span>
          </label>
        </div>

        {form.interviewConfig.enabled && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Interview Type</Label>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(INTERVIEW_TYPE_LABELS) as [InterviewType, string][]).map(
                  ([value, label]) => (
                    <button
                      key={value}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                        form.interviewConfig.interviewType === value
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-surface-200 text-surface-600 hover:border-surface-300",
                      )}
                      onClick={() =>
                        update({ interviewConfig: { ...form.interviewConfig, interviewType: value } })
                      }
                    >
                      {label}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Duration</Label>
              <div className="flex gap-2">
                {([15, 20, 30] as const).map((d) => (
                  <button
                    key={d}
                    className={cn(
                      "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                      form.interviewConfig.duration === d
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-surface-200 text-surface-600 hover:border-surface-300",
                    )}
                    onClick={() =>
                      update({ interviewConfig: { ...form.interviewConfig, duration: d } })
                    }
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="focus">Focus Areas</Label>
              <Input
                id="focus"
                placeholder="e.g. React architecture, state management, performance"
                value={form.interviewConfig.focusAreas}
                onChange={(e) =>
                  update({ interviewConfig: { ...form.interviewConfig, focusAreas: e.target.value } })
                }
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
                        form.interviewConfig.difficultyLevel === value
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-surface-200 text-surface-600 hover:border-surface-300",
                      )}
                      onClick={() =>
                        update({
                          interviewConfig: { ...form.interviewConfig, difficultyLevel: value },
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
              <Label>Custom Must-Ask Questions (up to 3)</Label>
              {form.interviewConfig.customQuestions.length < 3 && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a question..."
                    value={interviewQInput}
                    onChange={(e) => setInterviewQInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); addInterviewQuestion(); }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={addInterviewQuestion}
                    disabled={!interviewQInput.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {form.interviewConfig.customQuestions.length > 0 && (
                <div className="space-y-2 pt-1">
                  {form.interviewConfig.customQuestions.map((q, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-3 py-2"
                    >
                      <span className="flex-1 text-sm text-surface-700">
                        {i + 1}. {q}
                      </span>
                      <button
                        onClick={() =>
                          update({
                            interviewConfig: {
                              ...form.interviewConfig,
                              customQuestions: form.interviewConfig.customQuestions.filter(
                                (_, idx) => idx !== i,
                              ),
                            },
                          })
                        }
                        className="text-surface-400 hover:text-red-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {!form.interviewConfig.enabled && (
          <div className="rounded-xl border-2 border-dashed border-surface-200 py-10 text-center">
            <Bot className="mx-auto h-8 w-8 text-surface-300" />
            <p className="mt-2 text-sm text-surface-500">AI Interview is disabled</p>
            <p className="mt-1 text-xs text-surface-400">
              Toggle on to configure automated first-round interviews
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
