"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Code2, Plus, X } from "lucide-react";
import type { JobPostFormData } from "@/types/employer";

const SKILL_SUGGESTIONS = [
  "React", "TypeScript", "Python", "Node.js", "Next.js", "Java", "Go", "Rust",
  "PostgreSQL", "MongoDB", "Redis", "Docker", "Kubernetes", "AWS", "GCP",
  "Terraform", "Figma", "GraphQL", "REST APIs", "Tailwind CSS",
  "Machine Learning", "System Design", "Agile", "CI/CD",
];

interface Props {
  form: JobPostFormData;
  update: (updates: Partial<JobPostFormData>) => void;
}

export function Step3Skills({ form, update }: Props) {
  const [reqSkillInput, setReqSkillInput] = useState("");
  const [niceSkillInput, setNiceSkillInput] = useState("");

  const reqSuggestions = SKILL_SUGGESTIONS.filter(
    (s) =>
      !form.requiredSkills.includes(s) &&
      !form.niceToHaveSkills.includes(s) &&
      s.toLowerCase().includes(reqSkillInput.toLowerCase()),
  );

  const niceSuggestions = SKILL_SUGGESTIONS.filter(
    (s) =>
      !form.requiredSkills.includes(s) &&
      !form.niceToHaveSkills.includes(s) &&
      s.toLowerCase().includes(niceSkillInput.toLowerCase()),
  );

  function addRequiredSkill(skill?: string) {
    const s = (skill || reqSkillInput).trim();
    if (s && !form.requiredSkills.includes(s)) {
      update({ requiredSkills: [...form.requiredSkills, s] });
    }
    setReqSkillInput("");
  }

  function addNiceSkill(skill?: string) {
    const s = (skill || niceSkillInput).trim();
    if (s && !form.niceToHaveSkills.includes(s)) {
      update({ niceToHaveSkills: [...form.niceToHaveSkills, s] });
    }
    setNiceSkillInput("");
  }

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-amber-50 p-2">
            <Code2 className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Skills</h2>
            <p className="text-sm text-muted-foreground">Define required and nice-to-have skills</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Required Skills *</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Type a skill and press Enter"
              value={reqSkillInput}
              onChange={(e) => setReqSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); addRequiredSkill(); }
              }}
            />
            <Button variant="outline" size="icon" onClick={() => addRequiredSkill()} disabled={!reqSkillInput.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {reqSkillInput && reqSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {reqSuggestions.slice(0, 6).map((s) => (
                <button
                  key={s}
                  className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-brand-400 hover:text-brand-600"
                  onClick={() => addRequiredSkill(s)}
                >
                  + {s}
                </button>
              ))}
            </div>
          )}
          {form.requiredSkills.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {form.requiredSkills.map((s) => (
                <Badge key={s} variant="brand" className="gap-1 pr-1.5">
                  {s}
                  <button
                    onClick={() => update({ requiredSkills: form.requiredSkills.filter((sk) => sk !== s) })}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-brand-200/50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Nice-to-Have Skills</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Type a skill and press Enter"
              value={niceSkillInput}
              onChange={(e) => setNiceSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); addNiceSkill(); }
              }}
            />
            <Button variant="outline" size="icon" onClick={() => addNiceSkill()} disabled={!niceSkillInput.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {niceSkillInput && niceSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {niceSuggestions.slice(0, 6).map((s) => (
                <button
                  key={s}
                  className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-border/60 hover:text-muted-foreground"
                  onClick={() => addNiceSkill(s)}
                >
                  + {s}
                </button>
              ))}
            </div>
          )}
          {form.niceToHaveSkills.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {form.niceToHaveSkills.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1 pr-1.5">
                  {s}
                  <button
                    onClick={() => update({ niceToHaveSkills: form.niceToHaveSkills.filter((sk) => sk !== s) })}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
