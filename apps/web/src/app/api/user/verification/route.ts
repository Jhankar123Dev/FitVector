import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VerificationCategory, VerificationItem } from "@/types/marketplace";

// ── Static metadata for each category ────────────────────────────────────────

const CATEGORY_META: Record<
  VerificationCategory,
  { label: string; description: string }
> = {
  identity: {
    label: "Identity Verification",
    description: "Verify your identity with Aadhaar or PAN card",
  },
  education: {
    label: "Education Verification",
    description: "Upload your degree certificate for validation",
  },
  employment: {
    label: "Employment Verification",
    description: "Verify current or last employment with offer letter",
  },
  skills: {
    label: "Skills Verification",
    description: "Pass a FitVector AI assessment to verify your technical skills",
  },
};

const CATEGORY_ORDER: VerificationCategory[] = [
  "identity",
  "education",
  "employment",
  "skills",
];

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: rows, error } = await supabase
      .from("profile_verifications")
      .select("id, category, status, document_name, verified_at, expires_at")
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Verification GET error:", error);
      return NextResponse.json({ error: "Failed to fetch verifications" }, { status: 500 });
    }

    // Build a map of category → DB row
    const rowMap = new Map(
      (rows ?? []).map((r) => [
        r.category as VerificationCategory,
        r as {
          id: string;
          category: string;
          status: string;
          document_name: string | null;
          verified_at: string | null;
          expires_at: string | null;
        },
      ]),
    );

    // Always return exactly 4 items in a fixed order; fill gaps with "not_started" defaults
    const items: VerificationItem[] = CATEGORY_ORDER.map((category) => {
      const meta = CATEGORY_META[category];
      const row = rowMap.get(category);

      if (!row) {
        return {
          id: `default-${category}`,
          category,
          label: meta.label,
          description: meta.description,
          status: "not_started",
        };
      }

      return {
        id: row.id,
        category,
        label: meta.label,
        description: meta.description,
        status: row.status as VerificationItem["status"],
        documentName: row.document_name ?? undefined,
        verifiedAt: row.verified_at ?? undefined,
        expiresAt: row.expires_at ?? undefined,
      };
    });

    return NextResponse.json({ data: items });
  } catch (err) {
    console.error("Verification GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
