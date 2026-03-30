"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";

interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  experience: Array<{
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    bullets: string[];
    technologies: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    graduationYear: number;
  }>;
  skills: string[];
  projects: Array<{ name: string; description: string; technologies: string[]; url?: string }>;
  certifications: Array<{ name: string; issuer: string; year: number }>;
}

type UploadState = "idle" | "uploading" | "parsing" | "success" | "error";

export function StepResumeUpload() {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [editableSkills, setEditableSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a PDF or DOCX file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5MB");
      return;
    }

    setFileName(file.name);
    setError(null);
    setUploadState("uploading");

    try {
      const formData = new FormData();
      formData.append("file", file);

      setUploadState("parsing");

      const res = await fetch("/api/ai/parse-resume", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to parse resume");
      }

      const result = await res.json();
      const raw = result.data.parsed;
      // Normalise: Gemini returns snake_case nested under contact
      const parsed: ParsedResume = {
        name: raw?.contact?.name || raw?.name || "",
        email: raw?.contact?.email || raw?.email || "",
        phone: raw?.contact?.phone || raw?.phone || "",
        location: raw?.contact?.location || raw?.location || "",
        summary: raw?.summary || "",
        experience: (raw?.experience || []).map((e: any) => ({
          company: e.company || "",
          role: e.role || e.title || "",
          startDate: e.start_date || e.startDate || "",
          endDate: e.end_date || e.endDate || "Present",
          bullets: e.bullets || [],
          technologies: e.technologies || [],
        })),
        education: (raw?.education || []).map((e: any) => ({
          institution: e.institution || e.school || "",
          degree: e.degree || "",
          field: e.field || e.major || "",
          graduationYear: e.year || e.graduation_year || e.graduationYear || 0,
        })),
        skills: raw?.skills || [],
        projects: (raw?.projects || []).map((p: any) => ({
          name: p.name || p.title || "",
          description: Array.isArray(p.bullets) ? p.bullets.join(" ") : (p.description || ""),
          technologies: p.technologies || [],
          url: p.url || "",
        })),
        certifications: (raw?.certifications || []).map((c: any) =>
          typeof c === "string" ? { name: c, issuer: "", year: 0 } : c
        ),
      };
      setParsedData(parsed);
      setEditableSkills(parsed.skills || []);
      setUploadState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setUploadState("error");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleRetry = () => {
    setUploadState("idle");
    setError(null);
    setParsedData(null);
    setFileName(null);
    setEditableSkills([]);
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !editableSkills.includes(trimmed)) {
      setEditableSkills([...editableSkills, trimmed]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setEditableSkills(editableSkills.filter((s) => s !== skill));
  };

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveParsedData = async () => {
    if (!parsedData) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parsedResumeJson: { ...parsedData, skills: editableSkills },
          skills: editableSkills,
        }),
      });
      if (res.ok) setSaveSuccess(true);
    } catch {
      // Non-critical
    } finally {
      setSaving(false);
    }
  };

  // Upload area
  if (uploadState === "idle" || uploadState === "error") {
    return (
      <div className="space-y-6">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-12 text-center transition-colors hover:border-primary/50"
        >
          <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-1 text-lg font-medium">Upload your resume</h3>
          <p className="mb-4 text-sm text-muted-foreground">PDF or DOCX, max 5MB</p>
          <Button type="button" onClick={() => fileInputRef.current?.click()}>
            Choose File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
            <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={handleRetry}>
              Retry
            </Button>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground">
          You can skip this step and upload later from your dashboard.
        </p>
      </div>
    );
  }

  // Parsing/uploading state
  if (uploadState === "uploading" || uploadState === "parsing") {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
        <h3 className="mb-1 text-lg font-medium">
          {uploadState === "uploading" ? "Uploading..." : "Analyzing your resume..."}
        </h3>
        <p className="text-sm text-muted-foreground">
          {uploadState === "parsing"
            ? "Our AI is extracting your experience, skills, and education"
            : `Uploading ${fileName}`}
        </p>
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          {fileName}
        </div>
      </div>
    );
  }

  // Success — show parsed data
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span>Resume parsed successfully! Review and edit the extracted data below.</span>
      </div>

      {parsedData && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="space-y-2">
            <Label>Professional Summary</Label>
            <Textarea
              defaultValue={parsedData.summary ?? ""}
              rows={3}
              className="text-sm"
            />
          </div>

          {/* Experience */}
          {(parsedData.experience?.length ?? 0) > 0 && (
            <div className="space-y-2">
              <Label>Experience</Label>
              {parsedData.experience.map((exp, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{exp.role}</p>
                        <p className="text-sm text-muted-foreground">
                          {exp.company} &middot; {(exp as any).start_date ?? exp.startDate} - {(exp as any).end_date ?? exp.endDate}
                        </p>
                      </div>
                    </div>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                      {(exp.bullets ?? []).slice(0, 3).map((bullet, j) => (
                        <li key={j}>{bullet}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Education */}
          {(parsedData.education?.length ?? 0) > 0 && (
            <div className="space-y-2">
              <Label>Education</Label>
              {parsedData.education.map((edu, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <p className="font-medium">
                      {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {edu.institution} &middot; {(edu as any).year ?? edu.graduationYear}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Certifications */}
          {(parsedData.certifications?.length ?? 0) > 0 && (
            <div className="space-y-2">
              <Label>Certifications</Label>
              <div className="flex flex-wrap gap-2">
                {parsedData.certifications.map((cert, i) => (
                  <Badge key={i} variant="outline" className="py-1 text-xs">
                    {typeof cert === "string" ? cert : cert.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          <div className="space-y-2">
            <Label>Skills</Label>
            <div className="flex flex-wrap gap-2">
              {editableSkills.map((skill) => (
                <Badge key={skill} variant="secondary" className="gap-1 py-1">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Add a skill..."
                className="max-w-xs"
              />
              <Button type="button" variant="outline" size="sm" onClick={addSkill}>
                Add
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" disabled={saving} onClick={handleSaveParsedData}>
              {saving ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Saving...</> : "Save Changes"}
            </Button>
            {saveSuccess && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" /> Saved
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
