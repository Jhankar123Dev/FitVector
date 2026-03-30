import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { name, email, password } = parsed.data;
    const supabase = createAdminClient();

    // Check if email already exists (covers both seekers and employers — single table)
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, role")
      .eq("email", email)
      .single();

    if (existingUser) {
      const msg =
        existingUser.role === "seeker"
          ? "This email is already registered as a job seeker account."
          : "An account with this email already exists.";
      return NextResponse.json({ error: msg }, { status: 409 });
    }

    // Hash password with bcrypt (cost factor 10)
    const passwordHash = await bcrypt.hash(password, 10);

    // Create employer user
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        email,
        full_name: name,
        auth_provider: "credentials",
        password_hash: passwordHash,
        plan_tier: "free",
        status: "onboarding",
        onboarding_completed: false,
        role: "employer",
      })
      .select("id, email, full_name")
      .single();

    if (insertError) {
      console.error("Employer signup error:", insertError);
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }

    return NextResponse.json({
      data: { id: newUser.id, email: newUser.email, name: newUser.full_name },
      message: "Employer account created successfully",
    });
  } catch (error) {
    console.error("Employer signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
