"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AdminCompany {
  id: string;
  name: string;
  industry: string | null;
  companySize: string | null;
  planTier: string;
  websiteUrl: string | null;
  createdAt: string;
  jobPostCount: number;
}

const PLAN_COLORS: Record<string, string> = {
  starter: "bg-surface-100 text-surface-600",
  growth: "bg-blue-100 text-blue-700",
  business: "bg-purple-100 text-purple-700",
  enterprise: "bg-amber-100 text-amber-700",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
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
        <h1 className="text-xl font-bold text-surface-900 sm:text-2xl">Companies</h1>
        <p className="mt-0.5 text-xs text-surface-500 sm:mt-1 sm:text-sm">{total} registered companies</p>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
        <Input
          placeholder="Search company name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9 text-sm"
        />
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-surface-200 bg-white md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Company</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Industry</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Size</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Plan</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Job Posts</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Created</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-surface-100">
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-4 w-full animate-pulse rounded bg-surface-100" />
                  </td>
                </tr>
              ))
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-surface-400">No companies found</td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company.id} className="border-b border-surface-100 hover:bg-surface-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-surface-800">{company.name}</p>
                      {company.websiteUrl && (
                        <a href={company.websiteUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 text-surface-400 hover:text-brand-500" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-surface-500">{company.industry || "—"}</td>
                  <td className="px-4 py-3 text-xs capitalize text-surface-500">{company.companySize || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge className={PLAN_COLORS[company.planTier] || "bg-surface-100 text-surface-600"}>{company.planTier}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-surface-700">{company.jobPostCount}</td>
                  <td className="px-4 py-3 text-xs text-surface-500">{formatDate(company.createdAt)}</td>
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
            <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-100" />
          ))
        ) : companies.length === 0 ? (
          <p className="py-8 text-center text-sm text-surface-400">No companies found</p>
        ) : (
          companies.map((company) => (
            <div key={company.id} className="rounded-xl border border-surface-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-medium text-surface-800">{company.name}</p>
                    {company.websiteUrl && (
                      <a href={company.websiteUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 shrink-0 text-surface-400" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-surface-400">{company.industry || "—"}</p>
                </div>
                <Badge className={PLAN_COLORS[company.planTier] || "bg-surface-100 text-surface-600"}>
                  {company.planTier}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-surface-500">
                {company.companySize && <span className="capitalize">{company.companySize}</span>}
                <span>{company.jobPostCount} job posts</span>
                <span className="ml-auto">{formatDate(company.createdAt)}</span>
              </div>
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
          <span className="text-xs text-surface-500">Page {page} of {totalPages}</span>
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
