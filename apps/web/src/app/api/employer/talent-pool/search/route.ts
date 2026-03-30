import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployerSession } from "@/lib/employer-auth";

// ── Request validation ──────────────────────────────────────────────

const searchSchema = z.object({
  jobPostId: z.string().uuid(),
  maxCandidates: z.number().int().min(1).max(100).optional().default(20),
  lastActiveAfter: z.string().datetime().optional(),
  skills: z.array(z.string()).optional(),
  location: z.string().optional(),
});

// ── Cache TTL ───────────────────────────────────────────────────────

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// ── POST handler ────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { company } = result.data;
    const body = await req.json();

    const parsed = searchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { jobPostId, maxCandidates, lastActiveAfter, skills, location } = parsed.data;
    const supabase = createAdminClient();

    // ── Verify job post belongs to company ───────────────────────────

    const { data: jobPost, error: jobPostError } = await supabase
      .from("job_posts")
      .select("id, company_id, title, required_skills")
      .eq("id", jobPostId)
      .eq("company_id", company.id)
      .single();

    if (jobPostError || !jobPost) {
      return NextResponse.json({ error: "Job post not found" }, { status: 404 });
    }

    // ── Check cache ─────────────────────────────────────────────────

    const cacheThreshold = new Date(Date.now() - CACHE_TTL_MS).toISOString();

    const { data: cacheRow } = await supabase
      .from("talent_pool_cache")
      .select("*")
      .eq("company_id", company.id)
      .eq("job_post_id", jobPostId)
      .gte("cached_at", cacheThreshold)
      .single();

    if (cacheRow) {
      return NextResponse.json({
        data: cacheRow.results,
        cached: true,
        cachedAt: cacheRow.cached_at,
      });
    }

    // ── Build candidate query ───────────────────────────────────────

    const jobSkills: string[] = skills && skills.length > 0
      ? skills
      : (jobPost.required_skills as string[]) || [];

    // Base query: talent pool candidates from applicants + user_profiles
    let query = supabase
      .from("applicants")
      .select(`
        id,
        job_post_id,
        user_id,
        name,
        email,
        phone,
        resume_url,
        resume_parsed_json,
        screening_score,
        bucket,
        is_talent_pool,
        talent_pool_tags,
        created_at,
        updated_at,
        user_profiles!inner (
          user_id,
          skills,
          preferred_work_mode,
          target_locations
        )
      `)
      .eq("is_talent_pool", true)
      .order("screening_score", { ascending: false, nullsFirst: false })
      .limit(maxCandidates);

    // Filter by skills overlap if we have skills to match
    if (jobSkills.length > 0) {
      query = query.overlaps("user_profiles.skills", jobSkills);
    }

    // Filter by location
    if (location && location.trim()) {
      query = query.contains("user_profiles.target_locations", [location.trim()]);
    }

    // Filter by last active
    if (lastActiveAfter) {
      query = query.gte("updated_at", lastActiveAfter);
    }

    const { data: rows, error: queryError } = await query;

    if (queryError) {
      console.error("Talent pool search query error:", queryError);
      // Fallback: query without the join filter if the join fails
      // This handles cases where user_profiles may not exist for all applicants
      const fallbackQuery = supabase
        .from("applicants")
        .select("*")
        .eq("is_talent_pool", true)
        .order("screening_score", { ascending: false, nullsFirst: false })
        .limit(maxCandidates);

      if (lastActiveAfter) {
        fallbackQuery.gte("updated_at", lastActiveAfter);
      }

      const { data: fallbackRows, error: fallbackError } = await fallbackQuery;

      if (fallbackError) {
        console.error("Talent pool search fallback error:", fallbackError);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
      }

      const candidates = mapCandidates(fallbackRows || [], jobSkills);
      await upsertCache(supabase, company.id, jobPostId, candidates, {
        skills: jobSkills,
        location,
        lastActiveAfter,
        maxCandidates,
      });

      return NextResponse.json({ data: candidates, cached: false });
    }

    const candidates = mapCandidates(rows || [], jobSkills);

    // ── Upsert cache ────────────────────────────────────────────────

    await upsertCache(supabase, company.id, jobPostId, candidates, {
      skills: jobSkills,
      location,
      lastActiveAfter,
      maxCandidates,
    });

    return NextResponse.json({ data: candidates, cached: false });
  } catch (error) {
    console.error("Talent pool search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── Helpers ─────────────────────────────────────────────────────────

function mapCandidates(
  rows: Record<string, unknown>[],
  jobSkills: string[],
) {
  const jobSkillsLower = jobSkills.map((s) => s.toLowerCase());

  return rows.map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = (row as any).user_profiles;
    const resumeSkills =
      ((row.resume_parsed_json as Record<string, unknown>)?.skills as string[]) || [];
    const profileSkills = (profile?.skills as string[]) || [];
    const allSkills = Array.from(new Set([...profileSkills, ...resumeSkills]));

    const matchingSkills = allSkills.filter((s) =>
      jobSkillsLower.includes(s.toLowerCase()),
    );

    return {
      id: row.id as string,
      name: row.name as string,
      email: row.email as string,
      phone: (row.phone as string) || null,
      skills: allSkills,
      matchingSkills,
      matchScore: jobSkillsLower.length > 0
        ? Math.round((matchingSkills.length / jobSkillsLower.length) * 100)
        : 0,
      screeningScore: (row.screening_score as number) || 0,
      bucket: (row.bucket as string) || null,
      tags: (row.talent_pool_tags as string[]) || [],
      resumeUrl: (row.resume_url as string) || null,
      location: profile?.target_locations?.[0] || null,
      workMode: profile?.preferred_work_mode || null,
      updatedAt: row.updated_at as string,
    };
  });
}

async function upsertCache(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  companyId: string,
  jobPostId: string,
  results: unknown[],
  filters: Record<string, unknown>,
) {
  try {
    await supabase.from("talent_pool_cache").upsert(
      {
        company_id: companyId,
        job_post_id: jobPostId,
        results,
        filters,
        cached_at: new Date().toISOString(),
      },
      { onConflict: "company_id,job_post_id" },
    );
  } catch (err) {
    // Cache failures are non-critical; log and continue
    console.error("Failed to upsert talent pool cache:", err);
  }
}
