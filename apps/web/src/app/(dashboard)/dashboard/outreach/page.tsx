"use client";

import { useQuery } from "@tanstack/react-query";
import { Mail, MessageSquare, UserPlus, Copy, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useState } from "react";

interface OutreachEntry {
  id: string;
  outreachType: string;
  subject: string | null;
  body: string;
  tone: string;
  recruiterName: string | null;
  createdAt: string;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
}

const TYPE_CONFIG: Record<string, { icon: typeof Mail; label: string; color: string }> = {
  cold_email: { icon: Mail, label: "Cold Email", color: "bg-blue-100 text-blue-700" },
  linkedin_message: { icon: MessageSquare, label: "LinkedIn", color: "bg-sky-100 text-sky-700" },
  referral_request: { icon: UserPlus, label: "Referral", color: "bg-purple-100 text-purple-700" },
};

export default function OutreachPage() {
  const { data: outreachList, isLoading } = useQuery<OutreachEntry[]>({
    queryKey: ["outreach-history"],
    queryFn: async () => {
      const res = await fetch("/api/outreach");
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Outreach History</h1>
        <p className="text-sm text-muted-foreground">
          All your generated cold emails, LinkedIn messages, and referral requests
        </p>
      </div>

      {isLoading && <LoadingSpinner message="Loading outreach history..." />}

      {!isLoading && (!outreachList || outreachList.length === 0) && (
        <EmptyState
          icon={Mail}
          title="No outreach messages yet"
          description="Generate cold emails or LinkedIn messages from any job in the Jobs tab."
        />
      )}

      {outreachList && outreachList.length > 0 && (
        <div className="space-y-3">
          {outreachList.map((entry) => {
            const cfg = TYPE_CONFIG[entry.outreachType] || TYPE_CONFIG.cold_email;
            const Icon = cfg.icon;
            return (
              <Card key={entry.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-muted p-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge className={cfg.color + " text-[10px]"}>{cfg.label}</Badge>
                          {entry.recruiterName && (
                            <span className="text-xs text-muted-foreground">
                              to {entry.recruiterName}
                            </span>
                          )}
                        </div>
                        {entry.subject && (
                          <p className="mt-1 text-sm font-medium">{entry.subject}</p>
                        )}
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {entry.body}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <CopyBtn text={entry.body} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
