"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { EmployerSidebar } from "@/components/employer/sidebar";

interface EmployerMobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployerMobileNav({ open, onOpenChange }: EmployerMobileNavProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0">
        <EmployerSidebar />
      </SheetContent>
    </Sheet>
  );
}
