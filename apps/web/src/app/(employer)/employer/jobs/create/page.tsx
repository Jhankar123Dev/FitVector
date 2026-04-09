"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  Sparkles,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateJobPost } from "@/hooks/use-employer-jobs";
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

// ── Pipeline stage config for Step 7 ────────────────────────────────

// Always first two and last two — cannot be moved or removed
const PIPELINE_LOCKED_HEAD = ["applied", "ai_screened"];
const PIPELINE_LOCKED_TAIL = ["offer", "hired"];
const PIPELINE_LOCKED_SET = new Set([...PIPELINE_LOCKED_HEAD, ...PIPELINE_LOCKED_TAIL]);

// Default middle stages between AI Screened and Offer
const DEFAULT_MIDDLE_STAGES: string[] = [
  "assessment_pending", "assessment_completed",
  "ai_interview_pending", "ai_interviewed", "human_interview",
];

const DEFAULT_PIPELINE_STAGES: string[] = [
  ...PIPELINE_LOCKED_HEAD,
  ...DEFAULT_MIDDLE_STAGES,
  ...PIPELINE_LOCKED_TAIL,
];

// Preset stage chips the employer can pick from
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

const DEPARTMENTS = [
  "Engineering",
  "Design",
  "Product",
  "Marketing",
  "Sales",
  "Operations",
  "HR",
  "Finance",
  "Customer Support",
  "Infrastructure",
  "Data Science",
  "Other",
];

const SKILL_SUGGESTIONS = [
  "React",
  "TypeScript",
  "Python",
  "Node.js",
  "Next.js",
  "Java",
  "Go",
  "Rust",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "Docker",
  "Kubernetes",
  "AWS",
  "GCP",
  "Terraform",
  "Figma",
  "GraphQL",
  "REST APIs",
  "Tailwind CSS",
  "Machine Learning",
  "System Design",
  "Agile",
  "CI/CD",
];

export default function CreateJobPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<JobPostFormData>(INITIAL_FORM);
  const [customStageName, setCustomStageName] = useState("");
  const createJobPost = useCreateJobPost();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Temp inputs
  const [reqSkillInput, setReqSkillInput] = useState("");
  const [niceSkillInput, setNiceSkillInput] = useState("");
  const [interviewQInput, setInterviewQInput] = useState("");
  const [assessmentQInput, setAssessmentQInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Screening question builder
  const [sqQuestion, setSqQuestion] = useState("");
  const [sqType, setSqType] = useState<ScreeningQuestionType>("short_answer");
  const [sqOptions, setSqOptions] = useState("");
  const [sqRequired, setSqRequired] = useState(true);

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
          ? sqOptions
              .split(",")
              .map((o) => o.trim())
              .filter(Boolean)
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
    update({
      screeningQuestions: form.screeningQuestions.filter((q) => q.id !== id),
    });
  }

  // ── AI interview custom questions ─────────────────────────────────
  function addInterviewQuestion() {
    if (
      !interviewQInput.trim() ||
      form.interviewConfig.customQuestions.length >= 3
    )
      return;
    update({
      interviewConfig: {
        ...form.interviewConfig,
        customQuestions: [
          ...form.interviewConfig.customQuestions,
          interviewQInput.trim(),
        ],
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
        customQuestions: [
          ...form.assessmentConfig.customQuestions,
          assessmentQInput.trim(),
        ],
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
        pipelineStages: form.pipelineStages,
        status: publishNow ? "active" : "draft",
      } as Record<string, unknown> & { title: string; description: string });
      router.push("/employer/jobs");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save job. Try again.");
    }
  }

  // ── Filtered skill suggestions ────────────────────────────────────
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
            Create Job Post
          </h1>
          <p className="text-xs sm:text-sm text-surface-500">
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
                  "flex items-center gap-1.5 text-xs font-medium transition-colors whitespace-nowrap",
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

      {/* ═══════════ STEP 1: Basic Info ═══════════════════════════════ */}
      {step === 1 && (
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-brand-50 p-2">
                <Briefcase className="h-5 w-5 text-brand-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-surface-800">
                  Basic Information
                </h2>
                <p className="text-sm text-surface-500">
                  Job title, location, and compensation
                </p>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Senior Frontend Developer"
                value={form.title}
                onChange={(e) => update({ title: e.target.value })}
              />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <select
                id="department"
                value={form.department}
                onChange={(e) => update({ department: e.target.value })}
                className="flex h-10 w-full rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Location + Work mode */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="e.g. Bangalore, India"
                  value={form.location}
                  onChange={(e) => update({ location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Work Mode *</Label>
                <div className="flex gap-2">
                  {(
                    Object.entries(WORK_MODE_LABELS) as [WorkMode, string][]
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      className={cn(
                        "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
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
            </div>

            {/* Job type */}
            <div className="space-y-2">
              <Label>Job Type *</Label>
              <div className="flex flex-wrap gap-2">
                {(
                  Object.entries(JOB_TYPE_LABELS) as [JobPostType, string][]
                ).map(([value, label]) => (
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

            {/* Experience range */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expMin">Min Experience (years)</Label>
                <Input
                  id="expMin"
                  type="number"
                  min={0}
                  max={30}
                  value={form.experienceMin}
                  onChange={(e) =>
                    update({ experienceMin: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expMax">Max Experience (years)</Label>
                <Input
                  id="expMax"
                  type="number"
                  min={0}
                  max={30}
                  value={form.experienceMax}
                  onChange={(e) =>
                    update({ experienceMax: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            {/* Salary range */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Salary Range (optional)</Label>
                <label className="flex items-center gap-2 text-xs text-surface-500">
                  <input
                    type="checkbox"
                    checked={!form.salaryVisible}
                    onChange={(e) =>
                      update({ salaryVisible: !e.target.checked })
                    }
                    className="rounded border-surface-300 text-brand-500 focus:ring-brand-200"
                  />
                  Hide from candidates
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={form.salaryMin}
                  onChange={(e) => update({ salaryMin: e.target.value })}
                />
                <span className="text-xs text-surface-500">to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={form.salaryMax}
                  onChange={(e) => update({ salaryMax: e.target.value })}
                />
                <select
                  value={form.salaryCurrency}
                  onChange={(e) => update({ salaryCurrency: e.target.value })}
                  className="h-10 rounded-lg border border-surface-200 bg-white px-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            {/* Openings */}
            <div className="space-y-2">
              <Label htmlFor="openings">Number of Openings</Label>
              <Input
                id="openings"
                type="number"
                min={1}
                max={100}
                value={form.openingsCount}
                onChange={(e) =>
                  update({ openingsCount: Number(e.target.value) })
                }
                className="w-32"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════ STEP 2: Description ═════════════════════════════ */}
      {step === 2 && (
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent-50 p-2">
                <FileText className="h-5 w-5 text-accent-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-surface-800">
                  Job Description
                </h2>
                <p className="text-sm text-surface-500">
                  Write a detailed description or let AI help
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">
                  Description * (Markdown supported)
                </Label>
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
                  className="min-h-[300px] font-mono text-[13px]"
                />
              )}

              {form.description && !aiLoading && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-surface-500">
                    Preview
                  </p>
                  <div className="prose prose-sm max-w-none rounded-lg border border-surface-200 bg-surface-50 p-4 text-surface-700">
                    {form.description.split("\n").map((line, i) => {
                      if (line.startsWith("## "))
                        return (
                          <h3
                            key={i}
                            className="mb-2 mt-4 text-base font-semibold text-surface-800"
                          >
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
                      return (
                        <p key={i} className="text-sm">
                          {line}
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════ STEP 3: Skills ══════════════════════════════════ */}
      {step === 3 && (
        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-50 p-2">
                <Code2 className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-surface-800">
                  Skills
                </h2>
                <p className="text-sm text-surface-500">
                  Define required and nice-to-have skills
                </p>
              </div>
            </div>

            {/* Required skills */}
            <div className="space-y-2">
              <Label>Required Skills *</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Type a skill and press Enter"
                  value={reqSkillInput}
                  onChange={(e) => setReqSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addRequiredSkill();
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => addRequiredSkill()}
                  disabled={!reqSkillInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {/* Suggestions */}
              {reqSkillInput && reqSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {reqSuggestions.slice(0, 6).map((s) => (
                    <button
                      key={s}
                      className="rounded-full border border-surface-200 px-2.5 py-0.5 text-xs text-surface-500 transition-colors hover:border-brand-400 hover:text-brand-600"
                      onClick={() => addRequiredSkill(s)}
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              )}
              {form.requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {form.requiredSkills.map((s) => (
                    <Badge key={s} variant="brand" className="gap-1 pr-1.5">
                      {s}
                      <button
                        onClick={() =>
                          update({
                            requiredSkills: form.requiredSkills.filter(
                              (sk) => sk !== s,
                            ),
                          })
                        }
                        className="ml-0.5 rounded-full p-0.5 hover:bg-brand-200/50"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Nice-to-have skills */}
            <div className="space-y-2">
              <Label>Nice-to-Have Skills</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Type a skill and press Enter"
                  value={niceSkillInput}
                  onChange={(e) => setNiceSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addNiceSkill();
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => addNiceSkill()}
                  disabled={!niceSkillInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {niceSkillInput && niceSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {niceSuggestions.slice(0, 6).map((s) => (
                    <button
                      key={s}
                      className="rounded-full border border-surface-200 px-2.5 py-0.5 text-xs text-surface-500 transition-colors hover:border-surface-400 hover:text-surface-600"
                      onClick={() => addNiceSkill(s)}
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              )}
              {form.niceToHaveSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {form.niceToHaveSkills.map((s) => (
                    <Badge key={s} variant="secondary" className="gap-1 pr-1.5">
                      {s}
                      <button
                        onClick={() =>
                          update({
                            niceToHaveSkills: form.niceToHaveSkills.filter(
                              (sk) => sk !== s,
                            ),
                          })
                        }
                        className="ml-0.5 rounded-full p-0.5 hover:bg-surface-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════ STEP 4: Screening Questions ═════════════════════ */}
      {step === 4 && (
        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-sky-50 p-2">
                <MessageSquare className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-surface-800">
                  Screening Questions
                </h2>
                <p className="text-sm text-surface-500">
                  Add up to 10 custom questions for applicants (optional)
                </p>
              </div>
            </div>

            {/* Question builder */}
            {form.screeningQuestions.length < 10 && (
              <div className="space-y-3 rounded-lg border border-surface-200 bg-surface-50 p-4">
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
                      onChange={(e) =>
                        setSqType(e.target.value as ScreeningQuestionType)
                      }
                      className="flex h-10 w-full rounded-lg border border-surface-200 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
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
                {/* Required toggle */}
                <label className="flex cursor-pointer items-center gap-2 self-start">
                  <div
                    onClick={() => setSqRequired((p) => !p)}
                    className={cn(
                      "relative h-5 w-9 rounded-full transition-colors",
                      sqRequired ? "bg-brand-500" : "bg-surface-300",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                        sqRequired ? "translate-x-4" : "translate-x-0.5",
                      )}
                    />
                  </div>
                  <span className="text-xs text-surface-600">Required</span>
                </label>
                <Button
                  size="sm"
                  onClick={addScreeningQuestion}
                  disabled={!sqQuestion.trim()}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Question
                </Button>
              </div>
            )}

            {/* Question list */}
            {form.screeningQuestions.length > 0 ? (
              <div className="space-y-2">
                {form.screeningQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="flex items-start gap-3 rounded-lg border border-surface-200 bg-white p-3"
                  >
                    <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-surface-300" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-800">
                        {idx + 1}. {q.question}
                      </p>
                      <p className="mt-0.5 text-xs text-surface-400">
                        {q.type === "short_answer"
                          ? "Short answer"
                          : q.type === "yes_no"
                            ? "Yes / No"
                            : `Multiple choice: ${q.options?.join(", ")}`}
                      </p>
                    </div>
                    <button
                      onClick={() => removeScreeningQuestion(q.id)}
                      className="rounded-md p-1 text-surface-400 hover:bg-surface-100 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-surface-200 py-10 text-center">
                <MessageSquare className="mx-auto h-8 w-8 text-surface-300" />
                <p className="mt-2 text-sm text-surface-500">
                  No screening questions added yet
                </p>
                <p className="mt-1 text-xs text-surface-400">
                  These are shown to applicants when they apply
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══════════ STEP 5: AI Interview ════════════════════════════ */}
      {step === 5 && (
        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-brand-50 p-2">
                  <Bot className="h-5 w-5 text-brand-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-surface-800">
                    AI Interview
                  </h2>
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
                    update({
                      interviewConfig: {
                        ...form.interviewConfig,
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-surface-300 text-brand-500 focus:ring-brand-200"
                />
                <span className="text-sm font-medium text-surface-700">
                  Enable
                </span>
              </label>
            </div>

            {form.interviewConfig.enabled && (
              <div className="space-y-5">
                {/* Interview type */}
                <div className="space-y-2">
                  <Label>Interview Type</Label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      Object.entries(INTERVIEW_TYPE_LABELS) as [
                        InterviewType,
                        string,
                      ][]
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                          form.interviewConfig.interviewType === value
                            ? "border-brand-500 bg-brand-50 text-brand-700"
                            : "border-surface-200 text-surface-600 hover:border-surface-300",
                        )}
                        onClick={() =>
                          update({
                            interviewConfig: {
                              ...form.interviewConfig,
                              interviewType: value,
                            },
                          })
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration */}
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
                          update({
                            interviewConfig: {
                              ...form.interviewConfig,
                              duration: d,
                            },
                          })
                        }
                      >
                        {d} min
                      </button>
                    ))}
                  </div>
                </div>

                {/* Focus areas */}
                <div className="space-y-2">
                  <Label htmlFor="focus">Focus Areas</Label>
                  <Input
                    id="focus"
                    placeholder="e.g. React architecture, state management, performance"
                    value={form.interviewConfig.focusAreas}
                    onChange={(e) =>
                      update({
                        interviewConfig: {
                          ...form.interviewConfig,
                          focusAreas: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                {/* Difficulty */}
                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <div className="flex gap-2">
                    {(
                      Object.entries(DIFFICULTY_LABELS) as [
                        DifficultyLevel,
                        string,
                      ][]
                    ).map(([value, label]) => (
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
                            interviewConfig: {
                              ...form.interviewConfig,
                              difficultyLevel: value,
                            },
                          })
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom must-ask questions */}
                <div className="space-y-2">
                  <Label>
                    Custom Must-Ask Questions (up to 3)
                  </Label>
                  {form.interviewConfig.customQuestions.length < 3 && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a question..."
                        value={interviewQInput}
                        onChange={(e) => setInterviewQInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addInterviewQuestion();
                          }
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
                                  customQuestions:
                                    form.interviewConfig.customQuestions.filter(
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
                <p className="mt-2 text-sm text-surface-500">
                  AI Interview is disabled
                </p>
                <p className="mt-1 text-xs text-surface-400">
                  Toggle on to configure automated first-round interviews
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══════════ STEP 6: Assessment ══════════════════════════════ */}
      {step === 6 && (
        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-50 p-2">
                  <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-surface-800">
                    Assessment
                  </h2>
                  <p className="text-sm text-surface-500">
                    Add a skills assessment for candidates
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.assessmentConfig.enabled}
                  onChange={(e) =>
                    update({
                      assessmentConfig: {
                        ...form.assessmentConfig,
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-surface-300 text-brand-500 focus:ring-brand-200"
                />
                <span className="text-sm font-medium text-surface-700">
                  Enable
                </span>
              </label>
            </div>

            {form.assessmentConfig.enabled && (
              <div className="space-y-5">
                {/* Assessment type */}
                <div className="space-y-2">
                  <Label>Assessment Type</Label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      Object.entries(ASSESSMENT_TYPE_LABELS) as [
                        AssessmentType,
                        string,
                      ][]
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                          form.assessmentConfig.assessmentType === value
                            ? "border-brand-500 bg-brand-50 text-brand-700"
                            : "border-surface-200 text-surface-600 hover:border-surface-300",
                        )}
                        onClick={() =>
                          update({
                            assessmentConfig: {
                              ...form.assessmentConfig,
                              assessmentType: value,
                            },
                          })
                        }
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
                      onChange={(e) =>
                        update({
                          assessmentConfig: {
                            ...form.assessmentConfig,
                            mcqCount: Number(e.target.value),
                          },
                        })
                      }
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
                                : "border-surface-200 text-surface-600 hover:border-surface-300",
                            )}
                            onClick={() =>
                              update({
                                assessmentConfig: {
                                  ...form.assessmentConfig,
                                  codeLanguage: key,
                                },
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

                {/* Time limit */}
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
                        assessmentConfig: {
                          ...form.assessmentConfig,
                          timeLimit: Number(e.target.value),
                        },
                      })
                    }
                    className="w-32"
                  />
                </div>

                {/* Difficulty */}
                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <div className="flex gap-2">
                    {(
                      Object.entries(DIFFICULTY_LABELS) as [
                        DifficultyLevel,
                        string,
                      ][]
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        className={cn(
                          "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                          form.assessmentConfig.difficultyLevel === value
                            ? "border-brand-500 bg-brand-50 text-brand-700"
                            : "border-surface-200 text-surface-600 hover:border-surface-300",
                        )}
                        onClick={() =>
                          update({
                            assessmentConfig: {
                              ...form.assessmentConfig,
                              difficultyLevel: value,
                            },
                          })
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom questions / topics */}
                <div className="space-y-2">
                  <Label>Custom Questions or Topics</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a question or topic..."
                      value={assessmentQInput}
                      onChange={(e) => setAssessmentQInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addAssessmentQuestion();
                        }
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
                          className="flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-3 py-2"
                        >
                          <span className="flex-1 text-sm text-surface-700">
                            {i + 1}. {q}
                          </span>
                          <button
                            onClick={() =>
                              update({
                                assessmentConfig: {
                                  ...form.assessmentConfig,
                                  customQuestions:
                                    form.assessmentConfig.customQuestions.filter(
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

                {/* Template library placeholder */}
                <div className="rounded-lg bg-surface-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Template Library
                  </p>
                  <p className="mt-1 text-xs text-surface-400">
                    Pre-built assessment templates for common roles will be
                    available here. Coming soon.
                  </p>
                </div>
              </div>
            )}

            {!form.assessmentConfig.enabled && (
              <div className="rounded-xl border-2 border-dashed border-surface-200 py-10 text-center">
                <ClipboardCheck className="mx-auto h-8 w-8 text-surface-300" />
                <p className="mt-2 text-sm text-surface-500">
                  Assessment is disabled
                </p>
                <p className="mt-1 text-xs text-surface-400">
                  Toggle on to add a coding test, quiz, or assignment
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══════════ STEP 7: Pipeline ════════════════════════════════ */}
      {step === 7 && (() => {
        // Derive the editable middle stages from form state
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
          if (!middleStages.includes(value)) {
            rebuildPipeline([...middleStages, value]);
          }
        }

        function addCustomStage() {
          const trimmed = customStageName.trim();
          if (!trimmed) return;
          rebuildPipeline([...middleStages, trimmed]);
          setCustomStageName("");
        }

        function removeStage(index: number) {
          const updated = middleStages.filter((_, i) => i !== index);
          rebuildPipeline(updated);
        }

        // Group presets by category for display
        const presetGroups = PIPELINE_PRESETS.reduce<Record<string, typeof PIPELINE_PRESETS>>((acc, p) => {
          if (!acc[p.group]) acc[p.group] = [];
          acc[p.group].push(p);
          return acc;
        }, {});

        return (
          <Card>
            <CardContent className="space-y-6 p-6">
              {/* Header */}
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
                          <p className="text-xs text-surface-400 italic">
                            No stages added — pick a preset below or type a custom name
                          </p>
                        )}
                        {middleStages.map((stage, index) => (
                          <Draggable
                            key={`${stage}-${index}`}
                            draggableId={`stage-${index}`}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={cn(
                                  "flex items-center gap-1.5 rounded-lg border bg-white px-2.5 py-1.5 shadow-sm select-none",
                                  snapshot.isDragging
                                    ? "border-brand-400 shadow-md ring-1 ring-brand-300"
                                    : "border-surface-200",
                                )}
                              >
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab text-surface-300 hover:text-surface-500 active:cursor-grabbing"
                                >
                                  <GripVertical className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-xs font-medium text-surface-700">
                                  {getStageName(stage)}
                                </span>
                                <button
                                  onClick={() => removeStage(index)}
                                  className="text-surface-300 hover:text-red-500 transition-colors"
                                  aria-label={`Remove ${getStageName(stage)}`}
                                >
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

                {/* Add stages section */}
                <div className="space-y-3 border-t border-surface-100 pt-4">
                  <p className="text-xs font-semibold text-surface-600">Add Stages</p>

                  {/* Preset chips grouped */}
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
                              {isAdded
                                ? <Check className="h-2.5 w-2.5" />
                                : <Plus className="h-2.5 w-2.5" />
                              }
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Custom stage input */}
                  <div className="flex items-center gap-2 pt-1">
                    <Input
                      placeholder="Custom stage name (e.g. Director Review)…"
                      value={customStageName}
                      onChange={(e) => setCustomStageName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); addCustomStage(); }
                      }}
                      className="h-8 text-xs max-w-72"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={addCustomStage}
                      disabled={!customStageName.trim()}
                      className="h-8 text-xs gap-1 shrink-0"
                    >
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
          {/* Basic info summary */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-surface-800">
                  {form.title || "Untitled Job"}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(1)}
                  className="text-xs text-brand-600"
                >
                  Edit
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="default">{form.department || "No dept"}</Badge>
                <Badge variant="default">
                  {form.location || "No location"} (
                  {WORK_MODE_LABELS[form.workMode]})
                </Badge>
                <Badge variant="default">
                  {JOB_TYPE_LABELS[form.jobType]}
                </Badge>
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
                  {form.openingsCount} opening
                  {form.openingsCount > 1 ? "s" : ""}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Description preview */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-surface-700">
                  Job Description
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(2)}
                  className="text-xs text-brand-600"
                >
                  Edit
                </Button>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-surface-600 line-clamp-6">
                {form.description || "No description provided"}
              </p>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-surface-700">
                  Skills
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(3)}
                  className="text-xs text-brand-600"
                >
                  Edit
                </Button>
              </div>
              <div className="mt-2 space-y-2">
                {form.requiredSkills.length > 0 && (
                  <div>
                    <p className="text-xs text-surface-500">Required</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {form.requiredSkills.map((s) => (
                        <Badge key={s} variant="brand">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {form.niceToHaveSkills.length > 0 && (
                  <div>
                    <p className="text-xs text-surface-500">Nice to have</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {form.niceToHaveSkills.map((s) => (
                        <Badge key={s} variant="secondary">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {form.requiredSkills.length === 0 &&
                  form.niceToHaveSkills.length === 0 && (
                    <p className="text-sm text-surface-400">No skills added</p>
                  )}
              </div>
            </CardContent>
          </Card>

          {/* Screening + AI Interview + Assessment summary */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-surface-700">
                  Configuration
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(4)}
                  className="text-xs text-brand-600"
                >
                  Edit
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-surface-200 p-3">
                  <p className="text-xs text-surface-500">
                    Screening Questions
                  </p>
                  <p className="mt-1 text-sm font-semibold text-surface-800">
                    {form.screeningQuestions.length} question
                    {form.screeningQuestions.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="rounded-lg border border-surface-200 p-3">
                  <p className="text-xs text-surface-500">AI Interview</p>
                  <p className="mt-1 text-sm font-semibold text-surface-800">
                    {form.interviewConfig.enabled ? (
                      <>
                        {INTERVIEW_TYPE_LABELS[form.interviewConfig.interviewType]}{" "}
                        · {form.interviewConfig.duration}min
                      </>
                    ) : (
                      <span className="text-surface-400">Disabled</span>
                    )}
                  </p>
                </div>
                <div className="rounded-lg border border-surface-200 p-3">
                  <p className="text-xs text-surface-500">Assessment</p>
                  <p className="mt-1 text-sm font-semibold text-surface-800">
                    {form.assessmentConfig.enabled ? (
                      <>
                        {ASSESSMENT_TYPE_LABELS[form.assessmentConfig.assessmentType]}{" "}
                        · {form.assessmentConfig.timeLimit}min
                      </>
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
              {submitError && (
                <span className="text-xs text-red-500 mr-2">{submitError}</span>
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
            <Button
              onClick={() => setStep(step + 1)}
              className="gap-1.5"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
