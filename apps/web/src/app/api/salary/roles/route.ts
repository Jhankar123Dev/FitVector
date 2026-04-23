import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("get_salary_roles");

    if (error) return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });

    return NextResponse.json({ data: (data || []).map((r: { role_title: string }) => r.role_title) });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
