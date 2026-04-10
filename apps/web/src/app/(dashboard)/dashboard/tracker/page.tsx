"use client";

import { useState, useCallback, useMemo } from "react";
import { Search, Plus, Kanban, Zap, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KanbanBoard } from "@/components/tracker/kanban-board";
import { AppliedJobsList } from "@/components/tracker/applied-jobs-list";
import { ApplicationDetailModal } from "@/components/tracker/application-detail-modal";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { UpgradePrompt } from "@/components/shared/upgrade-prompt";
import {
  useTrackerApplications,
  useUpdateApplication,
  useCreateApplication,
  useDeleteApplication,
} from "@/hooks/use-tracker";
import type { TrackerApplication } from "@/hooks/use-tracker";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";

type TrackerTab = "applied" | "personal";

export default function TrackerPage() {
  const { user } = useUser();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TrackerTab>("applied");
  const [selectedApp, setSelectedApp] = useState<TrackerApplication | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCompany, setNewCompany] = useState("");

  const { data: applications, isLoading, isError } = useTrackerApplications(search);
  const updateMutation = useUpdateApplication();
  const createMutation = useCreateApplication();
  const deleteMutation = useDeleteApplication();

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCompany, setFilterCompany] = useState("all");
  const [filterRange, setFilterRange]   = useState("all"); // "7d" | "30d" | "90d" | "all"

  // Split into FitVector-applied vs manually-tracked
  const appliedApps = useMemo(
    () => (applications || []).filter((a) => a.fitvectorStatus !== null),
    [applications],
  );
  const personalApps = useMemo(
    () => (applications || []).filter((a) => a.fitvectorStatus === null),
    [applications],
  );

  const filteredAppliedApps = useMemo(() => {
    return appliedApps.filter((a) => {
      if (filterStatus !== "all" && a.fitvectorStatus !== filterStatus) return false;
      if (filterCompany !== "all" && a.companyName !== filterCompany) return false;
      if (filterRange !== "all") {
        const days = filterRange === "7d" ? 7 : filterRange === "30d" ? 30 : 90;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        if (a.appliedAt && new Date(a.appliedAt) < cutoff) return false;
      }
      return true;
    });
  }, [appliedApps, filterStatus, filterCompany, filterRange]);

  const appliedCompanies = useMemo(
    () => [...new Set(appliedApps.map((a) => a.companyName))].sort(),
    [appliedApps],
  );

  const handleStatusChange = useCallback(
    (id: string, newStatus: string) => {
      updateMutation.mutate({ id, status: newStatus });
    },
    [updateMutation],
  );

  const handleUpdateApp = useCallback(
    (id: string, data: Record<string, unknown>) => {
      updateMutation.mutate({ id, ...data } as Parameters<typeof updateMutation.mutate>[0]);
      setSelectedApp(null);
    },
    [updateMutation],
  );

  const handleDeleteApp = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
      setSelectedApp(null);
    },
    [deleteMutation],
  );

  const handleAddManual = useCallback(() => {
    if (!newTitle.trim() || !newCompany.trim()) return;
    createMutation.mutate(
      { jobTitle: newTitle.trim(), companyName: newCompany.trim(), status: "saved" },
      {
        onSuccess: () => {
          setNewTitle("");
          setNewCompany("");
          setShowAddForm(false);
        },
      },
    );
  }, [newTitle, newCompany, createMutation]);

  const isLimitError = createMutation.isError && createMutation.error?.message?.includes("limit");

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div>
          <h1 className="text-2xl font-semibold text-surface-800">Application Tracker</h1>
          <p className="mt-1 text-sm text-surface-500">
            Track all your job applications in one place
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
            <Input
              placeholder="Search by company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-48 pl-8 text-xs"
            />
          </div>
          {/* Add manually — only on Personal tab */}
          {activeTab === "personal" && (
            <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add manually
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex items-center gap-1 rounded-xl border border-surface-200 bg-surface-50 p-1">
        <button
          onClick={() => setActiveTab("applied")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
            activeTab === "applied"
              ? "bg-white shadow-sm text-accent-700"
              : "text-surface-500 hover:text-surface-700",
          )}
        >
          <Zap className="h-3.5 w-3.5" />
          Applied via FitVector
          {appliedApps.length > 0 && (
            <span className={cn(
              "ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              activeTab === "applied" ? "bg-accent-100 text-accent-700" : "bg-surface-200 text-surface-500",
            )}>
              {appliedApps.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("personal")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
            activeTab === "personal"
              ? "bg-white shadow-sm text-surface-800"
              : "text-surface-500 hover:text-surface-700",
          )}
        >
          <BookOpen className="h-3.5 w-3.5" />
          Personal Tracker
          {personalApps.length > 0 && (
            <span className={cn(
              "ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              activeTab === "personal" ? "bg-surface-200 text-surface-700" : "bg-surface-200 text-surface-500",
            )}>
              {personalApps.length}
            </span>
          )}
        </button>
      </div>

      {/* Add form — Personal tab only */}
      {activeTab === "personal" && showAddForm && (
        <div className="mb-4 flex items-end gap-2 rounded-xl border border-surface-200 bg-surface-50 p-3">
          <div className="flex-1">
            <label className="text-xs font-medium text-surface-700">Job Title *</label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Frontend Developer"
              className="mt-1 h-8 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-surface-700">Company *</label>
            <Input
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              placeholder="e.g. Google"
              className="mt-1 h-8 text-sm"
            />
          </div>
          <Button size="sm" onClick={handleAddManual} disabled={!newTitle.trim() || !newCompany.trim()}>
            Add
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
            Cancel
          </Button>
        </div>
      )}

      {/* Limit warning */}
      {isLimitError && (
        <div className="mb-4">
          <UpgradePrompt
            message="Active application limit reached."
            feature="unlimited applications"
          />
        </div>
      )}

      {/* Loading */}
      {isLoading && <LoadingSpinner message="Loading your applications..." />}

      {/* Error */}
      {isError && (
        <EmptyState
          icon={Kanban}
          title="Failed to load tracker"
          description="Something went wrong. Please refresh the page."
        />
      )}

      {/* Applied tab — FitVector applications list */}
      {!isLoading && !isError && activeTab === "applied" && (
        <div className="flex flex-col min-h-0 flex-1 gap-3">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-8 rounded-md border border-surface-200 bg-white px-2 text-xs text-surface-700 outline-none focus:ring-1 focus:ring-brand-500/30"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="applied">Applied</option>
              <option value="under_review">Under Review</option>
              <option value="interview_invited">Interview Invited</option>
              <option value="interviewed">Interviewed</option>
              <option value="offered">Offered</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              className="h-8 rounded-md border border-surface-200 bg-white px-2 text-xs text-surface-700 outline-none focus:ring-1 focus:ring-brand-500/30"
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
            >
              <option value="all">All Companies</option>
              {appliedCompanies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              className="h-8 rounded-md border border-surface-200 bg-white px-2 text-xs text-surface-700 outline-none focus:ring-1 focus:ring-brand-500/30"
              value={filterRange}
              onChange={(e) => setFilterRange(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            {(filterStatus !== "all" || filterCompany !== "all" || filterRange !== "all") && (
              <button
                className="text-xs text-brand-600 hover:underline"
                onClick={() => { setFilterStatus("all"); setFilterCompany("all"); setFilterRange("all"); }}
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <AppliedJobsList
              applications={filteredAppliedApps}
              onCardClick={setSelectedApp}
              showFitVectorBadge={false}
            />
          </div>
        </div>
      )}

      {/* Personal tab — Kanban board */}
      {!isLoading && !isError && activeTab === "personal" && (
        <>
          {personalApps.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No personal applications yet"
              description="Track jobs you found yourself — add them manually or save jobs from search."
              action={
                <Button size="sm" onClick={() => setShowAddForm(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add your first application
                </Button>
              }
            />
          ) : (
            <div className="min-h-0 flex-1 overflow-hidden">
              <KanbanBoard
                applications={personalApps}
                onStatusChange={handleStatusChange}
                onCardClick={setSelectedApp}
              />
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onUpdate={handleUpdateApp}
          onDelete={handleDeleteApp}
        />
      )}
    </div>
  );
}
