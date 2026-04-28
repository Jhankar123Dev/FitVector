"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, Building2, Loader2 } from "lucide-react";
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

function DownloadButton({ versionId, versionName }: { versionId: string; versionName: string }) {
  const [downloading, setDownloading] = useState(false);
  const [dlError, setDlError] = useState<string | null>(null);

  async function handleDownload() {
    setDownloading(true);
    setDlError(null);
    try {
      const res = await fetch(`/api/user/resumes/${versionId}/pdf`);
      if (!res.ok) {
        const text = await res.text();
        const msg = text.includes("PDF not available") || res.status === 422
          ? "PDF not available — re-tailor this resume to generate one."
          : text.includes("compilation failed")
          ? "PDF compilation failed — LaTeX content may be corrupted."
          : text.includes("not found")
          ? "Resume not found."
          : "PDF generation failed. Please try again.";
        setDlError(msg);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${versionName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setDlError("Download failed — please check your connection.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <Button
        variant="ghost"
        size="sm"
        title="Download PDF"
        disabled={downloading}
        onClick={handleDownload}
      >
        {downloading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
      </Button>
      {dlError && (
        <p className="max-w-[160px] text-right text-[10px] text-red-500">{dlError}</p>
      )}
    </div>
  );
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
              <DownloadButton versionId={version.id} versionName={version.versionName} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
