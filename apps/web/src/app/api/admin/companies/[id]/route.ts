import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const patchCompanySchema = z.object({
  isTransparentPipeline: z.boolean().optional(),
  planTier: z.enum(["starter", "growth", "business", "enterprise"]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const result = await getAdminSession();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = patchCompanySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  // Build update payload — only include fields that were sent
  const update: Record<string, unknown> = {};
  if (parsed.data.isTransparentPipeline !== undefined) {
    update.is_transparent_pipeline = parsed.data.isTransparentPipeline;
  }
  if (parsed.data.planTier !== undefined) {
    update.plan_tier = parsed.data.planTier;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("companies")
    .update(update)
    .eq("id", id)
    .select("id, name, is_transparent_pipeline, plan_tier")
    .single();

  if (error || !data) {
    console.error("Admin company PATCH error:", error);
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      id: data.id,
      name: data.name,
      isTransparentPipeline: data.is_transparent_pipeline,
      planTier: data.plan_tier,
    },
  });
}
