"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfirmModalProps {
  open:           boolean;
  title:          string;
  description:    string;
  confirmLabel?:  string;
  cancelLabel?:   string;
  variant?:       "destructive" | "warning" | "default";
  onConfirm:      () => void;
  onCancel:       () => void;
  isLoading?:     boolean;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel  = "Confirm",
  cancelLabel   = "Cancel",
  variant       = "default",
  onConfirm,
  onCancel,
  isLoading     = false,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-surface-200 bg-white p-6 shadow-xl"
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
          if (e.key === "Enter" && !isLoading) onConfirm();
        }}
        tabIndex={-1}
      >
        {/* Icon */}
        <div className={cn(
          "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full",
          variant === "destructive" ? "bg-red-100"
          : variant === "warning"   ? "bg-amber-100"
          : "bg-brand-50",
        )}>
          {variant === "destructive"
            ? <Trash2 className="h-6 w-6 text-red-600" />
            : <AlertTriangle className={cn("h-6 w-6", variant === "warning" ? "text-amber-600" : "text-brand-600")} />
          }
        </div>

        {/* Text */}
        <h3 className="text-center text-base font-semibold text-surface-800">{title}</h3>
        <p className="mt-1.5 text-center text-sm text-surface-500">{description}</p>

        {/* Actions */}
        <div className="mt-5 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            className={cn(
              "flex-1",
              variant === "destructive" ? "bg-red-600 hover:bg-red-700 text-white"
              : variant === "warning"   ? "bg-amber-500 hover:bg-amber-600 text-white"
              : "",
            )}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processing…
              </span>
            ) : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
