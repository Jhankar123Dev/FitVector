"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus,
  MoreHorizontal,
  Pause,
  Play,
  Copy,
  XCircle,
  Pencil,
  Users,
  MapPin,
  Calendar,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_JOB_POSTS } from "@/lib/mock/employer-data";
import type { JobPost, JobPostStatus } from "@/types/employer";
import {
  JOB_STATUS_LABELS,
  JOB_TYPE_LABELS,
  WORK_MODE_LABELS,
} from "@/types/employer";

const STATUS_BADGE_VARIANT: Record<
  JobPostStatus,
  "success" | "brand" | "warning" | "default" | "destructive"
> = {
  active: "success",
  draft: "default",
  paused: "warning",
  closed: "destructive",
  filled: "brand",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function JobActionsMenu({
  job,
  onAction,
}: {
  job: JobPost;
  onAction: (action: string, jobId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setOpen(!open)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-1 w-44 rounded-xl border border-surface-200 bg-white py-1 shadow-card-hover">
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-surface-600 hover:bg-surface-50"
              onClick={() => {
                onAction("edit", job.id);
                setOpen(false);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            {job.status === "active" && (
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-surface-600 hover:bg-surface-50"
                onClick={() => {
                  onAction("pause", job.id);
                  setOpen(false);
                }}
              >
                <Pause className="h-3.5 w-3.5" />
                Pause
              </button>
            )}
            {job.status === "paused" && (
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-surface-600 hover:bg-surface-50"
                onClick={() => {
                  onAction("resume", job.id);
                  setOpen(false);
                }}
              >
                <Play className="h-3.5 w-3.5" />
                Resume
              </button>
            )}
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-surface-600 hover:bg-surface-50"
              onClick={() => {
                onAction("duplicate", job.id);
                setOpen(false);
              }}
            >
              <Copy className="h-3.5 w-3.5" />
              Duplicate
            </button>
            {job.status !== "closed" && job.status !== "filled" && (
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={() => {
                  onAction("close", job.id);
                  setOpen(false);
                }}
              >
                <XCircle className="h-3.5 w-3.5" />
                Close
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function JobRow({
  job,
  onAction,
}: {
  job: JobPost;
  onAction: (action: string, jobId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-surface-200 bg-white p-4 transition-shadow hover:shadow-card sm:flex-row sm:items-center sm:justify-between">
      {/* Left: job info */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/employer/jobs/${job.id}/pipeline`}
            className="truncate text-sm font-semibold text-surface-800 hover:text-brand-600 transition-colors"
          >
            {job.title}
          </Link>
          <Badge variant={STATUS_BADGE_VARIANT[job.status]} className="shrink-0">
            {JOB_STATUS_LABELS[job.status]}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-surface-500">
          <span className="flex items-center gap-1">
            <Briefcase className="h-3 w-3" />
            {job.department} &middot; {JOB_TYPE_LABELS[job.jobType]}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {job.location} ({WORK_MODE_LABELS[job.workMode]})
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Posted {formatDate(job.createdAt)}
          </span>
        </div>
      </div>

      {/* Middle: applicant stats */}
      <div className="flex items-center gap-6 text-center">
        <div>
          <p className="text-lg font-bold text-surface-800">
            {job.applicantsCount}
          </p>
          <p className="text-[11px] text-surface-500">Applicants</p>
        </div>
        <div className="hidden sm:block">
          <p className="text-lg font-bold text-surface-800">
            {job.screenedCount}
          </p>
          <p className="text-[11px] text-surface-500">Screened</p>
        </div>
        <div className="hidden sm:block">
          <p className="text-lg font-bold text-surface-800">
            {job.interviewedCount}
          </p>
          <p className="text-[11px] text-surface-500">Interviewed</p>
        </div>
        {job.hiredCount > 0 && (
          <div>
            <p className="text-lg font-bold text-accent-600">
              {job.hiredCount}
            </p>
            <p className="text-[11px] text-surface-500">Hired</p>
          </div>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/employer/jobs/${job.id}/pipeline`}>
            <Users className="mr-1.5 h-3.5 w-3.5" />
            View
          </Link>
        </Button>
        <JobActionsMenu job={job} onAction={onAction} />
      </div>
    </div>
  );
}

export default function EmployerJobsPage() {
  const [jobs, setJobs] = useState<JobPost[]>(MOCK_JOB_POSTS);

  function handleAction(action: string, jobId: string) {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        switch (action) {
          case "pause":
            return { ...j, status: "paused" as const };
          case "resume":
            return { ...j, status: "active" as const };
          case "close":
            return { ...j, status: "closed" as const };
          case "duplicate":
            // Add a duplicate at the top
            return j; // handled below
          default:
            return j;
        }
      }),
    );

    if (action === "duplicate") {
      const source = jobs.find((j) => j.id === jobId);
      if (source) {
        const dup: JobPost = {
          ...source,
          id: `jp-dup-${Date.now()}`,
          title: `${source.title} (Copy)`,
          status: "draft",
          applicantsCount: 0,
          screenedCount: 0,
          interviewedCount: 0,
          hiredCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setJobs((prev) => [dup, ...prev]);
      }
    }
  }

  const filterByStatus = (status?: JobPostStatus) =>
    status ? jobs.filter((j) => j.status === status) : jobs;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-surface-800">Jobs</h1>
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-surface-500">
            Manage your job postings and track applicants
          </p>
        </div>
        <Button asChild>
          <Link href="/employer/jobs/create">
            <Plus className="mr-1.5 h-4 w-4" />
            Post New Job
          </Link>
        </Button>
      </div>

      {/* Filter tabs + job list */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            All ({jobs.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({filterByStatus("active").length})
          </TabsTrigger>
          <TabsTrigger value="paused">
            Paused ({filterByStatus("paused").length})
          </TabsTrigger>
          <TabsTrigger value="closed">
            Closed ({filterByStatus("closed").length})
          </TabsTrigger>
          <TabsTrigger value="draft">
            Draft ({filterByStatus("draft").length})
          </TabsTrigger>
        </TabsList>

        {["all", "active", "paused", "closed", "draft"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-3">
            {filterByStatus(
              tab === "all" ? undefined : (tab as JobPostStatus),
            ).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Briefcase className="h-10 w-10 text-surface-300" />
                  <p className="mt-3 text-sm font-medium text-surface-600">
                    No {tab === "all" ? "" : tab} jobs found
                  </p>
                  <p className="mt-1 text-xs text-surface-400">
                    {tab === "draft"
                      ? "Draft jobs will appear here when you save a job without publishing."
                      : "Create a new job posting to get started."}
                  </p>
                  <Button size="sm" className="mt-4" asChild>
                    <Link href="/employer/jobs/create">
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Post a Job
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filterByStatus(
                tab === "all" ? undefined : (tab as JobPostStatus),
              ).map((job) => (
                <JobRow key={job.id} job={job} onAction={handleAction} />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
