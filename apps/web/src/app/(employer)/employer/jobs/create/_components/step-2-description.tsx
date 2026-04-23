"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Sparkles } from "lucide-react";
import type { JobPostFormData } from "@/types/employer";

interface Props {
  form: JobPostFormData;
  update: (updates: Partial<JobPostFormData>) => void;
}

export function Step2Description({ form, update }: Props) {
  const [aiLoading, setAiLoading] = useState(false);

  async function handleAiAssist() {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/job-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          department: form.department || undefined,
          location: form.location || undefined,
          jobType: form.jobType || undefined,
          workMode: form.workMode || undefined,
          experienceMin: form.experienceMin || undefined,
          experienceMax: form.experienceMax || undefined,
          requiredSkills: form.requiredSkills,
          draftNotes: form.description || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate description");
      update({ description: data.description });
    } catch (err) {
      console.error("AI Assist error:", err);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent-50 p-2">
            <FileText className="h-5 w-5 text-accent-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-surface-800">Job Description</h2>
            <p className="text-sm text-surface-500">Write a detailed description or let AI help</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="description">Description * (Markdown supported)</Label>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-brand-600 hover:text-brand-700"
              onClick={handleAiAssist}
              disabled={aiLoading}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {aiLoading ? "Generating..." : "AI Assist"}
            </Button>
          </div>

          {aiLoading ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-surface-200 bg-surface-50">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              <p className="mt-3 text-sm text-surface-500">
                AI is generating your job description...
              </p>
              <p className="mt-1 text-xs text-surface-400">
                Based on: {form.title || "job title"}, {form.department || "department"},{" "}
                {form.experienceMin}–{form.experienceMax} years
              </p>
            </div>
          ) : (
            <Textarea
              id="description"
              placeholder="Paste rough notes or bullet points, then click AI Assist to generate a professional job description..."
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              className="min-h-[300px] font-mono text-[13px]"
            />
          )}

          {form.description && !aiLoading && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-surface-500">Preview</p>
              <div className="prose prose-sm max-w-none rounded-lg border border-surface-200 bg-surface-50 p-4 text-surface-700">
                {form.description.split("\n").map((line, i) => {
                  if (line.startsWith("## "))
                    return (
                      <h3 key={i} className="mb-2 mt-4 text-base font-semibold text-surface-800">
                        {line.replace("## ", "")}
                      </h3>
                    );
                  if (line.startsWith("- "))
                    return (
                      <p key={i} className="ml-4 text-sm">
                        &bull; {line.replace("- ", "")}
                      </p>
                    );
                  if (line.trim() === "") return <br key={i} />;
                  return <p key={i} className="text-sm">{line}</p>;
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
