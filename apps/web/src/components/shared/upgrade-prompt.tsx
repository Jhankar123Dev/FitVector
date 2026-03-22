"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import Link from "next/link";

interface UpgradePromptProps {
  message: string;
  feature?: string;
}

export function UpgradePrompt({ message, feature }: UpgradePromptProps) {
  return (
    <Card className="border-dashed border-primary/30 bg-primary/5">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="rounded-full bg-primary/10 p-2">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
          {feature && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Upgrade to unlock {feature}
            </p>
          )}
        </div>
        <Button size="sm" asChild>
          <Link href="/dashboard/settings/plan">Upgrade</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
