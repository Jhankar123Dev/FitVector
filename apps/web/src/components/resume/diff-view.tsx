"use client";

import { useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionDiff } from "@/components/resume/section-diff";

interface ResumeSection {
  name: string;
  original: string;
  tailored: string;
}

interface DiffViewProps {
  jobTitle: string;
  companyName: string;
  beforeScore?: number;
  afterScore?: number;
  sections: ResumeSection[];
  onClose: () => void;
  onDownload?: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "bg-emerald-50 text-emerald-700";
  if (score >= 60) return "bg-brand-50 text-brand-700";
  if (score >= 40) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

export function DiffView({
  jobTitle,
  companyName,
  beforeScore,
  afterScore,
  sections,
  onClose,
  onDownload,
}: DiffViewProps) {
  const [accepted, setAccepted] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    sections.forEach((s) => {
      initial[s.name] = true; // Default all accepted
    });
    return initial;
  });

  const toggleSection = (name: string) => {
    setAccepted((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const acceptedCount = Object.values(accepted).filter(Boolean).length;

  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border p-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Resume Changes</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Tailored for <span className="font-medium text-foreground/80">{jobTitle}</span>
            {companyName && (
              <>
                {" "}at <span className="font-medium text-foreground/80">{companyName}</span>
              </>
            )}
          </p>
        </div>
        <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted">
          <X className="h-5 w-5 text-muted-foreground/70" />
        </button>
      </div>

      {/* Score comparison */}
      {beforeScore !== undefined && afterScore !== undefined && (
        <div className="flex items-center gap-6 border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Before:</span>
            <Badge className={getScoreColor(beforeScore)}>{beforeScore}%</Badge>
          </div>
          <div className="text-muted-foreground/40">→</div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">After:</span>
            <Badge className={getScoreColor(afterScore)}>{afterScore}%</Badge>
          </div>
          <div className="ml-auto text-sm text-muted-foreground/70">
            {acceptedCount}/{sections.length} sections accepted
          </div>
        </div>
      )}

      {/* Diff sections */}
      <div className="space-y-4 p-6">
        {sections.map((section) => (
          <SectionDiff
            key={section.name}
            sectionName={section.name}
            original={section.original}
            tailored={section.tailored}
            accepted={accepted[section.name] ?? true}
            onToggle={() => toggleSection(section.name)}
          />
        ))}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        {onDownload && (
          <Button onClick={onDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download Tailored PDF
          </Button>
        )}
      </div>
    </div>
  );
}
