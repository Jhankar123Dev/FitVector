"use client";

import { use } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PdfViewer } from "@/components/resume/pdf-viewer";
import { ResumeEditor } from "@/components/resume/resume-editor";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useResumeDetail } from "@/hooks/use-resume";
import Link from "next/link";

export default function ResumeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: resume, isLoading, isError } = useResumeDetail(id);

  if (isLoading) {
    return <LoadingSpinner message="Loading resume..." />;
  }

  if (isError || !resume) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-sm text-muted-foreground">Resume not found</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/resume">Back to resumes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b pb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/resume">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-lg font-semibold">{resume.versionName}</h1>
          <p className="text-xs text-muted-foreground">
            View and download your tailored resume
          </p>
        </div>
      </div>

      {/* Split view */}
      <div className="mt-4 flex min-h-0 flex-1 gap-0 overflow-hidden rounded-lg border">
        {/* Left: Editor */}
        <div className="w-1/2 border-r">
          <ResumeEditor latexSource={resume.latexSource} readOnly />
        </div>

        {/* Right: PDF Preview — compiled on demand */}
        <div className="w-1/2">
          <PdfViewer
            resumeId={id}
            latexSource={resume.latexSource}
            versionName={resume.versionName}
          />
        </div>
      </div>
    </div>
  );
}
