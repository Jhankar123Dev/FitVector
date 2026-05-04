import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      status: {
        success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
        warning: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
        error:   "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
        info:    "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400",
        neutral: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      status: "neutral",
    },
  },
);

const dotColors: Record<string, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error:   "bg-red-500",
  info:    "bg-sky-500",
  neutral: "bg-muted-foreground/50",
};

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  icon?: React.ReactNode;
  dot?: boolean;
}

function StatusBadge({ className, status, icon, dot = false, children, ...props }: StatusBadgeProps) {
  const resolvedStatus = status ?? "neutral";
  return (
    <span className={cn(statusBadgeVariants({ status }), className)} {...props}>
      {dot && !icon && (
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColors[resolvedStatus])} />
      )}
      {icon && <span className="shrink-0 [&>svg]:h-3 [&>svg]:w-3">{icon}</span>}
      {children}
    </span>
  );
}

export { StatusBadge, statusBadgeVariants };
