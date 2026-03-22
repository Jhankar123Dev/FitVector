"use client";

import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  FileText,
  Mail,
  MessageSquare,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import type { JobSearchResult } from "@/types/job";

interface ActionBarProps {
  job: JobSearchResult;
  onTailorResume?: () => void;
  onColdEmail?: () => void;
  onLinkedInMsg?: () => void;
  onToggleSave?: () => void;
}

export function ActionBar({
  job,
  onTailorResume,
  onColdEmail,
  onLinkedInMsg,
  onToggleSave,
}: ActionBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t bg-background p-4">
      {/* Apply externally */}
      {job.url && (
        <Button size="sm" asChild>
          <a href={job.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Apply
          </a>
        </Button>
      )}

      {/* Tailor Resume */}
      <Button variant="outline" size="sm" onClick={onTailorResume}>
        <FileText className="mr-1.5 h-3.5 w-3.5" />
        Tailor Resume
      </Button>

      {/* Cold Email */}
      <Button variant="outline" size="sm" onClick={onColdEmail}>
        <Mail className="mr-1.5 h-3.5 w-3.5" />
        Cold Email
      </Button>

      {/* LinkedIn Message */}
      <Button variant="outline" size="sm" onClick={onLinkedInMsg}>
        <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
        InMail
      </Button>

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
