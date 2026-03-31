import { auth } from "@/lib/auth";

type AdminSessionResult =
  | { ok: true; data: { session: { user: { id: string; email?: string | null; name?: string | null } } } }
  | { ok: false; error: string; status: number };

/**
 * Validates that the current user has the superadmin role.
 * Usage in admin API routes:
 * ```ts
 * const result = await getAdminSession();
 * if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
 * ```
 */
export async function getAdminSession(): Promise<AdminSessionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }
  if (session.user.role !== "superadmin") {
    return { ok: false, error: "Forbidden", status: 403 };
  }
  return { ok: true, data: { session } };
}
