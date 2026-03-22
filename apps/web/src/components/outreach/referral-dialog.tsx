"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Loader2, UserPlus } from "lucide-react";
import { OutreachPreview } from "./outreach-preview";

interface ReferralDialogProps {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  onClose: () => void;
}

export function ReferralDialog({
  jobTitle,
  companyName,
  jobDescription,
  onClose,
}: ReferralDialogProps) {
  const [connectionName, setConnectionName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ body: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!connectionName.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/referral-msg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle,
          companyName,
          jobDescription,
          connectionName: connectionName.trim(),
          relationshipContext: relationship.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error);
      }

      const json = await res.json();
      setResult(json.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (result) {
    return (
      <OutreachPreview
        type="referral"
        body={result.body}
        onClose={onClose}
        companyName={companyName}
      />
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <UserPlus className="h-4 w-4" />
          Request Referral
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          For {jobTitle} at {companyName}
        </p>

        <div>
          <Label className="text-xs">Connection Name *</Label>
          <Input
            placeholder="e.g. Rahul Sharma"
            value={connectionName}
            onChange={(e) => setConnectionName(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-xs">How do you know them?</Label>
          <Textarea
            placeholder="e.g. College batchmate, worked together at TCS..."
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="mt-1"
            rows={2}
          />
        </div>

        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}

        <Button
          className="w-full"
          onClick={handleGenerate}
          disabled={!connectionName.trim() || isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Generate Referral Request
        </Button>
      </CardContent>
    </Card>
  );
}
