"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Rocket,
  CreditCard,
  Smartphone,
  CheckCircle2,
  X,
  Loader2,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useEmployerJobs,
  useChangeJobStatus,
  useDuplicateJobPost,
  type JobPostWithCounts,
} from "@/hooks/use-employer-jobs";
import { Skeleton, SkeletonJobRow } from "@/components/ui/skeleton";
import type { JobPost, JobPostStatus, PromotionType, PromotionDuration } from "@/types/employer";
import {
  JOB_STATUS_LABELS,
  JOB_TYPE_LABELS,
  WORK_MODE_LABELS,
  PROMOTION_TYPE_LABELS,
  PROMOTION_PRICING,
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
          <div className="absolute right-0 z-50 mt-1 w-44 rounded-xl border border-border bg-popover py-1 shadow-lg">
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
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
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
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
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
                onClick={() => {
                  onAction("resume", job.id);
                  setOpen(false);
                }}
              >
                <Play className="h-3.5 w-3.5" />
                Resume
              </button>
            )}
            {job.status === "draft" && (
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-brand-600 hover:bg-brand-50"
                onClick={() => {
                  onAction("publish", job.id);
                  setOpen(false);
                }}
              >
                <Play className="h-3.5 w-3.5" />
                Publish
              </button>
            )}
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
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
  onBoost,
}: {
  job: JobPostWithCounts;
  onAction: (action: string, jobId: string) => void;
  onBoost: (job: JobPostWithCounts) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
      {/* Left: job info */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/employer/jobs/${job.id}/pipeline`}
            className="truncate text-sm font-semibold text-card-foreground hover:text-primary transition-colors"
          >
            {job.title}
          </Link>
          <Badge variant={STATUS_BADGE_VARIANT[job.status]} className="shrink-0">
            {JOB_STATUS_LABELS[job.status]}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
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
          <p className="text-lg font-bold text-foreground">
            {job.applicantsCount}
          </p>
          <p className="text-[11px] text-muted-foreground">Applicants</p>
        </div>
        <div className="hidden sm:block">
          <p className="text-lg font-bold text-foreground">
            {job.screenedCount}
          </p>
          <p className="text-[11px] text-muted-foreground">Screened</p>
        </div>
        <div className="hidden sm:block">
          <p className="text-lg font-bold text-foreground">
            {job.interviewedCount}
          </p>
          <p className="text-[11px] text-muted-foreground">Interviewed</p>
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
        {job.status === "active" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onBoost(job)}
            className="gap-1 text-xs"
          >
            <Rocket className="h-3 w-3" />
            Boost
          </Button>
        )}
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
  const router = useRouter();
  const { data: jobsData, isLoading, error } = useEmployerJobs();
  const changeStatus = useChangeJobStatus();
  const duplicateJob = useDuplicateJobPost();
  const [boostJob, setBoostJob] = useState<JobPostWithCounts | null>(null);

  const jobs: JobPostWithCounts[] = jobsData?.data || [];

  function handleAction(action: string, jobId: string) {
    switch (action) {
      case "edit":
        router.push(`/employer/jobs/${jobId}/edit`);
        break;
      case "pause":
        changeStatus.mutate({ id: jobId, status: "paused" });
        break;
      case "resume":
        changeStatus.mutate({ id: jobId, status: "active" });
        break;
      case "close":
        changeStatus.mutate({ id: jobId, status: "closed" });
        break;
      case "publish":
        changeStatus.mutate({ id: jobId, status: "active" });
        break;
      case "duplicate":
        duplicateJob.mutate(jobId);
        break;
    }
  }

  const filterByStatus = (status?: JobPostStatus) =>
    status ? jobs.filter((j) => j.status === status) : jobs;

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-4 w-56 opacity-60" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        {/* Tabs bar */}
        <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
          {[52, 56, 52, 52, 44].map((w, i) => (
            <Skeleton key={i} className="h-8 rounded-md" style={{ width: w }} />
          ))}
        </div>
        {/* Job rows */}
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonJobRow key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load jobs. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Jobs</h1>
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground">
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
                <JobRow key={job.id} job={job} onAction={handleAction} onBoost={setBoostJob} />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Boost Job Modal */}
      {boostJob && (
        <BoostJobModal job={boostJob} onClose={() => setBoostJob(null)} />
      )}
    </div>
  );
}

// ─── Boost Job Modal ───────────────────────────────────────────────────────

function BoostJobModal({ job, onClose }: { job: JobPost; onClose: () => void }) {
  const [promoType, setPromoType] = useState<PromotionType>("sponsored_feed");
  const [duration, setDuration] = useState<PromotionDuration>(14);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi">("card");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const price = PROMOTION_PRICING[duration].price;

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-base font-semibold text-foreground">
            {submitted ? "Promotion Active!" : "Boost Job Listing"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center p-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {job.title} is now promoted!
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {PROMOTION_TYPE_LABELS[promoType].label} for {duration} days
            </p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" onClick={onClose}>Done</Button>
              <Button size="sm" asChild>
                <a href="/employer/promotions">View Promotions</a>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {/* Job info */}
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm font-medium text-foreground">{job.title}</p>
              <p className="text-xs text-muted-foreground">
                {job.location} · {job.applicantsCount} applicants
              </p>
            </div>

            {/* Promotion Type */}
            <div>
              <Label className="text-xs">Promotion Type</Label>
              <div className="mt-2 space-y-2">
                {(Object.keys(PROMOTION_TYPE_LABELS) as PromotionType[]).map((type) => {
                  const config = PROMOTION_TYPE_LABELS[type];
                  return (
                    <button
                      key={type}
                      onClick={() => setPromoType(type)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                        promoType === type
                          ? "border-primary/40 bg-primary/5"
                          : "border-border hover:border-border/80",
                      )}
                    >
                      <div className={cn(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                        promoType === type ? "border-primary bg-primary" : "border-muted-foreground/40",
                      )}>
                        {promoType === type && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{config.label}</p>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration */}
            <div>
              <Label className="text-xs">Duration</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {([7, 14, 30] as PromotionDuration[]).map((d) => {
                  const p = PROMOTION_PRICING[d];
                  return (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={cn(
                        "rounded-lg border p-3 text-center transition-colors",
                        duration === d
                          ? "border-primary/40 bg-primary/5"
                          : "border-border hover:border-border/80",
                      )}
                    >
                      <p className="text-sm font-semibold text-foreground">{p.label}</p>
                      <p className="text-lg font-bold text-brand-600">₹{p.price.toLocaleString()}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-lg border border-border p-3">
              <p className="mb-1 text-xs font-medium text-muted-foreground">Preview</p>
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-400 text-white text-[10px]">
                  <Megaphone className="mr-0.5 h-2.5 w-2.5" />
                  Sponsored
                </Badge>
                <span className="text-sm font-medium text-foreground">{job.title}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground/70">{job.companyId ? "TechStartup Inc" : ""} · {job.location}</p>
            </div>

            {/* Payment Method */}
            <div>
              <Label className="text-xs">Payment Method</Label>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setPaymentMethod("card")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg border py-2 text-xs font-medium transition-colors",
                    paymentMethod === "card"
                      ? "border-primary/40 bg-primary/5 text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  Card
                </button>
                <button
                  onClick={() => setPaymentMethod("upi")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg border py-2 text-xs font-medium transition-colors",
                    paymentMethod === "upi"
                      ? "border-primary/40 bg-primary/5 text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  UPI
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-muted-foreground/70">
                Payment powered by Razorpay · Secure checkout
              </p>
            </div>

            {/* Total + Submit */}
            <div className="flex items-center justify-between border-t pt-3">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-foreground">₹{price.toLocaleString()}</p>
              </div>
              <Button onClick={handleSubmit} disabled={submitting} className="gap-1.5">
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Rocket className="h-4 w-4" />
                )}
                {submitting ? "Processing..." : "Promote Job"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
