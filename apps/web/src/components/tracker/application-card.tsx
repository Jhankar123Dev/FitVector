"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, MessageSquare, Zap } from "lucide-react";
import type { TrackerApplication } from "@/hooks/use-tracker";
import { Draggable } from "@hello-pangea/dnd";
import { isFitVectorApp, FV_STATUS_CONFIG } from "@/types/marketplace";
import type { FVApplicationStatus } from "@/types/marketplace";

// Native <select> — renders above overflow-y-auto scroll containers (OS-level, never clipped)
const STATUS_STYLES: Record<string, string> = {
  saved:     "bg-surface-100 text-surface-600",
  applied:   "bg-blue-50 text-blue-700",
  screening: "bg-amber-50 text-amber-700",
  interview: "bg-violet-50 text-violet-700",
  offer:     "bg-green-50 text-green-700",
  rejected:  "bg-red-50 text-red-600",
};

function StatusSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const colorClass = STATUS_STYLES[value] ?? STATUS_STYLES.saved;
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`cursor-pointer rounded-full border-0 py-0.5 pl-2 pr-5 text-[10px] font-medium outline-none ring-0 focus:ring-1 focus:ring-brand-300 ${colorClass}`}
        style={{ appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 4px center" }}
      >
        <option value="saved">Saved</option>
        <option value="applied">Applied</option>
        <option value="screening">Screening</option>
        <option value="interview">Interview</option>
        <option value="offer">Offer</option>
        <option value="rejected">Rejected</option>
      </select>
    </div>
  );
}

interface ApplicationCardProps {
  application: TrackerApplication;
  index: number;
  onClick: (app: TrackerApplication) => void;
  onStatusChange: (id: string, newStatus: string) => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

export function ApplicationCard({ application, index, onClick, onStatusChange }: ApplicationCardProps) {
  const isFV = isFitVectorApp(application.status);
  const fvConfig = isFV ? FV_STATUS_CONFIG[application.status as FVApplicationStatus] : null;

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
            }${snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20" : "hover:shadow-sm"}`}
          >
            <CardContent className="p-4">
              {/* Title row */}
              <div className="flex items-start justify-between gap-1.5">
                <h4 className="truncate text-sm font-semibold leading-snug text-surface-800">{application.jobTitle}</h4>
                {isFV && (
                  <Badge className="shrink-0 gap-0.5 bg-accent-50 px-1 py-0 text-[9px] text-accent-700 hover:bg-accent-100">
                    <Zap className="h-2 w-2" />
                    FV
                  </Badge>
                )}
              </div>

              {/* Company */}
              <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                <Building2 className="h-3 w-3 shrink-0" />
                {application.companyName}
              </p>

              {/* FV pipeline status pill */}
              {isFV && fvConfig && (
                <span
                  className="mt-1.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                  style={{ backgroundColor: fvConfig.color }}
                >
                  {fvConfig.label}
                </span>
              )}

              {/* Meta + status row */}
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
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

                {/* Status dropdown — only for manual (non-FV) apps */}
                {!isFV && (
                  <StatusSelect
                    value={application.status}
                    onChange={(v) => onStatusChange(application.id, v)}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
}
