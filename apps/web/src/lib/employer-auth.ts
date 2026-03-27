import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Company,
  CompanyMember,
  CompanyMemberRole,
} from "@fitvector/shared";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmployerSessionData {
  session: { user: { id: string; email?: string | null; name?: string | null } };
  company: Company;
  membership: CompanyMember;
}

type EmployerSessionResult =
  | { ok: true; data: EmployerSessionData }
  | { ok: false; error: string; status: number };

// ─── snake_case → camelCase transformers ──────────────────────────────────────

function transformCompany(row: Record<string, unknown>): Company {
  return {
    id: row.id as string,
    name: row.name as string,
    logoUrl: (row.logo_url as string) || null,
    websiteUrl: (row.website_url as string) || null,
    industry: (row.industry as string) || null,
    companySize: (row.company_size as Company["companySize"]) || null,
    description: (row.description as string) || null,
    cultureKeywords: (row.culture_keywords as string[]) || [],
    locations: (row.locations as Company["locations"]) || [],
    branding: (row.branding as Company["branding"]) || {},
    createdBy: row.created_by as string,
    planTier: (row.plan_tier as Company["planTier"]) || "starter",
    planExpiry: (row.plan_expiry as string) || null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function transformMember(row: Record<string, unknown>): CompanyMember {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    userId: row.user_id as string,
    role: row.role as CompanyMemberRole,
    invitedBy: (row.invited_by as string) || null,
    inviteEmail: (row.invite_email as string) || null,
    status: row.status as CompanyMember["status"],
    invitedAt: row.invited_at as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ─── Main helper ──────────────────────────────────────────────────────────────

/**
 * Validates that the current user is an employer with an active company membership.
 * Returns the session, company, and membership data — or an error with HTTP status.
 *
 * Usage in API routes:
 * ```ts
 * const result = await getEmployerSession();
 * if (!result.ok) {
 *   return NextResponse.json({ error: result.error }, { status: result.status });
 * }
 * const { session, company, membership } = result.data;
 * ```
 */
export async function getEmployerSession(): Promise<EmployerSessionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  const supabase = createAdminClient();

  // Check user has 'employer' in user_type
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", session.user.id)
    .single();

  if (userError || !user) {
    return { ok: false, error: "User not found", status: 404 };
  }

  const userType: string[] = user.user_type || [];
  if (!userType.includes("employer")) {
    return { ok: false, error: "Not an employer account", status: 403 };
  }

  // Fetch active company membership with joined company data
  const { data: memberRow, error: memberError } = await supabase
    .from("company_members")
    .select(
      `
      id, company_id, user_id, role, invited_by, invite_email, status, invited_at, created_at, updated_at,
      companies (
        id, name, logo_url, website_url, industry, company_size, description,
        culture_keywords, locations, branding, created_by, plan_tier, plan_expiry,
        plan_payment_id, created_at, updated_at
      )
    `
    )
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .single();

  if (memberError || !memberRow) {
    return { ok: false, error: "No active company membership", status: 403 };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const companyRow = (memberRow as any).companies;
  if (!companyRow) {
    return { ok: false, error: "Company not found", status: 404 };
  }

  return {
    ok: true,
    data: {
      session,
      company: transformCompany(companyRow),
      membership: transformMember(memberRow),
    },
  };
}

// ─── Role check helper ───────────────────────────────────────────────────────

/**
 * Checks if the membership role is in the allowed list.
 * Returns true if authorized, false otherwise.
 */
export function requireRole(
  membership: CompanyMember,
  allowedRoles: CompanyMemberRole[]
): boolean {
  return allowedRoles.includes(membership.role);
}

// Re-export transformers for use in API routes
export { transformCompany, transformMember };
