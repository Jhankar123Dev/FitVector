import { auth } from "@/lib/auth";
import { pythonClient } from "@/lib/python-client";

interface JobDescriptionRequest {
  title: string;
  department?: string;
  location?: string;
  jobType?: string;
  workMode?: string;
  experienceMin?: number;
  experienceMax?: number;
  requiredSkills?: string[];
  draftNotes?: string;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: JobDescriptionRequest = await req.json();

    if (!body.title?.trim()) {
      return Response.json(
        { error: "Job title is required to generate a description." },
        { status: 400 },
      );
    }

    const result = await pythonClient.post<{ description: string }>(
      "/ai/generate-job-description",
      {
        title: body.title,
        department: body.department || null,
        location: body.location || null,
        jobType: body.jobType || null,
        workMode: body.workMode || null,
        experienceMin: body.experienceMin ?? null,
        experienceMax: body.experienceMax ?? null,
        requiredSkills: body.requiredSkills || [],
        draftNotes: body.draftNotes || null,
      },
      { timeout: 60000 },
    );

    return Response.json({ description: result.description });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI service error";
    return Response.json({ error: message }, { status: 500 });
  }
}
