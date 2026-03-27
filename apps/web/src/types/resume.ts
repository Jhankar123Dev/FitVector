export interface TailorResumeParams {
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
  templateId?: string;
}

export interface TailorResumeResult {
  id: string | null;
  latexSource: string;
  versionName: string;
  generationTimeMs: number;
  compilationError?: string | null;
  usage: {
    used: number;
    limit: number;
  };
}

export interface ResumeVersion {
  id: string;
  versionName: string;
  templateId: string;
  jobTitle: string | null;
  companyName: string | null;
  createdAt: string;
}

export type ResumeTemplate = {
  id: string;
  name: string;
  description: string;
  preview: string;
  available: boolean;
};

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean, minimal layout with clear section headings",
    preview: "/templates/modern-preview.png",
    available: true,
  },
  {
    id: "classic",
    name: "Classic",
    description: "Traditional resume format, ATS-optimized",
    preview: "/templates/classic-preview.png",
    available: false,
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean single-column design",
    preview: "/templates/minimal-preview.png",
    available: false,
  },
  {
    id: "custom",
    name: "Custom",
    description: "Upload your own LaTeX template",
    preview: "/templates/custom-preview.png",
    available: false,
  },
];
