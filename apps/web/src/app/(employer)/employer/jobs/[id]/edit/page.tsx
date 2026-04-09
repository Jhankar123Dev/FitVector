"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
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
  Briefcase,
  FileText,
  Code2,
  MessageSquare,
  Bot,
  ClipboardCheck,
  Eye,
  Trash2,
  GripVertical,
  Lock,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEmployerJob, useUpdateJobPost } from "@/hooks/use-employer-jobs";
import type {
  JobPostFormData,
  WorkMode,
  JobPostType,
  InterviewType,
  DifficultyLevel,
  AssessmentType,
  ScreeningQuestionType,
  ScreeningQuestion,
} from "@/types/employer";
import {
  JOB_TYPE_LABELS,
  WORK_MODE_LABELS,
  INTERVIEW_TYPE_LABELS,
  ASSESSMENT_TYPE_LABELS,
  DIFFICULTY_LABELS,
  JDOODLE_LANGUAGE_MAP,
  getStageName,
} from "@/types/employer";

// ── Step config ─────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Basic Info", icon: Briefcase },
  { id: 2, label: "Description", icon: FileText },
  { id: 3, label: "Skills", icon: Code2 },
  { id: 4, label: "Screening", icon: MessageSquare },
  { id: 5, label: "AI Interview", icon: Bot },
  { id: 6, label: "Assessment", icon: ClipboardCheck },
  { id: 7, label: "Pipeline", icon: GripVertical },
  { id: 8, label: "Review", icon: Eye },
];

// ── Pipeline stage config ────────────────────────────────────────────
const PIPELINE_LOCKED_HEAD = ["applied", "ai_screened"];
const PIPELINE_LOCKED_TAIL = ["offer", "hired"];
const PIPELINE_LOCKED_SET = new Set([...PIPELINE_LOCKED_HEAD, ...PIPELINE_LOCKED_TAIL]);

const DEFAULT_PIPELINE_STAGES: string[] = [
  "applied", "ai_screened",
  "assessment_pending", "assessment_completed",
  "ai_interview_pending", "ai_interviewed", "human_interview",
  "offer", "hired",
];

const PIPELINE_PRESETS: { value: string; label: string; group: string }[] = [
  { value: "assessment_pending",    label: "Test Pending",         group: "Assessment" },
  { value: "assessment_completed",  label: "Test Completed",        group: "Assessment" },
  { value: "ai_interview_pending",  label: "AI Interview Pending",  group: "AI Interview" },
  { value: "ai_interviewed",        label: "AI Interviewed",        group: "AI Interview" },
  { value: "phone_screen",          label: "Phone Screen",          group: "Human Interview" },
  { value: "human_interview",       label: "Human Interview",       group: "Human Interview" },
  { value: "background_check",      label: "Background Check",      group: "Other" },
  { value: "reference_check",       label: "Reference Check",       group: "Other" },
  { value: "hr_round",              label: "HR Round",              group: "Other" },
];

const DEPARTMENTS = [
  "Engineering", "Design", "Product", "Marketing", "Sales",
  "Operations", "HR", "Finance", "Customer Support",
  "Infrastructure", "Data Science", "Other",
];

const SKILL_SUGGESTIONS = [
  "React", "TypeScript", "Python", "Node.js", "Next.js", "Java", "Go", "Rust",
  "PostgreSQL", "MongoDB", "Redis", "Docker", "Kubernetes", "AWS", "GCP",
  "Terraform", "Figma", "GraphQL", "REST APIs", "Tailwind CSS",
  "Machine Learning", "System Design", "Agile", "CI/CD",
];

const BLANK_FORM: JobPostFormData = {
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
  },
  pipelineStages: DEFAULT_PIPELINE_STAGES,
};

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: jobData, isLoading, isError } = useEmployerJob(id);
  const updateJobPost = useUpdateJobPost();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<JobPostFormData>(BLANK_FORM);
  const [hydrated, setHydrated] = useState(false);
  const [customStageName, setCustomStageName] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Temp inputs
  const [reqSkillInput, setReqSkillInput] = useState("");
  const [niceSkillInput, setNiceSkillInput] = useState("");
  const [interviewQInput, setInterviewQInput] = useState("");
  const [assessmentQInput, setAssessmentQInput] = useState("");

  // Screening question builder
  const [sqQuestion, setSqQuestion] = useState("");
  const [sqType, setSqType] = useState<ScreeningQuestionType>("short_answer");
  const [sqOptions, setSqOptions] = useState("");
  const [sqRequired, setSqRequired] = useState(true);

  // ── Hydrate form from fetched job ────────────────────────────────
  useEffect(() => {
    if (!jobData?.data || hydrated) return;
    const job = jobData.data as unknown as Record<string, unknown>;

    // interviewPlan is the DB key; transformJobPost maps it to interviewPlan (not interviewConfig)
    const rawInterview = (job.interviewPlan ?? job.interviewConfig) as Record<string, unknown> | null;
    const rawAssessment = job.assessmentConfig as Record<string, unknown> | null;

    setForm({
      title: (job.title as string) || "",
      department: (job.department as string) || "",
      location: (job.location as string) || "",
      workMode: (job.workMode as WorkMode) || "onsite",
      jobType: (job.jobType as JobPostType) || "fulltime",
      experienceMin: (job.experienceMin as number) ?? 0,
      experienceMax: (job.experienceMax as number) ?? 3,
      salaryMin: job.salaryMin != null ? String(job.salaryMin) : "",
      salaryMax: job.salaryMax != null ? String(job.salaryMax) : "",
      salaryCurrency: (job.salaryCurrency as string) || "INR",
      salaryVisible: (job.salaryVisible as boolean) ?? true,
      openingsCount: (job.openingsCount as number) || 1,
      description: (job.description as string) || "",
      requiredSkills: (job.requiredSkills as string[]) || [],
      niceToHaveSkills: (job.niceToHaveSkills as string[]) || [],
      screeningQuestions: (job.screeningQuestions as ScreeningQuestion[]) || [],
      interviewConfig: rawInterview
        ? {
            enabled: true,
            interviewType: (rawInterview.interviewType as InterviewType) || "technical",
            duration: ((rawInterview.duration as number) || 20) as 30 | 20 | 15,
            focusAreas: (rawInterview.focusAreas as string) || "",
            difficultyLevel: (rawInterview.difficultyLevel as DifficultyLevel) || "medium",
            customQuestions: (rawInterview.customQuestions as string[]) || [],
          }
        : BLANK_FORM.interviewConfig,
      assessmentConfig: rawAssessment
        ? {
            enabled: true,
            assessmentType: (rawAssessment.assessmentType as AssessmentType) || "coding_test",
            timeLimit: (rawAssessment.timeLimit as number) || 60,
            difficultyLevel: (rawAssessment.difficultyLevel as DifficultyLevel) || "medium",
            customQuestions: (rawAssessment.customQuestions as string[]) || [],
            mcqCount: (rawAssessment.mcqCount as number) || undefined,
            codingCount: (rawAssessment.codingCount as number) || undefined,
            codeLanguage: (rawAssessment.codeLanguage as string) || "python3",
          }
        : BLANK_FORM.assessmentConfig,
      pipelineStages: (job.pipelineStages as string[]) || DEFAULT_PIPELINE_STAGES,
    });
    setHydrated(true);
  }, [jobData, hydrated]);

  const progress = (step / STEPS.length) * 100;

  const update = useCallback(
    (updates: Partial<JobPostFormData>) =>
      setForm((prev) => ({ ...prev, ...updates })),
    [],
  );

  // ── Skill helpers ─────────────────────────────────────────────────
  function addRequiredSkill(skill?: string) {
    const s = (skill || reqSkillInput).trim();
    if (s && !form.requiredSkills.includes(s)) {
      update({ requiredSkills: [...form.requiredSkills, s] });
    }
    setReqSkillInput("");
  }

  function addNiceSkill(skill?: string) {
    const s = (skill || niceSkillInput).trim();
    if (s && !form.niceToHaveSkills.includes(s)) {
      update({ niceToHaveSkills: [...form.niceToHaveSkills, s] });
    }
    setNiceSkillInput("");
  }

  // ── Screening question helpers ────────────────────────────────────
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

  function removeScreeningQuestion(qId: string) {
    update({ screeningQuestions: form.screeningQuestions.filter((q) => q.id !== qId) });
  }

  // ── AI interview custom questions ─────────────────────────────────
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

  // ── Assessment custom questions ───────────────────────────────────
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

  // ── AI Assist ─────────────────────────────────────────────────────
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

  // ── Submit ────────────────────────────────────────────────────────
  async function handleSaveJob(publishNow: boolean) {
    setSubmitError(null);
    try {
      await updateJobPost.mutateAsync({
        id,
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
        pipelineStages: form.pipelineStages,
        status: publishNow ? "active" : "draft",
      });
      router.push("/employer/jobs");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save job. Try again.");
    }
  }

  // ── Skill suggestions ─────────────────────────────────────────────
  const reqSuggestions = SKILL_SUGGESTIONS.filter(
    (s) =>
      !form.requiredSkills.includes(s) &&
      !form.niceToHaveSkills.includes(s) &&
      s.toLowerCase().includes(reqSkillInput.toLowerCase()),
  );

  const niceSuggestions = SKILL_SUGGESTIONS.filter(
    (s) =>
      !form.requiredSkills.includes(s) &&
      !form.niceToHaveSkills.includes(s) &&
      s.toLowerCase().includes(niceSkillInput.toLowerCase()),
  );

  // ── Loading / error states ─────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (isError || !jobData?.data) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <p className="text-surface-600">Job not found or you don't have access.</p>
        <Button variant="outline" onClick={() => router.push("/employer/jobs")}>
          Back to Jobs
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6 py-2 sm:py-4">
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
          <h1 className="text-xl sm:text-2xl font-semibold text-surface-800">
            Edit Job
          </h1>
          <p className="text-xs text-surface-500">
            {form.title || "Untitled"} · Step {step} of {STEPS.length}
          </p>
        </div>
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-1.5" />

      {/* Step tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const active = step === s.id;
          const done = step > s.id;
          return (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-brand-50 text-brand-700 border border-brand-200"
                  : done
                  ? "text-surface-500 hover:text-surface-700"
                  : "text-surface-400 hover:text-surface-600",
              )}
            >
              {done ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Icon className="h-3 w-3" />
              )}
              {s.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════ STEP 1: Basic Info ══════════════════════════════ */}
      {step === 1 && (
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Senior Frontend Engineer"
                value={form.title}
                onChange={(e) => update({ title: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <select
                  id="department"
                  value={form.department}
                  onChange={(e) => update({ department: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-400"
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g. Bangalore, India"
                  value={form.location}
                  onChange={(e) => update({ location: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Work Mode</Label>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(WORK_MODE_LABELS) as [WorkMode, string][]).map(([value, label]) => (
                  <button
                    key={value}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                      form.workMode === value
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-surface-200 text-surface-600 hover:border-surface-300",
                    )}
                    onClick={() => update({ workMode: value })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Job Type</Label>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(JOB_TYPE_LABELS) as [JobPostType, string][]).map(([value, label]) => (
                  <button
                    key={value}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                      form.jobType === value
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-surface-200 text-surface-600 hover:border-surface-300",
                    )}
                    onClick={() => update({ jobType: value })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Experience Range (years)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={form.experienceMin}
                    onChange={(e) => update({ experienceMin: Number(e.target.value) })}
                    className="w-20"
                  />
                  <span className="text-sm text-surface-500">to</span>
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={form.experienceMax}
                    onChange={(e) => update({ experienceMax: Number(e.target.value) })}
                    className="w-20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="openings">Openings</Label>
                <Input
                  id="openings"
                  type="number"
                  min={1}
                  value={form.openingsCount}
                  onChange={(e) => update({ openingsCount: Number(e.target.value) })}
                  className="w-24"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Salary Range</Label>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={form.salaryCurrency}
                  onChange={(e) => update({ salaryCurrency: e.target.value })}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-400"
                >
                  {["INR", "USD", "EUR", "GBP", "AED", "SGD"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <Input
                  placeholder="Min"
                  value={form.salaryMin}
                  onChange={(e) => update({ salaryMin: e.target.value })}
                  className="w-28"
                />
                <span className="text-sm text-surface-500">–</span>
                <Input
                  placeholder="Max"
                  value={form.salaryMax}
                  onChange={(e) => update({ salaryMax: e.target.value })}
                  className="w-28"
                />
                <label className="flex items-center gap-1.5 text-sm text-surface-600">
                  <input
                    type="checkbox"
                    checked={form.salaryVisible}
                    onChange={(e) => update({ salaryVisible: e.target.checked })}
                    className="rounded border-surface-300 text-brand-500 focus:ring-brand-200"
                  />
                  Show to candidates
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════ STEP 2: Description ═════════════════════════════ */}
      {step === 2 && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Job Description *</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-brand-600 hover:text-brand-700"
                  onClick={handleAiAssist}
                  disabled={aiLoading}
                  type="button"
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
                    Based on: {form.title || "job title"},{" "}
                    {form.department || "department"},{" "}
                    {form.experienceMin}–{form.experienceMax} years
                  </p>
                </div>
              ) : (
                <Textarea
                  id="description"
                  placeholder="Paste rough notes or bullet points, then click AI Assist to generate a professional job description..."
                  value={form.description}
                  onChange={(e) => update({ description: e.target.value })}
                  rows={16}
                  className="resize-none font-mono text-sm"
                />
              )}
              <p className="text-xs text-surface-400">
                Markdown is supported. Be specific about day-to-day responsibilities.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════ STEP 3: Skills ══════════════════════════════════ */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Required skills */}
          <Card>
            <CardContent className="space-y-3 p-6">
              <div>
                <Label>Required Skills</Label>
                <p className="mt-0.5 text-xs text-surface-400">Must-have skills for this role</p>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a required skill…"
                  value={reqSkillInput}
                  onChange={(e) => setReqSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRequiredSkill(); } }}
                />
                <Button variant="outline" size="icon" onClick={() => addRequiredSkill()} disabled={!reqSkillInput.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {form.requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.requiredSkills.map((s) => (
                    <span key={s} className="flex items-center gap-1 rounded-full bg-brand-50 border border-brand-200 px-2.5 py-1 text-xs font-medium text-brand-700">
                      {s}
                      <button onClick={() => update({ requiredSkills: form.requiredSkills.filter((x) => x !== s) })} className="ml-0.5 text-brand-400 hover:text-brand-700">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {reqSuggestions.length > 0 && (
                <div>
                  <p className="text-xs text-surface-400 mb-1">Suggestions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {reqSuggestions.slice(0, 10).map((s) => (
                      <button key={s} onClick={() => addRequiredSkill(s)} className="rounded-full border border-surface-200 px-2.5 py-1 text-xs text-surface-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-colors">
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Nice-to-have skills */}
          <Card>
            <CardContent className="space-y-3 p-6">
              <div>
                <Label>Nice-to-have Skills</Label>
                <p className="mt-0.5 text-xs text-surface-400">Optional skills that would be a bonus</p>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a nice-to-have skill…"
                  value={niceSkillInput}
                  onChange={(e) => setNiceSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNiceSkill(); } }}
                />
                <Button variant="outline" size="icon" onClick={() => addNiceSkill()} disabled={!niceSkillInput.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {form.niceToHaveSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.niceToHaveSkills.map((s) => (
                    <span key={s} className="flex items-center gap-1 rounded-full bg-surface-100 border border-surface-200 px-2.5 py-1 text-xs font-medium text-surface-700">
                      {s}
                      <button onClick={() => update({ niceToHaveSkills: form.niceToHaveSkills.filter((x) => x !== s) })} className="ml-0.5 text-surface-400 hover:text-surface-700">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {niceSuggestions.length > 0 && (
                <div>
                  <p className="text-xs text-surface-400 mb-1">Suggestions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {niceSuggestions.slice(0, 10).map((s) => (
                      <button key={s} onClick={() => addNiceSkill(s)} className="rounded-full border border-surface-200 px-2.5 py-1 text-xs text-surface-600 hover:border-surface-300 hover:bg-surface-100 transition-colors">
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════ STEP 4: Screening Questions ═════════════════════ */}
      {step === 4 && (
        <Card>
          <CardContent className="space-y-5 p-6">
            <div>
              <Label>Screening Questions</Label>
              <p className="mt-0.5 text-xs text-surface-400">
                Up to 10 questions shown to candidates at apply time
              </p>
            </div>

            {/* Existing questions */}
            {form.screeningQuestions.length > 0 && (
              <div className="space-y-2">
                {form.screeningQuestions.map((q, i) => (
                  <div key={q.id} className="flex items-start gap-2 rounded-lg border border-surface-200 bg-white px-3 py-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-100 text-[10px] font-semibold text-surface-500">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-surface-700">{q.question}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] text-surface-400 capitalize">{q.type.replace("_", " ")}</span>
                        {q.required && (
                          <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600">Required</span>
                        )}
                      </div>
                      {q.options && q.options.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {q.options.map((opt) => (
                            <span key={opt} className="rounded-full bg-surface-50 border border-surface-100 px-2 py-0.5 text-[10px] text-surface-500">{opt}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={() => removeScreeningQuestion(q.id)} className="text-surface-300 hover:text-red-500 transition-colors shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new question */}
            {form.screeningQuestions.length < 10 && (
              <div className="rounded-lg border border-dashed border-surface-300 p-4 space-y-3">
                <p className="text-xs font-semibold text-surface-600">Add Question</p>
                <Textarea
                  placeholder="e.g. How many years of experience do you have with React?"
                  value={sqQuestion}
                  onChange={(e) => setSqQuestion(e.target.value)}
                  rows={2}
                  className="resize-none text-sm"
                />
                <div className="flex flex-wrap gap-2">
                  {(["short_answer", "yes_no", "multiple_choice", "number"] as ScreeningQuestionType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSqType(t)}
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                        sqType === t
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-surface-200 text-surface-600 hover:border-surface-300",
                      )}
                    >
                      {t === "short_answer" ? "Short Answer" : t === "yes_no" ? "Yes / No" : t === "multiple_choice" ? "Multiple Choice" : "Number"}
                    </button>
                  ))}
                </div>
                {sqType === "multiple_choice" && (
                  <div className="space-y-1">
                    <Label className="text-xs">Options (comma-separated)</Label>
                    <Input
                      placeholder="e.g. Less than 1 year, 1–3 years, 3+ years"
                      value={sqOptions}
                      onChange={(e) => setSqOptions(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-surface-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sqRequired}
                      onChange={(e) => setSqRequired(e.target.checked)}
                      className="rounded border-surface-300 text-brand-500 focus:ring-brand-200"
                    />
                    Required
                  </label>
                  <Button
                    size="sm"
                    onClick={addScreeningQuestion}
                    disabled={!sqQuestion.trim()}
                    className="gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══════════ STEP 5: AI Interview ════════════════════════════ */}
      {step === 5 && (
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                  <Bot className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-surface-800">AI Interview</h2>
                  <p className="text-sm text-surface-500">Configure the AI-led screening interview</p>
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.interviewConfig.enabled}
                  onChange={(e) => update({ interviewConfig: { ...form.interviewConfig, enabled: e.target.checked } })}
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
                    {(Object.entries(INTERVIEW_TYPE_LABELS) as [InterviewType, string][]).map(([value, label]) => (
                      <button
                        key={value}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                          form.interviewConfig.interviewType === value
                            ? "border-brand-500 bg-brand-50 text-brand-700"
                            : "border-surface-200 text-surface-600 hover:border-surface-300",
                        )}
                        onClick={() => update({ interviewConfig: { ...form.interviewConfig, interviewType: value } })}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min={10}
                      max={60}
                      value={form.interviewConfig.duration}
                      onChange={(e) => update({ interviewConfig: { ...form.interviewConfig, duration: Number(e.target.value) as 30 | 20 | 15 } })}
                      className="w-24"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <div className="flex gap-2">
                      {(Object.entries(DIFFICULTY_LABELS) as [DifficultyLevel, string][]).map(([value, label]) => (
                        <button
                          key={value}
                          className={cn(
                            "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                            form.interviewConfig.difficultyLevel === value
                              ? "border-brand-500 bg-brand-50 text-brand-700"
                              : "border-surface-200 text-surface-600 hover:border-surface-300",
                          )}
                          onClick={() => update({ interviewConfig: { ...form.interviewConfig, difficultyLevel: value } })}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="focusAreas">Focus Areas</Label>
                  <Textarea
                    id="focusAreas"
                    placeholder="e.g. System design, React hooks, problem-solving approach..."
                    value={form.interviewConfig.focusAreas}
                    onChange={(e) => update({ interviewConfig: { ...form.interviewConfig, focusAreas: e.target.value } })}
                    rows={3}
                    className="resize-none text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Custom Questions (up to 3)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a custom question..."
                      value={interviewQInput}
                      onChange={(e) => setInterviewQInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addInterviewQuestion(); } }}
                    />
                    <Button variant="outline" size="icon" onClick={addInterviewQuestion} disabled={!interviewQInput.trim() || form.interviewConfig.customQuestions.length >= 3}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {form.interviewConfig.customQuestions.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {form.interviewConfig.customQuestions.map((q, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-3 py-2">
                          <span className="flex-1 text-sm text-surface-700">{i + 1}. {q}</span>
                          <button onClick={() => update({ interviewConfig: { ...form.interviewConfig, customQuestions: form.interviewConfig.customQuestions.filter((_, idx) => idx !== i) } })} className="text-surface-400 hover:text-red-500">
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
                <p className="mt-1 text-xs text-surface-400">Toggle on to configure an AI-led screening interview</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══════════ STEP 6: Assessment ══════════════════════════════ */}
      {step === 6 && (
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-surface-800">Assessment</h2>
                  <p className="text-sm text-surface-500">Add a skills assessment for candidates</p>
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.assessmentConfig.enabled}
                  onChange={(e) => update({ assessmentConfig: { ...form.assessmentConfig, enabled: e.target.checked } })}
                  className="rounded border-surface-300 text-brand-500 focus:ring-brand-200"
                />
                <span className="text-sm font-medium text-surface-700">Enable</span>
              </label>
            </div>

            {form.assessmentConfig.enabled && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Assessment Type</Label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(ASSESSMENT_TYPE_LABELS) as [AssessmentType, string][]).map(([value, label]) => (
                      <button
                        key={value}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                          form.assessmentConfig.assessmentType === value
                            ? "border-brand-500 bg-brand-50 text-brand-700"
                            : "border-surface-200 text-surface-600 hover:border-surface-300",
                        )}
                        onClick={() => update({ assessmentConfig: { ...form.assessmentConfig, assessmentType: value } })}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* MCQ count — shown for mixed & mcq_quiz */}
                {(form.assessmentConfig.assessmentType === "mixed" || form.assessmentConfig.assessmentType === "mcq_quiz") && (
                  <div className="space-y-2">
                    <Label htmlFor="mcqCount">Number of MCQ Questions</Label>
                    <Input
                      id="mcqCount"
                      type="number"
                      min={5}
                      max={50}
                      value={form.assessmentConfig.mcqCount ?? (form.assessmentConfig.assessmentType === "mcq_quiz" ? 20 : 30)}
                      onChange={(e) => update({ assessmentConfig: { ...form.assessmentConfig, mcqCount: Number(e.target.value) } })}
                      className="w-32"
                    />
                    <p className="text-xs text-surface-500">AI will generate this many multiple-choice questions.</p>
                  </div>
                )}

                {/* Coding count + language — shown for mixed & coding_test */}
                {(form.assessmentConfig.assessmentType === "mixed" || form.assessmentConfig.assessmentType === "coding_test") && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="codingCount">Number of Coding Problems</Label>
                      <Input
                        id="codingCount"
                        type="number"
                        min={1}
                        max={10}
                        value={form.assessmentConfig.codingCount ?? 2}
                        onChange={(e) => update({ assessmentConfig: { ...form.assessmentConfig, codingCount: Number(e.target.value) } })}
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
                                : "border-surface-200 text-surface-600 hover:border-surface-300",
                            )}
                            onClick={() => update({ assessmentConfig: { ...form.assessmentConfig, codeLanguage: key } })}
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
                    onChange={(e) => update({ assessmentConfig: { ...form.assessmentConfig, timeLimit: Number(e.target.value) } })}
                    className="w-32"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <div className="flex gap-2">
                    {(Object.entries(DIFFICULTY_LABELS) as [DifficultyLevel, string][]).map(([value, label]) => (
                      <button
                        key={value}
                        className={cn(
                          "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                          form.assessmentConfig.difficultyLevel === value
                            ? "border-brand-500 bg-brand-50 text-brand-700"
                            : "border-surface-200 text-surface-600 hover:border-surface-300",
                        )}
                        onClick={() => update({ assessmentConfig: { ...form.assessmentConfig, difficultyLevel: value } })}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Custom Questions or Topics</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a question or topic..."
                      value={assessmentQInput}
                      onChange={(e) => setAssessmentQInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAssessmentQuestion(); } }}
                    />
                    <Button variant="outline" size="icon" onClick={addAssessmentQuestion} disabled={!assessmentQInput.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {form.assessmentConfig.customQuestions.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {form.assessmentConfig.customQuestions.map((q, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-3 py-2">
                          <span className="flex-1 text-sm text-surface-700">{i + 1}. {q}</span>
                          <button onClick={() => update({ assessmentConfig: { ...form.assessmentConfig, customQuestions: form.assessmentConfig.customQuestions.filter((_, idx) => idx !== i) } })} className="text-surface-400 hover:text-red-500">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-surface-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-surface-500">Template Library</p>
                  <p className="mt-1 text-xs text-surface-400">Pre-built assessment templates for common roles will be available here. Coming soon.</p>
                </div>
              </div>
            )}

            {!form.assessmentConfig.enabled && (
              <div className="rounded-xl border-2 border-dashed border-surface-200 py-10 text-center">
                <ClipboardCheck className="mx-auto h-8 w-8 text-surface-300" />
                <p className="mt-2 text-sm text-surface-500">Assessment is disabled</p>
                <p className="mt-1 text-xs text-surface-400">Toggle on to add a coding test, quiz, or assignment</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══════════ STEP 7: Pipeline ════════════════════════════════ */}
      {step === 7 && (() => {
        const middleStages = form.pipelineStages.filter((s) => !PIPELINE_LOCKED_SET.has(s));

        function rebuildPipeline(newMiddle: string[]) {
          update({ pipelineStages: [...PIPELINE_LOCKED_HEAD, ...newMiddle, ...PIPELINE_LOCKED_TAIL] });
        }

        function onDragEnd(result: DropResult) {
          if (!result.destination || result.destination.index === result.source.index) return;
          const reordered = Array.from(middleStages);
          const [moved] = reordered.splice(result.source.index, 1);
          reordered.splice(result.destination.index, 0, moved);
          rebuildPipeline(reordered);
        }

        function addPresetStage(value: string) {
          if (!middleStages.includes(value)) rebuildPipeline([...middleStages, value]);
        }

        function addCustomStage() {
          const trimmed = customStageName.trim();
          if (!trimmed) return;
          rebuildPipeline([...middleStages, trimmed]);
          setCustomStageName("");
        }

        function removeStage(index: number) {
          rebuildPipeline(middleStages.filter((_, i) => i !== index));
        }

        const presetGroups = PIPELINE_PRESETS.reduce<Record<string, typeof PIPELINE_PRESETS>>((acc, p) => {
          if (!acc[p.group]) acc[p.group] = [];
          acc[p.group].push(p);
          return acc;
        }, {});

        return (
          <Card>
            <CardContent className="space-y-6 p-6">
              <div>
                <h2 className="text-base font-semibold text-surface-800">Pipeline Configuration</h2>
                <p className="mt-1 text-xs text-surface-500">
                  Design your hiring flow. Drag to reorder stages, click a preset to add, or type a custom stage name.
                  <span className="ml-1 inline-flex items-center gap-0.5 text-surface-400">
                    <Lock className="h-2.5 w-2.5" /> Locked stages are always included.
                  </span>
                </p>
              </div>

              {/* Full pipeline preview */}
              <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-surface-50 p-3 border border-surface-200">
                {form.pipelineStages.map((stage, i) => (
                  <div key={`preview-${stage}-${i}`} className="flex items-center gap-1.5">
                    <span className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-medium",
                      PIPELINE_LOCKED_SET.has(stage)
                        ? "bg-surface-200 text-surface-600"
                        : "bg-brand-50 border border-brand-200 text-brand-700",
                    )}>
                      {getStageName(stage)}
                    </span>
                    {i < form.pipelineStages.length - 1 && (
                      <ChevronRight className="h-3 w-3 text-surface-300 shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              {/* Builder */}
              <div className="space-y-4">
                {/* Locked head */}
                <div className="flex items-center gap-2 flex-wrap">
                  {PIPELINE_LOCKED_HEAD.map((stage) => (
                    <span key={stage} className="flex items-center gap-1.5 rounded-lg border border-surface-200 bg-surface-100 px-3 py-1.5 text-xs font-medium text-surface-500">
                      <Lock className="h-3 w-3 shrink-0" />
                      {getStageName(stage)}
                    </span>
                  ))}
                  <ChevronRight className="h-4 w-4 text-surface-300 shrink-0" />
                </div>

                {/* DnD zone */}
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="pipeline-middle" direction="horizontal">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "flex flex-wrap items-center gap-2 min-h-[52px] rounded-lg border-2 border-dashed p-3 transition-colors",
                          snapshot.isDraggingOver
                            ? "border-brand-400 bg-brand-50/40"
                            : "border-surface-200 bg-surface-50/50",
                        )}
                      >
                        {middleStages.length === 0 && !snapshot.isDraggingOver && (
                          <p className="text-xs text-surface-400 italic">No stages added — pick a preset below or type a custom name</p>
                        )}
                        {middleStages.map((stage, index) => (
                          <Draggable key={`${stage}-${index}`} draggableId={`stage-${index}`} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={cn(
                                  "flex items-center gap-1.5 rounded-lg border bg-white px-2.5 py-1.5 shadow-sm select-none",
                                  snapshot.isDragging ? "border-brand-400 shadow-md ring-1 ring-brand-300" : "border-surface-200",
                                )}
                              >
                                <div {...provided.dragHandleProps} className="cursor-grab text-surface-300 hover:text-surface-500 active:cursor-grabbing">
                                  <GripVertical className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-xs font-medium text-surface-700">{getStageName(stage)}</span>
                                <button onClick={() => removeStage(index)} className="text-surface-300 hover:text-red-500 transition-colors" aria-label={`Remove ${getStageName(stage)}`}>
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                {/* Locked tail */}
                <div className="flex items-center gap-2 flex-wrap">
                  <ChevronRight className="h-4 w-4 text-surface-300 shrink-0" />
                  {PIPELINE_LOCKED_TAIL.map((stage) => (
                    <span key={stage} className="flex items-center gap-1.5 rounded-lg border border-surface-200 bg-surface-100 px-3 py-1.5 text-xs font-medium text-surface-500">
                      <Lock className="h-3 w-3 shrink-0" />
                      {getStageName(stage)}
                    </span>
                  ))}
                </div>

                {/* Add stages */}
                <div className="space-y-3 border-t border-surface-100 pt-4">
                  <p className="text-xs font-semibold text-surface-600">Add Stages</p>
                  <div className="space-y-2">
                    {Object.entries(presetGroups).map(([group, presets]) => (
                      <div key={group} className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-medium text-surface-400 w-24 shrink-0">{group}</span>
                        {presets.map((preset) => {
                          const isAdded = middleStages.includes(preset.value);
                          return (
                            <button
                              key={preset.value}
                              onClick={() => !isAdded && addPresetStage(preset.value)}
                              disabled={isAdded}
                              className={cn(
                                "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                                isAdded
                                  ? "border-surface-200 bg-surface-100 text-surface-400 cursor-default"
                                  : "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 cursor-pointer",
                              )}
                            >
                              {isAdded ? <Check className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Input
                      placeholder="Custom stage name (e.g. Director Review)…"
                      value={customStageName}
                      onChange={(e) => setCustomStageName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomStage(); } }}
                      className="h-8 text-xs max-w-72"
                    />
                    <Button size="sm" variant="outline" onClick={addCustomStage} disabled={!customStageName.trim()} className="h-8 text-xs gap-1 shrink-0">
                      <Plus className="h-3 w-3" /> Add Custom
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* ═══════════ STEP 8: Review ══════════════════════════════════ */}
      {step === 8 && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-surface-800">{form.title || "Untitled Job"}</h2>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-xs text-brand-600">Edit</Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="default">{form.department || "No dept"}</Badge>
                <Badge variant="default">{form.location || "No location"} ({WORK_MODE_LABELS[form.workMode]})</Badge>
                <Badge variant="default">{JOB_TYPE_LABELS[form.jobType]}</Badge>
                <Badge variant="default">{form.experienceMin}–{form.experienceMax} years</Badge>
                {form.salaryMin && form.salaryMax && (
                  <Badge variant="default">
                    {form.salaryCurrency} {Number(form.salaryMin).toLocaleString()}–{Number(form.salaryMax).toLocaleString()}
                    {!form.salaryVisible && " (hidden)"}
                  </Badge>
                )}
                <Badge variant="default">{form.openingsCount} opening{form.openingsCount > 1 ? "s" : ""}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-surface-700">Job Description</h3>
                <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="text-xs text-brand-600">Edit</Button>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-surface-600 line-clamp-6">
                {form.description || "No description provided"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-surface-700">Skills</h3>
                <Button variant="ghost" size="sm" onClick={() => setStep(3)} className="text-xs text-brand-600">Edit</Button>
              </div>
              <div className="mt-2 space-y-2">
                {form.requiredSkills.length > 0 && (
                  <div>
                    <p className="text-xs text-surface-500">Required</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {form.requiredSkills.map((s) => <Badge key={s} variant="brand">{s}</Badge>)}
                    </div>
                  </div>
                )}
                {form.niceToHaveSkills.length > 0 && (
                  <div>
                    <p className="text-xs text-surface-500">Nice to have</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {form.niceToHaveSkills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                    </div>
                  </div>
                )}
                {form.requiredSkills.length === 0 && form.niceToHaveSkills.length === 0 && (
                  <p className="text-sm text-surface-400">No skills added</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-surface-700">Configuration</h3>
                <Button variant="ghost" size="sm" onClick={() => setStep(4)} className="text-xs text-brand-600">Edit</Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-surface-200 p-3">
                  <p className="text-xs text-surface-500">Screening Questions</p>
                  <p className="mt-1 text-sm font-semibold text-surface-800">
                    {form.screeningQuestions.length} question{form.screeningQuestions.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="rounded-lg border border-surface-200 p-3">
                  <p className="text-xs text-surface-500">AI Interview</p>
                  <p className="mt-1 text-sm font-semibold text-surface-800">
                    {form.interviewConfig.enabled ? (
                      <>{INTERVIEW_TYPE_LABELS[form.interviewConfig.interviewType]} · {form.interviewConfig.duration}min</>
                    ) : (
                      <span className="text-surface-400">Disabled</span>
                    )}
                  </p>
                </div>
                <div className="rounded-lg border border-surface-200 p-3">
                  <p className="text-xs text-surface-500">Assessment</p>
                  <p className="mt-1 text-sm font-semibold text-surface-800">
                    {form.assessmentConfig.enabled ? (
                      <>{ASSESSMENT_TYPE_LABELS[form.assessmentConfig.assessmentType]} · {form.assessmentConfig.timeLimit}min</>
                    ) : (
                      <span className="text-surface-400">Disabled</span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Footer navigation ────────────────────────────────────── */}
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
              {submitError && <span className="text-xs text-red-500 mr-2">{submitError}</span>}
              <Button
                variant="outline"
                onClick={() => handleSaveJob(false)}
                disabled={updateJobPost.isPending}
              >
                Save as Draft
              </Button>
              <Button
                onClick={() => handleSaveJob(true)}
                disabled={updateJobPost.isPending}
                className="gap-1.5"
              >
                {updateJobPost.isPending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {updateJobPost.isPending ? "Saving..." : "Save Changes"}
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
