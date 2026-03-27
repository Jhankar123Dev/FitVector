"use client";

import { useState, useCallback } from "react";
import { Search, Plus, Kanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KanbanBoard } from "@/components/tracker/kanban-board";
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

export default function TrackerPage() {
  const { user } = useUser();
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState<TrackerApplication | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCompany, setNewCompany] = useState("");

  const { data: applications, isLoading, isError } = useTrackerApplications(search);
  const updateMutation = useUpdateApplication();
  const createMutation = useCreateApplication();
  const deleteMutation = useDeleteApplication();

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
      <div className="flex items-center justify-between pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-surface-800">Application Tracker</h1>
          <p className="mt-1 text-sm text-surface-500">
            Track your applications from saved to offer
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
          <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add manually
          </Button>
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
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

      {/* Empty state */}
      {!isLoading && !isError && applications && applications.length === 0 && (
        <EmptyState
          icon={Kanban}
          title="No applications tracked yet"
          description="Add applications manually or click 'Apply' on any job to start tracking."
          action={
            <Button size="sm" onClick={() => setShowAddForm(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add your first application
            </Button>
          }
        />
      )}

      {/* Kanban board */}
      {!isLoading && applications && applications.length > 0 && (
        <div className="min-h-0 flex-1 overflow-hidden">
          <KanbanBoard
            applications={applications}
            onStatusChange={handleStatusChange}
            onCardClick={setSelectedApp}
          />
        </div>
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
