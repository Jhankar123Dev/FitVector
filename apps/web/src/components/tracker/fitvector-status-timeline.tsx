"use client";

import { cn } from "@/lib/utils";
import { FV_STATUS_CONFIG } from "@/types/marketplace";
import type { StatusTimelineEntry, FVApplicationStatus } from "@/types/marketplace";

interface FitVectorStatusTimelineProps {
  timeline: StatusTimelineEntry[];
  currentStatus: string;
}

export function FitVectorStatusTimeline({
  timeline,
  currentStatus,
}: FitVectorStatusTimelineProps) {
  return (
    <div className="space-y-0">
      {timeline.map((entry, i) => {
        const config = FV_STATUS_CONFIG[entry.status as FVApplicationStatus];
        const isCurrent = entry.status === currentStatus;
        const isLast = i === timeline.length - 1;

        const date = new Date(entry.timestamp);
        const formattedDate = date.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        });
        const formattedTime = date.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div key={entry.status} className="relative flex gap-3 pb-4">
            {/* Vertical line */}
            {!isLast && (
              <div
                className="absolute left-[7px] top-4 h-full w-0.5"
                style={{ backgroundColor: config?.color || "#D1D5DB" }}
              />
            )}

            {/* Dot */}
            <div
              className={cn(
                "relative z-10 mt-0.5 shrink-0 rounded-full border-2",
                isCurrent ? "h-4 w-4" : "h-3.5 w-3.5",
              )}
              style={{
                borderColor: config?.color || "#D1D5DB",
                backgroundColor: isCurrent ? config?.color || "#D1D5DB" : "white",
              }}
            >
              {isCurrent && (
                <span
                  className="absolute inset-0 animate-ping rounded-full opacity-30"
                  style={{ backgroundColor: config?.color }}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 -mt-0.5">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-sm",
                    isCurrent ? "font-semibold" : "font-medium text-surface-700",
                  )}
                  style={isCurrent ? { color: config?.color } : undefined}
                >
                  {entry.label}
                </span>
                <span className="text-xs text-surface-400">
                  {formattedDate} · {formattedTime}
                </span>
              </div>
              {entry.note && (
                <p className="mt-0.5 text-xs text-surface-500">{entry.note}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
