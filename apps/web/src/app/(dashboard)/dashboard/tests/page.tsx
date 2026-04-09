"use client";

import Link from "next/link";
import { ClipboardList, Clock, ExternalLink, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCandidateTests } from "@/hooks/use-candidate-tests";
import type { CandidateTest } from "@/hooks/use-candidate-tests";

const STATUS_CONFIG: Record<
  CandidateTest["status"],
  { label: string; className: string }
> = {
  invited: {
    label: "Invited",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  started: {
    label: "In Progress",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  submitted: {
    label: "Submitted",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
  graded: {
    label: "Graded",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  expired: {
    label: "Expired",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

const TYPE_LABELS: Record<string, string> = {
  coding_test: "Coding Test",
  mcq_quiz: "MCQ Quiz",
  mixed: "Mixed (MCQ + Coding)",
  case_study: "Case Study",
  assignment: "Assignment",
};

function formatScore(score: number | null): string {
  if (score === null) return "--";
  return `${score}%`;
}

function isPassed(score: number | null, passingScore: number | null): boolean | null {
  if (score === null || passingScore === null) return null;
  return score >= passingScore;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-lg bg-surface-100"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <ClipboardList className="mb-4 h-12 w-12 text-surface-300" />
        <h3 className="text-lg font-medium text-surface-700">No tests yet</h3>
        <p className="mt-1 text-sm text-surface-500">
          When employers invite you to take assessments, they will appear here.
        </p>
      </CardContent>
    </Card>
  );
}

export default function CandidateTestsPage() {
  const { data: tests, isLoading, isError } = useCandidateTests();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 pb-4">
        <h1 className="text-2xl font-semibold text-surface-800">My Tests</h1>
        {tests && tests.length > 0 && (
          <Badge variant="secondary" className="text-sm">
            {tests.length}
          </Badge>
        )}
      </div>

      {isLoading && <LoadingSkeleton />}

      {isError && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-red-600">
            Failed to load tests. Please try again later.
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && (!tests || tests.length === 0) && (
        <EmptyState />
      )}

      {!isLoading && !isError && tests && tests.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-200 text-left text-xs font-medium uppercase tracking-wider text-surface-500">
                    <th className="px-4 py-3">Test Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Job</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {tests.map((test) => {
                    const statusCfg =
                      STATUS_CONFIG[test.status] ?? STATUS_CONFIG.submitted;
                    const effectiveScore =
                      test.status === "graded" ? test.finalScore : test.autoScore;
                    const displayScore = formatScore(effectiveScore);
                    const passed = isPassed(effectiveScore, test.passingScore);

                    return (
                      <tr key={test.id} className="hover:bg-surface-50">
                        <td className="px-4 py-3 font-medium text-surface-800">
                          <div className="flex items-center gap-2">
                            <ClipboardList className="h-4 w-4 shrink-0 text-surface-400" />
                            {test.assessmentName}
                          </div>
                          {test.timeLimit && (
                            <div className="mt-0.5 flex items-center gap-1 text-xs text-surface-400">
                              <Clock className="h-3 w-3" />
                              {test.timeLimit} min
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">
                            {TYPE_LABELS[test.assessmentType] ??
                              test.assessmentType}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-surface-600">
                          {test.jobTitle}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={statusCfg.className}
                          >
                            {statusCfg.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-surface-700">
                              {displayScore}
                            </span>
                            {passed === true && (
                              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                                Passed
                              </Badge>
                            )}
                            {passed === false && (
                              <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">
                                Failed
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-surface-500">
                          {formatDate(
                            test.submittedAt ?? test.startedAt ?? test.createdAt,
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <TestAction test={test} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TestAction({ test }: { test: CandidateTest }) {
  if (test.status === "invited" || test.status === "started") {
    return (
      <Button size="sm" asChild>
        <Link href={`/assessments/take/${test.id}`}>
          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
          Take Test
        </Link>
      </Button>
    );
  }

  if (test.status === "graded") {
    return (
      <Button size="sm" variant="outline" asChild>
        <Link href={`/assessments/take/${test.id}`}>
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          View Results
        </Link>
      </Button>
    );
  }

  return null;
}
