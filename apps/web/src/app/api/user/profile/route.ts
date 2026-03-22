import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, name, avatar_url, plan_tier, plan_expiry, onboarding_completed")
      .eq("id", session.user.id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    return NextResponse.json({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        planTier: user.plan_tier,
        planExpiry: user.plan_expiry,
        onboardingCompleted: user.onboarding_completed,
        profile: profile
          ? {
              currentRole: profile.current_role,
              currentCompany: profile.current_company,
              experienceLevel: profile.experience_level,
              targetRoles: profile.target_roles,
              targetLocations: profile.target_locations,
              preferredWorkMode: profile.preferred_work_mode,
              expectedSalaryMin: profile.expected_salary_min,
              expectedSalaryMax: profile.expected_salary_max,
              salaryCurrency: profile.salary_currency,
              skills: profile.skills,
              resumeParsedAt: profile.resume_parsed_at,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Update user name if provided
    if (body.name) {
      await supabase.from("users").update({ name: body.name }).eq("id", session.user.id);
    }

    // Build profile update object (only include provided fields)
    const profileUpdate: Record<string, unknown> = {};
    if (body.currentRole !== undefined) profileUpdate.current_role = body.currentRole;
    if (body.currentCompany !== undefined) profileUpdate.current_company = body.currentCompany;
    if (body.targetRoles !== undefined) profileUpdate.target_roles = body.targetRoles;
    if (body.targetLocations !== undefined) profileUpdate.target_locations = body.targetLocations;
    if (body.experienceLevel !== undefined) profileUpdate.experience_level = body.experienceLevel;
    if (body.preferredWorkMode !== undefined)
      profileUpdate.preferred_work_mode = body.preferredWorkMode;
    if (body.expectedSalaryMin !== undefined)
      profileUpdate.expected_salary_min = body.expectedSalaryMin;
    if (body.expectedSalaryMax !== undefined)
      profileUpdate.expected_salary_max = body.expectedSalaryMax;
    if (body.skills !== undefined) profileUpdate.skills = body.skills;
    if (body.parsedResumeJson !== undefined)
      profileUpdate.parsed_resume_json = body.parsedResumeJson;

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabase
        .from("user_profiles")
        .upsert({ user_id: session.user.id, ...profileUpdate }, { onConflict: "user_id" });

      if (profileError) {
        console.error("Profile update error:", profileError);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
      }
    }

    return NextResponse.json({ data: { updated: true }, message: "Profile updated" });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
