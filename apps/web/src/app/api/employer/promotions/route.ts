import { NextResponse } from "next/server";
import { getEmployerSession } from "@/lib/employer-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  PromotedListing,
  PromotionType,
  PromotionStatus,
  PromotionDuration,
} from "@/types/employer";

export async function GET() {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { company } = result.data;
    const supabase = createAdminClient();

    const { data: rows, error } = await supabase
      .from("job_promotions")
      .select("*")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Promotions GET error:", error);
      return NextResponse.json({ error: "Failed to fetch promotions" }, { status: 500 });
    }

    const promotions: PromotedListing[] = (rows ?? []).map((row) => ({
      id: row.id as string,
      jobPostId: row.job_post_id as string,
      jobTitle: row.job_title as string,
      promotionType: row.promotion_type as PromotionType,
      duration: row.duration as PromotionDuration,
      startDate: row.start_date as string,
      endDate: row.end_date as string,
      amountPaid: row.amount_paid as number,
      currency: row.currency as string,
      impressions: row.impressions as number,
      clicks: row.clicks as number,
      applications: row.applications as number,
      status: row.status as PromotionStatus,
    }));

    return NextResponse.json({ data: promotions });
  } catch (err) {
    console.error("Promotions GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
