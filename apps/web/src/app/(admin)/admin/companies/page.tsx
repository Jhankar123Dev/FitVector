"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, ChevronLeft, ChevronRight, ExternalLink, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AdminCompany {
  id: string;
  name: string;
  industry: string | null;
  companySize: string | null;
  planTier: string;
  websiteUrl: string | null;
  isTransparentPipeline: boolean;
  createdAt: string;
  jobPostCount: number;
}

const PLAN_COLORS: Record<string, string> = {
  starter:    "bg-muted text-muted-foreground",
  growth:     "bg-blue-100 text-blue-700",
  business:   "bg-purple-100 text-purple-700",
  enterprise: "bg-amber-100 text-amber-700",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ── Inline toggle component ───────────────────────────────────────────────────
function TransparentPipelineToggle({
  companyId,
  companyName,
  value,
}: {
  companyId: string;
  companyName: string;
  value: boolean;
}) {
  const qc = useQueryClient();
  const [optimistic, setOptimistic] = useState<boolean | null>(null);

  const mutation = useMutation({
    mutationFn: async (newValue: boolean) => {
      const res = await fetch(`/api/admin/companies/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTransparentPipeline: newValue }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onMutate: (newValue) => setOptimistic(newValue),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-companies"] });
      setOptimistic(null);
    },
    onError: () => setOptimistic(null),
  });

  const current = optimistic ?? value;

  return (
    <button
      onClick={() => mutation.mutate(!current)}
      disabled={mutation.isPending}
      title={`${current ? "Disable" : "Enable"} Transparent Pipeline for ${companyName}`}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50",
        current ? "bg-brand-500" : "bg-muted/40",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-card shadow transition duration-200",
          current ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

export default function AdminCompaniesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-companies", search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/companies?${params}`);
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ data: AdminCompany[]; total: number; page: number; limit: number }>;
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const companies = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / (data?.limit || 50));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Companies</h1>
        <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">{total} registered companies</p>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
        <Input
          placeholder="Search company name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9 text-sm"
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-xs text-brand-700">
        <Eye className="h-3.5 w-3.5 shrink-0" />
        <span>
          <strong>Transparent Pipeline</strong> — when enabled, candidates see their exact pipeline stage
          name (e.g. "Phone Screen") instead of the generic status label (e.g. "Under Review").
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Company</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Industry</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Size</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Plan</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Job Posts</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Transparent Pipeline
                </span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Created</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td colSpan={7} className="px-4 py-3">
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  </td>
                </tr>
              ))
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground/70">No companies found</td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company.id} className="border-b border-border hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-foreground">{company.name}</p>
                      {company.websiteUrl && (
                        <a href={company.websiteUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 text-muted-foreground/70 hover:text-brand-500" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{company.industry || "—"}</td>
                  <td className="px-4 py-3 text-xs capitalize text-muted-foreground">{company.companySize || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge className={PLAN_COLORS[company.planTier] || "bg-muted text-muted-foreground"}>
                      {company.planTier}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-foreground/80">{company.jobPostCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <TransparentPipelineToggle
                        companyId={company.id}
                        companyName={company.name}
                        value={company.isTransparentPipeline}
                      />
                      <span className={cn(
                        "text-[11px] font-medium",
                        company.isTransparentPipeline ? "text-brand-600" : "text-muted-foreground/70",
                      )}>
                        {company.isTransparentPipeline ? "On" : "Off"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(company.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 md:hidden">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))
        ) : companies.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground/70">No companies found</p>
        ) : (
          companies.map((company) => (
            <div key={company.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-medium text-foreground">{company.name}</p>
                    {company.websiteUrl && (
                      <a href={company.websiteUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/70">{company.industry || "—"}</p>
                </div>
                <Badge className={PLAN_COLORS[company.planTier] || "bg-muted text-muted-foreground"}>
                  {company.planTier}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {company.companySize && <span className="capitalize">{company.companySize}</span>}
                <span>{company.jobPostCount} job posts</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <Eye className="h-3 w-3 text-muted-foreground/70" />
                  <TransparentPipelineToggle
                    companyId={company.id}
                    companyName={company.name}
                    value={company.isTransparentPipeline}
                  />
                </div>
              </div>
              <p className="mt-1 text-right text-[11px] text-muted-foreground/70">{formatDate(company.createdAt)}</p>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
