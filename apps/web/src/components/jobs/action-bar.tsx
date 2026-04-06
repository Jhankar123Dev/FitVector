"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  FileText,
  Mail,
  MessageSquare,
  Bookmark,
  BookmarkCheck,
  Zap,
  UserPlus,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import type { JobSearchResult } from "@/types/job";

export type OutreachButtonType = "cold_email" | "linkedin" | "referral";

interface ActionBarProps {
  job: JobSearchResult;
  loadingType?: OutreachButtonType | null;
  alreadyApplied?: boolean;
  onTailorResume?: () => void;
  onColdEmail?: () => void;
  onLinkedInMsg?: () => void;
  onReferral?: () => void;
  onToggleSave?: () => void;
  onFitVectorApply?: () => void;
}

export function ActionBar({
  job,
  loadingType,
  alreadyApplied,
  onTailorResume,
  onColdEmail,
  onLinkedInMsg,
  onReferral,
  onToggleSave,
  onFitVectorApply,
}: ActionBarProps) {
  const isFitVector = job.sources.includes("fitvector");
  const isAnyLoading = !!loadingType;

  function OutreachBtn({
    type,
    icon: Icon,
    label,
    onClick,
  }: {
    type: OutreachButtonType;
    icon: React.ElementType;
    label: string;
    onClick?: () => void;
  }) {
    const isThis = loadingType === type;
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={isAnyLoading}
        className="gap-1.5"
      >
        {isThis ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Icon className="h-3.5 w-3.5" />
        )}
        {isThis ? "Generating…" : label}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-t bg-background p-4">
      {/* FitVector Apply / External Apply */}
      {isFitVector ? (
        alreadyApplied ? (
          <Badge className="gap-1.5 bg-green-100 px-3 py-1.5 text-green-700 hover:bg-green-100">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Applied
          </Badge>
        ) : (
          <Button
            size="sm"
            onClick={onFitVectorApply}
            className="gap-1.5 bg-accent-500 text-white hover:bg-accent-600"
          >
            <Zap className="h-3.5 w-3.5" />
            Apply via FitVector
          </Button>
        )
      ) : (
        job.url && (
          <Button size="sm" asChild>
            <a href={job.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Apply
            </a>
          </Button>
        )
      )}

      {/* Tailor Resume */}
      <Button variant="outline" size="sm" onClick={onTailorResume}>
        <FileText className="mr-1.5 h-3.5 w-3.5" />
        Tailor Resume
      </Button>

      {/* Outreach buttons */}
      <OutreachBtn type="cold_email" icon={Mail} label="Cold Email" onClick={onColdEmail} />
      <OutreachBtn type="linkedin" icon={MessageSquare} label="InMail" onClick={onLinkedInMsg} />
      <OutreachBtn type="referral" icon={UserPlus} label="Ask Referral" onClick={onReferral} />

      {/* Save */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleSave}
        className="ml-auto"
      >
        {job.isSaved ? (
          <BookmarkCheck className="mr-1.5 h-3.5 w-3.5 text-primary" />
        ) : (
          <Bookmark className="mr-1.5 h-3.5 w-3.5" />
        )}
        {job.isSaved ? "Saved" : "Save"}
      </Button>
    </div>
  );
}
