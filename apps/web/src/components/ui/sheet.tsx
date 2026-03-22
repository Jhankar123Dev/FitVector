"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Sheet({ open, onOpenChange, children }: SheetProps) {
  return <>{open && <SheetContext.Provider value={{ onClose: () => onOpenChange?.(false) }}>{children}</SheetContext.Provider>}</>;
}

const SheetContext = React.createContext<{ onClose: () => void }>({ onClose: () => {} });

function SheetOverlay({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { onClose } = React.useContext(SheetContext);
  return (
    <div
      className={cn("fixed inset-0 z-50 bg-black/80 animate-in fade-in-0", className)}
      onClick={onClose}
      {...props}
    />
  );
}

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "bottom" | "left" | "right";
}

function SheetContent({ side = "left", className, children, ...props }: SheetContentProps) {
  const { onClose } = React.useContext(SheetContext);
  const sideClasses = {
    top: "inset-x-0 top-0 border-b",
    bottom: "inset-x-0 bottom-0 border-t",
    left: "inset-y-0 left-0 h-full w-3/4 max-w-sm border-r",
    right: "inset-y-0 right-0 h-full w-3/4 max-w-sm border-l",
  };

  return (
    <>
      <SheetOverlay />
      <div
        className={cn(
          "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out animate-in",
          side === "left" && "slide-in-from-left",
          side === "right" && "slide-in-from-right",
          sideClasses[side],
          className,
        )}
        {...props}
      >
        {children}
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </>
  );
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold text-foreground", className)} {...props} />;
}

function SheetTrigger({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <div onClick={onClick}>{children}</div>;
}

export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetOverlay };
