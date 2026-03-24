"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Download, ExternalLink, Loader2 } from "lucide-react";

interface PdfViewerProps {
  /** DB id of the tailored_resumes row — used to hit the compile-on-demand route */
  resumeId: string | null;
  latexSource: string;
  versionName: string;
}

export function PdfViewer({ resumeId, latexSource, versionName }: PdfViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [pdfLoading, setPdfLoading] = useState(true);

  const compilePdfUrl = resumeId
    ? `/api/user/resumes/${resumeId}/pdf`
    : null;

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 25, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 25, 50));
  }, []);

  const handleDownloadLatex = useCallback(() => {
    const blob = new Blob([latexSource], { type: "text/x-tex" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${versionName}.tex`;
    a.click();
    URL.revokeObjectURL(url);
  }, [latexSource, versionName]);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="min-w-[3rem] text-center text-xs">{zoom}%</span>
          <Button variant="ghost" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          {compilePdfUrl && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                <a href={compilePdfUrl} download={`${versionName}.pdf`}>
                  <Download className="h-3 w-3" />
                  PDF
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href={compilePdfUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={handleDownloadLatex} className="gap-1.5 text-xs">
            <Download className="h-3 w-3" />
            LaTeX
          </Button>
        </div>
      </div>

      {/* PDF preview area */}
      <div className="relative flex-1 overflow-auto bg-gray-200 p-4">
        {compilePdfUrl ? (
          <>
            {pdfLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-gray-200">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Compiling PDF…</p>
              </div>
            )}
            <div
              className="mx-auto"
              style={{
                width: `${(8.5 * zoom) / 100}in`,
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
              }}
            >
              <iframe
                key={compilePdfUrl}
                src={`${compilePdfUrl}#toolbar=0`}
                className="h-[11in] w-[8.5in] bg-white shadow-lg"
                title="Resume PDF preview"
                onLoad={() => setPdfLoading(false)}
              />
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-[8.5in]">
            <div className="rounded-lg bg-white p-8 shadow-lg">
              <div className="mb-4 rounded bg-yellow-50 p-3 text-xs text-yellow-700">
                PDF preview unavailable — resume not yet saved. You can still
                download the .tex file and compile it in{" "}
                <a
                  href="https://www.overleaf.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Overleaf
                </a>
                .
              </div>
              <pre className="max-h-[600px] overflow-auto whitespace-pre-wrap break-words font-mono text-[10px] leading-relaxed text-gray-800">
                {latexSource}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
