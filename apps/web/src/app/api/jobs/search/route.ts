import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { pythonClient } from "@/lib/python-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLAN_LIMITS, hasQuota } from "@fitvector/shared";
import type { PlanTier } from "@fitvector/shared";
import type { DecisionLabel } from "@/types/job";

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
    const hoursOld = parseInt(searchParams.get("hoursOld") || "72", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const decisionLabelFilter = searchParams.get("decisionLabel") as DecisionLabel | null;

    if (!role) {
      return Response.json(
        { error: "Query parameter 'role' is required" },
        { status: 400 },
      );
    }

    // Check usage limits
    const supabase = createAdminClient();
    const userId = session.user.id;
    const planTier = (session.user.planTier || "free") as PlanTier;

    const today = new Date().toISOString().split("T")[0];
    const { count } = await supabase
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("feature", "job_search")
      .gte("created_at", `${today}T00:00:00Z`);

    const currentUsage = count || 0;
    if (!hasQuota(planTier, "job_search", currentUsage)) {
      return Response.json(
        {
          error: "Daily search limit reached. Upgrade your plan for more searches.",
          upgrade: true,
        },
        { status: 429 },
      );
    }

    // Call Python scraping service
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
      }>;
      total_found: number;
      scrape_time_ms: number;
      source_results: Record<string, number>;
    }>("/scrape/jobs", {
      role,
      location,
      sources: ["indeed", "linkedin", "google", "naukri", "glassdoor"],
      hours_old: hoursOld,
      results_wanted: resultsWanted,
      country: "India",
      job_type: jobType || null,
      is_remote: workMode === "remote",
    }, { timeout: 60000 });

    // Log usage
    await supabase.from("usage_logs").insert({
      user_id: userId,
      feature: "job_search",
      metadata: { role, location },
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

    // Transform jobs
    const jobs = scrapeResult.jobs.map((job, idx) => {
      const jobId = `job_${Buffer.from(
        `${job.title}|${job.company_name}|${job.source}`,
      ).toString("base64url").slice(0, 16)}_${idx}`;

      return {
        id: jobId,
        title: job.title,
        companyName: job.company_name,
        companyLogoUrl: null,
        location: job.location,
        workMode: job.work_mode || (workMode || null),
        jobType: job.job_type || jobType || null,
        salaryMin: job.salary_min,
        salaryMax: job.salary_max,
        salaryCurrency: "INR",
        postedAt: job.posted_at,
        sources: [job.source],
        url: job.url,
        matchScore: null as number | null,
        matchBucket: null as string | null,
        decisionLabel: null as DecisionLabel | null,
        embeddingScore: null as number | null,
        deterministicScore: null as number | null,
        deterministicComponents: null as Record<string, unknown> | null,
        skillsRequired: job.skills_required,
        skillsNiceToHave: [] as string[],
        isEasyApply: false,
        isSaved: false,
        description: job.description,
      };
    });

    // Score jobs using blended scoring (all plan tiers get deterministic scoring)
    if (userSkills.length > 0) {
      const jobsToScore = jobs.slice(0, 25);
      try {
        const scorePromises = jobsToScore.map((job) =>
          pythonClient
            .post<{
              match_score: number;
              match_bucket: string;
              decision_label: string;
              similarity_raw: number;
              embedding_score: number | null;
              deterministic_score: number | null;
              deterministic_components: {
                required_skills_match: {
                  ratio: number;
                  matched: string[];
                  missing: string[];
                  weight: number;
                };
                optional_skills_match: {
                  ratio: number;
                  matched: string[];
                  missing: string[];
                  weight: number;
                };
                role_alignment: {
                  score: number;
                  user_role: string;
                  job_role: string;
                  weight: number;
                };
                experience_alignment: {
                  score: number;
                  user_years: number;
                  required_years: number;
                  shortfall: number;
                  weight: number;
                };
              } | null;
            }>("/ai/match-score", {
              user_text: userText,
              job_text: `Job title: ${job.title}\nRequired skills: ${job.skillsRequired.join(", ")}\n${job.description.slice(0, 500)}`,
              user_skills: userSkills,
              job_required_skills: job.skillsRequired,
              job_nice_to_have_skills: [],
              user_role: userTargetRoles[0] || null,
              job_role: job.title,
              user_experience_years: null,
              job_required_experience_years: null,
            }, { timeout: 15000 })
            .catch(() => null),
        );

        const scores = await Promise.all(scorePromises);
        scores.forEach((score, i) => {
          if (score) {
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

    // Sort by match score descending
    jobs.sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1));

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
        usage: {
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
