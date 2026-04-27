import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-muted text-muted-foreground",
        secondary: "border-transparent bg-muted text-muted-foreground",
        brand: "border-transparent bg-primary/10 text-primary",
        success:
          "border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
        warning:
          "border-transparent bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
        destructive:
          "border-transparent bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
        info:    "border-transparent bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400",
        neutral: "border-transparent bg-muted text-muted-foreground",
        outline: "text-foreground border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
