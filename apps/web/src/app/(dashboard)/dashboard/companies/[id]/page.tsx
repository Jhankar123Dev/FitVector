"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  Globe,
  MapPin,
  Users,
  Briefcase,
  IndianRupee,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FitVectorApplyModal } from "@/components/jobs/fitvector-apply-modal";
import { useFitVectorApplications } from "@/hooks/use-fitvector-apply";
import type { JobSearchResult } from "@/types/job";

interface ActiveJob {
  id: string;
  title: string;
  location: string | null;
  workMode: string | null;
  jobType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  description: string | null;
  applicationDeadline: string | null;
  openingsCount: number | null;
  postedAt: string;
}

interface CompanyDetail {
  id: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  industry: string | null;
  companySize: string | null;
  description: string | null;
  cultureKeywords: string[];
  locations: { city?: string; state?: string; country?: string }[];
  activeJobs: ActiveJob[];
}

function formatSalary(
  min: number | null,
  max: number | null,
  currency?: string | null
): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => {
    if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return String(n);
  };
  const prefix = currency === "USD" ? "$" : "₹";
  if (min && max) return `${prefix}${fmt(min)} – ${prefix}${fmt(max)}`;
  if (min) return `${prefix}${fmt(min)}+`;
  if (max) return `Up to ${prefix}${fmt(max)}`;
  return null;
}

function CompanyInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-lg font-bold text-brand-600">
      {initials}
    </div>
  );
}

function JobRow({
  job,
  companyName,
  companyLogoUrl,
  alreadyApplied,
  onApply,
}: {
  job: ActiveJob;
  companyName: string;
  companyLogoUrl: string | null;
  alreadyApplied: boolean;
  onApply: (job: JobSearchResult) => void;
}) {
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);

  function handleApply() {
    const jobAsResult: JobSearchResult = {
      id: job.id,
      jobPostId: job.id,
      title: job.title,
      companyName,
      companyLogoUrl,
      location: job.location ?? "",
      workMode: job.workMode,
      jobType: job.jobType,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryCurrency: job.salaryCurrency,
      postedAt: job.postedAt,
      sources: ["fitvector"],
      url: "",
      matchScore: null,
      matchBucket: null,
      decisionLabel: null,
      embeddingScore: null,
      deterministicScore: null,
      deterministicComponents: null,
      skillsRequired: job.requiredSkills,
      skillsNiceToHave: job.niceToHaveSkills,
      isEasyApply: true,
      isSaved: false,
      description: job.description ?? "",
      applicationDeadline: job.applicationDeadline,
      openingsCount: job.openingsCount,
    };
    onApply(jobAsResult);
  }

  return (
    <Card className="transition-all hover:border-border/60 hover:shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground">{job.title}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {job.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.location}
                </span>
              )}
              {job.workMode && (
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  <span className="capitalize">{job.workMode}</span>
                </span>
              )}
              {salary && (
                <span className="inline-flex items-center gap-1">
                  <IndianRupee className="h-3 w-3" />
                  {salary}
                </span>
              )}
              {job.jobType && (
                <Badge variant="outline" className="px-1.5 py-0 text-[10px] capitalize">
                  {job.jobType}
                </Badge>
              )}
              {job.openingsCount && job.openingsCount > 1 && (
                <Badge className="bg-accent-50 px-1.5 py-0 text-[10px] text-accent-700 hover:bg-accent-100">
                  {job.openingsCount} openings
                </Badge>
              )}
            </div>

            {job.requiredSkills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {job.requiredSkills.slice(0, 6).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    {skill}
                  </span>
                ))}
                {job.requiredSkills.length > 6 && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] text-muted-foreground/70">
                    +{job.requiredSkills.length - 6} more
                  </span>
                )}
              </div>
            )}
          </div>

          {alreadyApplied ? (
            <Badge className="shrink-0 gap-1 bg-green-100 px-3 py-1.5 text-green-700 hover:bg-green-100">
              Applied
            </Badge>
          ) : (
            <Button
              size="sm"
              onClick={handleApply}
              className="shrink-0 gap-1.5 bg-accent-500 text-white hover:bg-accent-600"
            >
              <Zap className="h-3 w-3" />
              Apply
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CompanyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const [applyJob, setApplyJob] = useState<JobSearchResult | null>(null);
  const { data: fvApplications } = useFitVectorApplications();

  const appliedJobIds = new Set(
    (fvApplications?.data ?? []).map(
      (a) => (a as { job_post_id?: string }).job_post_id ?? "",
    ),
  );

  const { data, isLoading, isError } = useQuery<{ data: CompanyDetail }>({
    queryKey: ["company-detail", id],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${id}`);
      if (!res.ok) throw new Error("Company not found");
      return res.json();
    },
  });

  const company = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 animate-pulse rounded-2xl bg-muted" />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-48 animate-pulse rounded bg-muted" />
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-4 w-64 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !company) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground/40" />
        <h2 className="mt-4 text-lg font-semibold text-foreground/80">Company not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This company may have been removed or the link is invalid.
        </p>
        <Link href="/dashboard/companies">
          <Button variant="outline" className="mt-4">
            Back to Companies
          </Button>
        </Link>
      </div>
    );
  }

  const allLocations = company.locations
    .map((loc) => [loc.city, loc.state, loc.country].filter(Boolean).join(", "))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/dashboard/companies"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground/80 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Companies
      </Link>

      {/* Company header card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          {company.logoUrl ? (
            <img
              src={company.logoUrl}
              alt={company.name}
              className="h-16 w-16 shrink-0 rounded-2xl object-contain"
            />
          ) : (
            <CompanyInitials name={company.name} />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-foreground">{company.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {company.industry && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {company.industry}
                </span>
              )}
              {company.companySize && (
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {company.companySize}
                </span>
              )}
              {allLocations.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {allLocations.slice(0, 2).join(" · ")}
                  {allLocations.length > 2 && ` +${allLocations.length - 2} more`}
                </span>
              )}
              {company.websiteUrl && (
                <a
                  href={company.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-brand-500 hover:text-brand-600 transition-colors"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Website
                </a>
              )}
            </div>

            {company.description && (
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {company.description}
              </p>
            )}

            {company.cultureKeywords.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {company.cultureKeywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    className="bg-brand-50 px-2 py-0.5 text-xs text-brand-700 hover:bg-brand-100"
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active jobs section */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Open Positions
            {company.activeJobs.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({company.activeJobs.length})
              </span>
            )}
          </h2>
        </div>

        {company.activeJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-12 text-center">
            <Briefcase className="h-8 w-8 text-muted-foreground/40" />
            <h3 className="mt-3 text-sm font-semibold text-foreground/80">No open positions</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              This company has no active job listings right now. Check back later.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {company.activeJobs.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                companyName={company.name}
                companyLogoUrl={company.logoUrl}
                alreadyApplied={appliedJobIds.has(job.id)}
                onApply={setApplyJob}
              />
            ))}
          </div>
        )}
      </div>

      {applyJob && (
        <FitVectorApplyModal
          job={applyJob}
          onClose={() => setApplyJob(null)}
          onSubmitted={() => setApplyJob(null)}
        />
      )}
    </div>
  );
}
