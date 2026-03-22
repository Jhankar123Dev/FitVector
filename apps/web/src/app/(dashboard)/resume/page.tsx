"use client";

import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VersionList } from "@/components/resume/version-list";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useResumeVersions } from "@/hooks/use-resume";
import { useUser } from "@/hooks/use-user";
import { useUsage } from "@/hooks/use-usage";

export default function ResumePage() {
  const { user } = useUser();
  const { data: versions, isLoading, isError } = useResumeVersions();
  const { data: usage } = useUsage();

  const resumeUsage = usage?.usage?.resumeTailor;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resume Versions</h1>
          <p className="text-sm text-muted-foreground">
            Your AI-tailored resumes optimized for specific job descriptions
          </p>
        </div>
        <div className="flex items-center gap-3">
          {resumeUsage && (
            <div className="text-right text-xs text-muted-foreground">
              <span className="font-medium">
                {resumeUsage.used} of{" "}
                {resumeUsage.limit === -1 ? "unlimited" : resumeUsage.limit}
              </span>{" "}
              tailored this month
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h3 className="mb-2 text-sm font-medium">How resume tailoring works</h3>
        <ol className="space-y-1 text-xs text-muted-foreground">
          <li>
            1. Open any job from the Jobs tab and click{" "}
            <Badge variant="outline" className="text-[10px]">
              Tailor Resume
            </Badge>
          </li>
          <li>2. AI analyzes the job description and rewrites your resume with matching keywords</li>
          <li>3. Download as PDF or LaTeX for Overleaf editing</li>
        </ol>
      </div>

      {/* Versions list */}
      {isLoading && <LoadingSpinner message="Loading your resume versions..." />}

      {isError && (
        <EmptyState
          icon={FileText}
          title="Failed to load resumes"
          description="Something went wrong. Please try again."
        />
      )}

      {!isLoading && !isError && versions && versions.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No tailored resumes yet"
          description="Search for jobs and click 'Tailor Resume' on any job card to generate your first ATS-optimized resume."
          action={
            <Button variant="outline" size="sm" asChild>
              <a href="/dashboard/jobs">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Search Jobs
              </a>
            </Button>
          }
        />
      )}

      {versions && versions.length > 0 && <VersionList versions={versions} />}
    </div>
  );
}
