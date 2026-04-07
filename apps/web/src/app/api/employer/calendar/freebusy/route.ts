import { NextResponse } from "next/server";
import { getEmployerSession } from "@/lib/employer-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFreeBusy, FreeBusyResult } from "@/lib/google-calendar";
import { z } from "zod";

const freeBusyBodySchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(10),
  timeMin: z.string().min(1), // ISO 8601
  timeMax: z.string().min(1), // ISO 8601
});

export async function POST(req: Request) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const { company } = result.data;
    const body = await req.json();
    const parsed = freeBusyBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { userIds, timeMin, timeMax } = parsed.data;
    const supabase = createAdminClient();

    // Verify all requested users are members of this company
    const { data: members } = await supabase
      .from("company_members")
      .select("user_id, users!company_members_user_id_fkey(id, email, full_name)")
      .eq("company_id", company.id)
      .eq("status", "active")
      .in("user_id", userIds);

    if (!members || members.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Build userId → email map from verified members only
    const userEmailMap = new Map<string, string>();
    for (const m of members) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const u = (m as any).users;
      if (u?.id && u?.email) userEmailMap.set(u.id as string, u.email as string);
    }

    // Fetch free/busy in parallel for each verified user
    const results: FreeBusyResult[] = await Promise.all(
      userIds
        .filter((id) => userEmailMap.has(id))
        .map((id) => getFreeBusy(id, userEmailMap.get(id)!, timeMin, timeMax)),
    );

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error("Free/busy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
