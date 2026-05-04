"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  children?: React.ReactNode;
  className?: string;
}

function BulkActionBar({ count, onClear, children, className }: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm",
        className,
      )}
    >
      <button
        type="button"
        onClick={onClear}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20 cursor-pointer"
        aria-label="Clear selection"
      >
        <X className="h-3 w-3" />
      </button>
      <span className="font-medium text-foreground">
        {count} {count === 1 ? "selected" : "selected"}
      </span>
      {children && (
        <>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">{children}</div>
        </>
      )}
    </div>
  );
}

export { BulkActionBar };
