import { auth } from "@/lib/auth";
import { pythonClient } from "@/lib/python-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLAN_LIMITS, hasQuota } from "@fitvector/shared";
import type { PlanTier } from "@fitvector/shared";
import { z } from "zod";

const tailorSchema = z.object({
  jobDescription: z.string().min(10, "Job description too short").max(10000, "Job description too long"),
  jobTitle:    z.string().max(150).optional(),
  companyName: z.string().max(100).optional(),
  templateId:  z.string().max(50).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const planTier = (session.user.planTier || "free") as PlanTier;

    // Check usage limit
    const supabase = createAdminClient();
    const monthStart = new Date().toISOString().slice(0, 7) + "-01";

    const { count } = await supabase
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("feature", "resume_tailor")
      .gte("created_at", `${monthStart}T00:00:00Z`);

    const currentUsage = count || 0;
    if (!hasQuota(planTier, "resume_tailor", currentUsage)) {
      return Response.json(
        {
          error: "Monthly resume tailoring limit reached. Upgrade your plan for more.",
          upgrade: true,
          usage: {
            used: currentUsage,
            limit: PLAN_LIMITS[planTier].resume_tailor,
          },
        },
        { status: 429 },
      );
    }

    const raw = await req.json();
    const parsed = tailorSchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    const body = parsed.data;

    // Get user's parsed resume
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("parsed_resume_json, target_roles, skills")
      .eq("user_id", userId)
      .single();

    if (!profile?.parsed_resume_json) {
      return Response.json(
        {
          error:
            "No resume found. Please upload your resume in the onboarding step first.",
        },
        { status: 400 },
      );
    }

    // Call Python tailoring service — returns LaTeX only, no PDF compiled here
    const result = await pythonClient.post<{
      latex_source: string;
      version_name: string;
      generation_time_ms: number;
      error: string | null;
    }>("/ai/tailor-resume", {
      parsed_resume_json: profile.parsed_resume_json,
      job_description: body.jobDescription,
      job_title: body.jobTitle || null,
      company_name: body.companyName || null,
      template_id: body.templateId || "modern",
    }, { timeout: 60000 });

    // Guard: reject if Python returned garbage instead of valid LaTeX
    if (
      !result.latex_source?.trim() ||
      !result.latex_source.includes("\\documentclass") ||
      !result.latex_source.includes("\\begin{document}")
    ) {
      console.error("[tailor-resume] Python service returned invalid LaTeX — not storing in DB.");
      return Response.json(
        { error: "Resume tailoring failed: the AI did not return valid LaTeX. Please try again." },
        { status: 500 },
      );
    }

    // Store LaTeX in DB — pdf_url stays null, compiled on-demand
    const { data: resume, error: insertError } = await supabase
      .from("tailored_resumes")
      .insert({
        user_id: userId,
        version_name: result.version_name,
        template_id: body.templateId || "modern",
        latex_source: result.latex_source,
        pdf_url: null,
        job_title: body.jobTitle || null,
        company_name: body.companyName || null,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Failed to store tailored resume:", insertError);
    }

    // Log usage
    await supabase.from("usage_logs").insert({
      user_id: userId,
      feature: "resume_tailor",
      metadata: {
        company: body.companyName,
        job_title: body.jobTitle,
        resume_id: resume?.id,
      },
    });

    return Response.json({
      data: {
        id: resume?.id || null,
        latexSource: result.latex_source,
        versionName: result.version_name,
        generationTimeMs: result.generation_time_ms,
        usage: {
          used: currentUsage + 1,
          limit: PLAN_LIMITS[planTier].resume_tailor,
        },
      },
    });
  } catch (error) {
    console.error("Resume tailoring error:", error);
    return Response.json(
      { error: "Resume tailoring failed. Please try again." },
      { status: 500 },
    );
  }
}
