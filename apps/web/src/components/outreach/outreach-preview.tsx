"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Mail, ExternalLink, X, Loader2 } from "lucide-react";

interface OutreachPreviewProps {
  type: "cold_email" | "linkedin" | "referral";
  subject?: string | null;
  subjectAlternatives?: string[];
  body: string;
  onClose: () => void;
  companyName?: string;
  recruiterEmail?: string;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
      {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied!" : label}
    </Button>
  );
}

export function OutreachPreview({
  type,
  subject,
  subjectAlternatives = [],
  body,
  onClose,
  companyName,
  recruiterEmail,
}: OutreachPreviewProps) {
  const [selectedSubject, setSelectedSubject] = useState(subject || "");

  const gmailUrl = `https://mail.google.com/mail/?view=cm&su=${encodeURIComponent(selectedSubject)}&body=${encodeURIComponent(body)}${recruiterEmail ? `&to=${encodeURIComponent(recruiterEmail)}` : ""}`;
  const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?subject=${encodeURIComponent(selectedSubject)}&body=${encodeURIComponent(body)}`;

  const typeLabel = type === "cold_email" ? "Cold Email" : type === "linkedin" ? "LinkedIn Message" : "Referral Request";

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm">{typeLabel} Generated</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Subject (cold email only) */}
        {type === "cold_email" && subject && (
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Subject</label>
              <CopyButton text={selectedSubject} label="Copy subject" />
            </div>
            <p className="mt-1 rounded bg-muted p-2 text-sm font-medium">{selectedSubject}</p>
            {subjectAlternatives.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="text-[10px] text-muted-foreground">Alternatives:</span>
                {subjectAlternatives.map((alt, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="cursor-pointer text-[10px] hover:bg-primary/10"
                    onClick={() => setSelectedSubject(alt)}
                  >
                    {alt}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Body */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Message</label>
            <CopyButton text={body} label="Copy message" />
          </div>
          <div className="mt-1 whitespace-pre-wrap rounded bg-muted p-3 text-sm">
            {body}
          </div>
          <p className="mt-1 text-right text-[10px] text-muted-foreground">
            {body.length} characters
          </p>
        </div>

        {/* Actions */}
        {type === "cold_email" && (
          <div className="flex items-center gap-2 border-t pt-3">
            <Button size="sm" variant="outline" asChild className="gap-1.5 text-xs">
              <a href={gmailUrl} target="_blank" rel="noopener noreferrer">
                <Mail className="h-3 w-3" />
                Open in Gmail
              </a>
            </Button>
            <Button size="sm" variant="outline" asChild className="gap-1.5 text-xs">
              <a href={outlookUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3" />
                Open in Outlook
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Loading state component ────────────────────────────────────────────────

interface OutreachLoadingProps {
  type: string;
}

export function OutreachLoading({ type }: OutreachLoadingProps) {
  const label = type === "cold_email" ? "cold email" : type === "linkedin" ? "LinkedIn message" : "referral request";
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      <div>
        <p className="text-sm font-medium">Generating {label}...</p>
        <p className="text-xs text-muted-foreground">AI is crafting a personalized message</p>
      </div>
    </div>
  );
}
