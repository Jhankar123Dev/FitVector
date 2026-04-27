import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center rounded-xl border-2 border-dashed border-border",
  {
    variants: {
      size: {
        sm: "gap-2 py-8",
        md: "gap-3 py-12",
        lg: "gap-4 py-20",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

const iconWrapperVariants = cva(
  "flex items-center justify-center rounded-full bg-muted",
  {
    variants: {
      size: {
        sm: "h-10 w-10 [&>svg]:h-5 [&>svg]:w-5",
        md: "h-14 w-14 [&>svg]:h-7 [&>svg]:w-7",
        lg: "h-20 w-20 [&>svg]:h-10 [&>svg]:w-10",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

const titleVariants = cva("font-semibold text-foreground", {
  variants: {
    size: {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

const descVariants = cva("text-muted-foreground max-w-xs", {
  variants: {
    size: {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-sm",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export interface EmptyStateProps extends VariantProps<typeof emptyStateVariants> {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

function EmptyState({ icon, title, description, action, size, className }: EmptyStateProps) {
  return (
    <div className={cn(emptyStateVariants({ size }), className)}>
      {icon && (
        <div className={cn(iconWrapperVariants({ size }), "text-muted-foreground")}>
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className={cn(titleVariants({ size }))}>{title}</p>
        {description && <p className={cn(descVariants({ size }))}>{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export { EmptyState };
