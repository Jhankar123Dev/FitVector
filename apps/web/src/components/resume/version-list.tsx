"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ResumeVersion } from "@/types/resume";
import Link from "next/link";

interface VersionListProps {
  versions: ResumeVersion[];
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function VersionList({ versions }: VersionListProps) {
  if (versions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {versions.map((version) => (
        <Card key={version.id} className="transition-all hover:shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            {/* Icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>

            {/* Details */}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-medium">
                {version.versionName}
              </h3>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                {version.companyName && (
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {version.companyName}
                  </span>
                )}
                {version.jobTitle && (
                  <span>{version.jobTitle}</span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(version.createdAt)}
                </span>
              </div>
            </div>

            {/* Template badge */}
            <Badge variant="secondary" className="text-[10px] capitalize">
              {version.templateId}
            </Badge>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/dashboard/resume/${version.id}`}>
                  View
                </Link>
              </Button>
              {version.pdfUrl && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={version.pdfUrl} download>
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
