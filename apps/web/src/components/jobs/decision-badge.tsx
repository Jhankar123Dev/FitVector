"use client";

import { cn } from "@/lib/utils";
import { DECISION_LABEL_CONFIG } from "@/types/job";
import type { DecisionLabel } from "@/types/job";

interface DecisionBadgeProps {
  label: DecisionLabel | null;
  size?: "sm" | "md";
}

export function DecisionBadge({ label, size = "sm" }: DecisionBadgeProps) {
  if (!label) return null;

  const config = DECISION_LABEL_CONFIG[label];
  if (!config) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        config.bg,
        config.color,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs",
      )}
    >
      {config.label}
    </span>
  );
}
