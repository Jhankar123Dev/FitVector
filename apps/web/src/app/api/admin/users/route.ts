import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const result = await getAdminSession();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 50;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("users")
    .select("id, email, full_name, role, plan_tier, status, onboarding_completed, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }
  if (role) {
    query = query.eq("role", role);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("Admin users fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }

  return NextResponse.json({
    data: (data || []).map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      role: u.role,
      planTier: u.plan_tier,
      status: u.status,
      onboardingCompleted: u.onboarding_completed,
      createdAt: u.created_at,
    })),
    total: count ?? 0,
    page,
    limit,
  });
}

export async function PATCH(req: Request) {
  const result = await getAdminSession();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const supabase = createAdminClient();
  const body = await req.json();
  const { userId, planTier, status } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (planTier) updates.plan_tier = planTier;
  if (status) updates.status = status;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { error } = await supabase.from("users").update(updates).eq("id", userId);

  if (error) {
    console.error("Admin user update error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
