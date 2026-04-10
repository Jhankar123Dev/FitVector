import { auth } from "@/lib/auth";

export interface SeekerSessionData {
  user: {
    id: string;
    email: string | null;
    full_name: string | null;
  };
}

type SeekerSessionResult =
  | { ok: true; data: SeekerSessionData }
  | { ok: false; error: string; status: number };

/**
 * Validates that the current request is from an authenticated seeker (or superadmin).
 * Returns the user id and basic info — or an error with HTTP status.
 *
 * Usage in API routes:
 * ```ts
 * const result = await getSeekerSession();
 * if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
 * const { user } = result.data;
 * ```
 */
export async function getSeekerSession(): Promise<SeekerSessionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  if (session.user.role !== "seeker" && session.user.role !== "superadmin") {
    return { ok: false, error: "Not a seeker account", status: 403 };
  }

  return {
    ok: true,
    data: {
      user: {
        id:        session.user.id,
        email:     session.user.email ?? null,
        full_name: session.user.name  ?? null,
      },
    },
  };
}
