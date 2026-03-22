"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Lock } from "lucide-react";
import { RESUME_TEMPLATES } from "@/types/resume";
import { cn } from "@/lib/utils";

interface TemplatePickerProps {
  selected: string;
  onSelect: (templateId: string) => void;
}

export function TemplatePicker({ selected, onSelect }: TemplatePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {RESUME_TEMPLATES.map((template) => (
        <Card
          key={template.id}
          className={cn(
            "cursor-pointer transition-all",
            selected === template.id
              ? "border-primary ring-2 ring-primary/20"
              : template.available
                ? "hover:border-foreground/30"
                : "cursor-not-allowed opacity-60",
          )}
          onClick={() => template.available && onSelect(template.id)}
        >
          <CardContent className="p-3">
            {/* Preview placeholder */}
            <div className="relative mb-2 flex h-20 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
              {template.available ? (
                template.name
              ) : (
                <Lock className="h-4 w-4" />
              )}
              {selected === template.id && (
                <div className="absolute right-1 top-1 rounded-full bg-primary p-0.5">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>
            <p className="text-xs font-medium">{template.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {template.description}
            </p>
            {!template.available && (
              <Badge variant="secondary" className="mt-1 text-[10px]">
                Pro
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
