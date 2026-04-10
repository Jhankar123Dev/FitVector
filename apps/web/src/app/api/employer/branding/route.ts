import { NextResponse } from "next/server";
import { getEmployerSession, requireRole } from "@/lib/employer-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CompanyBrandingData } from "@fitvector/shared";
import type { CompanyBranding } from "@/types/employer";

// ── Transformers ─────────────────────────────────────────────────────────────

/** DB (snake_case JSONB) → frontend (camelCase) */
function toBranding(raw: CompanyBrandingData): CompanyBranding {
  return {
    bannerUrl: raw.banner_url ?? null,
    story: raw.story ?? "",
    teamPhotos: (raw.team_photos ?? []).map((p) => ({
      id: p.id,
      url: p.url,
      caption: p.caption,
      initials: p.initials,
    })),
    benefits: raw.benefits ?? [],
    cultureValues: (raw.culture_values ?? []).map((v) => ({
      title: v.title,
      description: v.description,
      icon: v.icon,
    })),
    dayInTheLife: (raw.day_in_the_life ?? []).map((d) => ({
      jobPostId: d.job_post_id,
      jobTitle: d.job_title,
      description: d.description,
    })),
    // These stats are not yet tracked in the DB; return zeros as placeholders.
    profileViews: 0,
    followers: 0,
    applicationRate: 0,
  };
}

/** Frontend (camelCase) → DB (snake_case JSONB) */
function fromBranding(b: CompanyBranding): CompanyBrandingData {
  return {
    banner_url: b.bannerUrl ?? undefined,
    story: b.story,
    team_photos: b.teamPhotos,
    benefits: b.benefits,
    culture_values: b.cultureValues,
    day_in_the_life: b.dayInTheLife.map((d) => ({
      job_post_id: d.jobPostId,
      job_title: d.jobTitle,
      description: d.description,
    })),
  };
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { company } = result.data;
    return NextResponse.json({ data: toBranding(company.branding) });
  } catch (err) {
    console.error("Branding GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── PUT ───────────────────────────────────────────────────────────────────────

export async function PUT(req: Request) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { company, membership } = result.data;

    // Admins and recruiters may update branding
    if (!requireRole(membership, ["admin", "recruiter"])) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body: CompanyBranding = await req.json();
    const brandingData = fromBranding(body);

    const supabase = createAdminClient();
    const { data: updated, error } = await supabase
      .from("companies")
      .update({ branding: brandingData })
      .eq("id", company.id)
      .select("branding")
      .single();

    if (error || !updated) {
      console.error("Branding PUT error:", error);
      return NextResponse.json({ error: "Failed to update branding" }, { status: 500 });
    }

    return NextResponse.json({
      data: toBranding(updated.branding as CompanyBrandingData),
      message: "Branding updated successfully",
    });
  } catch (err) {
    console.error("Branding PUT error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
