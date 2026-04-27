"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { JobPostFormData } from "@/types/employer";
import {
  JOB_TYPE_LABELS,
  WORK_MODE_LABELS,
  INTERVIEW_TYPE_LABELS,
  ASSESSMENT_TYPE_LABELS,
} from "@/types/employer";

interface Props {
  form: JobPostFormData;
  goToStep: (step: number) => void;
}

export function Step8Review({ form, goToStep }: Props) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {form.title || "Untitled Job"}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => goToStep(1)} className="text-xs text-brand-600">
              Edit
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="default">{form.department || "No dept"}</Badge>
            <Badge variant="default">
              {form.location || "No location"} ({WORK_MODE_LABELS[form.workMode]})
            </Badge>
            <Badge variant="default">{JOB_TYPE_LABELS[form.jobType]}</Badge>
            <Badge variant="default">
              {form.experienceMin}–{form.experienceMax} years
            </Badge>
            {form.salaryMin && form.salaryMax && (
              <Badge variant="default">
                {form.salaryCurrency} {Number(form.salaryMin).toLocaleString()}–
                {Number(form.salaryMax).toLocaleString()}
                {!form.salaryVisible && " (hidden)"}
              </Badge>
            )}
            <Badge variant="default">
              {form.openingsCount} opening{form.openingsCount > 1 ? "s" : ""}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground/80">Job Description</h3>
            <Button variant="ghost" size="sm" onClick={() => goToStep(2)} className="text-xs text-brand-600">
              Edit
            </Button>
          </div>
          <p className="mt-2 line-clamp-6 whitespace-pre-line text-sm text-muted-foreground">
            {form.description || "No description provided"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground/80">Skills</h3>
            <Button variant="ghost" size="sm" onClick={() => goToStep(3)} className="text-xs text-brand-600">
              Edit
            </Button>
          </div>
          <div className="mt-2 space-y-2">
            {form.requiredSkills.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Required</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {form.requiredSkills.map((s) => (
                    <Badge key={s} variant="brand">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {form.niceToHaveSkills.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Nice to have</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {form.niceToHaveSkills.map((s) => (
                    <Badge key={s} variant="secondary">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {form.requiredSkills.length === 0 && form.niceToHaveSkills.length === 0 && (
              <p className="text-sm text-muted-foreground/70">No skills added</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground/80">Configuration</h3>
            <Button variant="ghost" size="sm" onClick={() => goToStep(4)} className="text-xs text-brand-600">
              Edit
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Screening Questions</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {form.screeningQuestions.length} question
                {form.screeningQuestions.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">AI Interview</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {form.interviewConfig.enabled ? (
                  <>
                    {INTERVIEW_TYPE_LABELS[form.interviewConfig.interviewType]} ·{" "}
                    {form.interviewConfig.duration}min
                  </>
                ) : (
                  <span className="text-muted-foreground/70">Disabled</span>
                )}
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Assessment</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {form.assessmentConfig.enabled ? (
                  <>
                    {ASSESSMENT_TYPE_LABELS[form.assessmentConfig.assessmentType]} ·{" "}
                    {form.assessmentConfig.timeLimit}min
                  </>
                ) : (
                  <span className="text-muted-foreground/70">Disabled</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
