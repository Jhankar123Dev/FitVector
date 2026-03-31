"use client";

import { Droppable } from "react-beautiful-dnd";
import { ApplicationCard } from "./application-card";
import type { TrackerApplication } from "@/hooks/use-tracker";

interface KanbanColumnProps {
  columnId: string;
  title: string;
  color: string;
  applications: TrackerApplication[];
  onCardClick: (app: TrackerApplication) => void;
  onStatusChange: (id: string, newStatus: string) => void;
}

export function KanbanColumn({
  columnId,
  title,
  color,
  applications,
  onCardClick,
  onStatusChange,
}: KanbanColumnProps) {
  return (
    <div className="flex h-full w-72 shrink-0 flex-col rounded-lg bg-muted/50">
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        <h3 className="text-xs font-semibold">{title}</h3>
        <span className="ml-auto rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
          {applications.length}
        </span>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-2 overflow-y-auto px-2 pb-2 ${
              snapshot.isDraggingOver ? "bg-primary/5" : ""
            }`}
          >
            {applications.map((app, index) => (
              <ApplicationCard
                key={app.id}
                application={app}
                index={index}
                onClick={onCardClick}
                onStatusChange={onStatusChange}
              />
            ))}
            {provided.placeholder}

            {applications.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Drop here
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
