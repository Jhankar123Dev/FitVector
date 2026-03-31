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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Companies</h1>
        <p className="mt-1 text-sm text-surface-500">{total} registered companies</p>
      </div>

      {/* Search */}
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
        <Input
          placeholder="Search company name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9 text-sm"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-surface-200 bg-white">
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
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-surface-400">
                  No companies found
                </td>
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
                    <Badge className={PLAN_COLORS[company.planTier] || "bg-surface-100 text-surface-600"}>
                      {company.planTier}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-surface-700">{company.jobPostCount}</td>
                  <td className="px-4 py-3 text-xs text-surface-500">{formatDate(company.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-surface-500">
            Page {page} of {totalPages}
          </span>
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
