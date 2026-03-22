"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp } from "lucide-react";
import type { SkillToLearn } from "@/types/job";

interface SkillsToLearnData {
  skillsToLearn: SkillToLearn[];
  totalTracked: number;
  minimumRequired: number;
}

export function SkillsToLearnCard() {
  const { data, isLoading } = useQuery<SkillsToLearnData>({
    queryKey: ["tracker-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/tracker/analytics");
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      return json.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Skills to Learn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.totalTracked < data.minimumRequired) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Skills to Learn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Track at least {data?.minimumRequired || 5} jobs to see personalized
            skill recommendations. You have {data?.totalTracked || 0} tracked.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (data.skillsToLearn.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Skills to Learn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Great job! You already have the skills needed for your tracked jobs.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          Skills to Learn
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Based on your {data.totalTracked} tracked jobs
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.skillsToLearn.map((skill, idx) => (
            <div
              key={skill.skill}
              className="flex items-start gap-3 rounded-lg border p-3"
            >
              {/* Rank */}
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {idx + 1}
              </div>

              <div className="min-w-0 flex-1">
                {/* Skill name + badges */}
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{skill.skill}</span>
                  {skill.wouldUnlock > 0 && (
                    <Badge
                      variant="secondary"
                      className="gap-0.5 bg-green-50 px-1.5 text-[10px] text-green-700"
                    >
                      <TrendingUp className="h-2.5 w-2.5" />
                      +{skill.wouldUnlock}
                    </Badge>
                  )}
                </div>

                {/* Message */}
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {skill.message}
                </p>

                {/* Stats row */}
                <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>Required in {skill.requiredIn} jobs</span>
                  {skill.niceToHaveIn > 0 && (
                    <span>Nice-to-have in {skill.niceToHaveIn}</span>
                  )}
                  <span className="font-medium text-foreground">
                    Priority: {skill.priorityScore}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
