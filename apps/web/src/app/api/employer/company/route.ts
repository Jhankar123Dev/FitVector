import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getEmployerSession,
  requireRole,
  transformCompany,
} from "@/lib/employer-auth";
import { createCompanySchema, updateCompanySchema } from "@/lib/validators";

// ─── POST: Create a new company ──────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createCompanySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check user doesn't already belong to an active company
    const { data: existingMembership } = await supabase
      .from("company_members")
      .select("id")
      .eq("user_id", session.user.id)
      .in("status", ["active", "invited"])
      .limit(1)
      .single();

    if (existingMembership) {
      return NextResponse.json(
        { error: "You already belong to a company" },
        { status: 409 }
      );
    }

    // 1. Create the company
    const { data: companyRow, error: companyError } = await supabase
      .from("companies")
      .insert({
        name: parsed.data.name,
        logo_url: parsed.data.logoUrl || null,
        website_url: parsed.data.websiteUrl || null,
        industry: parsed.data.industry,
        company_size: parsed.data.companySize,
        description: parsed.data.description,
        culture_keywords: parsed.data.cultureKeywords,
        locations: parsed.data.locations,
        created_by: session.user.id,
      })
      .select("*")
      .single();

    if (companyError || !companyRow) {
      console.error("Company create error:", companyError);
      return NextResponse.json(
        { error: "Failed to create company" },
        { status: 500 }
      );
    }

    // 2. Create admin membership for the creator
    const { error: memberError } = await supabase
      .from("company_members")
      .insert({
        company_id: companyRow.id,
        user_id: session.user.id,
        role: "admin",
        status: "active",
        invited_by: session.user.id,
      });

    if (memberError) {
      console.error("Membership create error:", memberError);
      // Rollback: delete the company
      await supabase.from("companies").delete().eq("id", companyRow.id);
      return NextResponse.json(
        { error: "Failed to create membership" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: { company: transformCompany(companyRow) },
        message: "Company created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Company POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── GET: Get current user's company ─────────────────────────────────────────

export async function GET() {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const { company, membership } = result.data;

    return NextResponse.json({
      data: { company, membership },
    });
  } catch (error) {
    console.error("Company GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── PUT: Update company profile ─────────────────────────────────────────────

export async function PUT(req: Request) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const { company, membership } = result.data;

    // Only admins can update company profile
    if (!requireRole(membership, ["admin"])) {
      return NextResponse.json(
        { error: "Only admins can update company profile" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = updateCompanySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Build snake_case update object
    const update: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) update.name = parsed.data.name;
    if (parsed.data.logoUrl !== undefined) update.logo_url = parsed.data.logoUrl;
    if (parsed.data.websiteUrl !== undefined) update.website_url = parsed.data.websiteUrl;
    if (parsed.data.industry !== undefined) update.industry = parsed.data.industry;
    if (parsed.data.companySize !== undefined) update.company_size = parsed.data.companySize;
    if (parsed.data.description !== undefined) update.description = parsed.data.description;
    if (parsed.data.cultureKeywords !== undefined)
      update.culture_keywords = parsed.data.cultureKeywords;
    if (parsed.data.locations !== undefined) update.locations = parsed.data.locations;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ data: { company }, message: "No changes" });
    }

    const { data: updatedRow, error: updateError } = await supabase
      .from("companies")
      .update(update)
      .eq("id", company.id)
      .select("*")
      .single();

    if (updateError || !updatedRow) {
      console.error("Company update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update company" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: { company: transformCompany(updatedRow) },
      message: "Company updated successfully",
    });
  } catch (error) {
    console.error("Company PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
