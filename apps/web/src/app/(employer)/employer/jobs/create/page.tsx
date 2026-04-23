"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, Briefcase, FileText, Code2, MessageSquare, Bot, ClipboardCheck, GripVertical, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateJobPost } from "@/hooks/use-employer-jobs";
import { useAssessments } from "@/hooks/use-assessments";
import type { JobPostFormData } from "@/types/employer";
import { Step1BasicInfo } from "./_components/step-1-basic-info";
import { Step2Description } from "./_components/step-2-description";
import { Step3Skills } from "./_components/step-3-skills";
import { Step4Screening } from "./_components/step-4-screening";
import { Step5AIInterview } from "./_components/step-5-ai-interview";
import { Step6Assessment } from "./_components/step-6-assessment";
import { Step7Pipeline, DEFAULT_PIPELINE_STAGES } from "./_components/step-7-pipeline";
import { Step8Review } from "./_components/step-8-review";

const STEPS = [
  { id: 1, label: "Basic Info",   icon: Briefcase },
  { id: 2, label: "Description",  icon: FileText },
  { id: 3, label: "Skills",       icon: Code2 },
  { id: 4, label: "Screening",    icon: MessageSquare },
  { id: 5, label: "AI Interview", icon: Bot },
  { id: 6, label: "Assessment",   icon: ClipboardCheck },
  { id: 7, label: "Pipeline",     icon: GripVertical },
  { id: 8, label: "Review",       icon: Eye },
];

const INITIAL_FORM: JobPostFormData = {
  title: "",
  department: "",
  location: "",
  workMode: "onsite",
  jobType: "fulltime",
  experienceMin: 0,
  experienceMax: 3,
  salaryMin: "",
  salaryMax: "",
  salaryCurrency: "INR",
  salaryVisible: true,
  openingsCount: 1,
  description: "",
  requiredSkills: [],
  niceToHaveSkills: [],
  screeningQuestions: [],
  interviewConfig: {
    enabled: false,
    interviewType: "technical",
    duration: 20,
    focusAreas: "",
    difficultyLevel: "medium",
    customQuestions: [],
  },
  assessmentConfig: {
    enabled: false,
    assessmentType: "coding_test",
    timeLimit: 60,
    difficultyLevel: "medium",
    customQuestions: [],
    mcqCount: undefined,
    codingCount: undefined,
    codeLanguage: "python3",
  },
  pipelineStages: DEFAULT_PIPELINE_STAGES,
};

export default function CreateJobPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<JobPostFormData>(INITIAL_FORM);
  const [linkedAssessmentId, setLinkedAssessmentId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createJobPost = useCreateJobPost();
  const { data: assessmentsData } = useAssessments();
  const existingAssessments = (assessmentsData?.data ?? []) as Array<{
    id: string;
    name: string;
    assessmentType: string;
  }>;

  const progress = (step / STEPS.length) * 100;

  const update = useCallback(
    (updates: Partial<JobPostFormData>) => setForm((prev) => ({ ...prev, ...updates })),
    [],
  );

  async function handleSaveJob(publishNow: boolean) {
    setSubmitError(null);
    try {
      await createJobPost.mutateAsync({
        title: form.title,
        department: form.department || null,
        location: form.location || null,
        workMode: form.workMode || null,
        jobType: form.jobType || null,
        experienceMin: form.experienceMin || null,
        experienceMax: form.experienceMax || null,
        salaryMin: form.salaryMin ? parseInt(form.salaryMin, 10) : null,
        salaryMax: form.salaryMax ? parseInt(form.salaryMax, 10) : null,
        salaryCurrency: form.salaryCurrency,
        salaryVisible: form.salaryVisible,
        description: form.description,
        requiredSkills: form.requiredSkills,
        niceToHaveSkills: form.niceToHaveSkills,
        screeningQuestions: form.screeningQuestions,
        openingsCount: form.openingsCount,
        interviewPlan: form.interviewConfig?.enabled ? form.interviewConfig : null,
        assessmentConfig: form.assessmentConfig?.enabled ? form.assessmentConfig : null,
        assessmentId: linkedAssessmentId ?? null,
        pipelineStages: form.pipelineStages,
        status: publishNow ? "active" : "draft",
      } as Record<string, unknown> & { title: string; description: string });
      router.push("/employer/jobs");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save job. Try again.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 py-2 sm:space-y-6 sm:py-4">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => router.push("/employer/jobs")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-surface-800 sm:text-2xl">Create Job Post</h1>
          <p className="text-xs text-surface-500 sm:text-sm">
            Step {step} of {STEPS.length} — {STEPS[step - 1].label}
          </p>
        </div>
      </div>

      {/* Progress + step indicators */}
      <div className="space-y-3">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between overflow-x-auto">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap text-xs font-medium transition-colors",
                  s.id === step
                    ? "text-brand-600"
                    : s.id < step
                      ? "text-accent-600"
                      : "text-surface-400",
                )}
                onClick={() => s.id < step && setStep(s.id)}
                disabled={s.id > step}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                    s.id === step
                      ? "bg-brand-500 text-white"
                      : s.id < step
                        ? "bg-accent-500 text-white"
                        : "bg-surface-200 text-surface-500",
                  )}
                >
                  {s.id < step ? <Check className="h-3.5 w-3.5" /> : s.id}
                </span>
                <span className="hidden lg:inline">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {step === 1 && <Step1BasicInfo form={form} update={update} />}
      {step === 2 && <Step2Description form={form} update={update} />}
      {step === 3 && <Step3Skills form={form} update={update} />}
      {step === 4 && <Step4Screening form={form} update={update} />}
      {step === 5 && <Step5AIInterview form={form} update={update} />}
      {step === 6 && (
        <Step6Assessment
          form={form}
          update={update}
          linkedAssessmentId={linkedAssessmentId}
          setLinkedAssessmentId={setLinkedAssessmentId}
          existingAssessments={existingAssessments}
        />
      )}
      {step === 7 && <Step7Pipeline form={form} update={update} />}
      {step === 8 && <Step8Review form={form} goToStep={setStep} />}

      {/* Footer navigation */}
      <div className="flex items-center justify-between border-t border-surface-200 pt-4">
        <Button
          variant="outline"
          onClick={() => (step > 1 ? setStep(step - 1) : router.push("/employer/jobs"))}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          {step === 1 ? "Cancel" : "Back"}
        </Button>

        <div className="flex items-center gap-2">
          {step === 8 ? (
            <>
              {submitError && (
                <span className="mr-2 text-xs text-red-500">{submitError}</span>
              )}
              <Button
                variant="outline"
                onClick={() => handleSaveJob(false)}
                disabled={createJobPost.isPending}
              >
                Save as Draft
              </Button>
              <Button
                onClick={() => handleSaveJob(true)}
                disabled={createJobPost.isPending}
                className="gap-1.5"
              >
                {createJobPost.isPending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {createJobPost.isPending ? "Publishing..." : "Publish Job"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setStep(step + 1)} className="gap-1.5">
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
