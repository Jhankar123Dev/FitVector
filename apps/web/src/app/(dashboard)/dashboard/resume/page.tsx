"use client";

import { useRef, useState, useCallback } from "react";
import { FileText, Plus, Upload, CheckCircle2, Loader2, AlertCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VersionList } from "@/components/resume/version-list";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useResumeVersions } from "@/hooks/use-resume";
import { useUser } from "@/hooks/use-user";
import { useUsage } from "@/hooks/use-usage";

function BaseResumeUpload({ hasResume, resumeData }: { hasResume: boolean; resumeData?: Record<string, unknown> | null }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showParsed, setShowParsed] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    setSuccess(false);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/ai/parse-resume", { method: "POST", body: formData });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Upload failed");
      }
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setUploading(false);
    }
  }, []);

  return (
    <div className="rounded-xl border border-surface-200 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
            <FileText className="h-5 w-5 text-brand-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-surface-800">Base Resume</p>
            <p className="text-xs text-surface-500">
              {success ? "Resume uploaded — AI will use this for tailoring" : hasResume ? "Resume on file — upload a new one to replace it" : "Upload your resume so AI can tailor it for jobs"}
            </p>
          </div>
          {success && <CheckCircle2 className="h-4 w-4 text-accent-500" />}
        </div>
        <div className="flex items-center gap-2">
          {hasResume && resumeData && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowParsed(!showParsed)}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              {showParsed ? "Hide" : "View"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="mr-1.5 h-3.5 w-3.5" /> {hasResume ? "Replace" : "Upload"} Resume</>
            )}
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>
      {error && <p className="mt-2 flex items-center gap-1 text-xs text-red-600"><AlertCircle className="h-3 w-3" />{error}</p>}
      {success && <p className="mt-2 text-xs text-accent-600">Resume uploaded and parsed successfully!</p>}
      {showParsed && resumeData && (
        <div className="mt-3 rounded-lg border border-surface-200 bg-surface-50 p-3 text-xs text-surface-700 space-y-1">
          {!!resumeData.name && <p><span className="font-medium">Name:</span> {String(resumeData.name)}</p>}
          {!!resumeData.email && <p><span className="font-medium">Email:</span> {String(resumeData.email)}</p>}
          {Array.isArray(resumeData.skills) && resumeData.skills.length > 0 && (
            <p><span className="font-medium">Skills:</span> {(resumeData.skills as string[]).slice(0, 10).join(", ")}{(resumeData.skills as string[]).length > 10 ? ` +${(resumeData.skills as string[]).length - 10} more` : ""}</p>
          )}
          {Array.isArray(resumeData.experience) && (
            <p><span className="font-medium">Experience entries:</span> {(resumeData.experience as unknown[]).length}</p>
          )}
          {Array.isArray(resumeData.education) && (
            <p><span className="font-medium">Education entries:</span> {(resumeData.education as unknown[]).length}</p>
          )}
          <p className="text-surface-400 pt-1">Stored in your profile · Used for AI resume tailoring</p>
        </div>
      )}
    </div>
  );
}

export default function ResumePage() {
  const { user } = useUser();
  const { data: versions, isLoading, isError } = useResumeVersions();
  const { data: usage } = useUsage();

  const resumeUsage = usage?.usage?.resumeTailor;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-surface-800">Resume Versions</h1>
          <p className="mt-1 text-sm text-surface-500">
            Your AI-tailored resumes optimized for specific job descriptions
          </p>
        </div>
        <div className="flex items-center gap-3">
          {resumeUsage && (
            <div className="text-right text-xs text-surface-500">
              <span className="font-medium">
                {resumeUsage.used} of{" "}
                {resumeUsage.limit === -1 ? "unlimited" : resumeUsage.limit}
              </span>{" "}
              tailored this month
            </div>
          )}
        </div>
      </div>

      {/* Base resume upload */}
      <BaseResumeUpload hasResume={!!(user as any)?.resume_data} resumeData={(user as any)?.resume_data} />

      {/* How it works */}
      <div className="rounded-xl border border-surface-200 bg-surface-50 p-4">
        <h3 className="mb-2 text-sm font-medium text-surface-700">How resume tailoring works</h3>
        <ol className="space-y-1 text-xs text-surface-500">
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
