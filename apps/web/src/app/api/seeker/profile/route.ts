import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSeekerSession } from "@/lib/seeker-auth";

export async function GET() {
  try {
    const result = await getSeekerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    const { user } = result.data;
    const supabase = createAdminClient();

    const { data: profile } = await supabase
      .from("user_profiles")
      .select(
        "current_role, current_company, experience_level, target_roles, target_locations, preferred_work_mode, preferred_job_types, skills, phone, linkedin_url, portfolio_url, work_history",
      )
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      data: {
        fullName:          user.full_name,
        email:             user.email,
        currentRole:       profile?.current_role        ?? null,
        currentCompany:    profile?.current_company     ?? null,
        experienceLevel:   profile?.experience_level    ?? null,
        targetRoles:       profile?.target_roles        ?? [],
        targetLocations:   profile?.target_locations    ?? [],
        preferredWorkMode: profile?.preferred_work_mode ?? null,
        preferredJobTypes: profile?.preferred_job_types ?? [],
        skills:            profile?.skills              ?? [],
        phone:             profile?.phone               ?? null,
        linkedinUrl:       profile?.linkedin_url        ?? null,
        portfolioUrl:      profile?.portfolio_url       ?? null,
        workHistory:       profile?.work_history        ?? [],
      },
    });
  } catch (err) {
    console.error("seeker profile GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const result = await getSeekerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    const { user } = result.data;
    const body = (await req.json()) as {
      fullName?:        string;
      currentRole?:     string;
      currentCompany?:  string;
      skills?:          string[];
      targetRoles?:     string[];
      targetLocations?: string[];
      phone?:           string;
      linkedinUrl?:     string;
      portfolioUrl?:    string;
      workHistory?:     unknown[];
    };

    const supabase = createAdminClient();

    // Update display name on users table
    if (body.fullName !== undefined) {
      await supabase.from("users").update({ full_name: body.fullName }).eq("id", user.id);
    }

    // Upsert profile fields
    const profilePatch: Record<string, unknown> = { user_id: user.id };
    if (body.currentRole     !== undefined) profilePatch.current_role      = body.currentRole;
    if (body.currentCompany  !== undefined) profilePatch.current_company   = body.currentCompany;
    if (body.skills          !== undefined) profilePatch.skills            = body.skills;
    if (body.targetRoles     !== undefined) profilePatch.target_roles      = body.targetRoles;
    if (body.targetLocations !== undefined) profilePatch.target_locations  = body.targetLocations;
    if (body.phone           !== undefined) profilePatch.phone             = body.phone;
    if (body.linkedinUrl     !== undefined) profilePatch.linkedin_url      = body.linkedinUrl;
    if (body.portfolioUrl    !== undefined) profilePatch.portfolio_url     = body.portfolioUrl;
    if (body.workHistory     !== undefined) profilePatch.work_history      = body.workHistory;

    await supabase.from("user_profiles").upsert(profilePatch, { onConflict: "user_id" });

    return NextResponse.json({ message: "Profile updated" });
  } catch (err) {
    console.error("seeker profile PUT error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
