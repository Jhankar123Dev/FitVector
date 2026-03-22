"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TemplatePicker } from "./template-picker";
import { PdfViewer } from "./pdf-viewer";
import { ResumeEditor } from "./resume-editor";
import { useTailorResume } from "@/hooks/use-resume";
import { Loader2, FileText, ArrowLeft, Sparkles, AlertCircle } from "lucide-react";
import type { TailorResumeResult } from "@/types/resume";

interface TailorDialogProps {
  jobDescription: string;
  jobTitle: string;
  companyName: string;
  onClose: () => void;
}

type TailorStep = "configure" | "loading" | "result";

export function TailorDialog({
  jobDescription,
  jobTitle,
  companyName,
  onClose,
}: TailorDialogProps) {
  const [step, setStep] = useState<TailorStep>("configure");
  const [templateId, setTemplateId] = useState("modern");
  const [result, setResult] = useState<TailorResumeResult | null>(null);
  const [latexSource, setLatexSource] = useState("");

  const tailorMutation = useTailorResume();

  const handleTailor = async () => {
    setStep("loading");

    try {
      const response = await tailorMutation.mutateAsync({
        jobDescription,
        jobTitle,
        companyName,
        templateId,
      });

      setResult(response.data);
      setLatexSource(response.data.latexSource);
      setStep("result");
    } catch {
      setStep("configure");
    }
  };

  if (step === "loading") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <Sparkles className="absolute -right-1 -top-1 h-5 w-5 text-yellow-500" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">Tailoring your resume...</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            AI is optimizing for {companyName ? `${companyName}'s` : "the"} job
            requirements. This takes 10-15 seconds.
          </p>
        </div>
        <div className="mt-4 space-y-2 text-center text-xs text-muted-foreground">
          <p>Analyzing job description keywords...</p>
          <p>Rewriting bullet points with STAR format...</p>
          <p>Optimizing for ATS compatibility...</p>
        </div>
      </div>
    );
  }

  if (step === "result" && result) {
    return (
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h3 className="text-sm font-semibold">{result.versionName}</h3>
              <p className="text-xs text-muted-foreground">
                Generated in {(result.generationTimeMs / 1000).toFixed(1)}s
                {result.compilationError && " (PDF unavailable)"}
              </p>
            </div>
          </div>
        </div>

        {/* Compilation warning */}
        {result.compilationError && (
          <div className="mx-4 mt-3 flex items-start gap-2 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div>
              <p className="font-medium">PDF compilation unavailable</p>
              <p className="mt-0.5">{result.compilationError}</p>
              <p className="mt-1">
                Download the .tex file and compile it in{" "}
                <a
                  href="https://www.overleaf.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Overleaf
                </a>
                .
              </p>
            </div>
          </div>
        )}

        {/* Split view: Editor | Preview */}
        <div className="flex min-h-0 flex-1">
          {/* Left: Editor */}
          <div className="w-1/2 border-r">
            <ResumeEditor
              latexSource={latexSource}
              onSourceChange={setLatexSource}
            />
          </div>

          {/* Right: PDF Preview */}
          <div className="w-1/2">
            <PdfViewer
              pdfUrl={result.pdfUrl}
              latexSource={latexSource}
              versionName={result.versionName}
            />
          </div>
        </div>
      </div>
    );
  }

  // Configure step
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h3 className="text-sm font-semibold">Tailor Resume</h3>
          <p className="text-xs text-muted-foreground">
            {companyName ? `For ${companyName}` : "Customize"} — {jobTitle || "Position"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Template selection */}
        <div>
          <h4 className="mb-3 text-sm font-medium">Choose Template</h4>
          <TemplatePicker selected={templateId} onSelect={setTemplateId} />
        </div>

        {/* JD preview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Job Description Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="line-clamp-6 text-xs text-muted-foreground">
              {jobDescription}
            </p>
          </CardContent>
        </Card>

        {/* Error message */}
        {tailorMutation.isError && (
          <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
            <p className="font-medium">Tailoring failed</p>
            <p className="mt-0.5">{tailorMutation.error?.message}</p>
          </div>
        )}
      </div>

      <div className="border-t p-4">
        <Button
          className="w-full gap-2"
          onClick={handleTailor}
          disabled={tailorMutation.isPending}
        >
          <FileText className="h-4 w-4" />
          Generate Tailored Resume
        </Button>
      </div>
    </div>
  );
}
