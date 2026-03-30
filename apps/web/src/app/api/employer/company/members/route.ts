import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getEmployerSession,
  requireRole,
  transformMember,
} from "@/lib/employer-auth";
import { inviteMemberSchema } from "@/lib/validators";

// ─── GET: List company members ───────────────────────────────────────────────

export async function GET() {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const { company } = result.data;
    const supabase = createAdminClient();

    // Fetch members with joined user data
    const { data: rows, error } = await supabase
      .from("company_members")
      .select(
        `
        id, company_id, user_id, role, invited_by, invite_email, status, invited_at, created_at, updated_at,
        users (
          full_name, email, avatar_url
        )
      `
      )
      .eq("company_id", company.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Members fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 }
      );
    }

    const members = (rows || []).map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userInfo = (row as any).users;
      return {
        ...transformMember(row),
        userName: userInfo?.full_name || null,
        userEmail: userInfo?.email || row.invite_email || "",
        userAvatarUrl: userInfo?.avatar_url || null,
      };
    });

    return NextResponse.json({ data: members });
  } catch (error) {
    console.error("Members GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── POST: Invite a new team member ──────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const result = await getEmployerSession();
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const { company, membership, session } = result.data;

    // Only admins can invite
    if (!requireRole(membership, ["admin"])) {
      return NextResponse.json(
        { error: "Only admins can invite team members" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = inviteMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Look up user by email (user_id is NOT NULL in schema)
    const { data: invitee } = await supabase
      .from("users")
      .select("id")
      .eq("email", parsed.data.email)
      .single();

    if (!invitee) {
      return NextResponse.json(
        {
          error:
            "User not found. They need to create an account first before being invited.",
        },
        { status: 404 }
      );
    }

    // Check no existing active/invited membership for this user+company
    const { data: existing } = await supabase
      .from("company_members")
      .select("id, status")
      .eq("company_id", company.id)
      .eq("user_id", invitee.id)
      .single();

    if (existing) {
      if (existing.status === "deactivated") {
        // Reactivate the existing membership
        const { data: reactivated, error: reactivateError } = await supabase
          .from("company_members")
          .update({
            status: "invited",
            role: parsed.data.role,
            invited_by: session.user.id,
            invite_email: parsed.data.email,
            invited_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select("*")
          .single();

        if (reactivateError || !reactivated) {
          return NextResponse.json(
            { error: "Failed to reactivate member" },
            { status: 500 }
          );
        }

        console.log(`[Invite] Re-invited ${parsed.data.email} to ${company.name} as ${parsed.data.role}`);

        return NextResponse.json({
          data: transformMember(reactivated),
          message: "Member re-invited successfully",
        });
      }

      return NextResponse.json(
        { error: "This user is already a member of your company" },
        { status: 409 }
      );
    }

    // Create new membership
    const { data: newMember, error: insertError } = await supabase
      .from("company_members")
      .insert({
        company_id: company.id,
        user_id: invitee.id,
        role: parsed.data.role,
        status: "invited",
        invited_by: session.user.id,
        invite_email: parsed.data.email,
      })
      .select("*")
      .single();

    if (insertError || !newMember) {
      console.error("Member invite error:", insertError);
      return NextResponse.json(
        { error: "Failed to invite member" },
        { status: 500 }
      );
    }

    // Ensure invited user has employer role (they must have signed up as employer)
    // If they're a seeker, the invite stays but they can't use employer features
    // until they create a separate employer account

    console.log(`[Invite] Invited ${parsed.data.email} to ${company.name} as ${parsed.data.role}`);

    return NextResponse.json(
      {
        data: transformMember(newMember),
        message: "Member invited successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Members POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
