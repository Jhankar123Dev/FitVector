import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";
import { z } from "zod";

const tagsSchema = z.object({ tags: z.array(z.string()) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const { id } = await params;
    const body = await req.json();
    const parsed = tagsSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const supabase = createAdminClient();

    const { error } = await supabase
      .from("applicants")
      .update({ talent_pool_tags: parsed.data.tags })
      .eq("id", id)
      .eq("is_talent_pool", true);

    if (error) return NextResponse.json({ error: "Failed to update tags" }, { status: 500 });

    return NextResponse.json({ message: "Tags updated" });
  } catch (error) {
    console.error("Tags POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
