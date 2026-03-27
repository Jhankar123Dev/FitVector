import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── GET: Aggregated salary data ─────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createAdminClient();
    const url = new URL(req.url);
    const role = url.searchParams.get("role") || "";
    const location = url.searchParams.get("location") || "";
    const expMin = parseInt(url.searchParams.get("expMin") || "0", 10);
    const expMax = parseInt(url.searchParams.get("expMax") || "99", 10);

    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    // Try using the DB function first
    try {
      const { data: aggregation, error: rpcError } = await supabase.rpc("get_salary_aggregation", {
        p_role: role,
        p_location: location || null,
        p_exp_min: expMin,
        p_exp_max: expMax,
      });

      if (!rpcError && aggregation) {
        const result = Array.isArray(aggregation) ? aggregation[0] : aggregation;
        if (result && result.sample_size >= 10) {
          return NextResponse.json({
            data: {
              role,
              location: location || "All Locations",
              sampleSize: result.sample_size,
              median: result.median_salary,
              p25: result.p25_salary,
              p75: result.p75_salary,
              min: result.min_salary,
              max: result.max_salary,
              insufficientData: false,
            },
          });
        } else if (result && result.sample_size > 0 && result.sample_size < 10) {
          return NextResponse.json({
            data: {
              role,
              location: location || "All Locations",
              sampleSize: result.sample_size,
              insufficientData: true,
              message: `Only ${result.sample_size} reports available. Need at least 10 for reliable insights.`,
            },
          });
        }
      }
    } catch {
      // RPC function might not exist — fall through to manual query
    }

    // Fallback: manual aggregation
    let query = supabase
      .from("salary_reports")
      .select("base_salary, total_compensation")
      .ilike("role_title", `%${role}%`)
      .gte("experience_years", expMin)
      .lte("experience_years", expMax);

    if (location) {
      query = query.ilike("location", `%${location}%`);
    }

    const { data: reports } = await query;

    if (!reports || reports.length === 0) {
      return NextResponse.json({
        data: {
          role,
          location: location || "All Locations",
          sampleSize: 0,
          insufficientData: true,
          message: "No salary data available for this combination.",
        },
      });
    }

    if (reports.length < 10) {
      return NextResponse.json({
        data: {
          role,
          location: location || "All Locations",
          sampleSize: reports.length,
          insufficientData: true,
          message: `Only ${reports.length} reports available. Need at least 10 for reliable insights.`,
        },
      });
    }

    // Compute aggregates manually
    const salaries = reports.map((r) => r.total_compensation || r.base_salary).sort((a, b) => a - b);
    const n = salaries.length;

    return NextResponse.json({
      data: {
        role,
        location: location || "All Locations",
        sampleSize: n,
        median: salaries[Math.floor(n / 2)],
        p25: salaries[Math.floor(n * 0.25)],
        p75: salaries[Math.floor(n * 0.75)],
        min: salaries[0],
        max: salaries[n - 1],
        insufficientData: false,
      },
    });
  } catch (error) {
    console.error("Salary insights GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
