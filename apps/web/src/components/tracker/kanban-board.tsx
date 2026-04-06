"use client";

import { useCallback } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { KanbanColumn } from "./kanban-column";
import { APPLICATION_STATUSES } from "@fitvector/shared";
import type { TrackerApplication } from "@/hooks/use-tracker";

// Kanban columns (6 visible — withdrawn excluded)
const KANBAN_COLUMNS = [
  { id: "saved", label: APPLICATION_STATUSES.saved.label, color: APPLICATION_STATUSES.saved.color },
  { id: "applied", label: APPLICATION_STATUSES.applied.label, color: APPLICATION_STATUSES.applied.color },
  { id: "screening", label: APPLICATION_STATUSES.screening.label, color: APPLICATION_STATUSES.screening.color },
  { id: "interview", label: APPLICATION_STATUSES.interview.label, color: APPLICATION_STATUSES.interview.color },
  { id: "offer", label: APPLICATION_STATUSES.offer.label, color: APPLICATION_STATUSES.offer.color },
  { id: "rejected", label: APPLICATION_STATUSES.rejected.label, color: APPLICATION_STATUSES.rejected.color },
];

interface KanbanBoardProps {
  applications: TrackerApplication[];
  onStatusChange: (id: string, newStatus: string) => void;
  onCardClick: (app: TrackerApplication) => void;
}

export function KanbanBoard({
  applications,
  onStatusChange,
  onCardClick,
}: KanbanBoardProps) {
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { destination, draggableId } = result;
      if (!destination) return;

      const newStatus = destination.droppableId;
      const app = applications.find((a) => a.id === draggableId);
      // Block moves for FitVector apps — employer controls their stage
      if (!app || app.fitvectorStatus !== null || app.status === newStatus) return;

      onStatusChange(draggableId, newStatus);
    },
    [applications, onStatusChange],
  );

  // Map live fitvector_applications.status → kanban column id.
  // These values come directly from the DB check constraint on fitvector_applications.
  const FV_STATUS_TO_COLUMN: Record<string, string> = {
    applied: "applied",
    under_review: "screening",
    interview_invited: "interview",
    interviewed: "interview",
    decision_pending: "interview",
    offered: "offer",
    rejected: "rejected",
    withdrawn: "rejected", // treat withdrawn as rejected in the view
  };

  // Group applications by status.
  // For FitVector applications (fitvectorStatus is non-null), the live
  // fitvectorStatus is the source of truth for column placement.
  // For manually-tracked applications, use the local `status` field.
  const grouped: Record<string, TrackerApplication[]> = {};
  for (const col of KANBAN_COLUMNS) {
    grouped[col.id] = [];
  }
  for (const app of applications) {
    if (app.fitvectorStatus) {
      const column = FV_STATUS_TO_COLUMN[app.fitvectorStatus] ?? "applied";
      if (grouped[column]) grouped[column].push(app);
    } else if (grouped[app.status]) {
      grouped[app.status].push(app);
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            columnId={col.id}
            title={col.label}
            color={col.color}
            applications={grouped[col.id] || []}
            onCardClick={onCardClick}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
