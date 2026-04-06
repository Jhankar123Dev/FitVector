import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { pythonClient } from "@/lib/python-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLAN_LIMITS, hasQuota } from "@fitvector/shared";
import type { PlanTier } from "@fitvector/shared";
import type { DecisionLabel } from "@/types/job";

// ── Row mapper helpers ────────────────────────────────────────────────────────

type Company = { id: string; name: string; logo_url: string | null } | null;

function mapJobPost(row: {
  id: string; title: string; department: string | null; location: string | null;
  work_mode: string | null; job_type: string | null; description: string;
  required_skills: string[]; nice_to_have_skills: string[];
  salary_min: number | null; salary_max: number | null; salary_currency: string | null;
  application_deadline: string | null; openings_count: number | null;
  created_at: string; companies: Company | Company[];
}) {
  const co = Array.isArray(row.companies) ? row.companies[0] : row.companies;
  return {
    id: row.id,
    companyId: co?.id ?? null,
    title: row.title,
    companyName: co?.name ?? "Unknown Company",
    companyLogoUrl: co?.logo_url ?? null,
    location: row.location || "",
    workMode: row.work_mode || null,
    jobType: row.job_type || null,
    salaryMin: row.salary_min || null,
    salaryMax: row.salary_max || null,
    salaryCurrency: row.salary_currency || "INR",
    postedAt: row.created_at,
    sources: ["fitvector"] as string[],
    url: "",
    matchScore: null as number | null,
    matchBucket: null as string | null,
    decisionLabel: null as DecisionLabel | null,
    embeddingScore: null as number | null,
    deterministicScore: null as number | null,
    deterministicComponents: null as Record<string, unknown> | null,
    skillsRequired: row.required_skills || [],
    skillsNiceToHave: row.nice_to_have_skills || [],
    requiredExperienceYears: null as number | null,
    isEasyApply: true,
    isSaved: false,
    description: row.description || "",
    isDirect: true,
    jobPostId: row.id,
    applicationDeadline: row.application_deadline ?? null,
    openingsCount: row.openings_count ?? null,
  };
}

function mapDirectJob(row: {
  id: string; title: string; company_name: string; location: string | null;
  work_mode: string | null; job_type: string | null; description: string;
  skills_required: string[]; skills_nice_to_have: string[];
  salary_min: number | null; salary_max: number | null; salary_currency: string | null;
  url: string; posted_at: string | null; source: string;
}) {
  return {
    id: row.id,
    title: row.title,
    companyName: row.company_name,
    companyLogoUrl: null as string | null,
    location: row.location || "",
    workMode: row.work_mode || null,
    jobType: row.job_type || null,
    salaryMin: row.salary_min || null,
    salaryMax: row.salary_max || null,
    salaryCurrency: row.salary_currency || "INR",
    postedAt: row.posted_at,
    sources: [row.source || "direct"] as string[],
    url: row.url,
    matchScore: null as number | null,
    matchBucket: null as string | null,
    decisionLabel: null as DecisionLabel | null,
    embeddingScore: null as number | null,
    deterministicScore: null as number | null,
    deterministicComponents: null as Record<string, unknown> | null,
    skillsRequired: row.skills_required || [],
    skillsNiceToHave: row.skills_nice_to_have || [],
    requiredExperienceYears: null as number | null,
    isEasyApply: true,
    isSaved: false,
    description: row.description || "",
    isDirect: true,
  };
}

function mapScrapedJob(job: {
  title: string; company_name: string; location: string; url: string;
  description: string; source: string; salary_min: number | null;
  salary_max: number | null; posted_at: string | null; job_type: string | null;
  work_mode: string | null; skills_required: string[]; skills_nice_to_have: string[];
  required_experience_years: number | null;
}, idx: number) {
  const jobId = `job_${Buffer.from(
    `${job.title}|${job.company_name}|${job.source}`,
  ).toString("base64url").slice(0, 16)}_${idx}`;
  return {
    id: jobId,
    title: job.title,
    companyName: job.company_name,
    companyLogoUrl: null as string | null,
    location: job.location,
    workMode: job.work_mode || null,
    jobType: job.job_type || null,
    salaryMin: job.salary_min,
    salaryMax: job.salary_max,
    salaryCurrency: "INR",
    postedAt: job.posted_at,
    sources: [job.source] as string[],
    url: job.url,
    matchScore: null as number | null,
    matchBucket: null as string | null,
    decisionLabel: null as DecisionLabel | null,
    embeddingScore: null as number | null,
    deterministicScore: null as number | null,
    deterministicComponents: null as Record<string, unknown> | null,
    skillsRequired: job.skills_required,
    skillsNiceToHave: job.skills_nice_to_have || [],
    requiredExperienceYears: job.required_experience_years || null,
    isEasyApply: false,
    isSaved: false,
    description: job.description,
    isDirect: false,
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") || "";
    const location = searchParams.get("location") || "";
    const workMode = searchParams.get("workMode") || undefined;
    const jobType = searchParams.get("jobType") || undefined;
    const hoursOld = parseInt(searchParams.get("hoursOld") || "720", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const decisionLabelFilter = searchParams.get("decisionLabel") as DecisionLabel | null;
    const view = (searchParams.get("view") || "all") as "all" | "fitvector" | "external";

    if (!role) {
      return Response.json(
        { error: "Query parameter 'role' is required" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const userId = session.user.id;
    const planTier = (session.user.planTier || "free") as PlanTier;

    // ── Usage quota (only for searches that hit the Python scraper) ───────────
    let currentUsage = 0;
    if (view !== "fitvector") {
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase
        .from("usage_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("feature", "job_search")
        .gte("created_at", `${today}T00:00:00Z`);

      currentUsage = count || 0;
      if (!hasQuota(planTier, "job_search", currentUsage)) {
        return Response.json(
          {
            error: "Daily search limit reached. Upgrade your plan for more searches.",
            upgrade: true,
          },
          { status: 429 },
        );
      }
    }

    const roleKeywords = role.toLowerCase().split(/\s+/).filter(Boolean);

    // ── FitVector-posted jobs (job_posts table) ───────────────────────────────
    let fitvectorJobs: ReturnType<typeof mapJobPost>[] = [];
    if (view === "fitvector" || view === "all") {
      let jpQuery = supabase
        .from("job_posts")
        .select("id,title,department,location,work_mode,job_type,description,required_skills,nice_to_have_skills,salary_min,salary_max,salary_currency,application_deadline,openings_count,created_at,companies(id,name,logo_url)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(20);

      if (roleKeywords.length > 0) {
        const orFilters = roleKeywords.map((kw) => `title.ilike.%${kw}%`).join(",");
        jpQuery = jpQuery.or(orFilters);
      }
      if (location) jpQuery = jpQuery.ilike("location", `%${location}%`);
      if (workMode) jpQuery = jpQuery.eq("work_mode", workMode);
      if (jobType) jpQuery = jpQuery.eq("job_type", jobType);

      const { data: jpRows } = await jpQuery;
      fitvectorJobs = (jpRows || []).map(mapJobPost);
    }

    // ── Scraped direct-source jobs from jobs table (legacy / view=all only) ──
    let directJobs: ReturnType<typeof mapDirectJob>[] = [];
    if (view === "all") {
      let directQuery = supabase
        .from("jobs")
        .select("id,title,company_name,location,work_mode,job_type,description,skills_required,skills_nice_to_have,salary_min,salary_max,salary_currency,url,posted_at,source,posted_by_employer_id")
        .eq("source", "direct")
        .eq("is_active", true)
        .order("posted_at", { ascending: false })
        .limit(20);

      if (roleKeywords.length > 0) {
        const orFilters = roleKeywords.map((kw) => `title.ilike.%${kw}%`).join(",");
        directQuery = directQuery.or(orFilters);
      }
      if (location) directQuery = directQuery.ilike("location", `%${location}%`);
      if (workMode) directQuery = directQuery.eq("work_mode", workMode);
      if (jobType) directQuery = directQuery.eq("job_type", jobType);

      const { data: directRows } = await directQuery;
      directJobs = (directRows || []).map(mapDirectJob);
    }

    // ── Python scraping service (external view or all) ────────────────────────
    let scrapedJobs: ReturnType<typeof mapScrapedJob>[] = [];
    if (view === "external" || view === "all") {
      const jobsPerSearch = PLAN_LIMITS[planTier].jobs_per_search;
      const resultsWanted = jobsPerSearch === -1 ? 50 : jobsPerSearch;

      const scrapeResult = await pythonClient.post<{
        jobs: Array<{
          title: string;
          company_name: string;
          location: string;
          url: string;
          description: string;
          source: string;
          salary_min: number | null;
          salary_max: number | null;
          posted_at: string | null;
          job_type: string | null;
          work_mode: string | null;
          skills_required: string[];
          skills_nice_to_have: string[];
          required_experience_years: number | null;
          seniority: string | null;
          role_type: string | null;
        }>;
        total_found: number;
        scrape_time_ms: number;
        source_results: Record<string, number>;
      }>("/scrape/jobs", {
        role,
        location,
        sources: ["linkedin", "indeed", "zip_recruiter"],
        hours_old: hoursOld,
        results_wanted: resultsWanted,
        country: "India",
        job_type: jobType || null,
        is_remote: workMode === "remote",
      }, { timeout: 90000 });

      scrapedJobs = scrapeResult.jobs.map((job, idx) => mapScrapedJob(job, idx));

      // Log usage for scraper-backed searches
      await supabase.from("usage_logs").insert({
        user_id: userId,
        feature: "job_search",
        metadata: { role, location, view },
      });
    }

    // ── Merge & deduplicate ───────────────────────────────────────────────────
    // FitVector jobs first, then legacy direct, then scraped (dedup by title+company)
    const seenKeys = new Set<string>();
    const deduped = [...fitvectorJobs, ...directJobs].filter((j) => {
      const key = `${j.title.toLowerCase()}|${j.companyName.toLowerCase()}`;
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    });
    const dedupedScraped = scrapedJobs.filter((j) => {
      const key = `${j.title.toLowerCase()}|${j.companyName.toLowerCase()}`;
      return !seenKeys.has(key);
    });

    // Get user profile for match scoring
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("target_roles, skills, experience_level, parsed_resume_json")
      .eq("user_id", userId)
      .single();

    // Build user text for embedding
    const userSkills: string[] = userProfile?.skills || [];
    const userTargetRoles: string[] = userProfile?.target_roles || [];
    const userText = userSkills.length
      ? [
          userTargetRoles.length
            ? `Target roles: ${userTargetRoles.join(", ")}`
            : "",
          `Skills: ${userSkills.join(", ")}`,
          userProfile?.experience_level
            ? `Experience level: ${userProfile.experience_level}`
            : "",
        ]
          .filter(Boolean)
          .join("\n")
      : null;

    const jobs = [...deduped, ...dedupedScraped];

    // ── Match scoring ─────────────────────────────────────────────────────────
    // FitVector tab: pure JS deterministic scoring — zero network calls.
    // All/External tabs: blended scoring via Python (embedding + deterministic).
    if (userSkills.length > 0) {
      if (view === "fitvector") {
        // Local deterministic scoring — <1ms, no Python roundtrip.
        // Weights: required skills 60%, nice-to-have 20%, role keyword 20%.
        const userSkillsLower = new Set(userSkills.map((s) => s.toLowerCase()));
        const userRoleKeywords = (userTargetRoles[0] || "")
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean);

        // Cast to any[] to allow property mutation on the inferred union type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (jobs as any[]).forEach((job: Record<string, unknown>) => {
          const req = (job.skillsRequired as string[]).map((s) => s.toLowerCase());
          const nice = (job.skillsNiceToHave as string[]).map((s) => s.toLowerCase());

          const reqMatched = req.filter((s) => userSkillsLower.has(s));
          const niceMatched = nice.filter((s) => userSkillsLower.has(s));

          const reqRatio = req.length > 0 ? reqMatched.length / req.length : 0;
          const niceRatio = nice.length > 0 ? niceMatched.length / nice.length : 0;

          const jobTitleLower = (job.title as string).toLowerCase();
          const roleScore =
            userRoleKeywords.length > 0
              ? userRoleKeywords.filter((kw) => jobTitleLower.includes(kw)).length /
                userRoleKeywords.length
              : 0;

          const blended = reqRatio * 0.6 + niceRatio * 0.2 + roleScore * 0.2;
          const jobScore = Math.round(blended * 100);

          Object.assign(job, {
            matchScore: jobScore,
            deterministicScore: jobScore,
            matchBucket: jobScore >= 75 ? "strong" : jobScore >= 50 ? "good" : "weak",
            decisionLabel: (
              jobScore >= 75 ? "apply_now" : jobScore >= 50 ? "prepare_then_apply" : "explore"
            ) as DecisionLabel,
            deterministicComponents: {
              requiredSkillsMatch: {
                ratio: reqRatio,
                matched: reqMatched,
                missing: req.filter((s) => !userSkillsLower.has(s)),
                weight: 0.6,
              },
              optionalSkillsMatch: {
                ratio: niceRatio,
                matched: niceMatched,
                missing: nice.filter((s) => !userSkillsLower.has(s)),
                weight: 0.2,
              },
              roleAlignment: {
                score: roleScore,
                userRole: userTargetRoles[0] || "",
                jobRole: job.title as string,
                weight: 0.2,
              },
              experienceAlignment: { score: 0, userYears: 0, requiredYears: 0, shortfall: 0, weight: 0 },
            },
          });
        });
      } else {
        // External / All tabs: blended Python scoring (embedding + deterministic).
        const jobsToScore = jobs.slice(0, 25);
        try {
          const batchPayload = jobsToScore.map((job) => ({
            user_text: userText,
            job_text: `Job title: ${job.title}\nRequired skills: ${job.skillsRequired.join(", ")}\n${job.description.slice(0, 500)}`,
            user_skills: userSkills,
            job_required_skills: job.skillsRequired,
            job_nice_to_have_skills: job.skillsNiceToHave,
            user_role: userTargetRoles[0] || null,
            job_role: job.title,
            user_experience_years: null,
            job_required_experience_years: job.requiredExperienceYears,
          }));

          const batchResult = await pythonClient.post<{
            scores: Array<{
              match_score: number;
              match_bucket: string;
              decision_label: string;
              similarity_raw: number;
              embedding_score: number | null;
              deterministic_score: number | null;
              deterministic_components: {
                required_skills_match: { ratio: number; matched: string[]; missing: string[]; weight: number };
                optional_skills_match: { ratio: number; matched: string[]; missing: string[]; weight: number };
                role_alignment: { score: number; user_role: string; job_role: string; weight: number };
                experience_alignment: { score: number; user_years: number; required_years: number; shortfall: number; weight: number };
              } | null;
            }>;
          }>("/ai/match-scores", { jobs: batchPayload }, { timeout: 30000 });

          batchResult.scores.forEach((score, i) => {
            if (score && score.match_score > 0) {
              jobsToScore[i].matchScore = score.match_score;
              jobsToScore[i].matchBucket = score.match_bucket;
              jobsToScore[i].decisionLabel = score.decision_label as DecisionLabel;
              jobsToScore[i].embeddingScore = score.embedding_score;
              jobsToScore[i].deterministicScore = score.deterministic_score;
              if (score.deterministic_components) {
                const dc = score.deterministic_components;
                jobsToScore[i].deterministicComponents = {
                  requiredSkillsMatch: {
                    ratio: dc.required_skills_match.ratio,
                    matched: dc.required_skills_match.matched,
                    missing: dc.required_skills_match.missing,
                    weight: dc.required_skills_match.weight,
                  },
                  optionalSkillsMatch: {
                    ratio: dc.optional_skills_match.ratio,
                    matched: dc.optional_skills_match.matched,
                    missing: dc.optional_skills_match.missing,
                    weight: dc.optional_skills_match.weight,
                  },
                  roleAlignment: {
                    score: dc.role_alignment.score,
                    userRole: dc.role_alignment.user_role,
                    jobRole: dc.role_alignment.job_role,
                    weight: dc.role_alignment.weight,
                  },
                  experienceAlignment: {
                    score: dc.experience_alignment.score,
                    userYears: dc.experience_alignment.user_years,
                    requiredYears: dc.experience_alignment.required_years,
                    shortfall: dc.experience_alignment.shortfall,
                    weight: dc.experience_alignment.weight,
                  },
                };
              }
            }
          });
        } catch {
          // Scoring is best-effort — don't fail the search
        }
      }
    }

    // Sort: direct jobs first (pinned), then by match score descending
    jobs.sort((a, b) => {
      if (a.isDirect && !b.isDirect) return -1;
      if (!a.isDirect && b.isDirect) return 1;
      return (b.matchScore ?? -1) - (a.matchScore ?? -1);
    });

    // Filter by decision label if requested
    let filteredJobs = jobs;
    if (decisionLabelFilter) {
      filteredJobs = jobs.filter((j) => j.decisionLabel === decisionLabelFilter);
    }

    // Paginate
    const startIdx = (page - 1) * limit;
    const paginatedJobs = filteredJobs.slice(startIdx, startIdx + limit);

    const searchLimit = PLAN_LIMITS[planTier].job_search;

    return Response.json({
      data: {
        jobs: paginatedJobs,
        total: filteredJobs.length,
        page,
        limit,
        cached: false,
        cachedAt: null,
        view,
        // Only expose usage counter for scraper-backed views
        usage: view === "fitvector" ? null : {
          used: currentUsage + 1,
          limit: searchLimit === -1 ? Infinity : searchLimit,
          period: "daily" as const,
        },
      },
    });
  } catch (error) {
    console.error("Job search error:", error);
    return Response.json(
      { error: "Failed to search jobs. Please try again." },
      { status: 500 },
    );
  }
}
