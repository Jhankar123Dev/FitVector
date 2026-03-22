import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";

const onboardingSchema = z.object({
  currentStatus: z.enum(["student", "working", "unemployed", "freelancing"]),
  currentRole: z.string().min(1),
  currentCompany: z.string().optional(),
  experienceLevel: z.enum(["fresher", "1_3", "3_7", "7_15", "15_plus"]),
  targetRoles: z.array(z.string()).min(1),
  targetLocations: z.array(z.string()).min(1),
  preferredWorkMode: z.enum(["onsite", "remote", "hybrid"]).optional(),
  preferredJobTypes: z.array(z.enum(["fulltime", "parttime", "internship", "contract"])).optional(),
  preferredIndustries: z.array(z.string()).optional(),
  expectedSalaryMin: z.number().optional(),
  expectedSalaryMax: z.number().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = onboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const data = parsed.data;

    // Upsert user_profiles
    const { error: profileError } = await supabase.from("user_profiles").upsert(
      {
        user_id: session.user.id,
        current_status: data.currentStatus,
        current_role: data.currentRole,
        current_company: data.currentCompany || null,
        experience_level: data.experienceLevel,
        target_roles: data.targetRoles,
        target_locations: data.targetLocations,
        preferred_work_mode: data.preferredWorkMode || null,
        preferred_job_types: data.preferredJobTypes || ["fulltime"],
        preferred_industries: data.preferredIndustries || [],
        expected_salary_min: data.expectedSalaryMin || null,
        expected_salary_max: data.expectedSalaryMax || null,
      },
      { onConflict: "user_id" },
    );

    if (profileError) {
      console.error("Profile upsert error:", profileError);
      return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
    }

    // Mark onboarding complete on users table
    const { error: userError } = await supabase
      .from("users")
      .update({
        onboarding_completed: true,
        user_status: "active",
      })
      .eq("id", session.user.id);

    if (userError) {
      console.error("User update error:", userError);
      return NextResponse.json({ error: "Failed to update user status" }, { status: 500 });
    }

    return NextResponse.json(
      { data: { onboardingCompleted: true }, message: "Onboarding complete" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
