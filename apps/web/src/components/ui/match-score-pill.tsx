import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const matchScorePillVariants = cva(
  "inline-flex items-center justify-center rounded-full font-semibold tabular-nums",
  {
    variants: {
      size: {
        sm: "h-5 min-w-[2rem] px-1.5 text-[10px]",
        md: "h-6 min-w-[2.5rem] px-2 text-xs",
        lg: "h-7 min-w-[3rem] px-2.5 text-sm",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

function getScoreClasses(score: number): string {
  if (score >= 80) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400";
  if (score >= 60) return "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400";
  if (score >= 40) return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400";
  return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
}

export interface MatchScorePillProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children">,
    VariantProps<typeof matchScorePillVariants> {
  score: number;
  showPercent?: boolean;
}

function MatchScorePill({ className, score, size, showPercent = true, ...props }: MatchScorePillProps) {
  const clamped = Math.min(Math.max(Math.round(score), 0), 100);
  return (
    <span
      className={cn(matchScorePillVariants({ size }), getScoreClasses(clamped), className)}
      title={`Match score: ${clamped}%`}
      {...props}
    >
      {clamped}{showPercent && "%"}
    </span>
  );
}

export { MatchScorePill };
