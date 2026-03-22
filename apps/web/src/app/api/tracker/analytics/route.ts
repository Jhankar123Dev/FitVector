import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { pythonClient } from "@/lib/python-client";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const userId = session.user.id;

    // Get user skills
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("skills")
      .eq("user_id", userId)
      .single();

    const userSkills: string[] = profile?.skills || [];

    // Get all tracker jobs (any status except withdrawn)
    const { data: trackerEntries } = await supabase
      .from("applications")
      .select("job_id, status")
      .eq("user_id", userId)
      .neq("status", "withdrawn")
      .eq("is_archived", false);

    if (!trackerEntries || trackerEntries.length < 5) {
      return Response.json({
        data: {
          skillsToLearn: [],
          totalTracked: trackerEntries?.length || 0,
          minimumRequired: 5,
        },
      });
    }

    // Get job details for tracked jobs
    const jobIds = trackerEntries
      .map((e) => e.job_id)
      .filter((id): id is string => !!id);

    let trackerJobs: Array<{
      required_skills: string[];
      nice_to_have_skills: string[];
      decision_label: string;
    }> = [];

    if (jobIds.length > 0) {
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, skills_required, skills_nice_to_have, decision_label")
        .in("id", jobIds);

      if (jobs) {
        trackerJobs = jobs.map((job) => ({
          required_skills: job.skills_required || [],
          nice_to_have_skills: job.skills_nice_to_have || [],
          decision_label: job.decision_label || "explore",
        }));
      }
    }

    // Call Python service for skills analysis
    const result = await pythonClient.post<{
      skills_to_learn: Array<{
        skill: string;
        priority_score: number;
        required_in: number;
        nice_to_have_in: number;
        would_unlock: number;
        message: string;
      }>;
    }>("/ai/skills-to-learn", {
      user_id: userId,
      user_skills: userSkills,
      tracker_jobs: trackerJobs,
    });

    return Response.json({
      data: {
        skillsToLearn: result.skills_to_learn.map((s) => ({
          skill: s.skill,
          priorityScore: s.priority_score,
          requiredIn: s.required_in,
          niceToHaveIn: s.nice_to_have_in,
          wouldUnlock: s.would_unlock,
          message: s.message,
        })),
        totalTracked: trackerEntries.length,
        minimumRequired: 5,
      },
    });
  } catch (error) {
    console.error("Tracker analytics error:", error);
    return Response.json(
      { error: "Failed to compute analytics" },
      { status: 500 },
    );
  }
}
