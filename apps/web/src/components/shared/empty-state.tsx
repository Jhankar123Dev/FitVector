"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  action,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-surface-200 py-16 text-center",
        className,
      )}
    >
      <div className="rounded-full bg-surface-100 p-4">
        <Icon className="h-8 w-8 text-surface-400" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-surface-800">{title}</h3>
        <p className="mt-1 max-w-sm text-sm text-surface-500">
          {description}
        </p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
