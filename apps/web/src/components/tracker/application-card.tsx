"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Building2, Calendar, MessageSquare } from "lucide-react";
import type { TrackerApplication } from "@/hooks/use-tracker";
import { Draggable } from "react-beautiful-dnd";

interface ApplicationCardProps {
  application: TrackerApplication;
  index: number;
  onClick: (app: TrackerApplication) => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

export function ApplicationCard({ application, index, onClick }: ApplicationCardProps) {
  return (
    <Draggable draggableId={application.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(application)}
        >
          <Card
            className={`cursor-pointer transition-shadow ${
              snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20" : "hover:shadow-sm"
            }`}
          >
            <CardContent className="p-3">
              <h4 className="truncate text-sm font-medium">{application.jobTitle}</h4>
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                <Building2 className="h-3 w-3 shrink-0" />
                {application.companyName}
              </p>

              {/* Meta row */}
              <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                {application.appliedAt && (
                  <span className="inline-flex items-center gap-0.5">
                    <Calendar className="h-2.5 w-2.5" />
                    {formatDate(application.appliedAt)}
                  </span>
                )}
                {application.notes && (
                  <span className="inline-flex items-center gap-0.5">
                    <MessageSquare className="h-2.5 w-2.5" />
                    Note
                  </span>
                )}
                {application.nextFollowupDate && (
                  <span className="rounded bg-yellow-100 px-1 text-yellow-700">
                    Follow up {formatDate(application.nextFollowupDate)}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
}
