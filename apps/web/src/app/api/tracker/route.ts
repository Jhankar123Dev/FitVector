import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasQuota, PLAN_LIMITS } from "@fitvector/shared";
import type { PlanTier } from "@fitvector/shared";
import { applicationSchema } from "@/lib/validators";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    let query = supabase
      .from("applications")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("is_archived", false)
      .order("position_order", { ascending: true });

    if (search) {
      query = query.or(`company_name.ilike.%${search}%,job_title.ilike.%${search}%`);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data: applications, error } = await query;

    if (error) {
      console.error("Tracker fetch error:", error);
      return Response.json({ error: "Failed to load applications" }, { status: 500 });
    }

    // ── Option B: read live status from fitvector_applications ──────
    // fitvector_app_id column exists after migration 20260403000001.
    // If the column is absent (migration not yet run), fitvector_app_id
    // will be undefined on every row, making fvAppIds empty — safe fallback.
    const fvAppIds = (applications || [])
      .map((a) => (a as Record<string, unknown>).fitvector_app_id as string | null)
      .filter((id): id is string => !!id);

    // Map: fitvector_applications.id → live status string
    const fvStatusMap: Record<string, string> = {};
    // Map: fitvector_applications.id → applicant_id (for interview link lookup)
    const fvApplicantIdMap: Record<string, string> = {};

    if (fvAppIds.length > 0) {
      const { data: fvApps } = await supabase
        .from("fitvector_applications")
        .select("id, status, applicant_id")
        .in("id", fvAppIds);

      for (const fv of fvApps || []) {
        fvStatusMap[fv.id] = fv.status;
        if (fv.applicant_id) fvApplicantIdMap[fv.id] = fv.applicant_id;
      }
    }

    // Fetch interview links for apps with interview_invited status
    const interviewInvitedApplicantIds = Object.entries(fvStatusMap)
      .filter(([, status]) => status === "interview_invited")
      .map(([fvId]) => fvApplicantIdMap[fvId])
      .filter(Boolean);

    const interviewLinkMap: Record<string, string> = {};
    if (interviewInvitedApplicantIds.length > 0) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
      const { data: interviews } = await supabase
        .from("ai_interviews")
        .select("id, applicant_id")
        .in("applicant_id", interviewInvitedApplicantIds)
        .in("status", ["invited", "started"]);
      for (const iv of interviews || []) {
        interviewLinkMap[iv.applicant_id] = `${baseUrl}/interview/${iv.id}`;
      }
    }

    const formatted = (applications || []).map((a) => {
      const row = a as Record<string, unknown>;
      const fvAppId = row.fitvector_app_id as string | null;
      const fitvectorStatus = fvAppId ? (fvStatusMap[fvAppId] ?? null) : null;
      const applicantId = fvAppId ? fvApplicantIdMap[fvAppId] : null;
      const interviewLink = applicantId ? (interviewLinkMap[applicantId] ?? null) : null;

      return {
        id: a.id,
        jobId: a.job_id,
        jobTitle: a.job_title,
        companyName: a.company_name,
        companyLogoUrl: a.company_logo_url,
        location: a.location,
        jobUrl: a.job_url,
        status: a.status,
        fitvectorStatus,
        interviewLink,
        statusHistory: a.status_history || [],
        notes: a.notes,
        nextFollowupDate: a.next_followup_date,
        positionOrder: a.position_order,
        contactName: a.contact_name,
        contactEmail: a.contact_email,
        contactRole: a.contact_role,
        tailoredResumeId: a.tailored_resume_id,
        appliedAt: a.applied_at,
        createdAt: a.created_at,
      };
    });

    return Response.json({ data: formatted });
  } catch (error) {
    console.error("Tracker error:", error);
    return Response.json({ error: "Failed to load tracker" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const planTier = (session.user.planTier || "free") as PlanTier;
    const supabase = createAdminClient();

    // Check active application limit
    const { count } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_archived", false);

    if (!hasQuota(planTier, "active_applications", count || 0)) {
      const limit = PLAN_LIMITS[planTier].active_applications;
      return Response.json({
        error: `Active application limit reached (${limit}). Upgrade for more.`,
        upgrade: true,
      }, { status: 429 });
    }

    const body = await req.json();
    const parsed = applicationSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("applications")
      .select("id")
      .eq("user_id", userId)
      .eq("job_title", parsed.data.jobTitle)
      .eq("company_name", parsed.data.companyName)
      .eq("is_archived", false)
      .single();

    if (existing) {
      return Response.json({ data: { id: existing.id, alreadyExists: true } });
    }

    const { data: app, error } = await supabase
      .from("applications")
      .insert({
        user_id: userId,
        job_id: parsed.data.jobId || null,
        job_title: parsed.data.jobTitle,
        company_name: parsed.data.companyName,
        company_logo_url: parsed.data.companyLogoUrl || null,
        location: parsed.data.location || null,
        job_url: parsed.data.jobUrl || null,
        status: parsed.data.status || "saved",
        notes: parsed.data.notes || null,
        position_order: (count || 0) + 1,
        status_history: [{ status: parsed.data.status || "saved", changed_at: new Date().toISOString() }],
      })
      .select("id")
      .single();

    if (error) {
      console.error("Create application error:", error);
      return Response.json({ error: "Failed to create application" }, { status: 500 });
    }

    return Response.json({ data: { id: app?.id, alreadyExists: false } }, { status: 201 });
  } catch (error) {
    console.error("Tracker POST error:", error);
    return Response.json({ error: "Failed to create application" }, { status: 500 });
  }
}
