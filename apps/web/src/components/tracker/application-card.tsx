"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, MessageSquare, Zap } from "lucide-react";
import type { TrackerApplication } from "@/hooks/use-tracker";
import { Draggable } from "react-beautiful-dnd";
import { isFitVectorApp, FV_STATUS_CONFIG } from "@/types/marketplace";
import type { FVApplicationStatus } from "@/types/marketplace";

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
  const isFV = isFitVectorApp(application.status);
  const fvConfig = isFV
    ? FV_STATUS_CONFIG[application.status as FVApplicationStatus]
    : null;

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
              isFV ? "border-l-2 border-l-accent-500 " : ""
            }${
              snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20" : "hover:shadow-sm"
            }`}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5">
                <h4 className="truncate text-sm font-medium">{application.jobTitle}</h4>
                {isFV && (
                  <Badge className="shrink-0 gap-0.5 bg-accent-50 px-1 py-0 text-[9px] text-accent-700 hover:bg-accent-100">
                    <Zap className="h-2 w-2" />
                    FV
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                <Building2 className="h-3 w-3 shrink-0" />
                {application.companyName}
              </p>

              {/* FV Status label */}
              {isFV && fvConfig && (
                <span
                  className="mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                  style={{ backgroundColor: fvConfig.color }}
                >
                  {fvConfig.label}
                </span>
              )}

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
