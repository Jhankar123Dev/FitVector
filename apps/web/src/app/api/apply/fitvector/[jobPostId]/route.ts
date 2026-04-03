import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── POST: One-click apply via FitVector ─────────────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: { jobPostId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobPostId } = params;
    const body = await req.json().catch(() => ({}));

    // UUID validation — block mock IDs like "res-001" from reaching Supabase
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (body.resumeId && !UUID_RE.test(String(body.resumeId))) {
      return NextResponse.json(
        { error: "Invalid resume ID — please select a valid resume" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // Fetch job post
    const { data: jobPost } = await supabase
      .from("job_posts")
      .select("id, company_id, title, required_skills, description")
      .eq("id", jobPostId)
      .eq("status", "active")
      .single();

    if (!jobPost) {
      return NextResponse.json({ error: "Job post not found or not active" }, { status: 404 });
    }

    // Check if already applied
    const { data: existing } = await supabase
      .from("fitvector_applications")
      .select("id")
      .eq("applicant_user_id", session.user.id)
      .eq("job_post_id", jobPostId)
      .single();

    if (existing) {
      return NextResponse.json({ error: "You have already applied to this job" }, { status: 409 });
    }

    // Get user profile for applicant record
    const { data: user } = await supabase
      .from("users")
      .select("full_name, email, avatar_url")
      .eq("id", session.user.id)
      .single();

    const { data: profile } = await supabase
      .from("user_profiles")
      .select('"current_role", current_company, experience_level, parsed_resume_json, skills')
      .eq("user_id", session.user.id)
      .single();

    // 1. Create applicant record in employer's pipeline
    const experienceMap: Record<string, number> = {
      fresher: 0, "1_3": 2, "3_7": 5, "7_15": 10, "15_plus": 18,
    };

    const { data: applicant, error: applicantError } = await supabase
      .from("applicants")
      .insert({
        job_post_id: jobPostId,
        user_id: session.user.id,
        name: user?.full_name || "Unknown",
        email: user?.email || "",
        role_title: profile?.current_role || null,
        current_company: profile?.current_company || null,
        experience: experienceMap[profile?.experience_level || ""] || 0,
        avatar_url: user?.avatar_url || null,
        resume_parsed_json: profile?.parsed_resume_json || null,
        screening_responses: body.screeningAnswers || [],
        interest_note: body.coverNote || null,
        source: "fitvector_organic",
        pipeline_stage: "applied",
      })
      .select("id")
      .single();

    if (applicantError || !applicant) {
      console.error("Applicant create error:", applicantError);
      return NextResponse.json({ error: "Failed to create application" }, { status: 500 });
    }

    // 2. Create fitvector_applications record
    const matchScore = body.matchScore || null;
    const now = new Date().toISOString();

    const { data: fvApp, error: fvError } = await supabase
      .from("fitvector_applications")
      .insert({
        applicant_user_id: session.user.id,
        job_post_id: jobPostId,
        applicant_id: applicant.id,
        tailored_resume_id: body.resumeId || null,
        match_score: matchScore,
        screening_responses: body.screeningAnswers || [],
        interest_note: body.coverNote || null,
        resume_name: body.resumeName || null,
        status: "applied",
        status_timeline: [
          { status: "fv_applied", label: "Applied via FitVector", timestamp: now },
        ],
        status_updated_at: now,
      })
      .select("id, status")
      .single();

    if (fvError || !fvApp) {
      console.error("FitVector application error:", fvError);
      // Rollback applicant
      await supabase.from("applicants").delete().eq("id", applicant.id);
      return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
    }

    // 3. Also create in the seeker's applications tracker
    try {
      await supabase.from("applications").insert({
        user_id: session.user.id,
        job_id: null,
        job_title: jobPost.title,
        company_name: "FitVector Employer",
        status: "applied",
        notes: `Applied via FitVector (Match: ${matchScore || "N/A"}%)`,
        applied_at: now,
      });
    } catch {
      // Non-critical — seeker tracker entry
    }

    return NextResponse.json({
      data: {
        id: fvApp.id,
        applicantId: applicant.id,
        status: fvApp.status,
      },
      message: "Application submitted successfully!",
    }, { status: 201 });
  } catch (error) {
    console.error("FitVector apply error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
