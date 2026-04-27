"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Clock,
  Hash,
  X,
  Loader2,
} from "lucide-react";
import {
  useInterviewPanels,
  useCreatePanel,
  useUpdatePanel,
  useDeletePanel,
} from "@/hooks/use-interview-panels";
import type {
  InterviewPanel,
  CreatePanelInput,
  UpdatePanelInput,
} from "@/hooks/use-interview-panels";

// ─── Constants ───────────────────────────────────────────────────────────────

const INTERVIEW_TYPES = [
  { value: "technical", label: "Technical" },
  { value: "behavioral", label: "Behavioral" },
  { value: "hr", label: "HR" },
  { value: "culture_fit", label: "Culture Fit" },
  { value: "final", label: "Final" },
] as const;

const TYPE_COLORS: Record<string, string> = {
  technical: "bg-blue-100 text-blue-800",
  behavioral: "bg-purple-100 text-purple-800",
  hr: "bg-green-100 text-green-800",
  culture_fit: "bg-amber-100 text-amber-800",
  final: "bg-red-100 text-red-800",
};

function getTypeLabel(type: string): string {
  return (
    INTERVIEW_TYPES.find((t) => t.value === type)?.label || type
  );
}

// ─── Form state ──────────────────────────────────────────────────────────────

interface PanelFormData {
  name: string;
  interviewType: string;
  roundNumber: string;
  durationMinutes: string;
  description: string;
}

const EMPTY_FORM: PanelFormData = {
  name: "",
  interviewType: "technical",
  roundNumber: "1",
  durationMinutes: "60",
  description: "",
};

function panelToForm(panel: InterviewPanel): PanelFormData {
  return {
    name: panel.name,
    interviewType: panel.interview_type,
    roundNumber: String(panel.round_number),
    durationMinutes: String(panel.duration_minutes),
    description: panel.description || "",
  };
}

// ─── Skeleton loader ─────────────────────────────────────────────────────────

function PanelSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-3">
            <div className="h-5 w-2/3 rounded bg-muted" />
            <div className="mt-2 h-4 w-1/3 rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 w-1/2 rounded bg-muted" />
              <div className="h-4 w-1/3 rounded bg-muted" />
              <div className="h-4 w-2/3 rounded bg-muted" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Panel form ──────────────────────────────────────────────────────────────

function PanelForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting,
  isEdit,
}: {
  form: PanelFormData;
  onChange: (form: PanelFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isEdit: boolean;
}) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {isEdit ? "Edit Panel" : "Create Panel"}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="panel-name">Name *</Label>
            <Input
              id="panel-name"
              placeholder="e.g. Frontend Technical Round"
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="panel-type">Interview Type *</Label>
            <select
              id="panel-type"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.interviewType}
              onChange={(e) =>
                onChange({ ...form, interviewType: e.target.value })
              }
            >
              {INTERVIEW_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="panel-round">Round Number *</Label>
            <Input
              id="panel-round"
              type="number"
              min={1}
              value={form.roundNumber}
              onChange={(e) =>
                onChange({ ...form, roundNumber: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="panel-duration">Duration (minutes)</Label>
            <Input
              id="panel-duration"
              type="number"
              min={15}
              value={form.durationMinutes}
              onChange={(e) =>
                onChange({ ...form, durationMinutes: e.target.value })
              }
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="panel-desc">Description</Label>
            <Textarea
              id="panel-desc"
              placeholder="Describe the panel's focus and evaluation criteria..."
              rows={3}
              value={form.description}
              onChange={(e) =>
                onChange({ ...form, description: e.target.value })
              }
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Update Panel" : "Create Panel"}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Panel card ──────────────────────────────────────────────────────────────

function PanelCard({
  panel,
  onEdit,
  onDelete,
  isDeleting,
}: {
  panel: InterviewPanel;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight">
            {panel.name}
          </CardTitle>
          <Badge
            variant="secondary"
            className={TYPE_COLORS[panel.interview_type] || ""}
          >
            {getTypeLabel(panel.interview_type)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Hash className="h-3.5 w-3.5" />
            <span>Round {panel.round_number}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            <span>{panel.duration_minutes} minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            <span>
              {panel.default_interviewer_ids?.length || 0} interviewer
              {(panel.default_interviewer_ids?.length || 0) !== 1 ? "s" : ""}
            </span>
          </div>
          {panel.description && (
            <p className="mt-2 line-clamp-2 text-muted-foreground">
              {panel.description}
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <Button
                variant="destructive"
                size="sm"
                onClick={onDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                )}
                Confirm
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="mb-1 text-lg font-semibold">No interview panels yet</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Create your first interview panel to organize your hiring rounds.
        </p>
        <Button onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Panel
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function InterviewPanelsPage() {
  const { data, isLoading, error } = useInterviewPanels();
  const createPanel = useCreatePanel();
  const updatePanel = useUpdatePanel();
  const deletePanel = useDeletePanel();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PanelFormData>(EMPTY_FORM);

  const panels: InterviewPanel[] = data?.data || [];

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleOpenCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function handleOpenEdit(panel: InterviewPanel) {
    setEditingId(panel.id);
    setForm(panelToForm(panel));
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit() {
    const roundNumber = parseInt(form.roundNumber, 10);
    const durationMinutes = parseInt(form.durationMinutes, 10);

    if (!form.name.trim()) return;
    if (isNaN(roundNumber) || roundNumber < 1) return;

    if (editingId) {
      const input: UpdatePanelInput = {
        id: editingId,
        name: form.name.trim(),
        interviewType: form.interviewType,
        roundNumber,
        durationMinutes: isNaN(durationMinutes) ? 60 : durationMinutes,
        description: form.description.trim(),
      };
      await updatePanel.mutateAsync(input);
    } else {
      const input: CreatePanelInput = {
        name: form.name.trim(),
        interviewType: form.interviewType,
        roundNumber,
        durationMinutes: isNaN(durationMinutes) ? 60 : durationMinutes,
        description: form.description.trim(),
      };
      await createPanel.mutateAsync(input);
    }

    handleCancel();
  }

  async function handleDelete(id: string) {
    await deletePanel.mutateAsync(id);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Interview Panels
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure interview rounds and assign default interviewers.
          </p>
        </div>
        {!showForm && panels.length > 0 && (
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Panel
          </Button>
        )}
      </div>

      {/* Error */}
      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">
            Failed to load panels. Please try again.
          </CardContent>
        </Card>
      )}

      {/* Create / Edit form */}
      {showForm && (
        <PanelForm
          form={form}
          onChange={setForm}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={createPanel.isPending || updatePanel.isPending}
          isEdit={!!editingId}
        />
      )}

      {/* Loading */}
      {isLoading && <PanelSkeleton />}

      {/* Empty state */}
      {!isLoading && !error && panels.length === 0 && !showForm && (
        <EmptyState onCreate={handleOpenCreate} />
      )}

      {/* Panel grid */}
      {!isLoading && panels.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {panels.map((panel) => (
            <PanelCard
              key={panel.id}
              panel={panel}
              onEdit={() => handleOpenEdit(panel)}
              onDelete={() => handleDelete(panel.id)}
              isDeleting={deletePanel.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
