"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  Globe,
  MapPin,
  Users,
  Briefcase,
  IndianRupee,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

function JobRow({ job }: { job: ActiveJob }) {
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);

  return (
    <Card className="transition-all hover:border-surface-300 hover:shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-surface-800">{job.title}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-surface-500">
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
                    className="rounded-full bg-surface-100 px-2 py-0.5 text-[10px] font-medium text-surface-600"
                  >
                    {skill}
                  </span>
                ))}
                {job.requiredSkills.length > 6 && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] text-surface-400">
                    +{job.requiredSkills.length - 6} more
                  </span>
                )}
              </div>
            )}
          </div>

          <Link href={`/dashboard/jobs?q=${encodeURIComponent(job.title)}`}>
            <Button size="sm" variant="outline" className="shrink-0 gap-1.5">
              Apply
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
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
        <div className="h-8 w-32 animate-pulse rounded bg-surface-200" />
        <div className="rounded-xl border border-surface-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 animate-pulse rounded-2xl bg-surface-200" />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-48 animate-pulse rounded bg-surface-200" />
              <div className="h-4 w-32 animate-pulse rounded bg-surface-200" />
              <div className="h-4 w-64 animate-pulse rounded bg-surface-200" />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-surface-200" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !company) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Building2 className="h-12 w-12 text-surface-300" />
        <h2 className="mt-4 text-lg font-semibold text-surface-700">Company not found</h2>
        <p className="mt-1 text-sm text-surface-500">
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
        className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Companies
      </Link>

      {/* Company header card */}
      <div className="rounded-xl border border-surface-200 bg-white p-6">
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
            <h1 className="text-xl font-semibold text-surface-800">{company.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-surface-500">
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
              <p className="mt-3 text-sm text-surface-600 leading-relaxed">
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
          <h2 className="text-base font-semibold text-surface-800">
            Open Positions
            {company.activeJobs.length > 0 && (
              <span className="ml-2 text-sm font-normal text-surface-500">
                ({company.activeJobs.length})
              </span>
            )}
          </h2>
        </div>

        {company.activeJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-200 bg-surface-50 py-12 text-center">
            <Briefcase className="h-8 w-8 text-surface-300" />
            <h3 className="mt-3 text-sm font-semibold text-surface-700">No open positions</h3>
            <p className="mt-1 text-sm text-surface-500">
              This company has no active job listings right now. Check back later.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {company.activeJobs.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
