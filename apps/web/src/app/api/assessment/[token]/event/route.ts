import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── POST: Record batched proctoring events server-side ───────────────────────
//
// The frontend batches tab-switch and copy-paste counts every 15 seconds
// (via navigator.sendBeacon) and POSTs incremental totals here.
// Storing counts server-side means the candidate cannot forge the proctoring
// report by manipulating the final submit payload.
//
// The submit route reads these server-stored values instead of trusting the
// client-submitted proctoringData field.

const eventSchema = z.object({
  // Incremental counts since last beacon — NOT cumulative totals.
  // Server accumulates them to build the final count.
  tabSwitches:        z.number().int().min(0).max(100).default(0),
  copyPasteAttempts:  z.number().int().min(0).max(100).default(0),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    const body = await req.json().catch(() => ({}));
    const parsed = eventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { tabSwitches, copyPasteAttempts } = parsed.data;

    // Nothing to record — early exit
    if (tabSwitches === 0 && copyPasteAttempts === 0) {
      return NextResponse.json({ ok: true });
    }

    const supabase = createAdminClient();

    // Fetch current submission — must be in-progress (started)
    const { data: submission } = await supabase
      .from("assessment_submissions")
      .select("id, status, proctoring_flags")
      .eq("id", token)
      .eq("status", "started")
      .single();

    if (!submission) {
      // Return 200 even for invalid tokens — sendBeacon ignores responses and we
      // don't want the candidate to see an error for a background beacon call.
      return NextResponse.json({ ok: true });
    }

    // ── Accumulate counts ─────────────────────────────────────────────────────
    // Read existing server-side counts, add the incremental delta from this beacon.
    const existing = (submission.proctoring_flags as {
      tabSwitches?: number;
      copyPasteAttempts?: number;
    } | null) ?? {};

    const updatedFlags = {
      ...existing,
      tabSwitches:        (existing.tabSwitches       ?? 0) + tabSwitches,
      copyPasteAttempts:  (existing.copyPasteAttempts ?? 0) + copyPasteAttempts,
    };

    await supabase
      .from("assessment_submissions")
      .update({ proctoring_flags: updatedFlags })
      .eq("id", token);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[assessment/event] error:", error);
    // Always return 200 — this is a fire-and-forget beacon endpoint.
    // Client errors here should never interrupt the candidate's test.
    return NextResponse.json({ ok: true });
  }
}
