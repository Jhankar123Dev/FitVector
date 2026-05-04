"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, ChevronLeft, ChevronRight, Plus, Upload, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
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

const WORK_MODES = ["", "remote", "hybrid", "onsite"];
const JOB_TYPES = ["", "fulltime", "parttime", "contract", "internship"];
const SOURCES = ["direct", "linkedin", "indeed", "naukri", "glassdoor", "google", "ziprecruiter", "fitvector"];

const BULK_TEMPLATE = JSON.stringify(
  [
    {
      title: "Senior Frontend Engineer",
      companyName: "Acme Corp",
      location: "Bengaluru, India",
      workMode: "hybrid",
      jobType: "fulltime",
      description: "We are looking for a Senior Frontend Engineer...",
      skillsRequired: ["React", "TypeScript", "CSS"],
      skillsNiceToHave: ["Next.js", "Tailwind"],
      salaryMin: 1800000,
      salaryMax: 2800000,
      salaryCurrency: "INR",
      url: "https://acmecorp.com/careers/sfe",
      source: "direct",
    },
  ],
  null,
  2,
);

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Add Job Modal ─────────────────────────────────────────────────────────────
function AddJobModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    title: "",
    companyName: "",
    location: "",
    workMode: "",
    jobType: "",
    description: "",
    skillsRequired: "",
    skillsNiceToHave: "",
    salaryMin: "",
    salaryMax: "",
    url: "https://fitvector.pro",
    source: "direct",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          companyName: form.companyName,
          location: form.location || "",
          workMode: form.workMode || null,
          jobType: form.jobType || null,
          description: form.description,
          skillsRequired: form.skillsRequired ? form.skillsRequired.split(",").map((s) => s.trim()).filter(Boolean) : [],
          skillsNiceToHave: form.skillsNiceToHave ? form.skillsNiceToHave.split(",").map((s) => s.trim()).filter(Boolean) : [],
          salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
          salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
          url: form.url || "https://fitvector.pro",
          source: form.source,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create job");
      toast.success("Job created successfully");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setSubmitting(false);
    }
  }

  const labelClass = "block text-xs font-medium text-muted-foreground mb-1";
  const inputClass = "w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/50 p-0 sm:items-start sm:p-4 sm:pt-10">
      <div className="w-full max-w-xl rounded-t-2xl border border-border bg-card shadow-xl sm:rounded-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Add New Job</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelClass}>Job Title *</label>
              <input className={inputClass} placeholder="e.g. Senior React Engineer" required {...field("title")} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Company Name *</label>
              <input className={inputClass} placeholder="e.g. Acme Corp" required {...field("companyName")} />
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input className={inputClass} placeholder="e.g. Bengaluru, India" {...field("location")} />
            </div>
            <div>
              <label className={labelClass}>Source</label>
              <select className={inputClass} {...field("source")}>
                {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Work Mode</label>
              <select className={inputClass} {...field("workMode")}>
                {WORK_MODES.map((m) => <option key={m} value={m}>{m || "— none —"}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Job Type</label>
              <select className={inputClass} {...field("jobType")}>
                {JOB_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t === "fulltime" ? "Full Time" : t === "parttime" ? "Part Time" : t ? t.charAt(0).toUpperCase() + t.slice(1) : "— none —"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Salary Min (₹)</label>
              <input className={inputClass} type="number" placeholder="e.g. 1200000" {...field("salaryMin")} />
            </div>
            <div>
              <label className={labelClass}>Salary Max (₹)</label>
              <input className={inputClass} type="number" placeholder="e.g. 2000000" {...field("salaryMax")} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Required Skills <span className="font-normal text-muted-foreground/70">(comma-separated)</span></label>
              <input className={inputClass} placeholder="React, TypeScript, Node.js" {...field("skillsRequired")} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Nice-to-have Skills <span className="font-normal text-muted-foreground/70">(comma-separated)</span></label>
              <input className={inputClass} placeholder="GraphQL, Docker" {...field("skillsNiceToHave")} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Job Description</label>
              <textarea
                className={`${inputClass} min-h-[100px] resize-y`}
                placeholder="Describe the role, responsibilities, and requirements..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Job URL</label>
              <input className={inputClass} placeholder="https://..." {...field("url")} />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
              {submitting ? "Creating..." : "Create Job"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Bulk Import Modal ─────────────────────────────────────────────────────────
function BulkImportModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [json, setJson] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleImport() {
    setError(null);
    setResult(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      setError("Invalid JSON — please check your input.");
      return;
    }

    const jobs = Array.isArray(parsed) ? parsed : [parsed];
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setResult({ inserted: data.inserted, skipped: data.skipped ?? 0 });
      toast.success(`Imported ${data.inserted} jobs`);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/50 p-0 sm:items-start sm:p-4 sm:pt-10">
      <div className="w-full max-w-2xl rounded-t-2xl border border-border bg-card shadow-xl sm:rounded-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Bulk Import Jobs</h2>
            <p className="mt-0.5 text-xs text-muted-foreground/70">Paste a JSON array of job objects</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Schema reference */}
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Required fields: <code className="text-brand-600">title</code>, <code className="text-brand-600">companyName</code></p>
            <p className="text-xs text-muted-foreground">
              Optional: <code>location</code>, <code>workMode</code> (remote/hybrid/onsite), <code>jobType</code> (full_time/part_time/contract/internship),{" "}
              <code>description</code>, <code>skillsRequired</code> (array), <code>skillsNiceToHave</code> (array),{" "}
              <code>salaryMin</code>, <code>salaryMax</code>, <code>url</code>, <code>source</code> (direct/linkedin/naukri/…)
            </p>
          </div>

          {/* Template button */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => setJson(BULK_TEMPLATE)}
            >
              Load example template
            </Button>
            {json && (
              <Button size="sm" variant="ghost" className="text-xs text-muted-foreground/70" onClick={() => setJson("")}>
                Clear
              </Button>
            )}
          </div>

          {/* JSON textarea */}
          <textarea
            className="h-64 w-full rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs text-foreground/80 focus:outline-none focus:ring-1 focus:ring-brand-400"
            placeholder='[{"title": "...", "companyName": "...", ...}]'
            value={json}
            onChange={(e) => setJson(e.target.value)}
          />

          {/* Result / Error */}
          {result && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Inserted <strong>{result.inserted}</strong> jobs
              {result.skipped > 0 && <span className="text-green-600/70"> · {result.skipped} skipped (validation errors)</span>}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            <Button size="sm" onClick={handleImport} disabled={submitting || !json.trim()}>
              {submitting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
              {submitting ? "Importing..." : "Import Jobs"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminJobsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

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

  function handleRefresh() {
    qc.invalidateQueries({ queryKey: ["admin-jobs"] });
  }

  const jobs = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / (data?.limit || 50));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Jobs</h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">{total} total jobs in database</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowBulkModal(true)}>
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">Bulk Import</span>
            <span className="sm:hidden">Import</span>
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Job
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
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

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Job</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Source</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Mode</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Posted</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Active</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  </td>
                </tr>
              ))
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-muted-foreground/70">No jobs found</p>
                    <Button size="sm" onClick={() => setShowAddModal(true)}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" />Add first job
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id} className="border-b border-border hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <p className="max-w-[200px] truncate font-medium text-foreground">{job.title}</p>
                      {job.isDirect && <Badge className="bg-brand-50 px-1.5 py-0 text-[10px] text-brand-700">Direct</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground/70">{job.companyName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] capitalize text-muted-foreground">{job.source}</span>
                  </td>
                  <td className="px-4 py-3 text-xs capitalize text-muted-foreground">{job.workMode || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(job.postedAt)}</td>
                  <td className="px-4 py-3">
                    <Badge className={job.isActive ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}>
                      {job.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="ghost" className="h-7 text-xs"
                      onClick={() => toggleActive.mutate({ jobId: job.id, isActive: !job.isActive })}
                      disabled={toggleActive.isPending}>
                      {job.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </td>
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
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10">
            <p className="text-sm text-muted-foreground/70">No jobs found</p>
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />Add first job
            </Button>
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-medium text-foreground">{job.title}</p>
                    {job.isDirect && <Badge className="shrink-0 bg-brand-50 px-1.5 py-0 text-[10px] text-brand-700">Direct</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground/70">{job.companyName}</p>
                </div>
                <Button size="sm" variant="ghost" className="h-7 shrink-0 text-xs"
                  onClick={() => toggleActive.mutate({ jobId: job.id, isActive: !job.isActive })}
                  disabled={toggleActive.isPending}>
                  {job.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] capitalize text-muted-foreground">{job.source}</span>
                {job.workMode && <span className="text-xs capitalize text-muted-foreground/70">{job.workMode}</span>}
                <Badge className={job.isActive ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}>
                  {job.isActive ? "Active" : "Inactive"}
                </Badge>
                <span className="ml-auto text-xs text-muted-foreground/70">{formatDate(job.postedAt)}</span>
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
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddJobModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); handleRefresh(); }}
        />
      )}
      {showBulkModal && (
        <BulkImportModal
          onClose={() => setShowBulkModal(false)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}
