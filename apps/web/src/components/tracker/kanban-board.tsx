"use client";

import { useCallback } from "react";
import { DragDropContext, type DropResult } from "react-beautiful-dnd";
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
      if (!app || app.status === newStatus) return;

      onStatusChange(draggableId, newStatus);
    },
    [applications, onStatusChange],
  );

  // Group applications by status
  const grouped: Record<string, TrackerApplication[]> = {};
  for (const col of KANBAN_COLUMNS) {
    grouped[col.id] = [];
  }
  for (const app of applications) {
    if (grouped[app.status]) {
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
          />
        ))}
      </div>
    </DragDropContext>
  );
}
