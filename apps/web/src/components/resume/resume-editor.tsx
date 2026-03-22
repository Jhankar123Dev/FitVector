"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check } from "lucide-react";

interface ResumeEditorProps {
  latexSource: string;
  onSourceChange?: (source: string) => void;
  readOnly?: boolean;
}

export function ResumeEditor({
  latexSource,
  onSourceChange,
  readOnly = false,
}: ResumeEditorProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(latexSource);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full flex-col">
      <Tabs defaultValue="source" className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <TabsList className="h-8">
            <TabsTrigger value="source" className="text-xs">
              LaTeX Source
            </TabsTrigger>
            <TabsTrigger value="sections" className="text-xs">
              Sections
            </TabsTrigger>
          </TabsList>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="gap-1.5 text-xs"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>

        <TabsContent value="source" className="mt-0 flex-1 overflow-hidden">
          <Textarea
            value={latexSource}
            onChange={(e) => onSourceChange?.(e.target.value)}
            readOnly={readOnly}
            className="h-full resize-none rounded-none border-0 font-mono text-xs leading-relaxed focus-visible:ring-0"
            placeholder="LaTeX source will appear here after tailoring..."
          />
        </TabsContent>

        <TabsContent value="sections" className="mt-0 flex-1 overflow-auto p-4">
          <SectionBreakdown latex={latexSource} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SectionBreakdown({ latex }: { latex: string }) {
  if (!latex) {
    return (
      <p className="text-sm text-muted-foreground">
        No resume content to display.
      </p>
    );
  }

  // Parse sections from LaTeX
  const sectionRegex = /\\section\{([^}]+)\}/g;
  const sections: { name: string; startIdx: number }[] = [];
  let match;
  while ((match = sectionRegex.exec(latex)) !== null) {
    sections.push({ name: match[1], startIdx: match.index });
  }

  if (sections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Could not detect sections in the LaTeX source.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((section, i) => {
        const endIdx =
          i < sections.length - 1
            ? sections[i + 1].startIdx
            : latex.length;
        const content = latex
          .slice(section.startIdx, endIdx)
          .trim()
          .slice(0, 500);

        return (
          <div key={section.name} className="rounded-lg border p-3">
            <h4 className="mb-2 text-xs font-semibold uppercase text-primary">
              {section.name}
            </h4>
            <pre className="whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-muted-foreground">
              {content}
              {content.length >= 500 && "..."}
            </pre>
          </div>
        );
      })}
    </div>
  );
}
