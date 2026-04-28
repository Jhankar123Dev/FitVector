import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password } = body ?? {};

    if (typeof token !== "string" || !token.trim()) {
      return NextResponse.json({ error: "Missing reset token." }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // Hash the incoming raw token and look it up
    const tokenHash = createHash("sha256").update(token.trim()).digest("hex");

    const { data: record, error: lookupErr } = await supabase
      .from("password_reset_tokens")
      .select("id, user_id, expires_at, used_at")
      .eq("token_hash", tokenHash)
      .single();

    if (lookupErr || !record) {
      return NextResponse.json(
        { error: "This reset link is invalid or has already been used." },
        { status: 400 },
      );
    }

    if (record.used_at) {
      return NextResponse.json(
        { error: "This reset link has already been used. Please request a new one." },
        { status: 400 },
      );
    }

    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This reset link has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update user password and mark token as used in a transaction-like sequence
    const { error: updateErr } = await supabase
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("id", record.user_id);

    if (updateErr) {
      console.error("[reset-password] Failed to update password:", updateErr);
      return NextResponse.json(
        { error: "Failed to update password. Please try again." },
        { status: 500 },
      );
    }

    // Mark token as used
    await supabase
      .from("password_reset_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", record.id);

    return NextResponse.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("[reset-password] Error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
