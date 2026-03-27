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
      <SheetContent side="left" className="w-[240px] p-0">
        <EmployerSidebar onNavigate={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
