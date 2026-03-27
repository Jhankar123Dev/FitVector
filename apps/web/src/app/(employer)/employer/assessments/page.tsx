"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ClipboardCheck,
  Plus,
  Code2,
  FileQuestion,
  BookOpen,
  FileCode,
  Clock,
  Users,
  TrendingUp,
  BarChart3,
  ExternalLink,
  Copy,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_ASSESSMENT_TEMPLATES, MOCK_CANDIDATE_RESULTS } from "@/lib/mock/assessment-data";
import type { AssessmentTemplate, AssessmentType } from "@/types/employer";
import {
  ASSESSMENT_TYPE_LABELS,
  DIFFICULTY_LABELS,
  ASSESSMENT_STATUS_LABELS,
  ASSESSMENT_STATUS_COLORS,
} from "@/types/employer";

// ── Type badge icons ──────────────────────────────────────────────────
const TYPE_ICONS: Record<AssessmentType, React.ElementType> = {
  coding_test: Code2,
  mcq_quiz: FileQuestion,
  case_study: BookOpen,
  assignment: FileCode,
};

const TYPE_COLORS: Record<AssessmentType, string> = {
  coding_test: "bg-brand-50 text-brand-700 border-brand-200",
  mcq_quiz: "bg-emerald-50 text-emerald-700 border-emerald-200",
  case_study: "bg-amber-50 text-amber-700 border-amber-200",
  assignment: "bg-sky-50 text-sky-700 border-sky-200",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  junior: "bg-emerald-50 text-emerald-700 border-emerald-200",
  mid: "bg-amber-50 text-amber-700 border-amber-200",
  senior: "bg-red-50 text-red-700 border-red-200",
};

// ── Stats computation ────────────────────────────────────────────────
function computeStats(templates: AssessmentTemplate[]) {
  const total = templates.length;
  const active = templates.filter((t) => t.status === "active").length;
  const withCandidates = templates.filter((t) => t.candidatesTaken > 0);
  const avgCompletion = withCandidates.length > 0
    ? Math.round(withCandidates.reduce((s, t) => s + t.completionRate, 0) / withCandidates.length)
    : 0;
  const avgScore = withCandidates.length > 0
    ? Math.round(withCandidates.reduce((s, t) => s + t.avgScore, 0) / withCandidates.length)
    : 0;
  return { total, active, avgCompletion, avgScore };
}

export default function AssessmentsPage() {
  const [templates] = useState(MOCK_ASSESSMENT_TEMPLATES);
  const stats = useMemo(() => computeStats(templates), [templates]);

  const filterByTab = (tab: string): AssessmentTemplate[] => {
    switch (tab) {
      case "coding_test":
        return templates.filter((t) => t.type === "coding_test");
      case "mcq_quiz":
        return templates.filter((t) => t.type === "mcq_quiz");
      case "case_study":
        return templates.filter((t) => t.type === "case_study");
      case "assignment":
        return templates.filter((t) => t.type === "assignment");
      default:
        return templates;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-surface-800">
            Assessment Templates
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-surface-500">
            Create and manage candidate assessments
          </p>
        </div>
        <Button asChild className="gap-1.5 w-full sm:w-auto">
          <Link href="/employer/assessments/create">
            <Plus className="h-4 w-4" />
            Create Assessment
          </Link>
        </Button>
      </div>

      {/* ── Stats row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          { label: "Total Templates", value: stats.total, icon: ClipboardCheck, iconBg: "bg-brand-50", iconColor: "text-brand-500" },
          { label: "Active", value: stats.active, icon: TrendingUp, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
          { label: "Avg Completion", value: `${stats.avgCompletion}%`, icon: BarChart3, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
          { label: "Avg Score", value: stats.avgScore, icon: Users, iconBg: "bg-sky-50", iconColor: "text-sky-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-5">
              <div className={cn("hidden sm:flex rounded-lg p-2.5", stat.iconBg)}>
                <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl sm:text-2xl font-bold text-surface-800">{stat.value}</p>
                <p className="text-[10px] sm:text-xs text-surface-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tabs + Template grid ───────────────────────────────── */}
      <Tabs defaultValue="all">
        <TabsList className="overflow-x-auto">
          <TabsTrigger value="all">All ({templates.length})</TabsTrigger>
          <TabsTrigger value="coding_test">Coding ({filterByTab("coding_test").length})</TabsTrigger>
          <TabsTrigger value="mcq_quiz">MCQ ({filterByTab("mcq_quiz").length})</TabsTrigger>
          <TabsTrigger value="case_study">Case Study ({filterByTab("case_study").length})</TabsTrigger>
          <TabsTrigger value="assignment">Assignment ({filterByTab("assignment").length})</TabsTrigger>
        </TabsList>

        {["all", "coding_test", "mcq_quiz", "case_study", "assignment"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            {filterByTab(tab).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                  <ClipboardCheck className="h-10 w-10 text-surface-300" />
                  <p className="mt-3 text-sm font-medium text-surface-600">
                    No {tab === "all" ? "" : ASSESSMENT_TYPE_LABELS[tab as AssessmentType].toLowerCase()} assessments
                  </p>
                  <p className="mt-1 text-xs text-surface-400">
                    Create your first assessment to get started.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filterByTab(tab).map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// ── Template card ────────────────────────────────────────────────────
function TemplateCard({ template }: { template: AssessmentTemplate }) {
  const TypeIcon = TYPE_ICONS[template.type];
  const resultCount = MOCK_CANDIDATE_RESULTS.filter((r) => r.assessmentId === template.id).length;

  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col p-3 sm:p-5">
        {/* Top badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <Badge className={cn("border text-[10px] sm:text-[11px] gap-1", TYPE_COLORS[template.type])}>
            <TypeIcon className="h-3 w-3" />
            {ASSESSMENT_TYPE_LABELS[template.type]}
          </Badge>
          <Badge className={cn("border text-[10px] sm:text-[11px]", DIFFICULTY_COLORS[template.difficulty])}>
            {DIFFICULTY_LABELS[template.difficulty]}
          </Badge>
          <Badge className={cn("border text-[10px] sm:text-[11px]", ASSESSMENT_STATUS_COLORS[template.status])}>
            {ASSESSMENT_STATUS_LABELS[template.status]}
          </Badge>
        </div>

        {/* Title & description */}
        <h3 className="text-sm sm:text-base font-semibold text-surface-800 line-clamp-1">
          {template.title}
        </h3>
        <p className="mt-1 text-[11px] sm:text-xs text-surface-500 line-clamp-2 flex-1">
          {template.description}
        </p>

        {/* Meta row */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] sm:text-xs text-surface-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {template.duration} min
          </span>
          <span className="flex items-center gap-1">
            <FileQuestion className="h-3 w-3" /> {template.questionCount} questions
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {template.candidatesTaken} taken
          </span>
        </div>

        {/* Score & completion */}
        {template.candidatesTaken > 0 && (
          <div className="mt-2 flex items-center gap-4 text-[11px] sm:text-xs">
            <span className="text-surface-500">
              Avg Score: <strong className="text-surface-700">{template.avgScore}%</strong>
            </span>
            <span className="text-surface-500">
              Completion: <strong className="text-surface-700">{template.completionRate}%</strong>
            </span>
          </div>
        )}

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {template.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-surface-100 px-2 py-0.5 text-[10px] font-medium text-surface-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-surface-100 pt-3">
          {resultCount > 0 && (
            <Button variant="outline" size="sm" asChild className="h-7 px-2 text-[11px] sm:text-xs gap-1">
              <Link href={`/employer/assessments/${template.id}/results`}>
                <ExternalLink className="h-3 w-3" />
                Results ({resultCount})
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] sm:text-xs gap-1">
            <Pencil className="h-3 w-3" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] sm:text-xs gap-1">
            <Copy className="h-3 w-3" />
            Duplicate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
