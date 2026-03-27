import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const salaryReportSchema = z.object({
  roleTitle: z.string().min(2).max(200),
  companyName: z.string().min(1).max(200),
  location: z.string().min(1).max(200),
  companySize: z.string().optional(),
  experienceYears: z.number().int().min(0).max(50),
  baseSalary: z.number().int().min(0),
  totalCompensation: z.number().int().min(0),
  currency: z.string().default("INR"),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = salaryReportSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

    const supabase = createAdminClient();
    const d = parsed.data;

    const { data: row, error } = await supabase
      .from("salary_reports")
      .insert({
        user_id: session.user.id,
        role_title: d.roleTitle,
        company_name: d.companyName,
        location: d.location,
        company_size: d.companySize || null,
        experience_years: d.experienceYears,
        base_salary: d.baseSalary,
        total_compensation: d.totalCompensation,
        currency: d.currency,
      })
      .select("id")
      .single();

    if (error || !row) {
      console.error("Salary report error:", error);
      return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
    }

    return NextResponse.json({ data: { id: row.id }, message: "Salary report submitted" }, { status: 201 });
  } catch (error) {
    console.error("Salary report POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
