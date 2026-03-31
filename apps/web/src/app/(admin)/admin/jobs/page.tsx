"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface AdminJob {
  id: string;
  title: string;
  companyName: string;
  location: string;
  source: string;
  isActive: boolean;
  postedAt: string | null;
  workMode: string | null;
  jobType: string | null;
  skillsRequired: string[];
  isDirect: boolean;
}

const SOURCE_FILTERS = ["", "direct", "linkedin", "indeed", "naukri", "glassdoor", "seed"];

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminJobsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-jobs", search, sourceFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      if (sourceFilter) params.set("source", sourceFilter);
      const res = await fetch(`/api/admin/jobs?${params}`);
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ data: AdminJob[]; total: number; page: number; limit: number }>;
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const toggleActive = useMutation({
    mutationFn: async ({ jobId, isActive }: { jobId: string; isActive: boolean }) => {
      const res = await fetch("/api/admin/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, isActive }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-jobs"] });
      toast.success("Job updated");
    },
    onError: () => toast.error("Update failed"),
  });

  const jobs = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / (data?.limit || 50));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Jobs</h1>
        <p className="mt-1 text-sm text-surface-500">{total} total jobs</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <Input
            placeholder="Search title or company..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {SOURCE_FILTERS.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={sourceFilter === s ? "default" : "outline"}
              onClick={() => { setSourceFilter(s); setPage(1); }}
              className="text-xs capitalize"
            >
              {s || "All Sources"}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-surface-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Job</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Source</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Mode</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Posted</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Active</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Actions</th>
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
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-surface-400">
                  No jobs found
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id} className="border-b border-surface-100 hover:bg-surface-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <p className="max-w-[200px] truncate font-medium text-surface-800">{job.title}</p>
                      {job.isDirect && (
                        <Badge className="bg-brand-50 px-1.5 py-0 text-[10px] text-brand-700">Direct</Badge>
                      )}
                    </div>
                    <p className="text-xs text-surface-400">{job.companyName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-surface-100 px-2 py-0.5 text-[10px] capitalize text-surface-600">
                      {job.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs capitalize text-surface-500">{job.workMode || "—"}</td>
                  <td className="px-4 py-3 text-xs text-surface-500">{formatDate(job.postedAt)}</td>
                  <td className="px-4 py-3">
                    <Badge className={job.isActive ? "bg-green-100 text-green-700" : "bg-surface-100 text-surface-500"}>
                      {job.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => toggleActive.mutate({ jobId: job.id, isActive: !job.isActive })}
                      disabled={toggleActive.isPending}
                    >
                      {job.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </td>
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
